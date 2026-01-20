'use client'

/**
 * EduFlow 학생 대시보드
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 자동 요청 중복제거 및 캐싱 (useStudentDashboard)
 * - bundle-dynamic-imports: next/dynamic으로 차트 컴포넌트 lazy loading
 * - rerender-memo: React.memo로 불필요한 리렌더 방지
 * - async-suspense-boundaries: Suspense로 스트리밍 UI
 * - async-parallel: Promise.all로 병렬 데이터 fetching (훅 내부)
 */

import { memo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import {
  BookOpen,
  Clock,
  Trophy,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Flame,
  Target,
  Star,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/charts'
import { useStudentDashboard, transformStudentChartData } from '@/hooks/useStudentDashboard'
import type { StudentStats, StudentAssignmentStatus, StudentGradeRecord } from '@/types/stats'

// bundle-dynamic-imports: 차트 컴포넌트를 동적으로 로드하여 초기 번들 크기 감소
// recharts 라이브러리가 무겁기 때문에 (약 200KB+) lazy loading으로 TTI 개선
const LineChart = dynamic(
  () => import('@/components/charts').then((m) => m.LineChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={200} />,
  }
)

// UI 텍스트 상수
const UI_TEXT = {
  greeting: '안녕하세요, 민준님!',
  subtitle: '오늘도 열심히 공부해볼까요?',
  todayAssignment: '오늘의 과제',
  recentGrades: '최근 성적',
  studyStreak: '연속 학습',
  weeklyGoal: '주간 목표',
  viewAll: '전체보기',
  problemCount: '문제',
  completed: '완료',
  inProgress: '진행 중',
  notStarted: '시작 전',
  days: '일째',
  solvedProblems: '푼 문제',
  wrongProblems: '틀린 문제',
  loading: '데이터를 불러오는 중...',
  error: '데이터를 불러오는 중 오류가 발생했습니다.',
  retry: '다시 시도',
  weeklyStudy: '주간 학습 현황',
  weakUnits: '취약 단원',
  correctRate: '정답률',
}

// 상태에 따른 스타일과 아이콘
const statusConfig = {
  completed: {
    label: UI_TEXT.completed,
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: CheckCircle,
  },
  in_progress: {
    label: UI_TEXT.inProgress,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: Clock,
  },
  not_started: {
    label: UI_TEXT.notStarted,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    icon: AlertCircle,
  },
}

// 점수에 따른 색상
function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

// ============================================
// rerender-memo: React.memo로 불필요한 리렌더 방지
// 각 섹션별 컴포넌트를 메모이제이션하여 props가 변경되지 않으면 리렌더 스킵
// ============================================

/** 대시보드 헤더 */
const DashboardHeader = memo(function DashboardHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        {UI_TEXT.greeting}
      </h1>
      <p className="text-gray-500 mt-1">{UI_TEXT.subtitle}</p>
    </div>
  )
})

/** 로딩 스켈레톤 */
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-gray-500">{UI_TEXT.loading}</p>
      </div>
    </div>
  )
})

/** 에러 표시 */
interface ErrorDisplayProps {
  error: string
  onRetry: () => void
}

const ErrorDisplay = memo(function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={onRetry} className="btn-primary">
          {UI_TEXT.retry}
        </button>
      </div>
    </div>
  )
})

/** 차트 스켈레톤 */
function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse bg-gray-200 rounded-lg"
      style={{ height }}
    />
  )
}

/** 통계 카드 그리드 */
interface StatsCardsProps {
  stats: StudentStats
}

const StatsCards = memo(function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 연속 학습 */}
      <StatCard
        label={UI_TEXT.studyStreak}
        value={`${stats.studyStreak}${UI_TEXT.days}`}
        changeType="positive"
        icon={<Flame className="w-6 h-6" />}
        iconBgColor="bg-orange-100"
        iconColor="text-orange-500"
      />

      {/* 주간 목표 */}
      <WeeklyGoalCard progress={stats.weeklyGoalProgress} />

      {/* 푼 문제 */}
      <StatCard
        label={UI_TEXT.solvedProblems}
        value={`${stats.solvedProblems}${UI_TEXT.problemCount}`}
        changeType="positive"
        icon={<BookOpen className="w-6 h-6" />}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
      />

      {/* 틀린 문제 */}
      <Link href="/student/wrong-answers" className="block">
        <StatCard
          label={UI_TEXT.wrongProblems}
          value={`${stats.wrongProblems}${UI_TEXT.problemCount}`}
          changeType="negative"
          icon={<AlertCircle className="w-6 h-6" />}
          iconBgColor="bg-red-100"
          iconColor="text-red-500"
          className="cursor-pointer"
        />
      </Link>
    </div>
  )
})

/** 주간 목표 카드 */
interface WeeklyGoalCardProps {
  progress: number
}

const WeeklyGoalCard = memo(function WeeklyGoalCard({ progress }: WeeklyGoalCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{UI_TEXT.weeklyGoal}</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {progress}
            <span className="text-lg ml-1">%</span>
          </p>
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Target className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <div className="mt-3">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
})

/** 과제 아이템 */
interface AssignmentItemProps {
  assignment: StudentAssignmentStatus
}

