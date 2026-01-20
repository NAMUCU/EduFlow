'use client';

import { memo } from 'react';

interface StatisticsChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
}

export const StatisticsChart = memo(function StatisticsChart({ data }: StatisticsChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-sm text-gray-500">데이터 없음</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 진행 바 */}
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          if (percentage === 0) return null;

          return (
            <div
              key={index}
              className="h-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: item.color,
              }}
              title={`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-4 justify-center">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">
              {item.label}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
