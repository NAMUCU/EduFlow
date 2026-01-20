/**
 * AI 문제 검수 타입 정의
 *
 * 이 파일은 AI 문제 검수 기능에 필요한 모든 타입을 정의합니다.
 * Claude, Gemini, OpenAI 등 여러 AI 모델을 사용한 검수 결과를 관리합니다.
 */

/** AI 모델 타입 */
export type AIModel = 'claude' | 'gemini' | 'openai'

/** AI 모델 한국어 라벨 */
export const AI_MODEL_LABELS: Record<AIModel, string> = {
  claude: 'Claude',
  gemini: 'Gemini',
  openai: 'ChatGPT',
}

/** AI 모델 아이콘 색상 */
export const AI_MODEL_COLORS: Record<AIModel, string> = {
  claude: '#D97706', // 주황색
  gemini: '#4285F4', // 파란색
  openai: '#10A37F', // 초록색
}

/**
 * 검수용 문제 인터페이스
 * 검수 API에 전달되는 문제 형식
 */
export interface ProblemForReview {
  id: number
  question: string
  answer: string
  solution: string
  difficulty: string
  type: string
  unit?: string
  subject?: string
  grade?: string
}

/**
 * 단일 AI 모델의 검수 결과
 */
export interface ReviewResult {
  /** 문제 ID */
  problemId: number
  /** 검수에 사용된 AI 모델 */
  model: AIModel
  /** 정확도 점수 (0-100) */
  accuracy: number
  /** 발견된 문제점 목록 */
  issues: string[]
  /** 개선 제안 목록 */
  suggestions: string[]
  /** 수정된 정답 (필요한 경우) */
  correctedAnswer?: string
  /** 수정된 풀이 (필요한 경우) */
  correctedSolution?: string
  /** 난이도 적절성 평가 (0-100) */
  difficultyScore?: number
  /** 난이도 관련 코멘트 */
  difficultyComment?: string
  /** 검수 소요 시간 (ms) */
  reviewTime?: number
}

/**
 * 문제별 전체 검수 결과
 * 여러 AI 모델의 검수 결과를 통합
 */
export interface ProblemReviewSummary {
  /** 문제 ID */
  problemId: number
  /** 원본 문제 */
  originalProblem: ProblemForReview
  /** 각 AI 모델별 검수 결과 */
  reviews: ReviewResult[]
  /** 평균 정확도 점수 */
  averageAccuracy: number
  /** 합의된 문제점 (2개 이상의 AI가 동의) */
  consensusIssues: string[]
  /** 합의된 개선 제안 */
  consensusSuggestions: string[]
  /** 검수 상태 */
  status: 'pending' | 'completed' | 'error'
  /** 전체 검수 완료 시간 */
  completedAt?: string
}

/**
 * 검수 요청 인터페이스
 */
export interface ReviewRequest {
  /** 검수할 문제 목록 */
  problems: ProblemForReview[]
  /** 사용할 AI 모델 목록 */
  models: AIModel[]
  /** 과목 정보 (맥락 제공용) */
  subject?: string
  /** 학년 정보 (맥락 제공용) */
  grade?: string
}

/**
 * 검수 응답 인터페이스
 */
export interface ReviewResponse {
  /** 검수 성공 여부 */
  success: boolean
  /** 문제별 검수 요약 */
  summaries: ProblemReviewSummary[]
  /** 전체 검수 소요 시간 (ms) */
  totalTime: number
  /** 에러 메시지 (실패 시) */
  error?: string
}

/**
 * 검수 상태 UI용 타입
 */
export interface ReviewUIState {
  /** 검수 진행 중 여부 */
  isReviewing: boolean
  /** 현재 검수 중인 모델 */
  currentModel?: AIModel
  /** 진행률 (0-100) */
  progress: number
  /** 완료된 문제 수 */
  completedProblems: number
  /** 전체 문제 수 */
  totalProblems: number
}

/**
 * 검수 결과 필터 옵션
 */
export interface ReviewFilterOptions {
  /** 특정 모델만 표시 */
  models?: AIModel[]
  /** 최소 정확도 점수 */
  minAccuracy?: number
  /** 문제점이 있는 것만 표시 */
  hasIssues?: boolean
  /** 개선 제안이 있는 것만 표시 */
  hasSuggestions?: boolean
}

/**
 * 검수 결과 정렬 옵션
 */
export type ReviewSortOption =
  | 'problemId'
  | 'accuracy-asc'
  | 'accuracy-desc'
  | 'issues-count'

/**
 * 검수 통계 정보
 */
export interface ReviewStatistics {
  /** 전체 문제 수 */
  totalProblems: number
  /** 평균 정확도 */
  averageAccuracy: number
  /** 문제점이 발견된 문제 수 */
  problemsWithIssues: number
  /** 모델별 평균 정확도 */
  modelAccuracies: Record<AIModel, number>
  /** 가장 흔한 문제점 (상위 5개) */
  topIssues: { issue: string; count: number }[]
}
