/**
 * 문제 검수(Validation) 관련 타입 정의
 *
 * PRD F1. 멀티 LLM 검수 기능을 위한 타입 정의입니다.
 * 여러 LLM(Gemini, GPT, Claude)을 사용하여 생성된 문제를 검수합니다.
 */

import type { Problem, ProblemOption } from './database'

// ============================================
// 검수 대상 문제 타입
// ============================================

/**
 * AI가 생성한 문제 인터페이스
 * 검수 API에 전달되는 문제 형식
 */
export interface GeneratedProblem {
  /** 문제 ID (임시 또는 저장된 ID) */
  id: string | number
  /** 문제 내용 */
  question: string
  /** 정답 */
  answer: string
  /** 풀이/해설 */
  solution?: string
  /** 난이도 (easy, medium, hard) */
  difficulty: 'easy' | 'medium' | 'hard'
  /** 문제 유형 */
  type: 'multiple_choice' | 'short_answer' | 'true_false' | 'essay'
  /** 객관식 보기 (객관식일 경우) */
  options?: ProblemOption[]
  /** 과목 */
  subject?: string
  /** 학년 */
  grade?: string
  /** 단원명 */
  unit?: string
}

// ============================================
// 검수기(Validator) 타입
// ============================================

/** 지원하는 검수 LLM 목록 */
export type ValidatorType = 'gemini' | 'gpt' | 'claude'

/** 검수기 한국어 라벨 */
export const VALIDATOR_LABELS: Record<ValidatorType, string> = {
  gemini: 'Google Gemini',
  gpt: 'OpenAI GPT',
  claude: 'Anthropic Claude',
}

/** 검수기 색상 (UI용) */
export const VALIDATOR_COLORS: Record<ValidatorType, string> = {
  gemini: '#4285F4', // Google 파란색
  gpt: '#10A37F', // OpenAI 초록색
  claude: '#D97706', // Anthropic 주황색
}

// ============================================
// 검수 입력/출력 타입
// ============================================

/**
 * 문제 검수 요청 입력
 */
export interface ValidateProblemInput {
  /** 검수할 문제 */
  problem: GeneratedProblem
  /** 사용할 LLM 목록 (Gemini, GPT, Claude 중 선택) */
  validators: ValidatorType[]
  /** 과목 정보 (맥락 제공용) */
  subject?: string
  /** 학년 정보 (맥락 제공용) */
  grade?: string
}

/**
 * 단일 검수기의 검수 결과
 */
export interface ValidationResult {
  /** 검수기 이름 */
  validator: ValidatorType
  /** 검수 통과 여부 (정확도 80점 이상이면 통과) */
  isValid: boolean
  /** 정확도 점수 (0-100) */
  accuracy: number
  /** 수정 제안 목록 */
  suggestions: string[]
  /** 난이도 적절성 여부 */
  difficultyMatch: boolean
  /** 오류 목록 (문제점 발견 시) */
  errors?: string[]
  /** 수정된 정답 (필요한 경우) */
  correctedAnswer?: string
  /** 수정된 풀이 (필요한 경우) */
  correctedSolution?: string
  /** 난이도에 대한 코멘트 */
  difficultyComment?: string
  /** 검수 소요 시간 (ms) */
  reviewTime?: number
}

/**
 * 문제 검수 통합 결과
 */
export interface ValidateProblemOutput {
  /** 각 검수기별 결과 */
  results: ValidationResult[]
  /** 모든 검수자 동의 여부 (모두 isValid가 true이면 true) */
  consensus: boolean
  /** 종합 점수 (각 검수기 정확도의 평균) */
  finalScore: number
  /** 합의된 수정 제안 (2개 이상의 검수기가 동의) */
  consensusSuggestions?: string[]
  /** 합의된 오류 (2개 이상의 검수기가 동의) */
  consensusErrors?: string[]
  /** 전체 검수 소요 시간 (ms) */
  totalTime?: number
}

// ============================================
// 대량 검수 타입
// ============================================

/**
 * 여러 문제 일괄 검수 요청
 */
export interface BatchValidateProblemInput {
  /** 검수할 문제 목록 */
  problems: GeneratedProblem[]
  /** 사용할 LLM 목록 */
  validators: ValidatorType[]
  /** 과목 정보 */
  subject?: string
  /** 학년 정보 */
  grade?: string
}

/**
 * 여러 문제 일괄 검수 결과
 */
export interface BatchValidateProblemOutput {
  /** 문제별 검수 결과 (문제 ID를 키로 사용) */
  results: Record<string | number, ValidateProblemOutput>
  /** 전체 통계 */
  summary: {
    /** 전체 문제 수 */
    total: number
    /** 검수 통과 문제 수 */
    passed: number
    /** 검수 실패 문제 수 */
    failed: number
    /** 전체 평균 점수 */
    averageScore: number
    /** 검수기별 평균 점수 */
    validatorScores: Record<ValidatorType, number>
  }
  /** 전체 소요 시간 (ms) */
  totalTime: number
}

// ============================================
// API 응답 타입
// ============================================

/**
 * 검수 API 응답
 */
export interface ValidationApiResponse<T> {
  /** 성공 여부 */
  success: boolean
  /** 응답 데이터 (성공 시) */
  data?: T
  /** 에러 메시지 (실패 시) */
  error?: string
  /** 상세 에러 정보 */
  details?: string
}

// ============================================
// UI 상태 타입
// ============================================

/**
 * 검수 진행 상태 (UI용)
 */
export interface ValidationUIState {
  /** 검수 진행 중 여부 */
  isValidating: boolean
  /** 현재 검수 중인 검수기 */
  currentValidator?: ValidatorType
  /** 진행률 (0-100) */
  progress: number
  /** 완료된 검수기 목록 */
  completedValidators: ValidatorType[]
  /** 에러 발생 검수기 목록 */
  errorValidators: ValidatorType[]
}

/**
 * 검수 결과 필터 옵션 (UI용)
 */
export interface ValidationFilterOptions {
  /** 특정 검수기만 표시 */
  validators?: ValidatorType[]
  /** 최소 정확도 점수 */
  minAccuracy?: number
  /** 통과한 결과만 표시 */
  passedOnly?: boolean
  /** 수정 제안이 있는 것만 표시 */
  hasSuggestions?: boolean
}
