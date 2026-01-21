'use client'

/**
 * 슈퍼 어드민용 통계 차트 컴포넌트
 *
 * 매출 추이, 학원 가입 추이, 구독 현황 등을 시각화합니다.
 * recharts를 dynamic import로 lazy load하여 성능을 최적화합니다.
 */

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// ============================================
// 차트 로딩 컴포넌트
// ============================================
function ChartLoadingFallback({ height = 300 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-gray-50 rounded-xl"
      style={{ height }}
    >
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <p className="text-sm text-gray-400">차트 로딩 중...</p>
      </div>
    </div>
  )
}

// ============================================
// Dynamic Imports (Lazy Load)
// ============================================

// 라인 차트 (매출 추이)
const DynamicLineChart = dynamic(
  () => import('recharts').then((mod) => {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = mod

    return function RevenueLineChart({
      data,
      height = 300,
      lines,
    }: RevenueChartProps) {
      if (!data || data.length === 0) {
        return (
          <div className="flex items-center justify-center bg-gray-50 rounded-xl" style={{ height }}>
            <p className="text-gray-400 text-sm">데이터가 없습니다</p>
          </div>
        )
      }

      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => formatKoreanCurrency(value)}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: '#374151', fontWeight: 500 }}
              formatter={(value, name) => [
                formatKoreanCurrency(Number(value) || 0),
                String(name),
              ]}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              iconSize={8}
            />
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
                dataKey="revenue"
                name="매출"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )
    }
  }),
  {
    loading: () => <ChartLoadingFallback />,
    ssr: false,
  }
)

// 바 차트 (학원 가입 추이)
const DynamicBarChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } = mod

    return function AcademyBarChart({
      data,
      height = 300,
      bars,
      showLegend = false,
    }: AcademyChartProps) {
      if (!data || data.length === 0) {
        return (
          <div className="flex items-center justify-center bg-gray-50 rounded-xl" style={{ height }}>
            <p className="text-gray-400 text-sm">데이터가 없습니다</p>
          </div>
        )
      }

      const DEFAULT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: '#374151', fontWeight: 500 }}
              formatter={(value, name) => [
                `${(Number(value) || 0).toLocaleString()}개`,
                String(name),
              ]}
            />
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="square"
                iconSize={10}
              />
            )}
            {bars ? (
              bars.map((bar) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  fill={bar.color}
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              ))
            ) : (
              <Bar dataKey="count" name="신규 가입" radius={[4, 4, 0, 0]} barSize={40}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      )
    }
  }),
  {
    loading: () => <ChartLoadingFallback />,
    ssr: false,
  }
)

// 파이 차트 (구독 현황)
const DynamicPieChart = dynamic(
  () => import('recharts').then((mod) => {
    const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } = mod

    return function SubscriptionPieChart({
      data,
      height = 300,
      innerRadius = 60,
      outerRadius = 100,
      showLegend = true,
    }: SubscriptionChartProps) {
      if (!data || data.length === 0) {
        return (
          <div className="flex items-center justify-center bg-gray-50 rounded-xl" style={{ height }}>
            <p className="text-gray-400 text-sm">데이터가 없습니다</p>
          </div>
        )
      }

      const total = data.reduce((sum, item) => sum + item.value, 0)

      const COLORS = {
        enterprise: '#8b5cf6',
        pro: '#6366f1',
        basic: '#10b981',
        free: '#f59e0b',
      }

      const renderCustomizedLabel = (props: {
        cx?: number
        cy?: number
        midAngle?: number
        innerRadius?: number
        outerRadius?: number
        percent?: number
      }) => {
        const cx = Number(props.cx) || 0
        const cy = Number(props.cy) || 0
        const midAngle = Number(props.midAngle) || 0
        const innerRadiusVal = Number(props.innerRadius) || 0
        const outerRadiusVal = Number(props.outerRadius) || 0
        const percent = Number(props.percent) || 0

        const RADIAN = Math.PI / 180
        const radius = innerRadiusVal + (outerRadiusVal - innerRadiusVal) * 0.5
        const x = cx + radius * Math.cos(-midAngle * RADIAN)
        const y = cy + radius * Math.sin(-midAngle * RADIAN)

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

      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || COLORS[entry.plan as keyof typeof COLORS] || '#9ca3af'}
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
                const numValue = Number(value) || 0
                return [
                  `${numValue.toLocaleString()}개 (${((numValue / total) * 100).toFixed(1)}%)`,
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
                  <span style={{ color: '#374151', fontSize: '14px' }}>{value}</span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      )
    }
  }),
  {
    loading: () => <ChartLoadingFallback />,
    ssr: false,
  }
)

// ============================================
// 타입 정의
// ============================================
interface RevenueDataPoint {
  month: string
  revenue: number
  [key: string]: string | number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
  height?: number
  lines?: {
    dataKey: string
    name: string
    color: string
  }[]
}

interface AcademyDataPoint {
  month: string
  count: number
  [key: string]: string | number
}

