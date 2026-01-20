'use client';

/**
 * useConsultations 훅
 *
 * 상담 목록 및 상세 정보를 관리하는 커스텀 훅입니다.
 * SWR을 사용하여 상담 데이터를 캐싱하고 자동으로 요청을 중복 제거합니다.
 *
 * Vercel Best Practices:
 * - client-swr-dedup: SWR로 자동 요청 중복 제거
 * - async-parallel: 학생정보+상담기록 병렬 로딩
 * - rerender-functional-setstate: 안정적인 콜백 패턴
 */

import useSWR, { mutate as globalMutate } from 'swr';
import useSWRMutation from 'swr/mutation';
import { useCallback, useMemo } from 'react';
import {
  ConsultationListItem,
  ConsultationDetail,
  CreateConsultationInput,
  UpdateConsultationInput,
} from '@/types/consultation';
import { ConsultationType, ConsultationStatus } from '@/types/database';

// ============================================
// 타입 정의
// ============================================

/** 학생 옵션 타입 */
export interface StudentOption {
  id: string;
  name: string;
  grade: string;
  school: string;
}

/** 상담 통계 */
export interface ConsultationStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  thisMonth: number;
  thisWeek: number;
}

/** 상담 필터 */
export interface ConsultationFilter {
  search?: string;
  status?: ConsultationStatus | '';
  type?: ConsultationType | '';
}

/** API 응답 타입 */
interface ConsultationsResponse {
  success: boolean;
  data?: {
    consultations: ConsultationListItem[];
    total: number;
  };
  error?: string;
}

interface ConsultationDetailResponse {
  success: boolean;
  data?: ConsultationDetail;
  error?: string;
}

interface ConsultationStatsResponse {
  success: boolean;
  data?: ConsultationStats;
  error?: string;
}

interface StudentsResponse {
  success: boolean;
  data?: {
    students: Array<{
      id: string;
      name: string;
      grade: string;
      school: string;
    }>;
  };
  error?: string;
}

interface MutationResponse {
  success: boolean;
  data?: ConsultationDetail;
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

/**
 * 상담 생성 mutation fetcher
 */
const createConsultationFetcher = async (
  url: string,
  { arg }: { arg: CreateConsultationInput }
): Promise<MutationResponse> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '상담 예약에 실패했습니다.');
  }
  return response.json();
};

/**
 * 상담 수정 mutation fetcher
 */
const updateConsultationFetcher = async (
  url: string,
  { arg }: { arg: UpdateConsultationInput }
): Promise<MutationResponse> => {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '상담 수정에 실패했습니다.');
  }
  return response.json();
};

/**
 * 상담 삭제 mutation fetcher
 */
const deleteConsultationFetcher = async (url: string): Promise<MutationResponse> => {
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '상담 취소에 실패했습니다.');
  }
  return response.json();
};

// ============================================
// URL 빌더
// ============================================

/**
 * 필터로부터 쿼리 스트링 생성
 */
const buildQueryString = (filter: ConsultationFilter): string => {
  const params = new URLSearchParams();
  if (filter.search) params.append('search', filter.search);
  if (filter.status) params.append('status', filter.status);
  if (filter.type) params.append('type', filter.type);
  return params.toString();
};

// ============================================
// 훅 정의
// ============================================

/**
 * useConsultations 훅
 *
 * 상담 목록을 SWR로 관리합니다.
 * 중복 요청 방지 및 자동 재검증 기능을 제공합니다.
 */
export function useConsultations(filter: ConsultationFilter = {}) {
  const queryString = buildQueryString(filter);
  const url = `/api/consultations${queryString ? `?${queryString}` : ''}`;

  // SWR로 상담 목록 조회 (client-swr-dedup 적용)
  const { data, error, isLoading, mutate } = useSWR<ConsultationsResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 5000, // 5초 내 중복 요청 방지
      keepPreviousData: true,
      errorRetryCount: 3,
    }
  );

  // 새로고침 함수 (stable callback)
  const refresh = useCallback(() => {
    return mutate();
  }, [mutate]);

  return {
    consultations: data?.data?.consultations ?? [],
    total: data?.data?.total ?? 0,
    isLoading,
    isError: !!error,
    error: error instanceof Error ? error.message : null,
    refresh,
    mutate,
  };
}

/**
 * useConsultationStats 훅
 *
 * 상담 통계를 SWR로 관리합니다.
 */
export function useConsultationStats() {
  const { data, error, isLoading, mutate } = useSWR<ConsultationStatsResponse>(
    '/api/consultations?stats=true',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30초 내 중복 요청 방지
    }
  );

  const defaultStats: ConsultationStats = {
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    thisMonth: 0,
    thisWeek: 0,
  };

  return {
    stats: data?.data ?? defaultStats,
    isLoading,
    isError: !!error,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  };
}

