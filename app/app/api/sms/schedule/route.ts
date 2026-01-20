/**
 * SMS 예약 발송 API 라우트
 *
 * POST /api/sms/schedule - 예약 발송 생성
 * GET /api/sms/schedule - 예약 발송 목록 조회
 * PUT /api/sms/schedule - 예약 발송 수정
 * DELETE /api/sms/schedule - 예약 발송 취소
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import {
  SmsSchedule,
  SmsScheduleType,
  SmsScheduleStatus,
  CreateSmsScheduleRequest,
  SCHEDULE_TYPE_TEMPLATES,
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_STATUS_LABELS,
  isSchedulerEnabled,
  isSendableTime,
  getNextSendableTime,
} from '@/lib/sms-scheduler'
import { getTemplateById } from '@/lib/sms-templates'

// ============================================
// 타입 정의
// ============================================

interface ScheduleListResponse {
  success: boolean
  schedules?: SmsSchedule[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  error?: string
}

interface ScheduleResponse {
  success: boolean
  schedule?: SmsSchedule
  error?: string
}

// ============================================
// POST /api/sms/schedule - 예약 발송 생성
// ============================================

/**
 * POST /api/sms/schedule
 * 새로운 SMS 예약 발송을 생성합니다.
 *
 * Request Body:
 * - type: SmsScheduleType (발송 유형)
 * - scheduledAt: string (예약 시각, ISO 8601 형식)
 * - academyId: string (학원 ID)
 * - targetIds: string[] (대상 학생/과제 ID 목록)
 * - templateId: string (템플릿 ID)
 * - variables?: Record<string, string> (템플릿 변수 값)
 */
