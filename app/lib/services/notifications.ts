/**
 * 통합 알림 서비스
 *
 * SMS(Tally), 카카오톡, 앱내 알림을 통합 관리합니다.
 * 사용자의 알림 설정에 따라 적절한 채널로 알림을 발송합니다.
 */

import { sendSMS } from '@/lib/external/tally'
import {
  sendKakaoAlimtalk,
  KAKAO_TEMPLATES,
  type KakaoTemplateCode,
} from '@/lib/kakao'
import { createServerSupabaseClient } from '@/lib/supabase'
import type {
  ParentNotificationChannels,
  ParentNotificationTypes,
  QuietHours,
} from '@/types/settings'

// ============================================
// 알림 타입 정의
// ============================================

/** 알림 유형 */
export type NotificationType =
  | 'assignment'    // 과제 알림
  | 'report'        // 보고서 알림
  | 'attendance'    // 출결 알림
  | 'grade'         // 성적 알림
  | 'announcement'  // 공지사항

/** 알림 채널 */
export type NotificationChannel = 'sms' | 'kakao' | 'push' | 'email'

/** 알림 발송 결과 */
export interface NotificationResult {
  success: boolean
  channel: NotificationChannel
  messageId?: string
  error?: string
  failedOver?: boolean  // 대체 발송 여부
}

/** 통합 알림 발송 결과 */
export interface SendNotificationResult {
  success: boolean
  results: NotificationResult[]
  totalSent: number
  totalFailed: number
}

/** 알림 데이터 공통 필드 */
interface BaseNotificationData {
  studentName?: string
  academyName?: string
  url?: string
}

/** 과제 알림 데이터 */
export interface AssignmentNotificationData extends BaseNotificationData {
  assignmentTitle: string
  dueDate?: string
  teacherName?: string
}

/** 보고서 알림 데이터 */
export interface ReportNotificationData extends BaseNotificationData {
  reportType: 'weekly' | 'monthly'
  periodStart?: string
  periodEnd?: string
}

/** 출결 알림 데이터 */
export interface AttendanceNotificationData extends BaseNotificationData {
  status: 'check_in' | 'check_out' | 'absent' | 'late'
  time?: string
  date?: string
}

/** 성적 알림 데이터 */
export interface GradeNotificationData extends BaseNotificationData {
  subject: string
  examType?: string
  score: number
  maxScore: number
  rank?: number
  totalStudents?: number
}

/** 공지사항 알림 데이터 */
export interface AnnouncementNotificationData extends BaseNotificationData {
  title: string
  content: string
  isImportant?: boolean
}

/** 알림 데이터 유니온 타입 */
export type NotificationData =
  | AssignmentNotificationData
  | ReportNotificationData
  | AttendanceNotificationData
  | GradeNotificationData
  | AnnouncementNotificationData

/** 알림 설정 정보 */
interface UserNotificationSettings {
  channels: ParentNotificationChannels
  types: ParentNotificationTypes
  quietHours: QuietHours
  phone?: string
  email?: string
}

// ============================================
// Mock 모드
// ============================================

const MOCK_MODE = process.env.NOTIFICATION_MOCK_MODE === 'true' ||
  (!process.env.TALLY_API_KEY && !process.env.KAKAO_REST_API_KEY)

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 현재 시간이 방해금지 시간대인지 확인
 */
function isQuietHours(quietHours: QuietHours): boolean {
  if (!quietHours.enabled) return false

  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const { start, end } = quietHours

  // 같은 날 내 비교 (예: 09:00 ~ 18:00)
  if (start < end) {
    return currentTime >= start && currentTime < end
  }

  // 자정을 넘는 경우 (예: 22:00 ~ 08:00)
  return currentTime >= start || currentTime < end
}

/**
 * 알림 유형에 대한 카카오 템플릿 코드 반환
 */