/**
 * useStudentOptions 훅
 *
 * 학생 목록(상담 예약용)을 SWR로 관리합니다.
 */
export function useStudentOptions() {
  const { data, error, isLoading } = useSWR<StudentsResponse>(
    '/api/students?pageSize=100',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 내 중복 요청 방지 (학생 목록은 자주 변하지 않음)
    }
  );

  const students: StudentOption[] = useMemo(() => {
    if (!data?.data?.students) return [];
    return data.data.students.map((s) => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      school: s.school,
    }));
  }, [data?.data?.students]);

  return {
    students,
    isLoading,
    isError: !!error,
    error: error instanceof Error ? error.message : null,
  };
}

/**
 * useConsultationDetail 훅
 *
 * 특정 상담의 상세 정보를 조회합니다.
 */
export function useConsultationDetail(consultationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ConsultationDetailResponse>(
    consultationId ? `/api/consultations/${consultationId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    consultation: data?.data ?? null,
    isLoading,
    isError: !!error,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  };
}

/**
 * useConsultationData 훅
 *
 * 상담 관리에 필요한 모든 데이터를 병렬로 로드합니다.
 * async-parallel 패턴 적용: 학생정보+상담기록+통계를 동시에 가져옵니다.
 *
 * SWR이 각 훅을 독립적으로 관리하므로, 자동으로 병렬 요청이 실행됩니다.
 */
export function useConsultationData(filter: ConsultationFilter = {}) {
  // 병렬로 3개의 SWR 훅 호출 (async-parallel)
  const consultationsResult = useConsultations(filter);
  const statsResult = useConsultationStats();
  const studentsResult = useStudentOptions();

  // 전체 로딩 상태
  const isLoading = consultationsResult.isLoading || statsResult.isLoading || studentsResult.isLoading;

  // 전체 에러 상태
  const error = consultationsResult.error || statsResult.error || studentsResult.error;

  // refresh 함수 참조 추출 (의존성 배열 최적화)
  const refreshConsultations = consultationsResult.refresh;
  const refreshStats = statsResult.refresh;

  // 전체 새로고침 (rerender-functional-setstate 패턴)
  const refreshAll = useCallback(() => {
    refreshConsultations();
    refreshStats();
  }, [refreshConsultations, refreshStats]);

  return {
    consultations: consultationsResult.consultations,
    stats: statsResult.stats,
    students: studentsResult.students,
    isLoading,
    isError: !!error,
    error,
    refreshAll,
    refreshConsultations,
    refreshStats,
  };
}

/**
 * useCreateConsultation 훅
 *
 * 상담 예약 생성을 위한 mutation 훅입니다.
 * useSWRMutation을 사용하여 상태 관리를 최적화합니다.
 */
export function useCreateConsultation() {
  const { trigger, isMutating, error, reset } = useSWRMutation(
    '/api/consultations',
    createConsultationFetcher
  );

  const createConsultation = useCallback(
    async (data: CreateConsultationInput) => {
      const result = await trigger(data);
      // 상담 목록 캐시 무효화
      globalMutate((key: string) => typeof key === 'string' && key.startsWith('/api/consultations'));
      return result;
    },
    [trigger]
  );

  return {
    createConsultation,
    isCreating: isMutating,
    error: error instanceof Error ? error.message : null,
    reset,
  };
}

/**
 * useUpdateConsultation 훅
 *
 * 상담 수정을 위한 mutation 훅입니다.
 */
export function useUpdateConsultation(consultationId: string | null) {
  const { trigger, isMutating, error, reset } = useSWRMutation(
    consultationId ? `/api/consultations/${consultationId}` : null,
    updateConsultationFetcher
  );

  const updateConsultation = useCallback(
    async (data: UpdateConsultationInput) => {
      if (!consultationId) return null;
      const result = await trigger(data);
      // 상담 목록 캐시 무효화
      globalMutate((key: string) => typeof key === 'string' && key.startsWith('/api/consultations'));
      return result;
    },
    [trigger, consultationId]
  );

  return {
    updateConsultation,
    isUpdating: isMutating,
    error: error instanceof Error ? error.message : null,
    reset,
  };
}

/**
 * useDeleteConsultation 훅
 *
 * 상담 취소를 위한 mutation 훅입니다.
 */
export function useDeleteConsultation() {
  const deleteConsultation = useCallback(async (consultationId: string) => {
    const result = await deleteConsultationFetcher(`/api/consultations/${consultationId}`);
    // 상담 목록 캐시 무효화
    globalMutate((key: string) => typeof key === 'string' && key.startsWith('/api/consultations'));
    return result;
  }, []);

  return {
    deleteConsultation,
  };
}

// 기본 export
export default useConsultations;
