/**
 * EduFlow 학습 보고서 자동 생성 모듈
 *
 * 이 파일은 주간/월간 학습 보고서를 자동 생성하는 핵심 로직을 제공합니다.
 * - 학부모용: 대화거리 중심, 긍정적인 피드백
 * - 강사용: 상세 데이터 중심, 수업 준비용
 *
 * Vercel Best Practices 적용:
 * - async-parallel: 여러 학생의 보고서를 병렬 생성
 * - server-serialization: 필요한 데이터만 반환
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerSupabaseClient } from './supabase'
import {
  fetchWrongAnswers,
  fetchStudentStats,
  analyzeWrongAnswerPatterns,
} from './analysis'
import type {
  ReportPeriod,
  ReportPeriodType,
  ParentReport,
  TeacherReport,
  AutoReportGenerateResult,
  generatePeriodLabel,
} from '@/types/report'
import type { Student, User, Attendance, StudentAssignment, Grade } from '@/types/database'

// Gemini AI 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ============================================
// 타입 정의
// ============================================

/** 학생 상세 정보 (조인 쿼리 결과) */
interface StudentWithDetails {
  id: string
  user_id: string
  academy_id: string
  grade: string | null
  school_name: string | null
  users: {
    name: string
    email: string
  } | null
}

/** 출결 요약 */
interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  earlyLeaveDays: number
  attendanceRate: number
  records: Attendance[]
}

/** 과제 요약 */
interface AssignmentSummary {
  totalAssigned: number
  completed: number
  pending: number
  averageScore: number
  onTimeCount: number
  onTimeRate: number
}

/** 성적 요약 */
interface GradeSummary {
  overallAverage: number
  previousAverage: number
  change: number
  bySubject: {
    subject: string
    average: number
    change: number
    testsCount: number
    highestScore: number
    lowestScore: number
  }[]
  byUnit: {
    subject: string
    unit: string
    correctRate: number
    totalProblems: number
    isWeak: boolean
  }[]
}

// ============================================
// 데이터 조회 함수
// ============================================

/**
 * 학원의 전체 학생 목록 조회
 */
export async function fetchStudentsByAcademy(academyId: string): Promise<StudentWithDetails[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('students')
    .select(`
      id,
      user_id,
      academy_id,
      grade,
      school_name,
      users!inner (
        name,
        email
      )
    `)
    .eq('academy_id', academyId)

  if (error) {
    console.error('학생 목록 조회 실패:', error)
    return []
  }

  return (data || []) as unknown as StudentWithDetails[]
}

/**
 * 학생의 출결 데이터 조회 및 요약
 */
