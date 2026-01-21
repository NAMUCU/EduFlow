'use client';

import { memo } from 'react';
import { StudentDetail } from '@/types/student';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GradesTabProps {
  student: StudentDetail;
}

export const GradesTab = memo(function GradesTab({ student }: GradesTabProps) {
  // 점수를 기반으로 등급 계산
  const getGradeRank = (score: number, maxScore: number): number => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 1;
    if (percentage >= 80) return 2;
    if (percentage >= 70) return 3;
    if (percentage >= 60) return 4;
    if (percentage >= 50) return 5;
    return 6;
  };

  return (
    <div className="space-y-6">
      {/* 과목별 성적 요약 */}
      {student.grades && student.grades.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">과목별 성적 요약</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {student.grades.map((grade, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{grade.subject}</span>
                  {grade.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                  {grade.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                  {grade.trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
                </div>
                <p className="text-2xl font-bold text-primary-600">{grade.averageScore}점</p>
                <p className="text-xs text-gray-500">총 {grade.totalTests}회 시험</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 성적 기록 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">최근 성적 기록</h3>

        {student.recentGrades && student.recentGrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">시험 유형</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">과목</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">점수</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">등급</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">날짜</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {student.recentGrades.map((grade, index) => {
                  const rank = getGradeRank(grade.score, grade.max_score);
                  return (
                    <tr key={grade.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{grade.exam_type || '일반'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{grade.subject}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {grade.score}/{grade.max_score}점
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rank <= 2 ? 'bg-green-100 text-green-700' :
                          rank <= 4 ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {rank}등급
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(grade.date).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">성적 데이터가 없습니다</p>
        )}
      </div>
    </div>
  );
});
