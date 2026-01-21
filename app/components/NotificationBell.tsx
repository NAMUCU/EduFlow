'use client';

/**
 * 알림 벨 컴포넌트
 *
 * 기능:
 * - 알림 벨 아이콘
 * - 읽지 않은 알림 뱃지
 * - 드롭다운 알림 목록
 * - 실시간 알림 수신 (Supabase Realtime)
 */

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Bell, Check, Trash2, ExternalLink, Settings, X, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import {
  Notification,
  NotificationType,
  NOTIFICATION_TYPE_LABELS,
} from '@/types/notification';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { markNotificationAsRead, deleteNotification } from '@/hooks/useNotifications';

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
  assignment: '!',
  grade: '%',
  attendance: 'A',
  notice: 'N',
  system: 'S',
};

interface NotificationBellProps {
  userId?: string;
  maxItems?: number;
}

// 개별 알림 아이템 컴포넌트
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
  isLoading,
}: NotificationItemProps) {
  // 상대 시간 포맷팅
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      onClose();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  const content = (
    <div
      className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        !notification.isRead
          ? 'bg-blue-50 hover:bg-blue-100'
          : 'hover:bg-gray-50'
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={handleClick}
    >
      {/* 아이콘 */}
      <div
        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold ${
          NOTIFICATION_TYPE_COLORS[notification.type]
        }`}
      >
        {NOTIFICATION_TYPE_ICONS[notification.type]}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* 제목 */}
            <p
              className={`text-sm truncate ${
                !notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
              }`}
            >
              {notification.title}
            </p>

            {/* 메시지 */}
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {notification.message}
            </p>

            {/* 메타 */}
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] rounded ${
                  NOTIFICATION_TYPE_COLORS[notification.type]
                }`}
              >
                {NOTIFICATION_TYPE_LABELS[notification.type]}
              </span>
              <span className="text-[10px] text-gray-400">
                {formatRelativeTime(notification.createdAt)}
              </span>
            </div>
          </div>

          {/* 삭제 버튼 */}
          <button
            onClick={handleDelete}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }

  return content;
});

// 메인 컴포넌트
export default function NotificationBell({
  userId = 'user-001',
  maxItems = 5,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 실시간 알림 훅 사용
  const {
    notifications,
    unreadCount,
    connectionStatus,
    isLoading,
  } = useRealtimeNotifications(userId, { maxItems: maxItems * 2 });

  // 드롭다운에 표시할 알림 (최신 maxItems개)
  const displayNotifications = notifications.slice(0, maxItems);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // 토글
  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // 닫기
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 읽음 처리
  const handleMarkAsRead = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await markNotificationAsRead(id);
    } finally {
      setActionLoading(null);
    }
  }, []);

  // 삭제 처리
  const handleDelete = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await deleteNotification(id);
    } finally {
      setActionLoading(null);
    }
  }, []);

  // 연결 상태 아이콘
  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-1 text-green-600" title="실시간 연결됨">
            <Wifi className="w-3 h-3" />
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1 text-yellow-600" title="연결 중...">
            <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1 text-red-600" title="연결 오류">
            <WifiOff className="w-3 h-3" />
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-gray-400" title="연결 안됨">
            <WifiOff className="w-3 h-3" />
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* 벨 버튼 */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className={`relative p-2 rounded-lg transition-colors ${
          isOpen
            ? 'bg-primary-100 text-primary-600'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
        aria-label={`알림 ${unreadCount > 0 ? `(${unreadCount}개 읽지 않음)` : ''}`}
      >
        <Bell className="w-5 h-5" />

        {/* 읽지 않은 알림 뱃지 */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">알림</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium text-primary-600 bg-primary-100 rounded-full">
                  {unreadCount}개
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {renderConnectionStatus()}
              <button
                onClick={closeDropdown}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Bell className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm font-medium">새 알림이 없습니다</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {displayNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    onClose={closeDropdown}
                    isLoading={actionLoading === notification.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <Link
              href="/dashboard/notifications"
              onClick={closeDropdown}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              모든 알림 보기
            </Link>
            <Link
              href="/dashboard/settings#notifications"
              onClick={closeDropdown}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="알림 설정"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
