/**
 * SMS 자동 발송 스케줄러
 *
 * 이 파일은 SMS 자동 발송 스케줄링 기능을 제공합니다.
 * - 과제 배포 알림 (새 과제 배정 시)
 * - 미제출 리마인더 (마감 전날/당일)
 * - 채점 완료 알림 (채점 완료 시)
 * - 주간 보고서 발송 (매주 금요일)
 *
 * 환경 변수:
 * - SMS_SCHEDULER_ENABLED: 스케줄러 활성화 여부 ('true' | 'false')
 * - SMS_BATCH_SIZE: 배치당 발송 건수 (기본: 50)
 * - SMS_BATCH_DELAY_MS: 배치 간 대기 시간 (기본: 1000ms)
 */

import { sendSms, sendBulkSms, isMockMode } from '@/lib/sms'
import { applyTemplate, getTemplateById } from '@/lib/sms-templates'
import { SmsRecipient, SmsBulkSendResult, SmsSendResult } from '@/types/sms'

// ============================================
// 타입 정의
// ============================================

/** 예약 발송 유형 */
export type SmsScheduleType =
  | 'assignment_new'        // 과제 배포
  | 'assignment_reminder'   // 미제출 리마인더
  | 'assignment_graded'     // 채점 완료
  | 'weekly_report'         // 주간 보고서

/** 예약 발송 상태 */
export type SmsScheduleStatus =
  | 'pending'    // 대기 중
  | 'processing' // 처리 중
  | 'completed'  // 완료
  | 'failed'     // 실패
  | 'cancelled'  // 취소됨

/** 예약 발송 정보 */
export interface SmsSchedule {
  id: string
  type: SmsScheduleType
  status: SmsScheduleStatus
  scheduledAt: string
  executedAt?: string
  academyId: string
  targetIds: string[]       // 대상 학생/과제 ID 목록
  templateId: string
  variables: Record<string, string>
  totalCount: number
  successCount: number
  failedCount: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

/** 예약 발송 생성 요청 */
export interface CreateSmsScheduleRequest {
  type: SmsScheduleType
  scheduledAt: string
  academyId: string
  targetIds: string[]
  templateId: string
  variables?: Record<string, string>
}

/** 스케줄 실행 결과 */
export interface ScheduleExecutionResult {
  scheduleId: string
  success: boolean
  totalCount: number
  successCount: number
  failedCount: number
  results: SmsSendResult[]
  error?: string
}

/** 배치 처리 옵션 */
export interface BatchProcessOptions {
  batchSize?: number
  delayMs?: number
  onProgress?: (processed: number, total: number) => void
}

// ============================================
// 상수 정의
// ============================================

/** 기본 배치 크기 */
const DEFAULT_BATCH_SIZE = parseInt(process.env.SMS_BATCH_SIZE || '50', 10)

/** 기본 배치 간 대기 시간 (ms) */
const DEFAULT_BATCH_DELAY_MS = parseInt(process.env.SMS_BATCH_DELAY_MS || '1000', 10)

/** 스케줄 타입별 기본 템플릿 매핑 */
export const SCHEDULE_TYPE_TEMPLATES: Record<SmsScheduleType, string> = {
  assignment_new: 'assignment_new',
  assignment_reminder: 'assignment_reminder',
  assignment_graded: 'assignment_graded',
  weekly_report: 'notice_general',
}

/** 스케줄 타입 한국어 라벨 */
export const SCHEDULE_TYPE_LABELS: Record<SmsScheduleType, string> = {
  assignment_new: '과제 배포 알림',
  assignment_reminder: '미제출 리마인더',
  assignment_graded: '채점 완료 알림',
  weekly_report: '주간 보고서',
}

/** 스케줄 상태 한국어 라벨 */
export const SCHEDULE_STATUS_LABELS: Record<SmsScheduleStatus, string> = {
  pending: '대기 중',
  processing: '처리 중',
  completed: '완료',
  failed: '실패',
  cancelled: '취소됨',
}

// ============================================
// 병렬 처리 유틸리티
// ============================================

/**
 * 배열을 청크로 분할
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * 지연 실행
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 병렬 배치 처리
 *
 * 대량의 SMS 발송을 효율적으로 처리하기 위해 배치 단위로 병렬 처리합니다.
 * - 각 배치 내에서는 병렬로 처리 (Promise.allSettled)
 * - 배치 간에는 순차적으로 처리 (rate limiting 방지)
 *
 * @param items - 처리할 항목 배열
 * @param processor - 각 항목을 처리하는 함수
 * @param options - 배치 처리 옵션
 * @returns 모든 처리 결과
 */
export async function processBatchParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchProcessOptions = {}
): Promise<PromiseSettledResult<R>[]> {
  const {
    batchSize = DEFAULT_BATCH_SIZE,
    delayMs = DEFAULT_BATCH_DELAY_MS,
    onProgress,
  } = options

  const chunks = chunkArray(items, batchSize)
  const allResults: PromiseSettledResult<R>[] = []
  let processedCount = 0

  for (const chunk of chunks) {
    // 배치 내 항목들을 병렬로 처리
    const chunkResults = await Promise.allSettled(
      chunk.map((item) => processor(item))
    )

    allResults.push(...chunkResults)
    processedCount += chunk.length

    // 진행 상황 콜백 호출
    if (onProgress) {
      onProgress(processedCount, items.length)
    }

    // 다음 배치 전 대기 (마지막 배치 제외)
    if (processedCount < items.length && delayMs > 0) {
      await delay(delayMs)
    }
  }

  return allResults
}