function getKakaoTemplateCode(type: NotificationType, data: NotificationData): KakaoTemplateCode {
  switch (type) {
    case 'assignment':
      return KAKAO_TEMPLATES.ASSIGNMENT_NEW
    case 'report':
      return KAKAO_TEMPLATES.NOTICE // 보고서는 공지로 발송
    case 'attendance':
      const attendanceData = data as AttendanceNotificationData
      if (attendanceData.status === 'check_in') return KAKAO_TEMPLATES.ATTENDANCE_CHECK_IN
      if (attendanceData.status === 'check_out') return KAKAO_TEMPLATES.ATTENDANCE_CHECK_OUT
      return KAKAO_TEMPLATES.ATTENDANCE_ABSENT
    case 'grade':
      return KAKAO_TEMPLATES.GRADE_NOTIFICATION
    case 'announcement':
      return KAKAO_TEMPLATES.NOTICE
    default:
      return KAKAO_TEMPLATES.NOTICE
  }
}

/**
 * 알림 데이터를 카카오 템플릿 파라미터로 변환
 */
function toKakaoParams(type: NotificationType, data: NotificationData): Record<string, string> {
  const base = {
    studentName: data.studentName || '',
    academyName: data.academyName || 'EduFlow',
    url: data.url || '',
  }

  switch (type) {
    case 'assignment': {
      const d = data as AssignmentNotificationData
      return { ...base, assignmentTitle: d.assignmentTitle, dueDate: d.dueDate || '' }
    }
    case 'report': {
      const d = data as ReportNotificationData
      return {
        ...base,
        title: `${d.reportType === 'weekly' ? '주간' : '월간'} 학습 보고서`,
        content: `${d.studentName || '학생'}의 학습 보고서가 도착했습니다.`,
      }
    }
    case 'attendance': {
      const d = data as AttendanceNotificationData
      return { ...base, time: d.time || '', date: d.date || '' }
    }
    case 'grade': {
      const d = data as GradeNotificationData
      return {
        ...base,
        subject: d.subject,
        score: String(d.score),
        maxScore: String(d.maxScore),
        examType: d.examType || '시험',
      }
    }
    case 'announcement': {
      const d = data as AnnouncementNotificationData
      return { ...base, title: d.title, content: d.content.slice(0, 100) }
    }
    default:
      return base
  }
}

/**
 * 알림 데이터를 SMS 메시지로 변환
 */
function toSMSMessage(type: NotificationType, data: NotificationData): string {
  const academyName = data.academyName || 'EduFlow'
  const studentName = data.studentName || ''

  switch (type) {
    case 'assignment': {
      const d = data as AssignmentNotificationData
      let msg = `[${academyName}] ${studentName}님, 새 과제: ${d.assignmentTitle}`
      if (d.dueDate) msg += ` (마감: ${d.dueDate})`
      if (d.url) msg += `\n${d.url}`
      return msg
    }
    case 'report': {
      const d = data as ReportNotificationData
      let msg = `[${academyName}] ${studentName} ${d.reportType === 'weekly' ? '주간' : '월간'} 학습 보고서가 도착했습니다.`
      if (d.url) msg += `\n${d.url}`
      return msg
    }
    case 'attendance': {
      const d = data as AttendanceNotificationData
      const statusText = {
        check_in: '등원',
        check_out: '하원',
        absent: '결석',
        late: '지각',
      }[d.status]
      return `[${academyName}] ${studentName} 학생 ${statusText}${d.time ? ` (${d.time})` : ''}`
    }
    case 'grade': {
      const d = data as GradeNotificationData
      let msg = `[${academyName}] ${studentName} ${d.subject} ${d.examType || '시험'}: ${d.score}/${d.maxScore}`
      if (d.rank && d.totalStudents) msg += ` (${d.rank}/${d.totalStudents}등)`
      return msg
    }
    case 'announcement': {
      const d = data as AnnouncementNotificationData
      let msg = `[${academyName} 공지] ${d.title}`
      if (d.content) msg += `\n${d.content.slice(0, 50)}...`
      if (d.url) msg += `\n${d.url}`
      return msg
    }
    default:
      return `[${academyName}] 새 알림이 도착했습니다.`
  }
}

// ============================================
// 사용자 설정 조회
// ============================================

/**
 * 사용자의 알림 설정 조회
 */
