/**
 * 카카오 알림톡 API 클라이언트
 *
 * 카카오 비즈니스 알림톡을 통해 학원 관련 알림을 발송합니다.
 * SMS보다 저렴하고 수신율이 높아 주요 알림에 사용합니다.
 *
 * 환경변수:
 * - KAKAO_REST_API_KEY: 카카오 REST API 키
 * - KAKAO_SENDER_KEY: 알림톡 발신 프로필 키
 */

const KAKAO_API_URL = 'https://kapi.kakao.com'
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || ''
const KAKAO_SENDER_KEY = process.env.KAKAO_SENDER_KEY || ''

// Mock 모드 체크
const isMockMode = !KAKAO_REST_API_KEY || KAKAO_REST_API_KEY.includes('placeholder')

/**
 * 알림톡 템플릿 코드
 * 사전에 카카오 비즈니스에서 승인받아야 함
 */
export const KAKAO_TEMPLATES = {
  /** 과제 등록 알림 */
  ASSIGNMENT_NEW: 'eduflow_assignment_new',
  /** 과제 마감 임박 알림 */
  ASSIGNMENT_DEADLINE: 'eduflow_assignment_deadline',
  /** 출석 알림 (등원) */
  ATTENDANCE_CHECK_IN: 'eduflow_attendance_checkin',
  /** 출석 알림 (하원) */
  ATTENDANCE_CHECK_OUT: 'eduflow_attendance_checkout',
  /** 결석 알림 */
  ATTENDANCE_ABSENT: 'eduflow_attendance_absent',
  /** 상담 예약 확정 */
  CONSULTATION_CONFIRMED: 'eduflow_consultation_confirmed',
  /** 상담 예약 리마인더 */
  CONSULTATION_REMINDER: 'eduflow_consultation_reminder',
  /** 상담 취소 */
  CONSULTATION_CANCELLED: 'eduflow_consultation_cancelled',
  /** 성적 알림 */
  GRADE_NOTIFICATION: 'eduflow_grade_notification',
  /** 공지사항 */
  NOTICE: 'eduflow_notice',
} as const

export type KakaoTemplateCode = (typeof KAKAO_TEMPLATES)[keyof typeof KAKAO_TEMPLATES]

/**
 * 알림톡 발송 요청 타입
 */
export interface KakaoAlimtalkRequest {
  /** 수신자 전화번호 */
  to: string
  /** 템플릿 코드 */
  templateCode: KakaoTemplateCode
  /** 템플릿 변수 */
  templateParams: Record<string, string>
  /** 알림톡 실패 시 SMS 대체 발송 여부 */
  failoverToSMS?: boolean
}

/**
 * 알림톡 발송 응답 타입
 */
export interface KakaoAlimtalkResponse {
  success: boolean
  messageId?: string
  status?: string
  error?: string
  failedOver?: boolean // SMS로 대체 발송되었는지
}

/**
 * 대량 알림톡 발송 요청 타입
 */
export interface BulkKakaoAlimtalkRequest {
  /** 수신자 목록 */
  recipients: Array<{
    to: string
    templateParams: Record<string, string>
  }>
  /** 템플릿 코드 */
  templateCode: KakaoTemplateCode
  /** SMS 대체 발송 여부 */
  failoverToSMS?: boolean
}

/**
 * 대량 알림톡 발송 응답 타입
 */
export interface BulkKakaoAlimtalkResponse {
  success: boolean
  totalCount: number
  successCount: number
  failedCount: number
  results: Array<{
    to: string
    success: boolean
    messageId?: string
    error?: string
    failedOver?: boolean
  }>
}

/**
 * 전화번호 정규화 (82로 시작하는 국제번호 형식으로)
 */
function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('82')) {
    return cleaned
  }
  if (cleaned.startsWith('0')) {
    return '82' + cleaned.slice(1)
  }
  return '82' + cleaned
}

/**
 * 알림톡 단건 발송
 */
