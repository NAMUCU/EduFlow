'use client'

/**
 * EduFlow 대시보드 페이지
 *
 * Vercel Best Practices 적용:
 * - bundle-dynamic-imports: 차트 컴포넌트 next/dynamic lazy load
 * - client-swr-dedup: SWR로 데이터 캐싱 및 중복제거
 * - rerender-memo: 통계 카드 메모이제이션
 * - async-suspense-boundaries: Suspense로 스트리밍
 */

import { Suspense, useMemo, memo } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import { StatCard } from '@/components/charts'
import { Users, FileText, CheckCircle, TrendingUp, Plus, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { TeacherStats } from '@/types/stats'
import { useDashboardStats, transformChartData } from '@/hooks/useDashboard'

// ============================================
// bundle-dynamic-imports: 차트 컴포넌트 지연 로딩
// 차트 라이브러리는 크기가 크므로 초기 번들에서 분리
// ============================================
const LineChart = dynamic(
  () => import('@/components/charts/LineChart').then((m) => m.default),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

const BarChart = dynamic(
  () => import('@/components/charts/BarChart').then((m) => m.default),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

// ============================================
// UI 텍스트 상수
// ============================================
const UI_TEXT = {
  pageTitle: '대시보드',
  welcomeMessage: '오늘도 좋은 하루 되세요, 박정훈 원장님!',
  quickActions: '빠른 작업',
  newProblem: '새 문제 생성',
  newProblemDesc: 'AI로 맞춤 문제 만들기',
  registerStudent: '학생 등록',
  registerStudentDesc: '새 학생 추가하기',
  distributeAssignment: '과제 배포',
  distributeAssignmentDesc: '문자로 문제 보내기',
  studentStatus: '학생 현황',
  recentAssignments: '최근 과제',
  viewAll: '전체 보기',
  weeklyTrend: '주간 문제 생성 추이',
  gradeDistribution: '성적 분포',
  submission: '제출',
  loading: '데이터를 불러오는 중...',
  error: '데이터를 불러오는 중 오류가 발생했습니다.',
  retry: '다시 시도',
  students: '명',
  problems: '문제',
  submissionRate: '과제 제출률',
  scoreImprovement: '평균 성적 향상',
  totalStudents: '전체 학생',
  weeklyProblems: '이번 주 생성 문제',
}

// 상태에 따른 스타일
const statusStyles = {
  '향상': 'bg-green-100 text-green-700',
  '유지': 'bg-blue-100 text-blue-700',
  '주의': 'bg-red-100 text-red-700',
}

// ============================================
// 스켈레톤 컴포넌트들 (Suspense fallback용)
// ============================================
function ChartSkeleton() {
  return (
    <div className="h-[240px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  )
}

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-12" />
        </div>
      ))}
    </div>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-xl" />
      ))}
    </div>
  )
}

// ============================================
// rerender-memo: 통계 카드 섹션 메모이제이션
// stats가 변경될 때만 재렌더링
// ============================================
const StatCardsSection = memo(function StatCardsSection({ stats }: { stats: TeacherStats }) {
  // 아이콘을 useMemo로 안정화하여 매 렌더마다 새 객체 생성 방지
  const icons = useMemo(
    () => ({
      users: <Users className="w-6 h-6" />,
      fileText: <FileText className="w-6 h-6" />,
      checkCircle: <CheckCircle className="w-6 h-6" />,
      trendingUp: <TrendingUp className="w-6 h-6" />,
    }),
    []
  )

  return (
    <div className="grid grid-cols-4 gap-6 mb-8">
      <StatCard
        label={UI_TEXT.totalStudents}
        value={stats.totalStudents}
        change={stats.totalStudentsChange > 0 ? `+${stats.totalStudentsChange}` : `${stats.totalStudentsChange}`}
        changeType={stats.totalStudentsChange >= 0 ? 'positive' : 'negative'}
        icon={icons.users}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
      />
      <StatCard
        label={UI_TEXT.weeklyProblems}
        value={stats.weeklyProblemsCreated}
        change={stats.weeklyProblemsChange > 0 ? `+${stats.weeklyProblemsChange}` : `${stats.weeklyProblemsChange}`}
        changeType={stats.weeklyProblemsChange >= 0 ? 'positive' : 'negative'}
        icon={icons.fileText}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
      />
      <StatCard
        label={UI_TEXT.submissionRate}
        value={`${stats.submissionRate}%`}
        change={stats.submissionRateChange > 0 ? `+${stats.submissionRateChange}%` : `${stats.submissionRateChange}%`}
        changeType={stats.submissionRateChange >= 0 ? 'positive' : 'negative'}
        icon={icons.checkCircle}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
      />
      <StatCard
        label={UI_TEXT.scoreImprovement}
        value={`+${stats.averageScoreImprovement}점`}
        changeType="neutral"
        icon={icons.trendingUp}
        iconBgColor="bg-orange-100"
        iconColor="text-orange-600"
      />
    </div>
  )
})

