'use client';

/**
 * 알림 목록 컴포넌트
 * Vercel Best Practices 적용:
 * - rerender-memo: React.memo로 불필요한 리렌더 방지
 * - rendering-content-visibility: 긴 리스트에 content-visibility 적용
 */

import { useState, memo, useCallback } from 'react';
import { Check, Trash2, ExternalLink, Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import {
  Notification,
  NotificationType,
  NOTIFICATION_TYPE_LABELS,
} from '@/types/notification';

// 알림 유형별 아이콘 색상
const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  assignment: 'bg-blue-100 text-blue-600',
  grade: 'bg-green-100 text-green-600',
  attendance: 'bg-yellow-100 text-yellow-600',
  notice: 'bg-purple-100 text-purple-600',
  system: 'bg-gray-100 text-gray-600',
};

// 알림 유형별 아이콘
const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  assignment: '📝',
  grade: '📊',
  attendance: '📅',
  notice: '📢',
  system: '⚙️',
};


interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  showActions?: boolean;
  emptyMessage?: string;
}

// Vercel Best Practice: rerender-memo
// 개별 알림 아이템 컴포넌트 - 메모이제이션으로 불필요한 리렌더 방지
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  showActions: boolean;
  actionLoading: string | null;
  onActionStart: (id: string) => void;
  onActionEnd: () => void;
}

const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  showActions,
  actionLoading,
  onActionStart,
  onActionEnd,
}: NotificationItemProps) {
  // 시간 포맷팅 (상세)
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days < 7) {
      return `${days}일 전 ${date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 읽음 처리
  const handleMarkAsRead = useCallback(async () => {
    onActionStart(notification.id);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      onActionEnd();
    }
  }, [notification.id, onMarkAsRead, onActionStart, onActionEnd]);

  // 삭제 처리
  const handleDelete = useCallback(async () => {
    if (!confirm('이 알림을 삭제하시겠습니까?')) return;

    onActionStart(notification.id);
    try {
      await onDelete(notification.id);
    } finally {
      onActionEnd();
    }
  }, [notification.id, onDelete, onActionStart, onActionEnd]);

  const isActionLoading = actionLoading === notification.id;

  return (
    <li
      className={`notification-item relative transition-colors ${
        !notification.isRead ? 'bg-blue-50/50' : 'hover:bg-gray-50'
      }`}
      // Vercel Best Practice: rendering-content-visibility
      // 화면 밖의 알림 아이템은 렌더링 건너뛰기
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 80px', // 예상 높이 설정
      }}
    >
      <div className="flex gap-4 px-5 py-4">
        {/* 읽지 않음 표시 */}
        {!notification.isRead && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full" />
        )}

        {/* 아이콘 */}
        <div
          className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl ${
            NOTIFICATION_TYPE_COLORS[notification.type]
          }`}
        >
          <span className="text-2xl">
            {NOTIFICATION_TYPE_ICONS[notification.type]}
          </span>
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* 제목 */}
              <div className="flex items-center gap-2">
                <h3
                  className={`text-base ${
                    !notification.isRead
                      ? 'font-semibold text-gray-900'
                      : 'font-medium text-gray-700'
                  }`}
                >
                  {notification.title}
                </h3>
                {notification.priority === 'urgent' && (
                  <span className="px-2 py-0.5 text-xs font-bold text-red-600 bg-red-100 rounded-full">
                    긴급
                  </span>
                )}
                {notification.priority === 'high' && (
                  <span className="px-2 py-0.5 text-xs font-bold text-orange-600 bg-orange-100 rounded-full">
                    중요
                  </span>
                )}
              </div>

              {/* 메시지 */}
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>

              {/* 메타 정보 */}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs rounded-lg ${
                    NOTIFICATION_TYPE_COLORS[notification.type]
                  }`}
                >
                  {NOTIFICATION_TYPE_LABELS[notification.type]}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDateTime(notification.createdAt)}
                </span>
                {notification.senderName && (
                  <span className="text-xs text-gray-500">
                    발신: {notification.senderName}
                  </span>
                )}
                {notification.link && (
                  <Link
                    href={notification.link}
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    바로가기 <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            {showActions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {!notification.isRead && (
                  <button
                    onClick={handleMarkAsRead}
                    disabled={isActionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    title="읽음 처리"
                  >
                    {isActionLoading ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">읽음</span>
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={isActionLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="삭제"
                >
                  {isActionLoading ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">삭제</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
});

// Vercel Best Practice: rerender-memo
// 전체 리스트 컴포넌트도 메모이제이션
const NotificationList = memo(function NotificationList({
  notifications,
  isLoading = false,
  onMarkAsRead,
  onDelete,
  onMarkAllAsRead,
  showActions = true,
  emptyMessage = '알림이 없습니다',
}: NotificationListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 액션 시작/종료 콜백 메모이제이션
  const handleActionStart = useCallback((id: string) => {
    setActionLoading(id);
  }, []);

  const handleActionEnd = useCallback(() => {
    setActionLoading(null);
  }, []);

  // 모두 읽음 처리
  const handleMarkAllAsRead = useCallback(async () => {
    setActionLoading('all');
    try {
      await onMarkAllAsRead();
    } finally {
      setActionLoading(null);
    }
  }, [onMarkAllAsRead]);

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">알림을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Bell className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">{emptyMessage}</p>
        <p className="text-sm text-gray-400 mt-1">새로운 알림이 도착하면 여기에 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 액션 */}
      {showActions && unreadCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-primary-600">{unreadCount}</span>개의 읽지 않은 알림
          </p>
          <button
            onClick={handleMarkAllAsRead}
            disabled={actionLoading === 'all'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {actionLoading === 'all' ? (
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            모두 읽음
          </button>
        </div>
      )}

      {/* 알림 목록 */}
      {/* Vercel Best Practice: rendering-content-visibility */}
      <ul
        className="notification-list divide-y divide-gray-100 bg-white rounded-xl border border-gray-200 overflow-hidden"
        style={{
          // contain: 'layout style paint' 로 레이아웃 격리
          contain: 'layout style paint',
        }}
      >
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onDelete={onDelete}
            showActions={showActions}
            actionLoading={actionLoading}
            onActionStart={handleActionStart}
            onActionEnd={handleActionEnd}
          />
        ))}
      </ul>
    </div>
  );
});

export default NotificationList;
