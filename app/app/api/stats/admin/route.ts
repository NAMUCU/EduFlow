/**
 * 관리자 대시보드 통계 API
 *
 * 전체 서비스 현황, 학원 수, 매출, 사용량 등
 * 시스템 전체 통계를 조회하는 API입니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type {
  AdminStats,
  AdminStatsResponse,
  AcademySummary,
  SubjectStats,
  TimeSeriesDataPoint,
} from '@/types/stats'

/**
 * GET /api/stats/admin
 *
 * 쿼리 파라미터:
 * - period: 기간 (day, week, month, quarter, year) - 기본값: month
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    const supabase = createServerSupabaseClient()

    // 실제 데이터베이스 조회 (현재는 Mock 데이터 사용)
    // TODO: 실제 Supabase 쿼리로 대체

    // 학원 수 조회
    const { count: academyCount } = await supabase
      .from('academies')
      .select('*', { count: 'exact', head: true })

    // 사용자 수 조회
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // 문제 수 조회
    const { count: problemCount } = await supabase
      .from('problems')
      .select('*', { count: 'exact', head: true })

    // Mock 데이터 생성
    const mockStats: AdminStats = {
      // 요약 통계
      totalAcademies: academyCount ?? 127,
      totalAcademiesChange: 12,
      totalUsers: userCount ?? 1842,
      totalUsersChange: 156,
      monthlyProblems: problemCount ?? 45678,
      monthlyProblemsChange: 8234,
      monthlyRevenue: 12450000,
      monthlyRevenueChange: 15,

      // 사용자 통계
      usersByRole: [
        { role: 'owner', count: 127, percentage: 7 },
        { role: 'teacher', count: 385, percentage: 21 },
        { role: 'parent', count: 520, percentage: 28 },
        { role: 'student', count: 810, percentage: 44 },
      ],

      // 학원 요금제별 분포
      academiesByPlan: [
        { plan: 'free', count: 32, percentage: 25 },
        { plan: 'basic', count: 45, percentage: 35 },
        { plan: 'pro', count: 38, percentage: 30 },
        { plan: 'enterprise', count: 12, percentage: 10 },
      ],

      // 최근 가입 학원
      recentAcademies: generateMockRecentAcademies(),

      // TOP 학원
      topAcademies: [
        { name: '명문학원', problems: 4521, rank: 1 },
        { name: '스마트에듀', problems: 3892, rank: 2 },
        { name: '최상위학원', problems: 3654, rank: 3 },
        { name: '영재교육원', problems: 2987, rank: 4 },
        { name: '수학의정석', problems: 2543, rank: 5 },
      ],

      // 과목별 문제 생성 분포
      problemsBySubject: generateSubjectStats(),

      // 문제 생성 추이 (일별)
      dailyProblemsTrend: generateDailyTrend(),

      // 매출 추이 (월별)
      monthlyRevenueTrend: generateRevenueTrend(),

      // 신규 가입 추이
      newSignupsTrend: generateSignupsTrend(),

      // 시스템 사용량
      systemUsage: {
        apiCalls: 1250000,
        storageUsed: 45.2,
        activeUsers: 892,
        peakHour: '16:00-18:00',
      },
    }

    return NextResponse.json<AdminStatsResponse>({
      success: true,
      data: mockStats,
      timestamp: new Date().toISOString(),
      period: period as AdminStatsResponse['period'],
    })

  } catch (error) {
    console.error('관리자 통계 조회 오류:', error)
    return NextResponse.json<AdminStatsResponse>({
      success: false,
      error: '통계 데이터를 불러오는 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString(),
      period: 'month',
    }, { status: 500 })
  }
}

// ============================================
// Mock 데이터 생성 함수
// ============================================

function generateMockRecentAcademies(): AcademySummary[] {
  return [
    {
      id: '1',
      name: '스마트 수학학원',
      owner: '김영희',
      plan: 'pro',
      status: 'active',
      joinDate: '2025-01-18',
      studentCount: 45,
      monthlyProblems: 1234,
    },
    {
      id: '2',
      name: '영어마을학원',
      owner: '이철수',
      plan: 'basic',
      status: 'active',
      joinDate: '2025-01-17',
      studentCount: 32,
      monthlyProblems: 876,
    },
    {
      id: '3',
      name: '과학탐구교실',
      owner: '박지민',
      plan: 'pro',
      status: 'pending',
      joinDate: '2025-01-16',
      studentCount: 0,
      monthlyProblems: 0,
    },
    {
      id: '4',
      name: '국어논술학원',
      owner: '최수진',
      plan: 'enterprise',
      status: 'active',
      joinDate: '2025-01-15',
      studentCount: 128,
      monthlyProblems: 3456,
    },
    {
      id: '5',
      name: '종합학습센터',
      owner: '정민호',
      plan: 'basic',
      status: 'active',
      joinDate: '2025-01-14',
      studentCount: 67,
      monthlyProblems: 1567,
    },
  ]
}

function generateSubjectStats(): SubjectStats[] {
  return [
    { subject: '수학', count: 20555, percentage: 45 },
    { subject: '영어', count: 11420, percentage: 25 },
    { subject: '국어', count: 8222, percentage: 18 },
    { subject: '과학', count: 5481, percentage: 12 },
  ]
}

function generateDailyTrend(): TimeSeriesDataPoint[] {
  const data: TimeSeriesDataPoint[] = []
  const today = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    data.push({
      date: date.toISOString().split('T')[0],
      label: `${date.getDate()}일`,
      value: Math.floor(Math.random() * 2000) + 3000,
    })
  }

  return data
}

function generateRevenueTrend(): TimeSeriesDataPoint[] {
  const months = ['8월', '9월', '10월', '11월', '12월', '1월']
  const baseRevenue = 8000000

  return months.map((month, index) => ({
    date: `2024-${8 + index}-01`,
    label: month,
    value: baseRevenue + Math.floor(Math.random() * 2000000) + index * 500000,
  }))
}

function generateSignupsTrend(): TimeSeriesDataPoint[] {
  const months = ['8월', '9월', '10월', '11월', '12월', '1월']

  return months.map((month, index) => ({
    date: `2024-${8 + index}-01`,
    label: month,
    value: Math.floor(Math.random() * 10) + 15 + index,
  }))
}
