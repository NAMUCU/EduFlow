/**
 * 취약점 분석 서비스
 *
 * 학생의 채점 결과를 분석하여 취약 단원/개념을 식별하고
 * AI를 활용해 맞춤형 학습 추천을 제공합니다.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type {
  GradingResult,
  WeaknessReport,
  WeakUnit,
  WeakConcept,
  ErrorPattern,
  ErrorType,
  SubjectStats,
  DifficultyDistribution,
  LearningRecommendation,
  RecommendationType,
  getWeaknessLevel,
  calculateCorrectRate,
  calculateTrend,
} from '@/types/weakness'
import {
  getWeaknessLevel as getLevel,
  calculateCorrectRate as calcRate,
  calculateTrend as calcTrend,
} from '@/types/weakness'

// ============================================
// Claude API 클라이언트
// ============================================

const isClaudeConfigured = () => !!process.env.ANTHROPIC_API_KEY
let claudeClient: Anthropic | null = null
const getClaudeClient = () =>
  claudeClient || (claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }))

// ============================================
// Mock 데이터
// ============================================

const mockGradingResults: GradingResult[] = [
  // 수학 - 이차방정식 (취약)
  { id: 'gr-001', studentId: 'student-001', problemId: 'p-001', subject: '수학', unit: '이차방정식', concept: '인수분해', difficulty: 'medium', isCorrect: false, studentAnswer: 'x=2, x=4', correctAnswer: 'x=2, x=3', score: 0, maxScore: 10, problemType: 'short_answer', errorType: 'calculation', gradedAt: '2024-02-10T10:00:00Z' },
  { id: 'gr-002', studentId: 'student-001', problemId: 'p-002', subject: '수학', unit: '이차방정식', concept: '근의 공식', difficulty: 'hard', isCorrect: false, studentAnswer: 'x=1', correctAnswer: 'x=(-1±√5)/2', score: 0, maxScore: 10, problemType: 'short_answer', errorType: 'concept', gradedAt: '2024-02-11T10:00:00Z' },
  { id: 'gr-003', studentId: 'student-001', problemId: 'p-003', subject: '수학', unit: '이차방정식', concept: '판별식', difficulty: 'medium', isCorrect: true, studentAnswer: '2', correctAnswer: '2', score: 10, maxScore: 10, problemType: 'short_answer', gradedAt: '2024-02-12T10:00:00Z' },
  { id: 'gr-004', studentId: 'student-001', problemId: 'p-004', subject: '수학', unit: '이차방정식', concept: '인수분해', difficulty: 'easy', isCorrect: false, studentAnswer: '(x-1)(x-3)', correctAnswer: '(x-1)(x-2)', score: 0, maxScore: 10, problemType: 'short_answer', errorType: 'careless', gradedAt: '2024-02-13T10:00:00Z' },

  // 수학 - 함수 (양호)
  { id: 'gr-005', studentId: 'student-001', problemId: 'p-005', subject: '수학', unit: '함수', concept: '일차함수', difficulty: 'easy', isCorrect: true, studentAnswer: 'y=2x+1', correctAnswer: 'y=2x+1', score: 10, maxScore: 10, problemType: 'short_answer', gradedAt: '2024-02-14T10:00:00Z' },
  { id: 'gr-006', studentId: 'student-001', problemId: 'p-006', subject: '수학', unit: '함수', concept: '이차함수', difficulty: 'medium', isCorrect: true, studentAnswer: '(1, 2)', correctAnswer: '(1, 2)', score: 10, maxScore: 10, problemType: 'short_answer', gradedAt: '2024-02-15T10:00:00Z' },
  { id: 'gr-007', studentId: 'student-001', problemId: 'p-007', subject: '수학', unit: '함수', concept: '이차함수', difficulty: 'hard', isCorrect: true, studentAnswer: 'a=2', correctAnswer: 'a=2', score: 10, maxScore: 10, problemType: 'short_answer', gradedAt: '2024-02-16T10:00:00Z' },
  { id: 'gr-008', studentId: 'student-001', problemId: 'p-008', subject: '수학', unit: '함수', concept: '함수의 그래프', difficulty: 'medium', isCorrect: false, studentAnswer: '3', correctAnswer: '4', score: 0, maxScore: 10, problemType: 'short_answer', errorType: 'calculation', gradedAt: '2024-02-17T10:00:00Z' },

  // 영어 - 문법 (보통)
  { id: 'gr-009', studentId: 'student-001', problemId: 'p-009', subject: '영어', unit: '문법', concept: '관계대명사', difficulty: 'medium', isCorrect: true, studentAnswer: 'which', correctAnswer: 'which', score: 10, maxScore: 10, problemType: 'multiple_choice', gradedAt: '2024-02-10T11:00:00Z' },
  { id: 'gr-010', studentId: 'student-001', problemId: 'p-010', subject: '영어', unit: '문법', concept: '시제', difficulty: 'easy', isCorrect: true, studentAnswer: 'had been', correctAnswer: 'had been', score: 10, maxScore: 10, problemType: 'multiple_choice', gradedAt: '2024-02-11T11:00:00Z' },
  { id: 'gr-011', studentId: 'student-001', problemId: 'p-011', subject: '영어', unit: '문법', concept: '가정법', difficulty: 'hard', isCorrect: false, studentAnswer: 'would be', correctAnswer: 'would have been', score: 0, maxScore: 10, problemType: 'multiple_choice', errorType: 'concept', gradedAt: '2024-02-12T11:00:00Z' },
  { id: 'gr-012', studentId: 'student-001', problemId: 'p-012', subject: '영어', unit: '문법', concept: '수동태', difficulty: 'medium', isCorrect: true, studentAnswer: 'was written', correctAnswer: 'was written', score: 10, maxScore: 10, problemType: 'multiple_choice', gradedAt: '2024-02-13T11:00:00Z' },
]

const mockWeaknessReport: WeaknessReport = {
  id: 'report-001',
  studentId: 'student-001',
  studentName: '김민수',
  analyzedAt: new Date().toISOString(),
  periodStart: '2024-02-01',
  periodEnd: '2024-02-28',

  summary: {
    totalProblems: 12,
    totalCorrect: 7,
    totalWrong: 5,
    overallCorrectRate: 58,
    averageScore: 58,
  },

  subjectStats: [
    { subject: '수학', totalProblems: 8, correctCount: 4, correctRate: 50, averageScore: 50, weakUnits: ['이차방정식'] },
    { subject: '영어', totalProblems: 4, correctCount: 3, correctRate: 75, averageScore: 75, weakUnits: ['문법'] },
  ],

  difficultyDistribution: {
    easy: { total: 3, correct: 2, rate: 67 },
    medium: { total: 6, correct: 4, rate: 67 },
    hard: { total: 3, correct: 1, rate: 33 },
  },

  weakUnits: [
    { unit: '이차방정식', subject: '수학', totalProblems: 4, wrongCount: 3, correctRate: 25, weaknessLevel: 'critical', recentTrend: 'stable', mainErrorTypes: ['calculation', 'concept'] },
    { unit: '함수', subject: '수학', totalProblems: 4, wrongCount: 1, correctRate: 75, weaknessLevel: 'medium', recentTrend: 'improving', mainErrorTypes: ['calculation'] },
    { unit: '문법', subject: '영어', totalProblems: 4, wrongCount: 1, correctRate: 75, weaknessLevel: 'medium', recentTrend: 'stable', mainErrorTypes: ['concept'] },
  ],

  weakConcepts: [
    { concept: '인수분해', subject: '수학', relatedUnits: ['이차방정식'], totalProblems: 2, wrongCount: 2, correctRate: 0, weaknessLevel: 'critical', description: '다항식을 곱의 형태로 분해하는 방법' },
    { concept: '근의 공식', subject: '수학', relatedUnits: ['이차방정식'], totalProblems: 1, wrongCount: 1, correctRate: 0, weaknessLevel: 'critical', description: '이차방정식의 근을 구하는 공식' },
    { concept: '가정법', subject: '영어', relatedUnits: ['문법'], totalProblems: 1, wrongCount: 1, correctRate: 0, weaknessLevel: 'critical', description: '실제가 아닌 상황을 가정하여 표현하는 문법' },
  ],

  errorPatterns: [
    { id: 'ep-001', type: 'calculation', description: '계산 과정에서 부호 또는 숫자 실수 발생', frequency: 40, examples: ['gr-001', 'gr-008'], severity: 'high', recommendation: '계산 후 검산 습관을 기르고, 중요한 단계마다 다시 확인하세요.' },
    { id: 'ep-002', type: 'concept', description: '핵심 개념에 대한 이해 부족', frequency: 40, examples: ['gr-002', 'gr-011'], severity: 'high', recommendation: '관련 개념을 교과서로 다시 복습하고, 기본 문제부터 차근차근 풀어보세요.' },
    { id: 'ep-003', type: 'careless', description: '문제를 꼼꼼히 읽지 않아 발생하는 실수', frequency: 20, examples: ['gr-004'], severity: 'medium', recommendation: '문제를 두 번 읽고, 조건을 밑줄 치는 습관을 들이세요.' },
  ],

  recommendations: [
    { id: 'rec-001', type: 'concept_study', priority: 'high', title: '인수분해 개념 복습', description: '인수분해의 기본 원리와 다양한 방법(공통인수, 완전제곱식, 합차공식)을 복습하세요.', targetConcept: '인수분해', estimatedTime: 60 },
    { id: 'rec-002', type: 'practice_problems', priority: 'high', title: '이차방정식 기본 문제 연습', description: '인수분해를 활용한 이차방정식 풀이 문제를 집중적으로 연습하세요.', targetUnit: '이차방정식', estimatedTime: 45 },
    { id: 'rec-003', type: 'error_prevention', priority: 'medium', title: '계산 실수 방지 훈련', description: '검산 습관을 기르기 위한 체크리스트를 활용하여 계산 실수를 줄이세요.', estimatedTime: 30 },
    { id: 'rec-004', type: 'concept_study', priority: 'medium', title: '가정법 개념 학습', description: '영어 가정법의 시제 변화와 용법을 정리하세요.', targetConcept: '가정법', estimatedTime: 45 },
  ],

  aiSummary: '김민수 학생은 수학 이차방정식 단원에서 특히 어려움을 겪고 있습니다. 인수분해와 근의 공식에 대한 개념 이해가 부족하며, 계산 실수도 자주 발생합니다. 반면 함수 단원과 영어 문법은 비교적 양호한 성적을 보이고 있습니다.',
  aiAdvice: '우선 인수분해의 기본 원리를 다시 학습한 후, 쉬운 문제부터 차근차근 풀어나가는 것을 추천합니다. 계산 후에는 반드시 검산하는 습관을 기르세요. 매일 15분씩 기본 문제를 풀면 2주 내에 눈에 띄는 발전이 있을 것입니다.',
}

// ============================================
// 채점 결과 조회 함수
// ============================================

/**
 * 학생의 채점 결과 조회
 */
