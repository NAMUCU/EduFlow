/**
 * 대시보드 통계 서비스
 *
 * 역할별 대시보드에서 필요한 통계 데이터를 Supabase에서 조회합니다.
 * - getAdminStats: 관리자용 전체 서비스 통계
 * - getTeacherStats: 선생님용 학원 통계
 * - getStudentStats: 학생용 개인 통계
 */

import { createServerSupabaseClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  AdminStats,
  TeacherStats,
  StudentStats,
  PeriodType,
  TimeSeriesDataPoint,
  SubjectStats,
  AcademySummary,
  StudentSummary,
  AssignmentSummary,
} from '@/types/stats'

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 기간에 따른 시작 날짜 계산
 */
function getPeriodStartDate(period: PeriodType): Date {
  const now = new Date()
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week':
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      return new Date(now.getFullYear(), now.getMonth(), diff)
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'quarter':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3
      return new Date(now.getFullYear(), quarterMonth, 1)
    case 'year':
      return new Date(now.getFullYear(), 0, 1)
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1)
  }
}

/**
 * 이전 기간 시작 날짜 계산 (비교용)
 */
function getPreviousPeriodStartDate(period: PeriodType): Date {
  const currentStart = getPeriodStartDate(period)

  switch (period) {
    case 'day':
      return new Date(currentStart.getTime() - 24 * 60 * 60 * 1000)
    case 'week':
      return new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'month':
      return new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1)
    case 'quarter':
      return new Date(currentStart.getFullYear(), currentStart.getMonth() - 3, 1)
    case 'year':
      return new Date(currentStart.getFullYear() - 1, 0, 1)
    default:
      return new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1)
  }
}

/**
 * 날짜를 ISO 문자열로 변환
 */
function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * 일별 데이터 포인트 생성
 */
function generateDailyDataPoints(days: number): { date: string; label: string }[] {
  const points: { date: string; label: string }[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    points.push({
      date: toISODateString(date),
      label: `${date.getDate()}일`,
    })
  }

  return points
}

// ============================================
// 관리자 통계 서비스
// ============================================

export interface AdminStatsOptions {
  academyId?: string
  period?: PeriodType
}

/**
 * 관리자용 대시보드 통계 조회
 *
 * @param options.academyId - 특정 학원만 조회 (선택)
 * @param options.period - 기간 (day, week, month, quarter, year)
 * @returns AdminStats - 관리자 통계 데이터
 */
export async function getAdminStats(options: AdminStatsOptions = {}): Promise<AdminStats> {
  const { period = 'month' } = options
  const supabase = createServerSupabaseClient()

  const periodStart = getPeriodStartDate(period)
  const previousPeriodStart = getPreviousPeriodStartDate(period)
  const periodStartStr = toISODateString(periodStart)
  const previousPeriodStartStr = toISODateString(previousPeriodStart)

  // 병렬로 모든 통계 조회
  const [
    academyStats,
    userStats,
    problemStats,
    recentAcademies,
    problemsBySubject,
    dailyProblems,
  ] = await Promise.all([
    // 학원 통계
    getAcademyStats(supabase, periodStartStr, previousPeriodStartStr),
    // 사용자 통계
    getUserStats(supabase, periodStartStr, previousPeriodStartStr),
    // 문제 통계
    getProblemStats(supabase, periodStartStr, previousPeriodStartStr),
    // 최근 가입 학원
    getRecentAcademies(supabase, 5),
    // 과목별 문제 분포
    getProblemsBySubject(supabase, periodStartStr),
    // 일별 문제 생성 추이
    getDailyProblemsTrend(supabase, 14),
  ])

  // 상위 학원 조회
  const topAcademies = await getTopAcademies(supabase, periodStartStr, 5)

  return {
    // 요약 통계
    totalAcademies: academyStats.total,
    totalAcademiesChange: academyStats.change,
    totalUsers: userStats.total,
    totalUsersChange: userStats.change,
    monthlyProblems: problemStats.total,
    monthlyProblemsChange: problemStats.change,
    monthlyRevenue: 0, // TODO: 결제 테이블 연동 필요
    monthlyRevenueChange: 0,

    // 사용자 통계
    usersByRole: userStats.byRole,

    // 학원 요금제별 분포
    academiesByPlan: academyStats.byPlan,

    // 최근 가입 학원
    recentAcademies,

    // TOP 학원
    topAcademies,

    // 과목별 문제 분포
    problemsBySubject,

    // 일별 문제 생성 추이
    dailyProblemsTrend: dailyProblems,

    // 매출 추이 (TODO: 결제 테이블 연동)
    monthlyRevenueTrend: generateMonthlyTrend(6, 8000000, 12000000),

    // 신규 가입 추이 (학원 기준)
    newSignupsTrend: generateMonthlyTrend(6, 10, 25),

    // 시스템 사용량
    systemUsage: {
      apiCalls: 0, // TODO: 로그 테이블 연동
      storageUsed: 0, // TODO: Storage 사용량 조회
      activeUsers: userStats.activeCount,
      peakHour: '16:00-18:00',
    },
  }
}

