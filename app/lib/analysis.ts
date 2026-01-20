/**
 * EduFlow 학생 취약점 분석 로직
 *
 * 이 파일은 학생의 오답 패턴 분석, 단원별/개념별 취약점 도출,
 * Action Plan 생성을 위한 핵심 로직을 제공합니다.
 *
 * Vercel Best Practices 적용:
 * - async-parallel: 여러 분석을 병렬 실행
 * - server-serialization: 클라이언트로 전달하는 데이터 최소화
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerSupabaseClient } from './supabase'
import type {
  WrongAnswer,
  WrongAnswerPattern,
  PatternType,
  UnitWeakness,
  ConceptWeakness,
  DifficultyDistribution,
  StudentWeaknessAnalysis,
  ActionPlan,
  LearningRecommendation,
  WeeklyPlan,
  DailyPlan,
  RecommendationType,
} from '@/types/analysis'
import type { ProblemDifficulty, Problem } from '@/types/database'

// ============================================
// 타입 정의
// ============================================

/** 학생 과제 기록 (Supabase 조회 결과) */
interface StudentAssignmentRecord {
  id: string
  assignment_id: string
  answers: StudentAnswerRecord[] | null
  submitted_at: string | null
  assignments: {
    id: string
    problems: string[]
  } | null
}

/** 학생 답안 기록 */
interface StudentAnswerRecord {
  problem_id: string
  answer: string
  is_correct?: boolean
}

/** 학생 과제 통계 기록 */
interface StudentAssignmentStatsRecord {
  id: string
  answers: StudentAnswerRecord[] | null
  submitted_at: string | null
  assignments: {
    problems: string[]
  } | null
}

// Gemini AI 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ============================================
// 데이터 조회 함수
// ============================================

/**
 * 학생의 오답 기록 조회
 * 제출된 과제에서 틀린 문제들을 가져옵니다.
 */
export async function fetchWrongAnswers(
  studentId: string,
  periodStart?: string,
  periodEnd?: string,
  subjects?: string[]
): Promise<WrongAnswer[]> {
  const supabase = createServerSupabaseClient()

  // 학생의 과제 제출 기록 조회
  let query = supabase
    .from('student_assignments')
    .select(`
      id,
      assignment_id,
      answers,
      submitted_at,
      assignments!inner (
        id,
        problems
      )
    `)
    .eq('student_id', studentId)
    .in('status', ['submitted', 'graded'])

  if (periodStart) {
    query = query.gte('submitted_at', periodStart)
  }
  if (periodEnd) {
    query = query.lte('submitted_at', periodEnd)
  }

  const { data: rawAssignments, error: assignmentError } = await query

  if (assignmentError) {
    console.error('과제 기록 조회 실패:', assignmentError)
    return []
  }

  if (!rawAssignments || rawAssignments.length === 0) {
    return []
  }

  // 타입 단언
  const studentAssignments = rawAssignments as unknown as StudentAssignmentRecord[]

  // 관련 문제 ID들 수집
  const problemIds = new Set<string>()
  studentAssignments.forEach((sa) => {
    if (sa.assignments?.problems) {
      sa.assignments.problems.forEach((pid) => problemIds.add(pid))
    }
  })

  // 문제 정보 조회
  let problemQuery = supabase
    .from('problems')
    .select('*')
    .in('id', Array.from(problemIds))

  if (subjects && subjects.length > 0) {
    problemQuery = problemQuery.in('subject', subjects)
  }

  const { data: rawProblems, error: problemError } = await problemQuery

  if (problemError) {
    console.error('문제 정보 조회 실패:', problemError)
    return []
  }

  // 문제 ID를 키로 하는 맵 생성
  const problems = (rawProblems || []) as Problem[]
  const problemMap = new Map(problems.map((p) => [p.id, p]))

  // 오답 기록 생성
  const wrongAnswers: WrongAnswer[] = []

  studentAssignments.forEach((sa) => {
    const answers = sa.answers || []

    answers.forEach((answer) => {
      // 틀린 답만 처리
      if (answer.is_correct === false) {
        const problem = problemMap.get(answer.problem_id)
        if (problem) {
          // 과목 필터링
          if (subjects && subjects.length > 0 && !subjects.includes(problem.subject)) {
            return
          }

          wrongAnswers.push({
            problemId: problem.id,
            assignmentId: sa.assignments?.id || sa.assignment_id,
            subject: problem.subject,
            grade: problem.grade,
            unit: problem.unit || '미분류',
            question: problem.question,
            correctAnswer: problem.answer,
            studentAnswer: answer.answer,
            difficulty: problem.difficulty,
            type: problem.type,
            tags: problem.tags || [],
            wrongAt: sa.submitted_at || new Date().toISOString(),
          })
        }
      }
    })
  })

  return wrongAnswers
}