export async function POST(request: NextRequest): Promise<NextResponse<ScheduleResponse>> {
  try {
    // 스케줄러 활성화 확인
    if (!isSchedulerEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMS 스케줄러가 비활성화되어 있습니다. SMS_SCHEDULER_ENABLED 환경 변수를 확인하세요.',
        },
        { status: 503 }
      )
    }

    const body: CreateSmsScheduleRequest = await request.json()
    const { type, scheduledAt, academyId, targetIds, templateId, variables = {} } = body

    // 필수 파라미터 검증
    if (!type || !scheduledAt || !academyId || !targetIds?.length) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 파라미터가 누락되었습니다. (type, scheduledAt, academyId, targetIds)',
        },
        { status: 400 }
      )
    }

    // 유효한 스케줄 타입 검증
    const validTypes: SmsScheduleType[] = ['assignment_new', 'assignment_reminder', 'assignment_graded', 'weekly_report']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `유효하지 않은 스케줄 타입입니다. 허용: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // 템플릿 검증
    const finalTemplateId = templateId || SCHEDULE_TYPE_TEMPLATES[type]
    const template = getTemplateById(finalTemplateId)
    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: `템플릿을 찾을 수 없습니다: ${finalTemplateId}`,
        },
        { status: 400 }
      )
    }

    // 예약 시각 검증
    const scheduledDate = new Date(scheduledAt)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 예약 시각입니다. ISO 8601 형식을 사용하세요.',
        },
        { status: 400 }
      )
    }

    // 과거 시간 예약 방지
    if (scheduledDate < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: '과거 시간으로는 예약할 수 없습니다.',
        },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createServerSupabaseClient()

    // 예약 발송 생성
    const scheduleData = {
      type,
      status: 'pending' as SmsScheduleStatus,
      scheduled_at: scheduledAt,
      academy_id: academyId,
      target_ids: targetIds,
      template_id: finalTemplateId,
      variables,
      total_count: targetIds.length,
      success_count: 0,
      failed_count: 0,
    }

    const { data, error } = await (supabase as any)
      .from('sms_schedules')
      .insert(scheduleData)
      .select()
      .single()

    if (error) {
      // 테이블이 없는 경우 Mock 응답
      if (error.message?.includes('does not exist')) {
        console.warn('[SMS 스케줄] sms_schedules 테이블이 없습니다. Mock 응답을 반환합니다.')

        const mockSchedule: SmsSchedule = {
          id: `mock_${Date.now()}`,
          type,
          status: 'pending',
          scheduledAt,
          academyId,
          targetIds,
          templateId: finalTemplateId,
          variables,
          totalCount: targetIds.length,
          successCount: 0,
          failedCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        return NextResponse.json({
          success: true,
          schedule: mockSchedule,
        })
      }

      throw error
    }

    // 응답 데이터 변환
    const schedule: SmsSchedule = {
      id: data.id,
      type: data.type,
      status: data.status,
      scheduledAt: data.scheduled_at,
      executedAt: data.executed_at,
      academyId: data.academy_id,
      targetIds: data.target_ids,
      templateId: data.template_id,
      variables: data.variables,
      totalCount: data.total_count,
      successCount: data.success_count,
      failedCount: data.failed_count,
      errorMessage: data.error_message,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    console.error('SMS 예약 생성 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

// ============================================
// GET /api/sms/schedule - 예약 발송 목록 조회
// ============================================

/**
 * GET /api/sms/schedule
 * SMS 예약 발송 목록을 조회합니다.
 *
 * Query Parameters:
 * - academyId: string (학원 ID, 필수)
 * - status: SmsScheduleStatus (상태 필터, 선택)
 * - type: SmsScheduleType (타입 필터, 선택)
 * - page: number (페이지 번호, 기본: 1)
 * - limit: number (페이지당 항목 수, 기본: 20)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ScheduleListResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get('academyId')
    const status = searchParams.get('status') as SmsScheduleStatus | null
    const type = searchParams.get('type') as SmsScheduleType | null
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // 학원 ID 필수
    if (!academyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'academyId 파라미터가 필요합니다.',
        },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createServerSupabaseClient()

    // 쿼리 구성
    let query = (supabase as any)
      .from('sms_schedules')
      .select('*', { count: 'exact' })
      .eq('academy_id', academyId)
      .order('scheduled_at', { ascending: false })

    // 상태 필터
    if (status) {
      query = query.eq('status', status)
    }

    // 타입 필터
    if (type) {
      query = query.eq('type', type)
    }

    // 페이지네이션
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      // 테이블이 없는 경우 빈 배열 반환
      if (error.message?.includes('does not exist')) {
        console.warn('[SMS 스케줄] sms_schedules 테이블이 없습니다. 빈 목록을 반환합니다.')

        return NextResponse.json({
          success: true,
          schedules: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        })
      }

      throw error
    }

    // 응답 데이터 변환
    const schedules: SmsSchedule[] = (data || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      scheduledAt: row.scheduled_at,
      executedAt: row.executed_at,
      academyId: row.academy_id,
      targetIds: row.target_ids,
      templateId: row.template_id,
      variables: row.variables,
      totalCount: row.total_count,
      successCount: row.success_count,
      failedCount: row.failed_count,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    const total = count || 0

    return NextResponse.json({
      success: true,
      schedules,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('SMS 예약 목록 조회 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

// ============================================
// PUT /api/sms/schedule - 예약 발송 수정
// ============================================

/**
 * PUT /api/sms/schedule
 * SMS 예약 발송을 수정합니다.
 *
 * Request Body:
 * - id: string (스케줄 ID, 필수)
 * - scheduledAt?: string (예약 시각)
 * - variables?: Record<string, string> (템플릿 변수)
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ScheduleResponse>> {
  try {
    const body = await request.json()
    const { id, scheduledAt, variables } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '스케줄 ID가 필요합니다.',
        },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createServerSupabaseClient()

    // 현재 스케줄 조회
    const { data: existing, error: fetchError } = await (supabase as any)
      .from('sms_schedules')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            success: false,
            error: 'sms_schedules 테이블이 존재하지 않습니다.',
          },
          { status: 404 }
        )
      }
      throw fetchError
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: '스케줄을 찾을 수 없습니다.',
        },
        { status: 404 }
      )
    }

    // 이미 처리된 스케줄은 수정 불가
    if (existing.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `${SCHEDULE_STATUS_LABELS[existing.status as SmsScheduleStatus]} 상태의 스케줄은 수정할 수 없습니다.`,
        },
        { status: 400 }
      )
    }

    // 업데이트 데이터 구성
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt)
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: '유효하지 않은 예약 시각입니다.',
          },
          { status: 400 }
        )
      }
      if (scheduledDate < new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: '과거 시간으로는 예약할 수 없습니다.',
          },
          { status: 400 }
        )
      }
      updateData.scheduled_at = scheduledAt
    }

    if (variables) {
      updateData.variables = variables
    }

    // 업데이트 실행
    const { data, error } = await (supabase as any)
      .from('sms_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 응답 데이터 변환
    const schedule: SmsSchedule = {
      id: data.id,
      type: data.type,
      status: data.status,
      scheduledAt: data.scheduled_at,
      executedAt: data.executed_at,
      academyId: data.academy_id,
      targetIds: data.target_ids,
      templateId: data.template_id,
      variables: data.variables,
      totalCount: data.total_count,
      successCount: data.success_count,
      failedCount: data.failed_count,
      errorMessage: data.error_message,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    console.error('SMS 예약 수정 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE /api/sms/schedule - 예약 발송 취소
// ============================================

/**
 * DELETE /api/sms/schedule
 * SMS 예약 발송을 취소합니다.
 *
 * Query Parameters:
 * - id: string (스케줄 ID, 필수)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ScheduleResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '스케줄 ID가 필요합니다.',
        },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createServerSupabaseClient()

    // 현재 스케줄 조회
    const { data: existing, error: fetchError } = await (supabase as any)
      .from('sms_schedules')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            success: false,
            error: 'sms_schedules 테이블이 존재하지 않습니다.',
          },
          { status: 404 }
        )
      }
      throw fetchError
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: '스케줄을 찾을 수 없습니다.',
        },
        { status: 404 }
      )
    }

    // 이미 처리 중이거나 완료된 스케줄은 취소 불가
    if (existing.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `${SCHEDULE_STATUS_LABELS[existing.status as SmsScheduleStatus]} 상태의 스케줄은 취소할 수 없습니다.`,
        },
        { status: 400 }
      )
    }

    // 취소 상태로 업데이트
    const { data, error } = await (supabase as any)
      .from('sms_schedules')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 응답 데이터 변환
    const schedule: SmsSchedule = {
      id: data.id,
      type: data.type,
      status: data.status,
      scheduledAt: data.scheduled_at,
      executedAt: data.executed_at,
      academyId: data.academy_id,
      targetIds: data.target_ids,
      templateId: data.template_id,
      variables: data.variables,
      totalCount: data.total_count,
      successCount: data.success_count,
      failedCount: data.failed_count,
      errorMessage: data.error_message,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    console.error('SMS 예약 취소 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
