'use client'

/**
 * 학부모 대시보드 콘텐츠 컴포넌트
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 클라이언트 캐싱 및 요청 중복 제거
 * - bundle-dynamic-imports: next/dynamic으로 차트 컴포넌트 lazy loading
 * - rerender-memo: React.memo로 불필요한 리렌더 방지
 * - async-parallel: useParentDashboard 훅에서 Promise.all 병렬 fetching
 */

import { memo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  ArrowRight,
  Star,
  Loader2,
} from 'lucide-react'
import { StatCard } from '@/components/charts'
import { useParentDashboard, transformWeeklyChartData } from '@/hooks/useParentDashboard'
import type { ParentStats } from '@/types/stats'

// ============================================
// bundle-dynamic-imports: 차트 컴포넌트 lazy loading
// 차트는 초기 렌더링에 필수적이지 않으므로 동적 로딩
// ============================================
const BarChart = dynamic(
  () => import('@/components/charts/BarChart').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    ),
  }
)

// ============================================
// UI 텍스트 상수
// ============================================
const UI_TEXT = {
  greeting: '안녕하세요, 김영희님',
  weeklyStudyTime: '이번 주 학습 시간',
  assignmentCompletion: '과제 완료율',
  averageScore: '평균 점수',
  attendanceRate: '출석률',
  weeklyProgress: '주간 학습 현황',
  recentAssignments: '최근 과제 현황',
  academyNotices: '학원 공지사항',
  subjectPerformance: '과목별 성적 현황',
  viewAll: '전체 보기',
  viewDetail: '상세 보기',
  completed: '완료',
  pending: '진행중',
  monthlyGoal: '이번 달 학습 목표 달성률',
  loading: '데이터를 불러오는 중...',
  error: '데이터를 불러오는 중 오류가 발생했습니다.',
  retry: '다시 시도',
  deadline: '마감',
  score: '점',
  present: '출석',
  absent: '결석',
  late: '지각',
  earlyLeave: '조퇴',
  checkIn: '등원',
  checkOut: '하원',
  recentAttendance: '최근 출석 현황',
}

