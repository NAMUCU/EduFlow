'use client'

/**
 * 막대 차트 컴포넌트
 *
 * 카테고리별 데이터를 비교하는 막대 차트입니다.
 * 성적 분포, 과목별 통계, 일별 학습량 등에 사용됩니다.
 */

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'

// Props 타입 정의
interface BarChartProps {
  data: {
    label: string
    value: number
    color?: string
    [key: string]: string | number | undefined
  }[]
  xAxisKey?: string
  yAxisKey?: string
  color?: string
  height?: number
  showGrid?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  layout?: 'vertical' | 'horizontal'
  barSize?: number
  title?: string
  // 다중 막대 차트용
  bars?: {
    dataKey: string
    color: string
    name: string
  }[]
}

// 기본 색상 팔레트
const DEFAULT_COLORS = [
  '#6366f1', // indigo-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
]

// 한국어 툴팁 포맷터
function formatTooltipValue(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}만`
  }
  return value.toLocaleString()
}

export default function BarChart({
  data,
  xAxisKey = 'label',
  yAxisKey = 'value',
  color,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  layout = 'vertical',
  barSize = 40,
  title,
  bars,
}: BarChartProps) {
  // 데이터가 없는 경우
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-xl"
        style={{ height }}
      >
        <p className="text-gray-400 text-sm">데이터가 없습니다</p>
      </div>
    )
  }

  // 수평 레이아웃인 경우 (기존 vertical 차트 유지)
  if (layout === 'horizontal') {
    return (
      <div className="w-full">
        {title && (
          <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
        )}
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                horizontal={false}
              />
            )}
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => formatTooltipValue(value)}
            />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              width={70}
            />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelStyle={{ color: '#374151', fontWeight: 500 }}
                formatter={(value) => [formatTooltipValue(value as number), '']}
              />
            )}
            <Bar
              dataKey={yAxisKey}
              fill={color || DEFAULT_COLORS[0]}
              radius={[0, 4, 4, 0]}
              barSize={barSize}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 수직 막대 차트 (기본)
  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
          )}
          <XAxis
            dataKey={xAxisKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(value) => formatTooltipValue(value)}
            dx={-10}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: '#374151', fontWeight: 500 }}
              formatter={(value) => [formatTooltipValue(value as number), '']}
            />
          )}
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
              iconSize={10}
            />
          )}

          {/* 다중 막대 또는 단일 막대 */}
          {bars ? (
            bars.map((bar) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name}
                fill={bar.color}
                radius={[4, 4, 0, 0]}
                barSize={barSize}
              />
            ))
          ) : (
            <Bar
              dataKey={yAxisKey}
              radius={[4, 4, 0, 0]}
              barSize={barSize}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                />
              ))}
            </Bar>
          )}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
