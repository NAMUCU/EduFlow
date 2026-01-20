'use client';

/**
 * EduFlow 출결 관리 훅
 *
 * SWR을 사용하여 출결 데이터를 캐싱하고 중복 요청을 방지합니다.
 * client-swr-dedup 패턴을 적용하여 성능을 최적화합니다.
 *
 * @example
 * ```tsx
 * const { attendanceData, classes, students, isLoading, error, mutate } = useAttendance({
 *   date: '2024-01-15',
 *   classId: 'class-001',
 * });
 * ```
 */

import useSWR from 'swr';
import { useCallback, useMemo } from 'react';
import { AttendanceStatus, Attendance } from '@/types/attendance';

// ============================================
// 타입 정의
// ============================================

/** 반 정보 */
export interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  schedule: string;
  student_ids: string[];
}

/** 학생 정보 */
export interface Student {
  id: string;
  name: string;
  grade: string;
  class_id: string;
  class_name: string;
}

/** 출결 기록 */
export interface AttendanceRecord {
  student_id: string;
  student_name: string;
  status: AttendanceStatus;
  check_in_time?: string;
  memo?: string;
}

/** 출결 통계 */
export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  early_leave: number;
  sick_leave: number;
}

/** API 응답 타입 */
interface AttendanceApiResponse {
  success: boolean;
  data?: {
    attendances: {
      student_id: string;
      student_name: string;
      status: AttendanceStatus;
      check_in_time?: string;
      memo?: string;
    }[];
  };
  error?: string;
}

/** 반/학생 데이터 응답 타입 */
interface AttendanceDataResponse {
  classes: ClassInfo[];
  students: Student[];
}

// ============================================
// Fetcher 함수
// ============================================

/**
 * 출결 API fetcher
 */
const attendanceFetcher = async (url: string): Promise<AttendanceApiResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '출결 데이터를 불러오는데 실패했습니다.');
  }
  return response.json();
};

/**
 * 반/학생 데이터 fetcher
 */
const dataFetcher = async (url: string): Promise<AttendanceDataResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('데이터를 불러오는데 실패했습니다.');
  }
  return response.json();
};

// ============================================
// 훅 정의
// ============================================

interface UseAttendanceOptions {
  date: string;
  classId?: string | null;
}

/**
 * useAttendance 훅
 *
 * 출결 데이터를 SWR로 관리합니다.
 * async-parallel 패턴으로 반별 데이터와 출결 데이터를 병렬 로딩합니다.
 * client-swr-dedup 패턴으로 중복 요청을 방지합니다.
 */
