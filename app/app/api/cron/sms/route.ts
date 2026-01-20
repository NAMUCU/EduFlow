/**
 * SMS Cron Job API 라우트
 *
 * Vercel Cron Job에서 호출되어 예약된 SMS를 발송합니다.
 *
 * GET /api/cron/sms - 예약된 SMS 발송 실행
 *
 * 환경 변수:
 * - CRON_SECRET: Cron Job 인증용 시크릿 키
 * - SMS_SCHEDULER_ENABLED: 스케줄러 활성화 여부
 *
 * 이 API는 다음 작업을 수행합니다:
 * 1. 실행 대기 중인 스케줄 조회 (pending 상태, 예약 시각 <= 현재)
 * 2. 각 스케줄에 대해 대상 학생/학부모 정보 조회
 * 3. 병렬 배치 처리로 SMS 발송
 * 4. 발송 결과 업데이트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import {
  SmsSchedule,
  SmsScheduleType,
  executeSchedule,
  isSchedulerEnabled,
  isSendableTime,
  processBatchParallel,
  SCHEDULE_TYPE_LABELS,
} from '@/lib/sms-scheduler'
import { SmsRecipient } from '@/types/sms'

// ============================================
// 타입 정의
// ============================================

interface CronResponse {
  success: boolean
  message: string
  processed?: number
  results?: {
    scheduleId: string
    type: string
    status: 'completed' | 'failed'
    successCount: number
    failedCount: number
    error?: string
  }[]
}

// ============================================
// Cron Job 인증 검증
// ============================================

/**
 * Cron Job 요청 인증
 * Vercel Cron Job은 CRON_SECRET 헤더로 인증합니다.
 */
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // 개발 환경에서는 인증 생략 가능
  if (process.env.NODE_ENV === 'development' && !cronSecret) {
    console.warn('[Cron] 개발 환경에서 CRON_SECRET 없이 실행됩니다.')
    return true
  }

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET 환경 변수가 설정되지 않았습니다.')
    return false
  }

  // Bearer 토큰 형식 지원
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    if (token === cronSecret) {
      return true
    }
  }

  // x-vercel-cron-signature 헤더 (Vercel 내부 호출)
  const vercelSignature = request.headers.get('x-vercel-cron-signature')
  if (vercelSignature) {
    // Vercel 내부 호출은 신뢰
    return true
  }

  return false
}

// ============================================
// GET /api/cron/sms - 예약된 SMS 발송 실행
// ============================================

/**
 * GET /api/cron/sms
 * 예약된 SMS 발송을 실행합니다.
 *
 * Vercel Cron Job에 의해 주기적으로 호출됩니다.
 * - 매 10분마다 실행 권장
 * - 발송 가능 시간: 08:00 ~ 21:59
 */
