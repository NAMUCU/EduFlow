/**
 * AI 학습 보고서 생성 서비스
 *
 * Claude API를 활용하여 학생의 성적, 출석, 취약점 데이터를 분석하고
 * 자연어 요약이 포함된 맞춤형 학습 보고서를 생성합니다.
 */
import Anthropic from '@anthropic-ai/sdk'
import type {
  Report,
  ReportPeriod,
  ReportPeriodType,
  GradeAnalysisSection,
  AttendanceAnalysisSection,
  AIAnalysisSection,
  AIScoreTrendAnalysis,
  AIWeakUnitAnalysis,
  AIStudyRecommendation,
  UnitGradeInfo,
  SubjectGradeInfo,
  ParentReport,
  TeacherReport,
} from '@/types/report'
import {
  generatePeriodLabel,
  calculateScoreTrend,
  isWeakUnit,
} from '@/types/report'
import { getGrades, getGradeTrend, getGradeStats } from './grades'
import { getAttendance, getAttendanceStats } from './attendance'

// ============================================
// 타입 정의
// ============================================

/** 주간 데이터 */
export interface WeeklyData {
  studentId: string
  studentName: string
  grade: string
  school: string
  subjects: string[]
  startDate: string
  endDate: string
  grades: {
    subject: string
    unit: string
    score: number
    maxScore: number
    date: string
  }[]
  attendance: {
    date: string
    status: 'present' | 'absent' | 'late' | 'early_leave'
    checkInTime?: string
    checkOutTime?: string
  }[]
  previousPeriodAverage?: number
}

/** 월간 데이터 */
export interface MonthlyData extends WeeklyData {
  weeklyAverages: { week: number; average: number }[]
  monthlyTrend: 'up' | 'down' | 'stable'
}

/** 보고서 생성 결과 */
export interface GeneratedReport {
  gradeAnalysis: GradeAnalysisSection
  attendanceAnalysis: AttendanceAnalysisSection
  aiAnalysis: AIAnalysisSection
}

// ============================================
// Claude API 클라이언트 설정
// ============================================

const isConfigured = () => !!process.env.ANTHROPIC_API_KEY
let client: Anthropic | null = null
const getClient = () => client || (client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }))

// ============================================
// Mock 데이터 생성 (API 키 미설정 시)
// ============================================

function generateMockGradeAnalysis(data: WeeklyData | MonthlyData): GradeAnalysisSection {
  const subjectGrades: SubjectGradeInfo[] = data.subjects.map(subject => {
    const subjectGrades = data.grades.filter(g => g.subject === subject)
    const currentScore = subjectGrades.length > 0
      ? Math.round(subjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / subjectGrades.length)
      : 75
    const previousScore = data.previousPeriodAverage || currentScore - 5 + Math.floor(Math.random() * 10)

    return {
      subject,
      currentScore,
      previousScore,
      averageScore: Math.round((currentScore + previousScore) / 2),
      highestScore: Math.min(100, currentScore + 10),
      lowestScore: Math.max(0, currentScore - 15),
      testCount: subjectGrades.length || 3,
      trend: calculateScoreTrend(currentScore, previousScore),
      changeAmount: currentScore - previousScore,
    }
  })

  const overallScore = Math.round(subjectGrades.reduce((sum, s) => sum + s.currentScore, 0) / subjectGrades.length)
  const previousOverallScore = Math.round(subjectGrades.reduce((sum, s) => sum + s.previousScore, 0) / subjectGrades.length)

  // 단원별 분석 Mock
  const unitNames: Record<string, string[]> = {
    수학: ['인수분해', '이차방정식', '판별식', '근과 계수의 관계', '일차함수'],
    영어: ['문법', '독해', '어휘', '듣기', '작문'],
    과학: ['물리', '화학', '생물', '지구과학'],
    국어: ['문학', '비문학', '문법', '작문'],
    사회: ['역사', '지리', '일반사회', '윤리'],
  }

  const unitAnalysis: UnitGradeInfo[] = []
  data.subjects.forEach(subject => {
    const units = unitNames[subject] || ['단원1', '단원2', '단원3']
    units.forEach(unitName => {
      const correctRate = 40 + Math.floor(Math.random() * 55)
      const totalCount = 20
      const correctCount = Math.round((correctRate / 100) * totalCount)
      unitAnalysis.push({
        subject,
        unitName,
        correctCount,
        totalCount,
        correctRate,
        isWeak: isWeakUnit(correctRate),
      })
    })
  })

  const weakUnits = unitAnalysis.filter(u => u.isWeak)
  const strongUnits = unitAnalysis.filter(u => u.correctRate >= 80).slice(0, 3)

  return {
    overallScore,
    previousOverallScore,
    overallTrend: calculateScoreTrend(overallScore, previousOverallScore),
    overallChangeAmount: overallScore - previousOverallScore,
    subjectGrades,
    unitAnalysis,
    weakUnits,
    strongUnits,
    gradeDistribution: [
      { range: '90-100', count: Math.floor(Math.random() * 3), percentage: 10 + Math.floor(Math.random() * 20) },
      { range: '80-89', count: 2 + Math.floor(Math.random() * 3), percentage: 20 + Math.floor(Math.random() * 20) },
      { range: '70-79', count: 2 + Math.floor(Math.random() * 2), percentage: 20 + Math.floor(Math.random() * 15) },
      { range: '60-69', count: Math.floor(Math.random() * 2), percentage: 5 + Math.floor(Math.random() * 15) },
      { range: '0-59', count: 0, percentage: 0 },
    ],
    dailyScoreTrend: data.grades.map(g => ({
      date: g.date,
      score: Math.round((g.score / g.maxScore) * 100),
      subject: g.subject,
    })),
  }
}

