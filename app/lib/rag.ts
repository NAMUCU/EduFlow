/**
 * RAG (Retrieval-Augmented Generation) 검색 유틸리티
 *
 * Gemini File Search API를 사용하여
 * 기출문제, 교과서, 모의고사 등을 검색하는 기능을 제공합니다.
 *
 * 주요 기능:
 * - 키워드 기반 검색
 * - 단원/과목/학년 필터 검색
 * - 문서 업로드 및 인덱싱 (Gemini File API)
 * - 검색 결과 캐싱 (LRU)
 * - RAG 채팅 검색 (Gemini File Search)
 * - 스트리밍 RAG 채팅
 */

import { GoogleGenerativeAI, type Content } from '@google/generative-ai'
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server'
import { GoogleGenAI } from '@google/genai'
import { createServerSupabaseClient } from './supabase'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type {
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  SearchFilter,
  DocumentMetadata,
  DocumentType,
  RagChatMessage,
  RagChatResponse,
} from '@/types/rag'
import type { RagDocument } from '@/types/database'

// ============================================
// Gemini 클라이언트 초기화
// ============================================

const getGeminiClient = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY 환경변수가 설정되지 않았습니다.')
  }
  return new GoogleGenerativeAI(apiKey)
}

const getFileManager = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY 환경변수가 설정되지 않았습니다.')
  }
  return new GoogleAIFileManager(apiKey)
}

/**
 * Corpora API 타입 정의 (Vertex AI Semantic Retrieval용)
 * 주의: 이 API는 @google/genai SDK에서 실험적으로 지원되며,
 * Vertex AI 환경에서만 완전하게 동작할 수 있습니다.
 */
interface CorpusDocument {
  name?: string
  displayName?: string
  createTime?: string
}

interface Corpus {
  name?: string
  displayName?: string
  createTime?: string
  updateTime?: string
}

interface CorporaAPI {
  create: (params: { displayName?: string }) => Promise<Corpus>
  list: (params: { config?: { pageSize?: number; pageToken?: string } }) => Promise<{
    corpora?: Corpus[]
    nextPageToken?: string
  }>
  delete: (params: { name: string }) => Promise<void>
  documents: {
    create: (params: { parent: string; displayName?: string; document?: { displayName?: string } }) => Promise<CorpusDocument>
    list: (params: { parent: string; config?: { pageSize?: number; pageToken?: string } }) => Promise<{
      documents?: CorpusDocument[]
      nextPageToken?: string
    }>
    delete: (params: { name: string }) => Promise<void>
    chunks: {
      create: (params: { parent: string; chunk: { data: { stringValue: string } } }) => Promise<void>
    }
  }
}

interface ExtendedGenAI extends GoogleGenAI {
  corpora: CorporaAPI
}

/**
 * @google/genai 클라이언트 초기화
 * File Search Store 관리를 위한 클라이언트
 */
const getGenAIClient = (): ExtendedGenAI => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY 환경변수가 설정되지 않았습니다.')
  }
  // Corpora API는 Vertex AI에서 제공되며, 표준 SDK에서는 실험적 지원
  return new GoogleGenAI({ apiKey }) as ExtendedGenAI
}

// ============================================
// LRU 캐시 구현 (자주 검색되는 쿼리 캐싱)
// ============================================

interface CacheEntry<T> {
  value: T
  timestamp: number
}

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private readonly maxSize: number
  private readonly ttlMs: number

  constructor(maxSize: number = 100, ttlMs: number = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttlMs = ttlMs
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    // TTL 체크
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key)
      return undefined
    }

    // LRU: 가장 최근에 접근한 항목을 맨 뒤로 이동
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.value
  }

  set(key: string, value: T): void {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxSize) {
      // 가장 오래된 항목 삭제 (Map의 첫 번째 항목)
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

// 검색 결과 캐시 (5분 TTL, 최대 100개)
const searchCache = new LRUCache<SearchResponse>(100, 5 * 60 * 1000)

// ============================================
// 검색 키 생성 (캐시용)
// ============================================

function generateCacheKey(request: SearchRequest, academyId: string): string {
  return JSON.stringify({
    query: request.query,
    filter: request.filter || {},
    limit: request.limit || 10,
    offset: request.offset || 0,
    academyId,
  })
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * null을 undefined로 변환
 */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

/**
 * RagDocument를 DocumentMetadata로 변환
 */
function toDocumentMetadata(doc: RagDocument): DocumentMetadata {
  return {
    id: doc.id,
    filename: doc.filename,
    type: doc.type as DocumentType,
    subject: doc.subject,
    grade: doc.grade,
    unit: nullToUndefined(doc.unit),
    publisher: nullToUndefined(doc.publisher),
    year: nullToUndefined(doc.year),
    month: nullToUndefined(doc.month),
    uploaded_at: doc.created_at,
    uploaded_by: doc.uploaded_by,
    academy_id: doc.academy_id,
    storage_path: doc.storage_path,
    gemini_file_id: nullToUndefined(doc.gemini_file_id),
    file_search_store_id: nullToUndefined(doc.file_search_store_id),
  }
}

/**
 * RAG 채팅 메시지를 Gemini Content 형식으로 변환
 */
function toGeminiContents(history: RagChatMessage[]): Content[] {
  return history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: msg.parts.map((p) => ({ text: p.text })),
  }))
}

// ============================================
// 문서 업로드 및 인덱싱 (Gemini File API)
// ============================================

/**
 * 파일을 Gemini에 업로드하고 인덱싱
 */
