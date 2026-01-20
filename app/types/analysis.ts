/**
 * EduFlow 학생 취약점 분석 관련 타입 정의
 *
 * 이 파일은 학생 오답 패턴 분석, 취약점 도출, 실천 가이드 생성에
 * 필요한 모든 타입을 정의합니다.
 */

import type { ProblemDifficulty, ProblemType } from './database'

// ============================================
// 오답 분석 관련 타입
// ============================================

/**
 * 개별 오답 기록
 */
export interface WrongAnswer {
  /** 문제 ID */
  problemId: string
  /** 과제 ID */
  assignmentId: string
  /** 과목 */
  subject: string
  /** 학년 */
  grade: string
  /** 단원 */
  unit: string
  /** 문제 내용 */
  question: string
  /** 정답 */
  correctAnswer: string
  /** 학생 답안 */
  studentAnswer: string
  /** 문제 난이도 */
  difficulty: ProblemDifficulty
  /** 문제 유형 */
  type: ProblemType
  /** 태그/개념 */
  tags?: string[]
  /** 틀린 날짜 */
  wrongAt: string
}

/**
 * 오답 패턴 분석 결과
 */
export interface WrongAnswerPattern {
  /** 패턴 ID */
  id: string
  /** 패턴 유형 (예: '계산 실수', '개념 미숙', '문제 이해 부족') */
  type: PatternType
  /** 패턴 설명 */
  description: string
  /** 발생 빈도 */
  frequency: number
  /** 관련 오답 목록 */
  relatedWrongAnswers: string[]
  /** 심각도 (1-5, 5가 가장 심각) */
  severity: number
}

/**
 * 오답 패턴 유형
 */
export type PatternType =
  | 'calculation_error'      // 계산 실수
  | 'concept_misunderstanding' // 개념 오해
  | 'incomplete_understanding' // 불완전한 이해
  | 'careless_mistake'       // 부주의한 실수
  | 'time_pressure'          // 시간 부족
  | 'question_misread'       // 문제 잘못 읽음
  | 'formula_confusion'      // 공식 혼동
  | 'application_difficulty' // 응용력 부족
  | 'unknown'               // 기타

/**
 * 패턴 유형 한국어 라벨
 */
export const PATTERN_TYPE_LABELS: Record<PatternType, string> = {
  calculation_error: '계산 실수',
  concept_misunderstanding: '개념 오해',
  incomplete_understanding: '불완전한 이해',
  careless_mistake: '부주의한 실수',
  time_pressure: '시간 부족',
  question_misread: '문제 잘못 읽음',
  formula_confusion: '공식 혼동',
  application_difficulty: '응용력 부족',
  unknown: '기타',
}

// ============================================
// 취약점 분석 관련 타입
// ============================================

/**
 * 단원별 취약점
 */
export interface UnitWeakness {
  /** 단원명 */
  unit: string
  /** 과목 */
  subject: string
  /** 총 문제 수 */
  totalProblems: number
  /** 틀린 문제 수 */
  wrongCount: number
  /** 정답률 (0-100) */
  correctRate: number
  /** 취약 정도 (1-5, 5가 가장 취약) */
  weaknessLevel: number
  /** 주요 오답 패턴 */
  mainPatterns: PatternType[]
  /** 관련 오답 기록 */
  wrongAnswers: WrongAnswer[]
}

/**
 * 개념별 취약점
 */
export interface ConceptWeakness {
  /** 개념/태그명 */
  concept: string
  /** 과목 */
  subject: string
  /** 관련 단원들 */
  relatedUnits: string[]
  /** 총 문제 수 */
  totalProblems: number
  /** 틀린 문제 수 */
  wrongCount: number
  /** 정답률 (0-100) */
  correctRate: number
  /** 취약 정도 (1-5, 5가 가장 취약) */
  weaknessLevel: number
  /** 주요 오답 패턴 */
  mainPatterns: PatternType[]
}

/**
 * 난이도별 성적 분포
 */
export interface DifficultyDistribution {
  /** 난이도 */
  difficulty: ProblemDifficulty
  /** 총 문제 수 */
  total: number
  /** 맞은 문제 수 */
  correct: number
  /** 정답률 */
  correctRate: number
}

/**
 * 학생 취약점 분석 결과
 */
export interface StudentWeaknessAnalysis {
  /** 학생 ID */
  studentId: string
  /** 학생 이름 */
  studentName: string
  /** 분석 기간 시작 */
  periodStart: string
  /** 분석 기간 종료 */
  periodEnd: string
  /** 분석 일시 */
  analyzedAt: string
  /** 총 문제 수 */
  totalProblems: number
  /** 틀린 문제 수 */
  totalWrong: number
  /** 전체 정답률 */
  overallCorrectRate: number
  /** 단원별 취약점 (취약 순으로 정렬) */
  unitWeaknesses: UnitWeakness[]
  /** 개념별 취약점 (취약 순으로 정렬) */
  conceptWeaknesses: ConceptWeakness[]
  /** 난이도별 성적 분포 */
  difficultyDistribution: DifficultyDistribution[]
  /** 주요 오답 패턴 (빈도 순) */
  topPatterns: WrongAnswerPattern[]
  /** AI 분석 요약 */
  aiSummary?: string
}

// ============================================
// Action Plan (실천 가이드) 관련 타입
// ============================================

/**
 * 학습 추천 항목
 */
export interface LearningRecommendation {
  /** 추천 ID */
  id: string
  /** 추천 유형 */
  type: RecommendationType
  /** 제목 */
  title: string
  /** 상세 설명 */
  description: string
  /** 대상 단원/개념 */
  targetArea: string
  /** 우선순위 (1이 가장 높음) */
  priority: number
  /** 예상 소요 시간 (분) */
  estimatedTime: number
  /** 추천 이유 */
  reason: string
  /** 관련 취약점 */
  relatedWeaknesses: string[]
}