export async function fetchAttendanceSummary(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<AttendanceSummary> {
  const supabase = createServerSupabaseClient()

  const { data: records } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  const attendanceRecords = (records || []) as Attendance[]

  const summary: AttendanceSummary = {
    totalDays: attendanceRecords.length,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    earlyLeaveDays: 0,
    attendanceRate: 0,
    records: attendanceRecords,
  }

  attendanceRecords.forEach((record) => {
    switch (record.status) {
      case 'present':
        summary.presentDays++
        break
      case 'absent':
        summary.absentDays++
        break
      case 'late':
        summary.lateDays++
        break
      case 'early_leave':
        summary.earlyLeaveDays++
        break
    }
  })

  summary.attendanceRate = summary.totalDays > 0
    ? Math.round((summary.presentDays / summary.totalDays) * 100)
    : 100

  return summary
}

/**
 * 학생의 과제 수행 현황 조회 및 요약
 */
export async function fetchAssignmentSummary(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<AssignmentSummary> {
  const supabase = createServerSupabaseClient()

  const { data } = await supabase
    .from('student_assignments')
    .select(`
      id,
      status,
      score,
      submitted_at,
      assignments!inner (
        due_date
      )
    `)
    .eq('student_id', studentId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  const assignments = (data || []) as unknown as {
    id: string
    status: string
    score: number | null
    submitted_at: string | null
    assignments: { due_date: string | null } | null
  }[]

  const summary: AssignmentSummary = {
    totalAssigned: assignments.length,
    completed: 0,
    pending: 0,
    averageScore: 0,
    onTimeCount: 0,
    onTimeRate: 0,
  }

  let totalScore = 0
  let scoredCount = 0

  assignments.forEach((assignment) => {
    if (assignment.status === 'submitted' || assignment.status === 'graded') {
      summary.completed++

      // 마감 기한 내 제출 확인
      if (assignment.submitted_at && assignment.assignments?.due_date) {
        const submittedDate = new Date(assignment.submitted_at)
        const dueDate = new Date(assignment.assignments.due_date)
        if (submittedDate <= dueDate) {
          summary.onTimeCount++
        }
      }

      // 점수 집계
      if (assignment.score !== null) {
        totalScore += assignment.score
        scoredCount++
      }
    } else {
      summary.pending++
    }
  })

  summary.averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0
  summary.onTimeRate = summary.completed > 0
    ? Math.round((summary.onTimeCount / summary.completed) * 100)
    : 100

  return summary
}

/**
 * 학생의 성적 데이터 조회 및 요약
 */
export async function fetchGradeSummary(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<GradeSummary> {
  const supabase = createServerSupabaseClient()

  // 현재 기간 성적 조회
  const { data: currentGrades } = await supabase
    .from('grades')
    .select('*')
    .eq('student_id', studentId)
    .gte('date', startDate)
    .lte('date', endDate)

  // 이전 기간 성적 조회 (비교용)
  const periodLength = new Date(endDate).getTime() - new Date(startDate).getTime()
  const prevStartDate = new Date(new Date(startDate).getTime() - periodLength).toISOString().split('T')[0]
  const prevEndDate = new Date(new Date(startDate).getTime() - 1).toISOString().split('T')[0]

  const { data: previousGrades } = await supabase
    .from('grades')
    .select('*')
    .eq('student_id', studentId)
    .gte('date', prevStartDate)
    .lte('date', prevEndDate)

  const current = (currentGrades || []) as Grade[]
  const previous = (previousGrades || []) as Grade[]

  // 전체 평균 계산
  const currentTotal = current.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0)
  const previousTotal = previous.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0)

  const overallAverage = current.length > 0 ? Math.round(currentTotal / current.length) : 0
  const previousAverage = previous.length > 0 ? Math.round(previousTotal / previous.length) : 0

  // 과목별 통계 계산
  const subjectMap = new Map<string, {
    scores: number[]
    previousScores: number[]
  }>()

  current.forEach((g) => {
    if (!subjectMap.has(g.subject)) {
      subjectMap.set(g.subject, { scores: [], previousScores: [] })
    }
    subjectMap.get(g.subject)!.scores.push((g.score / g.max_score) * 100)
  })

  previous.forEach((g) => {
    if (subjectMap.has(g.subject)) {
      subjectMap.get(g.subject)!.previousScores.push((g.score / g.max_score) * 100)
    }
  })

  const bySubject = Array.from(subjectMap.entries()).map(([subject, data]) => {
    const average = data.scores.length > 0
      ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
      : 0
    const prevAvg = data.previousScores.length > 0
      ? Math.round(data.previousScores.reduce((a, b) => a + b, 0) / data.previousScores.length)
      : average

    return {
      subject,
      average,
      change: average - prevAvg,
      testsCount: data.scores.length,
      highestScore: Math.round(Math.max(...data.scores, 0)),
      lowestScore: data.scores.length > 0 ? Math.round(Math.min(...data.scores)) : 0,
    }
  })

  // 단원별 통계는 취약점 분석에서 가져오기
  const stats = await fetchStudentStats(studentId, startDate, endDate)
  const byUnit = Object.entries(stats.byUnit).map(([key, data]) => {
    const [subject, unit] = key.split(':')
    const correctRate = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 100
    return {
      subject,
      unit,
      correctRate,
      totalProblems: data.total,
      isWeak: correctRate < 60,
    }
  })

  return {
    overallAverage,
    previousAverage,
    change: overallAverage - previousAverage,
    bySubject,
    byUnit,
  }
}

// ============================================
// AI 코멘트 생성 함수
// ============================================

/**
 * 학부모용 AI 코멘트 생성
 */
async function generateParentAIComment(
  studentName: string,
  gradeSummary: GradeSummary,
  attendanceSummary: AttendanceSummary,
  assignmentSummary: AssignmentSummary
): Promise<{
  summary: string
  praisePoints: { title: string; description: string; emoji?: string }[]
  conversationTopics: { topic: string; suggestedQuestion: string; context: string }[]
  encouragementMessage: string
  upcomingGoals: { goal: string; howToSupport: string }[]
  aiComment: string
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
당신은 학부모에게 자녀의 학습 상황을 전달하는 교육 전문가입니다.
아래 데이터를 바탕으로 학부모가 자녀와 나눌 수 있는 대화거리 중심의 보고서를 작성해주세요.

## 학생 정보
- 이름: ${studentName}

## 성적 데이터
- 평균 점수: ${gradeSummary.overallAverage}점
- 이전 기간 대비 변화: ${gradeSummary.change > 0 ? '+' : ''}${gradeSummary.change}점
- 과목별 현황: ${gradeSummary.bySubject.map((s) => `${s.subject} ${s.average}점`).join(', ')}
- 잘하는 단원: ${gradeSummary.byUnit.filter((u) => u.correctRate >= 80).map((u) => u.unit).slice(0, 3).join(', ') || '없음'}
- 보강 필요 단원: ${gradeSummary.byUnit.filter((u) => u.isWeak).map((u) => u.unit).slice(0, 3).join(', ') || '없음'}

## 출결 데이터
- 출석률: ${attendanceSummary.attendanceRate}%
- 결석: ${attendanceSummary.absentDays}일, 지각: ${attendanceSummary.lateDays}일

## 과제 데이터
- 완료율: ${assignmentSummary.completed}/${assignmentSummary.totalAssigned}
- 평균 점수: ${assignmentSummary.averageScore}점
- 기한 내 제출률: ${assignmentSummary.onTimeRate}%

## 출력 형식 (JSON)
반드시 아래 형식의 JSON만 출력하세요:

{
  "summary": "이번 주/월 학습 상황 요약 (1-2문장, 긍정적 톤)",
  "praisePoints": [
    {
      "title": "칭찬 제목",
      "description": "구체적인 칭찬 내용",
      "emoji": "적절한 이모지"
    }
  ],
  "conversationTopics": [
    {
      "topic": "대화 주제",
      "suggestedQuestion": "아이에게 물어볼 질문",
      "context": "이 주제를 꺼내는 맥락 설명"
    }
  ],
  "encouragementMessage": "부족한 부분에 대한 긍정적 격려 메시지",
  "upcomingGoals": [
    {
      "goal": "다음 목표",
      "howToSupport": "부모가 도울 수 있는 방법"
    }
  ],
  "aiComment": "종합적인 학습 코멘트 (3-4문장)"
}

## 작성 원칙
1. 긍정적이고 따뜻한 어조 사용
2. 구체적인 사실에 기반한 칭찬
3. 부족한 점도 성장 기회로 표현
4. 학부모가 실천할 수 있는 구체적 조언
5. 칭찬 포인트 2-3개, 대화 주제 2-3개, 목표 1-2개

JSON 형식만 출력하세요.
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanedText)
  } catch (error) {
    console.error('학부모용 AI 코멘트 생성 실패:', error)

    // 폴백 응답
    return {
      summary: `${studentName} 학생이 이번 기간 동안 열심히 학습했습니다.`,
      praisePoints: [
        {
          title: '꾸준한 학습',
          description: '학원 수업에 성실하게 참여했습니다.',
          emoji: '📚',
        },
      ],
      conversationTopics: [
        {
          topic: '학원에서 배운 내용',
          suggestedQuestion: '오늘 학원에서 뭘 배웠어?',
          context: '자녀의 학습에 관심을 표현할 수 있습니다.',
        },
      ],
      encouragementMessage: '앞으로도 꾸준히 노력하면 더 좋은 결과가 있을 거예요!',
      upcomingGoals: [
        {
          goal: '규칙적인 복습 습관 만들기',
          howToSupport: '매일 30분 학습 시간을 정해주세요.',
        },
      ],
      aiComment: `${studentName} 학생은 전반적으로 성실하게 학습하고 있습니다. 가정에서의 관심과 격려가 큰 힘이 됩니다.`,
    }
  }
}

