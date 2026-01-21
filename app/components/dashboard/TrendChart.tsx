'use client'

/**
 * 추이 차트 컴포넌트
 *
 * recharts를 활용한 주간/월간 추이 차트입니다.
 *
 * 기능:
 * - 라인 차트 (단일/다중 시리즈)
 * - 영역 차트
 * - 막대 차트
 * - 복합 차트
 * - 반응형 디자인
 * - 툴팁 및 범례
 */

import { memo, useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from 'recharts'
import type { TimeSeriesDataPoint } from '@/types/stats'

// ============================================
// 타입 정의
// ============================================

export interface TrendChartProps {
  /** 차트 데이터 */
  data: TimeSeriesDataPoint[]
  /** 차트 타입 */
  type?: 'line' | 'area' | 'bar' | 'composed'
  /** 차트 높이 (px) */
  height?: number
  /** 주 색상 */
  color?: string
  /** 다중 시리즈 색상 배열 */
  colors?: string[]
  /** 그리드 표시 여부 */
  showGrid?: boolean
  /** 범례 표시 여부 */
  showLegend?: boolean
  /** X축 라벨 표시 여부 */
  showXAxis?: boolean
  /** Y축 라벨 표시 여부 */
  showYAxis?: boolean
  /** 툴팁 표시 여부 */
  showTooltip?: boolean
  /** Y축 단위 */
  yAxisUnit?: string
  /** 목표선 값 */
  targetLine?: number
  /** 목표선 라벨 */
  targetLabel?: string
  /** 차트 제목 */
  title?: string
  /** 부제목 */
  subtitle?: string
  /** 기간 선택 옵션 */
  periodOptions?: { label: string; value: string }[]
  /** 선택된 기간 */
  selectedPeriod?: string
  /** 기간 변경 핸들러 */
  onPeriodChange?: (period: string) => void
  /** 영역 채우기 (area 타입용) */
  fillOpacity?: number
  /** 곡선 스타일 */
  curveType?: 'linear' | 'monotone' | 'step'
  /** 애니메이션 활성화 */
  animate?: boolean
  /** 추가 CSS 클래스 */
  className?: string
}

export interface MultiSeriesData {
  label: string
  [key: string]: string | number
}

export interface MultiSeriesTrendChartProps extends Omit<TrendChartProps, 'data'> {
  /** 다중 시리즈 데이터 */
  data: MultiSeriesData[]
  /** 시리즈 키 배열 */
  seriesKeys: string[]
  /** 시리즈 이름 매핑 */
  seriesNames?: Record<string, string>
}

// ============================================
// 상수 정의
// ============================================

const DEFAULT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

// 한국어 툴팁 포맷터
const formatTooltipValue = (value: number, unit?: string): string => {
  if (unit === '원' || unit === '만원') {
    return `${value.toLocaleString()}${unit}`
  }
  return unit ? `${value.toLocaleString()}${unit}` : value.toLocaleString()
}

// ============================================
// 커스텀 툴팁 컴포넌트
// ============================================

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    dataKey: string
  }>
  label?: string
  unit?: string
}

const CustomTooltip = memo(function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-gray-900">
            {formatTooltipValue(entry.value, unit)}
          </span>
        </div>
      ))}
    </div>
  )
})

// ============================================
// 메인 추이 차트 컴포넌트
// ============================================