export async function uploadAndIndexDocument(
  file: Buffer,
  filename: string,
  metadata: Omit<DocumentMetadata, 'id' | 'uploaded_at' | 'gemini_file_id' | 'file_search_store_id'>
): Promise<DocumentMetadata> {
  const startTime = Date.now()
  const supabase = createServerSupabaseClient()
  const fileManager = getFileManager()

  try {
    // 1. Supabase Storage에 파일 업로드
    const storagePath = `rag-documents/${metadata.academy_id}/${Date.now()}-${filename}`
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (storageError) {
      throw new Error(`Storage 업로드 실패: ${storageError.message}`)
    }

    // 2. Gemini File API에 파일 업로드
    // 임시 파일로 저장 후 업로드 (SDK가 파일 경로를 요구함)
    const tempFilePath = join(tmpdir(), `gemini-upload-${Date.now()}-${filename}`)
    writeFileSync(tempFilePath, file)

    let uploadResult
    try {
      uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: 'application/pdf',
        displayName: filename,
      })
    } finally {
      // 임시 파일 삭제
      try {
        unlinkSync(tempFilePath)
      } catch {
        // 삭제 실패해도 무시
      }
    }

    // 파일 처리 완료 대기 (최대 60초)
    let geminiFile = await fileManager.getFile(uploadResult.file.name)
    let waitTime = 0
    const maxWait = 60000

    while (geminiFile.state === FileState.PROCESSING && waitTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      waitTime += 2000
      geminiFile = await fileManager.getFile(uploadResult.file.name)
    }

    if (geminiFile.state === FileState.FAILED) {
      throw new Error('Gemini 파일 처리 실패')
    }

    // 3. 메타데이터 DB에 저장
    const documentData = {
      filename,
      type: metadata.type,
      subject: metadata.subject,
      grade: metadata.grade,
      unit: metadata.unit,
      publisher: metadata.publisher,
      year: metadata.year,
      month: metadata.month,
      uploaded_by: metadata.uploaded_by,
      academy_id: metadata.academy_id,
      storage_path: storagePath,
      gemini_file_id: uploadResult.file.name,
      file_size: file.length,
    }

    // eslint-disable-next-line
    const { data, error: dbError } = await (supabase.from('rag_documents') as any)
      .insert(documentData)
      .select()
      .single()

    if (dbError) {
      throw new Error(`DB 저장 실패: ${dbError.message}`)
    }

    const document = data as RagDocument

    console.log(`문서 인덱싱 완료: ${filename} (${Date.now() - startTime}ms)`)

    return toDocumentMetadata(document)
  } catch (error) {
    console.error('문서 업로드/인덱싱 실패:', error)
    throw error
  }
}

// ============================================
// 검색 기능
// ============================================

/**
 * 필터 조건을 검색 컨텍스트 문자열로 변환
 */
function buildFilterContext(filter?: SearchFilter): string {
  if (!filter) return ''

  const parts: string[] = []

  if (filter.subject) parts.push(`과목: ${filter.subject}`)
  if (filter.grade) parts.push(`학년: ${filter.grade}`)
  if (filter.unit) parts.push(`단원: ${filter.unit}`)
  if (filter.type) {
    const typeLabels: Record<DocumentType, string> = {
      exam: '기출문제',
      textbook: '교과서',
      mockexam: '모의고사',
      workbook: '문제집',
    }
    parts.push(`문서유형: ${typeLabels[filter.type]}`)
  }
  if (filter.yearFrom || filter.yearTo) {
    if (filter.yearFrom && filter.yearTo) {
      parts.push(`출제년도: ${filter.yearFrom}~${filter.yearTo}년`)
    } else if (filter.yearFrom) {
      parts.push(`출제년도: ${filter.yearFrom}년 이후`)
    } else {
      parts.push(`출제년도: ${filter.yearTo}년 이전`)
    }
  }
  if (filter.publisher) parts.push(`출판사: ${filter.publisher}`)

  return parts.length > 0 ? `\n검색 조건: ${parts.join(', ')}` : ''
}

/**
 * RAG 검색 실행
 * Gemini를 사용하여 업로드된 문서에서 관련 내용 검색
 */
