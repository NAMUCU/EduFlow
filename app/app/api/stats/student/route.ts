/**
 * 학생 대시보드 통계 API
 *
 * 학생 개인의 학습 현황, 과제 진행 상태, 성적 추이 등을
 * 조회하는 API입니다.
 *
 * 실제 Supabase 데이터 기반으로 통계를 계산합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStudentStats } from '@/lib/services/dashboard-stats'
import type { StudentStatsResponse, PeriodType } from '@/types/stats'

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
    const period = (searchParams.get('period') || 'week') as PeriodType
    const studentId = searchParams.get('studentId')

    // studentId 검증
    if (!studentId) {
      return NextResponse.json<StudentStatsResponse>({
        success: false,
        error: '학생 ID가 필요합니다.',
        timestamp: new Date().toISOString(),
        period,
      }, { status: 400 })
    }

    // 유효한 기간 값 검증
    const validPeriods: PeriodType[] = ['day', 'week', 'month', 'quarter', 'year']
    if (!validPeriods.includes(period)) {
      return NextResponse.json<StudentStatsResponse>({
        success: false,
        error: '유효하지 않은 기간 값입니다. (day, week, month, quarter, year 중 선택)',
        timestamp: new Date().toISOString(),
        period: 'week',
      }, { status: 400 })
    }

    // 실제 Supabase 데이터 기반 통계 조회
    const stats = await getStudentStats({
      studentId,
      period,
    })

    return NextResponse.json<StudentStatsResponse>({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      period,
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