async function fetchGradingResults(
  studentId: string,
  options: {
    periodStart?: string
    periodEnd?: string
    subjects?: string[]
  }
): Promise<GradingResult[]> {
  // Mock 모드
  if (!isSupabaseConfigured()) {
    let results = mockGradingResults.filter(r => r.studentId === studentId)

    if (options.periodStart) {
      results = results.filter(r => r.gradedAt >= options.periodStart!)
    }
    if (options.periodEnd) {
      results = results.filter(r => r.gradedAt <= options.periodEnd!)
    }
    if (options.subjects?.length) {
      results = results.filter(r => options.subjects!.includes(r.subject))
    }

    return results
  }

  // Supabase에서 채점 결과 조회
  const supabase = createServerSupabaseClient()

  // 응답 타입 정의
  interface StudentAssignmentRow {
    id: string
    student_id: string
    score: number | null
    answers: { problem_id: string; answer: string; is_correct?: boolean; score?: number }[] | null
    graded_at: string | null
    assignment: { id: string; problems: string[] } | null
  }

  interface ProblemRow {
    id: string
    subject: string
    unit: string | null
    difficulty: string
    answer: string
    type: string
  }

  // student_assignments 테이블에서 채점된 과제 조회
  let query = supabase
    .from('student_assignments')
    .select(`
      id,
      student_id,
      score,
      answers,
      graded_at,
      assignment:assignments(
        id,
        problems
      )
    `)
    .eq('student_id', studentId)
    .eq('status', 'graded')
    .not('graded_at', 'is', null)

  if (options.periodStart) {
    query = query.gte('graded_at', options.periodStart)
  }
  if (options.periodEnd) {
    query = query.lte('graded_at', options.periodEnd)
  }

  const { data: assignments, error } = await query.order('graded_at', { ascending: false })

  if (error || !assignments) {
    console.error('채점 결과 조회 실패:', error)
    return []
  }

  // 타입 캐스팅
  const typedAssignments = assignments as unknown as StudentAssignmentRow[]

  // 문제 정보 조회 및 GradingResult 형식으로 변환
  const gradingResults: GradingResult[] = []

  for (const assignment of typedAssignments) {
    if (!assignment.answers || !Array.isArray(assignment.answers)) continue

    // 문제 ID 목록 가져오기
    const problemIds = assignment.assignment?.problems || []
    if (problemIds.length === 0) continue

    // 문제 정보 조회
    const { data: problems } = await supabase
      .from('problems')
      .select('id, subject, unit, difficulty, answer, type')
      .in('id', problemIds)

    if (!problems) continue

    // 타입 캐스팅
    const typedProblems = problems as unknown as ProblemRow[]

    // 과목 필터 적용
    const filteredProblems = options.subjects?.length
      ? typedProblems.filter(p => options.subjects!.includes(p.subject))
      : typedProblems

    // 각 답안을 GradingResult로 변환
    for (const answer of assignment.answers) {
      const problem = filteredProblems.find(p => p.id === answer.problem_id)
      if (!problem) continue

      gradingResults.push({
        id: `${assignment.id}-${answer.problem_id}`,
        studentId: assignment.student_id,
        problemId: answer.problem_id,
        subject: problem.subject,
        unit: problem.unit || '기타',
        difficulty: problem.difficulty as 'easy' | 'medium' | 'hard',
        isCorrect: answer.is_correct ?? false,
        studentAnswer: answer.answer,
        correctAnswer: problem.answer,
        score: answer.score ?? 0,
        maxScore: 10,
        problemType: problem.type as 'multiple_choice' | 'short_answer' | 'essay',
        gradedAt: assignment.graded_at || new Date().toISOString(),
      })
    }
  }

  return gradingResults
}