async function getUserNotificationSettings(userId: string): Promise<UserNotificationSettings | null> {
  // Mock 모드일 경우 기본 설정 반환
  if (MOCK_MODE) {
    return {
      channels: { sms: true, kakao: true, email: true, push: false },
      types: { assignment: true, grade: true, attendance: true, consultation: true, notice: true },
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
      phone: '010-1234-5678',
      email: 'test@example.com',
    }
  }

  try {
    const supabase = createServerSupabaseClient()

    // 사용자 알림 설정 조회
    const { data: settings, error: settingsError } = await (supabase as any)
      .from('parent_notification_settings')
      .select('channels, types, quiet_hours')
      .eq('user_id', userId)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('[Notification] 설정 조회 실패:', settingsError)
      return null
    }

    // 사용자 프로필 조회 (연락처)
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('phone, email')
      .eq('id', userId)
      .single()

    return {
      channels: settings?.channels || { sms: true, kakao: true, email: true, push: false },
      types: settings?.types || { assignment: true, grade: true, attendance: true, consultation: true, notice: true },
      quietHours: settings?.quiet_hours || { enabled: false, start: '22:00', end: '08:00' },
      phone: profile?.phone as string | undefined,
      email: profile?.email as string | undefined,
    }
  } catch (error) {
    console.error('[Notification] 설정 조회 중 오류:', error)
    return null
  }
}

/**
 * 알림 유형이 사용자 설정에서 활성화되어 있는지 확인
 */
function isNotificationTypeEnabled(type: NotificationType, types: ParentNotificationTypes): boolean {
  switch (type) {
    case 'assignment':
      return types.assignment
    case 'grade':
      return types.grade
    case 'attendance':
      return types.attendance
    case 'announcement':
      return types.notice
    case 'report':
      return types.notice  // 보고서는 공지에 포함
    default:
      return true
  }
}

// ============================================
// 앱 내 알림 저장
// ============================================

/**
 * 앱 내 알림 저장 (push 알림용)
 */
async function saveInAppNotification(
  userId: string,
  type: NotificationType,
  data: NotificationData
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (MOCK_MODE) {
    console.log('[Notification Mock] 앱 내 알림 저장:', { userId, type, data })
    return { success: true, id: `inapp-mock-${Date.now()}` }
  }

  try {
    const supabase = createServerSupabaseClient()

    const { data: notification, error } = await (supabase as any)
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title: getNotificationTitle(type, data),
        message: toSMSMessage(type, data),
        data: JSON.stringify(data),
        read: false,
      })
      .select('id')
      .single()

    if (error) throw error

    return { success: true, id: notification?.id as string }
  } catch (error) {
    console.error('[Notification] 앱 내 알림 저장 실패:', error)
    return { success: false, error: error instanceof Error ? error.message : '저장 실패' }
  }
}

/**
 * 알림 유형에 따른 제목 생성
 */
function getNotificationTitle(type: NotificationType, data: NotificationData): string {
  switch (type) {
    case 'assignment':
      return `새 과제: ${(data as AssignmentNotificationData).assignmentTitle}`
    case 'report': {
      const d = data as ReportNotificationData
      return `${d.reportType === 'weekly' ? '주간' : '월간'} 학습 보고서`
    }
    case 'attendance': {
      const d = data as AttendanceNotificationData
      const statusText = { check_in: '등원', check_out: '하원', absent: '결석', late: '지각' }[d.status]
      return `출결 알림: ${statusText}`
    }
    case 'grade':
      return `성적 알림: ${(data as GradeNotificationData).subject}`
    case 'announcement':
      return (data as AnnouncementNotificationData).title
    default:
      return '새 알림'
  }
}

// ============================================
// 메인 알림 발송 함수
// ============================================

/**
 * 통합 알림 발송
 *
 * 사용자의 알림 설정을 확인하고, 활성화된 채널로 알림을 발송합니다.
 *
 * @param userId - 수신자 사용자 ID
 * @param type - 알림 유형 (assignment, report, attendance, grade, announcement)
 * @param data - 알림 데이터
 * @returns 발송 결과
 *
 * @example
 * ```ts
 * // 과제 알림 발송
 * const result = await sendNotification('user-123', 'assignment', {
 *   studentName: '홍길동',
 *   assignmentTitle: '수학 3단원 복습',
 *   dueDate: '2024-01-15',
 * })
 *
 * // 출결 알림 발송
 * const result = await sendNotification('user-123', 'attendance', {
 *   studentName: '홍길동',
 *   status: 'check_in',
 *   time: '09:00',
 * })
 * ```
 */
