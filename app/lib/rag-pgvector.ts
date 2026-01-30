/**
 * pgvector 기반 RAG 시스템
 * Supabase pgvector를 활용한 벡터 검색 + 문서 생성
 *
 * 기존 Gemini File Search API와 병행 운영 가능
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Database } from '@/types/database';
import type {
  ChunkMetadata,
  ChunkingConfig,
  EmbeddingConfig,
  EmbeddingResult,
  VectorSearchRequest,
  VectorSearchResult,
  VectorSearchResponse,
  RAGGenerateRequest,
  RAGGenerateResponse,
  IndexDocumentResult,
  IndexingProgress,
} from '@/types/pgvector-rag';

// ============================================
// 클라이언트 초기화 (Lazy Initialization)
// ============================================

let _supabase: SupabaseClient<Database> | null = null;
let _openai: OpenAI | null = null;
let _genAI: GoogleGenerativeAI | null = null;

function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
    }
    _supabase = createClient<Database>(url, key);
  }
  return _supabase;
}

function getOpenAI() {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

function getGenAI() {
  if (!_genAI) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY가 설정되지 않았습니다.');
    }
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
}

// ============================================
// 토큰 카운터 (간단한 구현)
// ============================================

/**
 * 간단한 토큰 카운터 (GPT tokenizer 근사치)
 * 실제 프로덕션에서는 tiktoken 사용 권장
 */
function countTokens(text: string): number {
  // 영어: ~4글자 = 1토큰, 한글: ~2글자 = 1토큰 (근사치)
  const koreanChars = (text.match(/[가-힣]/g) || []).length;
  const otherChars = text.length - koreanChars;
  return Math.ceil(koreanChars / 2 + otherChars / 4);
}

// ============================================
// 청크 분할
// ============================================

const DEFAULT_CHUNK_CONFIG: ChunkingConfig = {
  maxTokens: 512,
  overlapTokens: 50,
  preserveParagraphs: true,
  splitByProblems: true,
};

/**
 * 텍스트를 청크로 분할
 */
export function splitIntoChunks(
  text: string,
  config: ChunkingConfig = DEFAULT_CHUNK_CONFIG
): string[] {
  const chunks: string[] = [];

  // 1. 문제 단위 분할 시도 (교육 콘텐츠)
  if (config.splitByProblems) {
    const problemPattern = /(?:^|\n)(?:\d+[\.\)]\s*|문제\s*\d+|Q\d+|【\d+】)/gm;
    const problemSplits = text.split(problemPattern).filter(s => s.trim());

    if (problemSplits.length > 1) {
      // 문제별로 분할된 경우
      for (const problemText of problemSplits) {
        const problemChunks = splitByTokenLimit(problemText.trim(), config);
        chunks.push(...problemChunks);
      }
      return chunks;
    }
  }

  // 2. 문단 단위 분할
  if (config.preserveParagraphs) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    let currentChunk = '';
    let currentTokens = 0;

    for (const paragraph of paragraphs) {
      const paragraphTokens = countTokens(paragraph);

      if (currentTokens + paragraphTokens <= config.maxTokens) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentTokens += paragraphTokens;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }

        // 문단이 maxTokens보다 크면 추가 분할
        if (paragraphTokens > config.maxTokens) {
          const subChunks = splitByTokenLimit(paragraph, config);
          chunks.push(...subChunks);
          currentChunk = '';
          currentTokens = 0;
        } else {
          currentChunk = paragraph;
          currentTokens = paragraphTokens;
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  // 3. 기본 토큰 기반 분할
  return splitByTokenLimit(text, config);
}

/**
 * 토큰 수 제한으로 분할 (오버랩 포함)
 */
function splitByTokenLimit(text: string, config: ChunkingConfig): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?。])\s+/);

  let currentChunk = '';
  let currentTokens = 0;
  let overlapBuffer: string[] = [];

  for (const sentence of sentences) {
    const sentenceTokens = countTokens(sentence);

    if (currentTokens + sentenceTokens <= config.maxTokens) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      currentTokens += sentenceTokens;
      overlapBuffer.push(sentence);

      // 오버랩 버퍼 크기 제한
      while (countTokens(overlapBuffer.join(' ')) > config.overlapTokens && overlapBuffer.length > 1) {
        overlapBuffer.shift();
      }
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      // 오버랩 적용
      const overlap = overlapBuffer.join(' ');
      currentChunk = overlap + (overlap ? ' ' : '') + sentence;
      currentTokens = countTokens(currentChunk);
      overlapBuffer = [sentence];
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// ============================================
// 임베딩 생성
// ============================================

const DEFAULT_EMBED_CONFIG: EmbeddingConfig = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  batchSize: 100,
};

