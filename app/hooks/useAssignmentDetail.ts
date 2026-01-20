'use client';

/**
 * EduFlow 과제 상세 조회 훅
 *
 * Vercel Best Practices 적용:
 * - async-parallel: Promise.all로 과제 정보, 제출물, 채점 결과 병렬 fetching
 * - client-swr-dedup: SWR로 클라이언트 캐싱 및 중복 요청 방지
 *
 * @example
 * ```tsx
 * const { assignment, submissions, grades, isLoading, error, mutate } = useAssignmentDetailData(assignmentId);
 * ```
 */

import useSWR from 'swr';
import { useMemo, useCallback } from 'react';
import {
  AssignmentDetail,
  StudentAssignmentDetail,
} from '@/types/assignment';

// ============================================
// 타입 정의
// ============================================

/** 과제 상세 API 응답 */
interface AssignmentDetailResponse {
  success: boolean;
  data?: AssignmentDetail;
  error?: string;
}

/** 제출물 목록 API 응답 */
interface SubmissionsResponse {
  success: boolean;
  data?: StudentAssignmentDetail[];
  error?: string;
}

/** 채점 결과 API 응답 */
interface GradingResultsResponse {
  success: boolean;
  data?: GradingResult[];
  error?: string;
}

/** 채점 결과 타입 */
export interface GradingResult {
  id: string;
  student_assignment_id: string;
  student_id: string;
  student_name: string;
  score: number | null;
  max_score: number;
  is_graded: boolean;
  graded_at: string | null;
  graded_by: string | null;
  feedback: string | null;
  problem_results: ProblemResult[];
}

/** 문제별 채점 결과 */
export interface ProblemResult {
  problem_id: string;
  student_answer: string;
  is_correct: boolean | null;
  score: number | null;
  max_score: number;
  feedback: string | null;
}

/** 훅 반환 타입 */
export interface UseAssignmentDetailReturn {
  assignment: AssignmentDetail | null;
  submissions: StudentAssignmentDetail[];
  gradingResults: GradingResult[];
  statistics: AssignmentStatistics | null;
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  mutate: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

/** 통계 타입 */
export interface AssignmentStatistics {
  total_students: number;
  not_started_count: number;
  in_progress_count: number;
  submitted_count: number;
  graded_count: number;
  completion_rate: number;
  average_score: number | null;
  highest_score: number | null;
  lowest_score: number | null;
}

// ============================================
// Fetcher 함수들
// ============================================

/**
 * 기본 fetcher - 에러 처리 포함
 */
const baseFetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '데이터를 불러오는데 실패했습니다.');
  }
  return response.json();
};

/**
 * async-parallel: Promise.all을 사용한 병렬 데이터 fetching
 * 과제 정보, 제출물, 채점 결과를 동시에 가져옵니다.
 */
const parallelFetcher = async (
  assignmentId: string
): Promise<{
  assignment: AssignmentDetailResponse;
  submissions: SubmissionsResponse;
  gradingResults: GradingResultsResponse;
}> => {
  // Promise.all로 독립적인 API 호출 병렬 실행 (async-parallel 패턴)
  const [assignment, submissions, gradingResults] = await Promise.all([
    baseFetcher<AssignmentDetailResponse>(`/api/assignments/${assignmentId}`),
    baseFetcher<SubmissionsResponse>(`/api/assignments/${assignmentId}/submissions`),
    baseFetcher<GradingResultsResponse>(`/api/assignments/${assignmentId}/grading-results`),
  ]);

  return { assignment, submissions, gradingResults };
};

// ============================================
// 훅 정의
// ============================================

/**
 * useAssignmentDetailData 훅
 *
 * 과제 상세 정보를 SWR로 관리하며, 병렬 fetching을 통해 성능을 최적화합니다.
 *
 * Vercel Best Practices:
 * - client-swr-dedup: 중복 요청 방지 및 자동 캐싱
 * - async-parallel: Promise.all로 3개 API 동시 호출
 *
 * @param assignmentId - 과제 ID (null이면 fetch하지 않음)
 */
