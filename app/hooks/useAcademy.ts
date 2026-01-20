/**
 * 학원 정보 관리를 위한 SWR 훅
 * PRD F6: 학원 정보 관리
 *
 * Vercel Best Practice: client-swr-dedup
 * - 자동 요청 중복 제거
 * - 캐싱 및 재검증
 * - 여러 컴포넌트에서 동일 요청 공유
 */

import useSWR, { mutate } from 'swr';
import { useCallback } from 'react';
import {
  Academy,
  UpdateAcademyInput,
  LogoUploadResult,
  OperatingHours,
} from '@/types/academy';

// API 응답 타입
interface AcademyResponse {
  success: boolean;
  data?: Academy;
  error?: string;
}

// API 엔드포인트
const ACADEMY_API_URL = '/api/admin/academy';

// fetcher 함수
const fetcher = async (url: string): Promise<AcademyResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('학원 정보를 불러오는데 실패했습니다.');
  }
  return response.json();
};

// Mock 데이터 (개발용)
const mockAcademyData: Academy = {
  id: 'academy_001',
  name: '스마트 수학학원',
  address: '서울시 강남구 테헤란로 123 4층',
  phone: '02-1234-5678',
  email: 'contact@smartmath.kr',
  logoUrl: '',
  operatingHours: {
    weekdays: { start: '14:00', end: '22:00' },
    saturday: { start: '10:00', end: '18:00' },
    sunday: undefined,
  },
  subscription: {
    plan: 'pro',
    expiresAt: '2025-12-31',
    features: ['학생 100명까지', '월 1,000문제 생성', '상세 리포트', 'SMS 발송', '우선 지원'],
  },
  stats: {
    studentCount: 45,
    teacherCount: 5,
    classCount: 8,
  },
  createdAt: '2024-08-15',
  updatedAt: '2025-01-19',
};

// Mock fetcher (개발용)
const mockFetcher = async (): Promise<AcademyResponse> => {
  // API 호출 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    success: true,
    data: mockAcademyData,
  };
};

/**
 * 학원 정보 조회 훅
 * Vercel Best Practice: client-swr-dedup
 */
export function useAcademy() {
  const { data, error, isLoading, isValidating } = useSWR<AcademyResponse>(
    ACADEMY_API_URL,
    mockFetcher, // 개발 시 mockFetcher, 배포 시 fetcher로 교체
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // 5초 내 동일 요청 중복 제거
      fallbackData: { success: true, data: mockAcademyData }, // 초기 데이터
    }
  );

  // 학원 정보 업데이트
  const updateAcademy = useCallback(
    async (input: UpdateAcademyInput): Promise<{ success: boolean; error?: string }> => {
      try {
        // Optimistic update
        const currentData = data?.data;
        if (currentData) {
          const optimisticData: AcademyResponse = {
            success: true,
            data: { ...currentData, ...input, updatedAt: new Date().toISOString() },
          };
          mutate(ACADEMY_API_URL, optimisticData, false);
        }

        // 실제 API 호출 (개발 시 Mock)
        await new Promise((resolve) => setTimeout(resolve, 300));

        // API 호출 성공 후 재검증
        await mutate(ACADEMY_API_URL);

        return { success: true };
      } catch (err) {
        // 에러 시 롤백
        await mutate(ACADEMY_API_URL);
        return { success: false, error: '학원 정보 업데이트에 실패했습니다.' };
      }
    },
    [data]
  );

  // 로고 업로드
  const uploadLogo = useCallback(
    async (file: File): Promise<LogoUploadResult> => {
      try {
        // FormData 생성
        const formData = new FormData();
        formData.append('logo', file);

        // Mock 업로드 (개발용)
        await new Promise((resolve) => setTimeout(resolve, 800));
        const mockLogoUrl = URL.createObjectURL(file);

        // 실제 배포 시:
        // const response = await fetch(`${ACADEMY_API_URL}/logo`, {
        //   method: 'POST',
        //   body: formData,
        // });
        // const result = await response.json();

        // 학원 정보 업데이트
        await updateAcademy({ logoUrl: mockLogoUrl });

        return { success: true, logoUrl: mockLogoUrl };
      } catch {
        return { success: false, error: '로고 업로드에 실패했습니다.' };
      }
    },
    [updateAcademy]
  );

  // 운영 시간 업데이트
  const updateOperatingHours = useCallback(
    async (hours: OperatingHours): Promise<{ success: boolean; error?: string }> => {
      return updateAcademy({ operatingHours: hours });
    },
    [updateAcademy]
  );

  return {
    academy: data?.data || null,
    isLoading,
    isValidating,
    error,
    updateAcademy,
    uploadLogo,
    updateOperatingHours,
  };
}

/**
 * 학원 통계만 조회하는 훅 (가벼운 조회용)
 */
export function useAcademyStats() {
  const { academy, isLoading, error } = useAcademy();

  return {
    stats: academy?.stats || null,
    isLoading,
    error,
  };
}

/**
 * 구독 정보만 조회하는 훅
 */
export function useAcademySubscription() {
  const { academy, isLoading, error } = useAcademy();

  return {
    subscription: academy?.subscription || null,
    isLoading,
    error,
  };
}

export default useAcademy;
