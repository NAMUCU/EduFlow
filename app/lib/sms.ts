/**
 * SMS 발송 클라이언트
 *
 * 이 파일은 SMS 발송 기능을 제공합니다.
 * - Tally API 연동 (기본)
 * - CoolSMS 연동 (대체)
 * - NHN Cloud 연동 (대체)
 * - Mock 모드 (개발/테스트용)
 *
 * 환경 변수:
 * - SMS_PROVIDER: 사용할 SMS 제공자 ('tally' | 'coolsms' | 'nhncloud' | 'mock')
 * - TALLY_API_KEY: Tally API 키
 * - TALLY_SENDER_PHONE: Tally 발신 번호
 * - COOLSMS_API_KEY: CoolSMS API 키
 * - COOLSMS_API_SECRET: CoolSMS API 시크릿
 * - COOLSMS_SENDER_PHONE: CoolSMS 발신 번호
 * - NHN_CLOUD_APP_KEY: NHN Cloud 앱 키
 * - NHN_CLOUD_SECRET_KEY: NHN Cloud 시크릿 키
 * - NHN_CLOUD_SENDER_PHONE: NHN Cloud 발신 번호
 */

import {
  SmsProvider,
  SmsSendResult,
  SmsBulkSendResult,
  SmsRecipient,
  SmsProviderConfig,
} from '@/types/sms'

// ============================================
// SMS 제공자 설정
// ============================================

/** SMS 제공자 목록 */
export const SMS_PROVIDERS: SmsProviderConfig[] = [
  {
    id: 'tally',
    name: 'Tally',
    envKey: 'TALLY_API_KEY',
    description: 'Tally SMS 서비스',
  },
  {
    id: 'coolsms',
    name: 'CoolSMS',
    envKey: 'COOLSMS_API_KEY',
    description: 'CoolSMS 문자 서비스',
  },
  {
    id: 'nhncloud',
    name: 'NHN Cloud',
    envKey: 'NHN_CLOUD_APP_KEY',
    description: 'NHN Cloud SMS 서비스',
  },
  {
    id: 'mock',
    name: 'Mock',
    envKey: '',
    description: '테스트용 Mock 서비스 (실제 발송 안 됨)',
  },
]

// ============================================
// 환경 변수 및 설정 확인
// ============================================

/**
 * 현재 사용 중인 SMS 제공자 반환
 */
export function getCurrentProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER as SmsProvider
  if (provider && ['tally', 'coolsms', 'nhncloud', 'mock'].includes(provider)) {
    return provider
  }

  // 자동 감지: 설정된 API 키가 있는 제공자 사용
  if (process.env.TALLY_API_KEY) return 'tally'
  if (process.env.COOLSMS_API_KEY) return 'coolsms'
  if (process.env.NHN_CLOUD_APP_KEY) return 'nhncloud'

  // 기본값: Mock 모드
  return 'mock'
}

/**
 * 특정 제공자가 사용 가능한지 확인
 */
export function isProviderAvailable(provider: SmsProvider): boolean {
  switch (provider) {
    case 'tally':
      return !!(process.env.TALLY_API_KEY && process.env.TALLY_SENDER_PHONE)
    case 'coolsms':
      return !!(
        process.env.COOLSMS_API_KEY &&
        process.env.COOLSMS_API_SECRET &&
        process.env.COOLSMS_SENDER_PHONE
      )
    case 'nhncloud':
      return !!(
        process.env.NHN_CLOUD_APP_KEY &&
        process.env.NHN_CLOUD_SECRET_KEY &&
        process.env.NHN_CLOUD_SENDER_PHONE
      )
    case 'mock':
      return true
    default:
      return false
  }
}

/**
 * 사용 가능한 제공자 목록 반환
 */
export function getAvailableProviders(): SmsProvider[] {
  return ['tally', 'coolsms', 'nhncloud', 'mock'].filter((p) =>
    isProviderAvailable(p as SmsProvider)
  ) as SmsProvider[]
}

/**
 * Mock 모드 여부 확인
 */
export function isMockMode(): boolean {
  return getCurrentProvider() === 'mock'
}

// ============================================
// 전화번호 포맷팅
// ============================================

/**
 * 전화번호를 E.164 형식으로 변환
 * 예: 010-1234-5678 -> +821012345678
 */
export function formatPhoneNumber(phone: string): string {
  // 숫자만 추출
  const digits = phone.replace(/\D/g, '')

  // 이미 국가 코드가 있는 경우
  if (digits.startsWith('82')) {
    return `+${digits}`
  }

  // 한국 번호로 가정하고 변환
  if (digits.startsWith('0')) {
    return `+82${digits.slice(1)}`
  }

  return `+82${digits}`
}

/**
 * 전화번호 유효성 검사
 */
