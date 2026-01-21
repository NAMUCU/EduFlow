/**
 * 설정 서비스 레이어
 *
 * 사용자 및 학원 설정 관련 CRUD 작업을 처리합니다.
 * 실제 환경에서는 Supabase와 연동되며, 개발 환경에서는 Mock 데이터를 사용합니다.
 */

import type {
  ProfileSettings,
  ProfileUpdateRequest,
  NotificationSettings,
  NotificationUpdateRequest,
  AcademySettings,
  AcademyUpdateRequest,
  ApiKeySettings,
  ApiKeyUpdateRequest,
  ModelSettings,
  ModelSettingsUpdateRequest,
  UserSettings,
  SettingsResponse,
  NotificationChannels,
  NotificationTypes,
} from '@/types/settings'
import {
  DEFAULT_NOTIFICATION_CHANNELS,
  DEFAULT_NOTIFICATION_TYPES,
  DEFAULT_MODEL_SETTINGS,
  DEFAULT_API_KEY_SETTINGS,
  DEFAULT_OPERATING_HOURS,
} from '@/types/settings'

// ============================================
// API 클라이언트 헬퍼
// ============================================

/**
 * API 요청 기본 헤더
 */
const API_HEADERS = {
  'Content-Type': 'application/json',
}

/**
 * API 응답 처리 헬퍼
 */
async function handleApiResponse<T>(response: Response): Promise<SettingsResponse<T>> {
  const result = await response.json()
  return result as SettingsResponse<T>
}

/**
 * API 에러 처리 헬퍼
 */
function handleApiError<T>(error: unknown, defaultMessage: string): SettingsResponse<T> {
  console.error(defaultMessage, error)
  return {
    success: false,
    error: defaultMessage,
    code: 'NETWORK_ERROR',
  } as SettingsResponse<T>
}

// ============================================
// 사용자 설정 서비스
// ============================================

/**
 * 사용자 전체 설정 조회
 *
 * @param userId 사용자 ID
 * @returns 사용자 설정 데이터 또는 기본값
 */
export async function getUserSettings(userId: string): Promise<SettingsResponse<UserSettings>> {
  try {
    // 병렬로 모든 설정 조회
    const [profileRes, notificationsRes, apiKeysRes, modelsRes] = await Promise.all([
      fetch('/api/settings/profile'),
      fetch('/api/settings/notifications'),
      fetch('/api/settings/api-keys'),
      fetch('/api/settings/models'),
    ])

    const [profileResult, notificationsResult, apiKeysResult, modelsResult] = await Promise.all([
      handleApiResponse<ProfileSettings>(profileRes),
      handleApiResponse<NotificationSettings>(notificationsRes),
      handleApiResponse<{ keys: ApiKeySettings }>(apiKeysRes),
      handleApiResponse<ModelSettings>(modelsRes),
    ])

    // 하나라도 실패하면 에러 반환
    if (!profileResult.success) {
      return { success: false, error: '프로필 조회 실패', code: 'PROFILE_ERROR' } as SettingsResponse<UserSettings>
    }

    const userSettings: UserSettings = {
      profile: profileResult.data,
      notifications: notificationsResult.success
        ? notificationsResult.data
        : createDefaultNotificationSettings(userId),
      ai: {
        generationModel: 'gemini',
        autoReview: true,
        reviewModels: ['gemini', 'gpt'],
      },
      appearance: { theme: 'light' },
      apiKeys: apiKeysResult.success
        ? apiKeysResult.data.keys
        : DEFAULT_API_KEY_SETTINGS,
      models: modelsResult.success
        ? modelsResult.data
        : DEFAULT_MODEL_SETTINGS,
    }

    return {
      success: true,
      data: userSettings,
    }
  } catch (error) {
    return handleApiError<UserSettings>(error, '사용자 설정을 불러오는 중 오류가 발생했습니다.')
  }
}

