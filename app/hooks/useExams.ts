'use client';

/**
 * EduFlow 시험 관리 훅
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 시험 목록 캐싱 및 중복 요청 방지
 * - async-parallel: 시험+성적 데이터 병렬 로딩
 *
 * @example
 * ```tsx
 * const { exams, allExams, statistics, isLoading, error, refresh } = useExams({
 *   status: 'scheduled',
 *   subject: '수학',
 * });
 * ```
 */

import useSWR from 'swr';
import { useCallback, useMemo } from 'react';
import {
  ExamListItem,
  ExamListResponse,
  ExamTab,
  ExamFilterOptions,
  ExamStatistics,
} from '@/types/exam';

// ============================================
// 타입 정의
// ============================================

/** 시험 목록 필터 옵션 */
export interface UseExamsFilter {
  status?: ExamTab;
  subject?: string;
  grade?: string;
  search?: string;
}

/** 훅 옵션 */
export interface UseExamsOptions {
  filter?: UseExamsFilter;
  page?: number;
  pageSize?: number;
}

/** 통계 데이터 응답 타입 */
interface ExamsStatsResponse {
  success: boolean;
  data?: {
    exams: ExamListItem[];
    total: number;
  };
  error?: string;
}

/** 시험 상세 응답 타입 */
interface ExamDetailResponse {
  success: boolean;
  data?: ExamListItem;
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
// 메인 훅
// ============================================

/**
 * useExams 훅
 *
 * 시험 목록과 전체 통계를 SWR로 관리합니다.
 * async-parallel 패턴으로 필터된 목록과 전체 목록을 병렬 로딩합니다.
 */
export function useExams(options: UseExamsOptions = {}) {
  const { filter, page = 1, pageSize = 20 } = options;

  // 필터된 시험 목록 API URL
  const filteredApiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('page_size', pageSize.toString());

    if (filter?.status) {
      params.set('status', filter.status);
    }
    if (filter?.subject) {
      params.set('subject', filter.subject);
    }
    if (filter?.grade) {
      params.set('grade', filter.grade);
    }
    if (filter?.search) {
      params.set('search', filter.search);
    }

    return `/api/exams?${params.toString()}`;
  }, [filter, page, pageSize]);

  // 전체 시험 목록 API URL (통계용)
  const allExamsApiUrl = '/api/exams?page_size=100';

  // async-parallel: 두 요청을 SWR로 병렬 실행
  // SWR이 자동으로 두 요청을 동시에 실행하고 캐싱합니다
  const {
    data: filteredData,
    error: filteredError,
    isLoading: filteredLoading,
    isValidating: filteredValidating,
    mutate: mutateFiltered,
  } = useSWR<ExamListResponse>(
    filteredApiUrl,
    fetcher,
    {
      // SWR 최적화 옵션 (client-swr-dedup)
      revalidateOnFocus: false,     // 포커스 시 재검증 비활성화
      revalidateIfStale: true,      // 오래된 데이터 자동 재검증
      dedupingInterval: 2000,       // 2초 내 중복 요청 방지
      keepPreviousData: true,       // 새 데이터 로딩 중 이전 데이터 유지
      errorRetryCount: 3,           // 에러 시 3번 재시도
    }
  );

  const {
    data: allData,
    error: allError,
    isLoading: allLoading,
    mutate: mutateAll,
  } = useSWR<ExamsStatsResponse>(
    allExamsApiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,       // 통계는 5초 내 중복 요청 방지
      keepPreviousData: true,
    }
  );

  // 전체 시험 목록
  const allExams = useMemo(() => {
    return allData?.data?.exams || [];
  }, [allData?.data?.exams]);

  // 필터된 시험 목록
  const exams = useMemo(() => {
    return filteredData?.data?.exams || [];
  }, [filteredData?.data?.exams]);

  // 탭별 시험 수 계산 (메모이제이션)
  const tabCounts = useMemo(() => {
    const counts = {
      scheduled: 0,
      in_progress: 0,
      completed: 0,
    };

    allExams.forEach((exam) => {
      const status = exam.status;
      if (status === 'scheduled') {
        counts.scheduled++;
      } else if (status === 'in_progress') {
        counts.in_progress++;
      } else if (status === 'completed' || status === 'cancelled') {
        counts.completed++;
      }
    });

    return counts;
  }, [allExams]);

  // 통계 계산 (메모이제이션)
  const statistics = useMemo((): ExamStatistics => {
    const completedExams = allExams.filter((e) => e.average_score !== null);
    const totalStudents = allExams.reduce((sum, e) => sum + e.student_count, 0);

    let averageScore: number | null = null;
    let highestScore: number | null = null;
    let lowestScore: number | null = null;

    if (completedExams.length > 0) {
      const scores = completedExams.map((e) => e.average_score!);
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      averageScore = Math.round(totalScore / completedExams.length);
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
    }

    return {
      total_students: totalStudents,
      not_started_count: 0, // API에서 제공하지 않음
      in_progress_count: tabCounts.in_progress,
      submitted_count: 0,   // API에서 제공하지 않음
      graded_count: 0,      // API에서 제공하지 않음
      average_score: averageScore,
      average_percentage: null,
      highest_score: highestScore,
      lowest_score: lowestScore,
      pass_count: 0,
      fail_count: 0,
      pass_rate: null,
      completion_rate: 0,
    };
  }, [allExams, tabCounts]);

  // 새로고침 함수 (두 요청 모두 새로고침)
  const refresh = useCallback(async () => {
    // async-parallel: 두 mutate를 Promise.all로 병렬 실행
    await Promise.all([
      mutateFiltered(),
      mutateAll(),
    ]);
  }, [mutateFiltered, mutateAll]);

  // 로딩 상태 (둘 중 하나라도 로딩 중이면 true)
  const isLoading = filteredLoading || allLoading;

  // 에러 상태
  const error = filteredError?.message || allError?.message || null;

  return {
    // 필터된 시험 목록
    exams,
    // 전체 시험 목록 (통계용)
    allExams,
    // 총 개수
    total: filteredData?.data?.total || 0,
    // 현재 페이지
    page: filteredData?.data?.page || 1,
    // 페이지 크기
    pageSize: filteredData?.data?.page_size || pageSize,
    // 탭별 카운트
    tabCounts,
    // 통계
    statistics,
    // 로딩 상태
    isLoading,
    // 유효성 검사 중 (백그라운드 새로고침)
    isValidating: filteredValidating,
    // 에러
    error,
    // 새로고침
    refresh,
    // mutate 함수들 (외부에서 직접 제어 필요시)
    mutate: mutateFiltered,
    mutateAll,
  };
}