export async function searchDocuments(
  request: SearchRequest,
  academyId: string
): Promise<SearchResponse> {
  const startTime = Date.now()
  const cacheKey = generateCacheKey(request, academyId)

  // 캐시 확인
  const cachedResult = searchCache.get(cacheKey)
  if (cachedResult) {
    console.log(`캐시 히트: ${request.query}`)
    return {
      ...cachedResult,
      took: Date.now() - startTime,
    }
  }

  try {
    const genAI = getGeminiClient()
    const supabase = createServerSupabaseClient()

    // 해당 학원의 문서 목록 조회 (gemini_file_id가 있는 문서만)
    // eslint-disable-next-line
    let query = (supabase.from('rag_documents') as any)
      .select('*')
      .eq('academy_id', academyId)
      .not('gemini_file_id', 'is', null)

    // 필터 적용
    if (request.filter?.subject) {
      query = query.eq('subject', request.filter.subject)
    }
    if (request.filter?.grade) {
      query = query.eq('grade', request.filter.grade)
    }
    if (request.filter?.type) {
      query = query.eq('type', request.filter.type)
    }
    if (request.filter?.unit) {
      query = query.ilike('unit', `%${request.filter.unit}%`)
    }
    if (request.filter?.yearFrom) {
      query = query.gte('year', request.filter.yearFrom)
    }
    if (request.filter?.yearTo) {
      query = query.lte('year', request.filter.yearTo)
    }
    if (request.filter?.publisher) {
      query = query.eq('publisher', request.filter.publisher)
    }

    const { data: documents, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`문서 조회 실패: ${fetchError.message}`)
    }

    const ragDocuments = (documents || []) as RagDocument[]

    // 문서가 없으면 빈 결과 반환
    if (ragDocuments.length === 0) {
      return {
        results: [],
        total: 0,
        took: Date.now() - startTime,
        query: request.query,
      }
    }

    // Gemini 모델 초기화
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    })

    // 파일 참조 생성 (Gemini File API 형식)
    const fileParts = ragDocuments
      .filter((doc) => doc.gemini_file_id)
      .map((doc) => ({
        fileData: {
          mimeType: 'application/pdf',
          fileUri: `https://generativelanguage.googleapis.com/v1beta/${doc.gemini_file_id}`,
        },
      }))

    const filterContext = buildFilterContext(request.filter)
    const searchPrompt = `다음 문서들에서 "${request.query}"와 관련된 내용을 찾아주세요.${filterContext}

검색 결과를 다음 JSON 형식으로 반환해주세요:
{
  "results": [
    {
      "content": "관련 내용을 정확하게 발췌하세요. 문제나 설명 전체를 포함해주세요.",
      "relevance": "높음/중간/낮음",
      "source_index": 0
    }
  ]
}

규칙:
1. 관련 내용이 있으면 가능한 많이 찾아주세요 (최대 10개)
2. 각 결과의 content는 충분히 의미있는 길이로 작성해주세요
3. source_index는 문서 순서 (0부터 시작)
4. 관련 내용이 없으면 빈 배열 "results": []를 반환
5. 반드시 유효한 JSON만 반환하세요`

    // 검색 실행
    const result = await model.generateContent([
      ...fileParts,
      { text: searchPrompt },
    ])

    const responseText = result.response.text()

    // JSON 파싱 시도
    let searchResults: Array<{
      content: string
      relevance: string
      source_index?: number
    }> = []

    try {
      // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
      let jsonStr = responseText
      const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonBlockMatch) {
        jsonStr = jsonBlockMatch[1]
      } else {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
        }
      }

      const parsed = JSON.parse(jsonStr)
      searchResults = parsed.results || []
    } catch (parseError) {
      // JSON 파싱 실패 시 텍스트 전체를 결과로 사용
      console.warn('JSON 파싱 실패, 텍스트 결과 사용:', parseError)
      if (responseText.trim() && !responseText.includes('관련 내용이 없')) {
        searchResults = [{
          content: responseText,
          relevance: '중간',
          source_index: 0,
        }]
      }
    }

    // 결과를 SearchResultItem 형식으로 변환
    const results: SearchResultItem[] = searchResults.map((item, index) => {
      // 관련성에 따른 점수
      const scoreMap: Record<string, number> = {
        '높음': 0.95,
        '중간': 0.75,
        '낮음': 0.55,
      }
      const score = scoreMap[item.relevance] || 0.7

      // source_index를 기반으로 해당 문서 찾기
      const sourceIndex = typeof item.source_index === 'number'
        ? Math.min(item.source_index, ragDocuments.length - 1)
        : 0
      const matchingDoc = ragDocuments[sourceIndex]

      return {
        id: `search-${Date.now()}-${index}`,
        score,
        content: item.content,
        metadata: matchingDoc
          ? toDocumentMetadata(matchingDoc)
          : {
              id: 'search-result',
              filename: 'search-result',
              type: 'exam' as DocumentType,
              subject: request.filter?.subject || '전체',
              grade: request.filter?.grade || '전체',
              uploaded_at: new Date().toISOString(),
              uploaded_by: '',
              academy_id: academyId,
              storage_path: '',
            },
      }
    })

    // 점수순 정렬 및 페이지네이션 적용
    const sortedResults = results.sort((a, b) => b.score - a.score)
    const offset = request.offset || 0
    const limit = request.limit || 10
    const paginatedResults = sortedResults.slice(offset, offset + limit)

    const response: SearchResponse = {
      results: paginatedResults,
      total: sortedResults.length,
      took: Date.now() - startTime,
      query: request.query,
    }

    // 캐시에 저장
    searchCache.set(cacheKey, response)

    console.log(`검색 완료: "${request.query}" (${response.took}ms, ${response.total}건)`)

    return response
  } catch (error) {
    console.error('RAG 검색 실패:', error)
    throw error
  }
}

// ============================================
// 스트리밍 검색 (async-defer-await 패턴)
// ============================================

/**
 * 검색 결과를 스트리밍으로 반환
 */
export async function* streamSearchResults(
  request: SearchRequest,
  academyId: string
): AsyncGenerator<SearchResultItem> {
  // 캐시 확인
  const cacheKey = generateCacheKey(request, academyId)
  const cachedResult = searchCache.get(cacheKey)

  if (cachedResult) {
    // 캐시된 결과를 스트리밍
    for (const result of cachedResult.results) {
      yield result
    }
    return
  }

  // 새 검색 실행
  const response = await searchDocuments(request, academyId)

  // 결과를 스트리밍
  for (const result of response.results) {
    yield result
  }
}

// ============================================
// 문서 삭제
// ============================================

/**
 * 문서 삭제 (Storage, Gemini, DB에서 모두 삭제)
 */
