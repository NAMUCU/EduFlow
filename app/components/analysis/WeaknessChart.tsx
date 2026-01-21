'use client';

/**
 * 취약점 분석 차트 컴포넌트
 *
 * - 단원별 취약점 레이더 차트
 * - 시간별 추이 그래프 (라인 차트)
 */

import { memo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// ============================================
// 타입 정의
// ============================================

/** 단원별 점수 데이터 */
export interface UnitScore {
  unit: string;        // 단원명
  score: number;       // 점수 (0-100)
  fullMark?: number;   // 만점 (기본 100)
}

/** 시간별 점수 추이 데이터 */
export interface ScoreTrend {
  date: string;        // 날짜 (예: '1월', '2월' 또는 '2024-01-01')
  score: number;       // 점수
  average?: number;    // 학원 평균 (선택)
}

// ============================================
// 색상 설정
// ============================================

const CHART_COLORS = {
  primary: '#6366f1',      // 인디고
  primaryLight: 'rgba(99, 102, 241, 0.3)',
  secondary: '#10b981',    // 초록
  warning: '#f59e0b',      // 주황
  danger: '#ef4444',       // 빨강
  gray: '#9ca3af',
};

// ============================================
// WeaknessRadarChart 컴포넌트
// ============================================

interface WeaknessRadarChartProps {
  data: UnitScore[];
  title?: string;
}

export const WeaknessRadarChart = memo(function WeaknessRadarChart({
  data,
  title = '단원별 정답률'
}: WeaknessRadarChartProps) {
  // 데이터가 없는 경우
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          분석할 데이터가 없습니다
        </div>
      </div>
    );
  }

  // fullMark가 없으면 100으로 설정
  const chartData = data.map(item => ({
    ...item,
    fullMark: item.fullMark || 100,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="unit"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickCount={5}
            />
            <Radar
              name="정답률"
              dataKey="score"
              stroke={CHART_COLORS.primary}
              fill={CHART_COLORS.primaryLight}
              fillOpacity={0.6}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, '정답률']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 취약 단원 하이라이트 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {chartData
            .filter(item => item.score < 60)
            .sort((a, b) => a.score - b.score)
            .slice(0, 3)
            .map((item, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-50 text-red-600 text-sm rounded-full"
              >
                {item.unit}: {item.score}%
              </span>
            ))}
        </div>
      </div>
    </div>
  );
});

// ============================================
// WeaknessTrendChart 컴포넌트
// ============================================

interface WeaknessTrendChartProps {
  data: ScoreTrend[];
  title?: string;
  showAverage?: boolean;
}

export const WeaknessTrendChart = memo(function WeaknessTrendChart({
  data,
  title = '점수 변화 추이',
  showAverage = true,
}: WeaknessTrendChartProps) {
  // 데이터가 없는 경우
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          추이 데이터가 없습니다
        </div>
      </div>
    );
  }

  // 추이 계산 (최근 점수 - 첫 점수)
  const firstScore = data[0]?.score || 0;
  const lastScore = data[data.length - 1]?.score || 0;
  const trend = lastScore - firstScore;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}점
          </span>
          <span className="text-xs text-gray-500">변화</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              formatter={(value, name) => [
                `${value}점`,
                name === 'score' ? '내 점수' : '학원 평균'
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: '#374151', fontWeight: 500 }}
            />
            <Legend
              formatter={(value) => value === 'score' ? '내 점수' : '학원 평균'}
            />
            <Line
              type="monotone"
              dataKey="score"
              name="score"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.primary, r: 4 }}
              activeDot={{ r: 6, fill: CHART_COLORS.primary }}
            />
            {showAverage && data.some(d => d.average !== undefined) && (
              <Line
                type="monotone"
                dataKey="average"
                name="average"
                stroke={CHART_COLORS.gray}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: CHART_COLORS.gray, r: 3 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// ============================================
// WeaknessChart 컴포넌트 (통합)
// ============================================

interface WeaknessChartProps {
  radarData?: UnitScore[];
  trendData?: ScoreTrend[];
  radarTitle?: string;
  trendTitle?: string;
  showAverage?: boolean;
}

export const WeaknessChart = memo(function WeaknessChart({
  radarData,
  trendData,
  radarTitle,
  trendTitle,
  showAverage = true,
}: WeaknessChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <WeaknessRadarChart data={radarData || []} title={radarTitle} />
      <WeaknessTrendChart
        data={trendData || []}
        title={trendTitle}
        showAverage={showAverage}
      />
    </div>
  );
});

export default WeaknessChart;
