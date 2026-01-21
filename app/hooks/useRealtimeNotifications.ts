/**
 * 실시간 알림 구독 훅
 *
 * Supabase Realtime을 통해 새 알림을 실시간으로 수신합니다.
 * - 기존 알림 목록과 통합
 * - 연결 상태 관리
 * - 읽음 처리
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import {
  Notification,
  NotificationFilter,
  NotificationListResponse,
} from '@/types/notification';
import {
  subscribeToNotifications,
  unsubscribeFromNotifications,
  onConnectionStatusChange,
  onNewNotification,
  ConnectionStatus,
} from '@/lib/services/realtime-notifications';

// API 응답 타입
interface NotificationsResponse {
  success: boolean;
  data: NotificationListResponse;
  error?: string;
}

// 훅 옵션 타입
interface UseRealtimeNotificationsOptions {
  filter?: NotificationFilter;
  maxItems?: number;
  autoSubscribe?: boolean;
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
  pageSize: number = 20
): string {
  const params = new URLSearchParams();
  params.append('user_id', userId);
  params.append('page', '1');
  params.append('page_size', pageSize.toString());

  if (filter.type) params.append('type', filter.type);
  if (filter.isRead !== undefined) params.append('is_read', filter.isRead.toString());
  if (filter.priority) params.append('priority', filter.priority);
  if (filter.startDate) params.append('start_date', filter.startDate);
  if (filter.endDate) params.append('end_date', filter.endDate);

  return `/api/notifications?${params.toString()}`;
}

/**
 * 실시간 알림 구독 훅
 *
 * @param userId - 사용자 ID
 * @param options - 옵션 (필터, 최대 항목 수 등)
 * @returns 알림 목록, 상태, 액션 함수들
 */
export function useRealtimeNotifications(
  userId: string,
  options: UseRealtimeNotificationsOptions = {}
) {
  const { filter = {}, maxItems = 20, autoSubscribe = true } = options;

  // 연결 상태
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  // 로컬 알림 상태 (실시간으로 추가된 알림 포함)
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);

  // 구독 해제 함수 참조
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const statusUnsubscribeRef = useRef<(() => void) | null>(null);
  const notificationUnsubscribeRef = useRef<(() => void) | null>(null);

  // SWR로 초기 알림 목록 로드
  const url = buildNotificationsUrl(userId, filter, maxItems);
  const { data, error, isLoading, isValidating } = useSWR<NotificationsResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
      refreshInterval: 60000, // 1분마다 자동 갱신 (실시간과 별개로 동기화)
    }
  );

  // API에서 받은 알림과 로컬 알림 병합
  const notifications = useCallback(() => {
    const apiNotifications = data?.data?.notifications || [];

    // 로컬 알림과 API 알림 병합 (중복 제거)
    const allIds = new Set(apiNotifications.map((n) => n.id));
    const uniqueLocalNotifications = localNotifications.filter((n) => !allIds.has(n.id));

    // 합쳐서 날짜순 정렬 (최신 먼저)
    const merged = [...uniqueLocalNotifications, ...apiNotifications];
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 최대 개수 제한
    return merged.slice(0, maxItems);
  }, [data?.data?.notifications, localNotifications, maxItems]);

  // 읽지 않은 알림 개수 계산
  const unreadCount = useCallback(() => {
    const allNotifications = notifications();
    return allNotifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // 실시간 구독 시작
  useEffect(() => {
    if (!autoSubscribe || !userId) return;

    // 연결 상태 콜백 등록
    statusUnsubscribeRef.current = onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });

    // 새 알림 콜백 등록
    notificationUnsubscribeRef.current = onNewNotification((notification) => {
      // 현재 사용자의 알림인지 확인
      if (notification.userId === userId) {
        setLocalNotifications((prev) => {
          // 중복 방지
          const exists = prev.some((n) => n.id === notification.id);
          if (exists) {
            // 업데이트인 경우 기존 알림 교체
            return prev.map((n) => (n.id === notification.id ? notification : n));
          }
          // 새 알림 추가 (맨 앞에)
          return [notification, ...prev].slice(0, maxItems);
        });

        // SWR 캐시도 무효화 (백그라운드에서 동기화)
        mutate(
          (key: unknown) => typeof key === 'string' && key.startsWith('/api/notifications'),
          undefined,
          { revalidate: true }
        );
      }
    });

    // 구독 시작
    unsubscribeRef.current = subscribeToNotifications(userId);

    // 정리
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (statusUnsubscribeRef.current) {
        statusUnsubscribeRef.current();
        statusUnsubscribeRef.current = null;
      }
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
        notificationUnsubscribeRef.current = null;
      }
    };
  }, [userId, autoSubscribe, maxItems]);

  // 수동으로 알림 추가 (낙관적 업데이트용)
  const addNotification = useCallback((notification: Notification) => {
    setLocalNotifications((prev) => {
      const exists = prev.some((n) => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev].slice(0, maxItems);
    });
  }, [maxItems]);

  // 알림 읽음 처리 (로컬 상태도 업데이트)
  const markAsRead = useCallback(async (id: string) => {
    // 낙관적 업데이트
    setLocalNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      )
    );

    try {
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
      } else {
        // 실패 시 롤백
        setLocalNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, isRead: false, readAt: undefined } : n
          )
        );
      }

      return result;
    } catch (error) {
      // 에러 시 롤백
      setLocalNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: false, readAt: undefined } : n
        )
      );
      throw error;
    }
  }, []);

  // 알림 삭제 (로컬 상태도 업데이트)
  const removeNotification = useCallback(async (id: string) => {
    // 삭제할 알림 백업
    let deletedNotification: Notification | undefined;
    setLocalNotifications((prev) => {
      deletedNotification = prev.find((n) => n.id === id);
      return prev.filter((n) => n.id !== id);
    });

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await mutate(
          (key: unknown) => typeof key === 'string' && key.startsWith('/api/notifications')
        );
      } else if (deletedNotification) {
        // 실패 시 복원
        setLocalNotifications((prev) => [deletedNotification!, ...prev]);
      }

      return result;
    } catch (error) {
      // 에러 시 복원
      if (deletedNotification) {
        setLocalNotifications((prev) => [deletedNotification!, ...prev]);
      }
      throw error;
    }
  }, []);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(async () => {
    // 낙관적 업데이트
    const now = new Date().toISOString();
    setLocalNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || now }))
    );

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (result.success) {
        await mutate(
          (key: unknown) => typeof key === 'string' && key.startsWith('/api/notifications')
        );
      } else {
        // 실패 시 롤백 (복잡하므로 데이터 다시 로드)
        await mutate(url);
      }

      return result;
    } catch (error) {
      // 에러 시 데이터 다시 로드
      await mutate(url);
      throw error;
    }
  }, [userId, url]);

  // 수동 새로고침
  const refresh = useCallback(async () => {
    setLocalNotifications([]);
    await mutate(url);
  }, [url]);

  // 구독 재연결
  const reconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    unsubscribeRef.current = subscribeToNotifications(userId);
  }, [userId]);

  return {
    // 데이터
    notifications: notifications(),
    total: data?.data?.total || 0,
    unreadCount: unreadCount(),

    // 연결 상태
    connectionStatus,
    isConnected: connectionStatus === 'connected',

    // 로딩 상태
    isLoading,
    isValidating,
    error,

    // 액션
    addNotification,
    markAsRead,
    removeNotification,
    markAllAsRead,
    refresh,
    reconnect,
  };
}

export default useRealtimeNotifications;