/**
 * 강사용 AI 분석 생성
 */
async function generateTeacherAIAnalysis(
  studentName: string,
  gradeSummary: GradeSummary,
  attendanceSummary: AttendanceSummary,
  assignmentSummary: AssignmentSummary,
  weaknessData: { unit: string; correctRate: number; patterns: string[] }[]
): Promise<{
  summary: string
  keyInsights: string[]
  actionItems: string[]
  recommendations: {
    priority: number
    type: 'concept_review' | 'practice' | 'challenge' | 'counseling'
    title: string
    description: string
    targetUnit?: string
  }[]
  nextClassPrep: {
    suggestedTopics: string[]
    reviewNeeded: string[]
    challengeReady: string[]
  }
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
당신은 학원 강사를 위한 학생 분석 리포트를 작성하는 교육 데이터 분석가입니다.
아래 데이터를 바탕으로 수업 준비에 실질적으로 도움이 되는 분석을 제공해주세요.

## 학생 정보
- 이름: ${studentName}

## 성적 분석
- 평균: ${gradeSummary.overallAverage}점 (변화: ${gradeSummary.change > 0 ? '+' : ''}${gradeSummary.change})
- 과목별: ${gradeSummary.bySubject.map((s) => `${s.subject} ${s.average}점(${s.change > 0 ? '+' : ''}${s.change})`).join(', ')}

## 취약점 분석
${weaknessData.map((w) => `- ${w.unit}: 정답률 ${w.correctRate}%, 패턴: ${w.patterns.join(', ')}`).join('\n')}

## 출결 현황
- 출석률: ${attendanceSummary.attendanceRate}%
- 결석 ${attendanceSummary.absentDays}회, 지각 ${attendanceSummary.lateDays}회

## 과제 현황
- 완료: ${assignmentSummary.completed}/${assignmentSummary.totalAssigned}
- 평균 점수: ${assignmentSummary.averageScore}점
- 기한 준수율: ${assignmentSummary.onTimeRate}%

## 출력 형식 (JSON)
{
  "summary": "학생 학습 상태 종합 요약 (2-3문장)",
  "keyInsights": ["핵심 인사이트 1", "핵심 인사이트 2", "핵심 인사이트 3"],
  "actionItems": ["실행 항목 1", "실행 항목 2"],
  "recommendations": [
    {
      "priority": 1,
      "type": "concept_review 또는 practice 또는 challenge 또는 counseling",
      "title": "추천 제목",
      "description": "구체적인 추천 내용",
      "targetUnit": "대상 단원 (있으면)"
    }
  ],
  "nextClassPrep": {
    "suggestedTopics": ["다음 수업 추천 주제"],
    "reviewNeeded": ["복습 필요한 내용"],
    "challengeReady": ["심화 가능한 내용"]
  }
}

## 작성 원칙
1. 데이터 기반의 객관적 분석
2. 실행 가능한 구체적 조언
3. 우선순위가 명확한 추천
4. 수업 준비에 바로 활용 가능한 정보

JSON 형식만 출력하세요.
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanedText)
  } catch (error) {
    console.error('강사용 AI 분석 생성 실패:', error)

    // 폴백 응답
    const weakUnits = weaknessData.filter((w) => w.correctRate < 60)

    return {
      summary: `${studentName} 학생의 평균 점수는 ${gradeSummary.overallAverage}점입니다.`,
      keyInsights: [
        `전체 평균 ${gradeSummary.overallAverage}점`,
        `출석률 ${attendanceSummary.attendanceRate}%`,
        `과제 완료율 ${Math.round((assignmentSummary.completed / assignmentSummary.totalAssigned) * 100)}%`,
      ],
      actionItems: weakUnits.length > 0
        ? [`${weakUnits[0].unit} 단원 보강 필요`]
        : ['현재 학습 수준 유지'],
      recommendations: weakUnits.slice(0, 3).map((w, i) => ({
        priority: i + 1,
        type: 'concept_review' as const,
        title: `${w.unit} 복습`,
        description: `정답률 ${w.correctRate}%로 추가 학습이 필요합니다.`,
        targetUnit: w.unit,
      })),
      nextClassPrep: {
        suggestedTopics: weakUnits.length > 0 ? [weakUnits[0].unit] : ['다음 단원 진도'],
        reviewNeeded: weakUnits.slice(0, 2).map((w) => w.unit),
        challengeReady: gradeSummary.byUnit.filter((u) => u.correctRate >= 80).slice(0, 2).map((u) => u.unit),
      },
    }
  }
}

