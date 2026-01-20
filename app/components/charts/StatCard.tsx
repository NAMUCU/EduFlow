'use client'

/**
 * 통계 카드 컴포넌트
 *
 * 대시보드에서 주요 통계를 표시하는 카드 컴포넌트입니다.
 * 아이콘, 값, 변화량 등을 표시합니다.
 */

import { ReactNode, memo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ChangeType } from '@/types/stats'

// Props 타입 정의
interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: ChangeType
  icon?: ReactNode
  iconBgColor?: string
  iconColor?: string
  className?: string
  onClick?: () => void
}

// 변화 유형별 스타일
const CHANGE_STYLES: Record<ChangeType, { text: string; icon: typeof TrendingUp }> = {
  positive: { text: 'text-green-600', icon: TrendingUp },
  negative: { text: 'text-red-600', icon: TrendingDown },
  neutral: { text: 'text-gray-500', icon: Minus },
}

// rerender-memo 규칙: 부모 리렌더 시 불필요한 리렌더 방지
const StatCard = memo(function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  className = '',
  onClick,
}: StatCardProps) {
  const changeStyle = CHANGE_STYLES[changeType]
  const ChangeIcon = changeStyle.icon

  const cardClasses = `
    bg-white rounded-2xl p-5 shadow-sm border border-gray-100
    ${onClick ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}
    ${className}
  `.trim()

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${changeStyle.text}`}>
              <ChangeIcon className="w-4 h-4" />
              <span className="font-medium">{change}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center ${iconColor}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
})

export default StatCard

/**
 * 컴팩트한 통계 카드 (좁은 공간용)
 * rerender-memo 규칙 적용
 */
export const CompactStatCard = memo(function CompactStatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
}: StatCardProps) {
  const changeStyle = CHANGE_STYLES[changeType]

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
      {icon && (
        <div className={`w-10 h-10 ${iconBgColor} rounded-lg flex items-center justify-center ${iconColor} flex-shrink-0`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-gray-900">{value}</p>
          {change && (
            <span className={`text-xs font-medium ${changeStyle.text}`}>
              {change}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})

/**
 * 대형 통계 카드 (강조용)
 * rerender-memo 규칙 적용
 */
export const LargeStatCard = memo(function LargeStatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  description,
}: StatCardProps & { description?: string }) {
  const changeStyle = CHANGE_STYLES[changeType]
  const ChangeIcon = changeStyle.icon

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div className={`w-14 h-14 ${iconBgColor} rounded-xl flex items-center justify-center ${iconColor}`}>
            {icon}
          </div>
        )}
        {change && (
          <div className={`flex items-center gap-1 text-sm ${changeStyle.text}`}>
            <ChangeIcon className="w-4 h-4" />
            <span className="font-medium">{change}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-2">{description}</p>
      )}
    </div>
  )
})

/**
 * 색상이 있는 통계 카드 (배경색 적용)
 * rerender-memo 규칙 적용
 */
export const ColoredStatCard = memo(function ColoredStatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  bgGradient = 'from-blue-500 to-indigo-600',
}: Omit<StatCardProps, 'iconBgColor' | 'iconColor'> & { bgGradient?: string }) {
  const changeStyle = CHANGE_STYLES[changeType]
  const ChangeIcon = changeStyle.icon

  return (
    <div className={`bg-gradient-to-r ${bgGradient} rounded-2xl p-6 text-white`}>
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
            {icon}
          </div>
        )}
        {change && (
          <div className="flex items-center gap-1 text-sm text-white/80">
            <ChangeIcon className="w-4 h-4" />
            <span className="font-medium">{change}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-white/80 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
})
