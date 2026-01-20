/**
 * EduFlow 설정 관련 타입 정의
 *
 * 사용자 프로필, 알림 설정, 학원 설정에 관한 모든 타입을 정의합니다.
 */

// ============================================
// 프로필 설정 타입
// ============================================

/** 프로필 설정 */
export interface ProfileSettings {
  id: string
  name: string
  email: string
  phone: string | null
  profileImage: string | null
  updatedAt: string
}

/** 프로필 수정 요청 타입 */
export interface ProfileUpdateRequest {
  name?: string
  phone?: string | null
  profileImage?: string | null
}

// ============================================
// 비밀번호 변경 타입
// ============================================

/** 비밀번호 변경 요청 타입 */
export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/** 비밀번호 변경 응답 타입 */
export interface PasswordChangeResponse {
  success: boolean
  message: string
}

// ============================================
// 알림 설정 타입
// ============================================

/** 알림 수신 방법 설정 */
export interface NotificationChannels {
  email: boolean       // 이메일 알림
  sms: boolean         // 문자 알림
  push: boolean        // 푸시 알림
}

/** 알림 종류별 설정 */
export interface NotificationTypes {
  reportReminder: boolean      // 보고서 발송 알림
  assignmentReminder: boolean  // 과제 마감 알림
  gradeUpdate: boolean         // 성적 업데이트 알림
  consultationReminder: boolean // 상담 일정 알림
  systemNotice: boolean        // 시스템 공지사항
}

/** 알림 설정 전체 */
export interface NotificationSettings {
  id: string
  userId: string
  channels: NotificationChannels
  types: NotificationTypes
  updatedAt: string
}

/** 알림 설정 수정 요청 타입 */
export interface NotificationUpdateRequest {
  channels?: Partial<NotificationChannels>
  types?: Partial<NotificationTypes>
}

// ============================================
// 학원 설정 타입 (원장 전용)
// ============================================

/** 운영 시간 */
export interface OperatingHours {
  dayOfWeek: number       // 0: 일요일, 1: 월요일, ..., 6: 토요일
  openTime: string | null // 오픈 시간 (HH:MM)
  closeTime: string | null // 마감 시간 (HH:MM)
  isOpen: boolean          // 영업 여부
}

/** 학원 설정 */
export interface AcademySettings {
  id: string
  name: string
  address: string | null
  phone: string | null
  logoImage: string | null
  businessNumber: string | null
  operatingHours: OperatingHours[]
  updatedAt: string
}

/** 학원 설정 수정 요청 타입 */
export interface AcademyUpdateRequest {
  name?: string
  address?: string | null
  phone?: string | null
  logoImage?: string | null
  businessNumber?: string | null
  operatingHours?: OperatingHours[]
}

// ============================================
// AI 설정 타입
// ============================================

/** AI 모델 옵션 */
export type AIModel = 'gemini' | 'gpt' | 'claude'

/** AI 설정 */
export interface AISettings {
  generationModel: AIModel      // 문제 생성 모델
  autoReview: boolean           // 자동 검수 활성화
  reviewModels: AIModel[]       // 검수에 사용할 모델들
}

// ============================================
// 테마 설정 타입
// ============================================

/** 테마 옵션 */
export type ThemeMode = 'light' | 'dark' | 'system'

/** 화면 설정 */
export interface AppearanceSettings {
  theme: ThemeMode
}

// ============================================
// 통합 설정 타입
// ============================================

/** 전체 사용자 설정 */
export interface UserSettings {
  profile: ProfileSettings
  notifications: NotificationSettings
  ai: AISettings
  appearance: AppearanceSettings
}

// ============================================
// API 응답 타입
// ============================================

/** 설정 API 성공 응답 */
export interface SettingsApiResponse<T> {
  success: true
  data: T
}

/** 설정 API 에러 응답 */
export interface SettingsApiError {
  success: false
  error: string
  code?: string
}