interface AcademyChartProps {
  data: AcademyDataPoint[]
  height?: number
  bars?: {
    dataKey: string
    name: string
    color: string
  }[]
  showLegend?: boolean
}

interface SubscriptionDataPoint {
  name: string
  plan: string
  value: number
  color?: string
  [key: string]: string | number | undefined
}

interface SubscriptionChartProps {
  data: SubscriptionDataPoint[]
  height?: number
  innerRadius?: number
  outerRadius?: number
  showLegend?: boolean
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 한국어 화폐 포맷
 */
function formatKoreanCurrency(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`
  }
  if (value >= 10000) {
    return `${Math.floor(value / 10000).toLocaleString()}만`
  }
  return `${value.toLocaleString()}원`
}

// ============================================
// UI 텍스트 상수
// ============================================
const UI_TEXT = {
  revenueChartTitle: '매출 추이',
  revenueChartSubtitle: '월별 매출 현황',
  academyChartTitle: '학원 가입 추이',
  academyChartSubtitle: '월별 신규 가입 학원 수',
  subscriptionChartTitle: '구독 현황',
  subscriptionChartSubtitle: '요금제별 구독 분포',
  noData: '데이터가 없습니다',
}

// ============================================
// 메인 컴포넌트들
// ============================================

/**
 * 매출 추이 차트 (라인 차트)
 */
export function RevenueChart({
  data,
  height = 300,
  title = UI_TEXT.revenueChartTitle,
  subtitle = UI_TEXT.revenueChartSubtitle,
  lines,
}: {
  data: RevenueDataPoint[]
  height?: number
  title?: string
  subtitle?: string
  lines?: RevenueChartProps['lines']
}) {
  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <DynamicLineChart data={data} height={height} lines={lines} />
    </div>
  )
}

/**
 * 학원 가입 추이 차트 (바 차트)
 */
export function AcademySignupChart({
  data,
  height = 300,
  title = UI_TEXT.academyChartTitle,
  subtitle = UI_TEXT.academyChartSubtitle,
  bars,
  showLegend = false,
}: {
  data: AcademyDataPoint[]
  height?: number
  title?: string
  subtitle?: string
  bars?: AcademyChartProps['bars']
  showLegend?: boolean
}) {
  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <DynamicBarChart data={data} height={height} bars={bars} showLegend={showLegend} />
    </div>
  )
}

/**
 * 구독 현황 차트 (파이 차트)
 */
export function SubscriptionChart({
  data,
  height = 300,
  title = UI_TEXT.subscriptionChartTitle,
  subtitle = UI_TEXT.subscriptionChartSubtitle,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true,
}: {
  data: SubscriptionDataPoint[]
  height?: number
  title?: string
  subtitle?: string
  innerRadius?: number
  outerRadius?: number
  showLegend?: boolean
}) {
  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <DynamicPieChart
        data={data}
        height={height}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        showLegend={showLegend}
      />
    </div>
  )
}

/**
 * 전체 어드민 차트 대시보드
 * 모든 차트를 한 번에 렌더링합니다.
 */
export function AdminChartsDashboard({
  revenueData,
  academyData,
  subscriptionData,
}: {
  revenueData: RevenueDataPoint[]
  academyData: AcademyDataPoint[]
  subscriptionData: SubscriptionDataPoint[]
}) {
  return (
    <div className="space-y-6">
      {/* 매출 추이 차트 */}
      <RevenueChart data={revenueData} height={280} />

      {/* 학원 가입 & 구독 현황 (2열) */}
      <div className="grid grid-cols-2 gap-6">
        <AcademySignupChart data={academyData} height={280} />
        <SubscriptionChart data={subscriptionData} height={280} />
      </div>
    </div>
  )
}

// ============================================
// 기본 내보내기
// ============================================
export default AdminChartsDashboard

// ============================================
// Mock 데이터 (개발/테스트용)
// ============================================
export const MOCK_REVENUE_DATA: RevenueDataPoint[] = [
  { month: '7월', revenue: 32000000 },
  { month: '8월', revenue: 35000000 },
  { month: '9월', revenue: 38000000 },
  { month: '10월', revenue: 42000000 },
  { month: '11월', revenue: 41000000 },
  { month: '12월', revenue: 45600000 },
]

export const MOCK_ACADEMY_DATA: AcademyDataPoint[] = [
  { month: '7월', count: 12 },
  { month: '8월', count: 18 },
  { month: '9월', count: 15 },
  { month: '10월', count: 22 },
  { month: '11월', count: 19 },
  { month: '12월', count: 25 },
]

export const MOCK_SUBSCRIPTION_DATA: SubscriptionDataPoint[] = [
  { name: 'Enterprise', plan: 'enterprise', value: 12, color: '#8b5cf6' },
  { name: 'Pro', plan: 'pro', value: 58, color: '#6366f1' },
  { name: 'Basic', plan: 'basic', value: 45, color: '#10b981' },
  { name: 'Free', plan: 'free', value: 41, color: '#f59e0b' },
]