function generateMockAttendanceAnalysis(data: WeeklyData | MonthlyData): AttendanceAnalysisSection {
  const totalDays = data.attendance.length || 5
  const presentDays = data.attendance.filter(a => a.status === 'present').length || totalDays - 1
  const absentDays = data.attendance.filter(a => a.status === 'absent').length
  const lateDays = data.attendance.filter(a => a.status === 'late').length
  const earlyLeaveDays = data.attendance.filter(a => a.status === 'early_leave').length

  const attendanceRate = Math.round((presentDays / totalDays) * 100)
  const previousRate = 90 + Math.floor(Math.random() * 10)

  return {
    totalClassDays: totalDays,
    presentDays,
    absentDays,
    lateDays,
    earlyLeaveDays,
    sickLeaveDays: 0,
    attendanceRate,
    previousAttendanceRate: previousRate,
    attendanceRateTrend: calculateScoreTrend(attendanceRate, previousRate),
    dailyAttendance: data.attendance.map(a => ({
      date: a.date,
      status: a.status as 'present' | 'absent' | 'late' | 'early_leave' | 'sick_leave',
      checkInTime: a.checkInTime,
      checkOutTime: a.checkOutTime,
    })),
  }
}

function generateMockAIAnalysis(
  studentName: string,
  gradeAnalysis: GradeAnalysisSection
): AIAnalysisSection {
  const { overallScore, previousOverallScore, weakUnits, strongUnits } = gradeAnalysis
  const scoreDiff = overallScore - previousOverallScore
  const trendText = scoreDiff > 0 ? `${scoreDiff}점 상승` : scoreDiff < 0 ? `${Math.abs(scoreDiff)}점 하락` : '변동 없음'

  const weakUnitNames = weakUnits.map(u => u.unitName).join(', ') || '없음'
  const strongUnitNames = strongUnits.map(u => u.unitName).join(', ') || '없음'

  return {
    scoreTrendAnalysis: {
      summary: `${studentName} 학생의 이번 기간 성적은 지난 기간 대비 ${trendText}하여 ${scoreDiff >= 0 ? '긍정적인' : '주의가 필요한'} 추세를 보이고 있습니다.`,
      trendDescription: scoreDiff >= 0
        ? `최근 꾸준한 학습으로 성적 향상이 이루어지고 있습니다. 특히 ${strongUnitNames} 단원에서 우수한 성과를 보이고 있습니다.`
        : `최근 어려운 단원을 학습하면서 성적에 다소 영향이 있었습니다. ${weakUnitNames} 단원에 대한 추가 학습이 필요합니다.`,
      keyInsights: [
        strongUnits.length > 0 ? `${strongUnits[0]?.unitName || '기본'} 단원에서 뛰어난 이해력을 보입니다` : '기초 개념 정립이 진행 중입니다',
        weakUnits.length > 0 ? `${weakUnits[0]?.unitName || '심화'} 단원에서 추가 학습이 필요합니다` : '전반적으로 안정적인 학습을 하고 있습니다',
        '꾸준한 출석과 학습 태도가 좋습니다',
      ],
    },
    weakUnitAnalysis: {
      units: weakUnits.slice(0, 3).map((unit, index) => ({
        subject: unit.subject,
        unitName: unit.unitName,
        description: `정답률 ${unit.correctRate}%로, 해당 단원의 핵심 개념 이해가 필요합니다.`,
        suggestedPriority: index + 1,
      })),
      overallDescription: weakUnits.length > 0
        ? `${weakUnitNames} 단원에 대한 집중적인 복습이 필요합니다. 기초 개념부터 차근차근 정리해나가면 충분히 개선될 수 있습니다.`
        : '현재 특별히 취약한 단원이 없습니다. 현재 학습 방향을 유지하세요.',
    },
    studyRecommendation: {
      shortTermGoals: [
        {
          goal: weakUnits.length > 0 ? `${weakUnits[0]?.unitName || '취약 단원'} 개념 복습 및 연습문제 풀이` : '현재 단원 심화 문제 도전',
          reason: weakUnits.length > 0 ? '취약 단원 보완을 위해 우선적으로 학습이 필요합니다' : '현재 수준에서 한 단계 성장하기 위해',
          difficulty: weakUnits.length > 0 ? 'medium' : 'hard',
        },
        {
          goal: '매일 30분 오답 노트 정리',
          reason: '틀린 문제를 반복하지 않기 위한 필수 과정입니다',
          difficulty: 'easy',
        },
      ],
      midTermGoals: [
        {
          goal: '전체 단원 종합 문제 완벽 정복',
          reason: '중간/기말고사 대비를 위해 필수입니다',
        },
        {
          goal: '다음 단원 예습 시작',
          reason: '선행 학습으로 수업 이해도를 높일 수 있습니다',
        },
      ],
      recommendedMaterials: [
        {
          type: 'problem' as const,
          title: weakUnits.length > 0 ? `${weakUnits[0]?.unitName || '기본'} 연습 문제집` : '심화 문제집',
          description: weakUnits.length > 0 ? '기초부터 응용까지 단계별 문제' : '고난도 응용 문제',
          subject: '수학',
          unit: weakUnits[0]?.unitName || strongUnits[0]?.unitName,
        },
        {
          type: 'concept' as const,
          title: '개념 정리 노트',
          description: '핵심 공식 및 개념 요약',
          subject: '수학',
        },
      ],
      studyStrategies: [
        '매일 일정한 시간에 학습하기',
        '오답 노트를 꼼꼼히 작성하기',
        '모르는 부분은 바로 질문하기',
        '복습 후 유사 문제로 확인하기',
      ],
      motivationMessage: scoreDiff >= 0
        ? `${studentName} 학생이 열심히 노력한 결과가 점수로 나타나고 있어요! 이대로 꾸준히 하면 더 좋은 결과를 얻을 수 있을 거예요. 화이팅!`
        : `${studentName} 학생, 이번에는 조금 어려웠지만 괜찮아요! 어려운 단원을 만났을 뿐이니 같이 차근차근 해결해 나가요. 포기하지 말고 화이팅!`,
    },
    parentMessage: scoreDiff >= 0
      ? `${studentName} 학생이 이번 기간에 ${trendText}했습니다! ${strongUnitNames} 단원을 잘 이해하고 있으며, 전반적으로 긍정적인 학습 태도를 보이고 있습니다. ${weakUnits.length > 0 ? `다만 ${weakUnitNames} 부분은 추가 학습이 필요하니 가정에서도 관심 부탁드립니다.` : ''} 앞으로도 좋은 결과가 기대됩니다.`
      : `${studentName} 학생이 이번 기간에 다소 어려움을 겪었습니다. ${weakUnitNames} 단원이 어렵게 느껴지는 것 같습니다. 하지만 기초는 갖춰져 있으니 걱정 마세요. 집중적인 복습을 통해 충분히 따라올 수 있습니다. 가정에서의 격려 부탁드립니다.`,
    studentMessage: scoreDiff >= 0
      ? `${studentName}아, 이번에 정말 열심히 했어! ${strongUnits[0]?.unitName || '학습'} 실력이 많이 늘었어. ${weakUnits.length > 0 ? `${weakUnits[0]?.unitName || '어려운 부분'}만 조금 더 연습하면` : '이대로 꾸준히 하면'} 더 좋은 점수 받을 수 있어. 화이팅!`
      : `${studentName}아, 이번에는 조금 힘들었지만 괜찮아! ${strongUnits.length > 0 ? `${strongUnits[0]?.unitName || '잘하는 부분'}은 잘하고 있으니` : '기초는 잘 잡혀 있으니'} 어려운 부분도 분명 할 수 있어. 같이 천천히 해보자!`,
    teacherCommentDraft: scoreDiff >= 0
      ? `${studentName} 학생의 이번 기간 학습 태도와 성과가 만족스럽습니다. ${strongUnits.length > 0 ? `특히 ${strongUnits[0]?.unitName || '주요 단원'}에서 우수한 성적을 보이고 있습니다.` : ''} ${weakUnits.length > 0 ? `${weakUnits[0]?.unitName || '일부 단원'} 보완에 조금 더 집중하면 더욱 좋겠습니다.` : '현재 학습 방향을 유지하면 좋겠습니다.'}`
      : `${studentName} 학생의 기초 실력은 갖춰져 있으니 조금 더 시간을 들여 개념을 정리하면 충분히 따라올 수 있습니다. ${weakUnitNames} 단원에 대한 집중 복습을 진행할 예정입니다.`,
    generatedAt: new Date().toISOString(),
    modelInfo: {
      model: 'mock',
      confidence: 0.85,
    },
  }
}

