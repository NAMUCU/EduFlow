import { NextRequest, NextResponse } from 'next/server'
import {
  sendKakaoMessage,
  sendBulkKakaoMessages,
  getTemplates,
  getTemplate,
  isKakaoConfigured,
  KakaoMessageInput
} from '@/lib/external/kakao'

/**
 * GET /api/notifications/kakao
 * 카카오 알림톡 템플릿 목록 조회
 */
export async function GET() {
  try {
    const templates = getTemplates()
    const configured = isKakaoConfigured()

    return NextResponse.json({
      success: true,
      data: {
        templates,
        isConfigured: configured,
        mode: configured ? 'live' : 'mock'
      }
    })
  } catch (error) {
    console.error('템플릿 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '템플릿 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications/kakao
 * 카카오 알림톡 발송
 *
 * Request Body:
 * - to: string | string[] (수신자 전화번호)
 * - templateId: string (템플릿 ID)
 * - variables: Record<string, string> (템플릿 변수)
 * - scheduledAt?: string (예약 발송 시간, ISO 8601 형식)
 * - bulk?: boolean (대량 발송 여부)
 * - messages?: Array<{ to: string; templateId: string; variables: Record<string, string> }> (대량 발송 시)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 대량 발송 처리
    if (body.bulk && Array.isArray(body.messages)) {
      const messages = body.messages as Array<{
        to: string
        templateId: string
        variables: Record<string, string>
      }>

      // 템플릿 유효성 검증
      for (const msg of messages) {
        const template = getTemplate(msg.templateId)
        if (!template) {
          return NextResponse.json(
            { success: false, error: `템플릿을 찾을 수 없습니다: ${msg.templateId}` },
            { status: 400 }
          )
        }
      }

      const result = await sendBulkKakaoMessages(messages)

      return NextResponse.json({
        success: true,
        data: {
          results: result.results,
          successCount: result.successCount,
          failCount: result.failCount,
          totalCount: messages.length
        },
        message: `${result.successCount}건 발송 성공, ${result.failCount}건 실패`
      })
    }

    // 단일 발송 처리
    // 필수 필드 검증
    if (!body.to) {
      return NextResponse.json(
        { success: false, error: '수신자 전화번호(to)는 필수입니다.' },
        { status: 400 }
      )
    }

    if (!body.templateId) {
      return NextResponse.json(
        { success: false, error: '템플릿 ID(templateId)는 필수입니다.' },
        { status: 400 }
      )
    }

    // 템플릿 유효성 검증
    const template = getTemplate(body.templateId)
    if (!template) {
      return NextResponse.json(
        { success: false, error: `템플릿을 찾을 수 없습니다: ${body.templateId}` },
        { status: 400 }
      )
    }

    // 필수 변수 검증
    const missingVars = template.variables.filter(
      v => !body.variables || !body.variables[v]
    )
    // link는 버튼이 있을 때만 필수
    const requiredVars = template.buttons
      ? template.variables
      : template.variables.filter(v => v !== 'link')
    const actualMissingVars = requiredVars.filter(
      v => !body.variables || !body.variables[v]
    )

    if (actualMissingVars.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `필수 변수가 누락되었습니다: ${actualMissingVars.join(', ')}`,
          requiredVariables: template.variables
        },
        { status: 400 }
      )
    }

    const input: KakaoMessageInput = {
      to: body.to,
      templateId: body.templateId,
      variables: body.variables || {},
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined
    }

    const result = await sendKakaoMessage(input)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || '알림톡 발송에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.messageId,
        sentCount: result.sentCount,
        isConfigured: isKakaoConfigured(),
        mode: isKakaoConfigured() ? 'live' : 'mock'
      },
      message: isKakaoConfigured()
        ? '알림톡이 성공적으로 발송되었습니다.'
        : '[Mock 모드] 알림톡 발송이 시뮬레이션되었습니다.'
    })
  } catch (error) {
    console.error('알림톡 발송 오류:', error)
    return NextResponse.json(
      { success: false, error: '알림톡을 발송하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
