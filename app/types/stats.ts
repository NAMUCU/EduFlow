/**
 * EduFlow 대시보드 통계 타입 정의
 *
 * 각 역할별 대시보드에서 사용되는 통계 데이터의 타입을 정의합니다.
 */

// ============================================
// 공통 타입 정의
// ============================================

/** 변화 유형 */
export type ChangeType = 'positive' | 'negative' | 'neutral'

/** 기간 유형 */
export type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'year'

/** 과목별 통계 */
export interface SubjectStats {
  subject: string          // 과목명
  count: number            // 수량 (문제 수, 성적 등)
  percentage: number       // 비율 (%)
}

/** 시계열 데이터 포인트 */
export interface TimeSeriesDataPoint {
  date: string             // 날짜 (ISO 8601 또는 YYYY-MM-DD)
  label: string            // 표시 라벨 (예: '1일', '월', '1월')
  value: number            // 값
}

/** 학생 현황 (요약) */
export interface StudentSummary {
  id: string               // 학생 ID
  name: string             // 학생 이름
  grade: string            // 학년
  score: number            // 점수
  status: '향상' | '유지' | '주의'  // 상태
}

/** 과제 현황 (요약) */
export interface AssignmentSummary {
  id: string               // 과제 ID
  title: string            // 과제 제목
  totalStudents: number    // 전체 학생 수
  submittedCount: number   // 제출 학생 수
  dueDate: string          // 마감일
  status: 'active' | 'completed' | 'overdue'  // 상태
}

// ============================================
// 선생님 대시보드 통계 (TeacherStats)
// ============================================

/** 선생님 대시보드 통계 카드 */
export interface TeacherStatCard {
  label: string            // 라벨 (예: '전체 학생')
  value: string | number   // 값
  change: string           // 변화량 (예: '+3')
  changeType: ChangeType   // 변화 유형
}

/** 선생님 대시보드 통계 */
export interface TeacherStats {
  // 요약 통계
  totalStudents: number              // 전체 학생 수
  totalStudentsChange: number        // 전체 학생 변화량
  weeklyProblemsCreated: number      // 이번 주 생성 문제 수
  weeklyProblemsChange: number       // 문제 생성 변화량
  submissionRate: number             // 과제 제출률 (%)
  submissionRateChange: number       // 제출률 변화량
  averageScoreImprovement: number    // 평균 성적 향상 (점수)

  // 학생 현황
  recentStudents: StudentSummary[]   // 최근 학생 현황

  // 과제 현황
  recentAssignments: AssignmentSummary[]  // 최근 과제 현황

  // 성적 분포 (점수대별 학생 수)
  gradeDistribution: {
    range: string          // 점수 범위 (예: '90-100')
    count: number          // 학생 수
    percentage: number     // 비율 (%)
  }[]

  // 과목별 문제 생성 통계
  problemsBySubject: SubjectStats[]

  // 주간 문제 생성 추이
  weeklyProblemsTrend: TimeSeriesDataPoint[]
}

// ============================================
// 학생 대시보드 통계 (StudentStats)
// ============================================

/** 학생 과제 현황 */
export interface StudentAssignmentStatus {
  id: string                         // 과제 ID
  subject: string                    // 과목
  title: string                      // 과제 제목
  problemCount: number               // 문제 수
  completedCount: number             // 완료한 문제 수
  dueDate: string                    // 마감일
  status: 'completed' | 'in_progress' | 'not_started'  // 상태
}

/** 학생 성적 기록 */
export interface StudentGradeRecord {
  subject: string                    // 과목
  chapter: string                    // 단원
  score: number                      // 점수
  totalScore: number                 // 만점
  date: string                       // 날짜
}

/** 학생 대시보드 통계 */
export interface StudentStats {
  // 요약 통계
  studyStreak: number                // 연속 학습일
  weeklyGoalProgress: number         // 주간 목표 달성률 (%)
  solvedProblems: number             // 푼 문제 수
  wrongProblems: number              // 틀린 문제 수
  averageScore: number               // 평균 점수
  rank: number | null                // 반 내 순위

  // 오늘의 과제
  todayAssignments: StudentAssignmentStatus[]