export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')

  // 한국 휴대폰 번호: 010, 011, 016, 017, 018, 019로 시작하고 총 10~11자리
  const mobilePattern = /^01[0-9]{8,9}$/

  // 지역 번호: 02, 031, 032 등으로 시작
  const landlinePattern = /^0[2-6][0-9]{7,8}$/

  return mobilePattern.test(digits) || landlinePattern.test(digits)
}

// ============================================
// Tally SMS 발송
// ============================================

/**
 * Tally API를 통한 SMS 발송
 */
async function sendSmsTally(to: string, message: string): Promise<SmsSendResult> {
  const apiKey = process.env.TALLY_API_KEY
  const senderPhone = process.env.TALLY_SENDER_PHONE

  if (!apiKey || !senderPhone) {
    return {
      to,
      success: false,
      error: 'Tally API 설정이 완료되지 않았습니다.',
      status: 'failed',
    }
  }

  try {
    // Tally API 엔드포인트 (실제 API 문서에 맞게 수정 필요)
    const response = await fetch('https://api.tally.so/v1/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: formatPhoneNumber(to),
        from: senderPhone,
        message: message,
      }),
    })

    const data = await response.json()

    if (response.ok && data.success) {
      return {
        to,
        success: true,
        messageId: data.messageId || data.id,
        status: 'sent',
      }
    } else {
      return {
        to,
        success: false,
        error: data.error || data.message || '발송에 실패했습니다.',
        status: 'failed',
      }
    }
  } catch (error) {
    console.error('Tally SMS 발송 오류:', error)
    return {
      to,
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      status: 'failed',
    }
  }
}

// ============================================
// CoolSMS 발송
// ============================================

/**
 * CoolSMS API를 통한 SMS 발송
 */
