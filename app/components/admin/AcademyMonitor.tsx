'use client'

/**
 * 학원 모니터링 컴포넌트
 *
 * 슈퍼 어드민용 학원 상태 모니터링 대시보드 컴포넌트입니다.
 * - 학원 상태 카드 (활성/비활성/만료 표시)
 * - 실시간 활동 표시 (최근 로그인, 문제 생성 등)
 * - 경고 표시 (결제 실패, 장기 미접속 등)
 */

import { useState, useMemo, memo } from 'react'
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  LogIn,
  FileText,
  Users,
  Activity,
  RefreshCw,
  ChevronRight,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  MoreHorizontal,
  Calendar,
  Wifi,
  WifiOff,
} from 'lucide-react'

// 학원 상태 타입
type AcademyStatus = 'active' | 'inactive' | 'expired'

// 활동 타입
type ActivityType = 'login' | 'problem_create' | 'student_add' | 'payment' | 'report_generate'

// 경고 타입
type AlertType = 'payment_failed' | 'long_inactive' | 'subscription_expiring' | 'storage_full'
type AlertSeverity = 'critical' | 'warning' | 'info'

// 학원 데이터 타입
interface Academy {
  id: number
  name: string
  owner: string
  status: AcademyStatus
  lastLoginAt: string
  subscriptionEndDate: string
  studentCount: number
  teacherCount: number
  problemsCreated: number
  isOnline: boolean
}

// 활동 로그 타입
interface ActivityLog {
  id: number
  academyId: number
  academyName: string
  type: ActivityType
  description: string
  timestamp: string
}

// 경고 타입
interface Alert {
  id: number
  academyId: number
  academyName: string
  type: AlertType
  severity: AlertSeverity
  message: string
  timestamp: string
}

// Props 타입
interface AcademyMonitorProps {
  className?: string
  onViewAcademy?: (academyId: number) => void
  onResolveAlert?: (alertId: number) => void
}

// Mock 데이터 - 학원 목록
const mockAcademies: Academy[] = [
  {
    id: 1,
    name: '스마트 수학학원',
    owner: '김영희',
    status: 'active',
    lastLoginAt: '2025-01-21T09:30:00',
    subscriptionEndDate: '2025-06-15',
    studentCount: 45,
    teacherCount: 5,
    problemsCreated: 1250,
    isOnline: true,
  },
  {
    id: 2,
    name: '영어마을학원',
    owner: '이철수',
    status: 'active',
    lastLoginAt: '2025-01-21T08:45:00',
    subscriptionEndDate: '2025-04-20',
    studentCount: 32,
    teacherCount: 3,
    problemsCreated: 890,
    isOnline: true,
  },
  {
    id: 3,
    name: '과학탐구교실',
    owner: '박지민',
    status: 'inactive',
    lastLoginAt: '2025-01-10T14:20:00',
    subscriptionEndDate: '2025-02-16',
    studentCount: 0,
    teacherCount: 0,
    problemsCreated: 0,
    isOnline: false,
  },
  {
    id: 4,
    name: '국어논술학원',
    owner: '최수진',
    status: 'active',
    lastLoginAt: '2025-01-21T10:15:00',
    subscriptionEndDate: '2025-12-10',
    studentCount: 128,
    teacherCount: 12,
    problemsCreated: 3420,
    isOnline: true,
  },
  {
    id: 5,
    name: '종합학습센터',
    owner: '정민호',
    status: 'expired',
    lastLoginAt: '2024-12-20T16:30:00',
    subscriptionEndDate: '2025-01-05',
    studentCount: 67,
    teacherCount: 4,
    problemsCreated: 1890,
    isOnline: false,
  },
  {
    id: 6,
    name: '명문학원',
    owner: '강태호',
    status: 'active',
    lastLoginAt: '2025-01-21T07:00:00',
    subscriptionEndDate: '2025-11-20',
    studentCount: 210,
    teacherCount: 15,
    problemsCreated: 5600,
    isOnline: true,
  },
]

// Mock 데이터 - 최근 활동 로그
const mockActivities: ActivityLog[] = [
  {
    id: 1,
    academyId: 1,
    academyName: '스마트 수학학원',
    type: 'problem_create',
    description: '수학 문제 15개 생성',
    timestamp: '2025-01-21T09:45:00',
  },
  {
    id: 2,
    academyId: 4,
    academyName: '국어논술학원',
    type: 'login',
    description: '관리자 로그인',
    timestamp: '2025-01-21T10:15:00',
  },
  {
    id: 3,
    academyId: 6,
    academyName: '명문학원',
    type: 'student_add',
    description: '신규 학생 3명 등록',
    timestamp: '2025-01-21T08:30:00',
  },
  {
    id: 4,
    academyId: 2,
    academyName: '영어마을학원',
    type: 'report_generate',
    description: '월간 리포트 생성',
    timestamp: '2025-01-21T08:00:00',
  },
  {
    id: 5,
    academyId: 1,
    academyName: '스마트 수학학원',
    type: 'payment',
    description: '월간 구독료 결제 완료',
    timestamp: '2025-01-20T14:30:00',
  },
]