export async function sendKakaoAlimtalk(
  request: KakaoAlimtalkRequest
): Promise<KakaoAlimtalkResponse> {
  if (isMockMode) {
    console.log('[Kakao Mock] 알림톡 발송:', {
      to: request.to,
      template: request.templateCode,
      params: request.templateParams,
    })
    return {
      success: true,
      messageId: `kakao-mock-${Date.now()}`,
      status: 'sent',
    }
  }

  try {
    const phoneNumber = normalizePhoneNumber(request.to)

    const response = await fetch(`${KAKAO_API_URL}/v2/api/talk/memo/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
      body: new URLSearchParams({
        sender_key: KAKAO_SENDER_KEY,
        template_code: request.templateCode,
        receiver_num: phoneNumber,
        template_object: JSON.stringify({
          object_type: 'text',
          ...request.templateParams,
        }),
        failover: request.failoverToSMS ? 'true' : 'false',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      // 알림톡 실패 + SMS 대체 발송 설정 시
      if (request.failoverToSMS && errorData.code) {
        // SMS 대체 발송 로직 (Tally 연동)
        const { sendSMS } = await import('./tally')
        const smsResult = await sendSMS({
          to: request.to,
          message: buildSMSFromTemplate(request.templateCode, request.templateParams),
        })

        if (smsResult.success) {
          return {
            success: true,
            messageId: smsResult.messageId,
            status: 'sent',
            failedOver: true,
          }
        }
      }

      throw new Error(errorData.msg || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      messageId: data.result_code || data.message_id,
      status: 'sent',
    }
  } catch (error) {
    console.error('[Kakao] 알림톡 발송 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알림톡 발송 실패',
    }
  }
}

/**
 * 알림톡 대량 발송
 */
export async function sendBulkKakaoAlimtalk(
  request: BulkKakaoAlimtalkRequest
): Promise<BulkKakaoAlimtalkResponse> {
  if (isMockMode) {
    console.log('[Kakao Mock] 대량 알림톡 발송:', {
      count: request.recipients.length,
      template: request.templateCode,
    })
    return {
      success: true,
      totalCount: request.recipients.length,
      successCount: request.recipients.length,
      failedCount: 0,
      results: request.recipients.map((r) => ({
        to: r.to,
        success: true,
        messageId: `kakao-mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
    }
  }

  const results: BulkKakaoAlimtalkResponse['results'] = []
  let successCount = 0
  let failedCount = 0

  // 병렬 발송 (최대 10개씩)
  const batchSize = 10
  for (let i = 0; i < request.recipients.length; i += batchSize) {
    const batch = request.recipients.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(async (recipient) => {
        const result = await sendKakaoAlimtalk({
          to: recipient.to,
          templateCode: request.templateCode,
          templateParams: recipient.templateParams,
          failoverToSMS: request.failoverToSMS,
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
          failedOver: result.failedOver,
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

/**
 * 템플릿에서 SMS 메시지 생성 (알림톡 실패 시 대체용)
 */
function buildSMSFromTemplate(
  templateCode: KakaoTemplateCode,
  params: Record<string, string>
): string {
  const templates: Record<KakaoTemplateCode, (p: Record<string, string>) => string> = {
    [KAKAO_TEMPLATES.ASSIGNMENT_NEW]: (p) =>
      `[EduFlow] ${p.studentName}님, 새 과제: ${p.assignmentTitle}${p.dueDate ? ` (마감: ${p.dueDate})` : ''}`,

    [KAKAO_TEMPLATES.ASSIGNMENT_DEADLINE]: (p) =>
      `[EduFlow] ${p.studentName}님, "${p.assignmentTitle}" 과제 마감이 임박했습니다. (${p.dueDate})`,

    [KAKAO_TEMPLATES.ATTENDANCE_CHECK_IN]: (p) =>
      `[EduFlow] ${p.studentName} 학생 등원 (${p.time})`,

    [KAKAO_TEMPLATES.ATTENDANCE_CHECK_OUT]: (p) =>
      `[EduFlow] ${p.studentName} 학생 하원 (${p.time})`,

    [KAKAO_TEMPLATES.ATTENDANCE_ABSENT]: (p) =>
      `[EduFlow] ${p.studentName} 학생 결석 알림 (${p.date})`,

    [KAKAO_TEMPLATES.CONSULTATION_CONFIRMED]: (p) =>
      `[EduFlow] 상담 예약 확정\n${p.teacherName} 선생님\n${p.date} ${p.time}`,

    [KAKAO_TEMPLATES.CONSULTATION_REMINDER]: (p) =>
      `[EduFlow] 내일 상담 예정\n${p.teacherName} 선생님\n${p.time}`,

    [KAKAO_TEMPLATES.CONSULTATION_CANCELLED]: (p) =>
      `[EduFlow] 상담 취소됨 (${p.date} ${p.time})`,

    [KAKAO_TEMPLATES.GRADE_NOTIFICATION]: (p) =>
      `[EduFlow] ${p.studentName} ${p.subject} ${p.examType || '시험'}: ${p.score}/${p.maxScore}`,

    [KAKAO_TEMPLATES.NOTICE]: (p) => `[EduFlow 공지] ${p.title}\n${p.content?.slice(0, 50)}...`,
  }

  const builder = templates[templateCode]
  return builder ? builder(params) : `[EduFlow] 알림이 도착했습니다.`
}

// ===========================================
// 학원용 편의 함수
// ===========================================

/**
 * 과제 등록 알림 발송
 */
export async function sendAssignmentKakao(params: {
  phone: string
  studentName: string
  assignmentTitle: string
  dueDate?: string
  url?: string
}): Promise<KakaoAlimtalkResponse> {
  return sendKakaoAlimtalk({
    to: params.phone,
    templateCode: KAKAO_TEMPLATES.ASSIGNMENT_NEW,
    templateParams: {
      studentName: params.studentName,
      assignmentTitle: params.assignmentTitle,
      dueDate: params.dueDate || '',
      url: params.url || '',
    },
    failoverToSMS: true,
  })
}

/**
 * 출석 알림 발송 (학부모에게)
 */
export async function sendAttendanceKakao(params: {
  phone: string
  studentName: string
  status: 'check_in' | 'check_out' | 'absent'
  time?: string
  date?: string
}): Promise<KakaoAlimtalkResponse> {
  const templateMap = {
    check_in: KAKAO_TEMPLATES.ATTENDANCE_CHECK_IN,
    check_out: KAKAO_TEMPLATES.ATTENDANCE_CHECK_OUT,
    absent: KAKAO_TEMPLATES.ATTENDANCE_ABSENT,
  }

  return sendKakaoAlimtalk({
    to: params.phone,
    templateCode: templateMap[params.status],
    templateParams: {
      studentName: params.studentName,
      time: params.time || '',
      date: params.date || '',
    },
    failoverToSMS: true,
  })
}

/**
 * 상담 알림 발송
 */
export async function sendConsultationKakao(params: {
  phone: string
  teacherName: string
  date: string
  time: string
  type: 'confirmed' | 'reminder' | 'cancelled'
}): Promise<KakaoAlimtalkResponse> {
  const templateMap = {
    confirmed: KAKAO_TEMPLATES.CONSULTATION_CONFIRMED,
    reminder: KAKAO_TEMPLATES.CONSULTATION_REMINDER,
    cancelled: KAKAO_TEMPLATES.CONSULTATION_CANCELLED,
  }

  return sendKakaoAlimtalk({
    to: params.phone,
    templateCode: templateMap[params.type],
    templateParams: {
      teacherName: params.teacherName,
      date: params.date,
      time: params.time,
    },
    failoverToSMS: true,
  })
}

/**
 * 성적 알림 발송
 */
export async function sendGradeKakao(params: {
  phone: string
  studentName: string
  subject: string
  score: number
  maxScore: number
  examType?: string
}): Promise<KakaoAlimtalkResponse> {
  return sendKakaoAlimtalk({
    to: params.phone,
    templateCode: KAKAO_TEMPLATES.GRADE_NOTIFICATION,
    templateParams: {
      studentName: params.studentName,
      subject: params.subject,
      score: String(params.score),
      maxScore: String(params.maxScore),
      examType: params.examType || '시험',
    },
    failoverToSMS: true,
  })
}

/**
 * 공지사항 알림 발송
 */
export async function sendNoticeKakao(params: {
  phone: string
  title: string
  content: string
  url?: string
}): Promise<KakaoAlimtalkResponse> {
  return sendKakaoAlimtalk({
    to: params.phone,
    templateCode: KAKAO_TEMPLATES.NOTICE,
    templateParams: {
      title: params.title,
      content: params.content.slice(0, 100),
      url: params.url || '',
    },
    failoverToSMS: true,
  })
}

/**
 * 카카오 알림톡 연결 상태 확인
 */
export function isKakaoConfigured(): boolean {
  return !isMockMode
}
