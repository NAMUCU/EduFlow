'use client';

/**
 * EduFlow 출결 관리 페이지
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 출결 데이터 캐싱 및 중복 요청 방지
 * - rerender-memo: 출결 카드/행 메모이제이션
 * - async-parallel: 반별 출결 데이터 병렬 로딩
 * - js-batch-dom-css: 일괄 출결 처리 시 DOM 업데이트 배치
 * - rendering-content-visibility: 학생 목록에 content-visibility 적용
 */

import { useState, useCallback, useMemo, memo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Check,
  X,
  Clock,
  AlertCircle,
  History,
} from 'lucide-react';
import Link from 'next/link';
import AttendanceChecker from '@/components/AttendanceChecker';
import { useAttendance, useSaveAttendance, AttendanceRecord } from '@/hooks/useAttendance';

// ============================================
// rerender-memo: 메모이제이션된 통계 카드 컴포넌트
// ============================================

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle?: string;
  colorClass: string;
}

const StatCard = memo(function StatCard({
  icon,
  title,
  value,
  subtitle,
  colorClass,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
});

// ============================================
// rerender-memo: 메모이제이션된 반 선택 탭 컴포넌트
// ============================================

interface ClassTabProps {
  id: string;
  name: string;
  studentCount: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ClassTab = memo(function ClassTab({
  id,
  name,
  studentCount,
  isSelected,
  onSelect,
}: ClassTabProps) {
  const handleClick = useCallback(() => {
    onSelect(id);
  }, [id, onSelect]);

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
        isSelected
          ? 'bg-primary-600 text-white shadow-sm'
          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      <Users className="w-4 h-4" />
      <span>{name}</span>
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          isSelected
            ? 'bg-white/20 text-white'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {studentCount}명
      </span>
    </button>
  );
});

// ============================================
// rerender-memo: 메모이제이션된 날짜 선택기 컴포넌트
// ============================================

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onNavigate: (days: number) => void;
}

const DateSelector = memo(function DateSelector({
  selectedDate,
  onDateChange,
  onNavigate,
}: DateSelectorProps) {
  const handlePrevDay = useCallback(() => onNavigate(-1), [onNavigate]);
  const handleNextDay = useCallback(() => onNavigate(1), [onNavigate]);
  const handleToday = useCallback(() => {
    onDateChange(new Date().toISOString().split('T')[0]);
  }, [onDateChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onDateChange(e.target.value);
    },
    [onDateChange]
  );

  const dayOfWeek = useMemo(() => {
    return new Date(selectedDate).toLocaleDateString('ko-KR', {
      weekday: 'long',
    });
  }, [selectedDate]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary-500" />
        <h3 className="font-semibold text-gray-900">날짜 선택</h3>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevDay}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="text-center">
          <input
            type="date"
            value={selectedDate}
            onChange={handleInputChange}
            className="text-lg font-semibold text-gray-900 bg-transparent border-none text-center cursor-pointer focus:outline-none"
          />
          <p className="text-sm text-gray-500">{dayOfWeek}</p>
        </div>

        <button
          onClick={handleNextDay}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <button
        onClick={handleToday}
        className="w-full mt-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
      >
        오늘로 이동
      </button>
    </div>
  );
});

// ============================================
// rerender-memo: 메모이제이션된 알림 컴포넌트
// ============================================

interface AlertMessageProps {
  type: 'error' | 'success';
  message: string;
}

const AlertMessage = memo(function AlertMessage({ type, message }: AlertMessageProps) {
  const isError = type === 'error';

  return (
    <div
      className={`mb-6 p-4 ${
        isError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
      } border rounded-xl flex items-center gap-3`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      ) : (
        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
      )}
      <p className={isError ? 'text-red-700' : 'text-green-700'}>{message}</p>
    </div>
  );
});

// ============================================
// 메인 컴포넌트
// ============================================

