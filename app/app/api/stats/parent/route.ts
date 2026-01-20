/**
 * 학부모 대시보드 통계 API
 *
 * 자녀의 학습 현황, 출석률, 과제 완료율, 성적 추이 등을
 * 조회하는 API입니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type {
  ParentStats,
  ParentStatsResponse,
  ChildInfo,
} from '@/types/stats'

/**
 * GET /api/stats/parent
 *
 * 쿼리 파라미터:
 * - period: 기간 (day, week, month, quarter, year) - 기본값: week
 * - parentId: 학부모 ID (필수)
 * - childId: 자녀 ID (선택, 여러 자녀가 있는 경우)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'
    const parentId = searchParams.get('parentId')
    const childId = searchParams.get('childId')

    // parentId 검증
    if (!parentId) {
      return NextResponse.json<ParentStatsResponse>({
        success: false,
        error: '학부모 ID가 필요합니다.',
        timestamp: new Date().toISOString(),
        period: period as ParentStatsResponse['period'],
      }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // 실제 데이터베이스 조회 (현재는 Mock 데이터 사용)
    // TODO: 실제 Supabase 쿼리로 대체

    // 자녀 정보 조회
    let studentQuery = supabase
      .from('students')
      .select('*, users!students_user_id_fkey(*), academies(*)')
      .eq('parent_id', parentId)

    if (childId) {
      studentQuery = studentQuery.eq('id', childId)
    }

    const { data: studentData } = await studentQuery.single() as { data: any }

    // Mock 자녀 정보
    const childInfo: ChildInfo = {
      id: childId || '1',
      name: studentData?.users?.name || '김민준',
      grade: studentData?.grade || '중학교 2학년',
      academy: studentData?.academies?.name || '정훈수학학원',
      teacher: '박정훈 선생님',
    }

    // Mock 데이터 생성
    const mockStats: ParentStats = {
      // 자녀 정보
      child: childInfo,

      // 요약 통계
      weeklyStudyTime: '12시간 30분',
      weeklyStudyTimeChange: '+2시간',
      assignmentCompletionRate: 85,
      assignmentCompletionChange: 5,
      averageScore: 82,
      averageScoreChange: 3,
      attendanceRate: 95,
      monthlyGoalProgress: 78,

      // 주간 학습 현황
      weeklyProgress: [
        { day: '월', hours: 2.5, completedAssignments: 3 },
        { day: '화', hours: 1.5, completedAssignments: 2 },
        { day: '수', hours: 3.0, completedAssignments: 4 },
        { day: '목', hours: 2.0, completedAssignments: 3 },
        { day: '금', hours: 2.5, completedAssignments: 3 },
        { day: '토', hours: 1.0, completedAssignments: 1 },
        { day: '일', hours: 0, completedAssignments: 0 },
      ],

      // 최근 과제 현황
      recentAssignments: [
        { title: '이차방정식 연습문제', dueDate: '2025-01-20', status: 'completed', score: 88 },
        { title: '피타고라스 정리 활용', dueDate: '2025-01-19', status: 'completed', score: 92 },
        { title: '인수분해 기초', dueDate: '2025-01-22', status: 'pending', score: null },
        { title: '일차함수 그래프', dueDate: '2025-01-23', status: 'pending', score: null },
      ],

      // 과목별 성적 현황
      subjectPerformance: [
        { subject: '수학', currentScore: 85, previousScore: 78, trend: 'up' },
        { subject: '영어', currentScore: 88, previousScore: 90, trend: 'down' },
        { subject: '국어', currentScore: 82, previousScore: 82, trend: 'stable' },
        { subject: '과학', currentScore: 76, previousScore: 72, trend: 'up' },
      ],

      // 출석 현황
      attendanceRecent: [
        { date: '2025-01-20', status: 'present', checkInTime: '16:30', checkOutTime: '19:00' },
        { date: '2025-01-18', status: 'present', checkInTime: '16:35', checkOutTime: '19:05' },
        { date: '2025-01-17', status: 'late', checkInTime: '16:50', checkOutTime: '19:00' },
        { date: '2025-01-16', status: 'present', checkInTime: '16:30', checkOutTime: '19:00' },
        { date: '2025-01-15', status: 'present', checkInTime: '16:32', checkOutTime: '19:02' },
      ],

      // 학원 공지사항
      notices: [
        { title: '1월 정기 테스트 안내', date: '2025-01-18', type: 'info' },
        { title: '설 연휴 학원 휴무 안내', date: '2025-01-17', type: 'notice' },
        { title: '겨울방학 특강 신청 안내', date: '2025-01-15', type: 'info' },
      ],
    }

    return NextResponse.json<ParentStatsResponse>({
      success: true,
      data: mockStats,
      timestamp: new Date().toISOString(),
      period: period as ParentStatsResponse['period'],
    })

  } catch (error) {
    console.error('학부모 통계 조회 오류:', error)
    return NextResponse.json<ParentStatsResponse>({
      success: false,
      error: '통계 데이터를 불러오는 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString(),
      period: 'week',
    }, { status: 500 })
  }
}
