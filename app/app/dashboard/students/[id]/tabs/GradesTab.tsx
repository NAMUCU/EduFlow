'use client';

import { memo } from 'react';
import { StudentDetail } from '@/types/student';

interface GradesTabProps {
  student: StudentDetail;
}

export const GradesTab = memo(function GradesTab({ student }: GradesTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4">성적 현황</h3>

      {student.grades && student.grades.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">시험명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">과목</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">점수</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">등급</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">날짜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {student.grades.map((grade, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{grade.examName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{grade.subject}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{grade.score}점</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      grade.rank <= 3 ? 'bg-green-100 text-green-700' :
                      grade.rank <= 5 ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {grade.rank}등급
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{grade.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">성적 데이터가 없습니다</p>
      )}
    </div>
  );
});