/**
 * 학생의 전체 문제 풀이 통계 조회
 */
export async function fetchStudentStats(
  studentId: string,
  periodStart?: string,
  periodEnd?: string,
  subjects?: string[]
): Promise<{
  totalProblems: number
  correctCount: number
  wrongCount: number
  byDifficulty: Record<ProblemDifficulty, { total: number; correct: number }>
  bySubject: Record<string, { total: number; correct: number }>
  byUnit: Record<string, { total: number; correct: number; subject: string }>
}> {
  const supabase = createServerSupabaseClient()

  // 학생의 과제 제출 기록 조회
  let query = supabase
    .from('student_assignments')
    .select(`
      id,
      answers,
      submitted_at,
      assignments!inner (
        problems
      )
    `)
    .eq('student_id', studentId)
    .in('status', ['submitted', 'graded'])

  if (periodStart) {
    query = query.gte('submitted_at', periodStart)
  }
  if (periodEnd) {
    query = query.lte('submitted_at', periodEnd)
  }

  const { data: rawStatsAssignments } = await query

  if (!rawStatsAssignments || rawStatsAssignments.length === 0) {
    return {
      totalProblems: 0,
      correctCount: 0,
      wrongCount: 0,
      byDifficulty: {
        easy: { total: 0, correct: 0 },
        medium: { total: 0, correct: 0 },
        hard: { total: 0, correct: 0 },
      },
      bySubject: {},
      byUnit: {},
    }
  }

  // 타입 단언
  const statsAssignments = rawStatsAssignments as unknown as StudentAssignmentStatsRecord[]

  // 관련 문제 ID들 수집
  const problemIds = new Set<string>()
  statsAssignments.forEach((sa) => {
    if (sa.assignments?.problems) {
      sa.assignments.problems.forEach((pid) => problemIds.add(pid))
    }
  })

  // 문제 정보 조회
  let problemQuery = supabase
    .from('problems')
    .select('*')
    .in('id', Array.from(problemIds))

  if (subjects && subjects.length > 0) {
    problemQuery = problemQuery.in('subject', subjects)
  }

  const { data: rawStatsProblems } = await problemQuery

  const statsProblems = (rawStatsProblems || []) as Problem[]
  const problemMap = new Map(statsProblems.map((p) => [p.id, p]))

  // 통계 계산
  const stats = {
    totalProblems: 0,
    correctCount: 0,
    wrongCount: 0,
    byDifficulty: {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 },
    } as Record<ProblemDifficulty, { total: number; correct: number }>,
    bySubject: {} as Record<string, { total: number; correct: number }>,
    byUnit: {} as Record<string, { total: number; correct: number; subject: string }>,
  }

  statsAssignments.forEach((sa) => {
    const answers = sa.answers || []

    answers.forEach((answer) => {
      const problem = problemMap.get(answer.problem_id)
      if (!problem) return

      // 과목 필터링
      if (subjects && subjects.length > 0 && !subjects.includes(problem.subject)) {
        return
      }

      stats.totalProblems++
      const isCorrect = answer.is_correct === true

      if (isCorrect) {
        stats.correctCount++
      } else {
        stats.wrongCount++
      }

      // 난이도별 통계
      if (stats.byDifficulty[problem.difficulty]) {
        stats.byDifficulty[problem.difficulty].total++
        if (isCorrect) {
          stats.byDifficulty[problem.difficulty].correct++
        }
      }

      // 과목별 통계
      if (!stats.bySubject[problem.subject]) {
        stats.bySubject[problem.subject] = { total: 0, correct: 0 }
      }
      stats.bySubject[problem.subject].total++
      if (isCorrect) {
        stats.bySubject[problem.subject].correct++
      }

      // 단원별 통계
      const unit = problem.unit || '미분류'
      const unitKey = `${problem.subject}:${unit}`
      if (!stats.byUnit[unitKey]) {
        stats.byUnit[unitKey] = { total: 0, correct: 0, subject: problem.subject }
      }
      stats.byUnit[unitKey].total++
      if (isCorrect) {
        stats.byUnit[unitKey].correct++
      }
    })
  })

  return stats
}

