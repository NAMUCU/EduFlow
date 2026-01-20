'use client';

/**
 * EduFlow 과제 관리 훅
 *
 * SWR을 사용하여 과제 목록을 관리합니다.
 * client-swr-dedup 패턴을 적용하여 중복 요청을 방지합니다.
 *
 * @example
 * ```tsx
 * const { assignments, isLoading, error, mutate } = useAssignments({
 *   studentId: 'student-001',
 *   status: 'in_progress',
 * });
 * ```
 */

import useSWR from 'swr';
import { useCallback, useMemo } from 'react';
import {
  AssignmentListItem,
  AssignmentFilterOptions,
  AssignmentTab,
} from '@/types/assignment';

// ============================================
// 타입 정의
// ============================================

/** 학생용 과제 목록 아이템 */
export interface StudentAssignmentItem {
  id: string;
  assignment_id: string;
  title: string;
  description: string | null;
  subject: string;
  chapter: string | null;
  due_date: string | null;
  problem_count: number;
  completed_count: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  score: number | null;
  max_score: number;
  difficulty: '하' | '중' | '상';
  teacher_name: string;
  started_at: string | null;
  submitted_at: string | null;
}

/** 과제 필터 옵션 */
export interface StudentAssignmentFilter {
  status?: 'all' | 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'completed';
  subject?: string;
  search?: string;
}

/** API 응답 타입 */
interface StudentAssignmentsResponse {
  success: boolean;
  data?: {
    assignments: StudentAssignmentItem[];
    total: number;
    page: number;
    page_size: number;
  };
  error?: string;
}

// ============================================
// Fetcher 함수
// ============================================

/**
 * API 요청 fetcher
 */
const fetcher = async (url: string): Promise<StudentAssignmentsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '과제 목록을 불러오는데 실패했습니다.');
  }
  return response.json();
};

// ============================================
// 훅 정의
// ============================================

interface UseAssignmentsOptions {
  studentId?: string;
  filter?: StudentAssignmentFilter;
  page?: number;
  pageSize?: number;
}

/**
 * useAssignments 훅
 *
 * 학생의 과제 목록을 SWR로 관리합니다.
 * 중복 요청 방지 및 자동 재검증 기능을 제공합니다.
 */
export function useAssignments(options: UseAssignmentsOptions = {}) {
  const { studentId, filter, page = 1, pageSize = 10 } = options;

  // API URL 생성
  const apiUrl = useMemo(() => {
    if (!studentId) return null;

    const params = new URLSearchParams();
    params.set('student_id', studentId);
    params.set('page', page.toString());
    params.set('page_size', pageSize.toString());

    if (filter?.status && filter.status !== 'all') {
      params.set('status', filter.status);
    }
    if (filter?.subject) {
      params.set('subject', filter.subject);
    }
    if (filter?.search) {
      params.set('search', filter.search);
    }

    return `/api/assignments/student?${params.toString()}`;
  }, [studentId, filter, page, pageSize]);

  // SWR 훅
  const { data, error, isLoading, isValidating, mutate } = useSWR<StudentAssignmentsResponse>(
    apiUrl,
    fetcher,
    {
      // SWR 최적화 옵션
      revalidateOnFocus: false, // 포커스 시 재검증 비활성화
      revalidateIfStale: true,  // 오래된 데이터 자동 재검증
      dedupingInterval: 2000,   // 2초 내 중복 요청 방지
      keepPreviousData: true,   // 새 데이터 로딩 중 이전 데이터 유지
      errorRetryCount: 3,       // 에러 시 3번 재시도
    }
  );

  // 과제 목록 필터링 (클라이언트 사이드)
  const filteredAssignments = useMemo(() => {
    if (!data?.data?.assignments) return [];

    let assignments = [...data.data.assignments];

    // 상태 필터링 (completed는 submitted + graded 포함)
    if (filter?.status === 'completed') {
      assignments = assignments.filter(
        (a) => a.status === 'submitted' || a.status === 'graded'
      );
    }

    return assignments;
  }, [data?.data?.assignments, filter?.status]);

  // 과제 상태별 카운트
  const statusCounts = useMemo(() => {
    const assignments = data?.data?.assignments || [];
    return {
      all: assignments.length,
      not_started: assignments.filter((a) => a.status === 'not_started').length,
      in_progress: assignments.filter((a) => a.status === 'in_progress').length,
      submitted: assignments.filter((a) => a.status === 'submitted').length,
      graded: assignments.filter((a) => a.status === 'graded').length,
      completed: assignments.filter(
        (a) => a.status === 'submitted' || a.status === 'graded'
      ).length,
    };
  }, [data?.data?.assignments]);

  // 새로고침 함수
  const refresh = useCallback(() => {
    return mutate();
  }, [mutate]);

  return {
    assignments: filteredAssignments,
    allAssignments: data?.data?.assignments || [],
    total: data?.data?.total || 0,
    page: data?.data?.page || 1,
    pageSize: data?.data?.page_size || pageSize,
    statusCounts,
    isLoading,
    isValidating,
    error: error?.message,
    refresh,
    mutate,
  };
}

// ============================================
// 단일 과제 조회 훅
// ============================================

interface StudentAssignmentDetail {
  id: string;
  assignment_id: string;
  title: string;
  description: string | null;
  subject: string;
  chapter: string | null;
  due_date: string | null;
  time_limit: number | null;
  problems: AssignmentProblem[];
  answers: StudentAnswer[];
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  score: number | null;
  max_score: number;
  started_at: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  feedback: string | null;
}

interface AssignmentProblem {
  id: string;
  number: number;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'essay';
  options?: { id: number; text: string }[];
  points: number;
  hint?: string;
  image_url?: string;
}

interface StudentAnswer {
  problem_id: string;
  answer: string;
  is_correct: boolean | null;
  score: number | null;
  feedback?: string;
  answered_at: string | null;
  image_url?: string;
}

interface StudentAssignmentDetailResponse {
  success: boolean;
  data?: StudentAssignmentDetail;
  error?: string;
}

/**
 * 상세 조회용 fetcher
 */
const detailFetcher = async (url: string): Promise<StudentAssignmentDetailResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '과제 상세 정보를 불러오는데 실패했습니다.');
  }
  return response.json();
};

/**
 * useAssignmentDetail 훅
 *
 * 단일 과제의 상세 정보를 조회합니다.
 */
export function useAssignmentDetail(studentAssignmentId: string | null) {
  const apiUrl = studentAssignmentId
    ? `/api/assignments/student/${studentAssignmentId}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<StudentAssignmentDetailResponse>(
    apiUrl,
    detailFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    assignment: data?.data,
    isLoading,
    error: error?.message,
    mutate,
  };
}

// 기본 export
export default useAssignments;
