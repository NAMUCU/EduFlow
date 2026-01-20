/**
 * 선생님 대시보드 통계 API
 *
 * 선생님이 담당하는 학생들의 현황, 과제 진행 상황, 성적 분포 등을
 * 조회하는 API입니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type {
  TeacherStats,
  TeacherStatsResponse,
  StudentSummary,
  AssignmentSummary,
  SubjectStats,
  TimeSeriesDataPoint,
} from '@/types/stats'

/**
 * GET /api/stats/teacher
 *
 * 쿼리 파라미터:
 * - period: 기간 (day, week, month, quarter, year) - 기본값: week
 * - academyId: 학원 ID (필수)
 * - teacherId: 선생님 ID (선택, 없으면 전체)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'
    const academyId = searchParams.get('academyId')
    // const teacherId = searchParams.get('teacherId')

    // academyId 검증
    if (!academyId) {
      return NextResponse.json<TeacherStatsResponse>({
        success: false,
        error: '학원 ID가 필요합니다.',
        timestamp: new Date().toISOString(),
        period: period as TeacherStatsResponse['period'],
      }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // 실제 데이터베이스 조회 (현재는 Mock 데이터 사용)
    // TODO: 실제 Supabase 쿼리로 대체

    // 학생 수 조회
    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('academy_id', academyId)

    // Mock 데이터 생성 (실제 구현 시 DB 쿼리로 대체)
    const mockStats: TeacherStats = {
      // 요약 통계
      totalStudents: studentCount ?? 65,
      totalStudentsChange: 3,
      weeklyProblemsCreated: 142,
      weeklyProblemsChange: 28,
      submissionRate: 87,
      submissionRateChange: 5,
      averageScoreImprovement: 12,

      // 학생 현황
      recentStudents: generateMockStudents(),

      // 과제 현황
      recentAssignments: generateMockAssignments(),

      // 성적 분포
      gradeDistribution: [
        { range: '90-100', count: 12, percentage: 18 },
        { range: '80-89', count: 23, percentage: 35 },
        { range: '70-79', count: 18, percentage: 28 },
        { range: '60-69', count: 8, percentage: 12 },
        { range: '0-59', count: 4, percentage: 7 },
      ],

      // 과목별 문제 생성 통계
      problemsBySubject: [
        { subject: '수학', count: 85, percentage: 60 },
        { subject: '영어', count: 35, percentage: 25 },
        { subject: '국어', count: 15, percentage: 10 },
        { subject: '과학', count: 7, percentage: 5 },
      ],

      // 주간 문제 생성 추이
      weeklyProblemsTrend: generateWeeklyTrend(),
    }

    return NextResponse.json<TeacherStatsResponse>({
      success: true,
      data: mockStats,
      timestamp: new Date().toISOString(),
      period: period as TeacherStatsResponse['period'],
    })

  } catch (error) {
    console.error('선생님 통계 조회 오류:', error)
    return NextResponse.json<TeacherStatsResponse>({
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

function generateMockStudents(): StudentSummary[] {
  return [
    { id: '1', name: '김민준', grade: '중2', score: 85, status: '향상' },
    { id: '2', name: '이서연', grade: '중3', score: 92, status: '유지' },
    { id: '3', name: '박지호', grade: '중2', score: 78, status: '주의' },
    { id: '4', name: '최수아', grade: '중1', score: 88, status: '향상' },
    { id: '5', name: '정예은', grade: '중2', score: 95, status: '향상' },
  ]
}

function generateMockAssignments(): AssignmentSummary[] {
  return [
    {
      id: '1',
      title: '중2 이차방정식 테스트',
      totalStudents: 24,
      submittedCount: 20,
      dueDate: '2025-01-20',
      status: 'active',
    },
    {
      id: '2',
      title: '중3 피타고라스 정리',
      totalStudents: 18,
      submittedCount: 18,
      dueDate: '2025-01-19',
      status: 'completed',
    },
    {
      id: '3',
      title: '중1 일차방정식 복습',
      totalStudents: 23,
      submittedCount: 19,
      dueDate: '2025-01-18',
      status: 'active',
    },
  ]
}

function generateWeeklyTrend(): TimeSeriesDataPoint[] {
  const days = ['월', '화', '수', '목', '금', '토', '일']
  const today = new Date()

  return days.map((day, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (6 - index))

    return {
      date: date.toISOString().split('T')[0],
      label: day,
      value: Math.floor(Math.random() * 30) + 10,
    }
  })
}