// ============================================
// 오답 패턴 분석 함수
// ============================================

/**
 * AI를 사용하여 오답 패턴 분석
 */
export async function analyzeWrongAnswerPatterns(
  wrongAnswers: WrongAnswer[]
): Promise<WrongAnswerPattern[]> {
  if (wrongAnswers.length === 0) {
    return []
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  // 분석용 데이터 준비 (최대 50개)
  const sampleAnswers = wrongAnswers.slice(0, 50).map((wa) => ({
    question: wa.question.substring(0, 200),
    correctAnswer: wa.correctAnswer,
    studentAnswer: wa.studentAnswer,
    subject: wa.subject,
    unit: wa.unit,
    difficulty: wa.difficulty,
  }))

  const prompt = `
당신은 학생의 오답을 분석하는 교육 전문가입니다.
아래 학생의 오답 기록을 분석하여 반복되는 패턴을 찾아주세요.

## 오답 기록
${JSON.stringify(sampleAnswers, null, 2)}

## 분석할 패턴 유형
- calculation_error: 계산 실수 (연산 오류, 부호 실수 등)
- concept_misunderstanding: 개념 오해 (핵심 개념을 잘못 이해)
- incomplete_understanding: 불완전한 이해 (부분적으로만 알고 있음)
- careless_mistake: 부주의한 실수 (단순 실수, 베끼기 오류)
- question_misread: 문제 잘못 읽음 (조건 누락, 요구사항 오해)
- formula_confusion: 공식 혼동 (비슷한 공식 헷갈림)
- application_difficulty: 응용력 부족 (기본은 알지만 응용 못함)

## 출력 형식 (JSON 배열)
반드시 아래 형식의 JSON 배열만 출력하세요:

[
  {
    "id": "pattern_1",
    "type": "패턴 유형 (위 목록 중 하나)",
    "description": "패턴에 대한 구체적인 설명",
    "frequency": 발생 횟수 (숫자),
    "severity": 심각도 1-5 (5가 가장 심각),
    "relatedIndices": [관련된 오답 인덱스 배열]
  }
]

JSON 형식만 출력하세요. 마크다운 코드블록 없이 순수 JSON만 반환하세요.
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // JSON 파싱
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const patterns = JSON.parse(cleanedText)

    // 관련 오답 ID 매핑
    return patterns.map((p: {
      id: string
      type: PatternType
      description: string
      frequency: number
      severity: number
      relatedIndices?: number[]
    }) => ({
      id: p.id,
      type: p.type as PatternType,
      description: p.description,
      frequency: p.frequency,
      severity: p.severity,
      relatedWrongAnswers: (p.relatedIndices || [])
        .filter((i: number) => i < wrongAnswers.length)
        .map((i: number) => wrongAnswers[i].problemId),
    }))
  } catch (error) {
    console.error('AI 패턴 분석 실패:', error)

    // 기본 패턴 분석 (AI 실패 시 폴백)
    return analyzePatternsFallback(wrongAnswers)
  }
}

/**
 * AI 없이 기본적인 패턴 분석 (폴백)
 */
function analyzePatternsFallback(wrongAnswers: WrongAnswer[]): WrongAnswerPattern[] {
  const patternCounts: Record<PatternType, { count: number; answers: string[] }> = {
    calculation_error: { count: 0, answers: [] },
    concept_misunderstanding: { count: 0, answers: [] },
    incomplete_understanding: { count: 0, answers: [] },
    careless_mistake: { count: 0, answers: [] },
    time_pressure: { count: 0, answers: [] },
    question_misread: { count: 0, answers: [] },
    formula_confusion: { count: 0, answers: [] },
    application_difficulty: { count: 0, answers: [] },
    unknown: { count: 0, answers: [] },
  }

  // 단순 휴리스틱 기반 패턴 분류
  wrongAnswers.forEach((wa) => {
    // 숫자 오답이면 계산 실수 가능성
    if (/^\d+$/.test(wa.studentAnswer) && /^\d+$/.test(wa.correctAnswer)) {
      const diff = Math.abs(parseInt(wa.studentAnswer) - parseInt(wa.correctAnswer))
      if (diff <= 10) {
        patternCounts.calculation_error.count++
        patternCounts.calculation_error.answers.push(wa.problemId)
        return
      }
    }

    // 빈 답이면 불완전한 이해
    if (!wa.studentAnswer || wa.studentAnswer.trim() === '') {
      patternCounts.incomplete_understanding.count++
      patternCounts.incomplete_understanding.answers.push(wa.problemId)
      return
    }

    // 어려운 문제면 응용력 부족
    if (wa.difficulty === 'hard') {
      patternCounts.application_difficulty.count++
      patternCounts.application_difficulty.answers.push(wa.problemId)
      return
    }

    // 기타
    patternCounts.unknown.count++
    patternCounts.unknown.answers.push(wa.problemId)
  })

  // 패턴 결과 생성
  return Object.entries(patternCounts)
    .filter(([_, data]) => data.count > 0)
    .map(([type, data], index) => ({
      id: `pattern_${index + 1}`,
      type: type as PatternType,
      description: getPatternDescription(type as PatternType),
      frequency: data.count,
      severity: calculatePatternSeverity(type as PatternType, data.count, wrongAnswers.length),
      relatedWrongAnswers: data.answers,
    }))
    .sort((a, b) => b.frequency - a.frequency)
}

function getPatternDescription(type: PatternType): string {
  const descriptions: Record<PatternType, string> = {
    calculation_error: '계산 과정에서 연산 실수가 발생했습니다.',
    concept_misunderstanding: '핵심 개념을 잘못 이해하고 있습니다.',
    incomplete_understanding: '개념을 부분적으로만 이해하고 있습니다.',
    careless_mistake: '문제를 풀 때 부주의한 실수가 있었습니다.',
    time_pressure: '시간 부족으로 인해 문제를 제대로 풀지 못했습니다.',
    question_misread: '문제의 조건이나 요구사항을 잘못 파악했습니다.',
    formula_confusion: '비슷한 공식을 혼동하고 있습니다.',
    application_difficulty: '기본 개념은 알지만 응용 문제에 어려움을 겪고 있습니다.',
    unknown: '분류되지 않은 오답입니다.',
  }
  return descriptions[type]
}

function calculatePatternSeverity(
  type: PatternType,
  count: number,
  total: number
): number {
  const ratio = count / total

  // 개념 관련 문제는 더 심각
  if (type === 'concept_misunderstanding' || type === 'incomplete_understanding') {
    if (ratio > 0.3) return 5
    if (ratio > 0.2) return 4
    if (ratio > 0.1) return 3
    return 2
  }

  // 일반 패턴
  if (ratio > 0.4) return 4
  if (ratio > 0.2) return 3
  if (ratio > 0.1) return 2
  return 1
}

// ============================================
// 취약점 분석 함수
// ============================================

/**
 * 단원별 취약점 분석
 */
export function analyzeUnitWeaknesses(
  wrongAnswers: WrongAnswer[],
  stats: {
    byUnit: Record<string, { total: number; correct: number; subject: string }>
  },
  patterns: WrongAnswerPattern[]
): UnitWeakness[] {
  const unitWeaknesses: UnitWeakness[] = []

  // 단원별로 분석
  for (const [unitKey, unitStats] of Object.entries(stats.byUnit)) {
    const [subject, unit] = unitKey.split(':')
    const correctRate = unitStats.total > 0
      ? Math.round((unitStats.correct / unitStats.total) * 100)
      : 100

    const unitWrongAnswers = wrongAnswers.filter(
      (wa) => wa.subject === subject && wa.unit === unit
    )

    // 관련 패턴 찾기
    const relatedPatternTypes = new Set<PatternType>()
    unitWrongAnswers.forEach((wa) => {
      patterns.forEach((p) => {
        if (p.relatedWrongAnswers.includes(wa.problemId)) {
          relatedPatternTypes.add(p.type)
        }
      })
    })

    unitWeaknesses.push({
      unit,
      subject,
      totalProblems: unitStats.total,
      wrongCount: unitStats.total - unitStats.correct,
      correctRate,
      weaknessLevel: calculateWeaknessLevelUtil(correctRate),
      mainPatterns: Array.from(relatedPatternTypes),
      wrongAnswers: unitWrongAnswers,
    })
  }

  // 취약 정도순으로 정렬 (가장 취약한 것부터)
  return unitWeaknesses.sort((a, b) => b.weaknessLevel - a.weaknessLevel)
}

/**
 * 개념별 취약점 분석
 */
export function analyzeConceptWeaknesses(
  wrongAnswers: WrongAnswer[],
  patterns: WrongAnswerPattern[]
): ConceptWeakness[] {
  // 태그(개념)별로 그룹화
  const conceptMap = new Map<
    string,
    {
      subject: string
      units: Set<string>
      total: number
      wrong: number
      patterns: Set<PatternType>
    }
  >()

  wrongAnswers.forEach((wa) => {
    const tags = wa.tags || []
    tags.forEach((tag) => {
      if (!conceptMap.has(tag)) {
        conceptMap.set(tag, {
          subject: wa.subject,
          units: new Set(),
          total: 0,
          wrong: 0,
          patterns: new Set(),
        })
      }

      const concept = conceptMap.get(tag)!
      concept.units.add(wa.unit)
      concept.total++
      concept.wrong++

      // 관련 패턴 추가
      patterns.forEach((p) => {
        if (p.relatedWrongAnswers.includes(wa.problemId)) {
          concept.patterns.add(p.type)
        }
      })
    })
  })

  // 결과 변환
  const conceptWeaknesses: ConceptWeakness[] = []

  conceptMap.forEach((data, concept) => {
    const correctRate = data.total > 0
      ? Math.round(((data.total - data.wrong) / data.total) * 100)
      : 100

    conceptWeaknesses.push({
      concept,
      subject: data.subject,
      relatedUnits: Array.from(data.units),
      totalProblems: data.total,
      wrongCount: data.wrong,
      correctRate,
      weaknessLevel: calculateWeaknessLevelUtil(correctRate),
      mainPatterns: Array.from(data.patterns),
    })
  })

  // 취약 정도순으로 정렬
  return conceptWeaknesses.sort((a, b) => b.weaknessLevel - a.weaknessLevel)
}

/**
 * 난이도별 분포 분석
 */
export function analyzeDifficultyDistribution(
  stats: { byDifficulty: Record<ProblemDifficulty, { total: number; correct: number }> }
): DifficultyDistribution[] {
  return (['easy', 'medium', 'hard'] as ProblemDifficulty[]).map((difficulty) => {
    const data = stats.byDifficulty[difficulty]
    return {
      difficulty,
      total: data.total,
      correct: data.correct,
      correctRate: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 100,
    }
  })
}

// ============================================
// AI 요약 생성
// ============================================

/**
 * AI를 사용하여 취약점 분석 요약 생성
 */
export async function generateAiSummary(
  unitWeaknesses: UnitWeakness[],
  conceptWeaknesses: ConceptWeakness[],
  patterns: WrongAnswerPattern[],
  overallCorrectRate: number
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
당신은 학생의 학습 상태를 분석하는 교육 전문가입니다.
아래 분석 결과를 바탕으로 학생의 학습 상태를 요약해주세요.

## 전체 정답률
${overallCorrectRate}%

## 취약 단원 (상위 5개)
${unitWeaknesses
  .slice(0, 5)
  .map((u) => `- ${u.subject} > ${u.unit}: 정답률 ${u.correctRate}%, 취약도 ${u.weaknessLevel}/5`)
  .join('\n')}

## 취약 개념 (상위 5개)
${conceptWeaknesses
  .slice(0, 5)
  .map((c) => `- ${c.concept}: 정답률 ${c.correctRate}%`)
  .join('\n')}

## 주요 오답 패턴
${patterns
  .slice(0, 3)
  .map((p) => `- ${p.type}: ${p.description} (발생 ${p.frequency}회, 심각도 ${p.severity}/5)`)
  .join('\n')}

## 요청사항
1. 학생의 현재 학습 상태를 2-3문장으로 요약
2. 가장 시급히 개선해야 할 부분 언급
3. 긍정적인 면도 찾아서 언급
4. 200자 이내로 작성
5. 한국어로 작성

요약:
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim()
  } catch (error) {
    console.error('AI 요약 생성 실패:', error)
    return `전체 정답률 ${overallCorrectRate}%입니다. ${
      unitWeaknesses.length > 0
        ? `${unitWeaknesses[0].subject}의 ${unitWeaknesses[0].unit} 단원이 가장 취약합니다.`
        : ''
    } 꾸준한 복습이 필요합니다.`
  }
}

// ============================================
// Action Plan 생성
// ============================================

/**
 * AI를 사용하여 맞춤형 Action Plan 생성
 */
export async function generateActionPlan(
  studentId: string,
  studentName: string,
  analysis: StudentWeaknessAnalysis,
  options: {
    planWeeks?: number
    dailyStudyTime?: number
    focusSubjects?: string[]
  }
): Promise<ActionPlan> {
  const planWeeks = options.planWeeks || 4
  const dailyStudyTime = options.dailyStudyTime || 60
  const focusSubjects = options.focusSubjects || []

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  // 취약점 정보 준비
  const weaknessInfo = analysis.unitWeaknesses
    .slice(0, 5)
    .map((u) => ({
      unit: u.unit,
      subject: u.subject,
      correctRate: u.correctRate,
      weaknessLevel: u.weaknessLevel,
      patterns: u.mainPatterns,
    }))

  const prompt = `
당신은 학생 맞춤형 학습 계획을 수립하는 교육 전문가입니다.
아래 학생의 취약점 분석 결과를 바탕으로 ${planWeeks}주간의 학습 계획을 세워주세요.

## 학생 정보
- 이름: ${studentName}
- 전체 정답률: ${analysis.overallCorrectRate}%
- 일일 가용 학습 시간: ${dailyStudyTime}분
${focusSubjects.length > 0 ? `- 집중 과목: ${focusSubjects.join(', ')}` : ''}

## 취약 단원
${JSON.stringify(weaknessInfo, null, 2)}

## 주요 오답 패턴
${analysis.topPatterns
  .slice(0, 3)
  .map((p) => `- ${p.type}: ${p.description}`)
  .join('\n')}

## 출력 형식 (JSON)
반드시 아래 형식의 JSON만 출력하세요:

{
  "overallGoal": "전체 학습 목표 (한 문장)",
  "aiAdvice": "학생에게 전하는 맞춤형 조언 (3-4문장)",
  "recommendations": [
    {
      "id": "rec_1",
      "type": "추천 유형 (review_concept/practice_problems/watch_video/error_note/formula_memorize 중 하나)",
      "title": "추천 제목",
      "description": "상세 설명",
      "targetArea": "대상 단원/개념",
      "priority": 우선순위 (1이 가장 높음, 숫자),
      "estimatedTime": 예상 소요 시간 (분, 숫자),
      "reason": "추천 이유"
    }
  ],
  "weeklyPlans": [
    {
      "week": 주차 (숫자),
      "goal": "주간 목표",
      "focus": "이번 주 집중할 단원/개념"
    }
  ]
}

## 주의사항
- 추천은 최소 5개, 최대 10개
- 주간 계획은 ${planWeeks}개
- 일일 학습 시간 ${dailyStudyTime}분 고려
- 취약한 부분부터 우선순위 높게
- JSON 형식만 출력 (마크다운 코드블록 없이)
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // JSON 파싱
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const planData = JSON.parse(cleanedText)

    // 날짜 계산
    const now = new Date()
    const validFrom = now.toISOString().split('T')[0]
    const validTo = new Date(now.getTime() + planWeeks * 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    // 추천 항목 매핑
    const recommendations: LearningRecommendation[] = (planData.recommendations || []).map(
      (r: {
        id: string
        type: RecommendationType
        title: string
        description: string
        targetArea: string
        priority: number
        estimatedTime: number
        reason: string
      }) => ({
        id: r.id,
        type: r.type as RecommendationType,
        title: r.title,
        description: r.description,
        targetArea: r.targetArea,
        priority: r.priority,
        estimatedTime: r.estimatedTime,
        reason: r.reason,
        relatedWeaknesses: [],
      })
    )

    // 주간 계획 생성
    const weeklyPlans: WeeklyPlan[] = (planData.weeklyPlans || []).map(
      (wp: { week: number; goal: string; focus: string }, index: number) => {
        const weekStart = new Date(now.getTime() + index * 7 * 24 * 60 * 60 * 1000)
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)

        // 일별 계획 생성 (간단한 분배)
        const dailyPlans: DailyPlan[] = []
        const weekRecommendations = recommendations.filter(
          (_, i) => Math.floor(i / 2) === index
        )

        for (let day = 0; day < 7; day++) {
          const dayDate = new Date(weekStart.getTime() + day * 24 * 60 * 60 * 1000)
          // 주말은 휴식 또는 복습
          const isWeekend = day === 0 || day === 6
          const dayItems = isWeekend
            ? []
            : weekRecommendations.slice(day % weekRecommendations.length, (day % weekRecommendations.length) + 1)

          dailyPlans.push({
            dayOfWeek: day,
            date: dayDate.toISOString().split('T')[0],
            items: dayItems,
            totalTime: dayItems.reduce((sum, item) => sum + item.estimatedTime, 0),
          })
        }

        return {
          week: wp.week,
          startDate: weekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0],
          goal: wp.goal,
          dailyPlans,
        }
      }
    )

    return {
      id: `plan_${Date.now()}`,
      studentId,
      studentName,
      createdAt: new Date().toISOString(),
      validFrom,
      validTo,
      overallGoal: planData.overallGoal,
      aiAdvice: planData.aiAdvice,
      recommendations,
      weeklyPlans,
      basedOnAnalysisId: analysis.studentId,
      progress: 0,
      completedRecommendations: [],
    }
  } catch (error) {
    console.error('Action Plan 생성 실패:', error)

    // 기본 Action Plan 생성 (폴백)
    return generateDefaultActionPlan(
      studentId,
      studentName,
      analysis,
      planWeeks,
      dailyStudyTime
    )
  }
}

