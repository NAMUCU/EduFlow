// 게이미피케이션 관련 타입 정의

/**
 * 포인트 획득 사유
 */
export type PointReason =
  | 'assignment_submit'  // 과제 제출
  | 'streak'             // 연속 출석
  | 'grade_improve'      // 성적 향상
  | 'perfect_score'      // 만점
  | 'attendance';        // 출석

/**
 * 학생 포인트 정보
 */
export interface StudentPoints {
  studentId: string;
  totalPoints: number;
  level: number;
  currentExp: number;
  nextLevelExp: number;
}

/**
 * 배지 정보
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  earnedAt?: string;
}

/**
 * 포인트 거래 내역
 */
export interface PointTransaction {
  id: string;
  studentId: string;
  points: number;
  reason: PointReason;
  createdAt: string;
}

/**
 * 리더보드 항목
 */
export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  points: number;
  level: number;
}

/**
 * 배지 타입
 */
export type BadgeType =
  | 'first_submit'       // 첫 과제 제출
  | 'streak_3'           // 3일 연속 출석
  | 'streak_7'           // 7일 연속 출석
  | 'streak_30'          // 30일 연속 출석
  | 'perfect_score'      // 첫 만점
  | 'perfect_streak_3'   // 3회 연속 만점
  | 'grade_up_10'        // 10점 이상 성적 향상
  | 'level_5'            // 레벨 5 달성
  | 'level_10'           // 레벨 10 달성
  | 'points_500'         // 500 포인트 달성
  | 'points_1000'        // 1000 포인트 달성
  | 'early_bird'         // 마감 3일 전 제출
  | 'top_ranker';        // 반 1등

/**
 * 배지 정의 (시스템에서 사용)
 */
export interface BadgeDefinition {
  id: BadgeType;
  name: string;
  description: string;
  icon: string;
  condition: string;
  checkCondition: (data: BadgeCheckData) => boolean;
}

/**
 * 배지 조건 체크용 데이터
 */
export interface BadgeCheckData {
  totalPoints: number;
  level: number;
  streakDays: number;
  perfectScoreCount: number;
  totalSubmissions: number;
  gradeImprovement: number;
  isEarlySubmit: boolean;
  classRank: number;
}

/**
 * 게이미피케이션 요약 정보
 */
export interface GamificationSummary {
  studentId: string;
  studentName: string;
  points: StudentPoints;
  badges: Badge[];
  recentTransactions: PointTransaction[];
  rank?: number;
}

/**
 * 포인트 설정
 */
export interface PointConfig {
  assignmentSubmit: number;
  streak3: number;
  streak7: number;
  streak30: number;
  gradeImprove: number;
  perfectScore: number;
  attendance: number;
  earlySubmit: number;
}

/**
 * 레벨 정보
 */
export interface LevelInfo {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  color: string;
}

/**
 * 리더보드 응답
 */
export interface LeaderboardResponse {
  classId: string;
  className: string;
  entries: LeaderboardEntry[];
  updatedAt: string;
}

/**
 * 포인트 추가 요청
 */
export interface AddPointsRequest {
  studentId: string;
  points: number;
  reason: PointReason;
}

/**
 * 포인트 추가 응답
 */
export interface AddPointsResponse {
  success: boolean;
  transaction: PointTransaction;
  newTotal: StudentPoints;
  newBadges?: Badge[];
  levelUp?: boolean;
}