  // 최근 성적
  recentGrades: StudentGradeRecord[]

  // 과목별 성적 추이
  subjectScoreTrend: {
    subject: string
    data: TimeSeriesDataPoint[]
  }[]

  // 주간 학습 현황
  weeklyStudyData: {
    day: string              // 요일
    studyMinutes: number     // 학습 시간 (분)
    problemsSolved: number   // 푼 문제 수
  }[]

  // 취약 단원
  weakUnits: {
    subject: string          // 과목
    unit: string             // 단원
    correctRate: number      // 정답률 (%)
  }[]
}

// ============================================
// 학부모 대시보드 통계 (ParentStats)
// ============================================

/** 자녀 정보 */
export interface ChildInfo {
  id: string                         // 학생 ID
  name: string                       // 자녀 이름
  grade: string                      // 학년
  academy: string                    // 학원명
  teacher: string                    // 담당 선생님
}

/** 학부모 대시보드 통계 */
export interface ParentStats {
  // 자녀 정보
  child: ChildInfo

  // 요약 통계
  weeklyStudyTime: string            // 이번 주 학습 시간 (예: '12시간 30분')
  weeklyStudyTimeChange: string      // 학습 시간 변화
  assignmentCompletionRate: number   // 과제 완료율 (%)
  assignmentCompletionChange: number // 과제 완료율 변화
  averageScore: number               // 평균 점수
  averageScoreChange: number         // 평균 점수 변화
  attendanceRate: number             // 출석률 (%)
  monthlyGoalProgress: number        // 월간 목표 달성률 (%)

  // 주간 학습 현황
  weeklyProgress: {
    day: string              // 요일
    hours: number            // 학습 시간 (시간)
    completedAssignments: number  // 완료한 과제 수
  }[]

  // 최근 과제 현황
  recentAssignments: {
    title: string            // 과제 제목
    dueDate: string          // 마감일
    status: 'completed' | 'pending'  // 상태
    score: number | null     // 점수 (완료한 경우)
  }[]

  // 과목별 성적 현황
  subjectPerformance: {
    subject: string          // 과목
    currentScore: number     // 현재 점수
    previousScore: number    // 이전 점수
    trend: 'up' | 'down' | 'stable'  // 추이
  }[]

  // 출석 현황
  attendanceRecent: {
    date: string             // 날짜
    status: 'present' | 'absent' | 'late' | 'early_leave'  // 출석 상태
    checkInTime: string | null   // 등원 시간
    checkOutTime: string | null  // 하원 시간
  }[]

  // 학원 공지사항
  notices: {
    title: string            // 공지 제목
    date: string             // 날짜
    type: 'info' | 'notice' | 'urgent'  // 유형
  }[]
}

// ============================================
// 관리자 대시보드 통계 (AdminStats)
// ============================================

/** 학원 요약 정보 */
export interface AcademySummary {
  id: string                         // 학원 ID
  name: string                       // 학원명
  owner: string                      // 원장 이름
  plan: 'free' | 'basic' | 'pro' | 'enterprise'  // 요금제
  status: 'active' | 'pending' | 'suspended'     // 상태
  joinDate: string                   // 가입일
  studentCount: number               // 학생 수
  monthlyProblems: number            // 월간 문제 생성 수
}

/** 관리자 대시보드 통계 */
export interface AdminStats {
  // 요약 통계
  totalAcademies: number             // 총 학원 수
  totalAcademiesChange: number       // 학원 수 변화
  totalUsers: number                 // 총 사용자 수
  totalUsersChange: number           // 사용자 수 변화
  monthlyProblems: number            // 이번 달 문제 생성 수
  monthlyProblemsChange: number      // 문제 생성 변화
  monthlyRevenue: number             // 이번 달 매출 (원)
  monthlyRevenueChange: number       // 매출 변화 (%)

  // 사용자 통계
  usersByRole: {
    role: 'owner' | 'teacher' | 'parent' | 'student'
    count: number
    percentage: number
  }[]

  // 학원 요금제별 분포
  academiesByPlan: {
    plan: 'free' | 'basic' | 'pro' | 'enterprise'
    count: number
    percentage: number
  }[]

