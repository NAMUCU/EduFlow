// 게이미피케이션 API 라우트

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateStudentPoints,
  checkForNewBadges,
  createPointTransaction,
  getPointsForReason,
  generateMockLeaderboard,
  generateMockGamificationSummary,
  calculateLeaderboardRanks,
  checkLevelUp,
} from '@/lib/gamification';
import type {
  PointReason,
  AddPointsRequest,
  AddPointsResponse,
  LeaderboardResponse,
  GamificationSummary,
  BadgeCheckData,
} from '@/types/gamification';

// ============================================
// GET: 학생 게이미피케이션 정보 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');

    // 리더보드 조회
    if (action === 'leaderboard') {
      if (!classId) {
        return NextResponse.json(
          { error: '반 ID가 필요합니다.' },
          { status: 400 }
        );
      }

      // TODO: 실제 DB 연동 시 Supabase에서 조회
      const entries = generateMockLeaderboard(classId);

      const response: LeaderboardResponse = {
        classId,
        className: `${classId} 반`,
        entries,
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json(response);
    }

    // 학생별 게이미피케이션 요약 조회
    if (action === 'summary') {
      if (!studentId) {
        return NextResponse.json(
          { error: '학생 ID가 필요합니다.' },
          { status: 400 }
        );
      }

      // TODO: 실제 DB 연동 시 Supabase에서 조회
      const summary = generateMockGamificationSummary(studentId);

      return NextResponse.json(summary);
    }

    // 전체 배지 목록 조회
    if (action === 'badges') {
      const { getAllBadgeDefinitions } = await import('@/lib/gamification');
      const badges = getAllBadgeDefinitions().map(({ checkCondition, ...rest }) => rest);

      return NextResponse.json({ badges });
    }

    return NextResponse.json(
      { error: '유효하지 않은 요청입니다. action 파라미터를 확인해주세요.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('게이미피케이션 조회 오류:', error);
    return NextResponse.json(
      { error: '게이미피케이션 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: 포인트 추가
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: AddPointsRequest = await request.json();
    const { studentId, points, reason } = body;

    // 유효성 검사
    if (!studentId) {
      return NextResponse.json(
        { error: '학생 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (points === undefined || points <= 0) {
      return NextResponse.json(
        { error: '유효한 포인트 값이 필요합니다.' },
        { status: 400 }
      );
    }

    const validReasons: PointReason[] = [
      'assignment_submit',
      'streak',
      'grade_improve',
      'perfect_score',
      'attendance',
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: '유효하지 않은 포인트 획득 사유입니다.' },
        { status: 400 }
      );
    }

    // TODO: 실제 DB 연동 시 Supabase에서 현재 포인트 조회
    const previousPoints = 450; // Mock 데이터

    // 포인트 트랜잭션 생성
    const transaction = createPointTransaction(studentId, points, reason);

    // 새로운 총 포인트 계산
    const newTotalPoints = previousPoints + points;
    const newTotal = calculateStudentPoints(newTotalPoints, studentId);

    // 레벨업 체크
    const levelUp = checkLevelUp(previousPoints, newTotalPoints);

    // 배지 체크용 데이터 (TODO: 실제 데이터로 대체)
    const badgeCheckData: BadgeCheckData = {
      totalPoints: newTotalPoints,
      level: newTotal.level,
      streakDays: reason === 'streak' ? 7 : 0,
      perfectScoreCount: reason === 'perfect_score' ? 1 : 0,
      totalSubmissions: reason === 'assignment_submit' ? 1 : 0,
      gradeImprovement: reason === 'grade_improve' ? 15 : 0,
      isEarlySubmit: false,
      classRank: 5,
    };

    // 새로운 배지 체크 (TODO: 기존 배지 ID 목록 조회 필요)
    const existingBadgeIds = ['first_submit']; // Mock 데이터
    const newBadges = checkForNewBadges(badgeCheckData, existingBadgeIds);

    // TODO: 실제 DB 연동 시 트랜잭션, 포인트, 배지 저장

    const response: AddPointsResponse = {
      success: true,
      transaction,
      newTotal,
      newBadges: newBadges.length > 0 ? newBadges : undefined,
      levelUp,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('포인트 추가 오류:', error);
    return NextResponse.json(
      { error: '포인트를 추가하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT: 배지 수동 부여 (관리자용)
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, badgeId } = body;

    if (!studentId || !badgeId) {
      return NextResponse.json(
        { error: '학생 ID와 배지 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { getBadgeDefinition } = await import('@/lib/gamification');
    const badgeDefinition = getBadgeDefinition(badgeId);

    if (!badgeDefinition) {
      return NextResponse.json(
        { error: '유효하지 않은 배지 ID입니다.' },
        { status: 400 }
      );
    }

    // TODO: 실제 DB 연동 시 배지 부여 저장
    const newBadge = {
      id: badgeDefinition.id,
      name: badgeDefinition.name,
      description: badgeDefinition.description,
      icon: badgeDefinition.icon,
      condition: badgeDefinition.condition,
      earnedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      badge: newBadge,
      message: `'${badgeDefinition.name}' 배지가 부여되었습니다.`,
    });
  } catch (error) {
    console.error('배지 부여 오류:', error);
    return NextResponse.json(
      { error: '배지를 부여하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