/**
 * 학원 통계 조회
 */
async function getAcademyStats(
  supabase: SupabaseClient<Database>,
  periodStart: string,
  previousPeriodStart: string
) {
  // 전체 학원 수
  const { count: totalCount } = await supabase
    .from('academies')
    .select('*', { count: 'exact', head: true })

  // 이번 기간 신규 학원 수
  const { count: currentPeriodCount } = await supabase
    .from('academies')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', periodStart)

  // 이전 기간 신규 학원 수
  const { count: previousPeriodCount } = await supabase
    .from('academies')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', previousPeriodStart)
    .lt('created_at', periodStart)

  // 요금제별 분포
  const { data: planData } = await supabase
    .from('academies')
    .select('plan')

  const planCounts: Record<string, number> = {
    free: 0,
    basic: 0,
    pro: 0,
    enterprise: 0,
  }

  if (planData) {
    (planData as Array<{ plan: string | null }>).forEach((academy) => {
      if (academy.plan && planCounts.hasOwnProperty(academy.plan)) {
        planCounts[academy.plan]++
      }
    })
  }

  const total = totalCount || 0
  const byPlan = Object.entries(planCounts).map(([plan, count]) => ({
    plan: plan as 'free' | 'basic' | 'pro' | 'enterprise',
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }))

  return {
    total,
    change: (currentPeriodCount || 0) - (previousPeriodCount || 0),
    byPlan,
  }
}

/**
 * 사용자 통계 조회
 */
