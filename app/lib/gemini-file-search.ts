/**
 * Gemini File Search 유틸리티
 *
 * 이 파일은 Google Gemini File API를 사용하여
 * 기출문제, 교과서, 모의고사 등을 업로드하고 검색하는 기능을 제공합니다.
 *
 * 주요 기능:
 * - PDF 파일 전처리 (마크다운 변환, Vision 처리)
 * - Gemini File API로 파일 업로드
 * - 파일 상태 확인 및 관리
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerSupabaseClient } from './supabase'
import type {
  DocumentMetadata,
  DocumentType,
  PreprocessMethod,
  GeminiFileResponse,
} from '@/types/rag'
import type { RagDocument } from '@/types/database'

// ============================================
// Gemini 클라이언트 초기화
// ============================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ============================================
// 상수 정의
// ============================================

/** 파일 처리 상태 확인 최대 시도 횟수 */
const MAX_STATUS_CHECK_ATTEMPTS = 30

/** 상태 확인 간격 (ms) */
const STATUS_CHECK_INTERVAL = 2000

// ============================================
// 타입 정의
// ============================================

interface UploadOptions {
  filename: string
  type: DocumentType
  subject: string
  grade: string
  unit?: string
  publisher?: string
  year?: number
  month?: number
  uploadedBy: string
  academyId: string
  preprocessMethod?: PreprocessMethod
}

interface PreprocessResult {
  content: Buffer
  mimeType: string
  pageCount?: number
  extractedText?: string
}

// ============================================
// PDF 전처리 함수
// ============================================

/**
 * PDF를 전처리하여 Gemini에 최적화된 형태로 변환
 *
 * @param file - 원본 PDF Buffer
 * @param method - 전처리 방식 (auto, markdown, vision)
 * @returns 전처리된 결과
 */
async function preprocessPdf(
  file: Buffer,
  method: PreprocessMethod = 'auto'
): Promise<PreprocessResult> {
  const startTime = Date.now()

  // auto 모드: 파일 크기와 특성에 따라 자동 선택
  let selectedMethod = method
  if (method === 'auto') {
    // 5MB 이상이면 vision 모드 (스캔 PDF일 가능성 높음)
    // 5MB 미만이면 markdown 모드 (텍스트 기반 PDF일 가능성 높음)
    selectedMethod = file.length > 5 * 1024 * 1024 ? 'vision' : 'markdown'
  }

  let result: PreprocessResult

  switch (selectedMethod) {
    case 'markdown':
      result = await preprocessWithMarkdown(file)
      break
    case 'vision':
      result = await preprocessWithVision(file)
      break
    default:
      // 기본값: 원본 PDF 그대로 사용
      result = {
        content: file,
        mimeType: 'application/pdf',
      }
  }

  console.log(
    `PDF 전처리 완료 (${selectedMethod}): ${Date.now() - startTime}ms`
  )

  return result
}

/**
 * 마크다운 변환 전처리
 * 텍스트 기반 PDF에 적합
 */
async function preprocessWithMarkdown(file: Buffer): Promise<PreprocessResult> {
  // PDF.co API를 사용하여 마크다운으로 변환
  const pdfCoApiKey = process.env.PDF_CO_API_KEY

  if (!pdfCoApiKey) {
    console.warn('PDF.co API 키가 없어 원본 PDF를 사용합니다.')
    return {
      content: file,
      mimeType: 'application/pdf',
    }
  }

  try {
    // 1. PDF를 Base64로 인코딩
    const base64Pdf = file.toString('base64')

    // 2. PDF.co API 호출하여 텍스트 추출
    const response = await fetch(
      'https://api.pdf.co/v1/pdf/convert/to/text',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': pdfCoApiKey,
        },
        body: JSON.stringify({
          file: `data:application/pdf;base64,${base64Pdf}`,
          inline: true,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`PDF.co API 오류: ${response.status}`)
    }

    const result = await response.json()

    if (result.body) {
      // 추출된 텍스트를 마크다운 형식으로 정리
      const markdownContent = formatAsMarkdown(result.body)
      const textBuffer = Buffer.from(markdownContent, 'utf-8')

      return {
        content: textBuffer,
        mimeType: 'text/plain',
        extractedText: markdownContent,
        pageCount: result.pageCount,
      }
    }

    // 텍스트 추출 실패 시 원본 반환
    return {
      content: file,
      mimeType: 'application/pdf',
    }
  } catch (error) {
    console.error('마크다운 변환 실패:', error)
    return {
      content: file,
      mimeType: 'application/pdf',
    }
  }
}

/**
 * Vision 처리 전처리
 * 스캔된 PDF나 이미지 기반 PDF에 적합
 */