export async function deleteDocument(documentId: string, academyId: string): Promise<void> {
  const supabase = createServerSupabaseClient()
  const fileManager = getFileManager()

  // 문서 정보 조회
  // eslint-disable-next-line
  const { data, error: fetchError } = await (supabase.from('rag_documents') as any)
    .select('*')
    .eq('id', documentId)
    .eq('academy_id', academyId)
    .single()

  const document = data as RagDocument | null

  if (fetchError || !document) {
    throw new Error('문서를 찾을 수 없습니다.')
  }

  try {
    // 1. Gemini에서 파일 삭제
    if (document.gemini_file_id) {
      try {
        await fileManager.deleteFile(document.gemini_file_id)
      } catch (e) {
        console.warn('Gemini 파일 삭제 실패 (이미 삭제됨):', e)
      }
    }

    // 2. Supabase Storage에서 삭제
    if (document.storage_path) {
      await supabase.storage.from('documents').remove([document.storage_path])
    }

    // 3. DB에서 삭제
    // eslint-disable-next-line
    await (supabase.from('rag_documents') as any).delete().eq('id', documentId)

    // 캐시 초기화
    searchCache.clear()

    console.log(`문서 삭제 완료: ${document.filename}`)
  } catch (error) {
    console.error('문서 삭제 실패:', error)
    throw error
  }
}

// ============================================
// 문서 목록 조회
// ============================================

/**
 * 학원의 모든 RAG 문서 목록 조회
 */
export async function listDocuments(
  academyId: string,
  filter?: SearchFilter
): Promise<DocumentMetadata[]> {
  const supabase = createServerSupabaseClient()

  // eslint-disable-next-line
  let query = (supabase.from('rag_documents') as any)
    .select('*')
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })

  // 필터 적용
  if (filter?.subject) {
    query = query.eq('subject', filter.subject)
  }
  if (filter?.grade) {
    query = query.eq('grade', filter.grade)
  }
  if (filter?.type) {
    query = query.eq('type', filter.type)
  }
  if (filter?.unit) {
    query = query.ilike('unit', `%${filter.unit}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`문서 목록 조회 실패: ${error.message}`)
  }

  const documents = (data || []) as RagDocument[]

  return documents.map(toDocumentMetadata)
}

// ============================================
// RAG 채팅 (문서 기반 질의응답)
// ============================================

/**
 * 기본 시스템 프롬프트
 */
const DEFAULT_RAG_SYSTEM_INSTRUCTION = `당신은 EduFlow의 교육 자료 검색 및 질문 답변 전문가입니다.

업로드된 문서들을 검색하여 사용자의 질문에 정확하고 도움이 되는 답변을 제공합니다.
답변 시 다음 지침을 따르세요:

1. 검색된 문서의 내용을 기반으로 정확한 정보를 제공하세요.
2. 수학 공식이나 수식은 LaTeX 형식으로 작성하세요.
3. 답변이 문서에서 찾을 수 없는 경우, 솔직하게 말씀해 주세요.
4. 한국어로 친절하게 답변하세요.
5. 문제 풀이 시 단계별로 상세히 설명하세요.`

/**
 * 문서 기반 RAG 채팅
 * 업로드된 문서를 참조하여 질문에 답변
 */
export async function ragChat(
  message: string,
  academyId: string,
  options?: {
    filter?: SearchFilter
    model?: string
    systemInstruction?: string
    history?: RagChatMessage[]
  }
): Promise<RagChatResponse> {
  const genAI = getGeminiClient()
  const supabase = createServerSupabaseClient()

  // 해당 학원의 문서 조회
  // eslint-disable-next-line
  let query = (supabase.from('rag_documents') as any)
    .select('*')
    .eq('academy_id', academyId)
    .not('gemini_file_id', 'is', null)

  if (options?.filter?.subject) {
    query = query.eq('subject', options.filter.subject)
  }
  if (options?.filter?.grade) {
    query = query.eq('grade', options.filter.grade)
  }

  const { data: documents } = await query
  const ragDocuments = (documents || []) as RagDocument[]

  if (ragDocuments.length === 0) {
    return {
      text: '검색 가능한 문서가 없습니다. 먼저 문서를 업로드해주세요.',
    }
  }

  // 모델 초기화
  const model = genAI.getGenerativeModel({
    model: options?.model || 'gemini-2.0-flash',
    systemInstruction: options?.systemInstruction || DEFAULT_RAG_SYSTEM_INSTRUCTION,
  })

  // 파일 참조 생성
  const fileParts = ragDocuments
    .filter((doc) => doc.gemini_file_id)
    .map((doc) => ({
      fileData: {
        mimeType: 'application/pdf',
        fileUri: `https://generativelanguage.googleapis.com/v1beta/${doc.gemini_file_id}`,
      },
    }))

  // 문서 목록 안내
  const docList = ragDocuments
    .map((doc, i) => `${i + 1}. ${doc.filename} (${doc.subject}, ${doc.grade})`)
    .join('\n')

  // 대화 기록이 있으면 포함
  const historyContents = options?.history ? toGeminiContents(options.history) : []

  // 질문에 답변
  const result = await model.generateContent([
    ...fileParts,
    ...historyContents.flatMap((c) => c.parts),
    {
      text: `참조 가능한 문서 목록:
${docList}

사용자 질문: ${message}`,
    },
  ])

  return {
    text: result.response.text(),
  }
}

// ============================================
// 스트리밍 RAG 채팅
// ============================================

/**
 * 스트리밍 RAG 채팅 응답 청크 타입
 */