// ============================================
// 보고서 생성 함수
// ============================================

/**
 * 학부모용 보고서 생성
 */
export async function generateParentReport(
  student: StudentWithDetails,
  period: ReportPeriod
): Promise<ParentReport> {
  const studentName = student.users?.name || '학생'

  // 데이터 병렬 조회
  const [attendanceSummary, assignmentSummary, gradeSummary] = await Promise.all([
    fetchAttendanceSummary(student.id, period.startDate, period.endDate),
    fetchAssignmentSummary(student.id, period.startDate, period.endDate),
    fetchGradeSummary(student.id, period.startDate, period.endDate),
  ])

  // AI 코멘트 생성
  const aiContent = await generateParentAIComment(
    studentName,
    gradeSummary,
    attendanceSummary,
    assignmentSummary
  )

  // 성적 경향 판단
  let trend: 'improving' | 'stable' | 'needs_attention' = 'stable'
  if (gradeSummary.change >= 5) trend = 'improving'
  else if (gradeSummary.change <= -5) trend = 'needs_attention'

  const trendMessages = {
    improving: '성적이 꾸준히 향상되고 있어요!',
    stable: '안정적으로 학습하고 있어요.',
    needs_attention: '함께 힘을 내면 다시 올라갈 수 있어요.',
  }

  return {
    id: `parent_report_${Date.now()}`,
    studentId: student.id,
    studentName,
    period,
    generatedAt: new Date().toISOString(),
    summary: aiContent.summary,
    praisePoints: aiContent.praisePoints,
    conversationTopics: aiContent.conversationTopics,
    encouragementMessage: aiContent.encouragementMessage,
    upcomingGoals: aiContent.upcomingGoals,
    attendanceSummary: {
      totalDays: attendanceSummary.totalDays,
      presentDays: attendanceSummary.presentDays,
      message: attendanceSummary.attendanceRate >= 90
        ? '출석이 매우 좋습니다!'
        : attendanceSummary.attendanceRate >= 70
        ? '출석을 조금 더 신경 써주세요.'
        : '출석률 개선이 필요합니다.',
    },
    gradeSummary: {
      trend,
      trendMessage: trendMessages[trend],
      strongSubjects: gradeSummary.bySubject
        .filter((s) => s.average >= 80)
        .map((s) => s.subject),
      focusAreas: gradeSummary.byUnit
        .filter((u) => u.isWeak)
        .slice(0, 3)
        .map((u) => u.unit),
    },
    aiComment: aiContent.aiComment,
  }
}

