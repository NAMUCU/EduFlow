/**
 * 프로필 설정 API
 *
 * GET: 현재 사용자의 프로필 조회
 * PUT: 프로필 정보 수정
 */

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type {
  ProfileSettings,
  ProfileUpdateRequest,
  SettingsResponse,
} from '@/types/settings'

// Mock 데이터 파일 경로 (실제로는 Supabase 사용)
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'user-settings.json')

interface UserSettingsStore {
  version: string
  profiles: Record<string, ProfileSettings>
  lastModified: string
}

/**
 * 데이터 파일 읽기
 */
async function readSettingsData(): Promise<UserSettingsStore> {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8')
    return JSON.parse(data) as UserSettingsStore
  } catch {
    // 파일이 없으면 기본 데이터 반환
    const defaultStore: UserSettingsStore = {
      version: '1.0.0',
      profiles: {
        'mock-user-1': {
          id: 'mock-user-1',
          name: '박정훈',
          email: 'junghoon@academy.com',
          phone: '010-1234-5678',
          profileImage: null,
          updatedAt: new Date().toISOString(),
        },
      },
      lastModified: new Date().toISOString(),
    }
    return defaultStore
  }
}

/**
 * 데이터 파일 쓰기
 */
async function writeSettingsData(store: UserSettingsStore): Promise<void> {
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
 * GET: 프로필 조회
 *
 * 현재 로그인한 사용자의 프로필 정보를 반환합니다.
 * TODO: 실제로는 세션에서 사용자 ID를 가져와야 합니다.
 */
export async function GET() {
  try {
    // TODO: 세션에서 사용자 ID 가져오기
    const userId = 'mock-user-1'

    const store = await readSettingsData()
    const profile = store.profiles[userId]

    if (!profile) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '프로필을 찾을 수 없습니다.',
          code: 'PROFILE_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    return NextResponse.json<SettingsResponse<ProfileSettings>>({
      success: true,
      data: profile,
    })
  } catch (error) {
    console.error('프로필 조회 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: '프로필을 불러오는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT: 프로필 수정
 *
 * Request Body: ProfileUpdateRequest
 * - name?: string (이름)
 * - phone?: string | null (전화번호)
 * - profileImage?: string | null (프로필 이미지 URL)
 */
export async function PUT(request: NextRequest) {
  try {
    // TODO: 세션에서 사용자 ID 가져오기
    const userId = 'mock-user-1'

    const body: ProfileUpdateRequest = await request.json()

    // 입력값 검증
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '이름은 비어있을 수 없습니다.',
          code: 'INVALID_NAME',
        },
        { status: 400 }
      )
    }

    if (body.phone !== undefined && body.phone !== null) {
      // 전화번호 형식 검증 (한국 전화번호)
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
      if (!phoneRegex.test(body.phone.replace(/-/g, ''))) {
        return NextResponse.json<SettingsResponse<null>>(
          {
            success: false,
            error: '올바른 전화번호 형식이 아닙니다.',
            code: 'INVALID_PHONE',
          },
          { status: 400 }
        )
      }
    }

    const store = await readSettingsData()
    const profile = store.profiles[userId]

    if (!profile) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '프로필을 찾을 수 없습니다.',
          code: 'PROFILE_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // 프로필 업데이트
    const updatedProfile: ProfileSettings = {
      ...profile,
      name: body.name?.trim() ?? profile.name,
      phone: body.phone !== undefined ? body.phone : profile.phone,
      profileImage: body.profileImage !== undefined ? body.profileImage : profile.profileImage,
      updatedAt: new Date().toISOString(),
    }

    store.profiles[userId] = updatedProfile
    await writeSettingsData(store)

    return NextResponse.json<SettingsResponse<ProfileSettings>>({
      success: true,
      data: updatedProfile,
    })
  } catch (error) {
    console.error('프로필 수정 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: '프로필을 수정하는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