// 출석 상태 스타일
const attendanceStatusStyles = {
  present: { label: UI_TEXT.present, bgColor: 'bg-green-100', textColor: 'text-green-700' },
  absent: { label: UI_TEXT.absent, bgColor: 'bg-red-100', textColor: 'text-red-700' },
  late: { label: UI_TEXT.late, bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  early_leave: { label: UI_TEXT.earlyLeave, bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
}

// 공지 유형 스타일
const noticeTypeStyles = {
  info: 'bg-blue-500',
  notice: 'bg-yellow-500',
  urgent: 'bg-red-500',
}

// ============================================
// rerender-memo: 메모이제이션된 하위 컴포넌트들
// 불필요한 리렌더링 방지
// ============================================

/**
 * 자녀 정보 카드 컴포넌트
 */
const ChildInfoCard = memo(function ChildInfoCard({
  child,
  monthlyGoalProgress,
}: {
  child: ParentStats['child']
  monthlyGoalProgress: number
}) {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur">
            {child.name[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold">{child.name}</h2>
            <p className="text-indigo-200">{child.grade}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-indigo-200">{UI_TEXT.monthlyGoal}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${monthlyGoalProgress}%` }}
              />
            </div>
            <span className="font-bold">{monthlyGoalProgress}%</span>
          </div>
        </div>
      </div>
    </div>
  )
})

/**
 * 통계 카드 그리드 컴포넌트
 */
const StatsGrid = memo(function StatsGrid({ stats }: { stats: ParentStats }) {
  return (
    <div className="grid grid-cols-4 gap-6 mb-8">
      <StatCard
        label={UI_TEXT.weeklyStudyTime}
        value={stats.weeklyStudyTime}
        change={stats.weeklyStudyTimeChange}
        changeType="positive"
        icon={<Clock className="w-6 h-6" />}
        iconBgColor="bg-blue-50"
        iconColor="text-blue-600"
      />
      <StatCard
        label={UI_TEXT.assignmentCompletion}
        value={`${stats.assignmentCompletionRate}%`}
        change={
          stats.assignmentCompletionChange > 0
            ? `+${stats.assignmentCompletionChange}%`
            : `${stats.assignmentCompletionChange}%`
        }
        changeType={stats.assignmentCompletionChange >= 0 ? 'positive' : 'negative'}
        icon={<CheckCircle className="w-6 h-6" />}
        iconBgColor="bg-green-50"
        iconColor="text-green-600"
      />
      <StatCard
        label={UI_TEXT.averageScore}
        value={`${stats.averageScore}${UI_TEXT.score}`}
        change={
          stats.averageScoreChange > 0
            ? `+${stats.averageScoreChange}점`
            : `${stats.averageScoreChange}점`
        }
        changeType={stats.averageScoreChange >= 0 ? 'positive' : 'negative'}
        icon={<Star className="w-6 h-6" />}
        iconBgColor="bg-purple-50"
        iconColor="text-purple-600"
      />
      <StatCard
        label={UI_TEXT.attendanceRate}
        value={`${stats.attendanceRate}%`}
        changeType="neutral"
        change="유지"
        icon={<Calendar className="w-6 h-6" />}
        iconBgColor="bg-indigo-50"
        iconColor="text-indigo-600"
      />
    </div>
  )
})

/**
 * 주간 학습 차트 컴포넌트
 */
const WeeklyProgressChart = memo(function WeeklyProgressChart({
  weeklyProgress,
}: {
  weeklyProgress: ParentStats['weeklyProgress']
}) {
  const chartData = transformWeeklyChartData(weeklyProgress)

  return (
    <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{UI_TEXT.weeklyProgress}</h3>
        <Link
          href="/parent/reports"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          {UI_TEXT.viewDetail} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="h-[200px] bg-gray-100 rounded-lg animate-pulse" />
        }
      >
        <BarChart
          data={chartData}
          height={200}
          color="#6366f1"
          showGrid={true}
          showTooltip={true}
        />
      </Suspense>
    </div>
  )
})

/**
 * 공지사항 컴포넌트
 */
const NoticesSection = memo(function NoticesSection({
  notices,
}: {
  notices: ParentStats['notices']
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{UI_TEXT.academyNotices}</h3>
      <div className="space-y-3">
        {notices.map((notice, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${noticeTypeStyles[notice.type]}`} />
              <div>
                <p className="font-medium text-gray-900">{notice.title}</p>
                <p className="text-sm text-gray-500 mt-1">{notice.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

/**
 * 최근 과제 현황 컴포넌트
 */
const RecentAssignmentsSection = memo(function RecentAssignmentsSection({
  assignments,
}: {
  assignments: ParentStats['recentAssignments']
}) {
  return (
    <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{UI_TEXT.recentAssignments}</h3>
        <Link
          href="/parent/grades"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          {UI_TEXT.viewAll} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {assignments.map((assignment, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border ${
              assignment.status === 'completed'
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {assignment.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span
                className={`text-xs font-medium ${
                  assignment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {assignment.status === 'completed' ? UI_TEXT.completed : UI_TEXT.pending}
              </span>
            </div>
            <p className="font-medium text-gray-900 mb-2">{assignment.title}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {UI_TEXT.deadline}: {assignment.dueDate.slice(5)}
              </span>
              {assignment.score && (
                <span className="font-bold text-indigo-600">
                  {assignment.score}
                  {UI_TEXT.score}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

/**
 * 과목별 성적 현황 컴포넌트
 */
const SubjectPerformanceSection = memo(function SubjectPerformanceSection({
  subjectPerformance,
}: {
  subjectPerformance: ParentStats['subjectPerformance']
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{UI_TEXT.subjectPerformance}</h3>
      <div className="space-y-4">
        {subjectPerformance.map((subject, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
                {subject.subject}
              </span>
              <span className="text-lg font-bold text-gray-900">
                {subject.currentScore}
                {UI_TEXT.score}
              </span>
            </div>
            <div
              className={`flex items-center gap-1 text-sm ${
                subject.trend === 'up'
                  ? 'text-green-600'
                  : subject.trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-500'
              }`}
            >
              {subject.trend === 'up' && <TrendingUp className="w-4 h-4" />}
              {subject.trend === 'down' && <TrendingDown className="w-4 h-4" />}
              <span>
                {subject.trend === 'up' ? '+' : subject.trend === 'down' ? '' : ''}
                {subject.currentScore - subject.previousScore}
                {UI_TEXT.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

/**
 * 출석 현황 컴포넌트
 */
const AttendanceSection = memo(function AttendanceSection({
  attendanceRecent,
}: {
  attendanceRecent: ParentStats['attendanceRecent']
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{UI_TEXT.recentAttendance}</h3>
        <Link
          href="/parent/attendance"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          {UI_TEXT.viewAll} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {attendanceRecent.slice(0, 4).map((record, index) => {
          const statusStyle =
            attendanceStatusStyles[record.status as keyof typeof attendanceStatusStyles]
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">{record.date}</span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${statusStyle.bgColor} ${statusStyle.textColor}`}
                >
                  {statusStyle.label}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {record.checkInTime && <span>{UI_TEXT.checkIn} {record.checkInTime}</span>}
                {record.checkInTime && record.checkOutTime && <span className="mx-1">~</span>}
                {record.checkOutTime && <span>{UI_TEXT.checkOut} {record.checkOutTime}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

// ============================================
// 메인 컴포넌트
// ============================================

export default function ParentDashboardContent() {
  // client-swr-dedup: SWR로 클라이언트 캐싱 및 요청 중복 제거
  // async-parallel: 훅 내부에서 Promise.all로 병렬 fetching 지원
  const { stats, isLoading, error, mutate } = useParentDashboard('mock-parent-id')

  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-500">{error.message || UI_TEXT.error}</p>
          <button onClick={() => mutate()} className="btn-primary">
            {UI_TEXT.retry}
          </button>
        </div>
      </div>
    )
  }

  // 로딩 상태
  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-gray-500">{UI_TEXT.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 헤더 부가 정보 */}
      <div className="bg-white border-b border-gray-200 px-8 pb-6">
        <div className="flex items-center justify-between">
          <p className="text-gray-500">{stats.child.name} 학생의 학습 현황을 확인하세요</p>
          <div className="text-right">
            <p className="text-sm text-gray-500">{stats.child.academy}</p>
            <p className="text-sm font-medium text-indigo-600">{stats.child.teacher}</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* 자녀 정보 카드 */}
        <ChildInfoCard child={stats.child} monthlyGoalProgress={stats.monthlyGoalProgress} />

        {/* 요약 통계 */}
        <StatsGrid stats={stats} />

        {/* 주간 학습 현황 & 공지사항 */}
        <div className="grid grid-cols-3 gap-6">
          <WeeklyProgressChart weeklyProgress={stats.weeklyProgress} />
          <NoticesSection notices={stats.notices} />
        </div>

        {/* 최근 과제 현황 */}
        <RecentAssignmentsSection assignments={stats.recentAssignments} />

        {/* 과목별 성적 & 출석 현황 */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <SubjectPerformanceSection subjectPerformance={stats.subjectPerformance} />
          <AttendanceSection attendanceRecent={stats.attendanceRecent} />
        </div>
      </div>
    </>
  )
}