export interface RagStreamChunk {
  /** 텍스트 청크 (부분 응답) */
  text?: string
  /** 완료 여부 */
  done: boolean
  /** 전체 텍스트 (완료 시) */
  fullText?: string
  /** 인용 정보 (완료 시) */
  citations?: { filename: string; content: string }[]
  /** 에러 메시지 */
  error?: string
}

/**
 * 스트리밍 RAG 채팅
 * AsyncGenerator를 통해 청크 단위로 응답을 반환
 */
export async function* streamRagChat(
  message: string,
  academyId: string,
  options?: {
    filter?: SearchFilter
    model?: string
    systemInstruction?: string
    history?: RagChatMessage[]
  }
): AsyncGenerator<RagStreamChunk> {
  const genAI = getGeminiClient()
  const supabase = createServerSupabaseClient()

  // 해당 학원의 문서 조회
  // eslint-disable-next-line
  let query = (supabase.from('rag_documents') as any)
    .select('*')
    .eq('academy_id', academyId)
    .not('gemini_file_id', 'is', null)

  if (options?.filter?.subject) {
    query = query.eq('subject', options.filter.subject)
  }
  if (options?.filter?.grade) {
    query = query.eq('grade', options.filter.grade)
  }

  const { data: documents } = await query
  const ragDocuments = (documents || []) as RagDocument[]

  if (ragDocuments.length === 0) {
    yield {
      done: true,
      fullText: '검색 가능한 문서가 없습니다. 먼저 문서를 업로드해주세요.',
    }
    return
  }

  // 모델 초기화
  const model = genAI.getGenerativeModel({
    model: options?.model || 'gemini-2.0-flash',
    systemInstruction: options?.systemInstruction || DEFAULT_RAG_SYSTEM_INSTRUCTION,
  })

  // 파일 참조 생성
  const fileParts = ragDocuments
    .filter((doc) => doc.gemini_file_id)
    .map((doc) => ({
      fileData: {
        mimeType: 'application/pdf',
        fileUri: `https://generativelanguage.googleapis.com/v1beta/${doc.gemini_file_id}`,
      },
    }))

  // 문서 목록 안내
  const docList = ragDocuments
    .map((doc, i) => `${i + 1}. ${doc.filename} (${doc.subject}, ${doc.grade})`)
    .join('\n')

  // 대화 기록이 있으면 포함
  const historyContents = options?.history ? toGeminiContents(options.history) : []

  try {
    // 스트리밍 API 호출
    const result = await model.generateContentStream([
      ...fileParts,
      ...historyContents.flatMap((c) => c.parts),
      {
        text: `참조 가능한 문서 목록:
${docList}

사용자 질문: ${message}`,
      },
    ])

    let fullText = ''

    // 스트리밍 응답 처리
    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      if (chunkText) {
        fullText += chunkText
        yield {
          text: chunkText,
          done: false,
        }
      }
    }

    // 완료 청크 반환
    yield {
      done: true,
      fullText,
    }

    console.log(`[RAG 스트리밍 완료] 질문: "${message.slice(0, 50)}..." / 길이: ${fullText.length}자`)
  } catch (error) {
    console.error('[RAG 스트리밍 실패]', error)
    yield {
      done: true,
      error: error instanceof Error ? error.message : '스트리밍 채팅 중 오류가 발생했습니다.',
    }
  }
}

// ============================================
// RAG 검색 (Gemini File Search API)
// ============================================

/**
 * RAG 기반 검색 (Gemini File Search 사용)
 * 업로드된 문서를 Gemini가 직접 검색하여 관련 내용과 AI 분석 결과를 반환
 *
 * @param query - 검색 쿼리
 * @param academyId - 학원 ID
 * @param options - 검색 옵션 (필터, 모델 등)
 * @returns 검색 결과 (AI 분석 포함)
 */