export function useAssignmentDetailData(
  assignmentId: string | null
): UseAssignmentDetailReturn {
  // SWR 키 생성 (null이면 fetch 비활성화)
  const swrKey = assignmentId ? `assignment-detail-${assignmentId}` : null;

  // SWR 훅 - client-swr-dedup 패턴 적용
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    swrKey,
    () => (assignmentId ? parallelFetcher(assignmentId) : null),
    {
      // SWR 최적화 옵션
      revalidateOnFocus: false, // 포커스 시 재검증 비활성화
      revalidateIfStale: true,  // 오래된 데이터 자동 재검증
      dedupingInterval: 3000,   // 3초 내 중복 요청 방지
      keepPreviousData: true,   // 새 데이터 로딩 중 이전 데이터 유지
      errorRetryCount: 3,       // 에러 시 3번 재시도
      errorRetryInterval: 1000, // 재시도 간격 1초
    }
  );

  // 과제 정보 추출
  const assignment = useMemo(() => {
    return data?.assignment?.data ?? null;
  }, [data?.assignment?.data]);

  // 제출물 목록 추출 (API 실패 시 과제 데이터에서 가져옴)
  const submissions = useMemo(() => {
    if (data?.submissions?.data) {
      return data.submissions.data;
    }
    // fallback: 과제 데이터의 student_assignments 사용
    return assignment?.student_assignments ?? [];
  }, [data?.submissions?.data, assignment?.student_assignments]);

  // 채점 결과 추출
  const gradingResults = useMemo(() => {
    return data?.gradingResults?.data ?? [];
  }, [data?.gradingResults?.data]);

  // 통계 계산
  const statistics = useMemo((): AssignmentStatistics | null => {
    if (!assignment) return null;
    return assignment.statistics;
  }, [assignment]);

  // 전체 새로고침 함수
  const refreshAll = useCallback(async () => {
    await mutate();
  }, [mutate]);

  // 에러 메시지 추출
  const errorMessage = useMemo(() => {
    if (error) return error.message;
    if (data?.assignment?.error) return data.assignment.error;
    return null;
  }, [error, data?.assignment?.error]);

  return {
    assignment,
    submissions,
    gradingResults,
    statistics,
    isLoading,
    isValidating,
    error: errorMessage,
    mutate: refreshAll,
    refreshAll,
  };
}

// ============================================
// 개별 데이터 훅들 (선택적 사용)
// ============================================

/**
 * useAssignmentInfo 훅
 * 과제 기본 정보만 조회합니다.
 */
export function useAssignmentInfo(assignmentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<AssignmentDetailResponse>(
    assignmentId ? `/api/assignments/${assignmentId}` : null,
    baseFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3000,
    }
  );

  return {
    assignment: data?.data ?? null,
    isLoading,
    error: error?.message ?? null,
    mutate,
  };
}

/**
 * useAssignmentSubmissions 훅
 * 제출물 목록만 조회합니다.
 */
export function useAssignmentSubmissions(assignmentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<SubmissionsResponse>(
    assignmentId ? `/api/assignments/${assignmentId}/submissions` : null,
    baseFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3000,
    }
  );

  return {
    submissions: data?.data ?? [],
    isLoading,
    error: error?.message ?? null,
    mutate,
  };
}

/**
 * useGradingResults 훅
 * 채점 결과만 조회합니다.
 */
export function useGradingResults(assignmentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<GradingResultsResponse>(
    assignmentId ? `/api/assignments/${assignmentId}/grading-results` : null,
    baseFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3000,
    }
  );

  return {
    gradingResults: data?.data ?? [],
    isLoading,
    error: error?.message ?? null,
    mutate,
  };
}

// 기본 export
export default useAssignmentDetailData;