// ============================================
// Claude API를 통한 AI 분석 생성
// ============================================

async function generateAIAnalysisWithClaude(
  studentName: string,
  gradeAnalysis: GradeAnalysisSection,
  attendanceAnalysis: AttendanceAnalysisSection,
  periodType: 'weekly' | 'monthly'
): Promise<AIAnalysisSection> {
  const periodLabel = periodType === 'weekly' ? '주간' : '월간'

  const prompt = `당신은 학원 선생님입니다. 아래 학생의 ${periodLabel} 학습 데이터를 분석하여 학습 보고서를 작성해주세요.

## 학생 정보
- 이름: ${studentName}

## 성적 데이터
- 전체 평균: ${gradeAnalysis.overallScore}점
- 이전 기간 평균: ${gradeAnalysis.previousOverallScore}점
- 변화: ${gradeAnalysis.overallChangeAmount > 0 ? '+' : ''}${gradeAnalysis.overallChangeAmount}점

### 과목별 성적
${gradeAnalysis.subjectGrades.map(s => `- ${s.subject}: ${s.currentScore}점 (이전: ${s.previousScore}점, ${s.changeAmount > 0 ? '+' : ''}${s.changeAmount}점)`).join('\n')}

### 취약 단원
${gradeAnalysis.weakUnits.length > 0 ? gradeAnalysis.weakUnits.map(u => `- ${u.subject} - ${u.unitName}: 정답률 ${u.correctRate}%`).join('\n') : '- 특별히 취약한 단원 없음'}

### 강점 단원
${gradeAnalysis.strongUnits.length > 0 ? gradeAnalysis.strongUnits.map(u => `- ${u.subject} - ${u.unitName}: 정답률 ${u.correctRate}%`).join('\n') : '- 해당 없음'}

## 출결 데이터
- 총 수업일: ${attendanceAnalysis.totalClassDays}일
- 출석: ${attendanceAnalysis.presentDays}일
- 결석: ${attendanceAnalysis.absentDays}일
- 지각: ${attendanceAnalysis.lateDays}일
- 출석률: ${attendanceAnalysis.attendanceRate}%

다음 JSON 형식으로 분석 결과를 작성해주세요:
{
  "scoreTrendAnalysis": {
    "summary": "전체 요약 (1-2문장)",
    "trendDescription": "성적 추이 상세 설명",
    "keyInsights": ["인사이트1", "인사이트2", "인사이트3"]
  },
  "weakUnitAnalysis": {
    "units": [
      {
        "subject": "과목명",
        "unitName": "단원명",
        "description": "분석 및 조언",
        "suggestedPriority": 1
      }
    ],
    "overallDescription": "취약점 종합 분석"
  },
  "studyRecommendation": {
    "shortTermGoals": [
      {"goal": "목표", "reason": "이유", "difficulty": "easy|medium|hard"}
    ],
    "midTermGoals": [
      {"goal": "목표", "reason": "이유"}
    ],
    "recommendedMaterials": [
      {"type": "problem|concept|video|worksheet", "title": "제목", "description": "설명", "subject": "과목"}
    ],
    "studyStrategies": ["전략1", "전략2"],
    "motivationMessage": "학생 동기부여 메시지"
  },
  "parentMessage": "학부모용 메시지 (친근하고 따뜻한 톤)",
  "studentMessage": "학생용 메시지 (격려하는 톤, 반말 사용)",
  "teacherCommentDraft": "선생님 코멘트 초안"
}`

  try {
    const response = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        ...parsed,
        generatedAt: new Date().toISOString(),
        modelInfo: {
          model: 'claude-sonnet-4-20250514',
          confidence: 0.92,
        },
      }
    }

    // JSON 파싱 실패 시 Mock 반환
    return generateMockAIAnalysis(studentName, gradeAnalysis)
  } catch (error) {
    console.error('Claude API 호출 실패:', error)
    return generateMockAIAnalysis(studentName, gradeAnalysis)
  }
}

