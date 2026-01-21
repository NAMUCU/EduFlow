/**
 * 알림 설정 API
 *
 * GET: 알림 설정 조회
 * PUT: 알림 설정 수정
 *
 * 기능:
 * - 알림 채널 설정 (이메일, SMS, 푸시, 카카오톡)
 * - 알림 유형별 On/Off
 * - 알림 수신 시간대 설정
 */

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type {
  NotificationSettings,
  NotificationUpdateRequest,
  SettingsResponse,
} from '@/types/settings'

// Mock 데이터 파일 경로 (실제로는 Supabase 사용)
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'notification-settings.json')

/** 확장된 알림 채널 (카카오톡 포함) */
interface ExtendedNotificationChannels {
  email: boolean
  sms: boolean
  push: boolean
  kakao: boolean
}

/** 알림 시간 설정 */
interface NotificationTimeSettings {
  enabled: boolean
  startTime: string
  endTime: string
  timezone: string
}

/** 확장된 알림 설정 */
interface ExtendedNotificationSettings extends Omit<NotificationSettings, 'channels'> {
  channels: ExtendedNotificationChannels
  timeSettings?: NotificationTimeSettings
}

interface NotificationSettingsStore {
  version: string
  settings: Record<string, ExtendedNotificationSettings>
  lastModified: string
}

/** 기본 시간 설정 */
const DEFAULT_TIME_SETTINGS: NotificationTimeSettings = {
  enabled: false,
  startTime: '09:00',
  endTime: '21:00',
  timezone: 'Asia/Seoul',
}

/**
 * 데이터 파일 읽기
 */
async function readNotificationData(): Promise<NotificationSettingsStore> {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8')
    return JSON.parse(data) as NotificationSettingsStore
  } catch {
    // 파일이 없으면 기본 데이터 반환
    const now = new Date().toISOString()
    const defaultStore: NotificationSettingsStore = {
      version: '1.0.0',
      settings: {
        'mock-user-1': {
          id: 'notification-settings-1',
          userId: 'mock-user-1',
          channels: {
            email: true,
            sms: true,
            push: false,
            kakao: true,
          },
          types: {
            reportReminder: true,
            assignmentReminder: true,
            gradeUpdate: true,
            consultationReminder: true,
            systemNotice: true,
          },
          timeSettings: DEFAULT_TIME_SETTINGS,
          updatedAt: now,
        },
      },
      lastModified: now,
    }
    return defaultStore
  }
}

/**
 * 데이터 파일 쓰기
 */
async function writeNotificationData(store: NotificationSettingsStore): Promise<void> {
  store.lastModified = new Date().toISOString()

  // data 폴더가 없으면 생성
  const dataDir = path.dirname(DATA_FILE_PATH)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }

  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8')
}

/**
 * GET: 알림 설정 조회
 *
 * 현재 로그인한 사용자의 알림 설정을 반환합니다.
 */
export async function GET() {
  try {
    // TODO: 세션에서 사용자 ID 가져오기
    const userId = 'mock-user-1'

    const store = await readNotificationData()
    let settings = store.settings[userId]

    // 설정이 없으면 기본값 생성
    if (!settings) {
      const now = new Date().toISOString()
      settings = {
        id: `notification-settings-${Date.now()}`,
        userId,
        channels: {
          email: true,
          sms: true,
          push: false,
          kakao: true,
        },
        types: {
          reportReminder: true,
          assignmentReminder: true,
          gradeUpdate: true,
          consultationReminder: true,
          systemNotice: true,
        },
        timeSettings: DEFAULT_TIME_SETTINGS,
        updatedAt: now,
      }
      store.settings[userId] = settings
      await writeNotificationData(store)
    }

    return NextResponse.json<SettingsResponse<ExtendedNotificationSettings>>({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('알림 설정 조회 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: '알림 설정을 불러오는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT: 알림 설정 수정
 *
 * Request Body:
 * - channels?: Partial<ExtendedNotificationChannels>
 *   - email?: boolean
 *   - sms?: boolean
 *   - push?: boolean
 *   - kakao?: boolean
 * - types?: Partial<NotificationTypes>
 *   - reportReminder?: boolean
 *   - assignmentReminder?: boolean
 *   - gradeUpdate?: boolean
 *   - consultationReminder?: boolean
 *   - systemNotice?: boolean
 * - timeSettings?: Partial<NotificationTimeSettings>
 *   - enabled?: boolean
 *   - startTime?: string (HH:mm)
 *   - endTime?: string (HH:mm)
 *   - timezone?: string
 */
export async function PUT(request: NextRequest) {
  try {
    // TODO: 세션에서 사용자 ID 가져오기
    const userId = 'mock-user-1'

    const body = await request.json() as {
      channels?: Partial<ExtendedNotificationChannels>
      types?: Partial<NotificationSettings['types']>
      timeSettings?: Partial<NotificationTimeSettings>
    }

    // 업데이트할 내용이 없는 경우
    if (!body.channels && !body.types && !body.timeSettings) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '변경할 설정이 없습니다.',
          code: 'NO_CHANGES',
        },
        { status: 400 }
      )
    }

    // 시간 설정 유효성 검사
    if (body.timeSettings?.enabled) {
      const startTime = body.timeSettings.startTime
      const endTime = body.timeSettings.endTime

      if (startTime && endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number)
        const [endHour, endMin] = endTime.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin

        if (startMinutes >= endMinutes) {
          return NextResponse.json<SettingsResponse<null>>(
            {
              success: false,
              error: '알림 시작 시간은 종료 시간보다 이전이어야 합니다.',
              code: 'INVALID_TIME_RANGE',
            },
            { status: 400 }
          )
        }
      }
    }

    const store = await readNotificationData()
    let settings = store.settings[userId]

    // 설정이 없으면 기본값으로 생성
    if (!settings) {
      const now = new Date().toISOString()
      settings = {
        id: `notification-settings-${Date.now()}`,
        userId,
        channels: {
          email: true,
          sms: true,
          push: false,
          kakao: true,
        },
        types: {
          reportReminder: true,
          assignmentReminder: true,
          gradeUpdate: true,
          consultationReminder: true,
          systemNotice: true,
        },
        timeSettings: DEFAULT_TIME_SETTINGS,
        updatedAt: now,
      }
    }

    // 채널 설정 업데이트
    if (body.channels) {
      settings.channels = {
        ...settings.channels,
        ...body.channels,
      }
    }

    // 알림 종류 설정 업데이트
    if (body.types) {
      settings.types = {
        ...settings.types,
        ...body.types,
      }
    }

    // 시간 설정 업데이트
    if (body.timeSettings) {
      settings.timeSettings = {
        ...(settings.timeSettings || DEFAULT_TIME_SETTINGS),
        ...body.timeSettings,
      }
    }

    settings.updatedAt = new Date().toISOString()
    store.settings[userId] = settings
    await writeNotificationData(store)

    return NextResponse.json<SettingsResponse<ExtendedNotificationSettings>>({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('알림 설정 수정 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: '알림 설정을 수정하는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