/**
 * 사용자 설정 업데이트
 *
 * @param userId 사용자 ID
 * @param settings 업데이트할 설정 (부분 업데이트 지원)
 * @returns 업데이트된 설정 데이터
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<{
    profile: ProfileUpdateRequest
    notifications: NotificationUpdateRequest
    apiKeys: ApiKeyUpdateRequest
    models: ModelSettingsUpdateRequest
  }>
): Promise<SettingsResponse<UserSettings>> {
  try {
    const updatePromises: Promise<Response>[] = []

    // 프로필 업데이트
    if (settings.profile) {
      updatePromises.push(
        fetch('/api/settings/profile', {
          method: 'PUT',
          headers: API_HEADERS,
          body: JSON.stringify(settings.profile),
        })
      )
    }

    // 알림 설정 업데이트
    if (settings.notifications) {
      updatePromises.push(
        fetch('/api/settings/notifications', {
          method: 'PUT',
          headers: API_HEADERS,
          body: JSON.stringify(settings.notifications),
        })
      )
    }

    // API 키 업데이트
    if (settings.apiKeys) {
      updatePromises.push(
        fetch('/api/settings/api-keys', {
          method: 'PUT',
          headers: API_HEADERS,
          body: JSON.stringify(settings.apiKeys),
        })
      )
    }

    // 모델 설정 업데이트
    if (settings.models) {
      updatePromises.push(
        fetch('/api/settings/models', {
          method: 'PUT',
          headers: API_HEADERS,
          body: JSON.stringify(settings.models),
        })
      )
    }

    await Promise.all(updatePromises)

    // 업데이트 후 전체 설정 다시 조회
    return getUserSettings(userId)
  } catch (error) {
    return handleApiError<UserSettings>(error, '사용자 설정 업데이트 중 오류가 발생했습니다.')
  }
}

// ============================================
// 프로필 설정 서비스
// ============================================

/**
 * 사용자 프로필 조회
 *
 * @param userId 사용자 ID
 * @returns 프로필 설정
 */
export async function getProfileSettings(userId: string): Promise<SettingsResponse<ProfileSettings>> {
  try {
    const response = await fetch('/api/settings/profile')
    return handleApiResponse<ProfileSettings>(response)
  } catch (error) {
    return handleApiError<ProfileSettings>(error, '프로필을 불러오는 중 오류가 발생했습니다.')
  }
}

/**
 * 사용자 프로필 업데이트
 *
 * @param userId 사용자 ID
 * @param profile 프로필 업데이트 데이터
 * @returns 업데이트된 프로필
 */
export async function updateProfileSettings(
  userId: string,
  profile: ProfileUpdateRequest
): Promise<SettingsResponse<ProfileSettings>> {
  try {
    const response = await fetch('/api/settings/profile', {
      method: 'PUT',
      headers: API_HEADERS,
      body: JSON.stringify(profile),
    })
    return handleApiResponse<ProfileSettings>(response)
  } catch (error) {
    return handleApiError<ProfileSettings>(error, '프로필 업데이트 중 오류가 발생했습니다.')
  }
}

// ============================================
// 알림 설정 서비스
// ============================================

/**
 * 알림 설정 조회
 *
 * @param userId 사용자 ID
 * @returns 알림 설정
 */
export async function getNotificationSettings(userId: string): Promise<SettingsResponse<NotificationSettings>> {
  try {
    const response = await fetch('/api/settings/notifications')
    return handleApiResponse<NotificationSettings>(response)
  } catch (error) {
    return handleApiError<NotificationSettings>(error, '알림 설정을 불러오는 중 오류가 발생했습니다.')
  }
}

/**
 * 알림 설정 업데이트
 *
 * @param userId 사용자 ID
 * @param notifications 알림 설정 업데이트 데이터
 * @returns 업데이트된 알림 설정
 */
export async function updateNotificationSettings(
  userId: string,
  notifications: NotificationUpdateRequest
): Promise<SettingsResponse<NotificationSettings>> {
  try {
    const response = await fetch('/api/settings/notifications', {
      method: 'PUT',
      headers: API_HEADERS,
      body: JSON.stringify(notifications),
    })
    return handleApiResponse<NotificationSettings>(response)
  } catch (error) {
    return handleApiError<NotificationSettings>(error, '알림 설정 업데이트 중 오류가 발생했습니다.')
  }
}

// ============================================
// 학원 설정 서비스
// ============================================

/**
 * 학원 설정 조회
 *
 * @param academyId 학원 ID
 * @returns 학원 설정
 */
export async function getAcademySettings(academyId: string): Promise<SettingsResponse<AcademySettings>> {
  try {
    const response = await fetch('/api/settings/academy')
    return handleApiResponse<AcademySettings>(response)
  } catch (error) {
    return handleApiError<AcademySettings>(error, '학원 설정을 불러오는 중 오류가 발생했습니다.')
  }
}

/**
 * 학원 설정 업데이트
 *
 * @param academyId 학원 ID
 * @param settings 학원 설정 업데이트 데이터
 * @returns 업데이트된 학원 설정
 */
export async function updateAcademySettings(
  academyId: string,
  settings: AcademyUpdateRequest
): Promise<SettingsResponse<AcademySettings>> {
  try {
    const response = await fetch('/api/settings/academy', {
      method: 'PUT',
      headers: API_HEADERS,
      body: JSON.stringify(settings),
    })
    return handleApiResponse<AcademySettings>(response)
  } catch (error) {
    return handleApiError<AcademySettings>(error, '학원 설정 업데이트 중 오류가 발생했습니다.')
  }
}

// ============================================
// API 키 설정 서비스
// ============================================

/**
 * API 키 설정 조회
 *
 * @param academyId 학원 ID
 * @returns API 키 설정 (마스킹됨)
 */
