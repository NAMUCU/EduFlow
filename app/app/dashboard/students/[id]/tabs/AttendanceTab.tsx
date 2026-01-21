'use client';

import { memo } from 'react';
import { AttendanceStats } from '@/types/student';
import { Attendance } from '@/types/database';
import { Check, X, Clock } from 'lucide-react';

interface AttendanceTabProps {
  attendanceStats: AttendanceStats;
  recentAttendance: Attendance[];
  attendanceRate: number;
}

export const AttendanceTab = memo(function AttendanceTab({ attendanceStats, recentAttendance, attendanceRate }: AttendanceTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4">출결 현황</h3>

      {/* 출결 요약 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-xl">
          <p className="text-2xl font-bold text-green-600">{attendanceStats?.present || 0}</p>
          <p className="text-sm text-green-600">출석</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-xl">
          <p className="text-2xl font-bold text-red-600">{attendanceStats?.absent || 0}</p>
          <p className="text-sm text-red-600">결석</p>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-xl">
          <p className="text-2xl font-bold text-yellow-600">{attendanceStats?.late || 0}</p>
          <p className="text-sm text-yellow-600">지각</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <p className="text-2xl font-bold text-blue-600">{attendanceRate}%</p>
          <p className="text-sm text-blue-600">출석률</p>
        </div>
      </div>

      {/* 최근 출결 기록 */}
      {recentAttendance && recentAttendance.length > 0 ? (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700 mb-3">최근 출결 기록</h4>
          {recentAttendance.map((record, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{record.date}</span>
              <div className="flex items-center gap-2">
                {record.status === 'present' && (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">출석</span>
                  </>
                )}
                {record.status === 'absent' && (
                  <>
                    <X className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">결석</span>
                  </>
                )}
                {record.status === 'late' && (
                  <>
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">지각</span>
                  </>
                )}
                {record.status === 'early_leave' && (
                  <>
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-orange-600">조퇴</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">출결 기록이 없습니다</p>
      )}
    </div>
  );
});