export default function AttendancePage() {
  // 날짜 선택 상태 (rerender-lazy-state-init: 함수로 초기화)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // 선택된 반 ID
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // 알림 상태
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 저장 중 상태
  const [isSaving, setIsSaving] = useState(false);

  // client-swr-dedup & async-parallel: SWR 훅으로 데이터 병렬 로딩
  const {
    classes,
    selectedClass,
    selectedClassStudents,
    selectedClassAttendances,
    todayStats,
    isLoading,
    error: fetchError,
    mutate,
  } = useAttendance({
    date: selectedDate,
    classId: selectedClassId,
  });

  // 첫 번째 반 자동 선택
  useMemo(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // js-batch-dom-css: 저장 성공/실패 시 DOM 업데이트 배치
  const { saveAttendance } = useSaveAttendance({
    onSuccess: (message) => {
      // js-batch-dom-css: requestAnimationFrame으로 DOM 업데이트 배치
      requestAnimationFrame(() => {
        setSuccessMessage(message);
        setError(null);
        mutate(); // SWR 캐시 재검증
      });

      // 3초 후 성공 메시지 제거
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (errorMessage) => {
      requestAnimationFrame(() => {
        setError(errorMessage);
        setSuccessMessage(null);
      });
    },
  });

  // 날짜 변경 핸들러 (rerender-functional-setstate 불필요: 단순 교체)
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  // 날짜 네비게이션 핸들러
  const handleDateNavigate = useCallback((days: number) => {
    setSelectedDate((prev) => {
      const current = new Date(prev);
      current.setDate(current.getDate() + days);
      return current.toISOString().split('T')[0];
    });
  }, []);

  // 반 선택 핸들러
  const handleClassSelect = useCallback((classId: string) => {
    setSelectedClassId(classId);
  }, []);

  // 출결 저장 핸들러
  const handleSaveAttendance = useCallback(
    async (attendances: AttendanceRecord[], sendSms: boolean) => {
      if (!selectedClassId) return;

      setIsSaving(true);

      const result = await saveAttendance({
        classId: selectedClassId,
        date: selectedDate,
        attendances,
        sendSms,
      });

      // js-batch-dom-css: 상태 업데이트 배치
      requestAnimationFrame(() => {
        setIsSaving(false);
      });

      return result;
    },
    [selectedClassId, selectedDate, saveAttendance]
  );

  // 통계 퍼센트 계산 (rerender-derived-state: 파생 값)
  const presentPercentage = useMemo(() => {
    if (todayStats.total === 0) return '-';
    return `${Math.round((todayStats.present / todayStats.total) * 100)}%`;
  }, [todayStats.present, todayStats.total]);

  // fetch 에러 표시
  const displayError = error || fetchError;

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">출결 관리</h1>
          <p className="text-gray-500 mt-1">학생들의 출결 상태를 관리합니다</p>
        </div>

        <Link
          href="/dashboard/attendance/history"
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <History className="w-5 h-5" />
          <span>출결 기록 조회</span>
        </Link>
      </div>

      {/* 날짜 선택 및 통계 - rerender-memo: 각 카드 메모이제이션 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* 날짜 선택 */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onNavigate={handleDateNavigate}
        />

        {/* 출석 통계 */}
        <StatCard
          icon={<Check className="w-5 h-5 text-green-500" />}
          title="출석"
          value={todayStats.present}
          subtitle={presentPercentage}
          colorClass="text-green-600"
        />

        {/* 결석 통계 */}
        <StatCard
          icon={<X className="w-5 h-5 text-red-500" />}
          title="결석"
          value={todayStats.absent}
          subtitle={`병결 ${todayStats.sick_leave}명 포함`}
          colorClass="text-red-600"
        />

        {/* 지각/조퇴 통계 */}
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-500" />}
          title="지각/조퇴"
          value={todayStats.late + todayStats.early_leave}
          subtitle={`지각 ${todayStats.late}명 / 조퇴 ${todayStats.early_leave}명`}
          colorClass="text-yellow-600"
        />
      </div>

      {/* 알림 메시지 */}
      {displayError && <AlertMessage type="error" message={displayError} />}
      {successMessage && <AlertMessage type="success" message={successMessage} />}

      {/* 반 선택 탭 - rendering-content-visibility: 긴 목록 최적화 */}
      <div className="mb-6">
        <div
          className="flex items-center gap-2 overflow-x-auto pb-2"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 48px' }}
        >
          {classes.map((classInfo) => (
            <ClassTab
              key={classInfo.id}
              id={classInfo.id}
              name={classInfo.name}
              studentCount={classInfo.student_ids.length}
              isSelected={selectedClassId === classInfo.id}
              onSelect={handleClassSelect}
            />
          ))}
        </div>
      </div>

      {/* 출결 체크 컴포넌트 - rendering-content-visibility: 학생 목록 최적화 */}
      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </div>
      ) : selectedClass && selectedClassStudents.length > 0 ? (
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}>
          <AttendanceChecker
            classId={selectedClass.id}
            className={selectedClass.name}
            date={selectedDate}
            students={selectedClassStudents.map((s) => ({
              id: s.id,
              name: s.name,
              grade: s.grade,
              class_name: s.class_name,
            }))}
            initialAttendances={selectedClassAttendances}
            onSave={handleSaveAttendance}
            isLoading={isSaving}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {classes.length === 0
              ? '등록된 반이 없습니다.'
              : '선택된 반에 학생이 없습니다.'}
          </p>
        </div>
      )}
    </div>
  );
}