export async function sendNotification(
  userId: string,
  type: NotificationType,
  data: NotificationData
): Promise<SendNotificationResult> {
  const results: NotificationResult[] = []

  // 1. 사용자 알림 설정 조회
  const settings = await getUserNotificationSettings(userId)

  if (!settings) {
    console.warn('[Notification] 사용자 설정을 찾을 수 없음:', userId)
    return { success: false, results: [], totalSent: 0, totalFailed: 0 }
  }

  // 2. 알림 유형 활성화 여부 확인
  if (!isNotificationTypeEnabled(type, settings.types)) {
    console.log('[Notification] 알림 유형 비활성화됨:', type)
    return { success: true, results: [], totalSent: 0, totalFailed: 0 }
  }

  // 3. 방해금지 시간 확인
  if (isQuietHours(settings.quietHours)) {
    console.log('[Notification] 방해금지 시간대, 앱 내 알림만 저장')
    // 방해금지 시간에는 앱 내 알림만 저장
    const inAppResult = await saveInAppNotification(userId, type, data)
    return {
      success: inAppResult.success,
      results: [{
        success: inAppResult.success,
        channel: 'push',
        messageId: inAppResult.id,
        error: inAppResult.error,
      }],
      totalSent: inAppResult.success ? 1 : 0,
      totalFailed: inAppResult.success ? 0 : 1,
    }
  }

  // 4. 채널별 발송 (병렬 처리)
  const promises: Promise<NotificationResult>[] = []

  // SMS 발송
  if (settings.channels.sms && settings.phone) {
    promises.push(
      sendSMS({
        to: settings.phone,
        message: toSMSMessage(type, data),
      }).then((result) => ({
        success: result.success,
        channel: 'sms' as NotificationChannel,
        messageId: result.messageId,
        error: result.error,
      }))
    )
  }

  // 카카오톡 발송
  if (settings.channels.kakao && settings.phone) {
    promises.push(
      sendKakaoAlimtalk({
        to: settings.phone,
        templateCode: getKakaoTemplateCode(type, data),
        templateParams: toKakaoParams(type, data),
        failoverToSMS: false,  // 이미 SMS 별도 발송
      }).then((result) => ({
        success: result.success,
        channel: 'kakao' as NotificationChannel,
        messageId: result.messageId,
        error: result.error,
        failedOver: result.failedOver,
      }))
    )
  }

  // 앱 내 알림 저장 (push)
  if (settings.channels.push) {
    promises.push(
      saveInAppNotification(userId, type, data).then((result) => ({
        success: result.success,
        channel: 'push' as NotificationChannel,
        messageId: result.id,
        error: result.error,
      }))
    )
  }

  // 이메일 발송 (TODO: 이메일 서비스 연동)
  if (settings.channels.email && settings.email) {
    // 이메일 발송은 추후 구현
    console.log('[Notification] 이메일 발송 (미구현):', settings.email)
  }

  // 5. 모든 발송 완료 대기
  const channelResults = await Promise.all(promises)
  results.push(...channelResults)

  const totalSent = results.filter((r) => r.success).length
  const totalFailed = results.filter((r) => !r.success).length

  return {
    success: totalFailed === 0,
    results,
    totalSent,
    totalFailed,
  }
}

// ============================================
// 대량 알림 발송
// ============================================

/** 대량 알림 수신자 정보 */
export interface BulkNotificationRecipient {
  userId: string
  phone?: string
  email?: string
  data?: Partial<NotificationData>  // 개별 데이터 오버라이드
}

/**
 * 대량 알림 발송
 *
 * 여러 사용자에게 동일한 유형의 알림을 일괄 발송합니다.
 *
 * @param recipients - 수신자 목록
 * @param type - 알림 유형
 * @param baseData - 기본 알림 데이터 (개별 데이터로 오버라이드 가능)
 * @returns 발송 결과
 */
