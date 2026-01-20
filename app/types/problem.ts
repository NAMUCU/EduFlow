/**
 * 문제 관리 관련 타입 정의
 *
 * 이 파일은 저장된 문제의 관리, 필터링, 생성/수정에 필요한 타입들을 정의합니다.
 * 기본 Problem 타입은 database.ts에서 가져옵니다.
 */

import type {
  Problem,
  ProblemInsert,
  ProblemUpdate,
  ProblemType,
  ProblemDifficulty,
  ProblemOption,
} from './database'

// Re-export database types
export type {
  Problem,
  ProblemInsert,
  ProblemUpdate,
  ProblemType,
  ProblemDifficulty,
  ProblemOption,
}

/**
 * 문제 필터 인터페이스
 * 문제 목록을 필터링할 때 사용되는 조건들
 */
export interface ProblemFilter {
  /** 과목 (예: '수학', '영어') */
  subject?: string
  /** 학년 (예: '중1', '중2', '고1') */
  grade?: string
  /** 단원명 */
  unit?: string
  /** 난이도 */
  difficulty?: ProblemDifficulty
  /** 문제 유형 */
  type?: ProblemType
  /** 태그 (하나 이상 일치) */
  tags?: string[]
  /** AI 생성 문제만 */
  aiGenerated?: boolean
  /** 검색어 (문제 내용에서 검색) */
  search?: string
  /** 생성일 시작 */
  createdAfter?: string
  /** 생성일 종료 */
  createdBefore?: string
}

/**
 * 페이지네이션 옵션
 */
export interface PaginationOptions {
  /** 현재 페이지 (1부터 시작) */
  page: number
  /** 페이지당 항목 수 */
  limit: number
}

/**
 * 정렬 옵션
 */
export interface SortOptions {
  /** 정렬 기준 필드 */
  field: 'created_at' | 'updated_at' | 'subject' | 'grade' | 'difficulty'
  /** 정렬 방향 */
  direction: 'asc' | 'desc'
}

/**
 * 문제 목록 요청 파라미터
 */
export interface ProblemListParams {
  filter?: ProblemFilter
  pagination?: PaginationOptions
  sort?: SortOptions
}

/**
 * 페이지네이션된 응답
 */
export interface PaginatedResponse<T> {
  /** 데이터 목록 */
  data: T[]
  /** 페이지네이션 정보 */
  pagination: {
    /** 현재 페이지 */
    page: number
    /** 페이지당 항목 수 */
    limit: number
    /** 전체 항목 수 */
    total: number
    /** 전체 페이지 수 */
    totalPages: number
    /** 다음 페이지 존재 여부 */
    hasNext: boolean
    /** 이전 페이지 존재 여부 */
    hasPrev: boolean
  }
}

/**
 * 문제 생성 요청 타입
 * 필수 필드만 포함하고 시스템이 자동으로 설정하는 필드는 제외
 */
export interface CreateProblemRequest {
  /** 과목 (필수) */
  subject: string
  /** 학년 (필수) */
  grade: string
  /** 단원명 */
  unit?: string
  /** 문제 내용 (필수) */
  question: string
  /** 정답 (필수) */
  answer: string
  /** 풀이/해설 */
  solution?: string
  /** 난이도 (필수) */
  difficulty: ProblemDifficulty
  /** 문제 유형 (필수) */
  type: ProblemType
  /** 객관식 보기 (객관식일 경우 필수) */
  options?: ProblemOption[]
  /** 문제 이미지 URL */
  image_url?: string
  /** 태그 */
  tags?: string[]
  /** AI 생성 여부 */
  ai_generated?: boolean
  /** 공개 문제 여부 */
  is_public?: boolean
}

/**
 * 문제 수정 요청 타입
 * 모든 필드가 선택적
 */