/**
 * 단일 텍스트 임베딩 생성
 */
export async function createEmbedding(
  text: string,
  config: EmbeddingConfig = DEFAULT_EMBED_CONFIG
): Promise<EmbeddingResult> {
  const response = await getOpenAI().embeddings.create({
    model: config.model,
    input: text,
    dimensions: config.dimensions,
  });

  return {
    text,
    embedding: response.data[0].embedding,
    tokenCount: response.usage.total_tokens,
  };
}

/**
 * 배치 임베딩 생성
 */
export async function createEmbeddingsBatch(
  texts: string[],
  config: EmbeddingConfig = DEFAULT_EMBED_CONFIG
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];

  // 배치 단위로 처리
  for (let i = 0; i < texts.length; i += config.batchSize) {
    const batch = texts.slice(i, i + config.batchSize);

    const response = await getOpenAI().embeddings.create({
      model: config.model,
      input: batch,
      dimensions: config.dimensions,
    });

    for (let j = 0; j < batch.length; j++) {
      results.push({
        text: batch[j],
        embedding: response.data[j].embedding,
        tokenCount: Math.ceil(response.usage.total_tokens / batch.length),
      });
    }
  }

  return results;
}

// ============================================
// 문서 인덱싱
// ============================================

/**
 * 문서를 청크로 분할하고 임베딩 생성 후 저장
 * @param academyId - 학원 ID (null이면 공용 자료)
 */
export async function indexDocument(
  documentId: string,
  content: string,
  academyId: string | null,
  metadata: Partial<ChunkMetadata> = {},
  config?: {
    chunking?: Partial<ChunkingConfig>;
    embedding?: Partial<EmbeddingConfig>;
  },
  onProgress?: (progress: IndexingProgress) => void
): Promise<IndexDocumentResult> {
  const startTime = Date.now();
  const chunkConfig = { ...DEFAULT_CHUNK_CONFIG, ...config?.chunking };
  const embedConfig = { ...DEFAULT_EMBED_CONFIG, ...config?.embedding };

  const progress: IndexingProgress = {
    documentId,
    filename: metadata.source_filename || 'unknown',
    status: 'pending',
    totalChunks: 0,
    processedChunks: 0,
    progress: 0,
    startedAt: new Date().toISOString(),
  };

  try {
    // 1. 청크 분할
    progress.status = 'chunking';
    onProgress?.(progress);

    const chunks = splitIntoChunks(content, chunkConfig);
    progress.totalChunks = chunks.length;
    onProgress?.(progress);

    if (chunks.length === 0) {
      throw new Error('문서에서 청크를 생성할 수 없습니다.');
    }

    // 2. 임베딩 생성
    progress.status = 'embedding';
    onProgress?.(progress);

    const embeddings = await createEmbeddingsBatch(chunks, embedConfig);

    // 3. DB 저장
    progress.status = 'storing';
    onProgress?.(progress);

    // 기존 청크 삭제 (재인덱싱 시)
    await getSupabase()
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    // 새 청크 저장
    const chunkRecords = embeddings.map((emb, index) => ({
      document_id: documentId,
      academy_id: academyId,
      content: emb.text,
      chunk_index: index,
      embedding: JSON.stringify(emb.embedding), // pgvector는 문자열로 받아서 자동 변환
      metadata: {
        ...metadata,
        chunk_index: index,
        total_chunks: chunks.length,
      },
      token_count: emb.tokenCount,
    }));

    // 배치 삽입
    const batchSize = 50;
    let totalTokens = 0;

    for (let i = 0; i < chunkRecords.length; i += batchSize) {
      const batch = chunkRecords.slice(i, i + batchSize);

      const { error } = await (getSupabase()
        .from('document_chunks') as any)
        .insert(batch);

      if (error) {
        throw new Error(`청크 저장 실패: ${error.message}`);
      }

      progress.processedChunks = Math.min(i + batchSize, chunkRecords.length);
      progress.progress = Math.round((progress.processedChunks / progress.totalChunks) * 100);
      onProgress?.(progress);

      totalTokens += batch.reduce((sum, c) => sum + (c.token_count || 0), 0);
    }

    // 4. 문서 상태 업데이트
    await (getSupabase()
      .from('rag_documents') as any)
      .update({
        pgvector_indexed: true,
        pgvector_indexed_at: new Date().toISOString(),
        chunk_count: chunks.length,
      })
      .eq('id', documentId);

    progress.status = 'completed';
    progress.completedAt = new Date().toISOString();
    onProgress?.(progress);

    return {
      documentId,
      chunkCount: chunks.length,
      totalTokens,
      processingTimeMs: Date.now() - startTime,
      success: true,
    };
  } catch (error) {
    progress.status = 'error';
    progress.error = error instanceof Error ? error.message : String(error);
    onProgress?.(progress);

    return {
      documentId,
      chunkCount: 0,
      totalTokens: 0,
      processingTimeMs: Date.now() - startTime,
      success: false,
      error: progress.error,
    };
  }
}

