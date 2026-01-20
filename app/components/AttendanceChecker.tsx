'use client';

import { useState, useEffect } from 'react';
import {
  Check,
  X,
  Clock,
  LogOut,
  Stethoscope,
  MessageSquare,
  Send,
  Users,
  ChevronDown,
} from 'lucide-react';
import {
  AttendanceStatus,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_COLORS,
} from '@/types/attendance';

// 학생 정보 타입
interface Student {
  id: string;
  name: string;
  grade?: string;
  class_name?: string;
}

// 학생별 출결 상태 타입
interface StudentAttendance {
  student_id: string;
  student_name: string;
  status: AttendanceStatus;
  check_in_time?: string;
  memo?: string;
}

// 컴포넌트 Props 타입
interface AttendanceCheckerProps {
  classId: string;
  className: string;
  date: string;
  students: Student[];
  initialAttendances?: StudentAttendance[];
  onSave?: (attendances: StudentAttendance[], sendSms: boolean) => void;
  isLoading?: boolean;
}

// 출결 상태 버튼 정보
const STATUS_OPTIONS: {
  status: AttendanceStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortLabel: string;
}[] = [
  { status: 'present', label: '출석', icon: Check, shortLabel: '출석' },
  { status: 'absent', label: '결석', icon: X, shortLabel: '결석' },
  { status: 'late', label: '지각', icon: Clock, shortLabel: '지각' },
  { status: 'early_leave', label: '조퇴', icon: LogOut, shortLabel: '조퇴' },
  { status: 'sick_leave', label: '병결', icon: Stethoscope, shortLabel: '병결' },
];

export default function AttendanceChecker({
  classId,
  className,
  date,
  students,
  initialAttendances = [],
  onSave,
  isLoading = false,
}: AttendanceCheckerProps) {
  // 학생별 출결 상태 관리
  const [attendances, setAttendances] = useState<Map<string, StudentAttendance>>(new Map());
  // 메모 입력 모달 상태
  const [memoModal, setMemoModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [memoText, setMemoText] = useState('');
  // SMS 발송 옵션
  const [sendSmsOnSave, setSendSmsOnSave] = useState(false);
  // 일괄 선택 드롭다운
  const [showBulkSelect, setShowBulkSelect] = useState(false);

  // 초기 출결 상태 설정
  useEffect(() => {
    const initialMap = new Map<string, StudentAttendance>();

    // 먼저 모든 학생을 기본 상태(출석)로 설정
    students.forEach((student) => {
      initialMap.set(student.id, {
        student_id: student.id,
        student_name: student.name,
        status: 'present',
        check_in_time: undefined,
        memo: undefined,
      });
    });

    // 기존 출결 기록이 있으면 덮어쓰기
    initialAttendances.forEach((attendance) => {
      if (initialMap.has(attendance.student_id)) {
        initialMap.set(attendance.student_id, attendance);
      }
    });

    setAttendances(initialMap);
  }, [students, initialAttendances]);

  // 출결 상태 변경
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendances((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(studentId);
      if (existing) {
        newMap.set(studentId, {
          ...existing,
          status,
          // 출석 상태가 아닌 경우에만 현재 시간 기록
          check_in_time:
            status === 'present' || status === 'late'
              ? new Date().toTimeString().slice(0, 5)
              : existing.check_in_time,
        });
      }
      return newMap;
    });
  };

  // 메모 저장
  const handleMemoSave = () => {
    if (!memoModal) return;

    setAttendances((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(memoModal.studentId);
      if (existing) {
        newMap.set(memoModal.studentId, {
          ...existing,
          memo: memoText || undefined,
        });
      }
      return newMap;
    });

    setMemoModal(null);
    setMemoText('');
  };

  // 일괄 출석 처리
  const handleBulkStatus = (status: AttendanceStatus) => {
    setAttendances((prev) => {
      const newMap = new Map(prev);
      prev.forEach((attendance, studentId) => {
        newMap.set(studentId, {
          ...attendance,
          status,
          check_in_time:
            status === 'present' || status === 'late'
              ? new Date().toTimeString().slice(0, 5)
              : attendance.check_in_time,
        });
      });
      return newMap;
    });
    setShowBulkSelect(false);
  };

  // 저장 처리
  const handleSave = () => {
    if (onSave) {
      const attendanceList = Array.from(attendances.values());
      onSave(attendanceList, sendSmsOnSave);
    }
  };

  // 출결 통계 계산
  const stats = {
    total: students.length,
    present: 0,
    absent: 0,
    late: 0,
    early_leave: 0,
    sick_leave: 0,
  };

  attendances.forEach((attendance) => {
    stats[attendance.status]++;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{className}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
          </div>

          {/* 일괄 선택 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setShowBulkSelect(!showBulkSelect)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>일괄 선택</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showBulkSelect && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.status}
                    onClick={() => handleBulkStatus(option.status)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <option.icon className="w-4 h-4" />
                    <span>전체 {option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 출결 통계 */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">전체</span>
            <span className="font-semibold text-gray-900">{stats.total}명</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-500">출석</span>
            <span className="font-semibold text-green-600">{stats.present}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-500">결석</span>
            <span className="font-semibold text-red-600">{stats.absent}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-500">지각</span>
            <span className="font-semibold text-yellow-600">{stats.late}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-gray-500">조퇴</span>
            <span className="font-semibold text-orange-600">{stats.early_leave}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-gray-500">병결</span>
            <span className="font-semibold text-purple-600">{stats.sick_leave}</span>
          </div>
        </div>
      </div>

      {/* 학생 목록 */}
      <div className="divide-y divide-gray-100">
        {students.map((student) => {
          const attendance = attendances.get(student.id);
          const currentStatus = attendance?.status || 'present';
          const currentMemo = attendance?.memo;

          return (
            <div
              key={student.id}
              className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              {/* 학생 정보 */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">
                    {student.name.slice(0, 1)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  {student.grade && (
                    <p className="text-xs text-gray-500">{student.grade}</p>
                  )}
                </div>
              </div>

              {/* 출결 상태 버튼 및 메모 */}
              <div className="flex items-center gap-2">
                {/* 출결 상태 토글 버튼 */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {STATUS_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = currentStatus === option.status;

                    return (
                      <button
                        key={option.status}
                        onClick={() => handleStatusChange(student.id, option.status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                          isActive
                            ? `${ATTENDANCE_STATUS_COLORS[option.status]} shadow-sm`
                            : 'text-gray-500 hover:bg-gray-200'
                        }`}
                        title={option.label}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{option.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 메모 버튼 */}
                <button
                  onClick={() => {
                    setMemoModal({ studentId: student.id, studentName: student.name });
                    setMemoText(currentMemo || '');
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    currentMemo
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={currentMemo || '메모 추가'}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 액션 바 */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
        <div className="flex items-center justify-between">
          {/* SMS 발송 옵션 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendSmsOnSave}
              onChange={(e) => setSendSmsOnSave(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">
              결석/지각 학생 보호자에게 SMS 발송
            </span>
          </label>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>출결 저장</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 메모 입력 모달 */}
      {memoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {memoModal.studentName} 메모
              </h3>
            </div>

            <div className="p-6">
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="출결 관련 메모를 입력하세요..."
                className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMemoModal(null);
                  setMemoText('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleMemoSave}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