export function useAttendance(options: UseAttendanceOptions) {
  const { date, classId } = options;

  // 출결 API URL
  const attendanceUrl = useMemo(() => {
    return `/api/attendance?date=${date}`;
  }, [date]);

  // 반/학생 데이터 URL
  const dataUrl = '/data/attendance.json';

  // async-parallel: SWR로 두 데이터를 병렬로 로딩
  const {
    data: attendanceResponse,
    error: attendanceError,
    isLoading: isLoadingAttendance,
    mutate: mutateAttendance,
  } = useSWR<AttendanceApiResponse>(attendanceUrl, attendanceFetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
    dedupingInterval: 2000, // client-swr-dedup: 2초 내 중복 요청 방지
    keepPreviousData: true,
    errorRetryCount: 3,
  });

  const {
    data: attendanceData,
    error: dataError,
    isLoading: isLoadingData,
  } = useSWR<AttendanceDataResponse>(dataUrl, dataFetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false, // 정적 데이터이므로 재검증 불필요
    dedupingInterval: 60000, // 1분 내 중복 요청 방지
    keepPreviousData: true,
  });

  // 데이터 추출
  const classes = useMemo(() => attendanceData?.classes || [], [attendanceData?.classes]);
  const students = useMemo(() => attendanceData?.students || [], [attendanceData?.students]);

  // 기존 출결 기록
  const existingAttendances = useMemo<AttendanceRecord[]>(() => {
    if (!attendanceResponse?.success || !attendanceResponse.data?.attendances) {
      return [];
    }
    return attendanceResponse.data.attendances.map((a) => ({
      student_id: a.student_id,
      student_name: a.student_name,
      status: a.status,
      check_in_time: a.check_in_time,
      memo: a.memo,
    }));
  }, [attendanceResponse]);

  // 통계 계산 (js-combine-iterations: 단일 루프로 모든 통계 계산)
  const todayStats = useMemo<AttendanceStats>(() => {
    const stats: AttendanceStats = {
      total: existingAttendances.length,
      present: 0,
      absent: 0,
      late: 0,
      early_leave: 0,
      sick_leave: 0,
    };

    for (const record of existingAttendances) {
      stats[record.status]++;
    }

    return stats;
  }, [existingAttendances]);

  // 선택된 반의 학생 목록 (js-index-maps: Map으로 빠른 조회)
  const studentsByClass = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (const student of students) {
      const classStudents = map.get(student.class_id) || [];
      classStudents.push(student);
      map.set(student.class_id, classStudents);
    }
    return map;
  }, [students]);

  // 선택된 반의 학생 목록
  const selectedClassStudents = useMemo(() => {
    if (!classId) return [];
    return studentsByClass.get(classId) || [];
  }, [classId, studentsByClass]);

  // 선택된 반의 출결 기록 (js-set-map-lookups: Set으로 O(1) 조회)
  const selectedClassAttendances = useMemo(() => {
    if (!classId) return [];
    const studentIdSet = new Set(selectedClassStudents.map((s) => s.id));
    return existingAttendances.filter((a) => studentIdSet.has(a.student_id));
  }, [classId, selectedClassStudents, existingAttendances]);

  // 선택된 반 정보
  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === classId);
  }, [classes, classId]);

  // 새로고침 함수
  const refresh = useCallback(() => {
    return mutateAttendance();
  }, [mutateAttendance]);

  // 로딩 상태 통합
  const isLoading = isLoadingAttendance || isLoadingData;
  const error = attendanceError?.message || dataError?.message || null;

  return {
    // 반 데이터
    classes,
    students,
    studentsByClass,
    selectedClass,
    selectedClassStudents,

    // 출결 데이터
    existingAttendances,
    selectedClassAttendances,
    todayStats,

    // 상태
    isLoading,
    error,

    // 액션
    refresh,
    mutate: mutateAttendance,
  };
}

// ============================================
// 일괄 출결 저장 훅
// ============================================

interface UseSaveAttendanceOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

/**
 * useSaveAttendance 훅
 *
 * 일괄 출결 저장 기능을 제공합니다.
 * js-batch-dom-css 패턴으로 DOM 업데이트를 배치 처리합니다.
 */
export function useSaveAttendance(options: UseSaveAttendanceOptions = {}) {
  const { onSuccess, onError } = options;

  const saveAttendance = useCallback(
    async (params: {
      classId: string;
      date: string;
      attendances: AttendanceRecord[];
      sendSms: boolean;
    }) => {
      const { classId, date, attendances, sendSms } = params;

      try {
        const response = await fetch('/api/attendance/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            class_id: classId,
            date,
            attendances: attendances.map((a) => ({
              student_id: a.student_id,
              status: a.status,
              check_in_time: a.check_in_time,
              memo: a.memo,
            })),
            send_sms_for_absent: sendSms,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '출결 저장에 실패했습니다.');
        }

        // js-batch-dom-css: 상태 업데이트를 한 번에 처리하기 위해 콜백 사용
        onSuccess?.(data.message || '출결이 저장되었습니다.');

        return {
          success: true,
          stats: calculateStats(attendances),
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '출결 저장 중 오류가 발생했습니다.';
        onError?.(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [onSuccess, onError]
  );

  return { saveAttendance };
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 출결 통계 계산 (js-combine-iterations)
 */
function calculateStats(attendances: AttendanceRecord[]): AttendanceStats {
  const stats: AttendanceStats = {
    total: attendances.length,
    present: 0,
    absent: 0,
    late: 0,
    early_leave: 0,
    sick_leave: 0,
  };

  for (const a of attendances) {
    stats[a.status]++;
  }

  return stats;
}

// 기본 export
export default useAttendance;