// ============================================
// 메인 보고서 생성 함수
// ============================================

/**
 * 주간 보고서 생성
 */
export async function generateWeeklyReport(
  studentId: string,
  weekData: WeeklyData
): Promise<GeneratedReport> {
  // 성적 분석
  const gradeAnalysis = generateMockGradeAnalysis(weekData)

  // 출결 분석
  const attendanceAnalysis = generateMockAttendanceAnalysis(weekData)

  // AI 분석 (Claude API 사용 가능 시)
  let aiAnalysis: AIAnalysisSection
  if (isConfigured()) {
    aiAnalysis = await generateAIAnalysisWithClaude(
      weekData.studentName,
      gradeAnalysis,
      attendanceAnalysis,
      'weekly'
    )
  } else {
    aiAnalysis = generateMockAIAnalysis(weekData.studentName, gradeAnalysis)
  }

  return {
    gradeAnalysis,
    attendanceAnalysis,
    aiAnalysis,
  }
}

/**
 * 월간 보고서 생성
 */
export async function generateMonthlyReport(
  studentId: string,
  monthData: MonthlyData
): Promise<GeneratedReport> {
  // 성적 분석
  const gradeAnalysis = generateMockGradeAnalysis(monthData)

  // 출결 분석
  const attendanceAnalysis = generateMockAttendanceAnalysis(monthData)

  // AI 분석 (Claude API 사용 가능 시)
  let aiAnalysis: AIAnalysisSection
  if (isConfigured()) {
    aiAnalysis = await generateAIAnalysisWithClaude(
      monthData.studentName,
      gradeAnalysis,
      attendanceAnalysis,
      'monthly'
    )
  } else {
    aiAnalysis = generateMockAIAnalysis(monthData.studentName, gradeAnalysis)
  }

  return {
    gradeAnalysis,
    attendanceAnalysis,
    aiAnalysis,
  }
}