/**
 * 강사용 보고서 생성
 */
export async function generateTeacherReport(
  student: StudentWithDetails,
  period: ReportPeriod
): Promise<TeacherReport> {
  const studentName = student.users?.name || '학생'

  // 데이터 병렬 조회
  const [
    attendanceSummary,
    assignmentSummary,
    gradeSummary,
    wrongAnswers,
  ] = await Promise.all([
    fetchAttendanceSummary(student.id, period.startDate, period.endDate),
    fetchAssignmentSummary(student.id, period.startDate, period.endDate),
    fetchGradeSummary(student.id, period.startDate, period.endDate),
    fetchWrongAnswers(student.id, period.startDate, period.endDate),
  ])

  // 오답 패턴 분석
  const patterns = await analyzeWrongAnswerPatterns(wrongAnswers)

  // 취약점 데이터 정리
  const weakUnits = gradeSummary.byUnit
    .filter((u) => u.isWeak)
    .slice(0, 5)
    .map((u) => {
      const relatedPatterns = patterns
        .filter((p) => p.relatedWrongAnswers.some((wa) =>
          wrongAnswers.find((w) => w.problemId === wa && w.unit === u.unit)
        ))
        .map((p) => p.type)

      return {
        unit: u.unit,
        correctRate: u.correctRate,
        patterns: relatedPatterns,
      }
    })

  // AI 분석 생성
  const aiAnalysis = await generateTeacherAIAnalysis(
    studentName,
    gradeSummary,
    attendanceSummary,
    assignmentSummary,
    weakUnits
  )

  // 출결 특이사항
  const attendanceNotes: string[] = []
  if (attendanceSummary.absentDays > 0) {
    attendanceNotes.push(`결석 ${attendanceSummary.absentDays}일`)
  }
  if (attendanceSummary.lateDays > 0) {
    attendanceNotes.push(`지각 ${attendanceSummary.lateDays}회`)
  }

  return {
    id: `teacher_report_${Date.now()}`,
    studentId: student.id,
    studentName,
    period,
    generatedAt: new Date().toISOString(),
    gradeAnalysis: {
      overallAverage: gradeSummary.overallAverage,
      changeFromPrevious: gradeSummary.change,
      bySubject: gradeSummary.bySubject,
      byUnit: gradeSummary.byUnit,
    },
    weaknessAnalysis: {
      weakUnits: weakUnits.map((w) => ({
        subject: gradeSummary.byUnit.find((u) => u.unit === w.unit)?.subject || '',
        unit: w.unit,
        correctRate: w.correctRate,
        suggestedAction: w.correctRate < 40
          ? '기초 개념부터 재학습 필요'
          : '추가 연습 문제 배정 권장',
      })),
      errorPatterns: patterns.slice(0, 5).map((p) => ({
        pattern: p.type,
        frequency: p.frequency,
        description: p.description,
      })),
    },
    attendanceDetails: {
      totalDays: attendanceSummary.totalDays,
      presentDays: attendanceSummary.presentDays,
      absentDays: attendanceSummary.absentDays,
      lateDays: attendanceSummary.lateDays,
      attendanceRate: attendanceSummary.attendanceRate,
      notes: attendanceNotes,
    },
    assignmentStatus: {
      totalAssigned: assignmentSummary.totalAssigned,
      completed: assignmentSummary.completed,
      pending: assignmentSummary.pending,
      averageScore: assignmentSummary.averageScore,
      onTimeRate: assignmentSummary.onTimeRate,
    },
    recommendations: aiAnalysis.recommendations,
    nextClassPrep: aiAnalysis.nextClassPrep,
    aiAnalysis: {
      summary: aiAnalysis.summary,
      keyInsights: aiAnalysis.keyInsights,
      actionItems: aiAnalysis.actionItems,
    },
  }
}

