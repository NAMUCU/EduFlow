// 게이미피케이션 로직 구현

import type {
  StudentPoints,
  Badge,
  BadgeType,
  BadgeDefinition,
  BadgeCheckData,
  PointTransaction,
  PointReason,
  PointConfig,
  LevelInfo,
  LeaderboardEntry,
  GamificationSummary,
} from '@/types/gamification';

// ============================================
// 상수 정의
// ============================================

/**
 * 포인트 설정값
 */
export const POINT_CONFIG: PointConfig = {
  assignmentSubmit: 10,  // 과제 제출
  streak3: 15,           // 3일 연속 출석
  streak7: 30,           // 7일 연속 출석
  streak30: 100,         // 30일 연속 출석
  gradeImprove: 20,      // 성적 향상
  perfectScore: 50,      // 만점
  attendance: 5,         // 일반 출석
  earlySubmit: 15,       // 조기 제출 보너스
};

/**
 * 레벨당 필요 경험치 (100포인트)
 */
export const EXP_PER_LEVEL = 100;

/**
 * 레벨별 타이틀과 색상
 */
export const LEVEL_INFO: LevelInfo[] = [
  { level: 1, title: '새싹', minPoints: 0, maxPoints: 99, color: '#22c55e' },
  { level: 2, title: '풀잎', minPoints: 100, maxPoints: 199, color: '#16a34a' },
  { level: 3, title: '나무', minPoints: 200, maxPoints: 299, color: '#15803d' },
  { level: 4, title: '숲', minPoints: 300, maxPoints: 399, color: '#166534' },
  { level: 5, title: '별', minPoints: 400, maxPoints: 499, color: '#3b82f6' },
  { level: 6, title: '달', minPoints: 500, maxPoints: 599, color: '#2563eb' },
  { level: 7, title: '태양', minPoints: 600, maxPoints: 699, color: '#f59e0b' },
  { level: 8, title: '은하', minPoints: 700, maxPoints: 799, color: '#d946ef' },
  { level: 9, title: '우주', minPoints: 800, maxPoints: 899, color: '#8b5cf6' },
  { level: 10, title: '전설', minPoints: 900, maxPoints: Infinity, color: '#ef4444' },
];

/**
 * 배지 정의
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_submit',
    name: '첫 발걸음',
    description: '첫 과제를 제출했어요!',
    icon: '🎯',
    condition: '첫 과제 제출',
    checkCondition: (data) => data.totalSubmissions >= 1,
  },
  {
    id: 'streak_3',
    name: '꾸준함의 시작',
    description: '3일 연속 출석했어요!',
    icon: '🔥',
    condition: '3일 연속 출석',
    checkCondition: (data) => data.streakDays >= 3,
  },
  {
    id: 'streak_7',
    name: '일주일 전사',
    description: '7일 연속 출석했어요!',
    icon: '⚡',
    condition: '7일 연속 출석',
    checkCondition: (data) => data.streakDays >= 7,
  },
  {
    id: 'streak_30',
    name: '한 달의 기적',
    description: '30일 연속 출석했어요!',
    icon: '🏆',
    condition: '30일 연속 출석',
    checkCondition: (data) => data.streakDays >= 30,
  },
  {
    id: 'perfect_score',
    name: '완벽주의자',
    description: '첫 만점을 받았어요!',
    icon: '💯',
    condition: '첫 만점 달성',
    checkCondition: (data) => data.perfectScoreCount >= 1,
  },
  {
    id: 'perfect_streak_3',
    name: '연속 만점왕',
    description: '3회 연속 만점을 받았어요!',
    icon: '👑',
    condition: '3회 연속 만점',
    checkCondition: (data) => data.perfectScoreCount >= 3,
  },
  {
    id: 'grade_up_10',
    name: '성장의 증거',
    description: '성적이 10점 이상 올랐어요!',
    icon: '📈',
    condition: '10점 이상 성적 향상',
    checkCondition: (data) => data.gradeImprovement >= 10,
  },
  {
    id: 'level_5',
    name: '별을 향해',
    description: '레벨 5에 도달했어요!',
    icon: '⭐',
    condition: '레벨 5 달성',
    checkCondition: (data) => data.level >= 5,
  },
  {
    id: 'level_10',
    name: '전설의 시작',
    description: '레벨 10에 도달했어요!',
    icon: '🌟',
    condition: '레벨 10 달성',
    checkCondition: (data) => data.level >= 10,
  },
  {
    id: 'points_500',
    name: '500점 돌파',
    description: '누적 500 포인트를 달성했어요!',
    icon: '💎',
    condition: '500 포인트 달성',
    checkCondition: (data) => data.totalPoints >= 500,
  },
  {
    id: 'points_1000',
    name: '천점 클럽',
    description: '누적 1000 포인트를 달성했어요!',
    icon: '💰',
    condition: '1000 포인트 달성',
    checkCondition: (data) => data.totalPoints >= 1000,
  },
  {
    id: 'early_bird',
    name: '일찍 일어난 새',
    description: '마감 3일 전에 과제를 제출했어요!',
    icon: '🐦',
    condition: '마감 3일 전 제출',
    checkCondition: (data) => data.isEarlySubmit,
  },
  {
    id: 'top_ranker',
    name: '반의 자랑',
    description: '반에서 1등을 했어요!',
    icon: '🥇',
    condition: '반 1등',
    checkCondition: (data) => data.classRank === 1,
  },
];

// ============================================
// 레벨 계산 함수
// ============================================

/**
 * 포인트로 레벨 계산 (100포인트당 1레벨)
 */