// Mock 데이터 - 경고 목록
const mockAlerts: Alert[] = [
  {
    id: 1,
    academyId: 5,
    academyName: '종합학습센터',
    type: 'payment_failed',
    severity: 'critical',
    message: '구독료 결제 실패 - 카드 한도 초과',
    timestamp: '2025-01-20T09:00:00',
  },
  {
    id: 2,
    academyId: 3,
    academyName: '과학탐구교실',
    type: 'long_inactive',
    severity: 'warning',
    message: '11일간 미접속 상태입니다',
    timestamp: '2025-01-21T00:00:00',
  },
  {
    id: 3,
    academyId: 2,
    academyName: '영어마을학원',
    type: 'subscription_expiring',
    severity: 'info',
    message: '구독 만료 3개월 전입니다',
    timestamp: '2025-01-21T00:00:00',
  },
]

// 상태별 스타일
const STATUS_STYLES: Record<AcademyStatus, { bg: string; text: string; label: string; icon: typeof CheckCircle2 }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700', label: '활성', icon: CheckCircle2 },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-600', label: '비활성', icon: Clock },
  expired: { bg: 'bg-red-100', text: 'text-red-700', label: '만료', icon: XCircle },
}

// 활동 타입별 스타일
const ACTIVITY_STYLES: Record<ActivityType, { bg: string; icon: typeof LogIn; label: string }> = {
  login: { bg: 'bg-blue-100', icon: LogIn, label: '로그인' },
  problem_create: { bg: 'bg-purple-100', icon: FileText, label: '문제 생성' },
  student_add: { bg: 'bg-green-100', icon: Users, label: '학생 등록' },
  payment: { bg: 'bg-emerald-100', icon: CreditCard, label: '결제' },
  report_generate: { bg: 'bg-orange-100', icon: FileText, label: '리포트' },
}

// 경고 심각도별 스타일
const ALERT_SEVERITY_STYLES: Record<AlertSeverity, { bg: string; text: string; border: string; icon: typeof AlertTriangle }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Bell },
}

// 시간 포맷 헬퍼
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR')
}

// 날짜 포맷 헬퍼
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 학원 상태 카드 컴포넌트
 */
