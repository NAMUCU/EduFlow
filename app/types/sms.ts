/**
 * SMS 관련 타입 정의
 *
 * SMS 발송 기능에 필요한 모든 TypeScript 타입을 정의합니다.
 */

// ============================================
// SMS 발송 결과 타입
// ============================================

/** SMS 발송 상태 */
export type SmsStatus = 'pending' | 'sent' | 'failed' | 'delivered'

/** 개별 SMS 발송 결과 */
export interface SmsSendResult {
  /** 수신자 전화번호 */
  to: string
  /** 발송 성공 여부 */
  success: boolean
  /** 메시지 ID (발송 성공 시) */
  messageId?: string
  /** 에러 메시지 (발송 실패 시) */
  error?: string
  /** 발송 상태 */
  status: SmsStatus
}

/** 대량 SMS 발송 결과 */
export interface SmsBulkSendResult {
  /** 총 발송 건수 */
  total: number
  /** 성공 건수 */
  successCount: number
  /** 실패 건수 */
  failedCount: number
  /** 개별 발송 결과 목록 */
  results: SmsSendResult[]
}

// ============================================
// SMS 수신자 타입
// ============================================

/** SMS 수신자 유형 */
export type SmsRecipientType = 'student' | 'parent'

/** SMS 수신자 정보 */
export interface SmsRecipient {
  /** 고유 ID */
  id: string
  /** 이름 */
  name: string
  /** 전화번호 */
  phone: string
  /** 수신자 유형 */
  type: SmsRecipientType
  /** 연관 학생 ID (학부모인 경우) */
  studentId?: string
  /** 연관 학생 이름 (학부모인 경우) */
  studentName?: string
}

// ============================================
// SMS 템플릿 타입
// ============================================

/** SMS 템플릿 카테고리 */
export type SmsTemplateCategory = 'attendance' | 'assignment' | 'grade' | 'notice' | 'custom'

/** SMS 템플릿 변수 */
export interface SmsTemplateVariable {
  /** 변수 키 (예: 'studentName') */
  key: string
  /** 변수 표시명 (예: '학생 이름') */
  label: string
  /** 변수 설명 */
  description?: string
  /** 예시 값 */
  example?: string
}

/** SMS 템플릿 */
export interface SmsTemplate {
  /** 템플릿 ID */
  id: string
  /** 템플릿 이름 */
  name: string
  /** 템플릿 카테고리 */
  category: SmsTemplateCategory
  /** 템플릿 내용 (변수는 {변수명} 형식) */
  content: string
  /** 사용되는 변수 목록 */
  variables: SmsTemplateVariable[]
}

// ============================================
// SMS 발송 로그 타입
// ============================================

/** SMS 발송 로그 */
export interface SmsLog {
  /** 로그 ID */
  id: string
  /** 발신자 ID (선생님/학원장) */
  senderId: string
  /** 수신자 전화번호 */
  recipientPhone: string
  /** 수신자 이름 */
  recipientName: string
  /** 수신자 유형 */
  recipientType: SmsRecipientType
  /** 메시지 내용 */
  message: string
  /** 사용된 템플릿 ID */
  templateId?: string
  /** 발송 상태 */
  status: SmsStatus
  /** 외부 서비스 메시지 ID */
  externalMessageId?: string
  /** 에러 메시지 */
  error?: string
  /** 발송 시각 */
  sentAt: string
  /** 생성 시각 */
  createdAt: string
}

/** SMS 발송 로그 삽입용 타입 */
export type SmsLogInsert = Omit<SmsLog, 'id' | 'createdAt'> & {
  id?: string
  createdAt?: string
}

// ============================================
// API 요청/응답 타입
// ============================================

/** SMS 발송 API 요청 */
export interface SmsSendRequest {
  /** 수신자 전화번호 (단일 발송 시) */
  to?: string
  /** 수신자 목록 (대량 발송 시) */
  recipients?: SmsRecipient[]
  /** 메시지 내용 */
  message: string
  /** 템플릿 ID (선택) */
  templateId?: string
  /** 템플릿 변수 값 */
  variables?: Record<string, string>
}

/** SMS 발송 API 응답 */
export interface SmsSendResponse {
  /** 성공 여부 */
  success: boolean
  /** 발송 결과 (단일 발송 시) */
  result?: SmsSendResult
  /** 대량 발송 결과 (대량 발송 시) */
  bulkResult?: SmsBulkSendResult
  /** 에러 메시지 */
  error?: string
}

// ============================================
// SMS 제공자 설정 타입
// ============================================

/** SMS 제공자 유형 */
export type SmsProvider = 'tally' | 'coolsms' | 'nhncloud' | 'mock'

/** SMS 제공자 설정 */
export interface SmsProviderConfig {
  /** 제공자 ID */
  id: SmsProvider
  /** 제공자 이름 */
  name: string
  /** 필요한 환경 변수 키 */
  envKey: string
  /** 설명 */
  description: string
}

// ============================================
// 한국어 라벨 상수
// ============================================

/** SMS 상태 한국어 라벨 */
export const SMS_STATUS_LABELS: Record<SmsStatus, string> = {
  pending: '대기 중',
  sent: '발송됨',
  failed: '실패',
  delivered: '전달 완료',
}

/** SMS 수신자 유형 한국어 라벨 */
export const SMS_RECIPIENT_TYPE_LABELS: Record<SmsRecipientType, string> = {
  student: '학생',
  parent: '학부모',
}

/** SMS 템플릿 카테고리 한국어 라벨 */
export const SMS_TEMPLATE_CATEGORY_LABELS: Record<SmsTemplateCategory, string> = {
  attendance: '출결 알림',
  assignment: '과제 알림',
  grade: '성적 알림',
  notice: '공지사항',
  custom: '사용자 정의',
}

/** SMS 제공자 한국어 라벨 */
export const SMS_PROVIDER_LABELS: Record<SmsProvider, string> = {
  tally: 'Tally',
  coolsms: 'CoolSMS',
  nhncloud: 'NHN Cloud',
  mock: 'Mock (테스트)',
}
