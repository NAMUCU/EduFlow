/**
 * 관리자 대시보드 통계 API
 *
 * 전체 서비스 현황, 학원 수, 매출, 사용량 등
 * 시스템 전체 통계를 조회하는 API입니다.
 *
 * 실제 Supabase 데이터 기반으로 통계를 계산합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminStats } from '@/lib/services/dashboard-stats'
import type { AdminStatsResponse, PeriodType } from '@/types/stats'

/**
 * GET /api/stats/admin
 *
 * 쿼리 파라미터:
 * - period: 기간 (day, week, month, quarter, year) - 기본값: month
 * - academyId: 특정 학원 필터 (선택)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'month') as PeriodType
    const academyId = searchParams.get('academyId') || undefined

    // 유효한 기간 값 검증
    const validPeriods: PeriodType[] = ['day', 'week', 'month', 'quarter', 'year']
    if (!validPeriods.includes(period)) {
      return NextResponse.json<AdminStatsResponse>({
        success: false,
        error: '유효하지 않은 기간 값입니다. (day, week, month, quarter, year 중 선택)',
        timestamp: new Date().toISOString(),
        period: 'month',
      }, { status: 400 })
    }

    // 실제 Supabase 데이터 기반 통계 조회
    const stats = await getAdminStats({
      academyId,
      period,
    })

    return NextResponse.json<AdminStatsResponse>({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      period,
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
