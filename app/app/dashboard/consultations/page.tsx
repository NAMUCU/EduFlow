'use client';

/**
 * 상담 관리 페이지
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 상담 기록 캐싱 (useConsultations 훅)
 * - rerender-memo: 상담 카드 메모이제이션 (ConsultationCard, UpcomingConsultationCard)
 * - async-parallel: 학생정보+상담기록+통계 병렬 로딩 (useConsultationData)
 * - bundle-dynamic-imports: 상담 상세/예약/기록 모달 lazy load
 * - rerender-functional-setstate: 상태 업데이트 안정적인 콜백
 * - rendering-content-visibility: 목록 행과 캘린더 셀에 content-visibility 적용
 * - bundle-preload: hover/focus 시 모달 컴포넌트 prefetch
 * - rerender-transitions: 필터 변경 등 비긴급 업데이트에 startTransition 사용
 */

import { useState, useCallback, useMemo, startTransition } from 'react';
import dynamic from 'next/dynamic';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Phone,
  Video,
  Users,
  Clock,
  Check,
  X,
  Search,
  FileText,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import {
  ConsultationListItem,
  CreateConsultationInput,
  CONSULTATION_TYPE_COLORS,
  CONSULTATION_STATUS_COLORS,
  formatDuration,
} from '@/types/consultation';
import {
  ConsultationType,
  ConsultationStatus,
  CONSULTATION_TYPE_LABELS,
  CONSULTATION_STATUS_LABELS,
} from '@/types/database';
import {
  useConsultationData,
  useConsultationDetail,
  useCreateConsultation,
  useUpdateConsultation,
  useDeleteConsultation,
  ConsultationFilter,
} from '@/hooks/useConsultations';
import { ConsultationCard, UpcomingConsultationCard } from '@/components/consultations/ConsultationCard';

// bundle-dynamic-imports: 모달 컴포넌트 lazy load
const ConsultationDetailModal = dynamic(
  () => import('@/components/consultations/ConsultationDetailModal'),
  { ssr: false }
);

const ConsultationCreateModal = dynamic(
  () => import('@/components/consultations/ConsultationCreateModal'),
  { ssr: false }
);

const ConsultationRecordModal = dynamic(
  () => import('@/components/consultations/ConsultationRecordModal'),
  { ssr: false }
);

// bundle-preload: 모달 컴포넌트 preload 함수
const preloadDetailModal = () => {
  if (typeof window !== 'undefined') {
    void import('@/components/consultations/ConsultationDetailModal');
  }
};

const preloadCreateModal = () => {
  if (typeof window !== 'undefined') {
    void import('@/components/consultations/ConsultationCreateModal');
  }
};

const preloadRecordModal = () => {
  if (typeof window !== 'undefined') {
    void import('@/components/consultations/ConsultationRecordModal');
  }
};

// 상담 유형 아이콘
const TYPE_ICONS: Record<ConsultationType, React.ReactNode> = {
  in_person: <Users className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
};

// 상담 기록 폼 데이터 타입
interface ConsultationRecordData {
  notes: string;
  status: ConsultationStatus;
}