/** 설정 API 응답 (유니온 타입) */
export type SettingsResponse<T> = SettingsApiResponse<T> | SettingsApiError

// ============================================
// 한국어 라벨 상수
// ============================================

/** 요일 한국어 라벨 */
export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: '일요일',
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
}

/** AI 모델 한국어 라벨 */
export const AI_MODEL_LABELS: Record<AIModel, string> = {
  gemini: 'Gemini 3.0 Pro',
  gpt: 'GPT-4',
  claude: 'Claude 3',
}

/** 테마 한국어 라벨 */
export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  light: '라이트',
  dark: '다크',
  system: '시스템',
}

/** 알림 채널 한국어 라벨 */
export const NOTIFICATION_CHANNEL_LABELS: Record<keyof NotificationChannels, { label: string; description: string }> = {
  email: { label: '이메일 알림', description: '중요 알림을 이메일로 받습니다' },
  sms: { label: '문자 알림', description: '긴급 알림을 문자로 받습니다' },
  push: { label: '푸시 알림', description: '앱 푸시 알림을 받습니다' },
}

/** 알림 종류 한국어 라벨 */
export const NOTIFICATION_TYPE_LABELS: Record<keyof NotificationTypes, { label: string; description: string }> = {
  reportReminder: { label: '보고서 발송 알림', description: '주간 보고서 발송 시점을 알려드립니다' },
  assignmentReminder: { label: '과제 마감 알림', description: '과제 마감 전 미제출 학생을 알려드립니다' },
  gradeUpdate: { label: '성적 업데이트 알림', description: '학생 성적이 업데이트되면 알려드립니다' },
  consultationReminder: { label: '상담 일정 알림', description: '예정된 상담 일정을 알려드립니다' },
  systemNotice: { label: '시스템 공지사항', description: '서비스 관련 중요 공지를 알려드립니다' },
}

// ============================================
// 기본값
// ============================================

/** 기본 알림 채널 설정 */
export const DEFAULT_NOTIFICATION_CHANNELS: NotificationChannels = {
  email: true,
  sms: true,
  push: false,
}

/** 기본 알림 종류 설정 */
export const DEFAULT_NOTIFICATION_TYPES: NotificationTypes = {
  reportReminder: true,
  assignmentReminder: true,
  gradeUpdate: true,
  consultationReminder: true,
  systemNotice: true,
}

/** 기본 운영 시간 (월-금 09:00-22:00, 토 10:00-18:00) */
export const DEFAULT_OPERATING_HOURS: OperatingHours[] = [
  { dayOfWeek: 0, openTime: null, closeTime: null, isOpen: false },    // 일요일 휴무
  { dayOfWeek: 1, openTime: '09:00', closeTime: '22:00', isOpen: true }, // 월요일
  { dayOfWeek: 2, openTime: '09:00', closeTime: '22:00', isOpen: true }, // 화요일
  { dayOfWeek: 3, openTime: '09:00', closeTime: '22:00', isOpen: true }, // 수요일
  { dayOfWeek: 4, openTime: '09:00', closeTime: '22:00', isOpen: true }, // 목요일
  { dayOfWeek: 5, openTime: '09:00', closeTime: '22:00', isOpen: true }, // 금요일
  { dayOfWeek: 6, openTime: '10:00', closeTime: '18:00', isOpen: true }, // 토요일
]

/** 기본 AI 설정 */
export const DEFAULT_AI_SETTINGS: AISettings = {
  generationModel: 'gemini',
  autoReview: true,
  reviewModels: ['gemini', 'gpt'],
}

// ============================================
// 학부모 알림 설정 타입 (PRD F5)
// ============================================

/** 학부모용 알림 수신 채널 설정 */
export interface ParentNotificationChannels {
  sms: boolean         // 문자 알림
  kakao: boolean       // 카카오톡 알림
  email: boolean       // 이메일 알림
  push: boolean        // 앱 푸시 알림
}