export async function searchWithRag(
  query: string,
  academyId: string,
  options?: {
    filter?: SearchFilter
    model?: string
    limit?: number
  }
): Promise<{
  answer: string
  sources: Array<{
    filename: string
    subject: string
    grade: string
    content?: string
  }>
  took: number
}> {
  const startTime = Date.now()
  const genAI = getGeminiClient()
  const supabase = createServerSupabaseClient()

  // 캐시 키 생성 및 확인
  const cacheKey = JSON.stringify({ query, academyId, filter: options?.filter })
  const cachedResult = searchCache.get(cacheKey)
  if (cachedResult) {
    console.log(`[RAG 검색 캐시 히트] ${query}`)
    return {
      answer: cachedResult.results[0]?.content || '',
      sources: cachedResult.results.map((r) => ({
        filename: r.metadata.filename,
        subject: r.metadata.subject,
        grade: r.metadata.grade,
        content: r.content,
      })),
      took: Date.now() - startTime,
    }
  }

  // 해당 학원의 문서 조회 (gemini_file_id가 있는 문서만)
  // eslint-disable-next-line
  let dbQuery = (supabase.from('rag_documents') as any)
    .select('*')
    .eq('academy_id', academyId)
    .not('gemini_file_id', 'is', null)

  // 필터 적용
  if (options?.filter?.subject) {
    dbQuery = dbQuery.eq('subject', options.filter.subject)
  }
  if (options?.filter?.grade) {
    dbQuery = dbQuery.eq('grade', options.filter.grade)
  }
  if (options?.filter?.type) {
    dbQuery = dbQuery.eq('type', options.filter.type)
  }
  if (options?.filter?.unit) {
    dbQuery = dbQuery.ilike('unit', `%${options.filter.unit}%`)
  }
  if (options?.filter?.yearFrom) {
    dbQuery = dbQuery.gte('year', options.filter.yearFrom)
  }
  if (options?.filter?.yearTo) {
    dbQuery = dbQuery.lte('year', options.filter.yearTo)
  }
  if (options?.filter?.publisher) {
    dbQuery = dbQuery.eq('publisher', options.filter.publisher)
  }

  const { data: documents, error: fetchError } = await dbQuery

  if (fetchError) {
    throw new Error(`문서 조회 실패: ${fetchError.message}`)
  }

  const ragDocuments = (documents || []) as RagDocument[]

  if (ragDocuments.length === 0) {
    return {
      answer: '검색 가능한 문서가 없습니다. 먼저 문서를 업로드해주세요.',
      sources: [],
      took: Date.now() - startTime,
    }
  }

  // 모델 초기화
  const model = genAI.getGenerativeModel({
    model: options?.model || 'gemini-2.0-flash',
    systemInstruction: `당신은 EduFlow의 교육 자료 검색 전문가입니다.
사용자의 검색어와 관련된 내용을 문서에서 찾아 정리해주세요.

응답 형식:
1. 먼저 검색 결과를 요약해서 설명해주세요.
2. 관련 문제나 내용이 있다면 구체적으로 인용해주세요.
3. 수학 공식은 LaTeX 형식으로 작성하세요.
4. 한국어로 친절하게 답변하세요.`,
  })

  // 파일 참조 생성
  const fileParts = ragDocuments
    .filter((doc) => doc.gemini_file_id)
    .map((doc) => ({
      fileData: {
        mimeType: 'application/pdf',
        fileUri: `https://generativelanguage.googleapis.com/v1beta/${doc.gemini_file_id}`,
      },
    }))

  // 문서 목록 안내
  const docList = ragDocuments
    .map((doc, i) => `${i + 1}. ${doc.filename} (${doc.subject}, ${doc.grade})`)
    .join('\n')

  const filterContext = buildFilterContext(options?.filter)

  // Gemini에 검색 요청
  const result = await model.generateContent([
    ...fileParts,
    {
      text: `참조 가능한 문서 목록:
${docList}
${filterContext}

검색어: "${query}"

위 문서들에서 검색어와 관련된 내용을 찾아서 정리해주세요.`,
    },
  ])

  const answer = result.response.text()

  // 소스 정보 생성
  const sources = ragDocuments.map((doc) => ({
    filename: doc.filename,
    subject: doc.subject,
    grade: doc.grade,
  }))

  const took = Date.now() - startTime
  console.log(`[RAG 검색 완료] "${query}" (${took}ms, ${sources.length}개 문서)`)

  return {
    answer,
    sources,
    took,
  }
}

/**
 * 스트리밍 RAG 검색 (Gemini File Search 사용)
 * 검색 결과를 스트리밍으로 반환
 *
 * @param query - 검색 쿼리
 * @param academyId - 학원 ID
 * @param options - 검색 옵션
 * @yields 스트리밍 청크
 */
export async function* streamSearchWithRag(
  query: string,
  academyId: string,
  options?: {
    filter?: SearchFilter
    model?: string
    limit?: number
  }
): AsyncGenerator<{
  type: 'chunk' | 'sources' | 'done' | 'error'
  text?: string
  sources?: Array<{
    filename: string
    subject: string
    grade: string
  }>
  error?: string
  took?: number
}> {
  const startTime = Date.now()
  const genAI = getGeminiClient()
  const supabase = createServerSupabaseClient()

  // 해당 학원의 문서 조회
  // eslint-disable-next-line
  let dbQuery = (supabase.from('rag_documents') as any)
    .select('*')
    .eq('academy_id', academyId)
    .not('gemini_file_id', 'is', null)

  // 필터 적용
  if (options?.filter?.subject) {
    dbQuery = dbQuery.eq('subject', options.filter.subject)
  }
  if (options?.filter?.grade) {
    dbQuery = dbQuery.eq('grade', options.filter.grade)
  }
  if (options?.filter?.type) {
    dbQuery = dbQuery.eq('type', options.filter.type)
  }
  if (options?.filter?.unit) {
    dbQuery = dbQuery.ilike('unit', `%${options.filter.unit}%`)
  }

  const { data: documents, error: fetchError } = await dbQuery

  if (fetchError) {
    yield { type: 'error', error: `문서 조회 실패: ${fetchError.message}` }
    return
  }

  const ragDocuments = (documents || []) as RagDocument[]

  if (ragDocuments.length === 0) {
    yield {
      type: 'done',
      text: '검색 가능한 문서가 없습니다. 먼저 문서를 업로드해주세요.',
      sources: [],
      took: Date.now() - startTime,
    }
    return
  }

  // 소스 정보 먼저 전송
  const sources = ragDocuments.map((doc) => ({
    filename: doc.filename,
    subject: doc.subject,
    grade: doc.grade,
  }))

  yield { type: 'sources', sources }

  // 모델 초기화
  const model = genAI.getGenerativeModel({
    model: options?.model || 'gemini-2.0-flash',
    systemInstruction: `당신은 EduFlow의 교육 자료 검색 전문가입니다.
사용자의 검색어와 관련된 내용을 문서에서 찾아 정리해주세요.

응답 형식:
1. 먼저 검색 결과를 요약해서 설명해주세요.
2. 관련 문제나 내용이 있다면 구체적으로 인용해주세요.
3. 수학 공식은 LaTeX 형식으로 작성하세요.
4. 한국어로 친절하게 답변하세요.`,
  })

  // 파일 참조 생성
  const fileParts = ragDocuments
    .filter((doc) => doc.gemini_file_id)
    .map((doc) => ({
      fileData: {
        mimeType: 'application/pdf',
        fileUri: `https://generativelanguage.googleapis.com/v1beta/${doc.gemini_file_id}`,
      },
    }))

  // 문서 목록 안내
  const docList = ragDocuments
    .map((doc, i) => `${i + 1}. ${doc.filename} (${doc.subject}, ${doc.grade})`)
    .join('\n')

  const filterContext = buildFilterContext(options?.filter)

  try {
    // 스트리밍 API 호출
    const result = await model.generateContentStream([
      ...fileParts,
      {
        text: `참조 가능한 문서 목록:
${docList}
${filterContext}

검색어: "${query}"

위 문서들에서 검색어와 관련된 내용을 찾아서 정리해주세요.`,
      },
    ])

    let fullText = ''

    // 스트리밍 응답 처리
    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      if (chunkText) {
        fullText += chunkText
        yield { type: 'chunk', text: chunkText }
      }
    }

    // 완료
    yield {
      type: 'done',
      text: fullText,
      sources,
      took: Date.now() - startTime,
    }

    console.log(`[RAG 스트리밍 검색 완료] "${query}" (${Date.now() - startTime}ms)`)
  } catch (error) {
    console.error('[RAG 스트리밍 검색 실패]', error)
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.',
    }
  }
}