// ============================================
// 메시지 생성 함수
// ============================================

/**
 * 수신자별 개인화된 메시지 생성
 */
export function generatePersonalizedMessage(
  templateId: string,
  recipient: SmsRecipient,
  baseVariables: Record<string, string> = {}
): string {
  const template = getTemplateById(templateId)
  if (!template) {
    throw new Error(`템플릿을 찾을 수 없습니다: ${templateId}`)
  }

  // 수신자 정보로 변수 보완
  const variables: Record<string, string> = {
    ...baseVariables,
    studentName: recipient.studentName || recipient.name,
    recipientName: recipient.name,
    academyName: baseVariables.academyName || 'EduFlow 학원',
  }

  return applyTemplate(template.content, variables)
}

// ============================================
// 과제 배포 알림
// ============================================

/**
 * 과제 배포 알림 발송
 *
 * 새 과제가 배정되었을 때 해당 학생들(및 학부모)에게 알림을 발송합니다.
 *
 * @param recipients - 수신자 목록
 * @param assignmentInfo - 과제 정보
 * @param options - 배치 처리 옵션
 */
export async function sendAssignmentNewNotifications(
  recipients: SmsRecipient[],
  assignmentInfo: {
    title: string
    subject: string
    dueDate: string
    problemCount: number
    academyName?: string
  },
  options?: BatchProcessOptions
): Promise<SmsBulkSendResult> {
  const templateId = SCHEDULE_TYPE_TEMPLATES.assignment_new
  const baseVariables: Record<string, string> = {
    assignmentTitle: assignmentInfo.title,
    subject: assignmentInfo.subject,
    dueDate: assignmentInfo.dueDate,
    problemCount: String(assignmentInfo.problemCount),
    academyName: assignmentInfo.academyName || 'EduFlow 학원',
  }

  return sendScheduledBulkSms(recipients, templateId, baseVariables, options)
}

// ============================================
// 미제출 리마인더
// ============================================

/**
 * 미제출 리마인더 발송
 *
 * 과제 마감 전에 미제출 학생들에게 리마인더를 발송합니다.
 *
 * @param recipients - 미제출 학생 수신자 목록
 * @param assignmentInfo - 과제 정보
 * @param options - 배치 처리 옵션
 */
export async function sendAssignmentReminderNotifications(
  recipients: SmsRecipient[],
  assignmentInfo: {
    title: string
    subject: string
    dueDate: string
    academyName?: string
  },
  options?: BatchProcessOptions
): Promise<SmsBulkSendResult> {
  const templateId = SCHEDULE_TYPE_TEMPLATES.assignment_reminder
  const baseVariables: Record<string, string> = {
    assignmentTitle: assignmentInfo.title,
    subject: assignmentInfo.subject,
    dueDate: assignmentInfo.dueDate,
    academyName: assignmentInfo.academyName || 'EduFlow 학원',
  }

  return sendScheduledBulkSms(recipients, templateId, baseVariables, options)
}

