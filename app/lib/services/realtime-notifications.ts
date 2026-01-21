/**
 * 실시간 알림 서비스
 *
 * Supabase Realtime을 활용하여 새 알림을 실시간으로 수신합니다.
 * - PostgreSQL 변경사항 구독
 * - 연결 상태 관리
 * - 재연결 로직
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Notification } from '@/types/notification'

// 알림 콜백 타입
export type NotificationCallback = (notification: Notification) => void
export type ConnectionStatusCallback = (status: ConnectionStatus) => void

// 연결 상태 타입
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

// 재연결 설정
const RECONNECT_INTERVAL = 5000 // 5초
const MAX_RECONNECT_ATTEMPTS = 10

// 전역 채널 관리 (싱글톤 패턴)
let notificationChannel: RealtimeChannel | null = null
let reconnectAttempts = 0
let reconnectTimer: NodeJS.Timeout | null = null

// 콜백 저장소
const notificationCallbacks = new Map<string, NotificationCallback>()
const statusCallbacks = new Map<string, ConnectionStatusCallback>()

/**
 * 연결 상태 변경 알림
 */
function notifyStatusChange(status: ConnectionStatus): void {
  statusCallbacks.forEach((callback) => {
    try {
      callback(status)
    } catch (error) {
      console.error('상태 콜백 실행 오류:', error)
    }
  })
}

/**
 * 새 알림 수신 알림
 */
function notifyNewNotification(notification: Notification): void {
  notificationCallbacks.forEach((callback) => {
    try {
      callback(notification)
    } catch (error) {
      console.error('알림 콜백 실행 오류:', error)
    }
  })
}

/**
 * Supabase Realtime 채널 생성
 */
function createNotificationChannel(userId: string): RealtimeChannel {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        console.log('새 알림 수신:', payload)

        // payload.new를 Notification 형태로 변환
        const newNotification = transformToNotification(payload.new)
        if (newNotification) {
          notifyNewNotification(newNotification)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        console.log('알림 업데이트:', payload)

        // 업데이트된 알림도 콜백으로 전달 (읽음 상태 변경 등)
        const updatedNotification = transformToNotification(payload.new)
        if (updatedNotification) {
          notifyNewNotification(updatedNotification)
        }
      }
    )
}

/**
 * 데이터베이스 row를 Notification 타입으로 변환
 */
function transformToNotification(row: { [key: string]: unknown } | undefined): Notification | null {
  if (!row) return null

  try {
    return {
      id: String(row.id || ''),
      type: (row.type as Notification['type']) || 'system',
      title: String(row.title || ''),
      message: String(row.message || ''),
      userId: String(row.user_id || ''),
      senderId: row.sender_id ? String(row.sender_id) : undefined,
      senderName: row.sender_name ? String(row.sender_name) : undefined,
      isRead: Boolean(row.is_read),
      priority: (row.priority as Notification['priority']) || 'medium',
      link: row.link ? String(row.link) : undefined,
      metadata: row.metadata as Notification['metadata'],
      createdAt: String(row.created_at || new Date().toISOString()),
      readAt: row.read_at ? String(row.read_at) : undefined,
    }
  } catch (error) {
    console.error('알림 변환 오류:', error)
    return null
  }
}

/**
 * 재연결 시도
 */
function attemptReconnect(userId: string): void {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('최대 재연결 시도 횟수 초과')
    notifyStatusChange('error')
    return
  }

  reconnectAttempts++
  console.log(`재연결 시도 ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`)

  reconnectTimer = setTimeout(() => {
    subscribeToNotifications(userId)
  }, RECONNECT_INTERVAL * reconnectAttempts) // 지수 백오프
}

/**
 * 알림 실시간 구독 시작
 *
 * @param userId - 구독할 사용자 ID
 * @param onNotification - 새 알림 수신 시 콜백 (선택적, 훅에서 관리)
 * @returns 구독 해제 함수
 */
export function subscribeToNotifications(
  userId: string,
  onNotification?: NotificationCallback
): () => void {
  // Supabase가 설정되지 않은 경우 Mock 처리
  if (!isSupabaseConfigured()) {
    console.warn('Supabase가 설정되지 않아 실시간 알림을 사용할 수 없습니다.')
    return () => {}
  }

  // 콜백 등록 (있는 경우)
  const callbackId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  if (onNotification) {
    notificationCallbacks.set(callbackId, onNotification)
  }

  // 이미 채널이 있으면 재사용
  if (notificationChannel) {
    console.log('기존 알림 채널 재사용')
    return () => {
      notificationCallbacks.delete(callbackId)
    }
  }

  notifyStatusChange('connecting')

  // 새 채널 생성
  notificationChannel = createNotificationChannel(userId)

  // 구독 시작
  notificationChannel
    .subscribe((status) => {
      console.log('알림 채널 상태:', status)

      if (status === 'SUBSCRIBED') {
        reconnectAttempts = 0
        notifyStatusChange('connected')
      } else if (status === 'CHANNEL_ERROR') {
        notifyStatusChange('error')
        attemptReconnect(userId)
      } else if (status === 'TIMED_OUT') {
        notifyStatusChange('disconnected')
        attemptReconnect(userId)
      } else if (status === 'CLOSED') {
        notifyStatusChange('disconnected')
      }
    })

  // 구독 해제 함수 반환
  return () => {
    notificationCallbacks.delete(callbackId)

    // 모든 콜백이 해제되면 채널 정리
    if (notificationCallbacks.size === 0) {
      unsubscribeFromNotifications()
    }
  }
}

/**
 * 알림 구독 해제
 */
export function unsubscribeFromNotifications(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (notificationChannel) {
    notificationChannel.unsubscribe()
    notificationChannel = null
  }

  reconnectAttempts = 0
  notificationCallbacks.clear()
  notifyStatusChange('disconnected')
}

/**
 * 연결 상태 콜백 등록
 *
 * @param callback - 상태 변경 시 호출될 콜백
 * @returns 등록 해제 함수
 */
export function onConnectionStatusChange(callback: ConnectionStatusCallback): () => void {
  const callbackId = `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  statusCallbacks.set(callbackId, callback)

  return () => {
    statusCallbacks.delete(callbackId)
  }
}

/**
 * 새 알림 콜백 등록
 *
 * @param callback - 새 알림 수신 시 호출될 콜백
 * @returns 등록 해제 함수
 */
export function onNewNotification(callback: NotificationCallback): () => void {
  const callbackId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  notificationCallbacks.set(callbackId, callback)

  return () => {
    notificationCallbacks.delete(callbackId)
  }
}

/**
 * 현재 연결 상태 확인
 */
export function isConnected(): boolean {
  return notificationChannel !== null
}

/**
 * 수동 재연결
 */
export function reconnect(userId: string): void {
  unsubscribeFromNotifications()
  reconnectAttempts = 0
  subscribeToNotifications(userId)
}

// 브라우저 환경에서 페이지 가시성 변경 시 재연결
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && notificationChannel) {
      // 페이지가 다시 보이면 연결 상태 확인
      const state = notificationChannel.state
      if (state === 'closed' || state === 'errored') {
        console.log('페이지 활성화 - 재연결 시도')
        // userId를 알 수 없으므로 상태만 업데이트
        notifyStatusChange('disconnected')
      }
    }
  })
}
