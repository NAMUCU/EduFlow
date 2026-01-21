'use client'

/**
 * 개선된 통계 카드 컴포넌트
 *
 * 증감률 표시와 미니 차트(스파크라인)를 지원하는 통계 카드입니다.
 *
 * 기능:
 * - 증감률 표시 (양수/음수 색상 구분)
 * - 미니 스파크라인 차트
 * - 목표 대비 진행률 표시
 * - 다양한 스타일 변형
 */

import { ReactNode, memo, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import type { ChangeType, TimeSeriesDataPoint } from '@/types/stats'

// ============================================
// 타입 정의
// ============================================

interface StatsCardProps {
  /** 카드 라벨 (예: '전체 학생') */
  label: string
  /** 주요 값 (숫자 또는 문자열) */
  value: string | number
  /** 변화량 문자열 (예: '+12', '-5%') */
  change?: string
  /** 변화 유형 */
  changeType?: ChangeType
  /** 변화율 (%) - 숫자로 전달하면 자동 포맷팅 */
  changePercent?: number
  /** 아이콘 */
  icon?: ReactNode
  /** 아이콘 배경색 (Tailwind 클래스) */
  iconBgColor?: string
  /** 아이콘 색상 (Tailwind 클래스) */
  iconColor?: string
  /** 미니 차트 데이터 */
  sparklineData?: number[]
  /** 스파크라인 색상 */
  sparklineColor?: string
  /** 목표 값 (진행률 표시용) */
  target?: number
  /** 현재 값 (진행률 계산용) */
  current?: number
  /** 추가 CSS 클래스 */
  className?: string
  /** 클릭 핸들러 */
  onClick?: () => void
  /** 부가 설명 텍스트 */
  description?: string
  /** 단위 (예: '명', '문제', '%') */
  unit?: string
}

// ============================================
// 상수 정의
// ============================================

// 변화 유형별 스타일
const CHANGE_STYLES: Record<ChangeType, { text: string; bg: string; icon: typeof TrendingUp }> = {
  positive: { text: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp },
  negative: { text: 'text-red-600', bg: 'bg-red-50', icon: TrendingDown },
  neutral: { text: 'text-gray-500', bg: 'bg-gray-50', icon: Minus },
}

// ============================================
// 미니 스파크라인 컴포넌트
// ============================================

interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

const Sparkline = memo(function Sparkline({
  data,
  color = '#6366f1',
  width = 80,
  height = 24,
}: SparklineProps) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return ''

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const padding = 2

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })

    return `M${points.join(' L')}`
  }, [data, width, height])

  if (!data || data.length < 2) return null

  // 트렌드 방향에 따른 색상 결정
  const trend = data[data.length - 1] - data[0]
  const lineColor = trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : color

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* 그라데이션 정의 */}
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 영역 채우기 */}
      <path
        d={`${path} L${width - 2},${height - 2} L2,${height - 2} Z`}
        fill={`url(#sparkline-gradient-${color})`}
      />

      {/* 라인 */}
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 마지막 점 강조 */}
      <circle
        cx={width - 2}
        cy={height - 2 - ((data[data.length - 1] - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * (height - 4)}
        r="2"
        fill={lineColor}
      />
    </svg>
  )
})

// ============================================
// 진행률 바 컴포넌트
// ============================================

interface ProgressBarProps {
  current: number
  target: number
  color?: string
}

const ProgressBar = memo(function ProgressBar({
  current,
  target,
  color = 'bg-primary-500',
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100)

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500">진행률</span>
        <span className="font-medium text-gray-700">{percentage}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
})

// ============================================
// 메인 통계 카드 컴포넌트
// ============================================

const StatsCard = memo(function StatsCard({
  label,
  value,
  change,
  changeType = 'neutral',
  changePercent,
  icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  sparklineData,
  sparklineColor,
  target,
  current,
  className = '',
  onClick,
  description,
  unit,
}: StatsCardProps) {
  const changeStyle = CHANGE_STYLES[changeType]
  const ChangeIcon = changeStyle.icon

  // 변화량 텍스트 결정
  const changeText = useMemo(() => {
    if (change) return change
    if (changePercent !== undefined) {
      const prefix = changePercent > 0 ? '+' : ''
      return `${prefix}${changePercent.toFixed(1)}%`
    }
    return undefined
  }, [change, changePercent])

  const cardClasses = `
    bg-white rounded-2xl p-5 shadow-sm border border-gray-100
    transition-all duration-200
    ${onClick ? 'hover:shadow-md hover:border-gray-200 cursor-pointer' : ''}
    ${className}
  `.trim()

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-start justify-between">
        {/* 왼쪽: 라벨, 값, 변화량 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-1 truncate">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>

          {/* 변화량 표시 */}
          {changeText && (
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${changeStyle.bg} ${changeStyle.text}`}>
              <ChangeIcon className="w-3 h-3" />
              <span>{changeText}</span>
            </div>
          )}

          {/* 부가 설명 */}
          {description && (
            <p className="text-xs text-gray-400 mt-2 truncate">{description}</p>
          )}
        </div>

        {/* 오른쪽: 아이콘 또는 스파크라인 */}
        <div className="flex flex-col items-end gap-2 ml-3">
          {icon && (
            <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center ${iconColor}`}>
              {icon}
            </div>
          )}

          {/* 스파크라인 차트 */}
          {sparklineData && sparklineData.length > 1 && (
            <Sparkline
              data={sparklineData}
              color={sparklineColor}
              width={80}
              height={28}
            />
          )}
        </div>
      </div>

      {/* 진행률 바 */}
      {target !== undefined && current !== undefined && (
        <ProgressBar current={current} target={target} />
      )}
    </div>
  )
})