// ============================================
// 벡터 검색
// ============================================

/**
 * 벡터 유사도 검색
 */
export async function searchDocuments(
  request: VectorSearchRequest
): Promise<VectorSearchResponse> {
  const startTime = Date.now();
  const {
    query,
    academyId,
    topK = 10,
    threshold = 0.7,
    filters = {},
    useHybrid = false,
    vectorWeight = 0.7,
    includePublic = true, // 기본적으로 공용 자료 포함
  } = request;

  // 1. 쿼리 임베딩 생성
  const queryEmbedding = await createEmbedding(query);

  // 2. 메타데이터 필터 구성
  const filterMetadata: Record<string, unknown> = {};
  if (filters.subject) filterMetadata.subject = filters.subject;
  if (filters.grade) filterMetadata.grade = filters.grade;
  if (filters.unit) filterMetadata.unit = filters.unit;

  // 3. 검색 실행
  let results: VectorSearchResult[];

  // RPC 함수 호출 (타입 정의가 없으므로 타입 단언 사용)
  type HybridSearchResult = {
    id: string;
    document_id: string;
    content: string;
    chunk_index: number;
    metadata: ChunkMetadata;
    vector_score: number;
    keyword_score: number;
    combined_score: number;
  };

  type VectorSearchResultRow = {
    id: string;
    document_id: string;
    content: string;
    chunk_index: number;
    metadata: ChunkMetadata;
    similarity: number;
  };

  if (useHybrid) {
    // 하이브리드 검색 (벡터 + 키워드)
    const { data, error } = await (getSupabase().rpc as Function)('hybrid_search_chunks', {
      query_embedding: JSON.stringify(queryEmbedding.embedding),
      query_text: query,
      match_academy_id: academyId,
      match_count: topK,
      vector_weight: vectorWeight,
      keyword_weight: 1 - vectorWeight,
    }) as { data: HybridSearchResult[] | null; error: Error | null };

    if (error) {
      throw new Error(`하이브리드 검색 실패: ${error.message}`);
    }

    results = (data || []).map((row) => ({
      chunkId: row.id,
      documentId: row.document_id,
      content: row.content,
      chunkIndex: row.chunk_index,
      metadata: row.metadata,
      similarity: row.vector_score,
      keywordScore: row.keyword_score,
      combinedScore: row.combined_score,
    }));
  } else {
    // 순수 벡터 검색 - 학원 자료
    const { data, error } = await (getSupabase().rpc as Function)('search_document_chunks', {
      query_embedding: JSON.stringify(queryEmbedding.embedding),
      match_academy_id: academyId,
      match_count: topK,
      match_threshold: threshold,
      filter_metadata: filterMetadata,
    }) as { data: VectorSearchResultRow[] | null; error: Error | null };

    if (error) {
      throw new Error(`벡터 검색 실패: ${error.message}`);
    }

    results = (data || []).map((row) => ({
      chunkId: row.id,
      documentId: row.document_id,
      content: row.content,
      chunkIndex: row.chunk_index,
      metadata: row.metadata,
      similarity: row.similarity,
    }));

    // 공용 자료 검색 (includePublic이 true인 경우)
    if (includePublic) {
      // 직접 쿼리로 공용 자료 검색 (academy_id IS NULL)
      const { data: publicData, error: publicError } = await (getSupabase()
        .from('document_chunks') as any)
        .select('id, document_id, content, chunk_index, metadata')
        .is('academy_id', null)
        .limit(topK);

      if (!publicError && publicData && publicData.length > 0) {
        // 공용 자료에 대해 유사도 계산 (임베딩 기반)
        // 참고: 실제로는 DB에서 벡터 연산을 해야 하지만,
        // 여기서는 간단히 추가 (추후 DB 함수 개선 필요)
        const publicResults = publicData.map((row: any) => ({
          chunkId: row.id,
          documentId: row.document_id,
          content: row.content,
          chunkIndex: row.chunk_index,
          metadata: row.metadata || {},
          similarity: 0.75, // 공용 자료는 고정 유사도 (추후 개선)
          isPublic: true,
        }));

        // 결과 병합 및 정렬
        results = [...results, ...publicResults]
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, topK);
      }
    }
  }

  // 4. 문서 정보 추가 조회 (필요시)
  if (results.length > 0 && filters.documentType) {
    const documentIds = [...new Set(results.map(r => r.documentId))];

    const { data: docs } = await (getSupabase()
      .from('rag_documents') as any)
      .select('id, type')
      .in('id', documentIds)
      .eq('type', filters.documentType) as { data: { id: string; type: string }[] | null };

    const validDocIds = new Set(docs?.map((d: { id: string }) => d.id) || []);
    results = results.filter(r => validDocIds.has(r.documentId));
  }

  return {
    results,
    queryEmbedding: queryEmbedding.embedding,
    searchTimeMs: Date.now() - startTime,
    totalChunks: results.length,
  };
}

