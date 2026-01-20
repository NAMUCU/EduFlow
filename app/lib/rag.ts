/**
 * RAG (Retrieval-Augmented Generation) 검색 유틸리티
 *
 * 이 파일은 OpenAI Files Search API를 사용하여
 * 기출문제, 교과서, 모의고사 등을 검색하는 기능을 제공합니다.
 *
 * 주요 기능:
 * - 키워드 기반 검색
 * - 단원/과목/학년 필터 검색
 * - 문서 업로드 및 인덱싱
 * - 검색 결과 캐싱 (LRU)
 */

import OpenAI from 'openai'
import { createServerSupabaseClient } from './supabase'
import type {
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  SearchFilter,
  DocumentMetadata,
  DocumentType,
} from '@/types/rag'
import type { RagDocument } from '@/types/database'

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

function generateCacheKey(request: SearchRequest): string {
  return JSON.stringify({
    query: request.query,
    filter: request.filter || {},
    limit: request.limit || 10,
    offset: request.offset || 0,
  })
}

// ============================================
// 타입 정의 (내부용)
// ============================================

interface AcademyWithVectorStore {
  vector_store_id: string | null
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
    vector_store_id: nullToUndefined(doc.vector_store_id),
    openai_file_id: nullToUndefined(doc.openai_file_id),
  }
}

// ============================================
// Vector Store 관리
// ============================================

/**
 * 학원별 Vector Store ID를 가져오거나 새로 생성
 */
export async function getOrCreateVectorStore(academyId: string): Promise<string> {
  const supabase = createServerSupabaseClient()

  // DB에서 Vector Store ID 조회
  const { data } = await supabase
    .from('academies')
    .select('vector_store_id')
    .eq('id', academyId)
    .single()

  const academy = data as AcademyWithVectorStore | null

  if (academy?.vector_store_id) {
    return academy.vector_store_id
  }

  // 새 Vector Store 생성 (OpenAI v6 API)
  // eslint-disable-next-line
  const vectorStore = await (openai.beta as any).vectorStores.create({
    name: `eduflow-academy-${academyId}`,
  })

  // DB에 저장 - any 타입 사용하여 타입 에러 우회
  const updateData = { vector_store_id: vectorStore.id }
  // eslint-disable-next-line
  await (supabase.from('academies') as any).update(updateData).eq('id', academyId)

  return vectorStore.id
}

// ============================================
// 문서 업로드 및 인덱싱
// ============================================

/**
 * 파일을 OpenAI에 업로드하고 Vector Store에 추가
 */
