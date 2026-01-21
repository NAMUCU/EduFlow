/**
 * 모델 설정 API (원장 전용)
 *
 * GET: 학원의 모델 설정 조회
 * PUT: 모델 설정 수정 (chatModel, visionModel)
 */

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type {
  ModelSettings,
  ModelSettingsUpdateRequest,
  SettingsResponse,
  ChatModel,
  VisionModel,
} from '@/types/settings'
import { DEFAULT_MODEL_SETTINGS } from '@/types/settings'

// Mock 데이터 파일 경로 (실제로는 Supabase 사용)
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'model-settings.json')

interface ModelSettingsStore {
  version: string
  academies: Record<string, ModelSettings & { academyId: string; updatedAt: string }>
  lastModified: string
}

/** 유효한 채팅 모델 목록 */
const VALID_CHAT_MODELS: ChatModel[] = [
  'gemini-2.0-flash',
  'gemini-2.0-pro',
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3-5-sonnet',
  'claude-3-opus',
]

/** 유효한 비전 모델 목록 */
const VALID_VISION_MODELS: VisionModel[] = [
  'gemini-2.0-flash',
  'gemini-2.0-pro',
  'gpt-4o',
  'claude-3-5-sonnet',
]

/** 유효한 임베딩 모델 목록 */
const VALID_EMBEDDING_MODELS = ['text-embedding-3-small', 'text-embedding-3-large'] as const

/**
 * 데이터 파일 읽기
 */
async function readModelData(): Promise<ModelSettingsStore> {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8')
    return JSON.parse(data) as ModelSettingsStore
  } catch {
    // 파일이 없으면 기본 데이터 반환
    const now = new Date().toISOString()
    const defaultStore: ModelSettingsStore = {
      version: '1.0.0',
      academies: {
        'mock-academy-1': {
          academyId: 'mock-academy-1',
          ...DEFAULT_MODEL_SETTINGS,
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
async function writeModelData(store: ModelSettingsStore): Promise<void> {
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
 * GET: 모델 설정 조회
 *
 * 원장만 접근 가능합니다.
 * 현재 로그인한 사용자의 학원 모델 설정을 반환합니다.
 */
export async function GET() {
  try {
    const { isOwner, academyId } = checkOwnerPermission()

    // 권한 검증
    if (!isOwner) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '모델 설정은 원장만 조회할 수 있습니다.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    const store = await readModelData()
    const settings = store.academies[academyId]

    if (!settings) {
      // 설정이 없으면 기본값 반환
      const defaultSettings: ModelSettings = {
        ...DEFAULT_MODEL_SETTINGS,
      }
      return NextResponse.json<SettingsResponse<ModelSettings>>({
        success: true,
        data: defaultSettings,
      })
    }

    // academyId와 updatedAt을 제외한 ModelSettings만 반환
    const modelSettings: ModelSettings = {
      chatModel: settings.chatModel,
      visionModel: settings.visionModel,
      embeddingModel: settings.embeddingModel,
    }

    return NextResponse.json<SettingsResponse<ModelSettings>>({
      success: true,
      data: modelSettings,
    })
  } catch (error) {
    console.error('모델 설정 조회 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: '모델 설정을 불러오는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT: 모델 설정 수정
 *
 * 원장만 접근 가능합니다.
 *
 * Request Body: ModelSettingsUpdateRequest
 * - chatModel?: ChatModel (기본 채팅/생성 모델)
 * - visionModel?: VisionModel (비전/이미지 분석 모델)
 * - embeddingModel?: 'text-embedding-3-small' | 'text-embedding-3-large' (임베딩 모델)
 */
export async function PUT(request: NextRequest) {
  try {
    const { isOwner, academyId } = checkOwnerPermission()

    // 권한 검증
    if (!isOwner) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '모델 설정은 원장만 수정할 수 있습니다.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    const body: ModelSettingsUpdateRequest = await request.json()

    // chatModel 검증
    if (body.chatModel !== undefined) {
      if (!VALID_CHAT_MODELS.includes(body.chatModel)) {
        return NextResponse.json<SettingsResponse<null>>(
          {
            success: false,
            error: `유효하지 않은 채팅 모델입니다. 가능한 값: ${VALID_CHAT_MODELS.join(', ')}`,
            code: 'INVALID_CHAT_MODEL',
          },
          { status: 400 }
        )
      }
    }

    // visionModel 검증
    if (body.visionModel !== undefined) {
      if (!VALID_VISION_MODELS.includes(body.visionModel)) {
        return NextResponse.json<SettingsResponse<null>>(
          {
            success: false,
            error: `유효하지 않은 비전 모델입니다. 가능한 값: ${VALID_VISION_MODELS.join(', ')}`,
            code: 'INVALID_VISION_MODEL',
          },
          { status: 400 }
        )
      }
    }

    // embeddingModel 검증
    if (body.embeddingModel !== undefined) {
      if (!VALID_EMBEDDING_MODELS.includes(body.embeddingModel)) {
        return NextResponse.json<SettingsResponse<null>>(
          {
            success: false,
            error: `유효하지 않은 임베딩 모델입니다. 가능한 값: ${VALID_EMBEDDING_MODELS.join(', ')}`,
            code: 'INVALID_EMBEDDING_MODEL',
          },
          { status: 400 }
        )
      }
    }

    const store = await readModelData()
    const existingSettings = store.academies[academyId]

    // 기존 설정이 없으면 기본값 사용
    const currentSettings = existingSettings || {
      academyId,
      ...DEFAULT_MODEL_SETTINGS,
      updatedAt: new Date().toISOString(),
    }

    // 설정 업데이트
    const updatedSettings = {
      ...currentSettings,
      chatModel: body.chatModel ?? currentSettings.chatModel,
      visionModel: body.visionModel ?? currentSettings.visionModel,
      embeddingModel: body.embeddingModel ?? currentSettings.embeddingModel,
      updatedAt: new Date().toISOString(),
    }

    store.academies[academyId] = updatedSettings
    await writeModelData(store)

    // 응답용 ModelSettings (academyId, updatedAt 제외)
    const responseSettings: ModelSettings = {
      chatModel: updatedSettings.chatModel,
      visionModel: updatedSettings.visionModel,
      embeddingModel: updatedSettings.embeddingModel,
    }

    return NextResponse.json<SettingsResponse<ModelSettings>>({
      success: true,
      data: responseSettings,
    })
  } catch (error) {
    console.error('모델 설정 수정 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: '모델 설정을 수정하는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