// ============================================
// 분석 함수들
// ============================================

/**
 * 단원별 취약점 분석
 */
function analyzeWeakUnits(results: GradingResult[]): WeakUnit[] {
  const unitMap = new Map<string, { subject: string; results: GradingResult[] }>()

  // 단원별 그룹화
  for (const result of results) {
    const key = `${result.subject}-${result.unit}`
    if (!unitMap.has(key)) {
      unitMap.set(key, { subject: result.subject, results: [] })
    }
    unitMap.get(key)!.results.push(result)
  }

  // 단원별 분석
  const weakUnits: WeakUnit[] = []

  for (const [key, data] of unitMap) {
    const unit = key.split('-')[1]
    const total = data.results.length
    const correct = data.results.filter(r => r.isCorrect).length
    const wrong = total - correct
    const correctRate = calcRate(correct, total)

    // 오류 유형 집계
    const errorTypes = data.results
      .filter(r => !r.isCorrect && r.errorType)
      .map(r => r.errorType!)
    const errorTypeCounts = errorTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<ErrorType, number>)
    const mainErrorTypes = Object.entries(errorTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type as ErrorType)

    weakUnits.push({
      unit,
      subject: data.subject,
      totalProblems: total,
      wrongCount: wrong,
      correctRate,
      weaknessLevel: getLevel(correctRate),
      recentTrend: calcTrend(data.results),
      mainErrorTypes,
    })
  }

  // 정답률 낮은 순으로 정렬
  return weakUnits.sort((a, b) => a.correctRate - b.correctRate)
}

