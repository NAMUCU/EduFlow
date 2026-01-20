/**
 * SMS 발송 API 라우트
 *
 * POST /api/sms - 문자 발송 (단일 또는 대량)
 * GET /api/sms - API 상태 확인 및 제공자 정보 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  sendSms,
  sendBulkSms,
  getProviderStatus,
  isMockMode,
  isValidPhoneNumber,
} from '@/lib/sms'
import {
  applyTemplate,
  getTemplateById,
  getMissingVariables,
} from '@/lib/sms-templates'
import { createServerSupabaseClient } from '@/lib/supabase'
import {
  SmsSendRequest,
  SmsSendResponse,
  SmsRecipient,
  SmsLogInsert,
} from '@/types/sms'

// ============================================
// POST /api/sms - 문자 발송
// ============================================

/**
 * POST /api/sms
 * SMS 문자를 발송합니다.
 *
 * Request Body:
 * - to: string (단일 발송 시 수신자 전화번호)
 * - recipients: SmsRecipient[] (대량 발송 시 수신자 목록)
 * - message: string (발송할 메시지)
 * - templateId?: string (템플릿 ID, 선택)
 * - variables?: Record<string, string> (템플릿 변수 값, 선택)
 *
 * Response:
 * - 성공: { success: true, result: SmsSendResult } 또는 { success: true, bulkResult: SmsBulkSendResult }
 * - 실패: { success: false, error: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse<SmsSendResponse>> {
  try {
    const body: SmsSendRequest = await request.json()
    const { to, recipients, message, templateId, variables } = body

    // 필수 파라미터 검증
    if (!to && (!recipients || recipients.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: '수신자(to) 또는 수신자 목록(recipients)이 필요합니다.',
        },
        { status: 400 }
      )
    }

    // 메시지 내용 결정
    let finalMessage = message

    // 템플릿 사용 시
    if (templateId) {
      const template = getTemplateById(templateId)

      if (!template) {
        return NextResponse.json(
          {
            success: false,
            error: `템플릿을 찾을 수 없습니다: ${templateId}`,
          },
          { status: 400 }
        )
      }

      // 템플릿 변수 치환
      if (variables) {
        // 누락된 변수 확인
        const missing = getMissingVariables(template.content, variables)
        if (missing.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: `다음 변수가 누락되었습니다: ${missing.join(', ')}`,
            },
            { status: 400 }
          )
        }

        finalMessage = applyTemplate(template.content, variables)
      } else {
        finalMessage = template.content
      }
    }

    // 메시지 내용 필수 확인
    if (!finalMessage || finalMessage.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: '메시지 내용이 비어있습니다.',
        },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성 (발송 로그 저장용)
    const supabase = createServerSupabaseClient()

    // 단일 발송
    if (to) {
      // 전화번호 유효성 검사
      if (!isValidPhoneNumber(to)) {
        return NextResponse.json(
          {
            success: false,
            error: '유효하지 않은 전화번호입니다.',
          },
          { status: 400 }
        )
      }

      // SMS 발송
      const result = await sendSms(to, finalMessage)

      // 발송 로그 저장 (테이블이 있는 경우)
      try {
        await saveSmsLog(supabase, {
          senderId: 'system', // 실제로는 인증된 사용자 ID 사용
          recipientPhone: to,
          recipientName: '',
          recipientType: 'student',
          message: finalMessage,
          templateId,
          status: result.status,
          externalMessageId: result.messageId,
          error: result.error,
          sentAt: new Date().toISOString(),
        })
      } catch (logError) {
        // 로그 저장 실패는 발송 결과에 영향을 주지 않음
        console.warn('SMS 로그 저장 실패:', logError)
      }

      return NextResponse.json({
        success: result.success,
        result,
        error: result.error,
      })
    }

    // 대량 발송
    if (recipients && recipients.length > 0) {
      // 전화번호 유효성 검사
      const invalidRecipients = recipients.filter((r) => !isValidPhoneNumber(r.phone))
      if (invalidRecipients.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `유효하지 않은 전화번호가 포함되어 있습니다: ${invalidRecipients.map((r) => r.name).join(', ')}`,
          },
          { status: 400 }
        )
      }

      // 개인화된 메시지 생성 함수
      const messageGenerator = (recipient: SmsRecipient) => {
        if (templateId && variables) {
          // 수신자 정보로 변수 보완
          const mergedVariables = {
            ...variables,
            studentName: recipient.studentName || recipient.name,
            recipientName: recipient.name,
          }
          return applyTemplate(getTemplateById(templateId)!.content, mergedVariables)
        }
        return finalMessage
      }

      // 대량 SMS 발송
      const bulkResult = await sendBulkSms(recipients, messageGenerator)

      // 발송 로그 저장 (각 수신자별)
      try {
        for (let i = 0; i < recipients.length; i++) {
          const recipient = recipients[i]
          const result = bulkResult.results[i]

          await saveSmsLog(supabase, {
            senderId: 'system',
            recipientPhone: recipient.phone,
            recipientName: recipient.name,
            recipientType: recipient.type,
            message: messageGenerator(recipient),
            templateId,
            status: result.status,
            externalMessageId: result.messageId,
            error: result.error,
            sentAt: new Date().toISOString(),
          })
        }
      } catch (logError) {
        console.warn('SMS 로그 저장 실패:', logError)
      }

      return NextResponse.json({
        success: bulkResult.successCount > 0,
        bulkResult,
      })
    }

    // 도달할 수 없는 코드이지만 TypeScript를 위해 추가
    return NextResponse.json(
      {
        success: false,
        error: '잘못된 요청입니다.',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('SMS API 오류:', error)

    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// ============================================
// GET /api/sms - API 상태 확인
// ============================================

/**
 * GET /api/sms
 * SMS API 상태 및 사용 가능한 제공자 정보를 반환합니다.
 */
export async function GET(): Promise<NextResponse> {
  const status = getProviderStatus()

  return NextResponse.json({
    success: true,
    status: 'healthy',
    mockMode: isMockMode(),
    message: isMockMode()
      ? 'Mock 모드로 실행 중입니다. 실제 SMS를 발송하려면 API 키를 설정하세요.'
      : `${status.currentProvider} 제공자가 활성화되어 있습니다.`,
    ...status,
  })
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * SMS 발송 로그 저장
 *
 * 주의: sms_logs 테이블이 데이터베이스에 생성되어야 합니다.
 * 테이블이 없는 경우 로그는 저장되지 않지만 발송은 정상적으로 진행됩니다.
 */
async function saveSmsLog(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  log: SmsLogInsert
): Promise<void> {
  // sms_logs 테이블이 있는 경우에만 저장
  // 테이블이 없으면 조용히 실패
  try {
    const { error } = await (supabase as any).from('sms_logs').insert({
      sender_id: log.senderId,
      recipient_phone: log.recipientPhone,
      recipient_name: log.recipientName,
      recipient_type: log.recipientType,
      message: log.message,
      template_id: log.templateId,
      status: log.status,
      external_message_id: log.externalMessageId,
      error: log.error,
      sent_at: log.sentAt,
    })

    if (error) {
      // 테이블이 없는 경우는 무시
      if (!error.message.includes('does not exist')) {
        throw error
      }
    }
  } catch (e) {
    // 무시 (로그 저장 실패가 발송에 영향을 주지 않도록)
    console.warn('SMS 로그 저장 중 오류:', e)
  }
}