async function preprocessWithVision(file: Buffer): Promise<PreprocessResult> {
  // Gemini Vision을 사용하여 이미지에서 텍스트 추출
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    // PDF를 이미지로 변환하지 않고 직접 Gemini에 전달
    // Gemini는 PDF를 직접 처리할 수 있음
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: file.toString('base64'),
        },
      },
      `이 PDF 문서의 모든 내용을 텍스트로 추출해주세요.
      문제와 보기가 있다면 구조를 유지해서 추출해주세요.
      수학 공식이 있다면 LaTeX 형식으로 변환해주세요.
      표가 있다면 마크다운 표 형식으로 변환해주세요.`,
    ])

    const response = await result.response
    const extractedText = response.text()

    if (extractedText) {
      const textBuffer = Buffer.from(extractedText, 'utf-8')
      return {
        content: textBuffer,
        mimeType: 'text/plain',
        extractedText,
      }
    }

    return {
      content: file,
      mimeType: 'application/pdf',
    }
  } catch (error) {
    console.error('Vision 처리 실패:', error)
    return {
      content: file,
      mimeType: 'application/pdf',
    }
  }
}

/**
 * 텍스트를 마크다운 형식으로 정리
 */
function formatAsMarkdown(text: string): string {
  // 기본적인 마크다운 포맷팅
  let markdown = text

  // 줄바꿈 정리
  markdown = markdown.replace(/\r\n/g, '\n')
  markdown = markdown.replace(/\n{3,}/g, '\n\n')

  // 문제 번호 패턴 인식하여 헤더로 변환
  markdown = markdown.replace(/^(\d+)\.\s+/gm, '\n## 문제 $1\n')
  markdown = markdown.replace(/^([가-힣])\)\s+/gm, '- ($1) ')

  // 보기 패턴 인식
  markdown = markdown.replace(/^([①②③④⑤])\s+/gm, '  - $1 ')

  return markdown.trim()
}

// ============================================
// Gemini 파일 업로드
// ============================================

/**
 * Gemini File API로 파일 업로드
 */
async function uploadToGemini(
  content: Buffer,
  mimeType: string,
  displayName: string
): Promise<GeminiFileResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
  }

  // Buffer를 Uint8Array로 변환
  const uint8Array = new Uint8Array(content)

  // REST API를 사용하여 파일 업로드
  const response = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': mimeType,
        'X-Goog-Upload-Protocol': 'raw',
      },
      body: uint8Array,
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini 파일 업로드 실패: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  return {
    name: result.file.name,
    display_name: displayName,
    mime_type: mimeType,
    size_bytes: content.length,
    state: result.file.state,
    create_time: result.file.createTime,
  }
}

/**
 * 파일 처리 상태 확인 및 대기
 */