export async function sendBulkNotification(
  recipients: BulkNotificationRecipient[],
  type: NotificationType,
  baseData: NotificationData
): Promise<{
  success: boolean
  totalRecipients: number
  successCount: number
  failedCount: number
  results: Array<{ userId: string; result: SendNotificationResult }>
}> {
  const results: Array<{ userId: string; result: SendNotificationResult }> = []

  // 10개씩 병렬 처리
  const batchSize = 10
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(async (recipient) => {
        const data = { ...baseData, ...recipient.data } as NotificationData
        const result = await sendNotification(recipient.userId, type, data)
        return { userId: recipient.userId, result }
      })
    )

    results.push(...batchResults)
  }

  const successCount = results.filter((r) => r.result.success).length
  const failedCount = results.filter((r) => !r.result.success).length

  return {
    success: failedCount === 0,
    totalRecipients: recipients.length,
    successCount,
    failedCount,
    results,
  }
}

// ============================================
// 편의 함수
// ============================================

/**
 * 과제 알림 발송
 */
export async function sendAssignmentNotification(
  userId: string,
  data: AssignmentNotificationData
): Promise<SendNotificationResult> {
  return sendNotification(userId, 'assignment', data)
}

/**
 * 보고서 알림 발송
 */
export async function sendReportNotification(
  userId: string,
  data: ReportNotificationData
): Promise<SendNotificationResult> {
  return sendNotification(userId, 'report', data)
}

/**
 * 출결 알림 발송
 */
export async function sendAttendanceNotification(
  userId: string,
  data: AttendanceNotificationData
): Promise<SendNotificationResult> {
  return sendNotification(userId, 'attendance', data)
}

/**
 * 성적 알림 발송
 */
export async function sendGradeNotification(
  userId: string,
  data: GradeNotificationData
): Promise<SendNotificationResult> {
  return sendNotification(userId, 'grade', data)
}

/**
 * 공지사항 알림 발송
 */
export async function sendAnnouncementNotification(
  userId: string,
  data: AnnouncementNotificationData
): Promise<SendNotificationResult> {
  return sendNotification(userId, 'announcement', data)
}

// ============================================
// 알림 조회/관리
// ============================================

/**
 * 사용자의 알림 목록 조회
 */
export async function getNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean
    limit?: number
    offset?: number
  }
): Promise<{
  notifications: Array<{
    id: string
    type: NotificationType
    title: string
    message: string
    read: boolean
    createdAt: string
  }>
  total: number
}> {
  if (MOCK_MODE) {
    return {
      notifications: [
        {
          id: 'mock-1',
          type: 'assignment',
          title: '새 과제: 수학 3단원',
          message: '[EduFlow] 홍길동님, 새 과제가 도착했습니다.',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
    }
  }

  try {
    const supabase = createServerSupabaseClient()
    let query = (supabase as any)
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.unreadOnly) {
      query = query.eq('read', false)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, count, error } = await query

    if (error) throw error

    return {
      notifications: (data || []).map((n: {
        id: string
        type: string
        title: string
        message: string
        read: boolean
        created_at: string
      }) => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.created_at,
      })),
      total: count || 0,
    }
  } catch (error) {
    console.error('[Notification] 알림 조회 실패:', error)
    return { notifications: [], total: 0 }
  }
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  if (MOCK_MODE) {
    console.log('[Notification Mock] 알림 읽음 처리:', notificationId)
    return { success: true }
  }

  try {
    const supabase = createServerSupabaseClient()
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('[Notification] 읽음 처리 실패:', error)
    return { success: false, error: error instanceof Error ? error.message : '처리 실패' }
  }
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  if (MOCK_MODE) {
    console.log('[Notification Mock] 모든 알림 읽음 처리:', userId)
    return { success: true, count: 1 }
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await (supabase as any)
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false)
      .select('id')

    if (error) throw error
    return { success: true, count: data?.length || 0 }
  } catch (error) {
    console.error('[Notification] 전체 읽음 처리 실패:', error)
    return { success: false, count: 0, error: error instanceof Error ? error.message : '처리 실패' }
  }
}

/**
 * 읽지 않은 알림 개수 조회
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  if (MOCK_MODE) {
    return 3  // Mock 데이터
  }

  try {
    const supabase = createServerSupabaseClient()
    const { count, error } = await (supabase as any)
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('[Notification] 미읽은 알림 개수 조회 실패:', error)
    return 0
  }
}
