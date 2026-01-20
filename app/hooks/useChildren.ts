'use client';

/**
 * useChildren 훅
 *
 * 학부모가 등록한 자녀 정보를 관리하는 커스텀 훅입니다.
 * SWR을 사용하여 자녀 목록을 캐싱하고 자동으로 요청을 중복 제거합니다.
 *
 * Vercel Best Practices:
 * - client-swr-dedup: SWR로 자동 요청 중복 제거
 */

import useSWR from 'swr';
import { useAuth } from './useAuth';

// 자녀 정보 타입
export interface Child {
  id: string;
  name: string;
  grade: string;
  school: string;
  className?: string;
  subjects: string[];
  profileImage?: string;
}

// 자녀 목록 응답 타입
interface ChildrenResponse {
  success: boolean;
  data?: {
    children: Child[];
  };
  error?: string;
}

// SWR fetcher 함수
const fetcher = async (url: string): Promise<ChildrenResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('자녀 정보를 불러오는데 실패했습니다.');
  }
  return res.json();
};

/**
 * useChildren 훅
 *
 * 현재 로그인한 학부모의 자녀 목록을 조회합니다.
 * SWR을 사용하여 캐싱 및 자동 갱신을 처리합니다.
 */
export function useChildren() {
  const { user } = useAuth();

  // SWR로 자녀 목록 조회 (client-swr-dedup 적용)
  const { data, error, isLoading, mutate } = useSWR<ChildrenResponse>(
    user?.role === 'parent' ? `/api/parent/children?parentId=${user.id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1분간 중복 요청 방지
    }
  );

  // 자녀 목록 새로고침
  const refreshChildren = () => {
    mutate();
  };

  // 특정 자녀 정보 조회
  const getChildById = (childId: string): Child | undefined => {
    return data?.data?.children.find((child) => child.id === childId);
  };

  return {
    children: data?.data?.children ?? [],
    isLoading,
    isError: !!error,
    error: error?.message,
    refreshChildren,
    getChildById,
  };
}

// 단일 자녀 조회 응답 타입
interface ChildDetailResponse {
  success: boolean;
  data?: Child;
  error?: string;
}

// 단일 자녀 조회용 fetcher
const detailFetcher = async (url: string): Promise<ChildDetailResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('자녀 정보를 불러오는데 실패했습니다.');
  }
  return res.json();
};

/**
 * useChild 훅
 *
 * 특정 자녀의 상세 정보를 조회합니다.
 */
export function useChild(childId: string | null) {
  const { data, error, isLoading } = useSWR<ChildDetailResponse>(
    childId ? `/api/parent/children/${childId}` : null,
    detailFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    child: data?.data,
    isLoading,
    isError: !!error,
    error: error?.message,
  };
}

// 기본 Mock 데이터 (API 연동 전까지 사용)
export const MOCK_CHILDREN: Child[] = [
  {
    id: 'STU001',
    name: '김민준',
    grade: '중2',
    school: '분당중학교',
    className: 'A반',
    subjects: ['수학', '영어'],
  },
  {
    id: 'STU002',
    name: '이서연',
    grade: '중3',
    school: '정자중학교',
    className: '심화반',
    subjects: ['수학', '영어', '과학'],
  },
];

export default useChildren;
