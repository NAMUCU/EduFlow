/**
 * 통합 알림 발송 API
 *
 * POST /api/notifications/send
 * 사용자에게 알림을 발송합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  sendNotification,
  sendBulkNotification,
  type NotificationType,
  type NotificationData,
  type BulkNotificationRecipient,
} from '@/lib/services/notifications'

// ============================================
// 요청/응답 타입
// ============================================

interface SingleNotificationRequest {
  userId: string
  type: NotificationType
  data: NotificationData
}

interface BulkNotificationRequest {
  recipients: BulkNotificationRecipient[]
  type: NotificationType
  data: NotificationData
}

type NotificationRequest = SingleNotificationRequest | BulkNotificationRequest

// ============================================
// 유효성 검사
// ============================================

const VALID_NOTIFICATION_TYPES: NotificationType[] = [
  'assignment',
  'report',
  'attendance',
  'grade',
  'announcement',
]

function isValidNotificationType(type: string): type is NotificationType {
  return VALID_NOTIFICATION_TYPES.includes(type as NotificationType)
}

function isBulkRequest(body: NotificationRequest): body is BulkNotificationRequest {
  return 'recipients' in body && Array.isArray(body.recipients)
}

function validateRequest(body: unknown): {
  valid: boolean
  error?: string
  data?: NotificationRequest
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: '요청 본문이 필요합니다.' }
  }

  const request = body as NotificationRequest

  // 공통 검증: type
  if (!request.type) {
    return { valid: false, error: 'type 필드가 필요합니다.' }
  }

  if (!isValidNotificationType(request.type)) {
    return {
      valid: false,
      error: `유효하지 않은 알림 유형입니다. 가능한 값: ${VALID_NOTIFICATION_TYPES.join(', ')}`,
    }
  }

  // 공통 검증: data
  if (!request.data || typeof request.data !== 'object') {
    return { valid: false, error: 'data 필드가 필요합니다.' }
  }

  // 대량 발송 검증
  if (isBulkRequest(request)) {
    if (!request.recipients || request.recipients.length === 0) {
      return { valid: false, error: 'recipients 배열이 비어있습니다.' }
    }

    for (let i = 0; i < request.recipients.length; i++) {
      const recipient = request.recipients[i]
      if (!recipient.userId) {
        return { valid: false, error: `recipients[${i}].userId가 필요합니다.` }
      }
    }

    return { valid: true, data: request }
  }

  // 단건 발송 검증
  const singleRequest = request as SingleNotificationRequest
  if (!singleRequest.userId) {
    return { valid: false, error: 'userId 필드가 필요합니다.' }
  }

  return { valid: true, data: request }
}

// ============================================
// POST: 알림 발송
// ============================================

/**
 * POST /api/notifications/send
 *
 * 단건 또는 대량 알림 발송
 *
 * @example 단건 발송
 * ```json
 * {
 *   "userId": "user-123",
 *   "type": "assignment",
 *   "data": {
 *     "studentName": "홍길동",
 *     "assignmentTitle": "수학 3단원 복습",
 *     "dueDate": "2024-01-15"
 *   }
 * }
 * ```
 *
 * @example 대량 발송
 * ```json
 * {
 *   "recipients": [
 *     { "userId": "user-1", "data": { "studentName": "홍길동" } },
 *     { "userId": "user-2", "data": { "studentName": "김철수" } }
 *   ],
 *   "type": "announcement",
 *   "data": {
 *     "title": "학원 휴무 안내",
 *     "content": "설날 연휴 기간 동안 학원이 휴무입니다."
 *   }
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 유효성 검사
    const validation = validateRequest(body)
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    const requestData = validation.data

    // 대량 발송
    if (isBulkRequest(requestData)) {
      const result = await sendBulkNotification(
        requestData.recipients,
        requestData.type,
        requestData.data
      )

      return NextResponse.json({
        success: result.success,
        data: {
          totalRecipients: result.totalRecipients,
          successCount: result.successCount,
          failedCount: result.failedCount,
          // 결과 상세는 필요 시에만 포함
          ...(result.failedCount > 0 && {
            failed: result.results
              .filter((r) => !r.result.success)
              .map((r) => ({
                userId: r.userId,
                errors: r.result.results
                  .filter((rr) => !rr.success)
                  .map((rr) => ({ channel: rr.channel, error: rr.error })),
              })),
          }),
        },
      })
    }

    // 단건 발송
    const singleRequest = requestData as SingleNotificationRequest
    const result = await sendNotification(
      singleRequest.userId,
      singleRequest.type,
      singleRequest.data
    )

    return NextResponse.json({
      success: result.success,
      data: {
        totalSent: result.totalSent,
        totalFailed: result.totalFailed,
        results: result.results.map((r) => ({
          channel: r.channel,
          success: r.success,
          messageId: r.messageId,
          ...(r.error && { error: r.error }),
          ...(r.failedOver && { failedOver: r.failedOver }),
        })),
      },
    })
  } catch (error) {
    console.error('[API /notifications/send] 오류:', error)

    // JSON 파싱 오류
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 JSON 형식입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: '알림 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// ============================================
// OPTIONS: CORS preflight
// ============================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