// ============================================
// 단일 시험 조회 훅
// ============================================

/**
 * useExamDetail 훅
 *
 * 단일 시험의 상세 정보를 조회합니다.
 * bundle-preload와 함께 사용하여 hover 시 프리로드 가능합니다.
 */
export function useExamDetail(examId: string | null) {
  const apiUrl = examId ? `/api/exams/${examId}` : null;

  const { data, error, isLoading, mutate } = useSWR<ExamDetailResponse>(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    exam: data?.data,
    isLoading,
    error: error?.message,
    mutate,
  };
}

// ============================================
// 시험 상세 페이지 프리로드 함수
// ============================================

/**
 * 시험 상세 페이지 프리로드
 *
 * bundle-preload 패턴: hover/focus 시 시험 상세 데이터와 모듈을 미리 로드합니다.
 *
 * @example
 * ```tsx
 * <Link
 *   href={`/dashboard/exams/${exam.id}`}
 *   onMouseEnter={() => preloadExamDetail(exam.id)}
 *   onFocus={() => preloadExamDetail(exam.id)}
 * >
 *   {exam.title}
 * </Link>
 * ```
 */
export function preloadExamDetail(examId: string): void {
  if (typeof window === 'undefined') return;

  // 1. 시험 상세 데이터 프리로드
  fetch(`/api/exams/${examId}`).catch(() => {
    // 프리로드 실패는 무시 (실제 클릭 시 다시 요청)
  });

  // 2. 시험 상세 페이지 컴포넌트 프리로드 (있다면)
  // void import('@/app/dashboard/exams/[id]/page');
}

// 기본 export
export default useExams;