export function calculateLevel(totalPoints: number): number {
  return Math.floor(totalPoints / EXP_PER_LEVEL) + 1;
}

/**
 * 현재 레벨에서의 경험치 계산
 */
export function calculateCurrentExp(totalPoints: number): number {
  return totalPoints % EXP_PER_LEVEL;
}

/**
 * 다음 레벨까지 필요한 경험치
 */
export function calculateNextLevelExp(totalPoints: number): number {
  return EXP_PER_LEVEL - calculateCurrentExp(totalPoints);
}

/**
 * 레벨 정보 가져오기
 */
export function getLevelInfo(level: number): LevelInfo {
  const index = Math.min(level - 1, LEVEL_INFO.length - 1);
  return LEVEL_INFO[Math.max(0, index)];
}

/**
 * 학생 포인트 정보 계산
 */
export function calculateStudentPoints(totalPoints: number, studentId: string): StudentPoints {
  const level = calculateLevel(totalPoints);
  return {
    studentId,
    totalPoints,
    level,
    currentExp: calculateCurrentExp(totalPoints),
    nextLevelExp: EXP_PER_LEVEL,
  };
}

// ============================================
// 포인트 획득 함수
// ============================================

/**
 * 포인트 획득 사유에 따른 포인트 계산
 */
export function getPointsForReason(reason: PointReason, additionalData?: { streakDays?: number; gradeImprovement?: number }): number {
  switch (reason) {
    case 'assignment_submit':
      return POINT_CONFIG.assignmentSubmit;
    case 'streak':
      const days = additionalData?.streakDays || 0;
      if (days >= 30) return POINT_CONFIG.streak30;
      if (days >= 7) return POINT_CONFIG.streak7;
      if (days >= 3) return POINT_CONFIG.streak3;
      return 0;
    case 'grade_improve':
      return POINT_CONFIG.gradeImprove;
    case 'perfect_score':
      return POINT_CONFIG.perfectScore;
    case 'attendance':
      return POINT_CONFIG.attendance;
    default:
      return 0;
  }
}

/**
 * 포인트 트랜잭션 생성
 */
