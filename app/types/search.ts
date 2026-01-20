/**
 * 기출/교과서 검색 페이지 관련 타입 정의
 * PRD F7: RAG 검색 프론트엔드
 */

import type { SearchFilter, SearchResultItem, DocumentType } from './rag'

/**
 * 검색 히스토리 항목
 */
export interface SearchHistoryItem {
  id: string
  query: string
  filters: SearchFilter
  resultCount: number
  timestamp: string
}

/**
 * 검색 상태
 */
export interface SearchState {
  query: string
  filters: SearchFilter
  isSearching: boolean
  results: SearchResultItem[]
  total: number
  page: number
  hasMore: boolean
}

/**
 * 선택된 문제 (문제지에 추가용)
 */
export interface SelectedProblem {
  id: string
  title: string
  content: string
  source: string
  metadata: {
    subject: string
    grade: string
    type: DocumentType
    year?: number
  }
}

/**
 * 검색 필터 UI 옵션
 */
export interface FilterOption {
  value: string
  label: string
}

// ============================================
// UI 상수
// ============================================

/** 과목 필터 옵션 */
export const SUBJECT_OPTIONS: FilterOption[] = [
  { value: '', label: '전체 과목' },
  { value: '수학', label: '수학' },
  { value: '영어', label: '영어' },
  { value: '국어', label: '국어' },
  { value: '과학', label: '과학' },
  { value: '사회', label: '사회' },
  { value: '한국사', label: '한국사' },
]

/** 학년 필터 옵션 */
export const GRADE_OPTIONS: FilterOption[] = [
  { value: '', label: '전체 학년' },
  { value: '초1', label: '초등 1학년' },
  { value: '초2', label: '초등 2학년' },
  { value: '초3', label: '초등 3학년' },
  { value: '초4', label: '초등 4학년' },
  { value: '초5', label: '초등 5학년' },
  { value: '초6', label: '초등 6학년' },
  { value: '중1', label: '중학 1학년' },
  { value: '중2', label: '중학 2학년' },
  { value: '중3', label: '중학 3학년' },
  { value: '고1', label: '고등 1학년' },
  { value: '고2', label: '고등 2학년' },
  { value: '고3', label: '고등 3학년' },
]

/** 출처 필터 옵션 */
export const SOURCE_OPTIONS: FilterOption[] = [
  { value: '', label: '전체 출처' },
  { value: 'exam', label: '기출문제' },
  { value: 'textbook', label: '교과서' },
  { value: 'mockexam', label: '모의고사' },
  { value: 'workbook', label: '문제집' },
]

/** 검색 결과 페이지 크기 */
export const SEARCH_PAGE_SIZE = 10

/** 최근 검색 히스토리 최대 개수 */
export const MAX_SEARCH_HISTORY = 10

/** 검색 입력 디바운스 시간 (ms) */
export const SEARCH_DEBOUNCE_MS = 300