export async function getApiKeySettings(academyId: string): Promise<SettingsResponse<ApiKeySettings>> {
  try {
    const response = await fetch('/api/settings/api-keys')
    const result = await handleApiResponse<{ keys: ApiKeySettings; masked: ApiKeySettings }>(response)

    if (result.success) {
      return {
        success: true,
        data: result.data.keys,
      }
    }
    return { success: false, error: result.error, code: (result as { code?: string }).code } as SettingsResponse<ApiKeySettings>
  } catch (error) {
    return handleApiError<ApiKeySettings>(error, 'API 키 설정을 불러오는 중 오류가 발생했습니다.')
  }
}

/**
 * API 키 설정 업데이트
 *
 * @param academyId 학원 ID
 * @param apiKeys API 키 업데이트 데이터
 * @returns 업데이트된 API 키 설정 (마스킹됨)
 */
export async function updateApiKeySettings(
  academyId: string,
  apiKeys: ApiKeyUpdateRequest
): Promise<SettingsResponse<ApiKeySettings>> {
  try {
    const response = await fetch('/api/settings/api-keys', {
      method: 'PUT',
      headers: API_HEADERS,
      body: JSON.stringify(apiKeys),
    })
    const result = await handleApiResponse<{ keys: ApiKeySettings; masked: ApiKeySettings }>(response)

    if (result.success) {
      return {
        success: true,
        data: result.data.keys,
      }
    }
    return { success: false, error: result.error, code: (result as { code?: string }).code } as SettingsResponse<ApiKeySettings>
  } catch (error) {
    return handleApiError<ApiKeySettings>(error, 'API 키 업데이트 중 오류가 발생했습니다.')
  }
}

// ============================================
// 모델 설정 서비스
// ============================================

/**
 * 모델 설정 조회
 *
 * @param academyId 학원 ID
 * @returns 모델 설정
 */
export async function getModelSettings(academyId: string): Promise<SettingsResponse<ModelSettings>> {
  try {
    const response = await fetch('/api/settings/models')
    return handleApiResponse<ModelSettings>(response)
  } catch (error) {
    return handleApiError<ModelSettings>(error, '모델 설정을 불러오는 중 오류가 발생했습니다.')
  }
}

/**
 * 모델 설정 업데이트
 *
 * @param academyId 학원 ID
 * @param models 모델 설정 업데이트 데이터
 * @returns 업데이트된 모델 설정
 */
export async function updateModelSettings(
  academyId: string,
  models: ModelSettingsUpdateRequest
): Promise<SettingsResponse<ModelSettings>> {
  try {
    const response = await fetch('/api/settings/models', {
      method: 'PUT',
      headers: API_HEADERS,
      body: JSON.stringify(models),
    })
    return handleApiResponse<ModelSettings>(response)
  } catch (error) {
    return handleApiError<ModelSettings>(error, '모델 설정 업데이트 중 오류가 발생했습니다.')
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 기본 알림 설정 생성
 */
function createDefaultNotificationSettings(userId: string): NotificationSettings {
  return {
    id: `notification-${userId}`,
    userId,
    channels: DEFAULT_NOTIFICATION_CHANNELS,
    types: DEFAULT_NOTIFICATION_TYPES,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * 기본 학원 설정 생성
 */
export function createDefaultAcademySettings(academyId: string, name: string): AcademySettings {
  return {
    id: academyId,
    name,
    address: null,
    phone: null,
    logoImage: null,
    businessNumber: null,
    operatingHours: DEFAULT_OPERATING_HOURS,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * 설정 유효성 검사
 */
export function validateSettings<T>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${String(field)} 필드가 필요합니다.`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 전화번호 형식 검증
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
  return phoneRegex.test(phone.replace(/-/g, ''))
}

/**
 * 사업자 등록번호 형식 검증
 */
export function validateBusinessNumber(bizNum: string): boolean {
  const bizNumRegex = /^[0-9]{3}-?[0-9]{2}-?[0-9]{5}$/
  return bizNumRegex.test(bizNum.replace(/-/g, ''))
}

/**
 * 시간 형식 검증 (HH:MM)
 */
export function validateTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  return timeRegex.test(time)
}

// ============================================
// React Query / SWR 용 키 생성 함수
// ============================================

export const settingsQueryKeys = {
  all: ['settings'] as const,
  user: (userId: string) => [...settingsQueryKeys.all, 'user', userId] as const,
  profile: (userId: string) => [...settingsQueryKeys.user(userId), 'profile'] as const,
  notifications: (userId: string) => [...settingsQueryKeys.user(userId), 'notifications'] as const,
  academy: (academyId: string) => [...settingsQueryKeys.all, 'academy', academyId] as const,
  apiKeys: (academyId: string) => [...settingsQueryKeys.academy(academyId), 'api-keys'] as const,
  models: (academyId: string) => [...settingsQueryKeys.academy(academyId), 'models'] as const,
}