/**
 * 개념별 취약점 분석
 */
function analyzeWeakConcepts(results: GradingResult[]): WeakConcept[] {
  const conceptMap = new Map<string, { subject: string; units: Set<string>; results: GradingResult[] }>()

  // 개념별 그룹화
  for (const result of results) {
    if (!result.concept) continue

    const key = `${result.subject}-${result.concept}`
    if (!conceptMap.has(key)) {
      conceptMap.set(key, { subject: result.subject, units: new Set(), results: [] })
    }
    const data = conceptMap.get(key)!
    data.units.add(result.unit)
    data.results.push(result)
  }

  // 개념별 분석
  const weakConcepts: WeakConcept[] = []

  for (const [key, data] of conceptMap) {
    const concept = key.split('-')[1]
    const total = data.results.length
    const correct = data.results.filter(r => r.isCorrect).length
    const wrong = total - correct
    const correctRate = calcRate(correct, total)

    weakConcepts.push({
      concept,
      subject: data.subject,
      relatedUnits: Array.from(data.units),
      totalProblems: total,
      wrongCount: wrong,
      correctRate,
      weaknessLevel: getLevel(correctRate),
    })
  }

  // 정답률 낮은 순으로 정렬
  return weakConcepts.sort((a, b) => a.correctRate - b.correctRate)
}

