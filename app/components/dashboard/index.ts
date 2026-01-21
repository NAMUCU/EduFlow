/**
 * 대시보드 컴포넌트 모음
 *
 * 대시보드에서 사용되는 모든 통계 및 차트 컴포넌트를 export합니다.
 */

// 통계 카드 컴포넌트
export {
  default as StatsCard,
  CompactStatsCard,
  LargeStatsCard,
  ColorfulStatsCard,
  GoalStatsCard,
} from './StatsCard'

// 추이 차트 컴포넌트
export {
  default as TrendChart,
  MultiSeriesTrendChart,
  ComparisonTrendChart,
} from './TrendChart'

// 타입 재export
export type {
  TrendChartProps,
  MultiSeriesTrendChartProps,
  ComparisonChartProps,
} from './TrendChart'