const AcademyStatusCard = memo(function AcademyStatusCard({
  academy,
  onView,
}: {
  academy: Academy
  onView?: (id: number) => void
}) {
  const statusStyle = STATUS_STYLES[academy.status]
  const StatusIcon = statusStyle.icon

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{academy.name}</h3>
            <p className="text-xs text-gray-500">{academy.owner}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 온라인 상태 표시 */}
          <div className={`flex items-center gap-1 text-xs ${academy.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
            {academy.isOnline ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span>{academy.isOnline ? '온라인' : '오프라인'}</span>
          </div>
          {/* 상태 배지 */}
          <span className={`text-xs px-2 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {statusStyle.label}
          </span>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-gray-900">{academy.studentCount}</p>
          <p className="text-xs text-gray-500">학생</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-gray-900">{academy.teacherCount}</p>
          <p className="text-xs text-gray-500">강사</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-gray-900">{academy.problemsCreated.toLocaleString()}</p>
          <p className="text-xs text-gray-500">문제</p>
        </div>
      </div>

      {/* 추가 정보 */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>최근 접속: {formatTimeAgo(academy.lastLoginAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>구독 만료: {formatDate(academy.subscriptionEndDate)}</span>
        </div>
      </div>

      {/* 액션 버튼 */}
      {onView && (
        <button
          onClick={() => onView(academy.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          상세 보기
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
})

/**
 * 실시간 활동 목록 컴포넌트
 */
const ActivityList = memo(function ActivityList({
  activities,
  maxItems = 5,
}: {
  activities: ActivityLog[]
  maxItems?: number
}) {
  const displayActivities = activities.slice(0, maxItems)

  return (
    <div className="space-y-3">
      {displayActivities.map((activity) => {
        const activityStyle = ACTIVITY_STYLES[activity.type]
        const ActivityIcon = activityStyle.icon

        return (
          <div
            key={activity.id}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className={`w-8 h-8 ${activityStyle.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <ActivityIcon className="w-4 h-4 text-gray-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {activity.academyName}
              </p>
              <p className="text-xs text-gray-500 truncate">{activity.description}</p>
            </div>
            <div className="text-xs text-gray-400 flex-shrink-0">
              {formatTimeAgo(activity.timestamp)}
            </div>
          </div>
        )
      })}

      {activities.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">최근 활동이 없습니다</p>
        </div>
      )}
    </div>
  )
})

/**
 * 경고 목록 컴포넌트
 */
const AlertList = memo(function AlertList({
  alerts,
  onResolve,
}: {
  alerts: Alert[]
  onResolve?: (alertId: number) => void
}) {
  // 심각도별 정렬 (critical > warning > info)
  const sortedAlerts = useMemo(() => {
    const severityOrder: Record<AlertSeverity, number> = {
      critical: 0,
      warning: 1,
      info: 2,
    }
    return [...alerts].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  }, [alerts])

  return (
    <div className="space-y-3">
      {sortedAlerts.map((alert) => {
        const severityStyle = ALERT_SEVERITY_STYLES[alert.severity]
        const SeverityIcon = severityStyle.icon

        return (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${severityStyle.bg} ${severityStyle.border}`}
          >
            <div className="flex items-start gap-3">
              <SeverityIcon className={`w-5 h-5 ${severityStyle.text} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${severityStyle.text}`}>
                    {alert.academyName}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(alert.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{alert.message}</p>
              </div>
              {onResolve && (
                <button
                  onClick={() => onResolve(alert.id)}
                  className="p-1 hover:bg-white/50 rounded transition-colors flex-shrink-0"
                  title="경고 해제"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        )
      })}

      {alerts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm">모든 학원이 정상 상태입니다</p>
        </div>
      )}
    </div>
  )
})

/**
 * 메인 학원 모니터링 컴포넌트
 */
export default function AcademyMonitor({
  className = '',
  onViewAcademy,
  onResolveAlert,
}: AcademyMonitorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<AcademyStatus | 'all'>('all')

  // 통계 계산
  const stats = useMemo(() => {
    const active = mockAcademies.filter((a) => a.status === 'active').length
    const inactive = mockAcademies.filter((a) => a.status === 'inactive').length
    const expired = mockAcademies.filter((a) => a.status === 'expired').length
    const online = mockAcademies.filter((a) => a.isOnline).length

    return {
      total: mockAcademies.length,
      active,
      inactive,
      expired,
      online,
      activeRate: ((active / mockAcademies.length) * 100).toFixed(1),
    }
  }, [])

  // 필터링된 학원 목록
  const filteredAcademies = useMemo(() => {
    if (statusFilter === 'all') return mockAcademies
    return mockAcademies.filter((a) => a.status === statusFilter)
  }, [statusFilter])

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setIsRefreshing(true)
    // 실제로는 API 호출
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 학원</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">활성 학원</p>
              <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">비활성 학원</p>
              <p className="text-xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">만료 학원</p>
              <p className="text-xl font-bold text-gray-900">{stats.expired}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">현재 접속</p>
              <p className="text-xl font-bold text-gray-900">{stats.online}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 학원 상태 카드 목록 */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">학원 상태</h2>
              <div className="flex items-center gap-3">
                {/* 상태 필터 */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as AcademyStatus | 'all')}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">전체 상태</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="expired">만료</option>
                </select>
                {/* 새로고침 버튼 */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  새로고침
                </button>
              </div>
            </div>

            {/* 학원 카드 그리드 */}
            <div className="grid grid-cols-2 gap-4">
              {filteredAcademies.map((academy) => (
                <AcademyStatusCard
                  key={academy.id}
                  academy={academy}
                  onView={onViewAcademy}
                />
              ))}
            </div>

            {filteredAcademies.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>해당 상태의 학원이 없습니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 사이드바 - 활동 및 경고 */}
        <div className="space-y-6">
          {/* 실시간 활동 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                실시간 활동
              </h2>
              <span className="text-xs text-gray-500">최근 24시간</span>
            </div>
            <ActivityList activities={mockActivities} maxItems={5} />
          </div>

          {/* 경고 알림 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                경고 알림
                {mockAlerts.length > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {mockAlerts.length}
                  </span>
                )}
              </h2>
            </div>
            <AlertList alerts={mockAlerts} onResolve={onResolveAlert} />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 학원 상태 미니 카드 (대시보드 위젯용)
 */
export const AcademyStatusMiniCard = memo(function AcademyStatusMiniCard({
  status,
  count,
  change,
  changeType = 'neutral',
}: {
  status: AcademyStatus
  count: number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}) {
  const statusStyle = STATUS_STYLES[status]
  const StatusIcon = statusStyle.icon

  const changeStyles = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-500',
  }

  const ChangeIcon = changeType === 'positive' ? TrendingUp : changeType === 'negative' ? TrendingDown : Minus

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 ${statusStyle.bg} rounded-lg flex items-center justify-center`}>
          <StatusIcon className={`w-4 h-4 ${statusStyle.text}`} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs ${changeStyles[changeType]}`}>
            <ChangeIcon className="w-3 h-3" />
            <span>{change}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{count}</p>
      <p className={`text-sm ${statusStyle.text}`}>{statusStyle.label} 학원</p>
    </div>
  )
})

/**
 * 학원 활동 요약 컴포넌트 (대시보드 위젯용)
 */
export const AcademyActivitySummary = memo(function AcademyActivitySummary({
  todayLogins,
  todayProblems,
  todayNewStudents,
}: {
  todayLogins: number
  todayProblems: number
  todayNewStudents: number
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">오늘의 활동</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
              <LogIn className="w-3 h-3 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">로그인</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{todayLogins}회</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
              <FileText className="w-3 h-3 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">문제 생성</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{todayProblems}개</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
              <Users className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">신규 학생</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{todayNewStudents}명</span>
        </div>
      </div>
    </div>
  )
})
