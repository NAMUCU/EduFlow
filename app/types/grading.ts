/**
 * EduFlow 자동 채점 관련 타입 정의
 *
 * 이 파일은 자동 채점 API에서 사용하는 모든 타입을 정의합니다.
 * - 채점 요청/응답 타입
 * - 문제 유형별 채점 결과 타입
 * - AI 서술형 채점 관련 타입
 */

import { ProblemType, ProblemDifficulty, Problem } from './database'

// ============================================
// 채점 요청 타입
// ============================================

/**
 * 개별 문제에 대한 학생 답안
 */
export interface StudentAnswerInput {
  /** 문제 ID */
  problem_id: string
  /** 학생이 제출한 답안 */
  answer: string
  /** 제출 시간 (선택적) */
  submitted_at?: string
}

/**
 * 채점 요청 본문
 */
export interface GradingRequest {
  /** 과제 ID (선택적 - 과제 기반 채점 시) */
  assignment_id?: string
  /** 학생 ID */
  student_id: string
  /** 학생 답안 배열 */
  answers: StudentAnswerInput[]
  /** 채점 옵션 */
  options?: GradingOptions
}

/**
 * 채점 옵션
 */
export interface GradingOptions {
  /** 부분 점수 허용 여부 (기본값: true) */
  allow_partial_credit?: boolean
  /** 서술형 AI 채점 사용 여부 (기본값: true) */
  use_ai_for_essay?: boolean
  /** 대소문자 구분 여부 - 단답형 (기본값: false) */
  case_sensitive?: boolean
  /** 공백 무시 여부 - 단답형 (기본값: true) */
  ignore_whitespace?: boolean
  /** 피드백 생성 여부 (기본값: true) */
  generate_feedback?: boolean
  /** 서술형 채점 상세도 ('basic' | 'detailed') */
  essay_detail_level?: 'basic' | 'detailed'
}

// ============================================
// 채점 결과 타입
// ============================================

/**
 * 개별 문제 채점 결과
 */
export interface ProblemGradingResult {
  /** 문제 ID */
  problem_id: string
  /** 문제 유형 */
  problem_type: ProblemType
  /** 정답 여부 */
  is_correct: boolean
  /** 획득 점수 */
  score: number
  /** 배점 (만점) */
  max_score: number
  /** 점수 비율 (0~100) */
  score_percentage: number
  /** 정답 */
  correct_answer: string
  /** 학생 답안 */
  student_answer: string
  /** 피드백 메시지 */
  feedback: string
  /** AI 채점 결과 (서술형인 경우) */
  ai_evaluation?: AIEssayEvaluation
  /** 채점 시간 (ms) */
  grading_time_ms: number
}

/**
 * 전체 채점 결과 응답
 */
export interface GradingResponse {
  /** 성공 여부 */
  success: boolean
  /** 오류 메시지 (실패 시) */
  error?: string
  /** 채점 결과 데이터 */
  data?: GradingResultData
}

/**
 * 채점 결과 데이터
 */
export interface GradingResultData {
  /** 학생 ID */
  student_id: string
  /** 과제 ID (과제 기반 채점 시) */
  assignment_id?: string
  /** 개별 문제 채점 결과 */
  results: ProblemGradingResult[]
  /** 요약 통계 */
  summary: GradingSummary
  /** 채점 완료 시간 */
  graded_at: string
  /** 전체 채점 소요 시간 (ms) */
  total_grading_time_ms: number
}

/**
 * 채점 요약 통계
 */
export interface GradingSummary {
  /** 총 문제 수 */
  total_problems: number
  /** 정답 문제 수 */
  correct_count: number
  /** 부분 정답 문제 수 */
  partial_count: number
  /** 오답 문제 수 */
  incorrect_count: number
  /** 총 획득 점수 */
  total_score: number
  /** 총 배점 (만점) */
  max_total_score: number
  /** 전체 점수율 (0~100) */
  score_percentage: number
  /** 문제 유형별 정답률 */
  accuracy_by_type: Record<ProblemType, TypeAccuracy>
  /** 난이도별 정답률 */
  accuracy_by_difficulty: Record<ProblemDifficulty, DifficultyAccuracy>
}