const TrendChart = memo(function TrendChart({
  data,
  type = 'line',
  height = 240,
  color = '#6366f1',
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  showTooltip = true,
  yAxisUnit,
  targetLine,
  targetLabel,
  title,
  subtitle,
  periodOptions,
  selectedPeriod,
  onPeriodChange,
  fillOpacity = 0.2,
  curveType = 'monotone',
  animate = true,
  className = '',
}: TrendChartProps) {
  // 차트 데이터 변환
  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: item.label,
      value: item.value,
      date: item.date,
    }))
  }, [data])

  // 공통 축 컴포넌트
  const axisComponents = useMemo(() => ({
    xAxis: showXAxis ? (
      <XAxis
        dataKey="name"
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: '#9ca3af' }}
        dy={8}
      />
    ) : null,
    yAxis: showYAxis ? (
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: '#9ca3af' }}
        width={40}
        tickFormatter={(value) => (yAxisUnit ? `${value}${yAxisUnit}` : value)}
      />
    ) : null,
    grid: showGrid ? (
      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
    ) : null,
    tooltip: showTooltip ? (
      <Tooltip content={<CustomTooltip unit={yAxisUnit} />} />
    ) : null,
    targetLine: targetLine ? (
      <ReferenceLine
        y={targetLine}
        stroke="#ef4444"
        strokeDasharray="5 5"
        label={{
          value: targetLabel || '목표',
          position: 'right',
          fill: '#ef4444',
          fontSize: 12,
        }}
      />
    ) : null,
  }), [showXAxis, showYAxis, showGrid, showTooltip, yAxisUnit, targetLine, targetLabel])

  // 차트 렌더링
  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {axisComponents.grid}
            {axisComponents.xAxis}
            {axisComponents.yAxis}
            {axisComponents.tooltip}
            {axisComponents.targetLine}
            <Area
              type={curveType}
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#colorValue)"
              isAnimationActive={animate}
              animationDuration={800}
            />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart data={chartData}>
            {axisComponents.grid}
            {axisComponents.xAxis}
            {axisComponents.yAxis}
            {axisComponents.tooltip}
            {axisComponents.targetLine}
            <Bar
              dataKey="value"
              fill={color}
              radius={[4, 4, 0, 0]}
              isAnimationActive={animate}
              animationDuration={800}
            />
          </BarChart>
        )

      case 'line':
      default:
        return (
          <LineChart data={chartData}>
            {axisComponents.grid}
            {axisComponents.xAxis}
            {axisComponents.yAxis}
            {axisComponents.tooltip}
            {axisComponents.targetLine}
            <Line
              type={curveType}
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: color }}
              isAnimationActive={animate}
              animationDuration={800}
            />
          </LineChart>
        )
    }
  }

  return (
    <div className={`bg-white rounded-2xl p-5 ${className}`}>
      {/* 헤더 */}
      {(title || periodOptions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="font-bold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {periodOptions && onPeriodChange && (
            <div className="flex gap-1">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onPeriodChange(option.value)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedPeriod === option.value
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
})

export default TrendChart

// ============================================
// 다중 시리즈 추이 차트
// ============================================

export const MultiSeriesTrendChart = memo(function MultiSeriesTrendChart({
  data,
  seriesKeys,
  seriesNames = {},
  type = 'line',
  height = 240,
  colors = DEFAULT_COLORS,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  showTooltip = true,
  showLegend = true,
  yAxisUnit,
  curveType = 'monotone',
  animate = true,
  title,
  subtitle,
  className = '',
}: MultiSeriesTrendChartProps) {
  // 시리즈 색상 매핑
  const seriesColors = useMemo(() => {
    return seriesKeys.reduce((acc, key, index) => {
      acc[key] = colors[index % colors.length]
      return acc
    }, {} as Record<string, string>)
  }, [seriesKeys, colors])

  // 커스텀 범례 포맷터
  const legendFormatter = (value: string) => {
    return seriesNames[value] || value
  }

  const renderChart = () => {
    const chartProps = {
      data,
      children: [
        showGrid && (
          <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        ),
        showXAxis && (
          <XAxis
            key="xaxis"
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
          />
        ),
        showYAxis && (
          <YAxis
            key="yaxis"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            width={40}
            tickFormatter={(value) => (yAxisUnit ? `${value}${yAxisUnit}` : value)}
          />
        ),
        showTooltip && <Tooltip key="tooltip" content={<CustomTooltip unit={yAxisUnit} />} />,
        showLegend && (
          <Legend
            key="legend"
            formatter={legendFormatter}
            wrapperStyle={{ paddingTop: '16px' }}
          />
        ),
      ].filter(Boolean),
    }

    switch (type) {
      case 'area':
        return (
          <AreaChart {...chartProps}>
            <defs>
              {seriesKeys.map((key) => (
                <linearGradient key={`gradient-${key}`} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={seriesColors[key]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={seriesColors[key]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            {chartProps.children}
            {seriesKeys.map((key) => (
              <Area
                key={key}
                type={curveType}
                dataKey={key}
                name={seriesNames[key] || key}
                stroke={seriesColors[key]}
                strokeWidth={2}
                fill={`url(#gradient-${key})`}
                isAnimationActive={animate}
              />
            ))}
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart {...chartProps}>
            {chartProps.children}
            {seriesKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                name={seriesNames[key] || key}
                fill={seriesColors[key]}
                radius={[4, 4, 0, 0]}
                isAnimationActive={animate}
              />
            ))}
          </BarChart>
        )

      case 'composed':
        return (
          <ComposedChart {...chartProps}>
            {chartProps.children}
            {seriesKeys.map((key, index) => {
              // 첫 번째는 막대, 나머지는 라인
              if (index === 0) {
                return (
                  <Bar
                    key={key}
                    dataKey={key}
                    name={seriesNames[key] || key}
                    fill={seriesColors[key]}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={animate}
                  />
                )
              }
              return (
                <Line
                  key={key}
                  type={curveType}
                  dataKey={key}
                  name={seriesNames[key] || key}
                  stroke={seriesColors[key]}
                  strokeWidth={2}
                  dot={{ fill: seriesColors[key], strokeWidth: 0, r: 3 }}
                  isAnimationActive={animate}
                />
              )
            })}
          </ComposedChart>
        )

      case 'line':
      default:
        return (
          <LineChart {...chartProps}>
            {chartProps.children}
            {seriesKeys.map((key) => (
              <Line
                key={key}
                type={curveType}
                dataKey={key}
                name={seriesNames[key] || key}
                stroke={seriesColors[key]}
                strokeWidth={2}
                dot={{ fill: seriesColors[key], strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: seriesColors[key] }}
                isAnimationActive={animate}
              />
            ))}
          </LineChart>
        )
    }
  }

  return (
    <div className={`bg-white rounded-2xl p-5 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="font-bold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
})

// ============================================
// 비교 차트 (현재 vs 이전 기간)
// ============================================

export interface ComparisonChartProps {
  currentData: TimeSeriesDataPoint[]
  previousData: TimeSeriesDataPoint[]
  currentLabel?: string
  previousLabel?: string
  height?: number
  title?: string
  subtitle?: string
  yAxisUnit?: string
  className?: string
}

export const ComparisonTrendChart = memo(function ComparisonTrendChart({
  currentData,
  previousData,
  currentLabel = '이번 기간',
  previousLabel = '이전 기간',
  height = 240,
  title,
  subtitle,
  yAxisUnit,
  className = '',
}: ComparisonChartProps) {
  // 데이터 병합
  const mergedData = useMemo(() => {
    return currentData.map((item, index) => ({
      label: item.label,
      current: item.value,
      previous: previousData[index]?.value ?? 0,
    }))
  }, [currentData, previousData])

  return (
    <div className={`bg-white rounded-2xl p-5 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="font-bold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={mergedData}>
          <defs>
            <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            width={40}
            tickFormatter={(value) => (yAxisUnit ? `${value}${yAxisUnit}` : value)}
          />
          <Tooltip content={<CustomTooltip unit={yAxisUnit} />} />
          <Legend wrapperStyle={{ paddingTop: '16px' }} />
          <Area
            type="monotone"
            dataKey="previous"
            name={previousLabel}
            stroke="#9ca3af"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            fill="url(#previousGradient)"
          />
          <Area
            type="monotone"
            dataKey="current"
            name={currentLabel}
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#currentGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})
