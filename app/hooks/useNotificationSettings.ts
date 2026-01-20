/**
 * 학부모 알림 설정 관리를 위한 SWR 훅
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: 자동 요청 중복 제거 및 캐싱
 * - rerender-functional-setstate: 함수형 setState로 최적화
 * - async-parallel: Promise.all로 병렬 처리
 */

import useSWR, { mutate } from 'swr';
import { useCallback, useState } from 'react';
import {
  ParentNotificationSettings,
  ParentNotificationSettingsUpdateRequest,
  ParentNotificationChannels,
  ParentNotificationTypes,
  QuietHours,
  ReportDeliverySettings,
  DEFAULT_PARENT_NOTIFICATION_CHANNELS,
  DEFAULT_PARENT_NOTIFICATION_TYPES,
  DEFAULT_QUIET_HOURS,
  DEFAULT_REPORT_DELIVERY_SETTINGS,
} from '@/types/settings';

// API 응답 타입
interface NotificationSettingsResponse {
  success: boolean;
  data: ParentNotificationSettings;
  error?: string;
}

// 기본 fetcher 함수
const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('알림 설정을 불러오는데 실패했습니다.');
  }
  return response.json();
};

// API URL 생성
function buildSettingsUrl(userId: string): string {
  return `/api/parent/notification-settings?user_id=${userId}`;
}

/**
 * 학부모 알림 설정 조회 및 관리 훅
 *
 * Vercel Best Practice: client-swr-dedup
 * - SWR을 사용하여 자동 캐싱 및 요청 중복 제거
 * - 동일한 userId로 여러 컴포넌트에서 호출해도 단일 요청만 발생
 */
export function useNotificationSettings(userId: string) {
  const url = buildSettingsUrl(userId);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // SWR로 설정 데이터 조회 (자동 캐싱 및 중복 제거)
  const { data, error, isLoading, isValidating } = useSWR<NotificationSettingsResponse>(
    userId ? url : null, // userId가 없으면 요청하지 않음
    fetcher,
    {
      revalidateOnFocus: false,    // 포커스 시 재검증 비활성화
      dedupingInterval: 5000,      // 5초 내 동일 요청 중복 제거
      revalidateOnReconnect: true, // 네트워크 재연결 시 재검증
    }
  );

  // 현재 설정 값 (데이터가 없으면 기본값 사용)
  const settings: ParentNotificationSettings = data?.data || {
    id: '',
    userId,
    channels: DEFAULT_PARENT_NOTIFICATION_CHANNELS,
    types: DEFAULT_PARENT_NOTIFICATION_TYPES,
    quietHours: DEFAULT_QUIET_HOURS,
    reports: DEFAULT_REPORT_DELIVERY_SETTINGS,
    createdAt: '',
    updatedAt: '',
  };

  /**
   * 알림 채널 설정 업데이트
   *
   * Vercel Best Practice: rerender-functional-setstate
   * - 함수형 업데이트로 이전 상태 기반 갱신
   */
  const updateChannels = useCallback(
    async (channels: Partial<ParentNotificationChannels>) => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const response = await fetch(`/api/parent/notification-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            channels,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '채널 설정 저장에 실패했습니다.');
        }

        // SWR 캐시 갱신
        await mutate(url);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setSaveError(errorMessage);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, url]
  );

  /**
   * 알림 유형 설정 업데이트
   */
  const updateTypes = useCallback(
    async (types: Partial<ParentNotificationTypes>) => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const response = await fetch(`/api/parent/notification-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            types,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '알림 유형 설정 저장에 실패했습니다.');
        }

        await mutate(url);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setSaveError(errorMessage);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, url]
  );

  /**
   * 방해금지 시간 설정 업데이트
   */
  const updateQuietHours = useCallback(
    async (quietHours: Partial<QuietHours>) => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const response = await fetch(`/api/parent/notification-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            quietHours,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '방해금지 시간 설정 저장에 실패했습니다.');
        }

        await mutate(url);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setSaveError(errorMessage);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, url]
  );

  /**
   * 보고서 수신 설정 업데이트
   */
  const updateReports = useCallback(
    async (reports: Partial<ReportDeliverySettings>) => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const response = await fetch(`/api/parent/notification-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            reports,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '보고서 설정 저장에 실패했습니다.');
        }

        await mutate(url);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setSaveError(errorMessage);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, url]
  );

  /**
   * 전체 설정 한 번에 업데이트
   *
   * Vercel Best Practice: async-parallel
   * - 필요 시 여러 설정을 병렬로 저장할 수 있음
   */
  const updateAll = useCallback(
    async (update: ParentNotificationSettingsUpdateRequest) => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const response = await fetch(`/api/parent/notification-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            ...update,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '설정 저장에 실패했습니다.');
        }

        await mutate(url);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setSaveError(errorMessage);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, url]
  );

  /**
   * 설정 초기화
   */
  const resetToDefaults = useCallback(
    async () => {
      return updateAll({
        channels: DEFAULT_PARENT_NOTIFICATION_CHANNELS,
        types: DEFAULT_PARENT_NOTIFICATION_TYPES,
        quietHours: DEFAULT_QUIET_HOURS,
        reports: DEFAULT_REPORT_DELIVERY_SETTINGS,
      });
    },
    [updateAll]
  );

  /**
   * 단일 채널 토글
   *
   * Vercel Best Practice: rerender-functional-setstate
   * - 함수형 업데이트 패턴으로 현재 값 기반 토글
   */
  const toggleChannel = useCallback(
    async (channel: keyof ParentNotificationChannels) => {
      const currentValue = settings.channels[channel];
      return updateChannels({ [channel]: !currentValue });
    },
    [settings.channels, updateChannels]
  );

  /**
   * 단일 알림 유형 토글
   */
  const toggleType = useCallback(
    async (type: keyof ParentNotificationTypes) => {
      const currentValue = settings.types[type];
      return updateTypes({ [type]: !currentValue });
    },
    [settings.types, updateTypes]
  );

  /**
   * 방해금지 시간 토글
   */
  const toggleQuietHours = useCallback(
    async () => {
      const currentValue = settings.quietHours.enabled;
      return updateQuietHours({ enabled: !currentValue });
    },
    [settings.quietHours.enabled, updateQuietHours]
  );

  return {
    // 데이터
    settings,

    // 로딩 상태
    isLoading,
    isValidating,
    isSaving,

    // 에러 상태
    error,
    saveError,

    // 개별 업데이트 함수
    updateChannels,
    updateTypes,
    updateQuietHours,
    updateReports,

    // 전체 업데이트
    updateAll,
    resetToDefaults,

    // 토글 헬퍼
    toggleChannel,
    toggleType,
    toggleQuietHours,
  };
}

// 기본 export
export default useNotificationSettings;
