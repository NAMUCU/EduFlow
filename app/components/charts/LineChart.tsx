'use client'

/**
 * 라인 차트 컴포넌트
 *
 * 시계열 데이터의 추이를 표시하는 라인 차트입니다.
 * 성적 변화, 문제 생성 추이 등에 사용됩니다.
 */

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// Props 타입 정의
interface LineChartProps {
  data: {
    label: string
    value: number
    [key: string]: string | number
  }[]
  xAxisKey?: string
  yAxisKey?: string
  color?: string
  height?: number
  showGrid?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  title?: string
  // 다중 라인 차트용
  lines?: {
    dataKey: string
    color: string
    name: string
  }[]
}

// 기본 색상
const DEFAULT_COLOR = '#6366f1' // indigo-500

// 한국어 툴팁 포맷터
function formatTooltipValue(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}만`
  }
  return value.toLocaleString()
}

export default function LineChart({
  data,
  xAxisKey = 'label',
  yAxisKey = 'value',
  color = DEFAULT_COLOR,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  title,
  lines,
}: LineChartProps) {
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

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
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
              iconType="circle"
              iconSize={8}
            />
          )}

          {/* 다중 라인 또는 단일 라인 */}
          {lines ? (
            lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                dot={{ fill: line.color, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey={yAxisKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          )}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
