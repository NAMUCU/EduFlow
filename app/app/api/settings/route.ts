/**
 * 통합 설정 API
 *
 * GET: 모든 사용자 설정 조회
 * PUT: 설정 일괄 업데이트
 *
 * 이 API는 프로필, 알림, API 키, 모델 설정을 한 번에 처리합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  ProfileSettings,
  NotificationSettings,
  AcademySettings,
  ApiKeySettings,
  ModelSettings,
  UserSettings,
  SettingsResponse,
  ProfileUpdateRequest,
  NotificationUpdateRequest,
  ApiKeyUpdateRequest,
  ModelSettingsUpdateRequest,
  AcademyUpdateRequest,
} from '@/types/settings'
import {
  DEFAULT_NOTIFICATION_CHANNELS,
  DEFAULT_NOTIFICATION_TYPES,
  DEFAULT_MODEL_SETTINGS,
  DEFAULT_API_KEY_SETTINGS,
} from '@/types/settings'

/**
 * 현재 사용자 정보 (Mock)
 * TODO: 실제로는 세션에서 가져옴
 */
function getCurrentUser() {
  return {
    userId: 'mock-user-1',
    academyId: 'mock-academy-1',
    role: 'owner' as const,
  }
}

/**
 * 설정 데이터 조회 헬퍼
 */
async function fetchSettingsData(baseUrl: string) {
  const headers = { 'Content-Type': 'application/json' }

  const [profileRes, notificationsRes, apiKeysRes, modelsRes, academyRes] = await Promise.all([
    fetch(`${baseUrl}/api/settings/profile`, { headers }),
    fetch(`${baseUrl}/api/settings/notifications`, { headers }),
    fetch(`${baseUrl}/api/settings/api-keys`, { headers }),
    fetch(`${baseUrl}/api/settings/models`, { headers }),
    fetch(`${baseUrl}/api/settings/academy`, { headers }),
  ])

  const [profile, notifications, apiKeys, models, academy] = await Promise.all([
    profileRes.json(),
    notificationsRes.json(),
    apiKeysRes.json(),
    modelsRes.json(),
    academyRes.json(),
  ])

  return { profile, notifications, apiKeys, models, academy }
}

/**
 * GET: 모든 사용자 설정 조회
 *
 * 프로필, 알림, API 키, 모델 설정을 한 번에 조회합니다.
 * 원장의 경우 학원 설정도 포함됩니다.
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     profile: ProfileSettings,
 *     notifications: NotificationSettings,
 *     apiKeys: ApiKeySettings,
 *     models: ModelSettings,
 *     academy?: AcademySettings (원장만)
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, academyId, role } = getCurrentUser()

    // Mock 데이터로 설정 조회 (실제로는 Supabase에서 조회)
    const profileData: ProfileSettings = {
      id: userId,
      name: '박정훈',
      email: 'junghoon@academy.com',
      phone: '010-1234-5678',
      profileImage: null,
      updatedAt: new Date().toISOString(),
    }

    const notificationsData: NotificationSettings = {
      id: `notification-${userId}`,
      userId,
      channels: DEFAULT_NOTIFICATION_CHANNELS,
      types: DEFAULT_NOTIFICATION_TYPES,
      updatedAt: new Date().toISOString(),
    }

    const apiKeysData: ApiKeySettings = DEFAULT_API_KEY_SETTINGS

    const modelsData: ModelSettings = DEFAULT_MODEL_SETTINGS

    // 응답 데이터 구성
    const responseData: {
      profile: ProfileSettings
      notifications: NotificationSettings
      apiKeys: ApiKeySettings
      models: ModelSettings
      academy?: AcademySettings
    } = {
      profile: profileData,
      notifications: notificationsData,
      apiKeys: apiKeysData,
      models: modelsData,
    }

    // 원장인 경우 학원 설정 포함
    if (role === 'owner') {
      responseData.academy = {
        id: academyId,
        name: '성적향상 수학학원',
        address: '서울시 강남구 테헤란로 123',
        phone: '02-1234-5678',
        logoImage: null,
        businessNumber: '123-45-67890',
        operatingHours: [
          { dayOfWeek: 0, openTime: null, closeTime: null, isOpen: false },
          { dayOfWeek: 1, openTime: '09:00', closeTime: '22:00', isOpen: true },
          { dayOfWeek: 2, openTime: '09:00', closeTime: '22:00', isOpen: true },
          { dayOfWeek: 3, openTime: '09:00', closeTime: '22:00', isOpen: true },
          { dayOfWeek: 4, openTime: '09:00', closeTime: '22:00', isOpen: true },
          { dayOfWeek: 5, openTime: '09:00', closeTime: '22:00', isOpen: true },
          { dayOfWeek: 6, openTime: '10:00', closeTime: '18:00', isOpen: true },
        ],
        updatedAt: new Date().toISOString(),
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error('설정 조회 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: '설정을 불러오는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT: 설정 일괄 업데이트
 *
 * 프로필, 알림, API 키, 모델 설정을 한 번에 업데이트합니다.
 * 원장의 경우 학원 설정도 업데이트할 수 있습니다.
 *
 * Request Body:
 * {
 *   profile?: ProfileUpdateRequest,
 *   notifications?: NotificationUpdateRequest,
 *   apiKeys?: ApiKeyUpdateRequest,
 *   models?: ModelSettingsUpdateRequest,
 *   academy?: AcademyUpdateRequest (원장만)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     updated: string[] (업데이트된 설정 목록)
 *   }
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId, academyId, role } = getCurrentUser()
    const body = await request.json()

    const updatedSettings: string[] = []
    const errors: string[] = []

    // 프로필 업데이트
    if (body.profile) {
      try {
        // 실제로는 Supabase에 저장
        // 여기서는 Mock으로 성공 처리
        updatedSettings.push('profile')
      } catch (e) {
        errors.push('프로필 업데이트 실패')
      }
    }

    // 알림 설정 업데이트
    if (body.notifications) {
      try {
        updatedSettings.push('notifications')
      } catch (e) {
        errors.push('알림 설정 업데이트 실패')
      }
    }

    // API 키 업데이트 (원장만)
    if (body.apiKeys && role === 'owner') {
      try {
        updatedSettings.push('apiKeys')
      } catch (e) {
        errors.push('API 키 업데이트 실패')
      }
    }

    // 모델 설정 업데이트 (원장만)
    if (body.models && role === 'owner') {
      try {
        updatedSettings.push('models')
      } catch (e) {
        errors.push('모델 설정 업데이트 실패')
      }
    }

    // 학원 설정 업데이트 (원장만)
    if (body.academy && role === 'owner') {
      try {
        updatedSettings.push('academy')
      } catch (e) {
        errors.push('학원 설정 업데이트 실패')
      }
    }

    // 결과 반환
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: errors.join(', '),
        data: { updated: updatedSettings },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        updated: updatedSettings,
        message: `${updatedSettings.length}개의 설정이 업데이트되었습니다.`,
      },
    })
  } catch (error) {
    console.error('설정 업데이트 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: '설정을 업데이트하는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS: CORS 프리플라이트 처리
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
