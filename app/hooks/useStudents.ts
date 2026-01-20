/**
 * 학생 목록 관리를 위한 SWR 훅
 * Vercel Best Practice: client-swr-dedup
 * - 자동 요청 중복 제거
 * - 캐싱 및 재검증
 * - 여러 컴포넌트에서 동일 요청 공유
 */

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';
import { StudentListItem, StudentFilter, CreateStudentInput, UpdateStudentInput } from '@/types/student';

// API 응답 타입
interface StudentsResponse {
  success: boolean;
  data: {
    students: StudentListItem[];
    total: number;
  };
  error?: string;
}

// fetcher 함수
const fetcher = async (url: string): Promise<StudentsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('학생 목록을 불러오는데 실패했습니다.');
  }
  return response.json();
};

// 필터를 URL 파라미터로 변환
function buildStudentsUrl(filter: StudentFilter, search?: string): string {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (filter.grade) params.append('grade', filter.grade);
  if (filter.className) params.append('className', filter.className);
  if (filter.status) params.append('status', filter.status);
  if (filter.subject) params.append('subject', filter.subject);

  const queryString = params.toString();
  return `/api/students${queryString ? `?${queryString}` : ''}`;
}

// 학생 목록 조회 훅
export function useStudents(filter: StudentFilter = {}, search?: string) {
  const url = buildStudentsUrl(filter, search);

  const { data, error, isLoading, isValidating } = useSWR<StudentsResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000, // 2초 내 동일 요청 중복 제거
    }
  );

  // Vercel Best Practice: js-set-map-lookups
  // 학생 검색을 위한 Map 인덱스 생성 (O(1) 조회)
  const studentMap = useMemo(() => {
    if (!data?.data?.students) return new Map<string, StudentListItem>();
    return new Map(data.data.students.map(student => [student.id, student]));
  }, [data?.data?.students]);

  // 이름으로 빠른 검색을 위한 인덱스 (O(1) 조회)
  const studentNameIndex = useMemo(() => {
    if (!data?.data?.students) return new Map<string, StudentListItem[]>();
    const index = new Map<string, StudentListItem[]>();
    data.data.students.forEach(student => {
      // 이름의 첫 글자로 인덱싱
      const firstChar = student.name[0];
      const existing = index.get(firstChar) || [];
      index.set(firstChar, [...existing, student]);
    });
    return index;
  }, [data?.data?.students]);

  // ID로 학생 찾기 (O(1))
  const getStudentById = useCallback((id: string): StudentListItem | undefined => {
    return studentMap.get(id);
  }, [studentMap]);

  // 이름 첫 글자로 학생 찾기 (O(1))
  const getStudentsByInitial = useCallback((initial: string): StudentListItem[] => {
    return studentNameIndex.get(initial) || [];
  }, [studentNameIndex]);

  return {
    students: data?.data?.students || [],
    totalCount: data?.data?.total || 0,
    isLoading,
    isValidating,
    error,
    getStudentById,
    getStudentsByInitial,
    studentMap,
  };
}

// 학생 생성 mutation
export async function createStudent(data: CreateStudentInput): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (result.success) {
    // SWR 캐시 무효화하여 목록 새로고침
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/students'));
  }

  return result;
}

// 학생 수정 mutation
export async function updateStudent(id: string, data: UpdateStudentInput): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/students/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (result.success) {
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/students'));
  }

  return result;
}

// 학생 삭제 mutation
export async function deleteStudent(id: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/students/${id}`, {
    method: 'DELETE',
  });

  const result = await response.json();

  if (result.success) {
    await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/students'));
  }

  return result;
}