// ============================================
// rerender-memo: 학생 현황 섹션 메모이제이션
// ============================================
const StudentStatusSection = memo(function StudentStatusSection({
  students,
}: {
  students: TeacherStats['recentStudents']
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{UI_TEXT.studentStatus}</h3>
        <Link
          href="/dashboard/students"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          {UI_TEXT.viewAll} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {students.map((student) => (
          <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
                {student.name[0]}
              </div>
              <div>
                <p className="font-medium text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-500">{student.grade}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">{student.score}점</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[student.status]}`}>
                {student.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

// ============================================
// rerender-memo: 과제 현황 섹션 메모이제이션
// ============================================
const AssignmentsSection = memo(function AssignmentsSection({
  assignments,
}: {
  assignments: TeacherStats['recentAssignments']
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{UI_TEXT.recentAssignments}</h3>
        <Link
          href="/dashboard/assignments"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          {UI_TEXT.viewAll} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="p-3 bg-gray-50 rounded-xl">
            <p className="font-medium text-gray-900 mb-2">{assignment.title}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {UI_TEXT.submission}: {assignment.submittedCount}/{assignment.totalStudents}
                {UI_TEXT.students}
              </span>
              <span className="text-gray-400">{assignment.dueDate}</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${(assignment.submittedCount / assignment.totalStudents) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

// ============================================
// 빠른 작업 섹션 (정적 컨텐츠 - rendering-hoist-jsx)
// ============================================
const QuickActionsSection = memo(function QuickActionsSection() {
  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{UI_TEXT.quickActions}</h3>
      <div className="space-y-3">
        <Link href="/dashboard/problems">
          <button className="w-full flex items-center gap-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors text-left">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{UI_TEXT.newProblem}</p>
              <p className="text-sm text-gray-500">{UI_TEXT.newProblemDesc}</p>
            </div>
          </button>
        </Link>
        <Link href="/dashboard/students">
          <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{UI_TEXT.registerStudent}</p>
              <p className="text-sm text-gray-500">{UI_TEXT.registerStudentDesc}</p>
            </div>
          </button>
        </Link>
        <Link href="/dashboard/assignments">
          <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{UI_TEXT.distributeAssignment}</p>
              <p className="text-sm text-gray-500">{UI_TEXT.distributeAssignmentDesc}</p>
            </div>
          </button>
        </Link>
      </div>
    </div>
  )
})

// ============================================
// rerender-memo: 차트 섹션 메모이제이션
// ============================================
const ChartsSection = memo(function ChartsSection({ stats }: { stats: TeacherStats }) {
  // 차트 데이터 변환 메모이제이션
  const { gradeDistributionData, weeklyTrendData } = useMemo(
    () => transformChartData(stats),
    [stats]
  )

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* 주간 문제 생성 추이 */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{UI_TEXT.weeklyTrend}</h3>
        <Suspense fallback={<ChartSkeleton />}>
          <LineChart data={weeklyTrendData} height={240} color="#6366f1" showGrid={true} showTooltip={true} />
        </Suspense>
      </div>

      {/* 성적 분포 */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{UI_TEXT.gradeDistribution}</h3>
        <Suspense fallback={<ChartSkeleton />}>
          <BarChart data={gradeDistributionData} height={240} showGrid={true} showTooltip={true} />
        </Suspense>
      </div>
    </div>
  )
})

// ============================================
// 대시보드 콘텐츠 컴포넌트
// async-suspense-boundaries: 데이터 로딩을 Suspense로 감싸기 위한 분리
// ============================================
function DashboardContent() {
  // client-swr-dedup: SWR로 자동 캐싱 및 중복제거
  // TODO: 실제 academyId를 인증 컨텍스트에서 가져오기
  const academyId = 'mock-academy-id'
  const { stats, isLoading, error, mutate } = useDashboardStats(academyId)

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="p-8">
        <StatCardsSkeleton />
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card">
              <ContentSkeleton />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <ChartSkeleton />
          </div>
          <div className="card">
            <ChartSkeleton />
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-500">{error?.message || UI_TEXT.error}</p>
          <button onClick={() => mutate()} className="btn-primary">
            {UI_TEXT.retry}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* 통계 카드 - rerender-memo 적용 */}
      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCardsSection stats={stats} />
      </Suspense>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* 빠른 작업 - 정적 컨텐츠 */}
        <QuickActionsSection />

        {/* 최근 학생 현황 - rerender-memo 적용 */}
        <Suspense fallback={<div className="card"><ContentSkeleton /></div>}>
          <StudentStatusSection students={stats.recentStudents} />
        </Suspense>

        {/* 최근 과제 - rerender-memo 적용 */}
        <Suspense fallback={<div className="card"><ContentSkeleton /></div>}>
          <AssignmentsSection assignments={stats.recentAssignments} />
        </Suspense>
      </div>

      {/* 차트 영역 - bundle-dynamic-imports + rerender-memo 적용 */}
      <ChartsSection stats={stats} />
    </div>
  )
}

// ============================================
// 메인 대시보드 페이지
// ============================================
export default function DashboardPage() {
  return (
    <div>
      <Header title={UI_TEXT.pageTitle} subtitle={UI_TEXT.welcomeMessage} />

      {/* async-suspense-boundaries: 전체 콘텐츠를 Suspense로 감싸서 스트리밍 */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              <p className="text-gray-500">{UI_TEXT.loading}</p>
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  )
}