/**
 * 기본 Action Plan 생성 (AI 실패 시 폴백)
 */
function generateDefaultActionPlan(
  studentId: string,
  studentName: string,
  analysis: StudentWeaknessAnalysis,
  planWeeks: number,
  dailyStudyTime: number
): ActionPlan {
  const now = new Date()
  const validFrom = now.toISOString().split('T')[0]
  const validTo = new Date(now.getTime() + planWeeks * 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // 취약 단원 기반 추천 생성
  const recommendations: LearningRecommendation[] = analysis.unitWeaknesses
    .slice(0, 5)
    .map((weakness, index) => ({
      id: `rec_${index + 1}`,
      type: 'review_concept' as RecommendationType,
      title: `${weakness.subject} - ${weakness.unit} 복습`,
      description: `${weakness.unit} 단원의 핵심 개념을 복습하고 관련 문제를 풀어보세요.`,
      targetArea: weakness.unit,
      priority: index + 1,
      estimatedTime: Math.min(dailyStudyTime, 30),
      reason: `정답률이 ${weakness.correctRate}%로 보강이 필요합니다.`,
      relatedWeaknesses: [weakness.unit],
    }))

  // 주간 계획 생성
  const weeklyPlans: WeeklyPlan[] = Array.from({ length: planWeeks }, (_, weekIndex) => {
    const weekStart = new Date(now.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)

    const dailyPlans: DailyPlan[] = Array.from({ length: 7 }, (_, dayIndex) => {
      const dayDate = new Date(weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000)
      return {
        dayOfWeek: dayIndex,
        date: dayDate.toISOString().split('T')[0],
        items: dayIndex > 0 && dayIndex < 6 ? [recommendations[weekIndex % recommendations.length]] : [],
        totalTime: dayIndex > 0 && dayIndex < 6 ? recommendations[weekIndex % recommendations.length]?.estimatedTime || 0 : 0,
      }
    })

    return {
      week: weekIndex + 1,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      goal: analysis.unitWeaknesses[weekIndex]
        ? `${analysis.unitWeaknesses[weekIndex].unit} 단원 완전 정복`
        : '이전 학습 내용 복습',
      dailyPlans,
    }
  })

  return {
    id: `plan_${Date.now()}`,
    studentId,
    studentName,
    createdAt: new Date().toISOString(),
    validFrom,
    validTo,
    overallGoal: `${planWeeks}주 동안 취약 단원을 집중 보강하여 전체 정답률을 높입니다.`,
    aiAdvice: `${studentName} 학생의 전체 정답률은 ${analysis.overallCorrectRate}%입니다. ${
      analysis.unitWeaknesses[0]
        ? `특히 ${analysis.unitWeaknesses[0].subject}의 ${analysis.unitWeaknesses[0].unit} 단원에서 어려움을 겪고 있습니다.`
        : ''
    } 꾸준한 복습과 문제 풀이를 통해 실력을 향상시킬 수 있습니다.`,
    recommendations,
    weeklyPlans,
    basedOnAnalysisId: analysis.studentId,
    progress: 0,
    completedRecommendations: [],
  }
}

// ============================================
// 메인 분석 함수
// ============================================

/**
 * 학생 취약점 전체 분석 실행
 *
 * Vercel Best Practice: async-parallel 패턴 적용
 * 여러 분석을 병렬로 실행하여 성능 최적화
 */
export async function runFullAnalysis(
  studentId: string,
  options: {
    periodStart?: string
    periodEnd?: string
    subjects?: string[]
    includeAiSummary?: boolean
  } = {}
): Promise<StudentWeaknessAnalysis> {
  const supabase = createServerSupabaseClient()

  // 학생 정보 조회
  const { data: student } = await supabase
    .from('students')
    .select(`
      id,
      users!inner (
        name
      )
    `)
    .eq('id', studentId)
    .single()

  // 타입 단언 (Supabase 조인 쿼리 결과)
  const typedStudent = student as unknown as { id: string; users: { name: string } | null } | null
  const studentName = typedStudent?.users?.name || '학생'

  // 1단계: 데이터 조회 (병렬 실행)
  const [wrongAnswers, stats] = await Promise.all([
    fetchWrongAnswers(studentId, options.periodStart, options.periodEnd, options.subjects),
    fetchStudentStats(studentId, options.periodStart, options.periodEnd, options.subjects),
  ])

  // 2단계: 패턴 분석
  const patterns = await analyzeWrongAnswerPatterns(wrongAnswers)

  // 3단계: 취약점 분석 (병렬 실행)
  const [unitWeaknesses, conceptWeaknesses, difficultyDistribution] = await Promise.all([
    Promise.resolve(analyzeUnitWeaknesses(wrongAnswers, stats, patterns)),
    Promise.resolve(analyzeConceptWeaknesses(wrongAnswers, patterns)),
    Promise.resolve(analyzeDifficultyDistribution(stats)),
  ])

  // 4단계: AI 요약 생성 (선택적)
  const overallCorrectRate = stats.totalProblems > 0
    ? Math.round((stats.correctCount / stats.totalProblems) * 100)
    : 100

  let aiSummary: string | undefined
  if (options.includeAiSummary) {
    aiSummary = await generateAiSummary(
      unitWeaknesses,
      conceptWeaknesses,
      patterns,
      overallCorrectRate
    )
  }

  // 결과 반환 (server-serialization: 필요한 데이터만 반환)
  return {
    studentId,
    studentName,
    periodStart: options.periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    periodEnd: options.periodEnd || new Date().toISOString().split('T')[0],
    analyzedAt: new Date().toISOString(),
    totalProblems: stats.totalProblems,
    totalWrong: stats.wrongCount,
    overallCorrectRate,
    unitWeaknesses,
    conceptWeaknesses,
    difficultyDistribution,
    topPatterns: patterns.slice(0, 5),
    aiSummary,
  }
}

// 유틸리티 함수 (타입에서 import하지 않고 직접 구현)
function calculateWeaknessLevelUtil(correctRate: number): number {
  if (correctRate >= 90) return 1
  if (correctRate >= 75) return 2
  if (correctRate >= 60) return 3
  if (correctRate >= 40) return 4
  return 5
}