/**
 * 추천 유형
 */
export type RecommendationType =
  | 'review_concept'      // 개념 복습
  | 'practice_problems'   // 문제 연습
  | 'watch_video'        // 동영상 강의
  | 'ask_teacher'        // 선생님 질문
  | 'study_group'        // 스터디 그룹
  | 'mock_test'          // 모의 테스트
  | 'error_note'         // 오답 노트 정리
  | 'formula_memorize'   // 공식 암기

/**
 * 추천 유형 한국어 라벨
 */
export const RECOMMENDATION_TYPE_LABELS: Record<RecommendationType, string> = {
  review_concept: '개념 복습',
  practice_problems: '문제 연습',
  watch_video: '동영상 강의',
  ask_teacher: '선생님 질문',
  study_group: '스터디 그룹',
  mock_test: '모의 테스트',
  error_note: '오답 노트 정리',
  formula_memorize: '공식 암기',
}

/**
 * 주간 학습 계획
 */
export interface WeeklyPlan {
  /** 주차 번호 (1부터 시작) */
  week: number
  /** 시작일 */
  startDate: string
  /** 종료일 */
  endDate: string
  /** 주간 목표 */
  goal: string
  /** 일별 학습 계획 */
  dailyPlans: DailyPlan[]
}

/**
 * 일별 학습 계획
 */
export interface DailyPlan {
  /** 요일 (0: 일요일 ~ 6: 토요일) */
  dayOfWeek: number
  /** 날짜 */
  date: string
  /** 학습 항목 목록 */
  items: LearningRecommendation[]
  /** 예상 총 소요 시간 (분) */
  totalTime: number
}

/**
 * Action Plan (실천 가이드)
 */
export interface ActionPlan {
  /** Plan ID */
  id: string
  /** 학생 ID */
  studentId: string
  /** 학생 이름 */
  studentName: string
  /** 생성 일시 */
  createdAt: string
  /** 유효 기간 시작 */
  validFrom: string
  /** 유효 기간 종료 */
  validTo: string
  /** 전체 목표 */
  overallGoal: string
  /** AI 맞춤형 분석 및 조언 */
  aiAdvice: string
  /** 학습 추천 목록 (우선순위 순) */
  recommendations: LearningRecommendation[]
  /** 주간 학습 계획 */
  weeklyPlans: WeeklyPlan[]
  /** 참고한 취약점 분석 ID */
  basedOnAnalysisId?: string
  /** 진행률 (0-100) */
  progress: number
  /** 완료한 추천 항목 ID 목록 */
  completedRecommendations: string[]
}

// ============================================
// API 요청/응답 타입
// ============================================

/**
 * 취약점 분석 요청
 */
export interface AnalysisRequest {
  /** 학생 ID */
  studentId: string
  /** 분석 기간 시작 (YYYY-MM-DD) */
  periodStart?: string
  /** 분석 기간 종료 (YYYY-MM-DD) */
  periodEnd?: string
  /** 특정 과목만 분석 */
  subjects?: string[]
  /** AI 분석 포함 여부 */
  includeAiSummary?: boolean
}

/**
 * 취약점 분석 응답
 */
export interface AnalysisResponse {
  success: boolean
  data?: StudentWeaknessAnalysis
  error?: string
}

/**
 * Action Plan 생성 요청
 */
export interface ActionPlanRequest {
  /** 학생 ID */
  studentId: string
  /** 계획 기간 (주 단위, 기본값: 4) */
  planWeeks?: number
  /** 일일 학습 시간 (분, 기본값: 60) */
  dailyStudyTime?: number
  /** 특정 과목에 집중 */
  focusSubjects?: string[]
  /** 참고할 취약점 분석 ID */
  analysisId?: string
}

/**
 * Action Plan 응답
 */
export interface ActionPlanResponse {
  success: boolean
  data?: ActionPlan
  error?: string
}

/**
 * 분석 목록 응답
 */
export interface AnalysisListResponse {
  success: boolean
  data?: {
    analyses: StudentWeaknessAnalysis[]
    total: number
  }
  error?: string
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 정답률로 취약 정도 계산 (1-5)
 */
export function calculateWeaknessLevel(correctRate: number): number {
  if (correctRate >= 90) return 1
  if (correctRate >= 75) return 2
  if (correctRate >= 60) return 3
  if (correctRate >= 40) return 4
  return 5
}

/**
 * 취약 정도에 따른 한국어 라벨
 */
export function getWeaknessLabel(level: number): string {
  const labels: Record<number, string> = {
    1: '양호',
    2: '보통',
    3: '주의',
    4: '취약',
    5: '매우 취약',
  }
  return labels[level] || '알 수 없음'
}

/**
 * 취약 정도에 따른 색상 클래스
 */
export function getWeaknessColorClass(level: number): string {
  const colors: Record<number, string> = {
    1: 'bg-green-100 text-green-700',
    2: 'bg-blue-100 text-blue-700',
    3: 'bg-yellow-100 text-yellow-700',
    4: 'bg-orange-100 text-orange-700',
    5: 'bg-red-100 text-red-700',
  }
  return colors[level] || 'bg-gray-100 text-gray-700'
}

/**
 * 우선순위에 따른 한국어 라벨
 */
export function getPriorityLabel(priority: number): string {
  if (priority <= 1) return '매우 높음'
  if (priority <= 2) return '높음'
  if (priority <= 3) return '보통'
  if (priority <= 4) return '낮음'
  return '매우 낮음'
}
