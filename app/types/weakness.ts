/**
 * EduFlow 취약점 분석 타입 정의
 *
 * 학생의 오답 패턴 분석, 취약 단원/개념 식별, 추천 학습 내용 생성에 필요한 타입을 정의합니다.
 */

// ============================================
// 채점 결과 타입
// ============================================

/**
 * 채점 결과 - 분석의 입력 데이터
 */
export interface GradingResult {
  id: string                      // 채점 결과 ID
  studentId: string               // 학생 ID
  problemId: string               // 문제 ID
  subject: string                 // 과목
  unit: string                    // 단원
  concept?: string                // 관련 개념
  difficulty: 'easy' | 'medium' | 'hard'  // 문제 난이도
  isCorrect: boolean              // 정답 여부
  studentAnswer: string           // 학생 답안
  correctAnswer: string           // 정답
  score: number                   // 획득 점수
  maxScore: number                // 만점
  problemType: 'multiple_choice' | 'short_answer' | 'essay'  // 문제 유형
  errorType?: ErrorType           // 오류 유형 (틀린 경우)
  gradedAt: string                // 채점 시간 (ISO 8601)
}

/**
 * 오류 유형
 */
export type ErrorType =
  | 'calculation'     // 계산 실수
  | 'concept'         // 개념 이해 부족
  | 'careless'        // 부주의 (문제 잘못 읽음)
  | 'method'          // 풀이 방법 오류
  | 'incomplete'      // 불완전한 답변
  | 'time'            // 시간 부족
  | 'unknown'         // 분류 불가

/**
 * 오류 유형 한국어 라벨
 */
export const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  calculation: '계산 실수',
  concept: '개념 이해 부족',
  careless: '부주의',
  method: '풀이 방법 오류',
  incomplete: '불완전한 답변',
  time: '시간 부족',
  unknown: '분류 불가',
}

// ============================================
// 취약점 분석 결과 타입
// ============================================

/**
 * 취약 단원 정보
 */
export interface WeakUnit {
  unit: string                    // 단원명
  subject: string                 // 과목
  totalProblems: number           // 총 문제 수
  wrongCount: number              // 오답 수
  correctRate: number             // 정답률 (0-100)
  weaknessLevel: WeaknessLevel    // 취약 정도
  recentTrend: 'improving' | 'declining' | 'stable'  // 최근 추세
  mainErrorTypes: ErrorType[]     // 주요 오류 유형들
}

/**
 * 취약 개념 정보
 */
export interface WeakConcept {
  concept: string                 // 개념명
  subject: string                 // 과목
  relatedUnits: string[]          // 관련 단원들
  totalProblems: number           // 총 문제 수
  wrongCount: number              // 오답 수
  correctRate: number             // 정답률 (0-100)
  weaknessLevel: WeaknessLevel    // 취약 정도
  description?: string            // 개념 설명
}

/**
 * 취약 정도
 */
export type WeaknessLevel = 'critical' | 'high' | 'medium' | 'low'

/**
 * 취약 정도 한국어 라벨
 */
export const WEAKNESS_LEVEL_LABELS: Record<WeaknessLevel, string> = {
  critical: '매우 취약',
  high: '취약',
  medium: '보통',
  low: '양호',
}

/**
 * 취약 정도별 색상 클래스
 */
export const WEAKNESS_LEVEL_COLORS: Record<WeaknessLevel, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

/**
 * 오답 패턴 정보
 */
export interface ErrorPattern {
  id: string                      // 패턴 ID
  type: ErrorType                 // 오류 유형
  description: string             // 패턴 설명
  frequency: number               // 발생 빈도 (%)
  examples: string[]              // 대표 예시 문제 ID들
  severity: 'high' | 'medium' | 'low'  // 심각도
  recommendation: string          // 개선 권장사항
}

/**
 * 난이도별 분포
 */
export interface DifficultyDistribution {
  easy: { total: number; correct: number; rate: number }
  medium: { total: number; correct: number; rate: number }
  hard: { total: number; correct: number; rate: number }
}

/**
 * 과목별 통계
 */
export interface SubjectStats {
  subject: string                 // 과목명
  totalProblems: number           // 총 문제 수
  correctCount: number            // 정답 수
  correctRate: number             // 정답률
  averageScore: number            // 평균 점수
  weakUnits: string[]             // 취약 단원 목록
}

// ============================================
// 추천 학습 내용 타입
// ============================================

/**
 * 학습 추천 항목
 */
export interface LearningRecommendation {
  id: string                      // 추천 ID
  type: RecommendationType        // 추천 유형
  priority: 'high' | 'medium' | 'low'  // 우선순위
  title: string                   // 추천 제목
  description: string             // 추천 설명
  targetUnit?: string             // 대상 단원
  targetConcept?: string          // 대상 개념
  estimatedTime?: number          // 예상 학습 시간 (분)
  resources?: LearningResource[]  // 추천 학습 자료
}