// ============================================
// 채점 완료 알림
// ============================================

/**
 * 채점 완료 알림 발송
 *
 * 과제 채점이 완료되었을 때 학생들(및 학부모)에게 알림을 발송합니다.
 *
 * @param recipients - 수신자 목록
 * @param assignmentInfo - 과제 정보
 * @param options - 배치 처리 옵션
 */
export async function sendAssignmentGradedNotifications(
  recipients: SmsRecipient[],
  assignmentInfo: {
    title: string
    subject: string
    academyName?: string
  },
  options?: BatchProcessOptions
): Promise<SmsBulkSendResult> {
  const templateId = SCHEDULE_TYPE_TEMPLATES.assignment_graded
  const baseVariables: Record<string, string> = {
    assignmentTitle: assignmentInfo.title,
    subject: assignmentInfo.subject,
    academyName: assignmentInfo.academyName || 'EduFlow 학원',
  }

  return sendScheduledBulkSms(recipients, templateId, baseVariables, options)
}

// ============================================
// 주간 보고서 발송
// ============================================

/**
 * 주간 보고서 알림 발송
 *
 * 매주 금요일 학부모에게 주간 학습 보고서를 발송합니다.
 *
 * @param recipients - 수신자 목록 (학부모)
 * @param reportInfo - 보고서 정보
 * @param options - 배치 처리 옵션
 */
export async function sendWeeklyReportNotifications(
  recipients: SmsRecipient[],
  reportInfo: {
    weekRange: string
    reportUrl?: string
    academyName?: string
  },
  options?: BatchProcessOptions
): Promise<SmsBulkSendResult> {
  // 주간 보고서용 커스텀 메시지 생성
  const baseVariables: Record<string, string> = {
    noticeTitle: '주간 학습 보고서',
    noticeContent: `${reportInfo.weekRange} 주간 학습 보고서가 준비되었습니다. 앱에서 확인해주세요.`,
    academyName: reportInfo.academyName || 'EduFlow 학원',
  }

  const templateId = SCHEDULE_TYPE_TEMPLATES.weekly_report

  return sendScheduledBulkSms(recipients, templateId, baseVariables, options)
}

// ============================================
// 예약 발송 실행 핵심 함수
// ============================================

/**
 * 예약된 대량 SMS 발송
 *
 * 병렬 배치 처리를 통해 대량의 SMS를 효율적으로 발송합니다.
 *
 * @param recipients - 수신자 목록
 * @param templateId - 템플릿 ID
 * @param baseVariables - 기본 변수 값
 * @param options - 배치 처리 옵션
 */
export async function sendScheduledBulkSms(
  recipients: SmsRecipient[],
  templateId: string,
  baseVariables: Record<string, string> = {},
  options?: BatchProcessOptions
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

  console.log(`[SMS 스케줄러] 발송 시작: ${uniqueRecipients.length}명`)
  console.log(`[SMS 스케줄러] Mock 모드: ${isMockMode()}`)

  // 병렬 배치 처리로 SMS 발송
  const settledResults = await processBatchParallel(
    uniqueRecipients,
    async (recipient) => {
      const message = generatePersonalizedMessage(templateId, recipient, baseVariables)
      return sendSms(recipient.phone, message)
    },
    {
      ...options,
      onProgress: (processed, total) => {
        console.log(`[SMS 스케줄러] 진행 중: ${processed}/${total}`)
        options?.onProgress?.(processed, total)
      },
    }
  )

  // 결과 집계
  const results: SmsSendResult[] = settledResults.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        to: uniqueRecipients[index].phone,
        success: false,
        error: result.reason?.message || '알 수 없는 오류',
        status: 'failed' as const,
      }
    }
  })

  const successCount = results.filter((r) => r.success).length
  const failedCount = results.filter((r) => !r.success).length

  console.log(`[SMS 스케줄러] 발송 완료: 성공 ${successCount}건, 실패 ${failedCount}건`)

  return {
    total: results.length,
    successCount,
    failedCount,
    results,
  }
}

