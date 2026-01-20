'use client';

import { memo } from 'react';
import { StudentDetail } from '@/types/student';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface AssignmentsTabProps {
  student: StudentDetail;
}

export const AssignmentsTab = memo(function AssignmentsTab({ student }: AssignmentsTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4">과제 현황</h3>

      {student.assignments && student.assignments.length > 0 ? (
        <div className="space-y-3">
          {student.assignments.map((assignment, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {assignment.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : assignment.status === 'in_progress' ? (
                  <Clock className="w-5 h-5 text-blue-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{assignment.title}</p>
                  <p className="text-sm text-gray-500">{assignment.subject}</p>
                </div>
              </div>
              <div className="text-right">
                {assignment.score !== undefined ? (
                  <p className="font-medium text-gray-900">{assignment.score}점</p>
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                    assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {assignment.status === 'completed' ? '완료' :
                     assignment.status === 'in_progress' ? '진행중' : '미제출'}
                  </span>
                )}
                <p className="text-xs text-gray-500 mt-1">마감: {assignment.dueDate}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">과제 데이터가 없습니다</p>
      )}
    </div>
  );
});
