'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
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

interface NotificationBellProps {
  userId?: string;
}

export default function NotificationBell({ userId = 'user-001' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 알림 목록 조회
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/notifications?user_id=${userId}&page_size=10`);
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      }
    } catch (error) {
      console.error('알림 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 컴포넌트 마운트 시 알림 조회
  useEffect(() => {
    fetchNotifications();

    // 30초마다 알림 갱신 (폴링)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('읽음 처리 오류:', error);
    }
  };

  // 알림 삭제
  const handleDelete = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const deletedNotification = notifications.find((n) => n.id === notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('삭제 오류:', error);
    }
  };

  // 모두 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('모두 읽음 처리 오류:', error);
    }
  };

  // 시간 포맷팅 (상대 시간)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 벨 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={`알림 ${unreadCount > 0 ? `(읽지 않은 알림 ${unreadCount}개)` : ''}`}
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">알림</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  모두 읽음
                </button>
              )}
              <Link
                href="/dashboard/notifications"
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={() => setIsOpen(false)}
              >
                전체 보기
              </Link>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell className="w-10 h-10 mb-2 text-gray-300" />
                <p className="text-sm">알림이 없습니다</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`relative hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex gap-3 px-4 py-3">
                      {/* 아이콘 */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${
                          NOTIFICATION_TYPE_COLORS[notification.type]
                        }`}
                      >
                        <span className="text-lg">
                          {NOTIFICATION_TYPE_ICONS[notification.type]}
                        </span>
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm truncate ${
                                !notification.isRead
                                  ? 'font-semibold text-gray-900'
                                  : 'font-medium text-gray-700'
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                          </div>

                          {/* 액션 버튼 */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="읽음 처리"
                              >
                                <Check className="w-4 h-4 text-gray-400" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(notification.id, e)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>

                        {/* 메타 정보 */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.createdAt)}
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              NOTIFICATION_TYPE_COLORS[notification.type]
                            }`}
                          >
                            {NOTIFICATION_TYPE_LABELS[notification.type]}
                          </span>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              onClick={() => {
                                setIsOpen(false);
                                if (!notification.isRead) {
                                  handleMarkAsRead(notification.id, { stopPropagation: () => {} } as React.MouseEvent);
                                }
                              }}
                              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
                            >
                              바로가기 <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* 읽지 않음 표시 */}
                      {!notification.isRead && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 푸터 */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
              <Link
                href="/dashboard/notifications"
                className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => setIsOpen(false)}
              >
                전체 알림 보기
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
