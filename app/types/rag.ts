/**
 * RAG (Retrieval-Augmented Generation) 관련 타입 정의
 *
 * 이 파일은 기출문제/교과서 검색에 필요한 타입들을 정의합니다.
 * OpenAI Files Search API와 연동하여 사용됩니다.
 */

/**
 * 문서 유형
 */
export type DocumentType = 'exam' | 'textbook' | 'mockexam' | 'workbook'

/**
 * 문서 메타데이터
 */
export interface DocumentMetadata {
  /** 문서 ID (OpenAI Vector Store 문서 ID) */
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
  /** OpenAI Vector Store ID */
  vector_store_id?: string
  /** OpenAI File ID */
  openai_file_id?: string
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

/**
 * OpenAI Vector Store 생성 응답
 */
export interface VectorStoreResponse {
  id: string
  object: string
  name: string
  status: string
  file_counts: {
    in_progress: number
    completed: number
    failed: number
    cancelled: number
    total: number
  }
  created_at: number
}

/**
 * OpenAI File 업로드 응답
 */
export interface OpenAIFileResponse {
  id: string
  object: string
  bytes: number
  created_at: number
  filename: string
  purpose: string
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