  // 최근 가입 학원
  recentAcademies: AcademySummary[]

  // TOP 학원 (문제 생성 기준)
  topAcademies: {
    name: string             // 학원명
    problems: number         // 문제 생성 수
    rank: number             // 순위
  }[]

  // 과목별 문제 생성 분포
  problemsBySubject: SubjectStats[]

  // 문제 생성 추이 (일별)
  dailyProblemsTrend: TimeSeriesDataPoint[]

  // 매출 추이 (월별)
  monthlyRevenueTrend: TimeSeriesDataPoint[]

  // 신규 가입 추이
  newSignupsTrend: TimeSeriesDataPoint[]

  // 시스템 사용량
  systemUsage: {
    apiCalls: number         // API 호출 수
    storageUsed: number      // 스토리지 사용량 (GB)
    activeUsers: number      // 활성 사용자 수
    peakHour: string         // 피크 시간대
  }
}

// ============================================
// API 응답 타입 정의
// ============================================

/** 통계 API 공통 응답 */
export interface StatsApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
  period: PeriodType
}

/** 선생님 통계 API 응답 */
export type TeacherStatsResponse = StatsApiResponse<TeacherStats>

/** 학생 통계 API 응답 */
export type StudentStatsResponse = StatsApiResponse<StudentStats>

/** 학부모 통계 API 응답 */
export type ParentStatsResponse = StatsApiResponse<ParentStats>

/** 관리자 통계 API 응답 */
export type AdminStatsResponse = StatsApiResponse<AdminStats>

// ============================================
// 차트 컴포넌트 Props 타입 정의
// ============================================

/** 라인 차트 Props */
export interface LineChartProps {
  data: TimeSeriesDataPoint[]
  xAxisKey?: string          // X축 데이터 키 (기본: 'label')
  yAxisKey?: string          // Y축 데이터 키 (기본: 'value')
  color?: string             // 라인 색상
  height?: number            // 차트 높이
  showGrid?: boolean         // 그리드 표시 여부
  showTooltip?: boolean      // 툴팁 표시 여부
}

/** 막대 차트 Props */
export interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  xAxisKey?: string          // X축 데이터 키 (기본: 'label')
  yAxisKey?: string          // Y축 데이터 키 (기본: 'value')
  color?: string             // 막대 색상
  height?: number            // 차트 높이
  showGrid?: boolean         // 그리드 표시 여부
  showTooltip?: boolean      // 툴팁 표시 여부
  layout?: 'vertical' | 'horizontal'  // 레이아웃
}

/** 원형 차트 Props */
export interface PieChartProps {
  data: { name: string; value: number; color?: string }[]
  colors?: string[]          // 색상 배열
  height?: number            // 차트 높이
  showLabel?: boolean        // 라벨 표시 여부
  showLegend?: boolean       // 범례 표시 여부
  innerRadius?: number       // 내부 반지름 (도넛 차트용)
}

/** 통계 카드 Props */
export interface StatCardProps {
  label: string              // 라벨
  value: string | number     // 값
  change?: string            // 변화량
  changeType?: ChangeType    // 변화 유형
  icon?: React.ReactNode     // 아이콘
  iconBgColor?: string       // 아이콘 배경색 (Tailwind 클래스)
  iconColor?: string         // 아이콘 색상 (Tailwind 클래스)
}

// ============================================
// 한국어 라벨 상수
// ============================================

/** 변화 유형 한국어 라벨 */
export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  positive: '증가',
  negative: '감소',
  neutral: '유지',
}

/** 기간 유형 한국어 라벨 */
export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  day: '일간',
  week: '주간',
  month: '월간',
  quarter: '분기',
  year: '연간',
}

/** 학생 상태 한국어 라벨 */
export const STUDENT_STATUS_LABELS = {
  향상: '향상',
  유지: '유지',
  주의: '주의',
} as const

/** 과제 상태 한국어 라벨 (학생용) */
export const STUDENT_ASSIGNMENT_STATUS_LABELS = {
  completed: '완료',
  in_progress: '진행 중',
  not_started: '시작 전',
} as const