export interface UpdateProblemRequest {
  /** 과목 */
  subject?: string
  /** 학년 */
  grade?: string
  /** 단원명 */
  unit?: string
  /** 문제 내용 */
  question?: string
  /** 정답 */
  answer?: string
  /** 풀이/해설 */
  solution?: string
  /** 난이도 */
  difficulty?: ProblemDifficulty
  /** 문제 유형 */
  type?: ProblemType
  /** 객관식 보기 */
  options?: ProblemOption[]
  /** 문제 이미지 URL */
  image_url?: string
  /** 태그 */
  tags?: string[]
  /** 공개 문제 여부 */
  is_public?: boolean
}

/**
 * API 응답 타입
 */
export interface ApiResponse<T> {
  /** 성공 여부 */
  success: boolean
  /** 응답 데이터 (성공 시) */
  data?: T
  /** 에러 메시지 (실패 시) */
  error?: string
  /** 상세 에러 정보 */
  details?: string
}

/**
 * 저장된 문제 (로컬 JSON 파일용)
 * Problem 인터페이스를 확장하여 로컬 저장에 필요한 필드 추가
 */
export interface SavedProblem extends Problem {
  /** 저장 일시 */
  saved_at?: string
  /** 마지막 사용 일시 */
  last_used_at?: string
  /** 사용 횟수 */
  use_count?: number
}

/**
 * 문제 저장소 (JSON 파일 형식)
 */
export interface ProblemStore {
  /** 버전 */
  version: string
  /** 마지막 수정 일시 */
  lastModified: string
  /** 저장된 문제 목록 */
  problems: SavedProblem[]
}

// ============================================
// 한국어 라벨 상수 (UI 표시용)
// ============================================

/** 과목 목록 */
export const SUBJECTS = ['수학', '영어', '국어', '과학', '사회'] as const

/** 학년 목록 */
export const GRADES = [
  '초1', '초2', '초3', '초4', '초5', '초6',
  '중1', '중2', '중3',
  '고1', '고2', '고3',
] as const

/** 정렬 옵션 한국어 라벨 */
export const SORT_LABELS: Record<string, string> = {
  'created_at:desc': '최신순',
  'created_at:asc': '오래된순',
  'updated_at:desc': '최근 수정순',
  'subject:asc': '과목순',
  'grade:asc': '학년순',
  'difficulty:asc': '쉬운 순',
  'difficulty:desc': '어려운 순',
}

/** 페이지당 항목 수 옵션 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

// ============================================
// AI 문제 생성 관련 타입 (PRD F1. AI 문제 자동 생성)
// ============================================

/**
 * AI 문제 생성 입력 파라미터
 * Gemini API를 통해 문제를 생성할 때 사용되는 입력 타입
 */
export interface GenerateProblemInput {
  /** 과목 (수학, 영어 등) */
  subject: string
  /** 단원명 */
  unit: string
  /** 난이도 */
  difficulty: 'easy' | 'medium' | 'hard'
  /** 문제 유형 */
  problemType: 'multiple_choice' | 'short_answer' | 'essay'
  /** 생성할 문제 수 */
  count: number
  /** 학교/학년 (선택) */
  schoolGrade?: string
  /** 지역 (선택) */
  region?: string
  /** 추가 요청사항 (선택) */
  additionalRequests?: string
}

/**
 * AI가 생성한 문제 타입
 * Gemini API 응답으로 받는 문제 데이터 구조
 */
export interface GeneratedProblem {
  /** 문제 내용 */
  question: string
  /** 객관식 보기 (객관식일 경우) */
  options?: string[]
  /** 정답 */
  answer: string
  /** 해설 */
  explanation: string
  /** 난이도 */
  difficulty: string
  /** 배점 */
  points: number
}

/**
 * 문제 생성 API 응답 타입
 */
export interface GenerateProblemsResponse {
  /** 성공 여부 */
  success: boolean
  /** 생성된 문제 목록 */
  problems?: GeneratedProblem[]
  /** 에러 메시지 (실패 시) */
  error?: string
  /** 원본 AI 응답 (디버깅용) */
  rawResponse?: string
}

/** 난이도 한국어 라벨 */
export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
}

/** 문제 유형 한국어 라벨 */
export const PROBLEM_TYPE_LABELS: Record<string, string> = {
  multiple_choice: '객관식',
  short_answer: '단답형',
  essay: '서술형',
}
