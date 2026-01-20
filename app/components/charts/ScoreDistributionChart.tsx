'use client';

/**
 * 점수 분포 차트 컴포넌트
 *
 * 시험 결과의 점수 분포를 막대 차트로 시각화합니다.
 * bundle-dynamic-imports 패턴을 위해 별도 파일로 분리되어
 * 필요할 때만 lazy load됩니다.
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ExamListItem } from '@/types/exam';

interface ScoreDistributionChartProps {
  exams: ExamListItem[];
  height?: number;
}

// 점수 구간별 색상
const SCORE_COLORS: Record<string, string> = {
  '90-100': '#22c55e', // green-500
  '80-89': '#3b82f6',  // blue-500
  '70-79': '#eab308',  // yellow-500
  '60-69': '#f97316',  // orange-500
  '0-59': '#ef4444',   // red-500
};

export default function ScoreDistributionChart({
  exams,
  height = 200,
}: ScoreDistributionChartProps) {
  // 점수 분포 계산
  const distributionData = useMemo(() => {
    const ranges = [
      { label: '90-100', min: 90, max: 100, count: 0 },
      { label: '80-89', min: 80, max: 89, count: 0 },
      { label: '70-79', min: 70, max: 79, count: 0 },
      { label: '60-69', min: 60, max: 69, count: 0 },
      { label: '0-59', min: 0, max: 59, count: 0 },
    ];

    exams.forEach((exam) => {
      if (exam.average_score !== null) {
        const score = exam.average_score;
        const range = ranges.find((r) => score >= r.min && score <= r.max);
        if (range) {
          range.count++;
        }
      }
    });

    return ranges.map((r) => ({
      label: r.label,
      value: r.count,
      color: SCORE_COLORS[r.label],
    }));
  }, [exams]);

  // 데이터가 없는 경우
  if (distributionData.every((d) => d.value === 0)) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-xl"
        style={{ height }}
      >
        <p className="text-gray-400 text-sm">점수 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={distributionData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
          <XAxis
            dataKey="label"
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
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ color: '#374151', fontWeight: 500 }}
            formatter={(value) => [`${value}개 시험`, '시험 수']}
            labelFormatter={(label) => `${label}점`}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            barSize={40}
          >
            {distributionData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="flex justify-center gap-4 mt-4">
        {Object.entries(SCORE_COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-500">{label}점</span>
          </div>
        ))}
      </div>
    </div>
  );
}
