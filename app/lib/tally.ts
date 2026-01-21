/**
 * Tally 문자 발송 API 클라이언트
 *
 * Tally는 한국 SMS/LMS/MMS 발송 서비스입니다.
 * 이 모듈은 과제 배포, 출결 알림 등 학원 관련 문자 발송에 사용됩니다.
 *
 * 환경변수:
 * - TALLY_API_KEY: Tally API 키
 * - TALLY_SENDER_NUMBER: 발신 번호 (사전 등록 필요)
 */

// Tally API 설정
const TALLY_API_URL = process.env.TALLY_API_URL || 'https://api.tally.kr/v1'
const TALLY_API_KEY = process.env.TALLY_API_KEY || ''
const TALLY_SENDER_NUMBER = process.env.TALLY_SENDER_NUMBER || ''

// Mock 모드 체크
const isMockMode = !TALLY_API_KEY || TALLY_API_KEY.includes('placeholder')

/**
 * SMS 발송 요청 타입
 */
export interface SMSRequest {
  /** 수신자 전화번호 (010-1234-5678 또는 01012345678 형식) */
  to: string
  /** 수신자 이름 (선택) */
  name?: string
  /** 메시지 내용 (SMS: 90바이트, LMS: 2000바이트) */
  message: string
  /** 발송 유형 (auto: 길이에 따라 자동 선택) */
  type?: 'sms' | 'lms' | 'auto'
  /** 예약 발송 시간 (선택) */
  scheduledAt?: Date
}

/**
 * SMS 발송 응답 타입
 */
export interface SMSResponse {
  success: boolean
  messageId?: string
  status?: 'pending' | 'sent' | 'failed'
  error?: string
}

/**
 * 대량 발송 요청 타입
 */
export interface BulkSMSRequest {
  /** 수신자 목록 */
  recipients: Array<{
    to: string
    name?: string
    /** 개인화 변수 (예: {studentName}, {assignmentTitle}) */
    variables?: Record<string, string>
  }>
  /** 메시지 템플릿 (변수 치환 가능) */
  messageTemplate: string
  /** 발송 유형 */
  type?: 'sms' | 'lms' | 'auto'
  /** 예약 발송 시간 */
  scheduledAt?: Date
}

/**
 * 대량 발송 응답 타입
 */
export interface BulkSMSResponse {
  success: boolean
  totalCount: number
  successCount: number
  failedCount: number
  results: Array<{
    to: string
    success: boolean
    messageId?: string
    error?: string
  }>
}

/**
 * 전화번호 정규화
 * 다양한 형식의 전화번호를 01012345678 형식으로 변환
 */
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

/**
 * 메시지 바이트 수 계산
 * 한글은 2바이트, 영문/숫자는 1바이트
 */
function getMessageBytes(message: string): number {
  let bytes = 0
  for (const char of message) {
    bytes += char.charCodeAt(0) > 127 ? 2 : 1
  }
  return bytes
}

/**
 * SMS 단건 발송
 */
