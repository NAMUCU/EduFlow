/**
 * 알림 관리를 위한 SWR 훅
 * Vercel Best Practices 적용:
 * - client-swr-dedup: 자동 요청 중복 제거 및 캐싱
 * - async-parallel: Promise.all로 병렬 데이터 fetching
 * - js-set-map-lookups: Map을 활용한 O(1) 조회
 */

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';
import {
  Notification,
  NotificationType,
  NotificationFilter,
  NotificationListResponse,
  NotificationStats,
} from '@/types/notification';

// API 응답 타입
interface NotificationsResponse {
  success: boolean;
  data: NotificationListResponse;
  error?: string;
}

interface NotificationStatsResponse {
  success: boolean;
  data: NotificationStats;
  error?: string;
}

// 기본 fetcher 함수
const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('데이터를 불러오는데 실패했습니다.');
  }
  return response.json();
};

// 필터를 URL 파라미터로 변환
function buildNotificationsUrl(
  userId: string,
  filter: NotificationFilter = {},
  page: number = 1,
  pageSize: number = 20
): string {
  const params = new URLSearchParams();
  params.append('user_id', userId);
  params.append('page', page.toString());
  params.append('page_size', pageSize.toString());

  if (filter.type) params.append('type', filter.type);
  if (filter.isRead !== undefined) params.append('is_read', filter.isRead.toString());
  if (filter.priority) params.append('priority', filter.priority);
  if (filter.startDate) params.append('start_date', filter.startDate);
  if (filter.endDate) params.append('end_date', filter.endDate);

  return `/api/notifications?${params.toString()}`;
}

// 알림 목록 조회 훅
export function useNotifications(
  userId: string,
  filter: NotificationFilter = {},
  page: number = 1,
  pageSize: number = 20
) {
  const url = buildNotificationsUrl(userId, filter, page, pageSize);

  const { data, error, isLoading, isValidating } = useSWR<NotificationsResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000, // 2초 내 동일 요청 중복 제거
      refreshInterval: 30000, // 30초마다 자동 갱신 (실시간 알림 업데이트)
    }
  );

  // Vercel Best Practice: js-set-map-lookups
  // 알림 ID로 빠른 조회를 위한 Map 인덱스 생성 (O(1) 조회)
  const notificationMap = useMemo(() => {
    if (!data?.data?.notifications) return new Map<string, Notification>();
    return new Map(data.data.notifications.map((n) => [n.id, n]));
  }, [data?.data?.notifications]);

  // 유형별 알림 그룹화 (O(1) 조회)
  const notificationsByType = useMemo(() => {
    if (!data?.data?.notifications) return new Map<NotificationType, Notification[]>();
    const grouped = new Map<NotificationType, Notification[]>();
    data.data.notifications.forEach((notification) => {
      const existing = grouped.get(notification.type) || [];
      grouped.set(notification.type, [...existing, notification]);
    });
    return grouped;
  }, [data?.data?.notifications]);

  // ID로 알림 찾기 (O(1))
  const getNotificationById = useCallback(
    (id: string): Notification | undefined => {
      return notificationMap.get(id);
    },
    [notificationMap]
  );

  // 유형별 알림 찾기 (O(1))
  const getNotificationsByType = useCallback(
    (type: NotificationType): Notification[] => {
      return notificationsByType.get(type) || [];
    },
    [notificationsByType]
  );

  return {
    notifications: data?.data?.notifications || [],
    total: data?.data?.total || 0,
    unreadCount: data?.data?.unreadCount || 0,
    currentPage: data?.data?.page || page,
    pageSize: data?.data?.pageSize || pageSize,
    isLoading,
    isValidating,
    error,
    getNotificationById,
    getNotificationsByType,
    notificationMap,
  };
}

// Vercel Best Practice: async-parallel
// 알림과 통계를 병렬로 조회하는 훅
export function useNotificationsWithStats(
  userId: string,
  filter: NotificationFilter = {},
  page: number = 1,
  pageSize: number = 20
) {
  const notificationsUrl = buildNotificationsUrl(userId, filter, page, pageSize);
  const statsUrl = `/api/notifications/stats?user_id=${userId}`;

  // 두 요청을 병렬로 실행
  const { data: notificationsData, error: notificationsError, isLoading: notificationsLoading } =
    useSWR<NotificationsResponse>(notificationsUrl, fetcher, {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    });

  const { data: statsData, error: statsError, isLoading: statsLoading } =
    useSWR<NotificationStatsResponse>(statsUrl, fetcher, {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // 통계는 5초 간격
    });

  return {
    notifications: notificationsData?.data?.notifications || [],
    total: notificationsData?.data?.total || 0,
    unreadCount: notificationsData?.data?.unreadCount || 0,
    stats: statsData?.data || null,
    isLoading: notificationsLoading || statsLoading,
    error: notificationsError || statsError,
  };
}

// 읽음 처리 mutation
export async function markNotificationAsRead(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/notifications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isRead: true }),
  });

  const result = await response.json();

  if (result.success) {
    // SWR 캐시 무효화
    await mutate(
      (key: unknown) => typeof key === 'string' && key.startsWith('/api/notifications')
    );
  }

  return result;
}

// 모두 읽음 처리 mutation
export async function markAllNotificationsAsRead(
  userId: string,
  type?: NotificationType
): Promise<{ success: boolean; error?: string }> {
  const body: { userId: string; type?: NotificationType } = { userId };
  if (type) body.type = type;

  const response = await fetch('/api/notifications/read-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (result.success) {
    await mutate(
      (key: unknown) => typeof key === 'string' && key.startsWith('/api/notifications')
    );
  }

  return result;
}

// 알림 삭제 mutation
export async function deleteNotification(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/notifications/${id}`, {
    method: 'DELETE',
  });

  const result = await response.json();

  if (result.success) {
    await mutate(
      (key: unknown) => typeof key === 'string' && key.startsWith('/api/notifications')
    );
  }

  return result;
}

// Vercel Best Practice: async-parallel
// 여러 알림 병렬 삭제
export async function deleteNotifications(
  ids: string[]
): Promise<{ success: boolean; errors?: string[] }> {
  const results = await Promise.all(
    ids.map((id) => deleteNotification(id))
  );

  const errors = results
    .filter((r) => !r.success)
    .map((r) => r.error || '알 수 없는 오류');

  // 성공한 것이 하나라도 있으면 캐시 무효화
  if (results.some((r) => r.success)) {
    await mutate(
      (key: unknown) => typeof key === 'string' && key.startsWith('/api/notifications')
    );
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Vercel Best Practice: async-parallel
// 여러 알림 병렬 읽음 처리
export async function markNotificationsAsRead(
  ids: string[]
): Promise<{ success: boolean; errors?: string[] }> {
  const results = await Promise.all(
    ids.map((id) => markNotificationAsRead(id))
  );

  const errors = results
    .filter((r) => !r.success)
    .map((r) => r.error || '알 수 없는 오류');

  if (results.some((r) => r.success)) {
    await mutate(
      (key: unknown) => typeof key === 'string' && key.startsWith('/api/notifications')
    );
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