/**
 * 오답 패턴 분석
 */
function analyzeErrorPatterns(results: GradingResult[]): ErrorPattern[] {
  const wrongResults = results.filter(r => !r.isCorrect)
  if (wrongResults.length === 0) return []

  const errorTypeCounts: Record<ErrorType, GradingResult[]> = {
    calculation: [],
    concept: [],
    careless: [],
    method: [],
    incomplete: [],
    time: [],
    unknown: [],
  }

  // 오류 유형별 그룹화
  for (const result of wrongResults) {
    const type = result.errorType || 'unknown'
    errorTypeCounts[type].push(result)
  }

  const patterns: ErrorPattern[] = []
  const total = wrongResults.length

  const descriptions: Record<ErrorType, string> = {
    calculation: '계산 과정에서 부호 또는 숫자 실수가 발생합니다.',
    concept: '핵심 개념에 대한 이해가 부족합니다.',
    careless: '문제를 꼼꼼히 읽지 않아 실수가 발생합니다.',
    method: '문제 풀이 방법을 잘못 선택하거나 적용합니다.',
    incomplete: '답을 완전하게 작성하지 않습니다.',
    time: '시간이 부족하여 문제를 제대로 풀지 못합니다.',
    unknown: '분류되지 않은 오류입니다.',
  }

  const recommendations: Record<ErrorType, string> = {
    calculation: '계산 후 검산 습관을 기르고, 중요한 단계마다 다시 확인하세요.',
    concept: '관련 개념을 교과서로 다시 복습하고, 기본 문제부터 차근차근 풀어보세요.',
    careless: '문제를 두 번 읽고, 조건을 밑줄 치는 습관을 들이세요.',
    method: '다양한 유형의 문제를 접하고, 유형별 풀이 전략을 정리하세요.',
    incomplete: '답안 작성 후 요구 사항을 다시 확인하세요.',
    time: '시간 배분 연습을 하고, 어려운 문제는 나중에 다시 풀어보세요.',
    unknown: '오답 노트를 작성하여 실수 원인을 분석해보세요.',
  }

  for (const [type, resultList] of Object.entries(errorTypeCounts)) {
    if (resultList.length === 0) continue

    const frequency = Math.round((resultList.length / total) * 100)
    let severity: 'high' | 'medium' | 'low' = 'low'
    if (frequency >= 40) severity = 'high'
    else if (frequency >= 20) severity = 'medium'

    patterns.push({
      id: `ep-${type}`,
      type: type as ErrorType,
      description: descriptions[type as ErrorType],
      frequency,
      examples: resultList.slice(0, 3).map(r => r.id),
      severity,
      recommendation: recommendations[type as ErrorType],
    })
  }

  // 빈도 높은 순으로 정렬
  return patterns.sort((a, b) => b.frequency - a.frequency)
}

/**
 * 과목별 통계 계산
 */