export async function sendSMS(request: SMSRequest): Promise<SMSResponse> {
  if (isMockMode) {
    console.log('[Tally Mock] SMS 발송:', {
      to: request.to,
      message: request.message.substring(0, 50) + '...',
    })
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      status: 'sent',
    }
  }

  try {
    const phoneNumber = normalizePhoneNumber(request.to)
    const messageBytes = getMessageBytes(request.message)

    // 메시지 길이에 따라 SMS/LMS 자동 선택
    let messageType = request.type || 'auto'
    if (messageType === 'auto') {
      messageType = messageBytes <= 90 ? 'sms' : 'lms'
    }

    const response = await fetch(`${TALLY_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TALLY_API_KEY}`,
      },
      body: JSON.stringify({
        from: TALLY_SENDER_NUMBER,
        to: phoneNumber,
        message: request.message,
        type: messageType,
        scheduled_at: request.scheduledAt?.toISOString(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      messageId: data.message_id,
      status: data.status || 'pending',
    }
  } catch (error) {
    console.error('[Tally] SMS 발송 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS 발송 실패',
    }
  }
}

/**
 * SMS 대량 발송
 */
export async function sendBulkSMS(request: BulkSMSRequest): Promise<BulkSMSResponse> {
  if (isMockMode) {
    console.log('[Tally Mock] 대량 SMS 발송:', {
      count: request.recipients.length,
      template: request.messageTemplate.substring(0, 50) + '...',
    })
    return {
      success: true,
      totalCount: request.recipients.length,
      successCount: request.recipients.length,
      failedCount: 0,
      results: request.recipients.map((r) => ({
        to: r.to,
        success: true,
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
    }
  }

  const results: BulkSMSResponse['results'] = []
  let successCount = 0
  let failedCount = 0

  // 병렬 발송 (최대 10개씩)
  const batchSize = 10
  for (let i = 0; i < request.recipients.length; i += batchSize) {
    const batch = request.recipients.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(async (recipient) => {
        // 변수 치환
        let message = request.messageTemplate
        if (recipient.variables) {
          for (const [key, value] of Object.entries(recipient.variables)) {
            message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
          }
        }

        const result = await sendSMS({
          to: recipient.to,
          name: recipient.name,
          message,
          type: request.type,
          scheduledAt: request.scheduledAt,
        })

        if (result.success) {
          successCount++
        } else {
          failedCount++
        }

        return {
          to: recipient.to,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        }
      })
    )

    results.push(...batchResults)
  }

  return {
    success: failedCount === 0,
    totalCount: request.recipients.length,
    successCount,
    failedCount,
    results,
  }
}

// ===========================================
// 학원용 편의 함수
// ===========================================

/**
 * 과제 배포 알림 발송
 */
export async function sendAssignmentNotification(params: {
  studentPhone: string
  studentName: string
  assignmentTitle: string
  dueDate?: string
  assignmentUrl?: string
}): Promise<SMSResponse> {
  const message = params.dueDate
    ? `[EduFlow] ${params.studentName}님, 새 과제가 등록되었습니다.

과제: ${params.assignmentTitle}
마감: ${params.dueDate}
${params.assignmentUrl ? `\n바로가기: ${params.assignmentUrl}` : ''}`
    : `[EduFlow] ${params.studentName}님, 새 과제가 등록되었습니다.

과제: ${params.assignmentTitle}
${params.assignmentUrl ? `\n바로가기: ${params.assignmentUrl}` : ''}`

  return sendSMS({
    to: params.studentPhone,
    name: params.studentName,
    message,
  })
}

/**
 * 출결 알림 발송 (학부모에게)
 */
export async function sendAttendanceNotification(params: {
  parentPhone: string
  studentName: string
  status: 'present' | 'absent' | 'late' | 'early_leave'
  time?: string
}): Promise<SMSResponse> {
  const statusMessages = {
    present: '등원',
    absent: '결석',
    late: '지각 등원',
    early_leave: '조퇴',
  }

  const message = `[EduFlow] ${params.studentName} 학생 ${statusMessages[params.status]} 알림
${params.time ? `시간: ${params.time}` : ''}`

  return sendSMS({
    to: params.parentPhone,
    message,
  })
}

/**
 * 상담 예약 알림 발송
 */
export async function sendConsultationNotification(params: {
  phone: string
  name: string
  teacherName: string
  date: string
  time: string
  type: 'scheduled' | 'reminder' | 'cancelled'
}): Promise<SMSResponse> {
  const messages = {
    scheduled: `[EduFlow] ${params.name}님, 상담이 예약되었습니다.

담당: ${params.teacherName} 선생님
일시: ${params.date} ${params.time}`,
    reminder: `[EduFlow] ${params.name}님, 내일 상담이 예정되어 있습니다.

담당: ${params.teacherName} 선생님
일시: ${params.date} ${params.time}`,
    cancelled: `[EduFlow] ${params.name}님, 예약된 상담이 취소되었습니다.

일시: ${params.date} ${params.time}
문의사항은 학원으로 연락주세요.`,
  }

  return sendSMS({
    to: params.phone,
    name: params.name,
    message: messages[params.type],
  })
}

/**
 * 성적 알림 발송
 */
export async function sendGradeNotification(params: {
  parentPhone: string
  studentName: string
  subject: string
  score: number
  maxScore: number
  examType?: string
}): Promise<SMSResponse> {
  const percentage = Math.round((params.score / params.maxScore) * 100)

  const message = `[EduFlow] ${params.studentName} 학생 ${params.examType || '시험'} 결과

과목: ${params.subject}
점수: ${params.score}/${params.maxScore} (${percentage}%)`

  return sendSMS({
    to: params.parentPhone,
    message,
  })
}

/**
 * Tally 연결 상태 확인
 */
export function isTallyConfigured(): boolean {
  return !isMockMode
}

/**
 * 잔여 발송 가능 건수 조회
 */
export async function getRemainingCredits(): Promise<{
  success: boolean
  credits?: number
  error?: string
}> {
  if (isMockMode) {
    return { success: true, credits: 9999 }
  }

  try {
    const response = await fetch(`${TALLY_API_URL}/account/credits`, {
      headers: {
        Authorization: `Bearer ${TALLY_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      credits: data.credits || data.remaining || 0,
    }
  } catch (error) {
    console.error('[Tally] 크레딧 조회 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '조회 실패',
    }
  }
}