export default StatsCard

// ============================================
// 변형 컴포넌트들
// ============================================

/**
 * 컴팩트 통계 카드
 */
export const CompactStatsCard = memo(function CompactStatsCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  sparklineData,
  className = '',
}: Omit<StatsCardProps, 'target' | 'current' | 'description'>) {
  const changeStyle = CHANGE_STYLES[changeType]

  return (
    <div className={`flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 ${className}`}>
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
      {sparklineData && sparklineData.length > 1 && (
        <Sparkline data={sparklineData} width={60} height={20} />
      )}
    </div>
  )
})

/**
 * 큰 통계 카드 (강조용)
 */
export const LargeStatsCard = memo(function LargeStatsCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  sparklineData,
  description,
  target,
  current,
  unit,
}: StatsCardProps) {
  const changeStyle = CHANGE_STYLES[changeType]
  const ChangeIcon = changeStyle.icon

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div className={`w-14 h-14 ${iconBgColor} rounded-xl flex items-center justify-center ${iconColor}`}>
            {icon}
          </div>
        )}
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${changeStyle.bg} ${changeStyle.text}`}>
            <ChangeIcon className="w-4 h-4" />
            <span className="font-medium">{change}</span>
          </div>
        )}
      </div>

      {/* 라벨 및 값 */}
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-1 mb-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {unit && <span className="text-lg text-gray-500">{unit}</span>}
      </div>

      {/* 부가 설명 */}
      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}

      {/* 스파크라인 */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Sparkline data={sparklineData} width={200} height={40} />
        </div>
      )}

      {/* 진행률 */}
      {target !== undefined && current !== undefined && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <ProgressBar current={current} target={target} />
        </div>
      )}
    </div>
  )
})

/**
 * 컬러풀 통계 카드 (그라데이션 배경)
 */
export const ColorfulStatsCard = memo(function ColorfulStatsCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  sparklineData,
  bgGradient = 'from-blue-500 to-indigo-600',
  unit,
}: Omit<StatsCardProps, 'iconBgColor' | 'iconColor'> & { bgGradient?: string }) {
  const changeStyle = CHANGE_STYLES[changeType]
  const ChangeIcon = changeStyle.icon

  return (
    <div className={`bg-gradient-to-r ${bgGradient} rounded-2xl p-6 text-white`}>
      {/* 헤더 */}
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

      {/* 라벨 및 값 */}
      <p className="text-sm text-white/80 mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-bold">{value}</p>
        {unit && <span className="text-lg text-white/70">{unit}</span>}
      </div>

      {/* 스파크라인 (흰색) */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-4 opacity-60">
          <Sparkline data={sparklineData} color="#ffffff" width={180} height={32} />
        </div>
      )}
    </div>
  )
})

/**
 * 목표 달성 통계 카드
 */
export const GoalStatsCard = memo(function GoalStatsCard({
  label,
  current,
  target,
  unit = '',
  icon,
  iconBgColor = 'bg-purple-100',
  iconColor = 'text-purple-600',
  className = '',
}: {
  label: string
  current: number
  target: number
  unit?: string
  icon?: ReactNode
  iconBgColor?: string
  iconColor?: string
  className?: string
}) {
  const percentage = Math.min(Math.round((current / target) * 100), 100)
  const isCompleted = percentage >= 100

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className={`w-10 h-10 ${iconBgColor} rounded-lg flex items-center justify-center ${iconColor}`}>
              {icon}
            </div>
          ) : (
            <div className={`w-10 h-10 ${isCompleted ? 'bg-green-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
              <Target className={`w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-gray-500'}`} />
            </div>
          )}
          <p className="font-medium text-gray-900">{label}</p>
        </div>
        <span className={`text-sm font-bold ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
          {percentage}%
        </span>
      </div>

      {/* 진행 바 */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-primary-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 현재/목표 값 */}
      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="text-gray-500">
          현재: <span className="font-medium text-gray-700">{current}{unit}</span>
        </span>
        <span className="text-gray-500">
          목표: <span className="font-medium text-gray-700">{target}{unit}</span>
        </span>
      </div>
    </div>
  )
})