function calculateSubjectStats(results: GradingResult[]): SubjectStats[] {
  const subjectMap = new Map<string, GradingResult[]>()

  for (const result of results) {
    if (!subjectMap.has(result.subject)) {
      subjectMap.set(result.subject, [])
    }
    subjectMap.get(result.subject)!.push(result)
  }

  const stats: SubjectStats[] = []

  for (const [subject, resultList] of subjectMap) {
    const total = resultList.length
    const correct = resultList.filter(r => r.isCorrect).length
    const totalScore = resultList.reduce((sum, r) => sum + r.score, 0)
    const totalMaxScore = resultList.reduce((sum, r) => sum + r.maxScore, 0)

    // 취약 단원 찾기 (정답률 60% 미만)
    const unitStats = new Map<string, { total: number; correct: number }>()
    for (const r of resultList) {
      if (!unitStats.has(r.unit)) {
        unitStats.set(r.unit, { total: 0, correct: 0 })
      }
      const stat = unitStats.get(r.unit)!
      stat.total++
      if (r.isCorrect) stat.correct++
    }

    const weakUnits = Array.from(unitStats.entries())
      .filter(([, stat]) => stat.total >= 2 && (stat.correct / stat.total) < 0.6)
      .map(([unit]) => unit)

    stats.push({
      subject,
      totalProblems: total,
      correctCount: correct,
      correctRate: calcRate(correct, total),
      averageScore: totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0,
      weakUnits,
    })
  }

  return stats.sort((a, b) => a.correctRate - b.correctRate)
}

/**
 * 난이도별 분포 계산
 */
function calculateDifficultyDistribution(results: GradingResult[]): DifficultyDistribution {
  const distribution: DifficultyDistribution = {
    easy: { total: 0, correct: 0, rate: 0 },
    medium: { total: 0, correct: 0, rate: 0 },
    hard: { total: 0, correct: 0, rate: 0 },
  }

  for (const result of results) {
    distribution[result.difficulty].total++
    if (result.isCorrect) {
      distribution[result.difficulty].correct++
    }
  }

  for (const level of ['easy', 'medium', 'hard'] as const) {
    const d = distribution[level]
    d.rate = calcRate(d.correct, d.total)
  }

  return distribution
}

/**
 * 학습 추천 생성
 */