export default function ConsultationsPage() {
  // ============================================
  // 상태 관리 (rerender-functional-setstate 적용)
  // ============================================

  // 현재 보기 모드
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // 캘린더 관련 상태
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  // rerender-lazy-state-init: 함수로 초기값 지연 계산
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // 필터 상태
  const [filters, setFilters] = useState<ConsultationFilter>({
    search: '',
    status: '',
    type: '',
  });

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);

  // 성공 메시지
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 새 상담 폼 데이터
  const [newConsultation, setNewConsultation] = useState<CreateConsultationInput>({
    studentId: '',
    date: selectedDate,
    time: '15:00',
    duration: 30,
    type: 'in_person',
    topic: '',
  });

  // 상담 기록 폼 데이터
  const [consultationRecord, setConsultationRecord] = useState<ConsultationRecordData>({
    notes: '',
    status: 'completed',
  });

  // ============================================
  // SWR 훅 사용 (client-swr-dedup + async-parallel)
  // ============================================

  // 상담 데이터 병렬 로딩
  const {
    consultations,
    stats,
    students,
    isLoading,
    isError,
    error,
    refreshAll,
  } = useConsultationData(filters);

  // 상담 상세 정보
  const {
    consultation: selectedConsultation,
  } = useConsultationDetail(selectedConsultationId);

  // Mutation 훅
  const { createConsultation, isCreating } = useCreateConsultation();
  const { updateConsultation, isUpdating } = useUpdateConsultation(selectedConsultationId);
  const { deleteConsultation } = useDeleteConsultation();

  // ============================================
  // 이벤트 핸들러 (rerender-functional-setstate)
  // ============================================

  // 월 변경 (functional setState)
  const handleMonthChange = useCallback((delta: number) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + delta);
      return newMonth;
    });
  }, []);

  // 오늘로 이동
  const handleGoToToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  // 날짜 선택 (rerender-transitions: 비긴급 업데이트)
  const handleDateSelect = useCallback((date: Date) => {
    startTransition(() => {
      setSelectedDate(date.toISOString().split('T')[0]);
    });
  }, []);

  // 필터 업데이트 (functional setState + rerender-transitions: 비긴급 업데이트)
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    startTransition(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    });
  }, []);

  const handleStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ConsultationStatus | '';
    startTransition(() => {
      setFilters((prev) => ({ ...prev, status: value }));
    });
  }, []);

  const handleTypeFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ConsultationType | '';
    startTransition(() => {
      setFilters((prev) => ({ ...prev, type: value }));
    });
  }, []);

  // 상담 상세 보기
  const handleViewDetail = useCallback((consultationId: string) => {
    setSelectedConsultationId(consultationId);
    setShowDetailModal(true);
  }, []);

  // 상담 예약 모달 열기
  const handleOpenCreateModal = useCallback(() => {
    setNewConsultation((prev) => ({ ...prev, date: selectedDate }));
    setShowCreateModal(true);
  }, [selectedDate]);

  // 상담 예약 폼 업데이트
  const handleNewConsultationChange = useCallback((data: CreateConsultationInput) => {
    setNewConsultation(data);
  }, []);

  // 상담 예약 생성
  const handleCreateConsultation = useCallback(async () => {
    try {
      await createConsultation(newConsultation);
      setSuccessMessage('상담이 예약되었습니다.');
      setShowCreateModal(false);
      setNewConsultation({
        studentId: '',
        date: selectedDate,
        time: '15:00',
        duration: 30,
        type: 'in_person',
        topic: '',
      });
      refreshAll();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // 에러는 SWR에서 처리
    }
  }, [newConsultation, selectedDate, createConsultation, refreshAll]);

  // 상담 기록 모달 열기
  const handleOpenRecordModal = useCallback(() => {
    preloadRecordModal();
    if (selectedConsultation) {
      setConsultationRecord({
        notes: selectedConsultation.notes || '',
        status: 'completed',
      });
      setShowRecordModal(true);
    }
  }, [selectedConsultation]);

  // 상담 기록 폼 업데이트
  const handleRecordChange = useCallback((data: ConsultationRecordData) => {
    setConsultationRecord(data);
  }, []);

  // 상담 기록 저장
  const handleSaveRecord = useCallback(async () => {
    if (!selectedConsultationId) return;

    try {
      await updateConsultation({
        notes: consultationRecord.notes,
        status: consultationRecord.status,
      });
      setSuccessMessage('상담 기록이 저장되었습니다.');
      setShowRecordModal(false);
      setShowDetailModal(false);
      setConsultationRecord({ notes: '', status: 'completed' });
      refreshAll();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // 에러는 SWR에서 처리
    }
  }, [selectedConsultationId, consultationRecord, updateConsultation, refreshAll]);

  // 상담 취소
  const handleCancelConsultation = useCallback(
    async (consultationId: string) => {
      try {
        await deleteConsultation(consultationId);
        setSuccessMessage('상담이 취소되었습니다.');
        setShowDetailModal(false);
        refreshAll();
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        // 에러는 직접 처리
      }
    },
    [deleteConsultation, refreshAll]
  );

  // 모달 닫기 핸들러
  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedConsultationId(null);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const handleCloseRecordModal = useCallback(() => {
    setShowRecordModal(false);
  }, []);

  // 에러 닫기
  const handleCloseError = useCallback(() => {
    // 에러는 SWR에서 관리되므로 refreshAll로 새로고침
    refreshAll();
  }, [refreshAll]);

  // ============================================
  // 캘린더 유틸리티 (useMemo로 최적화)
  // ============================================

  // 캘린더 날짜 생성
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // 이전 달의 날짜들
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }

    // 다음 달의 날짜들 (6주 채우기)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  // 특정 날짜의 상담 가져오기 (Map으로 O(1) 조회)
  const consultationsByDate = useMemo(() => {
    const map = new Map<string, ConsultationListItem[]>();
    consultations.forEach((c) => {
      const existing = map.get(c.date) || [];
      existing.push(c);
      map.set(c.date, existing);
    });
    return map;
  }, [consultations]);

  const getConsultationsForDate = useCallback(
    (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return consultationsByDate.get(dateStr) || [];
    },
    [consultationsByDate]
  );

  // 오늘인지 확인
  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }, []);

  // 선택된 날짜인지 확인
  const isSelected = useCallback(
    (date: Date) => {
      return date.toISOString().split('T')[0] === selectedDate;
    },
    [selectedDate]
  );

  // 예정된 상담 (오늘 이후)
  const upcomingConsultations = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return consultations.filter((c) => c.status === 'scheduled' && c.date >= todayStr);
  }, [consultations]);

  // 선택된 날짜의 상담
  const selectedDateConsultations = useMemo(() => {
    return getConsultationsForDate(new Date(selectedDate));
  }, [getConsultationsForDate, selectedDate]);

  // ============================================
  // 렌더링
  // ============================================

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">상담 관리</h1>
          <p className="text-gray-500 mt-1">학부모 상담 일정을 관리하고 기록합니다</p>
        </div>

        {/* bundle-preload: hover/focus 시 모달 preload */}
        <button
          onClick={handleOpenCreateModal}
          onMouseEnter={preloadCreateModal}
          onFocus={preloadCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>상담 예약</span>
        </button>
      </div>

      {/* 알림 메시지 */}
      {isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button onClick={handleCloseError} className="ml-auto text-red-500 hover:text-red-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-gray-900">이번 달</h3>
          </div>
          <p className="text-3xl font-bold text-primary-600">{stats.thisMonth}</p>
          <p className="text-sm text-gray-500 mt-1">건의 상담</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">예정됨</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{stats.scheduled}</p>
          <p className="text-sm text-gray-500 mt-1">건의 상담</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Check className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-gray-900">완료</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-sm text-gray-500 mt-1">건의 상담</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">총 상담</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-sm text-gray-500 mt-1">건</p>
        </div>
      </div>

      {/* 보기 모드 탭 & 필터 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            캘린더
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            목록
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="학생명, 주제 검색..."
              value={filters.search}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={filters.status}
            onChange={handleStatusFilterChange}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">모든 상태</option>
            <option value="scheduled">예약됨</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소됨</option>
          </select>

          <select
            value={filters.type}
            onChange={handleTypeFilterChange}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">모든 유형</option>
            <option value="in_person">대면</option>
            <option value="phone">전화</option>
            <option value="video">화상</option>
          </select>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 캘린더 또는 목록 */}
        <div className={`${viewMode === 'calendar' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {viewMode === 'calendar' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {/* 캘린더 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMonthChange(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleGoToToday}
                    className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    오늘
                  </button>
                  <button
                    onClick={() => handleMonthChange(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                  <div
                    key={day}
                    className={`text-center text-sm font-medium py-2 ${
                      index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-500'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 캘린더 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const dayConsultations = getConsultationsForDate(day.date);
                  const dayOfWeek = day.date.getDay();

                  return (
                    // rendering-content-visibility: 캘린더 셀 렌더링 최적화
                    <button
                      key={index}
                      onClick={() => handleDateSelect(day.date)}
                      className={`calendar-day-cell min-h-[80px] p-2 rounded-lg text-left transition-colors ${
                        !day.isCurrentMonth
                          ? 'bg-gray-50 text-gray-400'
                          : isSelected(day.date)
                          ? 'bg-primary-100 ring-2 ring-primary-500'
                          : isToday(day.date)
                          ? 'bg-primary-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isToday(day.date)
                            ? 'text-primary-600'
                            : dayOfWeek === 0
                            ? 'text-red-500'
                            : dayOfWeek === 6
                            ? 'text-blue-500'
                            : 'text-gray-700'
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayConsultations.slice(0, 2).map((c) => (
                          <div
                            key={c.id}
                            className={`text-xs px-1.5 py-0.5 rounded truncate ${CONSULTATION_STATUS_COLORS[c.status]}`}
                          >
                            {c.time} {c.studentName}
                          </div>
                        ))}
                        {dayConsultations.length > 2 && (
                          <div className="text-xs text-gray-500">+{dayConsultations.length - 2}건</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 목록 보기 */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">데이터를 불러오는 중...</p>
                </div>
              ) : consultations.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">상담 내역이 없습니다</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">날짜/시간</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">학생</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">학부모</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">유형</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">주제</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">상태</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {consultations.map((consultation) => (
                      // rendering-content-visibility: 목록 행 렌더링 최적화
                      <tr key={consultation.id} className="consultation-row hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(consultation.date).toLocaleDateString('ko-KR')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {consultation.time} ({formatDuration(consultation.duration)})
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{consultation.studentName}</div>
                          <div className="text-sm text-gray-500">{consultation.studentGrade}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{consultation.parentName}</div>
                          <div className="text-sm text-gray-500">{consultation.parentPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${CONSULTATION_TYPE_COLORS[consultation.type]}`}
                          >
                            {TYPE_ICONS[consultation.type]}
                            {CONSULTATION_TYPE_LABELS[consultation.type]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-[200px] truncate">
                            {consultation.topic}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${CONSULTATION_STATUS_COLORS[consultation.status]}`}
                          >
                            {CONSULTATION_STATUS_LABELS[consultation.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {/* bundle-preload: hover/focus 시 상세 모달 preload */}
                          <button
                            onClick={() => handleViewDetail(consultation.id)}
                            onMouseEnter={preloadDetailModal}
                            onFocus={preloadDetailModal}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            상세
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* 사이드바 - 예정된 상담 */}
        {viewMode === 'calendar' && (
          <div className="space-y-6">
            {/* 선택된 날짜의 상담 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {new Date(selectedDate).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </h3>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : selectedDateConsultations.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">예정된 상담이 없습니다</p>
                  <button
                    onClick={handleOpenCreateModal}
                    className="mt-3 text-sm text-primary-600 hover:text-primary-700"
                  >
                    + 상담 예약하기
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* rerender-memo: 메모이제이션된 ConsultationCard 사용 */}
                  {selectedDateConsultations.map((c) => (
                    <ConsultationCard key={c.id} consultation={c} onClick={handleViewDetail} />
                  ))}
                </div>
              )}
            </div>

            {/* 예정된 상담 목록 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">예정된 상담</h3>

              {upcomingConsultations.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">예정된 상담이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {/* rerender-memo: 메모이제이션된 UpcomingConsultationCard 사용 */}
                  {upcomingConsultations.slice(0, 5).map((c) => (
                    <UpcomingConsultationCard key={c.id} consultation={c} onClick={handleViewDetail} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* bundle-dynamic-imports: 모달 컴포넌트는 조건부 렌더링 시 lazy load */}
      {showCreateModal && (
        <ConsultationCreateModal
          students={students}
          formData={newConsultation}
          onFormChange={handleNewConsultationChange}
          onSubmit={handleCreateConsultation}
          onClose={handleCloseCreateModal}
          isSaving={isCreating}
        />
      )}

      {showDetailModal && selectedConsultation && (
        <ConsultationDetailModal
          consultation={selectedConsultation}
          onClose={handleCloseDetailModal}
          onCancel={handleCancelConsultation}
          onRecord={handleOpenRecordModal}
        />
      )}

      {showRecordModal && selectedConsultation && (
        <ConsultationRecordModal
          consultation={selectedConsultation}
          recordData={consultationRecord}
          onRecordChange={handleRecordChange}
          onSubmit={handleSaveRecord}
          onClose={handleCloseRecordModal}
          isSaving={isUpdating}
        />
      )}
    </div>
  );
}
