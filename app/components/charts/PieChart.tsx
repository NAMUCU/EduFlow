'use client'

/**
 * 원형 차트 컴포넌트
 *
 * 비율 데이터를 시각화하는 원형(도넛) 차트입니다.
 * 과목별 분포, 요금제 비율, 사용자 역할별 분포 등에 사용됩니다.
 */

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieLabelRenderProps,
} from 'recharts'

// Props 타입 정의
interface PieChartProps {
  data: {
    name: string
    value: number
    color?: string
    percentage?: number
  }[]
  colors?: string[]
  height?: number
  showLabel?: boolean
  showLegend?: boolean
  innerRadius?: number
  outerRadius?: number
  title?: string
  centerText?: string
  centerSubText?: string
}

// 기본 색상 팔레트
const DEFAULT_COLORS = [
  '#6366f1', // indigo-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
]

// 라벨 렌더러
const renderCustomizedLabel = (props: PieLabelRenderProps) => {
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  } = props

  // 타입 가드: 필수 값들이 없으면 null 반환
  if (
    typeof cx !== 'number' ||
    typeof cy !== 'number' ||
    typeof midAngle !== 'number' ||
    typeof innerRadius !== 'number' ||
    typeof outerRadius !== 'number' ||
    typeof percent !== 'number'
  ) {
    return null
  }

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  // 5% 미만은 라벨 표시 안함
  if (percent < 0.05) return null

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function PieChart({
  data,
  colors = DEFAULT_COLORS,
  height = 300,
  showLabel = true,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
  title,
  centerText,
  centerSubText,
}: PieChartProps) {
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

  // 총합 계산
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabel ? renderCustomizedLabel : false}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || colors[index % colors.length]}
                strokeWidth={0}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value) => {
              const numValue = typeof value === 'number' ? value : 0
              return [
                `${numValue.toLocaleString()} (${((numValue / total) * 100).toFixed(1)}%)`,
                '',
              ]
            }}
          />
          {showLegend && (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-sm text-gray-700">{value}</span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* 중앙 텍스트 (도넛 차트용) */}
      {(centerText || centerSubText) && innerRadius > 0 && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ height }}
        >
          {centerText && (
            <p className="text-2xl font-bold text-gray-900">{centerText}</p>
          )}
          {centerSubText && (
            <p className="text-sm text-gray-500">{centerSubText}</p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 간단한 원형 차트 (범례 없음, 소형)
 */
export function SimplePieChart({
  data,
  colors = DEFAULT_COLORS,
  size = 120,
}: {
  data: { name: string; value: number; color?: string }[]
  colors?: string[]
  size?: number
}) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-full"
        style={{ width: size, height: size }}
      >
        <p className="text-gray-400 text-xs">-</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width={size} height={size}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={size * 0.3}
          outerRadius={size * 0.45}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || colors[index % colors.length]}
              strokeWidth={0}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
