/**
 * RAG (Retrieval-Augmented Generation) 관련 타입 정의
 *
 * 이 파일은 기출문제/교과서 검색에 필요한 타입들을 정의합니다.
 * Gemini File Search API와 연동하여 사용됩니다.
 */

/**
 * 문서 유형
 */
export type DocumentType = 'exam' | 'textbook' | 'mockexam' | 'workbook'

/**
 * PDF 전처리 방식
 */
export type PreprocessMethod = 'auto' | 'markdown' | 'vision'

/**
 * 문서 메타데이터
 */
export interface DocumentMetadata {
  /** 문서 ID */
  id: string
  /** 원본 파일명 */
  filename: string
  /** 문서 유형 */
  type: DocumentType
  /** 과목 */
  subject: string
  /** 학년 */
  grade: string
  /** 단원 (선택) */
  unit?: string
  /** 출판사/출처 */
  publisher?: string
  /** 출제년도 (기출/모의고사의 경우) */
  year?: number
  /** 월 (모의고사의 경우) */
  month?: number
  /** 업로드 일시 */
  uploaded_at: string
  /** 업로드한 사용자 ID */
  uploaded_by: string
  /** 학원 ID */
  academy_id: string
  /** Supabase Storage 경로 */
  storage_path: string
  /** Gemini File Search Store ID */
  file_search_store_id?: string
  /** Gemini File ID */
  gemini_file_id?: string
  /** OpenAI Vector Store ID (레거시) */
  vector_store_id?: string
  /** OpenAI File ID (레거시) */
  openai_file_id?: string
  /** 전처리 방식 */
  preprocess_method?: PreprocessMethod
  /** 파일 크기 (bytes) */
  file_size?: number
  /** 페이지 수 */
  page_count?: number
}

/**
 * 검색 결과 항목
 */
export interface SearchResultItem {
  /** 검색 결과 ID */
  id: string
  /** 검색 점수 (0-1) */
  score: number
  /** 검색된 텍스트 내용 */
  content: string
  /** 문서 메타데이터 */
  metadata: DocumentMetadata
  /** 하이라이트된 텍스트 (검색어 강조) */
  highlight?: string
}

/**
 * 검색 필터 옵션
 */
export interface SearchFilter {
  /** 과목 */
  subject?: string
  /** 학년 */
  grade?: string
  /** 단원 */
  unit?: string
  /** 문서 유형 */
  type?: DocumentType
  /** 출제년도 (이상) */
  yearFrom?: number
  /** 출제년도 (이하) */
  yearTo?: number
  /** 출판사 */
  publisher?: string
}

/**
 * 검색 요청
 */
export interface SearchRequest {
  /** 검색 키워드 */
  query: string
  /** 검색 필터 */
  filter?: SearchFilter
  /** 반환할 결과 수 (기본값: 10) */
  limit?: number
  /** 검색 결과 오프셋 (페이지네이션) */
  offset?: number
}

/**
 * 검색 응답
 */
export interface SearchResponse {
  /** 검색 결과 목록 */
  results: SearchResultItem[]
  /** 전체 결과 수 */
  total: number
  /** 검색 소요 시간 (ms) */
  took: number
  /** 검색 쿼리 */
  query: string
}

/**
 * 문서 업로드 요청
 */
export interface DocumentUploadRequest {
  /** 파일 (FormData에서 추출) */
  file: File
  /** 문서 유형 */
  type: DocumentType
  /** 과목 */
  subject: string
  /** 학년 */
  grade: string
  /** 단원 (선택) */
  unit?: string
  /** 출판사/출처 */
  publisher?: string
  /** 출제년도 (기출/모의고사의 경우) */
  year?: number
  /** 월 (모의고사의 경우) */
  month?: number
  /** 전처리 방식 */
  preprocessMethod?: PreprocessMethod
}

/**
 * 문서 업로드 응답
 */
export interface DocumentUploadResponse {
  /** 성공 여부 */
  success: boolean
  /** 업로드된 문서 정보 */
  document?: DocumentMetadata
  /** 에러 메시지 */
  error?: string
}

// ============================================
// Gemini File Search API 관련 타입
// ============================================

/**
 * Gemini File Search Store
 */
export interface FileSearchStore {
  /** Store 이름 (전체 경로) */
  name: string
  /** 표시 이름 */
  display_name?: string
  /** 생성 시간 */
  create_time?: string
  /** 상태 */
  status?: string
}

/**
 * Gemini File 응답
 */
export interface GeminiFileResponse {
  /** 파일 이름 (전체 경로) */
  name: string
  /** 표시 이름 */
  display_name?: string
  /** MIME 타입 */
  mime_type?: string
  /** 파일 크기 (bytes) */
  size_bytes?: number
  /** 생성 시간 */
  create_time?: string
  /** 상태 */
  state?: 'PROCESSING' | 'ACTIVE' | 'FAILED'
}

/**
 * RAG 채팅 메시지
 */
export interface RagChatMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

/**
 * RAG 채팅 요청
 */
export interface RagChatRequest {
  /** 사용자 메시지 */
  message: string
  /** 이전 대화 기록 */
  history?: RagChatMessage[]
  /** 사용할 모델 */
  model?: string
  /** 시스템 프롬프트 */
  systemInstruction?: string
}

/**
 * RAG 채팅 응답
 */
export interface RagChatResponse {
  /** AI 응답 텍스트 */
  text: string
  /** 참조한 문서들 */
  citations?: {
    filename: string
    content: string
  }[]
}

// ============================================
// 한국어 라벨 상수 (UI 표시용)
// ============================================

/** 문서 유형 한국어 라벨 */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  exam: '기출문제',
  textbook: '교과서',
  mockexam: '모의고사',
  workbook: '문제집',
}

/** 전처리 방식 한국어 라벨 */
export const PREPROCESS_METHOD_LABELS: Record<PreprocessMethod, string> = {
  auto: '자동 (권장)',
  markdown: '마크다운 변환',
  vision: 'Vision 처리 (스캔 PDF)',
}

/** 과목 목록 */
export const SUBJECTS = ['수학', '영어', '국어', '과학', '사회', '한국사'] as const

/** 학년 목록 */
export const GRADES = [
  '초1', '초2', '초3', '초4', '초5', '초6',
  '중1', '중2', '중3',
  '고1', '고2', '고3',
] as const

/** 출판사 목록 */
export const PUBLISHERS = [
  '교육부',
  '비상교육',
  '미래엔',
  '천재교육',
  '동아출판',
  'EBS',
  '기타',
] as const

// ============================================
// 모델 설정 (관리자 페이지용)
// ============================================

/** 사용 가능한 채팅 모델 */
export const CHAT_MODELS = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google' },
] as const

/** 사용 가능한 Vision 모델 */
export const VISION_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4.5', provider: 'anthropic' },
] as const