async function waitForFileProcessing(
  fileName: string
): Promise<GeminiFileResponse> {
  const apiKey = process.env.GEMINI_API_KEY

  for (let i = 0; i < MAX_STATUS_CHECK_ATTEMPTS; i++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`
    )

    if (!response.ok) {
      throw new Error(`파일 상태 확인 실패: ${response.status}`)
    }

    const fileInfo = await response.json()

    if (fileInfo.state === 'ACTIVE') {
      return {
        name: fileInfo.name,
        display_name: fileInfo.displayName,
        mime_type: fileInfo.mimeType,
        size_bytes: parseInt(fileInfo.sizeBytes || '0'),
        state: fileInfo.state,
        create_time: fileInfo.createTime,
      }
    }

    if (fileInfo.state === 'FAILED') {
      throw new Error('파일 처리 실패')
    }

    // 처리 중이면 대기
    await new Promise((resolve) => setTimeout(resolve, STATUS_CHECK_INTERVAL))
  }

  throw new Error('파일 처리 시간 초과')
}

// ============================================
// 메인 업로드 함수
// ============================================

/**
 * 문서를 업로드하고 Gemini File API에 인덱싱
 *
 * @param file - PDF 파일 Buffer
 * @param options - 업로드 옵션
 * @returns 저장된 문서 메타데이터
 */
export async function uploadAndIndexDocumentGemini(
  file: Buffer,
  options: UploadOptions
): Promise<DocumentMetadata> {
  const startTime = Date.now()
  const supabase = createServerSupabaseClient()

  try {
    // 1. PDF 전처리
    const preprocessResult = await preprocessPdf(
      file,
      options.preprocessMethod || 'auto'
    )

    // 2. Supabase Storage에 원본 파일 업로드
    const storagePath = `rag-documents/${options.academyId}/${Date.now()}-${options.filename}`
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (storageError) {
      throw new Error(`Storage 업로드 실패: ${storageError.message}`)
    }

    // 3. Gemini File API로 업로드
    const geminiFile = await uploadToGemini(
      preprocessResult.content,
      preprocessResult.mimeType,
      options.filename
    )

    // 4. 파일 처리 완료 대기
    const processedFile = await waitForFileProcessing(geminiFile.name)

    // 5. 메타데이터 DB에 저장
    const documentData = {
      filename: options.filename,
      type: options.type,
      subject: options.subject,
      grade: options.grade,
      unit: options.unit || null,
      publisher: options.publisher || null,
      year: options.year || null,
      month: options.month || null,
      uploaded_by: options.uploadedBy,
      academy_id: options.academyId,
      storage_path: storagePath,
      gemini_file_id: processedFile.name,
      file_search_store_id: null,
      file_size: file.length,
      page_count: preprocessResult.pageCount || null,
      status: 'ready',
      error_message: null,
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

    console.log(
      `문서 인덱싱 완료: ${options.filename} (${Date.now() - startTime}ms)`
    )

    return toDocumentMetadata(document, options.preprocessMethod)
  } catch (error) {
    console.error('문서 업로드/인덱싱 실패:', error)

    // 실패 시에도 상태 저장
    try {
      const errorDocumentData = {
        filename: options.filename,
        type: options.type,
        subject: options.subject,
        grade: options.grade,
        unit: options.unit || null,
        publisher: options.publisher || null,
        year: options.year || null,
        month: options.month || null,
        uploaded_by: options.uploadedBy,
        academy_id: options.academyId,
        storage_path: '',
        gemini_file_id: null,
        file_search_store_id: null,
        file_size: file.length,
        page_count: null,
        status: 'error',
        error_message: error instanceof Error ? error.message : '알 수 없는 오류',
      }

      // eslint-disable-next-line
      await (supabase.from('rag_documents') as any).insert(errorDocumentData)
    } catch {
      // 오류 로깅용 저장도 실패하면 무시
    }

    throw error
  }
}

// ============================================
// 파일 삭제
// ============================================

/**
 * 문서 삭제 (Storage, Gemini, DB에서 모두 삭제)
 */
export async function deleteDocumentGemini(
  documentId: string,
  academyId: string
): Promise<void> {
  const supabase = createServerSupabaseClient()

  // 문서 정보 조회
  // eslint-disable-next-line
  const { data, error: fetchError } = await (supabase.from('rag_documents') as any)
    .select('*')
    .eq('id', documentId)
    .eq('academy_id', academyId)
    .single()

  if (fetchError || !data) {
    throw new Error('문서를 찾을 수 없습니다.')
  }

  const document = data as RagDocument

  try {
    // 1. Gemini에서 파일 삭제
    if (document.gemini_file_id) {
      try {
        const apiKey = process.env.GEMINI_API_KEY
        await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${document.gemini_file_id}?key=${apiKey}`,
          { method: 'DELETE' }
        )
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
export async function listDocumentsGemini(
  academyId: string,
  filter?: {
    subject?: string
    grade?: string
    type?: DocumentType
    unit?: string
  }
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

  return documents.map((doc) => toDocumentMetadata(doc))
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
function toDocumentMetadata(
  doc: RagDocument,
  preprocessMethod?: PreprocessMethod
): DocumentMetadata {
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
    preprocess_method: preprocessMethod,
    file_size: nullToUndefined(doc.file_size),
    page_count: nullToUndefined(doc.page_count),
  }
}

// ============================================
// Gemini 파일 검색 (RAG)
// ============================================

/**
 * Gemini를 사용하여 문서에서 관련 내용 검색
 */
export async function searchWithGemini(
  query: string,
  geminiFileIds: string[],
  systemPrompt?: string
): Promise<{
  response: string
  citations: { filename: string; content: string }[]
}> {
  if (geminiFileIds.length === 0) {
    return {
      response: '검색할 문서가 없습니다.',
      citations: [],
    }
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt || `당신은 교육 자료 검색 전문가입니다.
사용자의 질문에 대해 제공된 문서들을 참고하여 정확하고 상세한 답변을 제공하세요.
답변 시 출처를 명시해주세요.`,
  })

  // 파일 참조 생성
  const fileParts = geminiFileIds.map((fileId) => ({
    fileData: {
      mimeType: 'application/pdf',
      fileUri: `https://generativelanguage.googleapis.com/v1beta/${fileId}`,
    },
  }))

  const result = await model.generateContent([
    ...fileParts,
    `질문: ${query}\n\n위 문서들을 참고하여 답변해주세요.`,
  ])

  const response = await result.response

  return {
    response: response.text(),
    citations: [], // Gemini API는 현재 citation을 직접 제공하지 않음
  }
}