async function sendSmsCoolSms(to: string, message: string): Promise<SmsSendResult> {
  const apiKey = process.env.COOLSMS_API_KEY
  const apiSecret = process.env.COOLSMS_API_SECRET
  const senderPhone = process.env.COOLSMS_SENDER_PHONE

  if (!apiKey || !apiSecret || !senderPhone) {
    return {
      to,
      success: false,
      error: 'CoolSMS API 설정이 완료되지 않았습니다.',
      status: 'failed',
    }
  }

  try {
    // CoolSMS API v4
    const timestamp = Date.now().toString()
    const signature = await generateCoolSmsSignature(timestamp, apiSecret)

    const response = await fetch('https://api.coolsms.co.kr/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${timestamp}, signature=${signature}`,
      },
      body: JSON.stringify({
        message: {
          to: to.replace(/\D/g, ''),
          from: senderPhone.replace(/\D/g, ''),
          text: message,
          type: message.length > 90 ? 'LMS' : 'SMS', // 90자 초과시 LMS
        },
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return {
        to,
        success: true,
        messageId: data.groupId || data.messageId,
        status: 'sent',
      }
    } else {
      return {
        to,
        success: false,
        error: data.errorMessage || data.message || '발송에 실패했습니다.',
        status: 'failed',
      }
    }
  } catch (error) {
    console.error('CoolSMS 발송 오류:', error)
    return {
      to,
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      status: 'failed',
    }
  }
}

/**
 * CoolSMS HMAC-SHA256 서명 생성
 */
async function generateCoolSmsSignature(timestamp: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(timestamp)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ============================================
// NHN Cloud 발송
// ============================================

/**
 * NHN Cloud SMS API를 통한 발송
 */
async function sendSmsNhnCloud(to: string, message: string): Promise<SmsSendResult> {
  const appKey = process.env.NHN_CLOUD_APP_KEY
  const secretKey = process.env.NHN_CLOUD_SECRET_KEY
  const senderPhone = process.env.NHN_CLOUD_SENDER_PHONE

  if (!appKey || !secretKey || !senderPhone) {
    return {
      to,
      success: false,
      error: 'NHN Cloud API 설정이 완료되지 않았습니다.',
      status: 'failed',
    }
  }

  try {
    // NHN Cloud SMS API
    const response = await fetch(
      `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${appKey}/sender/sms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'X-Secret-Key': secretKey,
        },
        body: JSON.stringify({
          body: message,
          sendNo: senderPhone.replace(/\D/g, ''),
          recipientList: [
            {
              recipientNo: to.replace(/\D/g, ''),
            },
          ],
        }),
      }
    )

    const data = await response.json()

    if (data.header?.isSuccessful) {
      return {
        to,
        success: true,
        messageId: data.body?.data?.requestId,
        status: 'sent',
      }
    } else {
      return {
        to,
        success: false,
        error: data.header?.resultMessage || '발송에 실패했습니다.',
        status: 'failed',
      }
    }
  } catch (error) {
    console.error('NHN Cloud SMS 발송 오류:', error)
    return {
      to,
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      status: 'failed',
    }
  }
}

// ============================================
// Mock 발송 (테스트용)
// ============================================

/**
 * Mock SMS 발송 (테스트/개발용)
 */
async function sendSmsMock(to: string, message: string): Promise<SmsSendResult> {
  // 개발 환경에서 발송 시뮬레이션
  console.log(`[Mock SMS] To: ${to}, Message: ${message}`)

  // 랜덤 지연 시뮬레이션 (100~500ms)
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 400))

  // 테스트용 실패 시뮬레이션 (1% 확률)
  if (Math.random() < 0.01) {
    return {
      to,
      success: false,
      error: '[Mock] 테스트 실패 시뮬레이션',
      status: 'failed',
    }
  }

  return {
    to,
    success: true,
    messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'sent',
  }
}

// ============================================
// 메인 SMS 발송 함수
// ============================================

/**
 * SMS 발송 (단일)
 *
 * @param to - 수신자 전화번호
 * @param message - 발송할 메시지
 * @param provider - 사용할 SMS 제공자 (선택, 기본값: 자동 선택)
 * @returns 발송 결과
 *
 * @example
 * const result = await sendSms('010-1234-5678', '안녕하세요, 테스트 메시지입니다.')
 * if (result.success) {
 *   console.log('발송 성공:', result.messageId)
 * } else {
 *   console.error('발송 실패:', result.error)
 * }
 */
export async function sendSms(
  to: string,
  message: string,
  provider?: SmsProvider
): Promise<SmsSendResult> {
  // 전화번호 유효성 검사
  if (!isValidPhoneNumber(to)) {
    return {
      to,
      success: false,
      error: '유효하지 않은 전화번호입니다.',
      status: 'failed',
    }
  }

  // 메시지 길이 검사 (LMS 기준 최대 2000자)
  if (message.length > 2000) {
    return {
      to,
      success: false,
      error: '메시지가 너무 깁니다. 최대 2000자까지 가능합니다.',
      status: 'failed',
    }
  }

  // 빈 메시지 검사
  if (!message.trim()) {
    return {
      to,
      success: false,
      error: '메시지 내용이 비어있습니다.',
      status: 'failed',
    }
  }

  // 사용할 제공자 결정
  const selectedProvider = provider || getCurrentProvider()

  // 선택된 제공자로 발송
  switch (selectedProvider) {
    case 'tally':
      return sendSmsTally(to, message)
    case 'coolsms':
      return sendSmsCoolSms(to, message)
    case 'nhncloud':
      return sendSmsNhnCloud(to, message)
    case 'mock':
    default:
      return sendSmsMock(to, message)
  }
}

/**
 * SMS 대량 발송
 *
 * @param recipients - 수신자 목록
 * @param message - 발송할 메시지 (또는 메시지 생성 함수)
 * @param provider - 사용할 SMS 제공자 (선택, 기본값: 자동 선택)
 * @returns 대량 발송 결과
 *
 * @example
 * // 동일한 메시지 대량 발송
 * const result = await sendBulkSms(
 *   [{ id: '1', name: '홍길동', phone: '010-1234-5678', type: 'student' }],
 *   '공지사항입니다.'
 * )
 *
 * // 개인화된 메시지 대량 발송
 * const result = await sendBulkSms(
 *   recipients,
 *   (recipient) => `${recipient.name}님, 안녕하세요!`
 * )
 */
export async function sendBulkSms(
  recipients: SmsRecipient[],
  message: string | ((recipient: SmsRecipient) => string),
  provider?: SmsProvider
): Promise<SmsBulkSendResult> {
  if (!recipients.length) {
    return {
      total: 0,
      successCount: 0,
      failedCount: 0,
      results: [],
    }
  }

  // 중복 제거 (같은 전화번호로 여러 번 발송 방지)
  const uniqueRecipients = recipients.filter(
    (recipient, index, self) =>
      index === self.findIndex((r) => r.phone === recipient.phone)
  )

  // 각 수신자에게 발송
  const results = await Promise.all(
    uniqueRecipients.map(async (recipient) => {
      const messageContent =
        typeof message === 'function' ? message(recipient) : message
      return sendSms(recipient.phone, messageContent, provider)
    })
  )

  // 결과 집계
  const successCount = results.filter((r) => r.success).length
  const failedCount = results.filter((r) => !r.success).length

  return {
    total: results.length,
    successCount,
    failedCount,
    results,
  }
}

/**
 * SMS 발송 가능 여부 확인
 */
export function canSendSms(): boolean {
  return getAvailableProviders().length > 0
}

/**
 * SMS 제공자 상태 정보 반환
 */
export function getProviderStatus() {
  const currentProvider = getCurrentProvider()
  const availableProviders = getAvailableProviders()

  return {
    currentProvider,
    isMockMode: currentProvider === 'mock',
    availableProviders,
    providers: SMS_PROVIDERS.map((p) => ({
      ...p,
      available: isProviderAvailable(p.id),
      isCurrent: p.id === currentProvider,
    })),
  }
}