async function getUserStats(
  supabase: SupabaseClient<Database>,
  periodStart: string,
  previousPeriodStart: string
) {
  // 전체 사용자 수
  const { count: totalCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // 이번 기간 신규 사용자 수
  const { count: currentPeriodCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', periodStart)

  // 이전 기간 신규 사용자 수
  const { count: previousPeriodCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', previousPeriodStart)
    .lt('created_at', periodStart)

  // 역할별 분포
  const { data: roleData } = await supabase
    .from('profiles')
    .select('role')

  const roleCounts: Record<string, number> = {
    admin: 0,
    teacher: 0,
    parent: 0,
    student: 0,
  }

  if (roleData) {
    (roleData as Array<{ role: string | null }>).forEach((user) => {
      if (user.role && user.role !== 'super_admin') {
        const normalizedRole = user.role === 'admin' ? 'admin' : user.role
        if (normalizedRole in roleCounts) {
          roleCounts[normalizedRole]++
        }
      }
    })
  }

  const total = totalCount || 0
  const byRole = [
    {
      role: 'owner' as const,
      count: roleCounts.admin,
      percentage: total > 0 ? Math.round((roleCounts.admin / total) * 100) : 0,
    },
    {
      role: 'teacher' as const,
      count: roleCounts.teacher,
      percentage: total > 0 ? Math.round((roleCounts.teacher / total) * 100) : 0,
    },
    {
      role: 'parent' as const,
      count: roleCounts.parent,
      percentage: total > 0 ? Math.round((roleCounts.parent / total) * 100) : 0,
    },
    {
      role: 'student' as const,
      count: roleCounts.student,
      percentage: total > 0 ? Math.round((roleCounts.student / total) * 100) : 0,
    },
  ]

  return {
    total,
    change: (currentPeriodCount || 0) - (previousPeriodCount || 0),
    byRole,
    activeCount: Math.floor(total * 0.6), // TODO: 실제 활성 사용자 로직 구현
  }
}

/**
 * 문제 통계 조회
 */
async function getProblemStats(
  supabase: SupabaseClient<Database>,
  periodStart: string,
  previousPeriodStart: string
) {
  // 이번 기간 문제 수
  const { count: currentCount } = await supabase
    .from('problems')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', periodStart)

  // 이전 기간 문제 수
  const { count: previousCount } = await supabase
    .from('problems')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', previousPeriodStart)
    .lt('created_at', periodStart)

  return {
    total: currentCount || 0,
    change: (currentCount || 0) - (previousCount || 0),
  }
}

/**
 * 최근 가입 학원 조회
 */
async function getRecentAcademies(
  supabase: SupabaseClient<Database>,
  limit: number
): Promise<AcademySummary[]> {
  const { data } = await supabase
    .from('academies')
    .select('id, name, plan, created_at, owner_id')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data || data.length === 0) return []

  const typedData = data as Array<{
    id: string
    name: string
    plan: string | null
    created_at: string
    owner_id: string
  }>

  // 학원별 학생 수 조회
  const academyIds = typedData.map((a) => a.id)
  const { data: studentCounts } = await supabase
    .from('students')
    .select('academy_id')
    .in('academy_id', academyIds)

  const studentCountMap: Record<string, number> = {}
  if (studentCounts) {
    (studentCounts as Array<{ academy_id: string }>).forEach((s) => {
      studentCountMap[s.academy_id] = (studentCountMap[s.academy_id] || 0) + 1
    })
  }

  // 소유자 정보 조회
  const ownerIds = typedData.map((a) => a.owner_id).filter(Boolean)
  const { data: owners } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', ownerIds)

  const ownerMap: Record<string, string> = {}
  if (owners) {
    (owners as Array<{ id: string; name: string }>).forEach((o) => {
      ownerMap[o.id] = o.name
    })
  }

  return typedData.map((academy) => ({
    id: academy.id,
    name: academy.name,
    owner: ownerMap[academy.owner_id] || '미정',
    plan: (academy.plan as 'free' | 'basic' | 'pro' | 'enterprise') || 'free',
    status: 'active' as const,
    joinDate: new Date(academy.created_at).toISOString().split('T')[0],
    studentCount: studentCountMap[academy.id] || 0,
    monthlyProblems: 0, // TODO: 문제 생성 수 집계
  }))
}

/**
 * 상위 학원 조회 (문제 생성 수 기준)
 */
async function getTopAcademies(
  supabase: SupabaseClient<Database>,
  periodStart: string,
  limit: number
) {
  // 학원별 문제 생성 수 집계
  const { data: problems } = await supabase
    .from('problems')
    .select('academy_id')
    .gte('created_at', periodStart)
    .not('academy_id', 'is', null)

  const academyCounts: Record<string, number> = {}
  if (problems) {
    (problems as Array<{ academy_id: string | null }>).forEach((p) => {
      if (p.academy_id) {
        academyCounts[p.academy_id] = (academyCounts[p.academy_id] || 0) + 1
      }
    })
  }

  // 상위 학원 추출
  const topAcademyIds = Object.entries(academyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  if (topAcademyIds.length === 0) {
    // Mock 데이터 반환
    return [
      { name: '명문학원', problems: 0, rank: 1 },
      { name: '스마트에듀', problems: 0, rank: 2 },
      { name: '최상위학원', problems: 0, rank: 3 },
      { name: '영재교육원', problems: 0, rank: 4 },
      { name: '수학의정석', problems: 0, rank: 5 },
    ]
  }

  // 학원 이름 조회
  const { data: academies } = await supabase
    .from('academies')
    .select('id, name')
    .in('id', topAcademyIds)

  const academyNameMap: Record<string, string> = {}
  if (academies) {
    (academies as Array<{ id: string; name: string }>).forEach((a) => {
      academyNameMap[a.id] = a.name
    })
  }

  return topAcademyIds.map((id, index) => ({
    name: academyNameMap[id] || '알 수 없음',
    problems: academyCounts[id],
    rank: index + 1,
  }))
}

/**
 * 과목별 문제 분포 조회
 */
async function getProblemsBySubject(
  supabase: SupabaseClient<Database>,
  periodStart: string
): Promise<SubjectStats[]> {
  const { data } = await supabase
    .from('problems')
    .select('subject')
    .gte('created_at', periodStart)

  if (!data || data.length === 0) {
    return [
      { subject: '수학', count: 0, percentage: 0 },
      { subject: '영어', count: 0, percentage: 0 },
      { subject: '국어', count: 0, percentage: 0 },
      { subject: '과학', count: 0, percentage: 0 },
    ]
  }

  const subjectCounts: Record<string, number> = {}
  ;(data as Array<{ subject: string | null }>).forEach((p) => {
    const subject = p.subject || '기타'
    subjectCounts[subject] = (subjectCounts[subject] || 0) + 1
  })

  const total = data.length
  return Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([subject, count]) => ({
      subject,
      count,
      percentage: Math.round((count / total) * 100),
    }))
}

/**
 * 일별 문제 생성 추이 조회
 */
async function getDailyProblemsTrend(
  supabase: SupabaseClient<Database>,
  days: number
): Promise<TimeSeriesDataPoint[]> {
  const datePoints = generateDailyDataPoints(days)
  const startDate = datePoints[0].date

  const { data } = await supabase
    .from('problems')
    .select('created_at')
    .gte('created_at', startDate)

  const dateCounts: Record<string, number> = {}
  if (data) {
    (data as Array<{ created_at: string }>).forEach((p) => {
      const date = new Date(p.created_at).toISOString().split('T')[0]
      dateCounts[date] = (dateCounts[date] || 0) + 1
    })
  }

  return datePoints.map((point) => ({
    date: point.date,
    label: point.label,
    value: dateCounts[point.date] || 0,
  }))
}

/**
 * 월별 트렌드 데이터 생성 (Mock)
 */
function generateMonthlyTrend(
  months: number,
  minValue: number,
  maxValue: number
): TimeSeriesDataPoint[] {
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const now = new Date()
  const result: TimeSeriesDataPoint[] = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({
      date: toISODateString(date),
      label: monthNames[date.getMonth()],
      value: Math.floor(Math.random() * (maxValue - minValue) + minValue),
    })
  }

  return result
}

// ============================================
// 선생님 통계 서비스
// ============================================

export interface TeacherStatsOptions {
  teacherId: string
  academyId: string
  period?: PeriodType
}

/**
 * 선생님용 대시보드 통계 조회
 */
export async function getTeacherStats(options: TeacherStatsOptions): Promise<TeacherStats> {
  const { academyId, period = 'week' } = options
  const supabase = createServerSupabaseClient()

  const periodStart = getPeriodStartDate(period)
  const previousPeriodStart = getPreviousPeriodStartDate(period)
  const periodStartStr = toISODateString(periodStart)
  const previousPeriodStartStr = toISODateString(previousPeriodStart)

  // 병렬로 통계 조회
  const [
    studentStats,
    problemStats,
    assignmentStats,
    gradeStats,
    recentStudents,
    recentAssignments,
  ] = await Promise.all([
    getTeacherStudentStats(supabase, academyId, periodStartStr, previousPeriodStartStr),
    getTeacherProblemStats(supabase, academyId, periodStartStr, previousPeriodStartStr),
    getTeacherAssignmentStats(supabase, academyId),
    getTeacherGradeStats(supabase, academyId),
    getTeacherRecentStudents(supabase, academyId, 5),
    getTeacherRecentAssignments(supabase, academyId, 5),
  ])

  // 주간 문제 생성 추이
  const weeklyTrend = await getTeacherWeeklyProblemsTrend(supabase, academyId, 7)

  return {
    totalStudents: studentStats.total,
    totalStudentsChange: studentStats.change,
    weeklyProblemsCreated: problemStats.total,
    weeklyProblemsChange: problemStats.change,
    submissionRate: assignmentStats.submissionRate,
    submissionRateChange: assignmentStats.submissionRateChange,
    averageScoreImprovement: gradeStats.averageImprovement,
    recentStudents,
    recentAssignments,
    gradeDistribution: gradeStats.distribution,
    problemsBySubject: problemStats.bySubject,
    weeklyProblemsTrend: weeklyTrend,
  }
}

/**
 * 선생님 담당 학생 통계
 */
async function getTeacherStudentStats(
  supabase: SupabaseClient<Database>,
  academyId: string,
  periodStart: string,
  previousPeriodStart: string
) {
  const { count: totalCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('academy_id', academyId)

  const { count: currentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .gte('created_at', periodStart)

  const { count: previousCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .gte('created_at', previousPeriodStart)
    .lt('created_at', periodStart)

  return {
    total: totalCount || 0,
    change: (currentCount || 0) - (previousCount || 0),
  }
}

/**
 * 선생님 문제 생성 통계
 */
async function getTeacherProblemStats(
  supabase: SupabaseClient<Database>,
  academyId: string,
  periodStart: string,
  previousPeriodStart: string
) {
  const { count: currentCount, data: problems } = await supabase
    .from('problems')
    .select('subject', { count: 'exact' })
    .eq('academy_id', academyId)
    .gte('created_at', periodStart)

  const { count: previousCount } = await supabase
    .from('problems')
    .select('*', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .gte('created_at', previousPeriodStart)
    .lt('created_at', periodStart)

  // 과목별 분포
  const subjectCounts: Record<string, number> = {}
  if (problems) {
    (problems as Array<{ subject: string | null }>).forEach((p) => {
      const subject = p.subject || '기타'
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1
    })
  }

  const total = currentCount || 0
  const bySubject: SubjectStats[] = Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([subject, count]) => ({
      subject,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))

  return {
    total,
    change: (currentCount || 0) - (previousCount || 0),
    bySubject,
  }
}

/**
 * 선생님 과제 통계
 */
async function getTeacherAssignmentStats(
  supabase: SupabaseClient<Database>,
  academyId: string
) {
  // 전체 과제 수
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id')
    .eq('academy_id', academyId)
    .eq('is_active', true)

  if (!assignments || assignments.length === 0) {
    return {
      submissionRate: 0,
      submissionRateChange: 0,
    }
  }

  const assignmentIds = (assignments as Array<{ id: string }>).map((a) => a.id)

  // 학생 과제 현황
  const { data: studentAssignments } = await supabase
    .from('student_assignments')
    .select('status')
    .in('assignment_id', assignmentIds)

  const total = studentAssignments?.length || 0
  let submitted = 0
  if (studentAssignments) {
    (studentAssignments as Array<{ status: string }>).forEach((sa) => {
      if (sa.status === 'submitted' || sa.status === 'graded') {
        submitted++
      }
    })
  }

  return {
    submissionRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
    submissionRateChange: 0, // TODO: 이전 기간 대비 계산
  }
}

/**
 * 선생님 성적 통계
 */
async function getTeacherGradeStats(
  supabase: SupabaseClient<Database>,
  academyId: string
) {
  // 학생 ID 목록 조회
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('academy_id', academyId)

  if (!students || students.length === 0) {
    return {
      averageImprovement: 0,
      distribution: [
        { range: '90-100', count: 0, percentage: 0 },
        { range: '80-89', count: 0, percentage: 0 },
        { range: '70-79', count: 0, percentage: 0 },
        { range: '60-69', count: 0, percentage: 0 },
        { range: '0-59', count: 0, percentage: 0 },
      ],
    }
  }

  const studentIds = (students as Array<{ id: string }>).map((s) => s.id)

  // 성적 데이터 조회
  const { data: grades } = await supabase
    .from('grades')
    .select('score, max_score')
    .in('student_id', studentIds)
    .order('date', { ascending: false })

  if (!grades || grades.length === 0) {
    return {
      averageImprovement: 0,
      distribution: [
        { range: '90-100', count: 0, percentage: 0 },
        { range: '80-89', count: 0, percentage: 0 },
        { range: '70-79', count: 0, percentage: 0 },
        { range: '60-69', count: 0, percentage: 0 },
        { range: '0-59', count: 0, percentage: 0 },
      ],
    }
  }

  // 성적 분포 계산
  const distribution = [
    { range: '90-100', count: 0, percentage: 0 },
    { range: '80-89', count: 0, percentage: 0 },
    { range: '70-79', count: 0, percentage: 0 },
    { range: '60-69', count: 0, percentage: 0 },
    { range: '0-59', count: 0, percentage: 0 },
  ]

  ;(grades as Array<{ score: number; max_score: number }>).forEach((g) => {
    const percentage = (g.score / g.max_score) * 100
    if (percentage >= 90) distribution[0].count++
    else if (percentage >= 80) distribution[1].count++
    else if (percentage >= 70) distribution[2].count++
    else if (percentage >= 60) distribution[3].count++
    else distribution[4].count++
  })

  const total = grades.length
  distribution.forEach((d) => {
    d.percentage = total > 0 ? Math.round((d.count / total) * 100) : 0
  })

  return {
    averageImprovement: 5, // TODO: 실제 향상률 계산
    distribution,
  }
}

/**
 * 선생님 최근 학생 현황
 */
async function getTeacherRecentStudents(
  supabase: SupabaseClient<Database>,
  academyId: string,
  limit: number
): Promise<StudentSummary[]> {
  // 학생 정보 조회
  const { data: students } = await supabase
    .from('students')
    .select('id, grade, user_id')
    .eq('academy_id', academyId)
    .limit(limit)

  if (!students || students.length === 0) {
    return []
  }

  const typedStudents = students as Array<{ id: string; grade: string | null; user_id: string }>

  // 사용자 정보 조회
  const userIds = typedStudents.map((s) => s.user_id).filter(Boolean)
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds)

  const userNameMap: Record<string, string> = {}
  if (users) {
    (users as Array<{ id: string; name: string }>).forEach((u) => {
      userNameMap[u.id] = u.name
    })
  }

  // 학생별 최근 성적 조회
  const studentIds = typedStudents.map((s) => s.id)
  const { data: grades } = await supabase
    .from('grades')
    .select('student_id, score, max_score')
    .in('student_id', studentIds)
    .order('date', { ascending: false })

  const studentScoreMap: Record<string, number> = {}
  if (grades) {
    (grades as Array<{ student_id: string; score: number; max_score: number }>).forEach((g) => {
      if (!studentScoreMap[g.student_id]) {
        studentScoreMap[g.student_id] = Math.round((g.score / g.max_score) * 100)
      }
    })
  }

  return typedStudents.map((student) => {
    const score = studentScoreMap[student.id] || 0
    let status: '향상' | '유지' | '주의' = '유지'
    if (score >= 80) status = '향상'
    else if (score < 60) status = '주의'

    return {
      id: student.id,
      name: userNameMap[student.user_id] || '알 수 없음',
      grade: student.grade || '미정',
      score,
      status,
    }
  })
}

/**
 * 선생님 최근 과제 현황
 */
async function getTeacherRecentAssignments(
  supabase: SupabaseClient<Database>,
  academyId: string,
  limit: number
): Promise<AssignmentSummary[]> {
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, due_date, is_active')
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!assignments || assignments.length === 0) {
    return []
  }

  const typedAssignments = assignments as Array<{
    id: string
    title: string
    due_date: string | null
    is_active: boolean
  }>

  // 각 과제의 제출 현황 조회
  const assignmentIds = typedAssignments.map((a) => a.id)
  const { data: studentAssignments } = await supabase
    .from('student_assignments')
    .select('assignment_id, status')
    .in('assignment_id', assignmentIds)

  // 과제별 통계 계산
  const assignmentStats: Record<string, { total: number; submitted: number }> = {}
  if (studentAssignments) {
    (studentAssignments as Array<{ assignment_id: string; status: string }>).forEach((sa) => {
      if (!assignmentStats[sa.assignment_id]) {
        assignmentStats[sa.assignment_id] = { total: 0, submitted: 0 }
      }
      assignmentStats[sa.assignment_id].total++
      if (sa.status === 'submitted' || sa.status === 'graded') {
        assignmentStats[sa.assignment_id].submitted++
      }
    })
  }

  const now = new Date()
  return typedAssignments.map((assignment) => {
    const stats = assignmentStats[assignment.id] || { total: 0, submitted: 0 }
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null
    let status: 'active' | 'completed' | 'overdue' = 'active'

    if (dueDate && dueDate < now) {
      status = stats.submitted === stats.total ? 'completed' : 'overdue'
    } else if (stats.submitted === stats.total && stats.total > 0) {
      status = 'completed'
    }

    return {
      id: assignment.id,
      title: assignment.title,
      totalStudents: stats.total,
      submittedCount: stats.submitted,
      dueDate: assignment.due_date
        ? new Date(assignment.due_date).toLocaleDateString('ko-KR')
        : '미정',
      status,
    }
  })
}

/**
 * 선생님 주간 문제 생성 추이
 */
async function getTeacherWeeklyProblemsTrend(
  supabase: SupabaseClient<Database>,
  academyId: string,
  days: number
): Promise<TimeSeriesDataPoint[]> {
  const datePoints = generateDailyDataPoints(days)
  const startDate = datePoints[0].date

  const { data } = await supabase
    .from('problems')
    .select('created_at')
    .eq('academy_id', academyId)
    .gte('created_at', startDate)

  const dateCounts: Record<string, number> = {}
  if (data) {
    (data as Array<{ created_at: string }>).forEach((p) => {
      const date = new Date(p.created_at).toISOString().split('T')[0]
      dateCounts[date] = (dateCounts[date] || 0) + 1
    })
  }

  return datePoints.map((point) => ({
    date: point.date,
    label: point.label,
    value: dateCounts[point.date] || 0,
  }))
}

// ============================================
// 학생 통계 서비스
// ============================================

export interface StudentStatsOptions {
  studentId: string
  period?: PeriodType
}

/**
 * 학생용 대시보드 통계 조회
 */
export async function getStudentStats(options: StudentStatsOptions): Promise<StudentStats> {
  const { studentId, period = 'week' } = options
  const supabase = createServerSupabaseClient()

  const periodStart = getPeriodStartDate(period)
  const periodStartStr = toISODateString(periodStart)

  // 병렬로 통계 조회
  const [
    studyStats,
    assignmentStats,
    gradeStats,
    weakUnits,
  ] = await Promise.all([
    getStudentStudyStats(supabase, studentId, periodStartStr),
    getStudentAssignmentStats(supabase, studentId),
    getStudentGradeStats(supabase, studentId),
    getStudentWeakUnits(supabase, studentId),
  ])

  return {
    studyStreak: studyStats.streak,
    weeklyGoalProgress: studyStats.goalProgress,
    solvedProblems: studyStats.solvedProblems,
    wrongProblems: studyStats.wrongProblems,
    averageScore: gradeStats.average,
    rank: gradeStats.rank,
    todayAssignments: assignmentStats.today,
    recentGrades: gradeStats.recent,
    subjectScoreTrend: gradeStats.subjectTrend,
    weeklyStudyData: studyStats.weeklyData,
    weakUnits,
  }
}

/**
 * 학생 학습 통계
 */
async function getStudentStudyStats(
  supabase: SupabaseClient<Database>,
  studentId: string,
  periodStart: string
) {
  // 과제 풀이 기록에서 학습 통계 추출
  const { data: studentAssignments } = await supabase
    .from('student_assignments')
    .select('status, score, answers, submitted_at')
    .eq('student_id', studentId)
    .gte('created_at', periodStart)

  let solvedProblems = 0
  let wrongProblems = 0

  if (studentAssignments) {
    interface StudentAssignmentRow {
      status: string
      score: number | null
      answers: Array<{ is_correct?: boolean }> | null
      submitted_at: string | null
    }
    (studentAssignments as StudentAssignmentRow[]).forEach((sa) => {
      if (sa.answers && Array.isArray(sa.answers)) {
        sa.answers.forEach((answer) => {
          solvedProblems++
          if (answer.is_correct === false) wrongProblems++
        })
      }
    })
  }

  // 주간 학습 데이터 생성
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const weeklyData = dayNames.map((day) => ({
    day,
    studyMinutes: Math.floor(Math.random() * 120) + 30, // TODO: 실제 데이터로 대체
    problemsSolved: Math.floor(Math.random() * 20) + 5,
  }))

  return {
    streak: 7, // TODO: 실제 연속 학습일 계산
    goalProgress: 75, // TODO: 목표 대비 진행률 계산
    solvedProblems,
    wrongProblems,
    weeklyData,
  }
}

/**
 * 학생 과제 통계
 */
async function getStudentAssignmentStats(
  supabase: SupabaseClient<Database>,
  studentId: string
) {
  const today = new Date()

  const { data: studentAssignments } = await supabase
    .from('student_assignments')
    .select(`
      id,
      status,
      assignment_id
    `)
    .eq('student_id', studentId)

  if (!studentAssignments || studentAssignments.length === 0) {
    return { today: [] }
  }

  const typedSA = studentAssignments as Array<{
    id: string
    status: string
    assignment_id: string
  }>

  // 과제 정보 조회
  const assignmentIds = typedSA.map((sa) => sa.assignment_id)
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, due_date, problems')
    .in('id', assignmentIds)

  const assignmentMap: Record<string, { title: string; due_date: string | null; problems: string[] }> = {}
  if (assignments) {
    (assignments as Array<{ id: string; title: string; due_date: string | null; problems: string[] }>).forEach((a) => {
      assignmentMap[a.id] = { title: a.title, due_date: a.due_date, problems: a.problems || [] }
    })
  }

  const todayAssignments = typedSA
    .filter((sa) => {
      const assignment = assignmentMap[sa.assignment_id]
      if (!assignment || !assignment.due_date) return true
      return new Date(assignment.due_date) >= today
    })
    .slice(0, 5)
    .map((sa) => {
      const assignment = assignmentMap[sa.assignment_id] || { title: '알 수 없음', due_date: null, problems: [] }
      const problemCount = assignment.problems?.length || 0

      return {
        id: sa.assignment_id,
        subject: '수학', // TODO: 과제에서 과목 정보 가져오기
        title: assignment.title,
        problemCount,
        completedCount: sa.status === 'submitted' || sa.status === 'graded' ? problemCount : 0,
        dueDate: assignment.due_date
          ? new Date(assignment.due_date).toLocaleDateString('ko-KR')
          : '미정',
        status: (sa.status === 'submitted' || sa.status === 'graded'
          ? 'completed'
          : sa.status === 'in_progress'
            ? 'in_progress'
            : 'not_started') as 'completed' | 'in_progress' | 'not_started',
      }
    })

  return {
    today: todayAssignments,
  }
}

/**
 * 학생 성적 통계
 */
async function getStudentGradeStats(
  supabase: SupabaseClient<Database>,
  studentId: string
) {
  const { data: grades } = await supabase
    .from('grades')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .limit(20)

  if (!grades || grades.length === 0) {
    return {
      average: 0,
      rank: null,
      recent: [],
      subjectTrend: [],
    }
  }

  interface GradeRow {
    subject: string
    unit: string | null
    score: number
    max_score: number
    date: string
  }
  const typedGrades = grades as GradeRow[]

  // 평균 점수 계산
  const totalPercentage = typedGrades.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0)
  const average = Math.round(totalPercentage / typedGrades.length)

  // 최근 성적
  const recent = typedGrades.slice(0, 5).map((g) => ({
    subject: g.subject,
    chapter: g.unit || '전체',
    score: g.score,
    totalScore: g.max_score,
    date: new Date(g.date).toLocaleDateString('ko-KR'),
  }))

  // 과목별 추이
  const subjectGrades: Record<string, TimeSeriesDataPoint[]> = {}
  typedGrades.forEach((g) => {
    if (!subjectGrades[g.subject]) {
      subjectGrades[g.subject] = []
    }
    subjectGrades[g.subject].push({
      date: g.date,
      label: new Date(g.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      value: Math.round((g.score / g.max_score) * 100),
    })
  })

  const subjectTrend = Object.entries(subjectGrades).map(([subject, data]) => ({
    subject,
    data: data.slice(0, 7).reverse(),
  }))

  return {
    average,
    rank: null, // TODO: 반 내 순위 계산
    recent,
    subjectTrend,
  }
}

/**
 * 학생 취약 단원 분석
 */
async function getStudentWeakUnits(
  supabase: SupabaseClient<Database>,
  studentId: string
) {
  // TODO: 실제 문제별 정답률 분석 로직 구현
  // 현재는 Mock 데이터 반환
  return [
    { subject: '수학', unit: '이차방정식', correctRate: 45 },
    { subject: '영어', unit: '관계대명사', correctRate: 52 },
    { subject: '과학', unit: '화학 반응', correctRate: 58 },
  ]
}