// ============================================
// 메인 함수: 여러 학생 병렬 보고서 생성
// ============================================

/**
 * 여러 학생의 보고서를 병렬로 생성
 *
 * Vercel Best Practice: async-parallel 패턴 적용
 * 기본 5개씩 병렬 처리하여 API Rate Limit 방지
 */
export async function generateReportsForStudents(
  students: StudentWithDetails[],
  period: ReportPeriod,
  options: {
    generateParent?: boolean
    generateTeacher?: boolean
    batchSize?: number
  } = {}
): Promise<AutoReportGenerateResult[]> {
  const {
    generateParent = true,
    generateTeacher = true,
    batchSize = 5, // 기본 5개씩 병렬 처리
  } = options

  const results: AutoReportGenerateResult[] = []

  // 배치 단위로 병렬 처리
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(async (student): Promise<AutoReportGenerateResult> => {
        try {
          const studentName = student.users?.name || '학생'

          // 보고서 병렬 생성
          const [parentReport, teacherReport] = await Promise.all([
            generateParent ? generateParentReport(student, period) : Promise.resolve(undefined),
            generateTeacher ? generateTeacherReport(student, period) : Promise.resolve(undefined),
          ])

          return {
            studentId: student.id,
            studentName,
            parentReport,
            teacherReport,
            success: true,
          }
        } catch (error) {
          console.error(`학생 ${student.id} 보고서 생성 실패:`, error)
          return {
            studentId: student.id,
            studentName: student.users?.name || '학생',
            success: false,
            error: error instanceof Error ? error.message : '보고서 생성 중 오류 발생',
          }
        }
      })
    )

    results.push(...batchResults)

    // API Rate Limit 방지를 위한 짧은 대기 (배치 간)
    if (i + batchSize < students.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return results
}

/**
 * 리포트 기간 객체 생성
 */
export function createReportPeriod(
  periodType: ReportPeriodType,
  startDate: string,
  endDate: string
): ReportPeriod {
  const start = new Date(startDate)
  const year = start.getFullYear()
  const month = start.getMonth() + 1

  // 주차 계산
  const firstDayOfMonth = new Date(year, month - 1, 1)
  const dayOfMonth = start.getDate()
  const week = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7)

  // 라벨 생성
  let label: string
  if (periodType === 'monthly') {
    label = `${year}년 ${month}월`
  } else {
    label = `${year}년 ${month}월 ${week}주차`
  }

  return {
    type: periodType,
    startDate,
    endDate,
    label,
    year,
    month,
    week: periodType === 'weekly' ? week : undefined,
  }
}
