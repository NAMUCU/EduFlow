'use client';

/**
 * EduFlow 선생님용 과제 관리 훅
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 과제 목록 캐싱 및 중복 요청 방지
 * - async-parallel: 과제+학생 데이터 병렬 로딩
 *
 * @example
 * ```tsx
 * const {
 *   assignments,
 *   allAssignments,
 *   students,
 *   tabCounts,
 *   isLoading,
 *   error,
 *   refresh,
 * } = useAssignmentsTeacher({
 *   status: 'in_progress',
 *   search: '수학',
 * });
 * ```
 */

import useSWR from 'swr';
import { useMemo } from 'react';
import {
  AssignmentListItem,
  AssignmentTab,
} from '@/types/assignment';
import { Student, User } from '@/types/database';

// ============================================
// 타입 정의
// ============================================

/** 과제 필터 옵션 */
export interface TeacherAssignmentFilter {
  status?: AssignmentTab;
  search?: string;
}

/** API 응답 타입 */
interface AssignmentsResponse {
  success: boolean;
  data?: {
    assignments: AssignmentListItem[];
    total: number;
    page: number;
    page_size: number;
  };
  error?: string;
}

interface StudentsResponse {
  success: boolean;
  data?: {
    students: (Student & { user: User })[];
    total: number;
  };
  error?: string;
}

// ============================================
// Fetcher 함수
// ============================================

/**
 * API 요청 fetcher
 */
const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '데이터를 불러오는데 실패했습니다.');
  }
  return response.json();
};

// ============================================
// 훅 정의
// ============================================

interface UseAssignmentsTeacherOptions {
  filter?: TeacherAssignmentFilter;
  page?: number;
  pageSize?: number;
}

/**
 * useAssignmentsTeacher 훅
 *
 * 선생님용 과제 목록을 SWR로 관리합니다.
 * async-parallel: 과제와 학생 데이터를 병렬로 로딩합니다.
 * client-swr-dedup: 중복 요청 방지 및 자동 재검증 기능을 제공합니다.
 */
export function useAssignmentsTeacher(options: UseAssignmentsTeacherOptions = {}) {
  const { filter, page = 1, pageSize = 20 } = options;

  // 필터된 과제 API URL 생성
  const filteredApiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('page_size', pageSize.toString());

    if (filter?.status) {
      params.set('status', filter.status);
    }
    if (filter?.search) {
      params.set('search', filter.search);
    }

    return `/api/assignments?${params.toString()}`;
  }, [filter, page, pageSize]);

  // 전체 과제 API URL (통계용)
  const allAssignmentsUrl = '/api/assignments?page_size=100';

  // 학생 목록 API URL
  const studentsUrl = '/api/students?page_size=100';

  // async-parallel 규칙: SWR이 자동으로 병렬 요청 처리
  // client-swr-dedup 규칙: 동일 URL 요청 자동 중복 제거

  // 필터된 과제 목록 (현재 탭)
  const {
    data: filteredData,
    error: filteredError,
    isLoading: isFilteredLoading,
    isValidating: isFilteredValidating,
    mutate: mutateFiltered,
  } = useSWR<AssignmentsResponse>(
    filteredApiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 2000, // 2초 내 중복 요청 방지
      keepPreviousData: true, // 탭 전환 시 깜빡임 방지
      errorRetryCount: 3,
    }
  );

  // 전체 과제 목록 (통계용)
  const {
    data: allData,
    error: allError,
    isLoading: isAllLoading,
    mutate: mutateAll,
  } = useSWR<AssignmentsResponse>(
    allAssignmentsUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // 통계는 5초 캐싱
      keepPreviousData: true,
    }
  );

  // 학생 목록 (과제 생성용)
  const {
    data: studentsData,
    error: studentsError,
    isLoading: isStudentsLoading,
  } = useSWR<StudentsResponse>(
    studentsUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 학생 목록은 10초 캐싱
      keepPreviousData: true,
    }
  );

  // js-combine-iterations 규칙: 탭별 과제 수를 한 번에 계산
  const tabCounts = useMemo(() => {
    const counts: Record<AssignmentTab, number> = {
      in_progress: 0,
      scheduled: 0,
      completed: 0,
    };

    const assignments = allData?.data?.assignments || [];
    for (let i = 0; i < assignments.length; i++) {
      const status = assignments[i].status as AssignmentTab;
      if (status in counts) {
        counts[status]++;
      }
    }

    return counts;
  }, [allData?.data?.assignments]);

  // 평균 제출률 계산
  const averageCompletionRate = useMemo(() => {
    const assignments = allData?.data?.assignments || [];
    if (assignments.length === 0) return 0;

    let totalStudents = 0;
    let totalCompleted = 0;

    for (let i = 0; i < assignments.length; i++) {
      totalStudents += assignments[i].student_count;
      totalCompleted += assignments[i].completed_count;
    }

    return totalStudents > 0 ? Math.round((totalCompleted / totalStudents) * 100) : 0;
  }, [allData?.data?.assignments]);

  // 새로고침 함수 - async-parallel 규칙: 병렬 새로고침
  const refresh = async () => {
    await Promise.all([mutateFiltered(), mutateAll()]);
  };

  // 로딩 상태 통합
  const isLoading = isFilteredLoading || isAllLoading || isStudentsLoading;
  const isValidating = isFilteredValidating;

  // 에러 통합
  const error = filteredError?.message || allError?.message || studentsError?.message;

  return {
    // 과제 데이터
    assignments: filteredData?.data?.assignments || [],
    allAssignments: allData?.data?.assignments || [],
    total: filteredData?.data?.total || 0,
    page: filteredData?.data?.page || 1,
    pageSize: filteredData?.data?.page_size || pageSize,

    // 학생 데이터
    students: studentsData?.data?.students || [],

    // 통계
    tabCounts,
    averageCompletionRate,

    // 상태
    isLoading,
    isValidating,
    error,

    // 액션
    refresh,
    mutateFiltered,
    mutateAll,
  };
}

// 기본 export
export default useAssignmentsTeacher;