export async function GET(request: NextRequest): Promise<NextResponse<CronResponse>> {
  const startTime = Date.now()
  console.log('[Cron SMS] 실행 시작:', new Date().toISOString())

  try {
    // 인증 검증
    if (!verifyCronAuth(request)) {
      console.error('[Cron SMS] 인증 실패')
      return NextResponse.json(
        {
          success: false,
          message: '인증에 실패했습니다.',
        },
        { status: 401 }
      )
    }

    // 스케줄러 활성화 확인
    if (!isSchedulerEnabled()) {
      console.log('[Cron SMS] 스케줄러가 비활성화되어 있습니다.')
      return NextResponse.json({
        success: true,
        message: 'SMS 스케줄러가 비활성화되어 있습니다.',
        processed: 0,
        results: [],
      })
    }

    // 발송 가능 시간 확인 (08:00 ~ 21:59)
    if (!isSendableTime()) {
      console.log('[Cron SMS] 발송 불가 시간대입니다.')
      return NextResponse.json({
        success: true,
        message: '현재 발송 불가 시간대입니다. (08:00 ~ 21:59 사이에만 발송)',
        processed: 0,
        results: [],
      })
    }

    // Supabase 클라이언트 생성
    const supabase = createServerSupabaseClient()

    // 실행 대기 중인 스케줄 조회
    const now = new Date().toISOString()
    const { data: pendingSchedules, error: fetchError } = await (supabase as any)
      .from('sms_schedules')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(10) // 한 번에 최대 10개 스케줄 처리

    if (fetchError) {
      // 테이블이 없는 경우
      if (fetchError.message?.includes('does not exist')) {
        console.warn('[Cron SMS] sms_schedules 테이블이 없습니다.')
        return NextResponse.json({
          success: true,
          message: 'sms_schedules 테이블이 존재하지 않습니다. 마이그레이션을 실행하세요.',
          processed: 0,
          results: [],
        })
      }
      throw fetchError
    }

    if (!pendingSchedules || pendingSchedules.length === 0) {
      console.log('[Cron SMS] 처리할 스케줄이 없습니다.')
      return NextResponse.json({
        success: true,
        message: '처리할 예약 발송이 없습니다.',
        processed: 0,
        results: [],
      })
    }

    console.log(`[Cron SMS] 처리할 스케줄: ${pendingSchedules.length}건`)

    // 각 스케줄 병렬 처리 (최대 5개 동시)
    const scheduleResults = await processBatchParallel(
      pendingSchedules,
      async (scheduleRow: any) => {
        return processSchedule(supabase, scheduleRow)
      },
      {
        batchSize: 5, // 5개 스케줄씩 병렬 처리
        delayMs: 500, // 배치 간 500ms 대기
      }
    )

    // 결과 집계
    const results = scheduleResults.map((result, index) => {
      const scheduleRow = pendingSchedules[index]

      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          scheduleId: scheduleRow.id,
          type: SCHEDULE_TYPE_LABELS[scheduleRow.type as SmsScheduleType] || scheduleRow.type,
          status: 'failed' as const,
          successCount: 0,
          failedCount: 0,
          error: result.reason?.message || '알 수 없는 오류',
        }
      }
    })

    const successCount = results.filter((r) => r.status === 'completed').length
    const failedCount = results.filter((r) => r.status === 'failed').length
    const duration = Date.now() - startTime

    console.log(
      `[Cron SMS] 완료: 성공 ${successCount}건, 실패 ${failedCount}건, 소요 시간: ${duration}ms`
    )

    return NextResponse.json({
      success: true,
      message: `${results.length}개 스케줄 처리 완료 (성공: ${successCount}, 실패: ${failedCount})`,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('[Cron SMS] 오류:', error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

// ============================================
// 스케줄 처리 함수
// ============================================

/**
 * 개별 스케줄 처리
 */
async function processSchedule(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  scheduleRow: any
): Promise<{
  scheduleId: string
  type: string
  status: 'completed' | 'failed'
  successCount: number
  failedCount: number
  error?: string
}> {
  const scheduleId = scheduleRow.id
  const scheduleType = scheduleRow.type as SmsScheduleType

  console.log(`[Cron SMS] 스케줄 처리 시작: ${scheduleId} (${SCHEDULE_TYPE_LABELS[scheduleType]})`)

  try {
    // 상태를 processing으로 업데이트
    await (supabase as any)
      .from('sms_schedules')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)

    // 수신자 정보 조회
    const recipients = await getRecipientsForSchedule(supabase, scheduleRow)

    if (recipients.length === 0) {
      console.warn(`[Cron SMS] 수신자가 없습니다: ${scheduleId}`)

      // 완료로 처리 (발송 대상 없음)
      await (supabase as any)
        .from('sms_schedules')
        .update({
          status: 'completed',
          executed_at: new Date().toISOString(),
          total_count: 0,
          success_count: 0,
          failed_count: 0,
          error_message: '발송 대상이 없습니다.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduleId)

      return {
        scheduleId,
        type: SCHEDULE_TYPE_LABELS[scheduleType],
        status: 'completed',
        successCount: 0,
        failedCount: 0,
      }
    }

    // 스케줄 객체 생성
    const schedule: SmsSchedule = {
      id: scheduleRow.id,
      type: scheduleRow.type,
      status: 'processing',
      scheduledAt: scheduleRow.scheduled_at,
      academyId: scheduleRow.academy_id,
      targetIds: scheduleRow.target_ids,
      templateId: scheduleRow.template_id,
      variables: scheduleRow.variables || {},
      totalCount: recipients.length,
      successCount: 0,
      failedCount: 0,
      createdAt: scheduleRow.created_at,
      updatedAt: new Date().toISOString(),
    }

    // SMS 발송 실행
    const result = await executeSchedule(schedule, recipients)

    // 결과 업데이트
    await (supabase as any)
      .from('sms_schedules')
      .update({
        status: result.success ? 'completed' : 'failed',
        executed_at: new Date().toISOString(),
        total_count: result.totalCount,
        success_count: result.successCount,
        failed_count: result.failedCount,
        error_message: result.error || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)

    console.log(
      `[Cron SMS] 스케줄 처리 완료: ${scheduleId}, 성공: ${result.successCount}, 실패: ${result.failedCount}`
    )

    return {
      scheduleId,
      type: SCHEDULE_TYPE_LABELS[scheduleType],
      status: result.success ? 'completed' : 'failed',
      successCount: result.successCount,
      failedCount: result.failedCount,
      error: result.error,
    }
  } catch (error) {
    console.error(`[Cron SMS] 스케줄 처리 실패: ${scheduleId}`, error)

    // 실패 상태로 업데이트
    await (supabase as any)
      .from('sms_schedules')
      .update({
        status: 'failed',
        executed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : '알 수 없는 오류',
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)

    return {
      scheduleId,
      type: SCHEDULE_TYPE_LABELS[scheduleType],
      status: 'failed',
      successCount: 0,
      failedCount: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
  }
}

// ============================================
// 수신자 조회 함수
// ============================================

/**
 * 스케줄에 따른 수신자 목록 조회
 *
 * 스케줄 타입에 따라 적절한 수신자 목록을 반환합니다.
 * - assignment_new: 과제 배정 대상 학생의 학부모
 * - assignment_reminder: 미제출 학생의 학부모
 * - assignment_graded: 채점 완료된 학생의 학부모
 * - weekly_report: 모든 학생의 학부모
 */
async function getRecipientsForSchedule(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  scheduleRow: any
): Promise<SmsRecipient[]> {
  const { type, target_ids, academy_id } = scheduleRow
  const recipients: SmsRecipient[] = []

  try {
    switch (type) {
      case 'assignment_new':
      case 'assignment_reminder':
      case 'assignment_graded': {
        // target_ids는 학생 ID 목록
        if (!target_ids || target_ids.length === 0) {
          return []
        }

        // 학생 정보와 학부모 연락처 조회
        const { data: students, error } = await (supabase as any)
          .from('students')
          .select('id, name, parent_phone, parent_name')
          .in('id', target_ids)
          .eq('academy_id', academy_id)

        if (error) {
          console.error('학생 정보 조회 실패:', error)
          return []
        }

        // 학부모 수신자 목록 생성
        for (const student of students || []) {
          if (student.parent_phone) {
            recipients.push({
              id: `parent_${student.id}`,
              name: student.parent_name || `${student.name} 학부모`,
              phone: student.parent_phone,
              type: 'parent',
              studentId: student.id,
              studentName: student.name,
            })
          }
        }
        break
      }

      case 'weekly_report': {
        // 학원의 모든 활성 학생의 학부모
        const { data: students, error } = await (supabase as any)
          .from('students')
          .select('id, name, parent_phone, parent_name')
          .eq('academy_id', academy_id)
          .eq('status', 'active')

        if (error) {
          console.error('학생 정보 조회 실패:', error)
          return []
        }

        for (const student of students || []) {
          if (student.parent_phone) {
            recipients.push({
              id: `parent_${student.id}`,
              name: student.parent_name || `${student.name} 학부모`,
              phone: student.parent_phone,
              type: 'parent',
              studentId: student.id,
              studentName: student.name,
            })
          }
        }
        break
      }

      default:
        console.warn(`[Cron SMS] 알 수 없는 스케줄 타입: ${type}`)
    }
  } catch (error) {
    console.error('[Cron SMS] 수신자 조회 오류:', error)
  }

  return recipients
}

// ============================================
// Runtime Configuration
// ============================================

// Vercel Edge Functions 최대 실행 시간 설정 (Pro: 300초, Hobby: 60초)
export const maxDuration = 60

// ============================================
// Config Export (Vercel Cron)
// ============================================

/**
 * Vercel Cron Job 설정
 * 매 10분마다 실행
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0
