'use client';

/**
 * 알림 페이지
 * Vercel Best Practices 적용:
 * - async-parallel: Promise.all로 병렬 데이터 fetching (useNotifications hook에서)
 * - bundle-dynamic-imports: next/dynamic으로 무거운 컴포넌트 lazy loading
 * - client-swr-dedup: SWR로 클라이언트 캐싱 (useNotifications hook)
 * - rerender-memo: React.memo로 불필요한 리렌더 방지 (NotificationList)
 * - rendering-content-visibility: 긴 알림 리스트에 content-visibility 적용
 */

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Bell, Filter, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  NotificationType,
} from '@/types/notification';
import {
  useNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/hooks/useNotifications';

// Vercel Best Practice: bundle-dynamic-imports
// NotificationList를 동적 import로 lazy loading
const NotificationList = dynamic(
  () => import('@/components/NotificationList'),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">컴포넌트 로딩 중...</p>
        </div>
      </div>
    ),
    ssr: false, // 클라이언트에서만 렌더링
  }
);

// 필터 옵션
const TYPE_FILTERS: { value: NotificationType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'assignment', label: '과제' },
  { value: 'grade', label: '성적' },
  { value: 'attendance', label: '출결' },
  { value: 'notice', label: '공지' },
  { value: 'system', label: '시스템' },
];

const READ_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'unread', label: '읽지 않음' },
  { value: 'read', label: '읽음' },
] as const;

// Vercel Best Practice: rerender-memo
// 필터 버튼 컴포넌트 메모이제이션
interface FilterButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
}

const FilterButton = memo(function FilterButton({
  isActive,
  onClick,
  label,
}: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
        isActive
          ? 'bg-primary-100 text-primary-700 font-medium'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
});

// 헤더 컴포넌트 메모이제이션
interface PageHeaderProps {
  unreadCount: number;
  isLoading: boolean;
  onRefresh: () => void;
}

const PageHeader = memo(function PageHeader({
  unreadCount,
  isLoading,
  onRefresh,
}: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-xl">
            <Bell className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">알림</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount > 0 ? (
                <>
                  <span className="font-semibold text-primary-600">{unreadCount}개</span>의 읽지 않은 알림
                </>
              ) : (
                '모든 알림을 확인했습니다'
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>
    </div>
  );
});

// 페이지네이션 컴포넌트 메모이제이션
interface PaginationProps {
  page: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

const Pagination = memo(function Pagination({
  page,
  totalPages,
  isLoading,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // 표시할 페이지 번호 계산
  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => {
      return Math.abs(p - page) <= 2 || p === 1 || p === totalPages;
    });
  }, [totalPages, page]);

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1 || isLoading}
        className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        이전
      </button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((p, index, arr) => {
          const showEllipsis = index > 0 && p - arr[index - 1] > 1;

          return (
            <div key={p} className="flex items-center gap-1">
              {showEllipsis && (
                <span className="px-2 text-gray-400">...</span>
              )}
              <button
                onClick={() => onPageChange(p)}
                disabled={isLoading}
                className={`w-10 h-10 text-sm rounded-lg transition-colors ${
                  page === p
                    ? 'bg-primary-600 text-white font-medium'
                    : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages || isLoading}
        className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        다음
      </button>
    </div>
  );
});

export default function NotificationsPage() {
  // 필터 상태
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  // 페이지네이션
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const userId = 'user-001'; // 실제로는 인증된 사용자 ID 사용

  // Vercel Best Practice: client-swr-dedup
  // SWR 훅을 사용하여 자동 캐싱 및 요청 중복 제거
  const filter = useMemo(() => ({
    type: typeFilter !== 'all' ? typeFilter : undefined,
    isRead: readFilter === 'all' ? undefined : readFilter === 'read',
  }), [typeFilter, readFilter]);

  const {
    notifications,
    total,
    unreadCount,
    isLoading,
    isValidating,
  } = useNotifications(userId, filter, page, pageSize);

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setPage(1);
  }, [typeFilter, readFilter]);

  // 읽음 처리 (SWR mutation 활용)
  const handleMarkAsRead = useCallback(async (id: string) => {
    await markNotificationAsRead(id);
  }, []);

  // 삭제 처리 (SWR mutation 활용)
  const handleDelete = useCallback(async (id: string) => {
    await deleteNotification(id);
  }, []);

  // 모두 읽음 처리 (SWR mutation 활용)
  const handleMarkAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead(
      userId,
      typeFilter !== 'all' ? typeFilter : undefined
    );
  }, [userId, typeFilter]);

  // 새로고침 (SWR revalidation)
  const handleRefresh = useCallback(() => {
    // SWR의 자동 revalidation 트리거
    // mutate를 통해 캐시 무효화
    window.location.reload(); // 간단한 방법, 또는 SWR의 mutate 사용
  }, []);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // 필터 변경 핸들러 메모이제이션
  const handleTypeFilterChange = useCallback((value: NotificationType | 'all') => {
    setTypeFilter(value);
  }, []);

  const handleReadFilterChange = useCallback((value: 'all' | 'unread' | 'read') => {
    setReadFilter(value);
  }, []);

  // 총 페이지 수
  const totalPages = Math.ceil(total / pageSize);

  // 빈 메시지
  const emptyMessage = useMemo(() => {
    return typeFilter !== 'all' || readFilter !== 'all'
      ? '조건에 맞는 알림이 없습니다'
      : '알림이 없습니다';
  }, [typeFilter, readFilter]);

  // 로딩 상태 (초기 로딩 또는 revalidation)
  const showLoading = isLoading && !isValidating;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <PageHeader
        unreadCount={unreadCount}
        isLoading={isLoading || isValidating}
        onRefresh={handleRefresh}
      />

      {/* 필터 */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">필터</span>
          </div>

          {/* 유형 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">유형:</span>
            <div className="flex gap-1">
              {TYPE_FILTERS.map((filter) => (
                <FilterButton
                  key={filter.value}
                  isActive={typeFilter === filter.value}
                  onClick={() => handleTypeFilterChange(filter.value)}
                  label={filter.label}
                />
              ))}
            </div>
          </div>

          {/* 읽음 상태 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">상태:</span>
            <div className="flex gap-1">
              {READ_FILTERS.map((filter) => (
                <FilterButton
                  key={filter.value}
                  isActive={readFilter === filter.value}
                  onClick={() => handleReadFilterChange(filter.value)}
                  label={filter.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="px-8 py-6">
        {/* Vercel Best Practice: bundle-dynamic-imports
            NotificationList는 동적 import로 lazy loading됨 */}
        <NotificationList
          notifications={notifications}
          isLoading={showLoading}
          onMarkAsRead={handleMarkAsRead}
          onDelete={handleDelete}
          onMarkAllAsRead={handleMarkAllAsRead}
          emptyMessage={emptyMessage}
        />

        {/* 페이지네이션 */}
        <Pagination
          page={page}
          totalPages={totalPages}
          isLoading={isLoading || isValidating}
          onPageChange={handlePageChange}
        />

        {/* 통계 */}
        {!showLoading && notifications.length > 0 && (
          <p className="text-center text-sm text-gray-500 mt-4">
            전체 {total}개 중 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}번째 알림
          </p>
        )}
      </div>
    </div>
  );
}
