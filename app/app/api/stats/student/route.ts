/**
 * 학생 대시보드 통계 API
 *
 * 학생 개인의 학습 현황, 과제 진행 상태, 성적 추이 등을
 * 조회하는 API입니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type {
  StudentStats,
  StudentStatsResponse,
  StudentAssignmentStatus,
  StudentGradeRecord,
  TimeSeriesDataPoint,
} from '@/types/stats'

/**
 * GET /api/stats/student
 *
 * 쿼리 파라미터:
 * - period: 기간 (day, week, month, quarter, year) - 기본값: week
 * - studentId: 학생 ID (필수)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'
    const studentId = searchParams.get('studentId')

    // studentId 검증
    if (!studentId) {
      return NextResponse.json<StudentStatsResponse>({
        success: false,
        error: '학생 ID가 필요합니다.',
        timestamp: new Date().toISOString(),
        period: period as StudentStatsResponse['period'],
      }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // 실제 데이터베이스 조회 (현재는 Mock 데이터 사용)
    // TODO: 실제 Supabase 쿼리로 대체

    // 학생 정보 조회
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()

    // 연속 학습일 계산 (Mock)
    const studyStreak = calculateStudyStreak()

    // Mock 데이터 생성
    const mockStats: StudentStats = {
      // 요약 통계
      studyStreak: studyStreak,
      weeklyGoalProgress: 75,
      solvedProblems: 45,
      wrongProblems: 12,
      averageScore: 82,
      rank: 5,

      // 오늘의 과제
      todayAssignments: generateMockTodayAssignments(),

      // 최근 성적
      recentGrades: generateMockGrades(),

      // 과목별 성적 추이
      subjectScoreTrend: [
        {
          subject: '수학',
          data: generateScoreTrend('수학'),
        },
        {
          subject: '영어',
          data: generateScoreTrend('영어'),
        },
      ],

      // 주간 학습 현황
      weeklyStudyData: [
        { day: '월', studyMinutes: 150, problemsSolved: 25 },
        { day: '화', studyMinutes: 90, problemsSolved: 15 },
        { day: '수', studyMinutes: 180, problemsSolved: 30 },
        { day: '목', studyMinutes: 120, problemsSolved: 20 },
        { day: '금', studyMinutes: 150, problemsSolved: 25 },
        { day: '토', studyMinutes: 60, problemsSolved: 10 },
        { day: '일', studyMinutes: 0, problemsSolved: 0 },
      ],

      // 취약 단원
      weakUnits: [
        { subject: '수학', unit: '이차방정식의 활용', correctRate: 45 },
        { subject: '영어', unit: '관계부사', correctRate: 52 },
        { subject: '수학', unit: '연립방정식', correctRate: 58 },
      ],
    }

    return NextResponse.json<StudentStatsResponse>({
      success: true,
      data: mockStats,
      timestamp: new Date().toISOString(),
      period: period as StudentStatsResponse['period'],
    })

  } catch (error) {
    console.error('학생 통계 조회 오류:', error)
    return NextResponse.json<StudentStatsResponse>({
      success: false,
      error: '통계 데이터를 불러오는 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString(),
      period: 'week',
    }, { status: 500 })
  }
}

// ============================================
// Mock 데이터 생성 함수
// ============================================

function calculateStudyStreak(): number {
  // 실제 구현 시에는 attendance 테이블에서 연속 출석일 계산
  return 7
}

function generateMockTodayAssignments(): StudentAssignmentStatus[] {
  return [
    {
      id: '1',
      subject: '수학',
      title: '이차함수 기본 개념',
      problemCount: 10,
      completedCount: 7,
      dueDate: '오늘 23:59',
      status: 'in_progress',
    },
    {
      id: '2',
      subject: '영어',
      title: '문법 - 관계대명사',
      problemCount: 15,
      completedCount: 15,
      dueDate: '오늘 23:59',
      status: 'completed',
    },
    {
      id: '3',
      subject: '수학',
      title: '인수분해 연습문제',
      problemCount: 20,
      completedCount: 0,
      dueDate: '내일 23:59',
      status: 'not_started',
    },
  ]
}

function generateMockGrades(): StudentGradeRecord[] {
  return [
    { subject: '수학', chapter: '이차함수', score: 85, totalScore: 100, date: '1월 18일' },
    { subject: '영어', chapter: '관계대명사', score: 92, totalScore: 100, date: '1월 17일' },
    { subject: '수학', chapter: '인수분해', score: 78, totalScore: 100, date: '1월 15일' },
    { subject: '국어', chapter: '비문학 독해', score: 88, totalScore: 100, date: '1월 14일' },
  ]
}

function generateScoreTrend(subject: string): TimeSeriesDataPoint[] {
  const months = ['10월', '11월', '12월', '1월']
  const baseScore = subject === '수학' ? 70 : 75

  return months.map((month, index) => ({
    date: `2024-${10 + index}-01`,
    label: month,
    value: baseScore + Math.floor(Math.random() * 10) + index * 3,
  }))
}
