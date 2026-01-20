/**
 * 강사 목록 관리를 위한 SWR 훅
 * Vercel Best Practice: client-swr-dedup
 * - 자동 요청 중복 제거
 * - 캐싱 및 재검증
 * - 여러 컴포넌트에서 동일 요청 공유
 */

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';
import {
  TeacherListItem,
  TeacherListResponse,
  TeacherDetailResponse,
  TeacherDetail,
  TeacherFilter,
  CreateTeacherInput,
  UpdateTeacherInput,
} from '@/types/teacher';

// fetcher 함수
const fetcher = async (url: string): Promise<TeacherListResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('강사 목록을 불러오는데 실패했습니다.');
  }
  return response.json();
};

// 상세 정보 fetcher
const detailFetcher = async (url: string): Promise<TeacherDetailResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('강사 상세 정보를 불러오는데 실패했습니다.');
  }
  return response.json();
};

// 필터를 URL 파라미터로 변환
function buildTeachersUrl(filter?: TeacherFilter): string {
  if (!filter) return '/api/teachers';

  const params = new URLSearchParams();
  if (filter.search) params.append('search', filter.search);
  if (filter.status) params.append('status', filter.status);
  if (filter.role) params.append('role', filter.role);
  if (filter.subject) params.append('subject', filter.subject);
  if (filter.class_id) params.append('class_id', filter.class_id);

  const queryString = params.toString();
  return `/api/teachers${queryString ? `?${queryString}` : ''}`;
}

/**
 * 강사 목록 조회 훅
 * Vercel Best Practice: client-swr-dedup - 자동 요청 중복 제거 및 캐싱
 */
export function useTeachers(filter?: TeacherFilter) {
  const url = buildTeachersUrl(filter);

  const { data, error, isLoading, isValidating } = useSWR<TeacherListResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000, // 2초 내 동일 요청 중복 제거
    }
  );

  // 안정적인 teachers 배열 참조를 위한 메모이제이션
  const teachers = useMemo(() => {
    return data?.data?.teachers || [];
  }, [data?.data?.teachers]);

  // Vercel Best Practice: js-index-maps
  // 강사 ID로 빠른 조회를 위한 Map 인덱스 생성 (O(1) 조회)
  const teacherMap = useMemo(() => {
    return new Map(teachers.map(teacher => [teacher.id, teacher]));
  }, [teachers]);

  // 과목별 인덱스 (O(1) 조회)
  const teachersBySubject = useMemo(() => {
    const index = new Map<string, TeacherListItem[]>();
    teachers.forEach(teacher => {
      teacher.subjects.forEach(subject => {
        const existing = index.get(subject) || [];
        index.set(subject, [...existing, teacher]);
      });
    });
    return index;
  }, [teachers]);

  // 상태별 인덱스 (O(1) 조회)
  const teachersByStatus = useMemo(() => {
    const index = new Map<string, TeacherListItem[]>();
    teachers.forEach(teacher => {
      const existing = index.get(teacher.status) || [];
      index.set(teacher.status, [...existing, teacher]);
    });
    return index;
  }, [teachers]);

  // 역할별 인덱스 (O(1) 조회)
  const teachersByRole = useMemo(() => {
    const index = new Map<string, TeacherListItem[]>();
    teachers.forEach(teacher => {
      const existing = index.get(teacher.role) || [];
      index.set(teacher.role, [...existing, teacher]);
    });
    return index;
  }, [teachers]);

  // 고유한 과목 목록
  const subjects = useMemo(() => {
    const allSubjects = teachers.flatMap(t => t.subjects);
    return Array.from(new Set(allSubjects));
  }, [teachers]);

  // 통계 계산 (메모이제이션)
  const stats = useMemo(() => {
    const totalTeachers = teachers.length;
    const activeTeachers = teachersByStatus.get('active')?.length || 0;
    const adminCount = teachersByRole.get('admin')?.length || 0;
    const teacherCount = teachersByRole.get('teacher')?.length || 0;
    return { totalTeachers, activeTeachers, adminCount, teacherCount };
  }, [teachers, teachersByStatus, teachersByRole]);

  // ID로 강사 찾기 (O(1))
  const getTeacherById = useCallback((id: string): TeacherListItem | undefined => {
    return teacherMap.get(id);
  }, [teacherMap]);

  // 과목으로 강사 찾기 (O(1))
  const getTeachersBySubject = useCallback((subject: string): TeacherListItem[] => {
    return teachersBySubject.get(subject) || [];
  }, [teachersBySubject]);

  // 상태로 강사 찾기 (O(1))
  const getTeachersByStatus = useCallback((status: string): TeacherListItem[] => {
    return teachersByStatus.get(status) || [];
  }, [teachersByStatus]);

  // 역할로 강사 찾기 (O(1))
  const getTeachersByRole = useCallback((role: string): TeacherListItem[] => {
    return teachersByRole.get(role) || [];
  }, [teachersByRole]);

  // 수동 새로고침
  const refresh = useCallback(() => {
    mutate(url);
  }, [url]);

  return {
    teachers,
    totalCount: data?.data?.total || 0,
    isLoading,
    isValidating,
    error,
    // Map 인덱스들
    teacherMap,
    teachersBySubject,
    teachersByStatus,
    teachersByRole,
    // 유틸리티
    subjects,
    stats,
    // 조회 함수들
    getTeacherById,
    getTeachersBySubject,
    getTeachersByStatus,
    getTeachersByRole,
    refresh,
  };
}

/**
 * 강사 상세 정보 조회 훅
 */
export function useTeacherDetail(teacherId: string | null) {
  const { data, error, isLoading, isValidating } = useSWR<TeacherDetailResponse>(
    teacherId ? `/api/teachers/${teacherId}` : null,
    detailFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    teacherDetail: data?.data || null,
    isLoading,
    isValidating,
    error,
  };
}

/**
 * 강사 생성 mutation
 * Vercel Best Practice: async-parallel
 * - 성공 시 캐시 무효화와 콜백 실행을 병렬로 처리
 */
export async function createTeacher(
  data: CreateTeacherInput
): Promise<{ success: boolean; error?: string; data?: TeacherDetail }> {
  const response = await fetch('/api/teachers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (result.success) {
    // SWR 캐시 무효화하여 목록 새로고침
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/teachers'));
  }

  return result;
}

/**
 * 강사 수정 mutation
 */
export async function updateTeacher(
  id: string,
  data: UpdateTeacherInput
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/teachers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (result.success) {
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/teachers'));
  }

  return result;
}

/**
 * 강사 삭제 mutation
 */
export async function deleteTeacher(id: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/teachers/${id}`, {
    method: 'DELETE',
  });

  const result = await response.json();

  if (result.success) {
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/teachers'));
  }

  return result;
}

/**
 * 강사에게 반 배정 mutation
 */
export async function assignClassesToTeacher(
  teacherId: string,
  classIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/teachers/${teacherId}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ class_ids: classIds }),
  });

  const result = await response.json();

  if (result.success) {
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/teachers'));
  }

  return result;
}

/**
 * 강사에서 반 배정 해제 mutation
 */
export async function removeClassesFromTeacher(
  teacherId: string,
  classIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/teachers/${teacherId}/classes`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ class_ids: classIds }),
  });

  const result = await response.json();

  if (result.success) {
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/teachers'));
  }

  return result;
}