export async function uploadAndIndexDocument(
  file: Buffer,
  filename: string,
  metadata: Omit<DocumentMetadata, 'id' | 'uploaded_at' | 'openai_file_id' | 'vector_store_id'>
): Promise<DocumentMetadata> {
  const startTime = Date.now()
  const supabase = createServerSupabaseClient()

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

    // 2. OpenAI에 파일 업로드
    // Buffer를 Uint8Array로 변환하여 Blob 생성
    const uint8Array = new Uint8Array(file)
    const blob = new Blob([uint8Array], { type: 'application/pdf' })
    const openaiFile = await openai.files.create({
      file: new File([blob], filename, { type: 'application/pdf' }),
      purpose: 'assistants',
    })

    // 3. Vector Store 가져오기/생성
    const vectorStoreId = await getOrCreateVectorStore(metadata.academy_id)

    // 4. Vector Store에 파일 추가 (OpenAI v6 API)
    // eslint-disable-next-line
    await (openai.beta as any).vectorStores.files.create(vectorStoreId, {
      file_id: openaiFile.id,
    })

    // 5. 메타데이터 DB에 저장
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
      vector_store_id: vectorStoreId,
      openai_file_id: openaiFile.id,
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
 * RAG 검색 실행
 * 캐시된 결과가 있으면 반환하고, 없으면 OpenAI API 호출
 */
export async function searchDocuments(
  request: SearchRequest,
  academyId: string
): Promise<SearchResponse> {
  const startTime = Date.now()
  const cacheKey = generateCacheKey({ ...request, filter: { ...request.filter } })

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
    // Vector Store ID 가져오기
    const vectorStoreId = await getOrCreateVectorStore(academyId)

    // 필터 쿼리 생성
    const filterQuery = buildFilterQuery(request.filter)
    const fullQuery = filterQuery ? `${request.query} ${filterQuery}` : request.query

    // OpenAI Files Search API 호출
    // File Search는 Assistant API를 통해 사용
    const assistant = await openai.beta.assistants.create({
      name: 'EduFlow RAG Search',
      instructions: `당신은 교육 자료 검색 전문가입니다.
사용자의 검색 쿼리에 맞는 관련 문서를 찾아주세요.
검색 결과는 관련성이 높은 순서로 정렬하여 반환합니다.`,
      model: 'gpt-4o-mini',
      tools: [{ type: 'file_search' }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStoreId],
        },
      },
    })

    // Thread 생성 및 메시지 전송
    const thread = await openai.beta.threads.create()
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `다음 검색어로 관련 자료를 찾아주세요: "${fullQuery}"

검색 조건:
- 과목: ${request.filter?.subject || '전체'}
- 학년: ${request.filter?.grade || '전체'}
- 단원: ${request.filter?.unit || '전체'}
- 문서 유형: ${request.filter?.type || '전체'}

검색 결과에서 가장 관련성 높은 내용을 추출하여 알려주세요.`,
    })

    // Run 실행 및 대기
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    })

    // Run 완료 대기 (폴링)
    // eslint-disable-next-line
    let runStatus = await (openai.beta.threads.runs as any).retrieve(thread.id, run.id)
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise((resolve) => setTimeout(resolve, 500))
      // eslint-disable-next-line
      runStatus = await (openai.beta.threads.runs as any).retrieve(thread.id, run.id)
    }

    // 결과 메시지 가져오기
    const messages = await openai.beta.threads.messages.list(thread.id)
    const assistantMessages = messages.data.filter((m) => m.role === 'assistant')

    // 결과 파싱
    const results: SearchResultItem[] = []
    for (const message of assistantMessages) {
      for (const content of message.content) {
        if (content.type === 'text') {
          // 파일 인용 추출
          const annotations = content.text.annotations || []
          for (const annotation of annotations) {
            if ('file_citation' in annotation) {
              // eslint-disable-next-line
              const fileCitation = (annotation as any).file_citation

              // DB에서 문서 메타데이터 조회
              const supabase = createServerSupabaseClient()
              // eslint-disable-next-line
              const { data } = await (supabase.from('rag_documents') as any)
                .select('*')
                .eq('openai_file_id', fileCitation.file_id)
                .single()

              const docData = data as RagDocument | null

              if (docData) {
                results.push({
                  id: docData.id,
                  score: 1.0, // OpenAI API는 점수를 제공하지 않으므로 기본값
                  content: content.text.value,
                  metadata: toDocumentMetadata(docData),
                })
              }
            }
          }

          // 인용이 없어도 텍스트 결과 추가
          if (results.length === 0 && content.text.value) {
            results.push({
              id: `search-${Date.now()}`,
              score: 0.8,
              content: content.text.value,
              metadata: {
                id: 'search-result',
                filename: 'search-result',
                type: 'exam',
                subject: request.filter?.subject || '전체',
                grade: request.filter?.grade || '전체',
                uploaded_at: new Date().toISOString(),
                uploaded_by: '',
                academy_id: academyId,
                storage_path: '',
              },
            })
          }
        }
      }
    }

    // 정리: Assistant 삭제
    // eslint-disable-next-line
    await (openai.beta.assistants as any).delete(assistant.id)

    const response: SearchResponse = {
      results: results.slice(0, request.limit || 10),
      total: results.length,
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

/**
 * 필터 조건을 검색 쿼리로 변환
 */
function buildFilterQuery(filter?: SearchFilter): string {
  if (!filter) return ''

  const parts: string[] = []

  if (filter.subject) parts.push(`과목:${filter.subject}`)
  if (filter.grade) parts.push(`학년:${filter.grade}`)
  if (filter.unit) parts.push(`단원:${filter.unit}`)
  if (filter.type) {
    const typeLabels: Record<DocumentType, string> = {
      exam: '기출문제',
      textbook: '교과서',
      mockexam: '모의고사',
      workbook: '문제집',
    }
    parts.push(`유형:${typeLabels[filter.type]}`)
  }
  if (filter.yearFrom || filter.yearTo) {
    const yearPart = filter.yearFrom && filter.yearTo
      ? `${filter.yearFrom}~${filter.yearTo}년`
      : filter.yearFrom
        ? `${filter.yearFrom}년 이후`
        : `${filter.yearTo}년 이전`
    parts.push(yearPart)
  }
  if (filter.publisher) parts.push(`출판사:${filter.publisher}`)

  return parts.join(' ')
}

// ============================================
// 스트리밍 검색 (async-defer-await 패턴)
// ============================================

/**
 * 검색 결과를 스트리밍으로 반환
 * async-defer-await 패턴을 사용하여 점진적으로 결과 전송
 */
export async function* streamSearchResults(
  request: SearchRequest,
  academyId: string
): AsyncGenerator<SearchResultItem> {
  // 캐시 확인
  const cacheKey = generateCacheKey(request)
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
 * 문서 삭제 (Storage, OpenAI, DB에서 모두 삭제)
 */
export async function deleteDocument(documentId: string, academyId: string): Promise<void> {
  const supabase = createServerSupabaseClient()

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
    // 1. OpenAI에서 파일 삭제
    if (document.openai_file_id) {
      try {
        // eslint-disable-next-line
        await (openai.files as any).delete(document.openai_file_id)
      } catch (e) {
        console.warn('OpenAI 파일 삭제 실패 (이미 삭제됨):', e)
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