/**
 * 추천 유형
 */
export type RecommendationType =
  | 'review_unit'         // 단원 복습
  | 'practice_problems'   // 문제 연습
  | 'concept_study'       // 개념 학습
  | 'error_prevention'    // 실수 방지 훈련
  | 'difficulty_step_up'  // 난이도 상향

/**
 * 추천 유형 한국어 라벨
 */
export const RECOMMENDATION_TYPE_LABELS: Record<RecommendationType, string> = {
  review_unit: '단원 복습',
  practice_problems: '문제 연습',
  concept_study: '개념 학습',
  error_prevention: '실수 방지 훈련',
  difficulty_step_up: '난이도 상향',
}

/**
 * 학습 자료
 */
export interface LearningResource {
  id: string                      // 자료 ID
  type: 'video' | 'document' | 'problem_set' | 'quiz'  // 자료 유형
  title: string                   // 자료 제목
  url?: string                    // 자료 URL
  problemSetId?: string           // 문제 세트 ID (문제 세트인 경우)
}

// ============================================
// 취약점 분석 보고서 타입
// ============================================

/**
 * 취약점 분석 보고서 - 전체 분석 결과
 */
export interface WeaknessReport {
  id: string                      // 보고서 ID
  studentId: string               // 학생 ID
  studentName?: string            // 학생 이름
  analyzedAt: string              // 분석 일시 (ISO 8601)
  periodStart: string             // 분석 기간 시작
  periodEnd: string               // 분석 기간 종료

  // 전체 요약
  summary: {
    totalProblems: number         // 총 문제 수
    totalCorrect: number          // 정답 수
    totalWrong: number            // 오답 수
    overallCorrectRate: number    // 전체 정답률
    averageScore: number          // 평균 점수
  }

  // 과목별 통계
  subjectStats: SubjectStats[]

  // 난이도별 분포
  difficultyDistribution: DifficultyDistribution

  // 취약 단원 목록 (정답률 낮은 순)
  weakUnits: WeakUnit[]

  // 취약 개념 목록 (정답률 낮은 순)
  weakConcepts: WeakConcept[]

  // 오답 패턴 분석
  errorPatterns: ErrorPattern[]

  // 학습 추천
  recommendations: LearningRecommendation[]

  // AI 분석 요약 (Claude API 사용)
  aiSummary?: string

  // AI 맞춤형 조언
  aiAdvice?: string
}

// ============================================
// API 요청/응답 타입
// ============================================

/**
 * 취약점 분석 요청
 */
export interface WeaknessAnalysisRequest {
  studentId: string               // 학생 ID (필수)
  periodStart?: string            // 분석 기간 시작 (YYYY-MM-DD)
  periodEnd?: string              // 분석 기간 종료 (YYYY-MM-DD)
  subjects?: string[]             // 분석할 과목들 (미지정시 전체)
  includeAiAnalysis?: boolean     // AI 분석 포함 여부 (기본값: true)
  gradingResults?: GradingResult[]  // 직접 전달하는 채점 결과 (선택)
}

/**
 * 취약점 분석 응답
 */
export interface WeaknessAnalysisResponse {
  success: boolean
  data?: WeaknessReport
  error?: string
}

/**
 * 취약점 목록 조회 응답 (간략 버전)
 */
export interface WeaknessListResponse {
  success: boolean
  data?: {
    studentId: string
    weakUnits: Pick<WeakUnit, 'unit' | 'subject' | 'correctRate' | 'weaknessLevel'>[]
    weakConcepts: Pick<WeakConcept, 'concept' | 'subject' | 'correctRate' | 'weaknessLevel'>[]
    lastAnalyzedAt?: string
  }
  error?: string
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 정답률에 따른 취약 정도 계산
 */
export function getWeaknessLevel(correctRate: number): WeaknessLevel {
  if (correctRate < 40) return 'critical'
  if (correctRate < 60) return 'high'
  if (correctRate < 80) return 'medium'
  return 'low'
}

/**
 * 정답률 계산
 */
export function calculateCorrectRate(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

/**
 * 최근 추세 계산 (최근 5개 결과 기반)
 */
export function calculateTrend(
  recentResults: { isCorrect: boolean; gradedAt: string }[]
): 'improving' | 'declining' | 'stable' {
  if (recentResults.length < 3) return 'stable'

  // 시간순 정렬
  const sorted = [...recentResults].sort(
    (a, b) => new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime()
  )

  const half = Math.floor(sorted.length / 2)
  const firstHalf = sorted.slice(0, half)
  const secondHalf = sorted.slice(half)

  const firstRate = firstHalf.filter(r => r.isCorrect).length / firstHalf.length
  const secondRate = secondHalf.filter(r => r.isCorrect).length / secondHalf.length

  const diff = secondRate - firstRate
  if (diff > 0.1) return 'improving'
  if (diff < -0.1) return 'declining'
  return 'stable'
}