/**
 * 문제 유형별 정답률
 */
export interface TypeAccuracy {
  /** 문제 수 */
  count: number
  /** 정답 수 */
  correct: number
  /** 정답률 (0~100) */
  percentage: number
}

/**
 * 난이도별 정답률
 */
export interface DifficultyAccuracy {
  /** 문제 수 */
  count: number
  /** 정답 수 */
  correct: number
  /** 정답률 (0~100) */
  percentage: number
}

// ============================================
// AI 서술형 채점 타입
// ============================================

/**
 * AI 서술형 답안 평가 결과
 */
export interface AIEssayEvaluation {
  /** 전체 점수 (0~100) */
  overall_score: number
  /** 평가 항목별 점수 */
  criteria_scores: EssayCriteriaScore[]
  /** AI 종합 피드백 */
  overall_feedback: string
  /** 강점 */
  strengths: string[]
  /** 개선점 */
  improvements: string[]
  /** AI 모델 정보 */
  model_used: string
  /** AI 응답 신뢰도 (0~1) */
  confidence: number
}

/**
 * 서술형 평가 항목별 점수
 */
export interface EssayCriteriaScore {
  /** 평가 항목 */
  criteria: EssayCriteria
  /** 항목 점수 (0~100) */
  score: number
  /** 항목별 피드백 */
  feedback: string
}

/**
 * 서술형 평가 항목
 */
export type EssayCriteria =
  | 'accuracy'        // 정확성: 핵심 개념 이해도
  | 'completeness'    // 완성도: 답안의 완결성
  | 'logic'           // 논리성: 논리적 전개
  | 'expression'      // 표현력: 문장 구성 및 용어 사용

/**
 * 서술형 평가 항목 한국어 라벨
 */
export const ESSAY_CRITERIA_LABELS: Record<EssayCriteria, string> = {
  accuracy: '정확성',
  completeness: '완성도',
  logic: '논리성',
  expression: '표현력',
}

/**
 * 서술형 평가 항목 가중치 (합계 = 1)
 */
export const ESSAY_CRITERIA_WEIGHTS: Record<EssayCriteria, number> = {
  accuracy: 0.4,      // 40%
  completeness: 0.3,  // 30%
  logic: 0.2,         // 20%
  expression: 0.1,    // 10%
}

// ============================================
// 내부 처리용 타입
// ============================================

/**
 * 문제 정보와 정답 (캐싱용)
 */
export interface ProblemWithAnswer {
  id: string
  type: ProblemType
  difficulty: ProblemDifficulty
  question: string
  answer: string
  solution: string | null
  options: { id: string; text: string; is_correct?: boolean }[] | null
  max_score: number  // 문제별 배점
}

/**
 * 채점 컨텍스트 (내부 처리용)
 */
export interface GradingContext {
  problem: ProblemWithAnswer
  student_answer: string
  options: GradingOptions
}

// ============================================
// 유틸리티 상수
// ============================================

/** 기본 채점 옵션 */
export const DEFAULT_GRADING_OPTIONS: Required<GradingOptions> = {
  allow_partial_credit: true,
  use_ai_for_essay: true,
  case_sensitive: false,
  ignore_whitespace: true,
  generate_feedback: true,
  essay_detail_level: 'detailed',
}

/** 문제 유형별 기본 배점 */
export const DEFAULT_SCORES_BY_TYPE: Record<ProblemType, number> = {
  multiple_choice: 10,
  short_answer: 10,
  true_false: 5,
  essay: 20,
}

/** 난이도별 배점 가중치 */
export const DIFFICULTY_SCORE_MULTIPLIER: Record<ProblemDifficulty, number> = {
  easy: 0.8,
  medium: 1.0,
  hard: 1.3,
}