export function createPointTransaction(
  studentId: string,
  points: number,
  reason: PointReason
): PointTransaction {
  return {
    id: `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    studentId,
    points,
    reason,
    createdAt: new Date().toISOString(),
  };
}

// ============================================
// 배지 관련 함수
// ============================================

/**
 * 배지 조건 체크 및 새로운 배지 반환
 */
export function checkForNewBadges(
  data: BadgeCheckData,
  existingBadgeIds: string[]
): Badge[] {
  const newBadges: Badge[] = [];

  for (const definition of BADGE_DEFINITIONS) {
    // 이미 획득한 배지는 스킵
    if (existingBadgeIds.includes(definition.id)) {
      continue;
    }

    // 조건 체크
    if (definition.checkCondition(data)) {
      newBadges.push({
        id: definition.id,
        name: definition.name,
        description: definition.description,
        icon: definition.icon,
        condition: definition.condition,
        earnedAt: new Date().toISOString(),
      });
    }
  }

  return newBadges;
}

/**
 * 배지 정의 가져오기
 */
export function getBadgeDefinition(badgeId: BadgeType): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((def) => def.id === badgeId);
}

/**
 * 모든 배지 정의 가져오기
 */
export function getAllBadgeDefinitions(): BadgeDefinition[] {
  return BADGE_DEFINITIONS;
}

// ============================================
// 리더보드 함수
// ============================================

/**
 * 리더보드 항목 정렬 및 순위 부여
 */
export function calculateLeaderboardRanks(
  entries: Omit<LeaderboardEntry, 'rank'>[]
): LeaderboardEntry[] {
  // 포인트 내림차순 정렬
  const sorted = [...entries].sort((a, b) => b.points - a.points);

  // 순위 부여 (동점자 처리)
  let currentRank = 1;
  let previousPoints = -1;

  return sorted.map((entry, index) => {
    if (entry.points !== previousPoints) {
      currentRank = index + 1;
    }
    previousPoints = entry.points;

    return {
      ...entry,
      rank: currentRank,
    };
  });
}

/**
 * 학생의 반 내 순위 계산
 */
export function getStudentRank(
  studentId: string,
  leaderboard: LeaderboardEntry[]
): number | undefined {
  const entry = leaderboard.find((e) => e.studentId === studentId);
  return entry?.rank;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 포인트 사유 한글 변환
 */
export function getReasonLabel(reason: PointReason): string {
  const labels: Record<PointReason, string> = {
    assignment_submit: '과제 제출',
    streak: '연속 출석',
    grade_improve: '성적 향상',
    perfect_score: '만점 달성',
    attendance: '출석',
  };
  return labels[reason] || reason;
}

/**
 * 경험치 바 퍼센트 계산
 */
export function calculateExpPercentage(currentExp: number, nextLevelExp: number): number {
  return Math.round((currentExp / nextLevelExp) * 100);
}

/**
 * 레벨업 여부 확인
 */
export function checkLevelUp(previousPoints: number, newPoints: number): boolean {
  return calculateLevel(previousPoints) < calculateLevel(newPoints);
}

/**
 * Mock 데이터 생성 (개발용)
 */
export function generateMockLeaderboard(classId: string): LeaderboardEntry[] {
  const mockStudents = [
    { studentId: 's1', studentName: '김민준', points: 850 },
    { studentId: 's2', studentName: '이서연', points: 780 },
    { studentId: 's3', studentName: '박지호', points: 720 },
    { studentId: 's4', studentName: '최수아', points: 650 },
    { studentId: 's5', studentName: '정예준', points: 580 },
    { studentId: 's6', studentName: '강하은', points: 520 },
    { studentId: 's7', studentName: '조민서', points: 480 },
    { studentId: 's8', studentName: '윤서준', points: 420 },
    { studentId: 's9', studentName: '임지아', points: 350 },
    { studentId: 's10', studentName: '한도윤', points: 280 },
  ];

  return calculateLeaderboardRanks(
    mockStudents.map((s) => ({
      ...s,
      level: calculateLevel(s.points),
    }))
  );
}

/**
 * Mock 게이미피케이션 요약 생성 (개발용)
 */
export function generateMockGamificationSummary(studentId: string): GamificationSummary {
  const totalPoints = Math.floor(Math.random() * 800) + 200;
  const level = calculateLevel(totalPoints);

  return {
    studentId,
    studentName: '테스트 학생',
    points: {
      studentId,
      totalPoints,
      level,
      currentExp: calculateCurrentExp(totalPoints),
      nextLevelExp: EXP_PER_LEVEL,
    },
    badges: [
      {
        id: 'first_submit',
        name: '첫 발걸음',
        description: '첫 과제를 제출했어요!',
        icon: '🎯',
        condition: '첫 과제 제출',
        earnedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'streak_3',
        name: '꾸준함의 시작',
        description: '3일 연속 출석했어요!',
        icon: '🔥',
        condition: '3일 연속 출석',
        earnedAt: '2024-01-20T10:00:00Z',
      },
    ],
    recentTransactions: [
      createPointTransaction(studentId, 10, 'assignment_submit'),
      createPointTransaction(studentId, 5, 'attendance'),
      createPointTransaction(studentId, 15, 'streak'),
    ],
    rank: Math.floor(Math.random() * 10) + 1,
  };
}
