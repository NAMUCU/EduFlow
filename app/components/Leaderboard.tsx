'use client';

// 리더보드 컴포넌트
// Vercel Best Practice: client-swr-dedup 적용 (SWR 캐싱)

import { memo, useMemo } from 'react';
import useSWR from 'swr';
import type { LeaderboardEntry, LeaderboardResponse } from '@/types/gamification';
import { getLevelInfo } from '@/lib/gamification';
import { LevelBadge, PointsDisplay } from './GamificationBadge';

// ============================================
// SWR Fetcher
// ============================================

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
  return res.json();
};

// ============================================
// 리더보드 아이템 컴포넌트
// ============================================

interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

const LeaderboardItem = memo(function LeaderboardItem({
  entry,
  isCurrentUser = false,
}: LeaderboardItemProps) {
  const levelInfo = useMemo(() => getLevelInfo(entry.level), [entry.level]);

  const rankDisplay = useMemo(() => {
    switch (entry.rank) {
      case 1:
        return <span className="text-2xl">🥇</span>;
      case 2:
        return <span className="text-2xl">🥈</span>;
      case 3:
        return <span className="text-2xl">🥉</span>;
      default:
        return (
          <span className="text-lg font-bold text-gray-500 w-8 text-center">
            {entry.rank}
          </span>
        );
    }
  }, [entry.rank]);

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${
        isCurrentUser
          ? 'bg-blue-50 border-2 border-blue-200'
          : 'bg-white hover:bg-gray-50 border border-gray-100'
      }`}
    >
      {/* 순위 */}
      <div className="flex-shrink-0 w-10 flex items-center justify-center">
        {rankDisplay}
      </div>

      {/* 프로필 */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: levelInfo.color }}
      >
        {entry.studentName.charAt(0)}
      </div>

      {/* 이름 & 레벨 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">
            {entry.studentName}
          </span>
          {isCurrentUser && (
            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
              나
            </span>
          )}
        </div>
        <LevelBadge level={entry.level} size="sm" />
      </div>

      {/* 포인트 */}
      <div className="flex-shrink-0">
        <PointsDisplay points={entry.points} size="sm" />
      </div>
    </div>
  );
});

LeaderboardItem.displayName = 'LeaderboardItem';

// ============================================
// 리더보드 스켈레톤 컴포넌트
// ============================================

const LeaderboardSkeleton = memo(function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-lg bg-white border border-gray-100 animate-pulse"
        >
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-5 bg-gray-200 rounded w-16" />
          </div>
          <div className="h-6 bg-gray-200 rounded w-16" />
        </div>
      ))}
    </div>
  );
});

LeaderboardSkeleton.displayName = 'LeaderboardSkeleton';

// ============================================
// 메인 리더보드 컴포넌트
// ============================================

interface LeaderboardProps {
  classId: string;
  currentUserId?: string;
  maxDisplay?: number;
  showHeader?: boolean;
  className?: string;
}

const Leaderboard = memo(function Leaderboard({
  classId,
  currentUserId,
  maxDisplay = 10,
  showHeader = true,
  className = '',
}: LeaderboardProps) {
  // SWR로 데이터 페칭 (캐싱 및 중복 요청 방지)
  const { data, error, isLoading, mutate } = useSWR<LeaderboardResponse>(
    `/api/gamification?action=leaderboard&classId=${classId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // 1분간 중복 요청 방지
    }
  );

  const displayedEntries = useMemo(() => {
    if (!data?.entries) return [];
    return data.entries.slice(0, maxDisplay);
  }, [data?.entries, maxDisplay]);

  if (isLoading) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">리더보드</h2>
          </div>
        )}
        <LeaderboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <h2 className="text-lg font-bold text-gray-900 mb-4">리더보드</h2>
        )}
        <div className="p-6 text-center bg-red-50 rounded-lg">
          <p className="text-red-600 mb-2">데이터를 불러오는데 실패했습니다.</p>
          <button
            onClick={() => mutate()}
            className="text-sm text-blue-600 hover:underline"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!data || displayedEntries.length === 0) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <h2 className="text-lg font-bold text-gray-900 mb-4">리더보드</h2>
        )}
        <div className="p-6 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">아직 리더보드 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {data.className} 리더보드
          </h2>
          <span className="text-xs text-gray-400">
            업데이트: {new Date(data.updatedAt).toLocaleString('ko-KR')}
          </span>
        </div>
      )}

      <div className="space-y-2">
        {displayedEntries.map((entry) => (
          <LeaderboardItem
            key={entry.studentId}
            entry={entry}
            isCurrentUser={entry.studentId === currentUserId}
          />
        ))}
      </div>

      {data.entries.length > maxDisplay && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:underline">
            전체 {data.entries.length}명 보기
          </button>
        </div>
      )}
    </div>
  );
});

Leaderboard.displayName = 'Leaderboard';

// ============================================
// 미니 리더보드 컴포넌트 (대시보드용)
// ============================================

interface MiniLeaderboardProps {
  classId: string;
  currentUserId?: string;
  className?: string;
}

const MiniLeaderboard = memo(function MiniLeaderboard({
  classId,
  currentUserId,
  className = '',
}: MiniLeaderboardProps) {
  const { data, isLoading } = useSWR<LeaderboardResponse>(
    `/api/gamification?action=leaderboard&classId=${classId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const topThree = useMemo(() => {
    if (!data?.entries) return [];
    return data.entries.slice(0, 3);
  }, [data?.entries]);

  const currentUserEntry = useMemo(() => {
    if (!data?.entries || !currentUserId) return null;
    return data.entries.find((e) => e.studentId === currentUserId);
  }, [data?.entries, currentUserId]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-20" />
          <div className="flex justify-center gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-16 h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || topThree.length === 0) return null;

  return (
    <div className={`bg-white rounded-xl shadow-md p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-600 mb-3">이번 주 TOP 3</h3>

      <div className="flex justify-center items-end gap-2 mb-4">
        {/* 2등 */}
        {topThree[1] && (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 mb-1">
              {topThree[1].studentName.charAt(0)}
            </div>
            <div className="text-xs text-gray-600 truncate w-16">
              {topThree[1].studentName}
            </div>
            <div className="text-lg">🥈</div>
          </div>
        )}

        {/* 1등 */}
        {topThree[0] && (
          <div className="text-center -mt-4">
            <div
              className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-xl font-bold text-white mb-1"
              style={{ backgroundColor: getLevelInfo(topThree[0].level).color }}
            >
              {topThree[0].studentName.charAt(0)}
            </div>
            <div className="text-sm font-medium text-gray-800 truncate w-16">
              {topThree[0].studentName}
            </div>
            <div className="text-2xl">🥇</div>
          </div>
        )}

        {/* 3등 */}
        {topThree[2] && (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-lg font-bold text-amber-700 mb-1">
              {topThree[2].studentName.charAt(0)}
            </div>
            <div className="text-xs text-gray-600 truncate w-16">
              {topThree[2].studentName}
            </div>
            <div className="text-lg">🥉</div>
          </div>
        )}
      </div>

      {/* 현재 사용자 순위 */}
      {currentUserEntry && currentUserEntry.rank > 3 && (
        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">내 순위</span>
            <span className="font-bold text-blue-600">#{currentUserEntry.rank}</span>
          </div>
        </div>
      )}
    </div>
  );
});

MiniLeaderboard.displayName = 'MiniLeaderboard';

// ============================================
// Export
// ============================================

export { Leaderboard, MiniLeaderboard, LeaderboardItem, LeaderboardSkeleton };
export default Leaderboard;
