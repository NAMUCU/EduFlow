'use client';

import { memo } from 'react';
import { StudentDetail } from '@/types/student';
import { TrendIcon, StatCard } from '../page';
import { BookOpen, Target, Clock, TrendingUp } from 'lucide-react';

interface OverviewTabProps {
  student: StudentDetail;
}

export const OverviewTab = memo(function OverviewTab({ student }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* 성적 요약 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="평균 점수"
          value={`${student.stats.averageScore}점`}
          subtitle={<div className="flex items-center gap-1"><TrendIcon trend={student.stats.trend} /> 지난달 대비</div>}
          icon={<Target className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="완료 과제"
          value={`${student.stats.completedAssignments}개`}
          subtitle={`총 ${student.stats.totalAssignments}개 중`}
          icon={<BookOpen className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="출석률"
          value={`${student.stats.attendanceRate}%`}
          icon={<Clock className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="학습 시간"
          value={`${student.stats.studyHours || 0}시간`}
          subtitle="이번 주"
          icon={<TrendingUp className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">최근 활동</h3>
        {student.recentActivities && student.recentActivities.length > 0 ? (
          <div className="space-y-3">
            {student.recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">최근 활동이 없습니다</p>
        )}
      </div>

      {/* 취약 단원 */}
      {student.weakUnits && student.weakUnits.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">취약 단원</h3>
          <div className="space-y-2">
            {student.weakUnits.map((unit, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-900">{unit.name}</span>
                <span className="text-sm font-medium text-red-600">{unit.accuracy}% 정답률</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