function generateRecommendations(
  weakUnits: WeakUnit[],
  weakConcepts: WeakConcept[],
  errorPatterns: ErrorPattern[]
): LearningRecommendation[] {
  const recommendations: LearningRecommendation[] = []
  let idCounter = 1

  // 취약 개념 기반 추천 (critical, high)
  for (const concept of weakConcepts.filter(c => c.weaknessLevel === 'critical' || c.weaknessLevel === 'high').slice(0, 3)) {
    recommendations.push({
      id: `rec-${idCounter++}`,
      type: 'concept_study',
      priority: concept.weaknessLevel === 'critical' ? 'high' : 'medium',
      title: `${concept.concept} 개념 복습`,
      description: `${concept.subject} ${concept.concept}에 대한 기본 개념을 다시 학습하세요. ${concept.description || ''}`,
      targetConcept: concept.concept,
      estimatedTime: 60,
    })
  }

  // 취약 단원 기반 추천
  for (const unit of weakUnits.filter(u => u.weaknessLevel === 'critical' || u.weaknessLevel === 'high').slice(0, 3)) {
    recommendations.push({
      id: `rec-${idCounter++}`,
      type: 'practice_problems',
      priority: unit.weaknessLevel === 'critical' ? 'high' : 'medium',
      title: `${unit.unit} 문제 연습`,
      description: `${unit.subject} ${unit.unit} 단원의 기본 문제부터 차근차근 연습하세요.`,
      targetUnit: unit.unit,
      estimatedTime: 45,
    })
  }

  // 오답 패턴 기반 추천
  for (const pattern of errorPatterns.filter(p => p.severity === 'high').slice(0, 2)) {
    let type: RecommendationType = 'error_prevention'
    let title = '실수 방지 훈련'

    if (pattern.type === 'concept') {
      type = 'concept_study'
      title = '개념 재학습'
    } else if (pattern.type === 'method') {
      type = 'practice_problems'
      title = '풀이 방법 연습'
    }

    recommendations.push({
      id: `rec-${idCounter++}`,
      type,
      priority: 'medium',
      title,
      description: pattern.recommendation,
      estimatedTime: 30,
    })
  }

  // 중복 제거 후 반환
  const seen = new Set<string>()
  return recommendations.filter(r => {
    const key = `${r.type}-${r.targetUnit || ''}-${r.targetConcept || ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ============================================
// AI 분석 함수
// ============================================

/**
 * Claude API를 사용한 AI 분석
 */
async function generateAiAnalysis(
  studentName: string,
  weakUnits: WeakUnit[],
  weakConcepts: WeakConcept[],
  errorPatterns: ErrorPattern[],
  subjectStats: SubjectStats[]
): Promise<{ summary: string; advice: string }> {
  if (!isClaudeConfigured()) {
    return {
      summary: `${studentName} 학생의 취약점 분석 결과입니다. 주요 취약 단원과 개념을 확인하고, 추천 학습 계획을 따라 학습하세요.`,
      advice: '취약한 개념부터 차근차근 복습하고, 매일 조금씩 꾸준히 학습하는 것이 중요합니다.',
    }
  }

  try {
    const prompt = `당신은 학생의 학습 분석 전문가입니다. 다음 분석 결과를 바탕으로 학생에게 도움이 되는 요약과 조언을 작성해주세요.

학생 이름: ${studentName}

## 취약 단원 (정답률 낮은 순)
${weakUnits.slice(0, 5).map(u => `- ${u.subject} ${u.unit}: 정답률 ${u.correctRate}% (${u.weaknessLevel})`).join('\n')}

## 취약 개념
${weakConcepts.slice(0, 5).map(c => `- ${c.concept} (${c.subject}): 정답률 ${c.correctRate}%`).join('\n')}

## 주요 오답 패턴
${errorPatterns.slice(0, 3).map(p => `- ${p.description}: 빈도 ${p.frequency}%`).join('\n')}

## 과목별 성적
${subjectStats.map(s => `- ${s.subject}: 정답률 ${s.correctRate}%, 평균 ${s.averageScore}점`).join('\n')}

다음 JSON 형식으로 응답해주세요:
{
  "summary": "학생의 현재 학습 상태에 대한 2-3문장 요약",
  "advice": "구체적인 학습 조언과 격려 메시지 (3-4문장)"
}

주의사항:
- 한국어로 작성
- 학생의 강점도 언급하여 격려
- 구체적이고 실행 가능한 조언 제공
- 긍정적인 톤 유지`

    const response = await getClaudeClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        summary: parsed.summary || '',
        advice: parsed.advice || '',
      }
    }

    return {
      summary: text.slice(0, 200),
      advice: '꾸준히 학습하면 분명 발전할 수 있습니다!',
    }
  } catch (error) {
    console.error('AI 분석 생성 실패:', error)
    return {
      summary: `${studentName} 학생의 취약점 분석이 완료되었습니다.`,
      advice: '취약한 부분을 집중적으로 복습하세요.',
    }
  }
}

// ============================================
// 메인 분석 함수
// ============================================

/**
 * 취약점 분석 실행
 *
 * @param studentId - 학생 ID
 * @param gradingResults - 채점 결과 배열 (직접 전달하거나 DB에서 조회)
 * @param options - 분석 옵션
 * @returns 취약점 분석 보고서
 */
export async function analyzeWeakness(
  studentId: string,
  gradingResults?: GradingResult[],
  options: {
    periodStart?: string
    periodEnd?: string
    subjects?: string[]
    includeAiAnalysis?: boolean
    studentName?: string
  } = {}
): Promise<WeaknessReport> {
  // Mock 모드에서 바로 반환
  if (!isSupabaseConfigured() && !gradingResults) {
    return mockWeaknessReport
  }

  // 채점 결과 조회 또는 전달받은 결과 사용
  const results = gradingResults || await fetchGradingResults(studentId, {
    periodStart: options.periodStart,
    periodEnd: options.periodEnd,
    subjects: options.subjects,
  })

  // 결과가 없는 경우
  if (results.length === 0) {
    return {
      id: `report-${Date.now()}`,
      studentId,
      studentName: options.studentName,
      analyzedAt: new Date().toISOString(),
      periodStart: options.periodStart || '',
      periodEnd: options.periodEnd || '',
      summary: {
        totalProblems: 0,
        totalCorrect: 0,
        totalWrong: 0,
        overallCorrectRate: 0,
        averageScore: 0,
      },
      subjectStats: [],
      difficultyDistribution: {
        easy: { total: 0, correct: 0, rate: 0 },
        medium: { total: 0, correct: 0, rate: 0 },
        hard: { total: 0, correct: 0, rate: 0 },
      },
      weakUnits: [],
      weakConcepts: [],
      errorPatterns: [],
      recommendations: [],
      aiSummary: '분석할 채점 결과가 없습니다. 과제를 제출한 후 다시 분석해주세요.',
    }
  }

  // 분석 실행
  const weakUnits = analyzeWeakUnits(results)
  const weakConcepts = analyzeWeakConcepts(results)
  const errorPatterns = analyzeErrorPatterns(results)
  const subjectStats = calculateSubjectStats(results)
  const difficultyDistribution = calculateDifficultyDistribution(results)
  const recommendations = generateRecommendations(weakUnits, weakConcepts, errorPatterns)

  // 요약 통계 계산
  const totalProblems = results.length
  const totalCorrect = results.filter(r => r.isCorrect).length
  const totalWrong = totalProblems - totalCorrect
  const totalScore = results.reduce((sum, r) => sum + r.score, 0)
  const totalMaxScore = results.reduce((sum, r) => sum + r.maxScore, 0)

  // AI 분석 (옵션)
  let aiSummary: string | undefined
  let aiAdvice: string | undefined

  if (options.includeAiAnalysis !== false) {
    const studentName = options.studentName || '학생'
    const aiResult = await generateAiAnalysis(studentName, weakUnits, weakConcepts, errorPatterns, subjectStats)
    aiSummary = aiResult.summary
    aiAdvice = aiResult.advice
  }

  // 기간 설정
  const dates = results.map(r => r.gradedAt).sort()
  const periodStart = options.periodStart || dates[0]?.split('T')[0] || ''
  const periodEnd = options.periodEnd || dates[dates.length - 1]?.split('T')[0] || ''

  return {
    id: `report-${Date.now()}`,
    studentId,
    studentName: options.studentName,
    analyzedAt: new Date().toISOString(),
    periodStart,
    periodEnd,
    summary: {
      totalProblems,
      totalCorrect,
      totalWrong,
      overallCorrectRate: calcRate(totalCorrect, totalProblems),
      averageScore: totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0,
    },
    subjectStats,
    difficultyDistribution,
    weakUnits,
    weakConcepts,
    errorPatterns,
    recommendations,
    aiSummary,
    aiAdvice,
  }
}

/**
 * 저장된 분석 보고서 조회
 */
export async function getWeaknessReport(reportId: string): Promise<WeaknessReport | null> {
  // Mock 모드
  if (!isSupabaseConfigured()) {
    return reportId === 'report-001' ? mockWeaknessReport : null
  }

  // TODO: Supabase에서 저장된 보고서 조회 구현
  // 현재는 실시간 분석만 지원
  return null
}

/**
 * 학생의 최근 취약점 요약 조회 (간략 버전)
 */
export async function getWeaknessSummary(studentId: string): Promise<{
  weakUnits: Pick<WeakUnit, 'unit' | 'subject' | 'correctRate' | 'weaknessLevel'>[]
  weakConcepts: Pick<WeakConcept, 'concept' | 'subject' | 'correctRate' | 'weaknessLevel'>[]
  lastAnalyzedAt?: string
}> {
  const report = await analyzeWeakness(studentId, undefined, { includeAiAnalysis: false })

  return {
    weakUnits: report.weakUnits.slice(0, 5).map(u => ({
      unit: u.unit,
      subject: u.subject,
      correctRate: u.correctRate,
      weaknessLevel: u.weaknessLevel,
    })),
    weakConcepts: report.weakConcepts.slice(0, 5).map(c => ({
      concept: c.concept,
      subject: c.subject,
      correctRate: c.correctRate,
      weaknessLevel: c.weaknessLevel,
    })),
    lastAnalyzedAt: report.analyzedAt,
  }
}