// ============================================
// RAG 생성 (검색 + 생성)
// ============================================

/**
 * RAG 기반 응답 생성
 */
export async function generateWithRAG(
  request: RAGGenerateRequest
): Promise<RAGGenerateResponse> {
  const {
    query,
    academyId,
    searchConfig = {},
    generateModel = 'gemini',
    systemPrompt,
  } = request;

  // 1. 관련 문서 검색
  const searchResponse = await searchDocuments({
    query,
    academyId,
    topK: searchConfig.topK || 5,
    threshold: searchConfig.threshold || 0.7,
    filters: searchConfig.filters,
    useHybrid: searchConfig.useHybrid,
  });

  if (searchResponse.results.length === 0) {
    return {
      answer: '관련 문서를 찾을 수 없습니다. 다른 검색어로 시도해주세요.',
      sources: [],
    };
  }

  // 2. 컨텍스트 구성
  const context = searchResponse.results
    .map((r, i) => `[출처 ${i + 1}]\n${r.content}`)
    .join('\n\n---\n\n');

  // 3. 프롬프트 구성
  const defaultSystemPrompt = `당신은 교육 전문가입니다. 주어진 문서를 바탕으로 질문에 정확하게 답변하세요.

답변 시 주의사항:
- 문서에 있는 정보만 사용하세요.
- 문서에 없는 내용은 "문서에서 해당 정보를 찾을 수 없습니다"라고 답하세요.
- 수학 공식은 LaTeX 형식으로 표기하세요.
- 답변은 명확하고 구조적으로 작성하세요.`;

  const fullPrompt = `${systemPrompt || defaultSystemPrompt}

## 참고 문서
${context}

## 질문
${query}

## 답변`;

  // 4. 생성
  let answer: string;
  let tokensUsed: RAGGenerateResponse['tokensUsed'];

  if (generateModel === 'gemini') {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(fullPrompt);
    answer = result.response.text();

    tokensUsed = {
      prompt: result.response.usageMetadata?.promptTokenCount || 0,
      completion: result.response.usageMetadata?.candidatesTokenCount || 0,
      total: result.response.usageMetadata?.totalTokenCount || 0,
    };
  } else if (generateModel === 'openai') {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: fullPrompt }],
    });
    answer = response.choices[0].message.content || '';

    tokensUsed = {
      prompt: response.usage?.prompt_tokens || 0,
      completion: response.usage?.completion_tokens || 0,
      total: response.usage?.total_tokens || 0,
    };
  } else {
    // Claude - Anthropic SDK 필요
    throw new Error('Claude 모델은 아직 지원되지 않습니다.');
  }

  return {
    answer,
    sources: searchResponse.results,
    tokensUsed,
  };
}

