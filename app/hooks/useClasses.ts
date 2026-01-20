/**
 * 반 목록 관리를 위한 SWR 훅
 * Vercel Best Practice: client-swr-dedup
 * - 자동 요청 중복 제거
 * - 캐싱 및 재검증
 * - 여러 컴포넌트에서 동일 요청 공유
 */

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';
import {
  ClassListItem,
  ClassListResponse,
  ClassFilterOptions,
  CreateClass,
  UpdateClass,
  ClassDetail,
  ClassDetailResponse,
} from '@/types/class';

// fetcher 함수
const fetcher = async (url: string): Promise<ClassListResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('반 목록을 불러오는데 실패했습니다.');
  }
  return response.json();
};

// 상세 정보 fetcher
const detailFetcher = async (url: string): Promise<ClassDetailResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('반 상세 정보를 불러오는데 실패했습니다.');
  }
  return response.json();
};

// 필터를 URL 파라미터로 변환
function buildClassesUrl(filter?: ClassFilterOptions): string {
  if (!filter) return '/api/classes';

  const params = new URLSearchParams();
  if (filter.search) params.append('search', filter.search);
  if (filter.status) params.append('status', filter.status);
  if (filter.subject) params.append('subject', filter.subject);
  if (filter.grade) params.append('grade', filter.grade);
  if (filter.teacher_id) params.append('teacher_id', filter.teacher_id);

  const queryString = params.toString();
  return `/api/classes${queryString ? `?${queryString}` : ''}`;
}

/**
 * 반 목록 조회 훅
 * Vercel Best Practice: client-swr-dedup - 자동 요청 중복 제거 및 캐싱
 */
export function useClasses(filter?: ClassFilterOptions) {
  const url = buildClassesUrl(filter);

  const { data, error, isLoading, isValidating } = useSWR<ClassListResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000, // 2초 내 동일 요청 중복 제거
    }
  );

  const classes = data?.data?.classes || [];

  // Vercel Best Practice: js-index-maps
  // 반 ID로 빠른 조회를 위한 Map 인덱스 생성 (O(1) 조회)
  const classMap = useMemo(() => {
    return new Map(classes.map(cls => [cls.id, cls]));
  }, [classes]);

  // 과목별 인덱스 (O(1) 조회)
  const classesBySubject = useMemo(() => {
    const index = new Map<string, ClassListItem[]>();
    classes.forEach(cls => {
      const existing = index.get(cls.subject) || [];
      index.set(cls.subject, [...existing, cls]);
    });
    return index;
  }, [classes]);

  // 상태별 인덱스 (O(1) 조회)
  const classesByStatus = useMemo(() => {
    const index = new Map<string, ClassListItem[]>();
    classes.forEach(cls => {
      const existing = index.get(cls.status) || [];
      index.set(cls.status, [...existing, cls]);
    });
    return index;
  }, [classes]);

  // 고유한 과목 목록
  const subjects = useMemo(() => {
    return Array.from(new Set(classes.map(c => c.subject)));
  }, [classes]);

  // 통계 계산 (메모이제이션)
  const stats = useMemo(() => {
    const totalClasses = classes.length;
    const activeClasses = classesByStatus.get('active')?.length || 0;
    const totalStudents = classes.reduce((sum, c) => sum + c.student_count, 0);
    return { totalClasses, activeClasses, totalStudents };
  }, [classes, classesByStatus]);

  // ID로 반 찾기 (O(1))
  const getClassById = useCallback((id: string): ClassListItem | undefined => {
    return classMap.get(id);
  }, [classMap]);

  // 과목으로 반 찾기 (O(1))
  const getClassesBySubject = useCallback((subject: string): ClassListItem[] => {
    return classesBySubject.get(subject) || [];
  }, [classesBySubject]);

  // 상태로 반 찾기 (O(1))
  const getClassesByStatus = useCallback((status: string): ClassListItem[] => {
    return classesByStatus.get(status) || [];
  }, [classesByStatus]);

  // 수동 새로고침
  const refresh = useCallback(() => {
    mutate(url);
  }, [url]);

  return {
    classes,
    totalCount: data?.data?.total || 0,
    isLoading,
    isValidating,
    error,
    // Map 인덱스들
    classMap,
    classesBySubject,
    classesByStatus,
    // 유틸리티
    subjects,
    stats,
    // 조회 함수들
    getClassById,
    getClassesBySubject,
    getClassesByStatus,
    refresh,
  };
}

/**
 * 반 상세 정보 조회 훅
 */
export function useClassDetail(classId: string | null) {
  const { data, error, isLoading, isValidating } = useSWR<ClassDetailResponse>(
    classId ? `/api/classes/${classId}` : null,
    detailFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    classDetail: data?.data || null,
    isLoading,
    isValidating,
    error,
  };
}

/**
 * 반 생성 mutation
 * Vercel Best Practice: async-parallel
 * - 성공 시 캐시 무효화와 콜백 실행을 병렬로 처리
 */
export async function createClass(
  data: CreateClass
): Promise<{ success: boolean; error?: string; data?: ClassDetail }> {
  const response = await fetch('/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (result.success) {
    // SWR 캐시 무효화하여 목록 새로고침
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/classes'));
  }

  return result;
}

/**
 * 반 수정 mutation
 */
export async function updateClass(
  id: string,
  data: UpdateClass
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/classes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (result.success) {
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/classes'));
  }

  return result;
}

/**
 * 반 삭제 mutation
 */
export async function deleteClass(id: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/classes/${id}`, {
    method: 'DELETE',
  });

  const result = await response.json();

  if (result.success) {
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/classes'));
  }

  return result;
}

/**
 * 반에 학생 추가 mutation
 */
export async function addStudentsToClass(
  classId: string,
  studentIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/classes/${classId}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_ids: studentIds }),
  });

  const result = await response.json();

  if (result.success) {
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/classes'));
  }

  return result;
}

/**
 * 반에서 학생 제거 mutation
 */
export async function removeStudentsFromClass(
  classId: string,
  studentIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/classes/${classId}/students`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_ids: studentIds }),
  });

  const result = await response.json();

  if (result.success) {
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/classes'));
  }

  return result;
}
