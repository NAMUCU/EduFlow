'use client'

/**
 * 검수 결과 뱃지 컴포넌트
 *
 * 검수 점수와 상태를 시각적으로 표시합니다.
 * - 점수 뱃지: 검수 점수에 따른 색상 표시
 * - 상태 뱃지: 대기/완료/수정필요 상태 표시
 * - 이슈 카운트: 발견된 문제점 수 표시
 */

import { Shield, Clock, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react'

/** 검수 상태 타입 */
export type ReviewStatus = 'pending' | 'reviewing' | 'completed' | 'needs_revision' | 'error'

/** 검수 상태 한국어 라벨 */
const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: '대기',
  reviewing: '검수중',
  completed: '완료',
  needs_revision: '수정필요',
  error: '오류',
}

/** 검수 상태 아이콘 */
const STATUS_ICONS: Record<ReviewStatus, React.ElementType> = {
  pending: Clock,
  reviewing: Loader2,
  completed: CheckCircle2,
  needs_revision: AlertTriangle,
  error: XCircle,
}

/** 검수 상태 색상 */
const STATUS_COLORS: Record<ReviewStatus, string> = {
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  reviewing: 'bg-blue-50 text-blue-600 border-blue-200',
  completed: 'bg-green-50 text-green-600 border-green-200',
  needs_revision: 'bg-orange-50 text-orange-600 border-orange-200',
  error: 'bg-red-50 text-red-600 border-red-200',
}

interface ScoreBadgeProps {
  /** 점수 (0-100) */
  score: number
  /** 크기 */
  size?: 'sm' | 'md' | 'lg'
  /** 아이콘 표시 여부 */
  showIcon?: boolean
}

/**
 * 검수 점수 뱃지
 * 점수에 따라 색상이 변경됩니다.
 */
export function ScoreBadge({ score, size = 'md', showIcon = true }: ScoreBadgeProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100 text-green-700 border-green-300'
    if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-300'
    if (score >= 70) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    if (score >= 60) return 'bg-orange-100 text-orange-700 border-orange-300'
    return 'bg-red-100 text-red-700 border-red-300'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${getScoreColor(score)} ${sizeClasses[size]}`}
    >
      {showIcon && <Shield className={iconSizes[size]} />}
      {score}점
    </span>
  )
}

interface StatusBadgeProps {
  /** 검수 상태 */
  status: ReviewStatus
  /** 크기 */
  size?: 'sm' | 'md' | 'lg'
  /** 애니메이션 여부 (reviewing 상태에서) */
  animated?: boolean
}

/**
 * 검수 상태 뱃지
 * 현재 검수 상태를 표시합니다.
 */
export function StatusBadge({ status, size = 'md', animated = true }: StatusBadgeProps) {
  const Icon = STATUS_ICONS[status]

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${STATUS_COLORS[status]} ${sizeClasses[size]}`}
    >
      <Icon
        className={`${iconSizes[size]} ${animated && status === 'reviewing' ? 'animate-spin' : ''}`}
      />
      {STATUS_LABELS[status]}
    </span>
  )
}

interface IssueCountBadgeProps {
  /** 오류 수 */
  errors?: number
  /** 경고 수 */
  warnings?: number
  /** 제안 수 */
  suggestions?: number
  /** 크기 */
  size?: 'sm' | 'md' | 'lg'
  /** 0인 항목 숨기기 */
  hideZero?: boolean
}

/**
 * 이슈 카운트 뱃지
 * 발견된 오류/경고/제안 수를 표시합니다.
 */
export function IssueCountBadge({
  errors = 0,
  warnings = 0,
  suggestions = 0,
  size = 'md',
  hideZero = true,
}: IssueCountBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs gap-0.5',
    md: 'px-2 py-0.5 text-sm gap-1',
    lg: 'px-2.5 py-1 text-base gap-1.5',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }

  const items = [
    { count: errors, color: 'bg-red-100 text-red-600', icon: XCircle, label: '오류' },
    { count: warnings, color: 'bg-yellow-100 text-yellow-600', icon: AlertTriangle, label: '경고' },
    { count: suggestions, color: 'bg-blue-100 text-blue-600', icon: CheckCircle2, label: '제안' },
  ].filter((item) => !hideZero || item.count > 0)

  if (items.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5">
      {items.map((item) => (
        <span
          key={item.label}
          className={`inline-flex items-center rounded-full ${item.color} ${sizeClasses[size]}`}
          title={`${item.label} ${item.count}개`}
        >
          <item.icon className={iconSizes[size]} />
          {item.count}
        </span>
      ))}
    </div>
  )
}

interface CompactReviewBadgeProps {
  /** 점수 (0-100) */
  score?: number
  /** 검수 상태 */
  status: ReviewStatus
  /** 오류 수 */
  errors?: number
  /** 경고 수 */
  warnings?: number
  /** 제안 수 */
  suggestions?: number
}

/**
 * 통합 검수 뱃지
 * 점수, 상태, 이슈 카운트를 한 줄로 표시합니다.
 */
export function CompactReviewBadge({
  score,
  status,
  errors = 0,
  warnings = 0,
  suggestions = 0,
}: CompactReviewBadgeProps) {
  const hasIssues = errors > 0 || warnings > 0 || suggestions > 0

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={status} size="sm" />
      {score !== undefined && status !== 'pending' && status !== 'reviewing' && (
        <ScoreBadge score={score} size="sm" showIcon={false} />
      )}
      {hasIssues && (
        <IssueCountBadge
          errors={errors}
          warnings={warnings}
          suggestions={suggestions}
          size="sm"
        />
      )}
    </div>
  )
}

interface ReviewProgressBadgeProps {
  /** 완료된 문제 수 */
  completed: number
  /** 전체 문제 수 */
  total: number
  /** 현재 검수 중인 모델 이름 */
  currentModel?: string
}

/**
 * 검수 진행률 뱃지
 * 일괄 검수 시 진행 상황을 표시합니다.
 */
export function ReviewProgressBadge({
  completed,
  total,
  currentModel,
}: ReviewProgressBadgeProps) {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 rounded-lg">
      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700 font-medium">
            검수 진행 중 {currentModel && `(${currentModel})`}
          </span>
          <span className="text-blue-600">
            {completed}/{total}
          </span>
        </div>
        <div className="mt-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Named exports만 사용 (default export 불필요)