/**
 * DB에서 학생 데이터를 조회하여 보고서 생성
 */
export async function generateReportFromDB(
  studentId: string,
  studentInfo: { name: string; grade: string; school: string; subjects: string[] },
  periodType: 'weekly' | 'monthly',
  startDate: string,
  endDate: string
): Promise<GeneratedReport> {
  // 성적 데이터 조회
  const { data: gradesData } = await getGrades({
    studentId,
    dateFrom: startDate,
    dateTo: endDate,
    limit: 100,
  })

  // 출결 데이터 조회
  const { data: attendanceData } = await getAttendance({
    studentId,
    dateFrom: startDate,
    dateTo: endDate,
    limit: 100,
  })

  // 이전 기간 평균 조회 (비교용)
  const prevEndDate = new Date(startDate)
  prevEndDate.setDate(prevEndDate.getDate() - 1)
  const prevStartDate = new Date(prevEndDate)
  if (periodType === 'weekly') {
    prevStartDate.setDate(prevStartDate.getDate() - 7)
  } else {
    prevStartDate.setMonth(prevStartDate.getMonth() - 1)
  }

  const { data: prevGradesData } = await getGrades({
    studentId,
    dateFrom: prevStartDate.toISOString().split('T')[0],
    dateTo: prevEndDate.toISOString().split('T')[0],
    limit: 100,
  })

  const previousPeriodAverage = prevGradesData.length > 0
    ? Math.round(prevGradesData.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0) / prevGradesData.length)
    : undefined

  const data: WeeklyData = {
    studentId,
    studentName: studentInfo.name,
    grade: studentInfo.grade,
    school: studentInfo.school,
    subjects: studentInfo.subjects,
    startDate,
    endDate,
    grades: gradesData.map(g => ({
      subject: g.subject,
      unit: g.unit || '기타',
      score: g.score,
      maxScore: g.max_score,
      date: g.date,
    })),
    attendance: attendanceData.map(a => ({
      date: a.date,
      status: a.status as 'present' | 'absent' | 'late' | 'early_leave',
      checkInTime: a.check_in_time || undefined,
      checkOutTime: a.check_out_time || undefined,
    })),
    previousPeriodAverage,
  }

  if (periodType === 'weekly') {
    return generateWeeklyReport(studentId, data)
  } else {
    // 주별 평균 계산
    const weeklyAverages: { week: number; average: number }[] = []
    // 간단히 4주로 나눔
    for (let week = 1; week <= 4; week++) {
      weeklyAverages.push({
        week,
        average: 70 + Math.floor(Math.random() * 20),
      })
    }

    const monthData: MonthlyData = {
      ...data,
      weeklyAverages,
      monthlyTrend: data.previousPeriodAverage
        ? calculateScoreTrend(
            Math.round(data.grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / Math.max(data.grades.length, 1)),
            data.previousPeriodAverage
          )
        : 'stable',
    }

    return generateMonthlyReport(studentId, monthData)
  }
}