/**
 * RAG 스트리밍 생성
 */
export async function* streamWithRAG(
  request: RAGGenerateRequest
): AsyncGenerator<string, void, unknown> {
  const {
    query,
    academyId,
    searchConfig = {},
    generateModel = 'gemini',
    systemPrompt,
  } = request;

  // 1. 관련 문서 검색
  const searchResponse = await searchDocuments({
    query,
    academyId,
    topK: searchConfig.topK || 5,
    threshold: searchConfig.threshold || 0.7,
    filters: searchConfig.filters,
    useHybrid: searchConfig.useHybrid,
  });

  if (searchResponse.results.length === 0) {
    yield '관련 문서를 찾을 수 없습니다.';
    return;
  }

  // 2. 컨텍스트 구성
  const context = searchResponse.results
    .map((r, i) => `[출처 ${i + 1}]\n${r.content}`)
    .join('\n\n---\n\n');

  const defaultSystemPrompt = `당신은 교육 전문가입니다. 주어진 문서를 바탕으로 질문에 정확하게 답변하세요.`;

  const fullPrompt = `${systemPrompt || defaultSystemPrompt}

## 참고 문서
${context}

## 질문
${query}

## 답변`;

  // 3. 스트리밍 생성
  if (generateModel === 'gemini') {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContentStream(fullPrompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } else if (generateModel === 'openai') {
    const stream = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: fullPrompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        yield text;
      }
    }
  }

  // 4. 출처 정보 (마지막에 추가)
  yield '\n\n---\n**출처:**\n';
  for (const source of searchResponse.results) {
    const docInfo = source.metadata.source_filename || source.documentId;
    yield `- ${docInfo} (유사도: ${(source.similarity * 100).toFixed(1)}%)\n`;
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 문서의 청크 삭제
 */
export async function deleteDocumentChunks(documentId: string): Promise<void> {
  const { error } = await (getSupabase()
    .from('document_chunks') as any)
    .delete()
    .eq('document_id', documentId);

  if (error) {
    throw new Error(`청크 삭제 실패: ${error.message}`);
  }

  await (getSupabase()
    .from('rag_documents') as any)
    .update({
      pgvector_indexed: false,
      pgvector_indexed_at: null,
      chunk_count: 0,
    })
    .eq('id', documentId);
}

/**
 * 학원의 모든 청크 통계 조회
 */
export async function getAcademyChunkStats(academyId: string): Promise<{
  totalDocuments: number;
  indexedDocuments: number;
  totalChunks: number;
  totalTokens: number;
}> {
  type DocStat = { id: string; pgvector_indexed: boolean; chunk_count: number | null };
  type ChunkStat = { token_count: number | null };

  const { data: docStats } = await (getSupabase()
    .from('rag_documents') as any)
    .select('id, pgvector_indexed, chunk_count')
    .eq('academy_id', academyId) as { data: DocStat[] | null };

  const { data: chunkStats } = await (getSupabase()
    .from('document_chunks') as any)
    .select('token_count')
    .eq('academy_id', academyId) as { data: ChunkStat[] | null };

  return {
    totalDocuments: docStats?.length || 0,
    indexedDocuments: docStats?.filter((d: DocStat) => d.pgvector_indexed).length || 0,
    totalChunks: chunkStats?.length || 0,
    totalTokens: chunkStats?.reduce((sum: number, c: ChunkStat) => sum + (c.token_count || 0), 0) || 0,
  };
}

/**
 * 인덱싱되지 않은 문서 목록 조회
 */
export async function getUnindexedDocuments(academyId: string): Promise<{
  id: string;
  filename: string;
  type: string;
  created_at: string;
}[]> {
  type UnindexedDoc = { id: string; filename: string; type: string; created_at: string };

  const { data, error } = await (getSupabase()
    .from('rag_documents') as any)
    .select('id, filename, type, created_at')
    .eq('academy_id', academyId)
    .eq('pgvector_indexed', false)
    .eq('status', 'ready') as { data: UnindexedDoc[] | null; error: Error | null };

  if (error) {
    throw new Error(`문서 조회 실패: ${error.message}`);
  }

  return data || [];
}