const AssignmentItem = memo(function AssignmentItem({ assignment }: AssignmentItemProps) {
  const status = statusConfig[assignment.status as keyof typeof statusConfig]
  const StatusIcon = status.icon
  const progress = (assignment.completedCount / assignment.problemCount) * 100

  return (
    <Link
      href="/student/solve"
      className="block p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 ${status.bgColor} rounded-xl flex items-center justify-center`}>
          <StatusIcon className={`w-5 h-5 ${status.textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
              {assignment.subject}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 ${status.bgColor} ${status.textColor} rounded`}>
              {status.label}
            </span>
          </div>
          <p className="font-medium text-gray-800 mt-1 truncate">{assignment.title}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{assignment.completedCount}/{assignment.problemCount} {UI_TEXT.problemCount}</span>
            <span>·</span>
            <span>{assignment.dueDate}</span>
          </div>
        </div>
        <div className="w-16 text-right">
          <div className="text-sm font-bold text-gray-700">{Math.round(progress)}%</div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all ${
                assignment.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
})

/** 오늘의 과제 섹션 */
interface TodayAssignmentsProps {
  assignments: StudentAssignmentStatus[]
}

const TodayAssignments = memo(function TodayAssignments({ assignments }: TodayAssignmentsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          {UI_TEXT.todayAssignment}
        </h2>
        <Link
          href="/student/solve"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          {UI_TEXT.viewAll}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {assignments.map((assignment) => (
          <AssignmentItem key={assignment.id} assignment={assignment} />
        ))}
      </div>
    </div>
  )
})

/** 성적 아이템 */
interface GradeItemProps {
  grade: StudentGradeRecord
}

const GradeItem = memo(function GradeItem({ grade }: GradeItemProps) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5 text-yellow-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
              {grade.subject}
            </span>
          </div>
          <p className="font-medium text-gray-800 mt-1 truncate">{grade.chapter}</p>
          <p className="text-xs text-gray-500 mt-0.5">{grade.date}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getScoreColor(grade.score)}`}>
            {grade.score}
            <span className="text-sm text-gray-400">/{grade.totalScore}</span>
          </p>
        </div>
      </div>
    </div>
  )
})

/** 최근 성적 섹션 */
interface RecentGradesProps {
  grades: StudentGradeRecord[]
}

const RecentGrades = memo(function RecentGrades({ grades }: RecentGradesProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          {UI_TEXT.recentGrades}
        </h2>
        <Link
          href="/student/grades"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          {UI_TEXT.viewAll}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {grades.map((grade, index) => (
          <GradeItem key={index} grade={grade} />
        ))}
      </div>
    </div>
  )
})

/** 주간 학습 차트 섹션 */
interface WeeklyStudyChartProps {
  data: { label: string; value: number }[]
}

const WeeklyStudyChart = memo(function WeeklyStudyChart({ data }: WeeklyStudyChartProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4">{UI_TEXT.weeklyStudy}</h3>
      <Suspense fallback={<ChartSkeleton height={200} />}>
        <LineChart
          data={data}
          height={200}
          color="#3b82f6"
          showGrid={true}
          showTooltip={true}
        />
      </Suspense>
    </div>
  )
})

/** 취약 단원 아이템 */
interface WeakUnitItemProps {
  unit: {
    subject: string
    unit: string
    correctRate: number
  }
}

const WeakUnitItem = memo(function WeakUnitItem({ unit }: WeakUnitItemProps) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 bg-red-100 text-red-700 rounded">
            {unit.subject}
          </span>
          <span className="font-medium text-gray-800">{unit.unit}</span>
        </div>
        <span className={`text-sm font-bold ${getScoreColor(unit.correctRate)}`}>
          {unit.correctRate}%
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-400 rounded-full"
          style={{ width: `${unit.correctRate}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{UI_TEXT.correctRate}</p>
    </div>
  )
})

/** 취약 단원 섹션 */
interface WeakUnitsSectionProps {
  units: {
    subject: string
    unit: string
    correctRate: number
  }[]
}

const WeakUnitsSection = memo(function WeakUnitsSection({ units }: WeakUnitsSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4">{UI_TEXT.weakUnits}</h3>
      <div className="space-y-4">
        {units.map((unit, index) => (
          <WeakUnitItem key={index} unit={unit} />
        ))}
      </div>
    </div>
  )
})

/** 대시보드 콘텐츠 (데이터 로드 후 렌더링) */
interface DashboardContentProps {
  stats: StudentStats
}

const DashboardContent = memo(function DashboardContent({ stats }: DashboardContentProps) {
  // 차트 데이터 변환
  const { weeklyChartData } = transformStudentChartData(stats)

  return (
    <>
      {/* 통계 카드들 */}
      <StatsCards stats={stats} />

      {/* 오늘의 과제 & 최근 성적 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TodayAssignments assignments={stats.todayAssignments} />
        <RecentGrades grades={stats.recentGrades} />
      </div>

      {/* 주간 학습 현황 & 취약 단원 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* async-suspense-boundaries: 차트는 Suspense로 감싸 스트리밍 */}
        <Suspense fallback={<ChartSkeleton height={280} />}>
          <WeeklyStudyChart data={weeklyChartData} />
        </Suspense>
        <WeakUnitsSection units={stats.weakUnits} />
      </div>
    </>
  )
})

// ============================================
// 메인 페이지 컴포넌트
// ============================================

export default function StudentDashboard() {
  // client-swr-dedup: SWR로 자동 캐싱 및 요청 중복제거
  // TODO: 실제 studentId를 인증 컨텍스트에서 가져오기
  const studentId = 'mock-student-id'
  const { stats, error, isLoading, mutate } = useStudentDashboard(studentId)

  return (
    <div className="p-8">
      {/* 인사말 헤더 - 항상 즉시 표시 */}
      <DashboardHeader />

      {/* async-suspense-boundaries: 조건부 렌더링으로 스트리밍 효과 */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay error={error.message || UI_TEXT.error} onRetry={() => mutate()} />
      ) : stats ? (
        <DashboardContent stats={stats} />
      ) : (
        <ErrorDisplay error={UI_TEXT.error} onRetry={() => mutate()} />
      )}
    </div>
  )
}
