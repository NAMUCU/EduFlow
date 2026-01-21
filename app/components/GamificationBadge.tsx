'use client';

// 게이미피케이션 배지 컴포넌트
// Vercel Best Practice: rerender-memo 적용

import { memo, useMemo } from 'react';
import type { Badge, StudentPoints, LevelInfo } from '@/types/gamification';
import { getLevelInfo, calculateExpPercentage } from '@/lib/gamification';

// ============================================
// 배지 아이템 컴포넌트
// ============================================

interface BadgeItemProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const BadgeItem = memo(function BadgeItem({
  badge,
  size = 'md',
  showTooltip = true,
}: BadgeItemProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <div className="relative group">
      <div
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-400 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer`}
      >
        <span role="img" aria-label={badge.name}>
          {badge.icon}
        </span>
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
          <div className="font-semibold">{badge.name}</div>
          <div className="text-gray-300">{badge.description}</div>
          {badge.earnedAt && (
            <div className="text-gray-400 text-[10px] mt-1">
              획득: {new Date(badge.earnedAt).toLocaleDateString('ko-KR')}
            </div>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
});

BadgeItem.displayName = 'BadgeItem';

// ============================================
// 배지 목록 컴포넌트
// ============================================

interface BadgeListProps {
  badges: Badge[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

const BadgeList = memo(function BadgeList({
  badges,
  maxDisplay = 5,
  size = 'md',
}: BadgeListProps) {
  const displayedBadges = useMemo(
    () => badges.slice(0, maxDisplay),
    [badges, maxDisplay]
  );

  const remainingCount = badges.length - maxDisplay;

  if (badges.length === 0) {
    return (
      <div className="text-gray-400 text-sm">아직 획득한 배지가 없습니다.</div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {displayedBadges.map((badge) => (
        <BadgeItem key={badge.id} badge={badge} size={size} />
      ))}
      {remainingCount > 0 && (
        <div
          className={`${
            size === 'sm' ? 'w-8 h-8 text-xs' : size === 'md' ? 'w-12 h-12 text-sm' : 'w-16 h-16 text-base'
          } flex items-center justify-center rounded-full bg-gray-100 border-2 border-gray-300 text-gray-500 font-medium`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
});

BadgeList.displayName = 'BadgeList';

// ============================================
// 레벨 표시 컴포넌트
// ============================================

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

const LevelBadge = memo(function LevelBadge({ level, size = 'md' }: LevelBadgeProps) {
  const levelInfo = useMemo(() => getLevelInfo(level), [level]);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`${sizeClasses[size]} inline-flex items-center gap-1 rounded-full font-semibold text-white`}
      style={{ backgroundColor: levelInfo.color }}
    >
      <span>Lv.{level}</span>
      <span>{levelInfo.title}</span>
    </span>
  );
});

LevelBadge.displayName = 'LevelBadge';

// ============================================
// 경험치 바 컴포넌트
// ============================================

interface ExpBarProps {
  currentExp: number;
  nextLevelExp: number;
  showLabel?: boolean;
}

const ExpBar = memo(function ExpBar({
  currentExp,
  nextLevelExp,
  showLabel = true,
}: ExpBarProps) {
  const percentage = useMemo(
    () => calculateExpPercentage(currentExp, nextLevelExp),
    [currentExp, nextLevelExp]
  );

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>경험치</span>
          <span>
            {currentExp} / {nextLevelExp}
          </span>
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

ExpBar.displayName = 'ExpBar';

// ============================================
// 포인트 표시 컴포넌트
// ============================================

interface PointsDisplayProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const PointsDisplay = memo(function PointsDisplay({
  points,
  size = 'md',
  showIcon = true,
}: PointsDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`${sizeClasses[size]} font-bold text-yellow-600 flex items-center gap-1`}>
      {showIcon ? <span>🪙</span> : null}
      <span>{points.toLocaleString()}</span>
      <span className="text-gray-400 font-normal text-sm">P</span>
    </div>
  );
});

PointsDisplay.displayName = 'PointsDisplay';

// ============================================
// 메인 게이미피케이션 카드 컴포넌트
// ============================================

interface GamificationCardProps {
  studentName: string;
  points: StudentPoints;
  badges: Badge[];
  rank?: number;
  className?: string;
}

const GamificationCard = memo(function GamificationCard({
  studentName,
  points,
  badges,
  rank,
  className = '',
}: GamificationCardProps) {
  const levelInfo = useMemo(() => getLevelInfo(points.level), [points.level]);

  return (
    <div
      className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 ${className}`}
    >
      {/* 헤더: 이름, 레벨, 순위 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: levelInfo.color }}
          >
            {studentName.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{studentName}</h3>
            <LevelBadge level={points.level} size="sm" />
          </div>
        </div>
        {rank && (
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">#{rank}</div>
            <div className="text-xs text-gray-400">반 순위</div>
          </div>
        )}
      </div>

      {/* 포인트 & 경험치 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <PointsDisplay points={points.totalPoints} />
          <span className="text-sm text-gray-400">
            다음 레벨까지 {points.nextLevelExp - points.currentExp}P
          </span>
        </div>
        <ExpBar currentExp={points.currentExp} nextLevelExp={points.nextLevelExp} />
      </div>

      {/* 배지 */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">획득 배지</h4>
        <BadgeList badges={badges} maxDisplay={4} size="sm" />
      </div>
    </div>
  );
});

GamificationCard.displayName = 'GamificationCard';

// ============================================
// 새 배지 획득 알림 컴포넌트
// ============================================

interface NewBadgeAlertProps {
  badge: Badge;
  onClose?: () => void;
}

const NewBadgeAlert = memo(function NewBadgeAlert({
  badge,
  onClose,
}: NewBadgeAlertProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-bounce-in max-w-sm mx-4">
        <div className="text-6xl mb-4 animate-pulse">{badge.icon}</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">새 배지 획득!</h2>
        <h3 className="text-lg font-semibold text-yellow-600 mb-2">{badge.name}</h3>
        <p className="text-gray-500 mb-6">{badge.description}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
});

NewBadgeAlert.displayName = 'NewBadgeAlert';

// ============================================
// 레벨업 알림 컴포넌트
// ============================================

interface LevelUpAlertProps {
  newLevel: number;
  onClose?: () => void;
}

const LevelUpAlert = memo(function LevelUpAlert({
  newLevel,
  onClose,
}: LevelUpAlertProps) {
  const levelInfo = useMemo(() => getLevelInfo(newLevel), [newLevel]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-bounce-in max-w-sm mx-4">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">레벨 업!</h2>
        <div
          className="inline-block px-6 py-2 rounded-full text-white font-bold text-2xl mb-4"
          style={{ backgroundColor: levelInfo.color }}
        >
          Lv.{newLevel} {levelInfo.title}
        </div>
        <p className="text-gray-500 mb-6">축하합니다! 새로운 레벨에 도달했어요!</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
});

LevelUpAlert.displayName = 'LevelUpAlert';

// ============================================
// Export
// ============================================

export {
  BadgeItem,
  BadgeList,
  LevelBadge,
  ExpBar,
  PointsDisplay,
  GamificationCard,
  NewBadgeAlert,
  LevelUpAlert,
};

export default GamificationCard;