// ============================================
// 캐시 관리
// ============================================

/**
 * 검색 캐시 초기화
 */
export function clearSearchCache(): void {
  searchCache.clear()
}

// ============================================
// Gemini File Search Store 관리 (@google/genai)
// ============================================

/**
 * File Search Store 정보
 */
export interface FileSearchStore {
  /** Store 이름 (리소스 경로) */
  name: string
  /** Store 표시 이름 */
  displayName?: string
  /** Store 설명 */
  description?: string
  /** 생성 시각 */
  createTime?: string
  /** 수정 시각 */
  updateTime?: string
}

/**
 * File Search Store 생성/조회 결과
 */
export interface FileSearchStoreResult {
  /** 성공 여부 */
  success: boolean
  /** Store 정보 */
  store?: FileSearchStore
  /** 에러 메시지 */
  error?: string
  /** 새로 생성되었는지 여부 */
  created?: boolean
}

/**
 * File Search Store 목록 조회 결과
 */
export interface FileSearchStoreListResult {
  /** 성공 여부 */
  success: boolean
  /** Store 목록 */
  stores?: FileSearchStore[]
  /** 에러 메시지 */
  error?: string
  /** 다음 페이지 토큰 */
  nextPageToken?: string
}

/**
 * File Search Store 삭제 결과
 */
export interface FileSearchStoreDeleteResult {
  /** 성공 여부 */
  success: boolean
  /** 에러 메시지 */
  error?: string
}

/**
 * File Search Store를 조회하거나 없으면 생성
 *
 * @param storeName - Store 이름 (학원ID 기반으로 생성 권장)
 * @param options - 생성 옵션
 * @returns Store 정보
 *
 * @example
 * ```typescript
 * const result = await getOrCreateFileSearchStore('academy-123', {
 *   displayName: 'My Academy Store',
 *   description: '학원 문서 저장소'
 * })
 * if (result.success) {
 *   console.log('Store:', result.store?.name)
 * }
 * ```
 */
