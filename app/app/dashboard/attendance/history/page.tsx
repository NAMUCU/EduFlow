'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Users,
  Check,
  X,
  Clock,
  LogOut,
  Stethoscope,
  AlertCircle,
  ArrowLeft,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import {
  AttendanceStatus,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_COLORS,
} from '@/types/attendance';

// 출결 기록 타입
interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  date: string;
  status: AttendanceStatus;
  check_in_time?: string | null;
  check_out_time?: string | null;
  memo?: string | null;
  sms_sent: boolean;
}

// 반 정보 타입
interface ClassInfo {
  id: string;
  name: string;
}

// 학생 정보 타입
interface StudentInfo {
  id: string;
  name: string;
  class_id: string;
  class_name: string;
}

// 학생별 출결 요약 타입
interface StudentSummary {
  student_id: string;
  student_name: string;
  class_name: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  early_leave: number;
  sick_leave: number;
  attendance_rate: number;
}

export default function AttendanceHistoryPage() {
  // 필터 상태
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 데이터 상태
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // 로딩 및 에러 상태
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 뷰 모드 (list: 기록 목록, summary: 학생별 요약)
  const [viewMode, setViewMode] = useState<'list' | 'summary'>('list');

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 출결 기록 조회
        const params = new URLSearchParams();
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        if (selectedClassId !== 'all') params.set('class_id', selectedClassId);
        if (selectedStudentId !== 'all') params.set('student_id', selectedStudentId);
        if (selectedStatus !== 'all') params.set('status', selectedStatus);
        params.set('page_size', '1000'); // 전체 데이터 로드

        const response = await fetch(`/api/attendance?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '데이터를 불러오는데 실패했습니다.');
        }

        if (data.success && data.data?.attendances) {
          setAttendances(data.data.attendances);
        }

        // 반과 학생 정보 가져오기
        const attendanceDataResponse = await fetch('/data/attendance.json');
        const attendanceData = await attendanceDataResponse.json();

        setClasses(attendanceData.classes || []);
        setStudents(attendanceData.students || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateFrom, dateTo, selectedClassId, selectedStudentId, selectedStatus]);

  // 검색 필터 적용
  const filteredAttendances = useMemo(() => {
    if (!searchQuery.trim()) return attendances;

    const query = searchQuery.toLowerCase();
    return attendances.filter(
      (a) =>
        a.student_name.toLowerCase().includes(query) ||
        a.class_name.toLowerCase().includes(query)
    );
  }, [attendances, searchQuery]);

  // 페이지네이션 적용
  const paginatedAttendances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredAttendances.slice(start, end);
  }, [filteredAttendances, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAttendances.length / pageSize);

  // 학생별 출결 요약 계산
  const studentSummaries = useMemo(() => {
    const summaryMap = new Map<string, StudentSummary>();

    filteredAttendances.forEach((a) => {
      if (!summaryMap.has(a.student_id)) {
        summaryMap.set(a.student_id, {
          student_id: a.student_id,
          student_name: a.student_name,
          class_name: a.class_name,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          early_leave: 0,
          sick_leave: 0,
          attendance_rate: 0,
        });
      }

      const summary = summaryMap.get(a.student_id)!;
      summary.total++;
      summary[a.status]++;
    });

    // 출석률 계산
    summaryMap.forEach((summary) => {
      if (summary.total > 0) {
        summary.attendance_rate = Math.round(
          ((summary.present + summary.late) / summary.total) * 100
        );
      }
    });

    return Array.from(summaryMap.values()).sort((a, b) =>
      a.student_name.localeCompare(b.student_name)
    );
  }, [filteredAttendances]);

  // 전체 통계 계산
  const totalStats = useMemo(() => {
    const stats = {
      total: filteredAttendances.length,
      present: 0,
      absent: 0,
      late: 0,
      early_leave: 0,
      sick_leave: 0,
    };

    filteredAttendances.forEach((a) => {
      stats[a.status]++;
    });

    return stats;
  }, [filteredAttendances]);

  // 상태 아이콘 반환
  const getStatusIcon = (status: AttendanceStatus) => {
    const iconMap: Record<AttendanceStatus, React.ComponentType<{ className?: string }>> = {
      present: Check,
      absent: X,
      late: Clock,
      early_leave: LogOut,
      sick_leave: Stethoscope,
    };
    return iconMap[status];
  };

  // CSV 내보내기
  const handleExportCsv = () => {
    const headers = ['날짜', '반', '학생명', '상태', '등원시간', '하원시간', '메모'];
    const rows = filteredAttendances.map((a) => [
      a.date,
      a.class_name,
      a.student_name,
      ATTENDANCE_STATUS_LABELS[a.status],
      a.check_in_time || '-',
      a.check_out_time || '-',
      a.memo || '',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join(
        '\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `출결기록_${dateFrom}_${dateTo}.csv`;
    link.click();
  };

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/attendance"
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">출결 기록 조회</h1>
            <p className="text-gray-500 mt-1">학생별/기간별 출결 현황을 조회합니다</p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>CSV 다운로드</span>
        </button>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">필터</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 기간 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작 날짜
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료 날짜
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 반 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">반</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedStudentId('all');
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">전체 반</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 학생 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">학생</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">전체 학생</option>
              {students
                .filter(
                  (s) => selectedClassId === 'all' || s.class_id === selectedClassId
                )
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.class_name})
                  </option>
                ))}
            </select>
          </div>

          {/* 상태 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">전체 상태</option>
              <option value="present">출석</option>
              <option value="absent">결석</option>
              <option value="late">지각</option>
              <option value="early_leave">조퇴</option>
              <option value="sick_leave">병결</option>
            </select>
          </div>
        </div>

        {/* 검색 */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="학생 이름 또는 반 이름으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalStats.total}</p>
          <p className="text-sm text-gray-500">전체</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{totalStats.present}</p>
          <p className="text-sm text-green-600">출석</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{totalStats.absent}</p>
          <p className="text-sm text-red-600">결석</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{totalStats.late}</p>
          <p className="text-sm text-yellow-600">지각</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-100 p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{totalStats.early_leave}</p>
          <p className="text-sm text-orange-600">조퇴</p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-100 p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{totalStats.sick_leave}</p>
          <p className="text-sm text-purple-600">병결</p>
        </div>
      </div>

      {/* 뷰 모드 전환 */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          기록 목록
        </button>
        <button
          onClick={() => setViewMode('summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
            viewMode === 'summary'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          학생별 요약
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 로딩 */}
      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </div>
      ) : viewMode === 'list' ? (
        /* 기록 목록 뷰 */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    날짜
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    반
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    학생
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    상태
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    등원시간
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    하원시간
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    메모
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedAttendances.length > 0 ? (
                  paginatedAttendances.map((record) => {
                    const StatusIcon = getStatusIcon(record.status);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {record.class_name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-primary-600">
                                {record.student_name.slice(0, 1)}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {record.student_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              ATTENDANCE_STATUS_COLORS[record.status]
                            }`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {ATTENDANCE_STATUS_LABELS[record.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {record.check_in_time || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {record.check_out_time || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {record.memo || '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      조회된 출결 기록이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                총 {filteredAttendances.length}건 중 {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, filteredAttendances.length)}건
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 학생별 요약 뷰 */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    학생
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    반
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    전체
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-green-600">
                    출석
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-red-600">
                    결석
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-yellow-600">
                    지각
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-orange-600">
                    조퇴
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-purple-600">
                    병결
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    출석률
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentSummaries.length > 0 ? (
                  studentSummaries.map((summary) => (
                    <tr key={summary.student_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-primary-600">
                              {summary.student_name.slice(0, 1)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {summary.student_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {summary.class_name}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                        {summary.total}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-green-600">
                        {summary.present}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-red-600">
                        {summary.absent}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-yellow-600">
                        {summary.late}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-orange-600">
                        {summary.early_leave}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-purple-600">
                        {summary.sick_leave}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                summary.attendance_rate >= 90
                                  ? 'bg-green-500'
                                  : summary.attendance_rate >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${summary.attendance_rate}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              summary.attendance_rate >= 90
                                ? 'text-green-600'
                                : summary.attendance_rate >= 70
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {summary.attendance_rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      조회된 출결 기록이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
