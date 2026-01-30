/**
 * pgvector RAG 시스템 타입 정의
 * Supabase pgvector 기반 벡터 검색
 */

// ============================================
// 청크 관련 타입
// ============================================

export interface DocumentChunk {
  id: string;
  document_id: string;
  academy_id: string;
  content: string;
  chunk_index: number;
  embedding?: number[];
  metadata: ChunkMetadata;
  token_count?: number;
  created_at: string;
}

export interface ChunkMetadata {
  /** 원본 문서 페이지 번호 */
  page_number?: number;
  /** 섹션/단원 정보 */
  section?: string;
  /** 문제 번호 (있는 경우) */
  problem_number?: string;
  /** 추가 태그 */
  tags?: string[];
  /** 원본 파일명 */
  source_filename?: string;
  /** 과목 */
  subject?: string;
  /** 학년 */
  grade?: string;
  /** 단원 */
  unit?: string;
}

// ============================================
// 청크 분할 설정
// ============================================

export interface ChunkingConfig {
  /** 청크 최대 토큰 수 (기본: 512) */
  maxTokens: number;
  /** 청크 오버랩 토큰 수 (기본: 50) */
  overlapTokens: number;
  /** 문단 단위 분할 우선 (기본: true) */
  preserveParagraphs: boolean;
  /** 문제 단위 분할 (교육 콘텐츠용) */
  splitByProblems: boolean;
}

export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  maxTokens: 512,
  overlapTokens: 50,
  preserveParagraphs: true,
  splitByProblems: true,
};

// ============================================
// 임베딩 관련 타입
// ============================================

export type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002';

export interface EmbeddingConfig {
  model: EmbeddingModel;
  /** 임베딩 차원 수 */
  dimensions: number;
  /** 배치 크기 (기본: 100) */
  batchSize: number;
}

export const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  batchSize: 100,
};

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  tokenCount: number;
}

// ============================================
// 검색 관련 타입
// ============================================

export interface VectorSearchRequest {
  /** 검색 쿼리 */
  query: string;
  /** 학원 ID */
  academyId: string;
  /** 반환할 결과 수 (기본: 10) */
  topK?: number;
  /** 유사도 임계값 (기본: 0.7) */
  threshold?: number;
  /** 메타데이터 필터 */
  filters?: SearchFilters;
  /** 하이브리드 검색 사용 여부 */
  useHybrid?: boolean;
  /** 벡터 검색 가중치 (하이브리드 검색 시) */
  vectorWeight?: number;
  /** 공용 자료 포함 여부 (기본: true) */
  includePublic?: boolean;
}

export interface SearchFilters {
  subject?: string;
  grade?: string;
  unit?: string;
  documentType?: 'exam' | 'textbook' | 'mockexam' | 'workbook';
  year?: number;
  tags?: string[];
}

export interface VectorSearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  metadata: ChunkMetadata;
  /** 코사인 유사도 (0~1) */
  similarity: number;
  /** 키워드 점수 (하이브리드 검색 시) */
  keywordScore?: number;
  /** 통합 점수 (하이브리드 검색 시) */
  combinedScore?: number;
}

export interface VectorSearchResponse {
  results: VectorSearchResult[];
  /** 검색에 사용된 쿼리 임베딩 */
  queryEmbedding?: number[];
  /** 검색 소요 시간 (ms) */
  searchTimeMs: number;
  /** 총 검색된 청크 수 */
  totalChunks: number;
}

// ============================================
// RAG 생성 관련 타입
// ============================================

export interface RAGGenerateRequest {
  /** 사용자 질문/요청 */
  query: string;
  /** 학원 ID */
  academyId: string;
  /** 검색 설정 */
  searchConfig?: Partial<VectorSearchRequest>;
  /** 생성 모델 (기본: Gemini) */
  generateModel?: 'gemini' | 'claude' | 'openai';
  /** 스트리밍 여부 */
  stream?: boolean;
  /** 시스템 프롬프트 커스텀 */
  systemPrompt?: string;
}

export interface RAGGenerateResponse {
  /** 생성된 응답 */
  answer: string;
  /** 사용된 소스 청크들 */
  sources: VectorSearchResult[];
  /** 사용된 토큰 수 */
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// ============================================
// 인덱싱 관련 타입
// ============================================

export interface IndexingProgress {
  documentId: string;
  filename: string;
  status: 'pending' | 'chunking' | 'embedding' | 'storing' | 'completed' | 'error';
  totalChunks: number;
  processedChunks: number;
  progress: number; // 0-100
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface IndexDocumentResult {
  documentId: string;
  chunkCount: number;
  totalTokens: number;
  processingTimeMs: number;
  success: boolean;
  error?: string;
}

// ============================================
// RAG 시스템 설정
// ============================================

export interface RAGSystemConfig {
  /** 사용할 RAG 방식 */
  method: 'pgvector' | 'gemini-file-search' | 'hybrid';
  /** pgvector 설정 */
  pgvector?: {
    enabled: boolean;
    embeddingConfig: EmbeddingConfig;
    chunkingConfig: ChunkingConfig;
  };
  /** Gemini File Search 설정 */
  geminiFileSearch?: {
    enabled: boolean;
    storeId?: string;
  };
}

export const DEFAULT_RAG_CONFIG: RAGSystemConfig = {
  method: 'pgvector',
  pgvector: {
    enabled: true,
    embeddingConfig: DEFAULT_EMBEDDING_CONFIG,
    chunkingConfig: DEFAULT_CHUNKING_CONFIG,
  },
  geminiFileSearch: {
    enabled: true,
  },
};

// ============================================
// 유틸리티 타입
// ============================================

export interface TokenCounter {
  count(text: string): number;
  truncate(text: string, maxTokens: number): string;
}

export interface ChunkSplitter {
  split(text: string, config: ChunkingConfig): string[];
}