export async function getOrCreateFileSearchStore(
  storeName: string,
  options?: {
    displayName?: string
    description?: string
  }
): Promise<FileSearchStoreResult> {
  const ai = getGenAIClient()

  try {
    // 먼저 기존 Store 목록에서 해당 이름을 찾아봄
    const listResult = await listFileSearchStores()
    if (listResult.success && listResult.stores) {
      const existingStore = listResult.stores.find(
        (store) => store.displayName === storeName || store.name?.includes(storeName)
      )
      if (existingStore) {
        console.log(`[File Search Store] 기존 Store 발견: ${existingStore.name}`)
        return {
          success: true,
          store: existingStore,
          created: false,
        }
      }
    }

    // 기존 Store가 없으면 새로 생성
    // @google/genai의 corpora.create 사용
    const corpus = await ai.corpora.create({
      displayName: options?.displayName || storeName,
      // description은 corpus metadata로 저장할 수 있음
    })

    console.log(`[File Search Store] 새 Store 생성됨: ${corpus.name}`)

    return {
      success: true,
      store: {
        name: corpus.name || '',
        displayName: corpus.displayName,
        createTime: corpus.createTime,
        updateTime: corpus.updateTime,
      },
      created: true,
    }
  } catch (error) {
    console.error('[File Search Store] 생성/조회 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Store 생성/조회 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 모든 File Search Store 목록 조회
 *
 * @param options - 조회 옵션
 * @returns Store 목록
 *
 * @example
 * ```typescript
 * const result = await listFileSearchStores({ pageSize: 20 })
 * if (result.success) {
 *   result.stores?.forEach(store => {
 *     console.log(`Store: ${store.displayName} (${store.name})`)
 *   })
 * }
 * ```
 */
export async function listFileSearchStores(options?: {
  pageSize?: number
  pageToken?: string
}): Promise<FileSearchStoreListResult> {
  const ai = getGenAIClient()

  try {
    // @google/genai의 corpora.list 사용
    const response = await ai.corpora.list({
      config: {
        pageSize: options?.pageSize || 100,
        pageToken: options?.pageToken,
      },
    })

    const stores: FileSearchStore[] = (response.corpora || []).map((corpus) => ({
      name: corpus.name || '',
      displayName: corpus.displayName,
      createTime: corpus.createTime,
      updateTime: corpus.updateTime,
    }))

    console.log(`[File Search Store] ${stores.length}개 Store 조회됨`)

    return {
      success: true,
      stores,
      nextPageToken: response.nextPageToken,
    }
  } catch (error) {
    console.error('[File Search Store] 목록 조회 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Store 목록 조회 중 오류가 발생했습니다.',
    }
  }
}

/**
 * File Search Store 삭제
 *
 * @param storeNameOrId - Store 이름 또는 ID (전체 리소스 경로 또는 ID만)
 * @returns 삭제 결과
 *
 * @example
 * ```typescript
 * const result = await deleteFileSearchStore('corpora/abc123')
 * if (result.success) {
 *   console.log('Store가 삭제되었습니다.')
 * }
 * ```
 */
export async function deleteFileSearchStore(
  storeNameOrId: string
): Promise<FileSearchStoreDeleteResult> {
  const ai = getGenAIClient()

  try {
    // 전체 리소스 경로가 아니면 corpora/ 접두사 추가
    const corpusName = storeNameOrId.startsWith('corpora/')
      ? storeNameOrId
      : `corpora/${storeNameOrId}`

    // @google/genai의 corpora.delete 사용
    await ai.corpora.delete({
      name: corpusName,
    })

    console.log(`[File Search Store] Store 삭제됨: ${corpusName}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('[File Search Store] 삭제 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Store 삭제 중 오류가 발생했습니다.',
    }
  }
}

/**
 * File Search Store에 파일 추가
 *
 * @param storeName - Store 이름 (전체 리소스 경로)
 * @param fileUri - Gemini File API의 파일 URI
 * @param displayName - 파일 표시 이름
 * @returns 추가 결과
 *
 * @example
 * ```typescript
 * const result = await addFileToStore(
 *   'corpora/abc123',
 *   'files/xyz789',
 *   '2024년 수학 기출문제.pdf'
 * )
 * ```
 */
export async function addFileToStore(
  storeName: string,
  fileUri: string,
  displayName?: string
): Promise<{
  success: boolean
  document?: { name: string; displayName?: string }
  error?: string
}> {
  const ai = getGenAIClient()

  try {
    // Corpus에 문서 추가
    const document = await ai.corpora.documents.create({
      parent: storeName,
      displayName: displayName,
      // customMetadata나 다른 옵션을 추가할 수 있음
    })

    // 문서에 청크 추가 (파일 내용)
    if (document.name) {
      await ai.corpora.documents.chunks.create({
        parent: document.name,
        chunk: {
          data: {
            stringValue: fileUri, // 또는 실제 파일 내용
          },
        },
      })
    }

    console.log(`[File Search Store] 파일 추가됨: ${displayName || fileUri}`)

    return {
      success: true,
      document: {
        name: document.name || '',
        displayName: document.displayName,
      },
    }
  } catch (error) {
    console.error('[File Search Store] 파일 추가 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '파일 추가 중 오류가 발생했습니다.',
    }
  }
}

/**
 * File Search Store의 문서 목록 조회
 *
 * @param storeName - Store 이름 (전체 리소스 경로)
 * @param options - 조회 옵션
 * @returns 문서 목록
 *
 * @example
 * ```typescript
 * const result = await listStoreDocuments('corpora/abc123')
 * if (result.success) {
 *   result.documents?.forEach(doc => {
 *     console.log(`Document: ${doc.displayName}`)
 *   })
 * }
 * ```
 */
export async function listStoreDocuments(
  storeName: string,
  options?: {
    pageSize?: number
    pageToken?: string
  }
): Promise<{
  success: boolean
  documents?: Array<{ name: string; displayName?: string; createTime?: string }>
  nextPageToken?: string
  error?: string
}> {
  const ai = getGenAIClient()

  try {
    const response = await ai.corpora.documents.list({
      parent: storeName,
      config: {
        pageSize: options?.pageSize || 100,
        pageToken: options?.pageToken,
      },
    })

    const documents = (response.documents || []).map((doc) => ({
      name: doc.name || '',
      displayName: doc.displayName,
      createTime: doc.createTime,
    }))

    console.log(`[File Search Store] ${documents.length}개 문서 조회됨`)

    return {
      success: true,
      documents,
      nextPageToken: response.nextPageToken,
    }
  } catch (error) {
    console.error('[File Search Store] 문서 목록 조회 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '문서 목록 조회 중 오류가 발생했습니다.',
    }
  }
}

/**
 * File Search Store에서 문서 삭제
 *
 * @param documentName - 문서 이름 (전체 리소스 경로)
 * @returns 삭제 결과
 *
 * @example
 * ```typescript
 * const result = await deleteStoreDocument('corpora/abc123/documents/doc456')
 * ```
 */
export async function deleteStoreDocument(
  documentName: string
): Promise<{
  success: boolean
  error?: string
}> {
  const ai = getGenAIClient()

  try {
    await ai.corpora.documents.delete({
      name: documentName,
    })

    console.log(`[File Search Store] 문서 삭제됨: ${documentName}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('[File Search Store] 문서 삭제 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '문서 삭제 중 오류가 발생했습니다.',
    }
  }
}
