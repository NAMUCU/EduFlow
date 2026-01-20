/**
 * 학원 설정 API (원장 전용)
 *
 * GET: 학원 설정 조회
 * PUT: 학원 설정 수정
 */

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type {
  AcademySettings,
  AcademyUpdateRequest,
  SettingsResponse,
  DEFAULT_OPERATING_HOURS,
} from '@/types/settings'

// Mock 데이터 파일 경로 (실제로는 Supabase 사용)
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'academy-settings.json')

interface AcademySettingsStore {
  version: string
  academies: Record<string, AcademySettings>
  lastModified: string
}

/**
 * 데이터 파일 읽기
 */
async function readAcademyData(): Promise<AcademySettingsStore> {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8')
    return JSON.parse(data) as AcademySettingsStore
  } catch {
    // 파일이 없으면 기본 데이터 반환
    const now = new Date().toISOString()
    const defaultStore: AcademySettingsStore = {
      version: '1.0.0',
      academies: {
        'mock-academy-1': {
          id: 'mock-academy-1',
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
async function writeAcademyData(store: AcademySettingsStore): Promise<void> {
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
 * 사용자 권한 검증 (원장인지 확인)
 * TODO: 실제로는 세션에서 사용자 정보를 확인
 */
function checkOwnerPermission(): { isOwner: boolean; userId: string; academyId: string } {
  // Mock: 항상 원장으로 가정
  return {
    isOwner: true,
    userId: 'mock-user-1',
    academyId: 'mock-academy-1',
  }
}

/**
 * GET: 학원 설정 조회
 *
 * 원장만 접근 가능합니다.
 * 현재 로그인한 사용자의 학원 설정을 반환합니다.
 */
export async function GET() {
  try {
    const { isOwner, academyId } = checkOwnerPermission()

    // 권한 검증
    if (!isOwner) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '학원 설정은 원장만 조회할 수 있습니다.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    const store = await readAcademyData()
    const academy = store.academies[academyId]

    if (!academy) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '학원 정보를 찾을 수 없습니다.',
          code: 'ACADEMY_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    return NextResponse.json<SettingsResponse<AcademySettings>>({
      success: true,
      data: academy,
    })
  } catch (error) {
    console.error('학원 설정 조회 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: '학원 설정을 불러오는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT: 학원 설정 수정
 *
 * 원장만 접근 가능합니다.
 *
 * Request Body: AcademyUpdateRequest
 * - name?: string (학원명)
 * - address?: string | null (주소)
 * - phone?: string | null (연락처)
 * - logoImage?: string | null (로고 이미지 URL)
 * - businessNumber?: string | null (사업자 등록번호)
 * - operatingHours?: OperatingHours[] (운영 시간)
 */
export async function PUT(request: NextRequest) {
  try {
    const { isOwner, academyId } = checkOwnerPermission()

    // 권한 검증
    if (!isOwner) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '학원 설정은 원장만 수정할 수 있습니다.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    const body: AcademyUpdateRequest = await request.json()

    // 입력값 검증
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '학원명은 비어있을 수 없습니다.',
          code: 'INVALID_NAME',
        },
        { status: 400 }
      )
    }

    if (body.phone !== undefined && body.phone !== null) {
      // 전화번호 형식 검증 (지역번호 포함)
      const phoneRegex = /^0[0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4}$/
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

    if (body.businessNumber !== undefined && body.businessNumber !== null) {
      // 사업자 등록번호 형식 검증 (10자리)
      const bizNumRegex = /^[0-9]{3}-?[0-9]{2}-?[0-9]{5}$/
      if (!bizNumRegex.test(body.businessNumber.replace(/-/g, ''))) {
        return NextResponse.json<SettingsResponse<null>>(
          {
            success: false,
            error: '올바른 사업자 등록번호 형식이 아닙니다.',
            code: 'INVALID_BUSINESS_NUMBER',
          },
          { status: 400 }
        )
      }
    }

    // 운영 시간 검증
    if (body.operatingHours) {
      if (!Array.isArray(body.operatingHours) || body.operatingHours.length !== 7) {
        return NextResponse.json<SettingsResponse<null>>(
          {
            success: false,
            error: '운영 시간은 7일치 정보가 필요합니다.',
            code: 'INVALID_OPERATING_HOURS',
          },
          { status: 400 }
        )
      }

      // 각 요일 정보 검증
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
      for (const hours of body.operatingHours) {
        if (hours.isOpen) {
          if (!hours.openTime || !hours.closeTime) {
            return NextResponse.json<SettingsResponse<null>>(
              {
                success: false,
                error: '영업일의 경우 오픈/마감 시간이 필요합니다.',
                code: 'INVALID_OPERATING_HOURS',
              },
              { status: 400 }
            )
          }

          if (!timeRegex.test(hours.openTime) || !timeRegex.test(hours.closeTime)) {
            return NextResponse.json<SettingsResponse<null>>(
              {
                success: false,
                error: '올바른 시간 형식이 아닙니다. (HH:MM)',
                code: 'INVALID_TIME_FORMAT',
              },
              { status: 400 }
            )
          }
        }
      }
    }

    const store = await readAcademyData()
    const academy = store.academies[academyId]

    if (!academy) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '학원 정보를 찾을 수 없습니다.',
          code: 'ACADEMY_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // 학원 설정 업데이트
    const updatedAcademy: AcademySettings = {
      ...academy,
      name: body.name?.trim() ?? academy.name,
      address: body.address !== undefined ? body.address : academy.address,
      phone: body.phone !== undefined ? body.phone : academy.phone,
      logoImage: body.logoImage !== undefined ? body.logoImage : academy.logoImage,
      businessNumber: body.businessNumber !== undefined ? body.businessNumber : academy.businessNumber,
      operatingHours: body.operatingHours ?? academy.operatingHours,
      updatedAt: new Date().toISOString(),
    }

    store.academies[academyId] = updatedAcademy
    await writeAcademyData(store)

    return NextResponse.json<SettingsResponse<AcademySettings>>({
      success: true,
      data: updatedAcademy,
    })
  } catch (error) {
    console.error('학원 설정 수정 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: '학원 설정을 수정하는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