// ============================================
// 스케줄 실행 함수
// ============================================

/**
 * 예약된 스케줄 실행
 *
 * 데이터베이스에서 가져온 스케줄 정보를 바탕으로 SMS를 발송합니다.
 *
 * @param schedule - 스케줄 정보
 * @param recipients - 수신자 목록
 * @returns 실행 결과
 */
export async function executeSchedule(
  schedule: SmsSchedule,
  recipients: SmsRecipient[]
): Promise<ScheduleExecutionResult> {
  console.log(`[SMS 스케줄러] 스케줄 실행 시작: ${schedule.id} (${SCHEDULE_TYPE_LABELS[schedule.type]})`)

  try {
    const result = await sendScheduledBulkSms(
      recipients,
      schedule.templateId,
      schedule.variables
    )

    return {
      scheduleId: schedule.id,
      success: result.successCount > 0,
      totalCount: result.total,
      successCount: result.successCount,
      failedCount: result.failedCount,
      results: result.results,
    }
  } catch (error) {
    console.error(`[SMS 스케줄러] 스케줄 실행 실패: ${schedule.id}`, error)

    return {
      scheduleId: schedule.id,
      success: false,
      totalCount: recipients.length,
      successCount: 0,
      failedCount: recipients.length,
      results: [],
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    }
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 스케줄러 활성화 여부 확인
 */
export function isSchedulerEnabled(): boolean {
  return process.env.SMS_SCHEDULER_ENABLED === 'true'
}

/**
 * 현재 시각이 발송 가능 시간인지 확인
 * (심야 시간 발송 방지: 22시 ~ 08시 사이 발송 금지)
 */
export function isSendableTime(): boolean {
  const now = new Date()
  const hour = now.getHours()

  // 08:00 ~ 21:59 사이만 발송 허용
  return hour >= 8 && hour < 22
}

/**
 * 다음 발송 가능 시각 계산
 * (현재 시간이 발송 불가 시간대인 경우)
 */
export function getNextSendableTime(): Date {
  const now = new Date()
  const hour = now.getHours()

  if (hour >= 22) {
    // 다음날 08시
    const next = new Date(now)
    next.setDate(next.getDate() + 1)
    next.setHours(8, 0, 0, 0)
    return next
  } else if (hour < 8) {
    // 오늘 08시
    const next = new Date(now)
    next.setHours(8, 0, 0, 0)
    return next
  }

  // 현재 시간 (발송 가능)
  return now
}

/**
 * 오늘 마감인 과제 리마인더 시간 계산 (당일 오전 9시)
 */
export function getTodayReminderTime(): Date {
  const today = new Date()
  today.setHours(9, 0, 0, 0)
  return today
}

/**
 * 내일 마감인 과제 리마인더 시간 계산 (전날 오후 6시)
 */
export function getTomorrowReminderTime(): Date {
  const today = new Date()
  today.setHours(18, 0, 0, 0)
  return today
}

/**
 * 이번 주 금요일 보고서 발송 시간 계산 (금요일 오후 5시)
 */
export function getWeeklyReportTime(): Date {
  const now = new Date()
  const day = now.getDay()
  const friday = new Date(now)

  // 금요일까지 남은 일수 계산 (금요일 = 5)
  const daysUntilFriday = day <= 5 ? 5 - day : 7 - day + 5
  friday.setDate(now.getDate() + daysUntilFriday)
  friday.setHours(17, 0, 0, 0)

  return friday
}

/**
 * 주간 범위 문자열 생성 (예: "1/13(월) ~ 1/17(금)")
 */
export function getWeekRangeString(): string {
  const now = new Date()
  const day = now.getDay()

  // 이번 주 월요일
  const monday = new Date(now)
  const daysFromMonday = day === 0 ? 6 : day - 1
  monday.setDate(now.getDate() - daysFromMonday)

  // 이번 주 금요일
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayName = dayNames[date.getDay()]
    return `${month}/${day}(${dayName})`
  }

  return `${formatDate(monday)} ~ ${formatDate(friday)}`
}