/** 학부모용 알림 유형별 설정 */
export interface ParentNotificationTypes {
  assignment: boolean   // 과제 알림
  grade: boolean        // 성적 알림
  attendance: boolean   // 출결 알림
  consultation: boolean // 상담 알림
  notice: boolean       // 공지 알림
}

/** 방해금지 시간대 설정 */
export interface QuietHours {
  enabled: boolean    // 방해금지 시간 활성화
  start: string       // 시작 시간 (HH:mm)
  end: string         // 종료 시간 (HH:mm)
}

/** 보고서 수신 설정 */
export interface ReportDeliverySettings {
  weekly: boolean       // 주간 보고서 수신
  monthly: boolean      // 월간 보고서 수신
  preferredDay: number  // 선호 요일 (0-6, 일-토)
}

/** 학부모 알림 설정 전체 */
export interface ParentNotificationSettings {
  id: string
  userId: string
  channels: ParentNotificationChannels
  types: ParentNotificationTypes
  quietHours: QuietHours
  reports: ReportDeliverySettings
  createdAt: string
  updatedAt: string
}

/** 학부모 알림 설정 수정 요청 타입 */
export interface ParentNotificationSettingsUpdateRequest {
  channels?: Partial<ParentNotificationChannels>
  types?: Partial<ParentNotificationTypes>
  quietHours?: Partial<QuietHours>
  reports?: Partial<ReportDeliverySettings>
}

// ============================================
// 학부모 알림 설정 한국어 라벨
// ============================================

/** 학부모 알림 채널 한국어 라벨 */
export const PARENT_NOTIFICATION_CHANNEL_LABELS: Record<keyof ParentNotificationChannels, { label: string; description: string }> = {
  sms: { label: '문자 알림', description: '휴대폰 문자로 알림을 받습니다' },
  kakao: { label: '카카오톡 알림', description: '카카오톡 메시지로 알림을 받습니다' },
  email: { label: '이메일 알림', description: '이메일로 알림을 받습니다' },
  push: { label: '앱 푸시 알림', description: '모바일 앱 푸시 알림을 받습니다' },
}

/** 학부모 알림 유형 한국어 라벨 */
export const PARENT_NOTIFICATION_TYPE_LABELS: Record<keyof ParentNotificationTypes, { label: string; description: string }> = {
  assignment: { label: '과제 알림', description: '자녀의 과제 배정 및 제출 현황을 알려드립니다' },
  grade: { label: '성적 알림', description: '자녀의 시험 성적 및 평가 결과를 알려드립니다' },
  attendance: { label: '출결 알림', description: '자녀의 출석, 결석, 지각 현황을 알려드립니다' },
  consultation: { label: '상담 알림', description: '상담 일정 및 상담 결과를 알려드립니다' },
  notice: { label: '공지 알림', description: '학원 공지사항 및 안내 사항을 알려드립니다' },
}

/** 선호 요일 한국어 라벨 */
export const PREFERRED_DAY_LABELS: Record<number, string> = {
  0: '일요일',
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
}

// ============================================
// 학부모 알림 설정 기본값
// ============================================

/** 기본 학부모 알림 채널 설정 */
export const DEFAULT_PARENT_NOTIFICATION_CHANNELS: ParentNotificationChannels = {
  sms: true,
  kakao: true,
  email: true,
  push: false,
}

/** 기본 학부모 알림 유형 설정 */
export const DEFAULT_PARENT_NOTIFICATION_TYPES: ParentNotificationTypes = {
  assignment: true,
  grade: true,
  attendance: true,
  consultation: true,
  notice: true,
}

/** 기본 방해금지 시간 설정 */
export const DEFAULT_QUIET_HOURS: QuietHours = {
  enabled: false,
  start: '22:00',
  end: '08:00',
}

/** 기본 보고서 수신 설정 */
export const DEFAULT_REPORT_DELIVERY_SETTINGS: ReportDeliverySettings = {
  weekly: true,
  monthly: true,
  preferredDay: 1, // 월요일
}