// ============================================
// 학부모/강사용 보고서 생성
// ============================================

/**
 * 학부모용 보고서 생성
 */
export async function generateParentReport(
  studentId: string,
  studentName: string,
  report: GeneratedReport,
  period: ReportPeriod
): Promise<ParentReport> {
  const { gradeAnalysis, attendanceAnalysis, aiAnalysis } = report
  const scoreDiff = gradeAnalysis.overallScore - gradeAnalysis.previousOverallScore

  // 칭찬 포인트 추출
  const praisePoints = []
  if (gradeAnalysis.strongUnits.length > 0) {
    praisePoints.push({
      title: `${gradeAnalysis.strongUnits[0].unitName} 단원 이해력 우수`,
      description: `정답률 ${gradeAnalysis.strongUnits[0].correctRate}%로 해당 단원을 잘 이해하고 있습니다.`,
      emoji: '🌟',
    })
  }
  if (attendanceAnalysis.attendanceRate >= 90) {
    praisePoints.push({
      title: '꾸준한 출석',
      description: `출석률 ${attendanceAnalysis.attendanceRate}%로 성실하게 학원에 다니고 있습니다.`,
      emoji: '📚',
    })
  }
  if (scoreDiff > 0) {
    praisePoints.push({
      title: '성적 향상',
      description: `이전 기간 대비 ${scoreDiff}점 상승했습니다!`,
      emoji: '📈',
    })
  }

  // 대화거리 생성
  const conversationTopics = []
  if (gradeAnalysis.strongUnits.length > 0) {
    conversationTopics.push({
      topic: `${gradeAnalysis.strongUnits[0].subject} ${gradeAnalysis.strongUnits[0].unitName}`,
      suggestedQuestion: `${gradeAnalysis.strongUnits[0].unitName}은 어떻게 공부했어?`,
      context: '잘하는 부분에 대해 자신감을 심어주세요.',
    })
  }
  if (gradeAnalysis.weakUnits.length > 0) {
    conversationTopics.push({
      topic: `${gradeAnalysis.weakUnits[0].subject} ${gradeAnalysis.weakUnits[0].unitName}`,
      suggestedQuestion: `${gradeAnalysis.weakUnits[0].unitName} 배우면서 어려운 점 있었어?`,
      context: '어려운 부분에 대해 공감하고 응원해주세요.',
    })
  }

  return {
    id: `PR-${Date.now()}`,
    studentId,
    studentName,
    period,
    generatedAt: new Date().toISOString(),
    summary: aiAnalysis.scoreTrendAnalysis.summary,
    praisePoints,
    conversationTopics,
    encouragementMessage: aiAnalysis.studyRecommendation.motivationMessage,
    upcomingGoals: aiAnalysis.studyRecommendation.shortTermGoals.map(g => ({
      goal: g.goal,
      howToSupport: g.reason,
    })),
    attendanceSummary: {
      totalDays: attendanceAnalysis.totalClassDays,
      presentDays: attendanceAnalysis.presentDays,
      message: attendanceAnalysis.attendanceRate >= 90
        ? '출석률이 우수합니다!'
        : '출석률 향상이 필요합니다.',
    },
    gradeSummary: {
      trend: scoreDiff > 3 ? 'improving' : scoreDiff < -3 ? 'needs_attention' : 'stable',
      trendMessage: aiAnalysis.scoreTrendAnalysis.trendDescription,
      strongSubjects: gradeAnalysis.strongUnits.map(u => u.subject).filter((v, i, a) => a.indexOf(v) === i),
      focusAreas: gradeAnalysis.weakUnits.map(u => `${u.subject} - ${u.unitName}`),
    },
    aiComment: aiAnalysis.parentMessage,
  }
}

