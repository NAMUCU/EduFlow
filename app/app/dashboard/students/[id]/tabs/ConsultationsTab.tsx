'use client';

import { memo } from 'react';
import { StudentDetail } from '@/types/student';
import { MessageSquare, Calendar, User } from 'lucide-react';

interface ConsultationsTabProps {
  student: StudentDetail;
}

export const ConsultationsTab = memo(function ConsultationsTab({ student }: ConsultationsTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4">상담 기록</h3>

      {student.consultations && student.consultations.length > 0 ? (
        <div className="space-y-4">
          {student.consultations.map((consultation, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-500" />
                  <span className="font-medium text-gray-900">{consultation.topic}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  consultation.status === 'completed' ? 'bg-green-100 text-green-700' :
                  consultation.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {consultation.status === 'completed' ? '완료' :
                   consultation.status === 'scheduled' ? '예정' : '취소'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{consultation.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{consultation.counselor}</span>
                </div>
              </div>

              {consultation.notes && (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {consultation.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">상담 기록이 없습니다</p>
      )}
    </div>
  );
});