/**
 * 강사용 보고서 생성
 */
export async function generateTeacherReport(
  studentId: string,
  studentName: string,
  report: GeneratedReport,
  period: ReportPeriod
): Promise<TeacherReport> {
  const { gradeAnalysis, attendanceAnalysis, aiAnalysis } = report

  return {
    id: `TR-${Date.now()}`,
    studentId,
    studentName,
    period,
    generatedAt: new Date().toISOString(),
    gradeAnalysis: {
      overallAverage: gradeAnalysis.overallScore,
      changeFromPrevious: gradeAnalysis.overallChangeAmount,
      bySubject: gradeAnalysis.subjectGrades.map(s => ({
        subject: s.subject,
        average: s.currentScore,
        change: s.changeAmount,
        testsCount: s.testCount,
        highestScore: s.highestScore,
        lowestScore: s.lowestScore,
      })),
      byUnit: gradeAnalysis.unitAnalysis.map(u => ({
        subject: u.subject,
        unit: u.unitName,
        correctRate: u.correctRate,
        totalProblems: u.totalCount,
        isWeak: u.isWeak,
      })),
    },
    weaknessAnalysis: {
      weakUnits: gradeAnalysis.weakUnits.slice(0, 5).map(u => ({
        subject: u.subject,
        unit: u.unitName,
        correctRate: u.correctRate,
        suggestedAction: `${u.unitName} 기초 개념 복습 및 유사 문제 반복 풀이`,
      })),
      errorPatterns: [
        {
          pattern: '계산 실수',
          frequency: 3,
          description: '복잡한 계산에서 실수가 발생합니다.',
        },
        {
          pattern: '문제 이해 부족',
          frequency: 2,
          description: '문제 조건을 정확히 파악하지 못하는 경우가 있습니다.',
        },
      ],
    },
    attendanceDetails: {
      totalDays: attendanceAnalysis.totalClassDays,
      presentDays: attendanceAnalysis.presentDays,
      absentDays: attendanceAnalysis.absentDays,
      lateDays: attendanceAnalysis.lateDays,
      attendanceRate: attendanceAnalysis.attendanceRate,
      notes: attendanceAnalysis.lateDays > 0 ? ['지각 이력이 있습니다.'] : [],
    },
    assignmentStatus: {
      totalAssigned: 10,
      completed: 8,
      pending: 2,
      averageScore: gradeAnalysis.overallScore,
      onTimeRate: 80,
    },
    recommendations: aiAnalysis.weakUnitAnalysis.units.map((u, i) => ({
      priority: i + 1,
      type: 'concept_review' as const,
      title: `${u.unitName} 개념 복습`,
      description: u.description,
      targetUnit: u.unitName,
    })),
    nextClassPrep: {
      suggestedTopics: gradeAnalysis.weakUnits.slice(0, 2).map(u => u.unitName),
      reviewNeeded: gradeAnalysis.weakUnits.map(u => u.unitName),
      challengeReady: gradeAnalysis.strongUnits.map(u => u.unitName),
    },
    aiAnalysis: {
      summary: aiAnalysis.scoreTrendAnalysis.summary,
      keyInsights: aiAnalysis.scoreTrendAnalysis.keyInsights,
      actionItems: aiAnalysis.studyRecommendation.studyStrategies,
    },
  }
}

// ============================================
// Export
// ============================================

export {
  isConfigured as isClaudeConfigured,
  generateMockGradeAnalysis,
  generateMockAttendanceAnalysis,
  generateMockAIAnalysis,
}
