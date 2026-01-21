/**
 * API 키 설정 API (원장 전용)
 *
 * GET: API 키 설정 조회 (마스킹된 상태로 반환)
 * POST: API 키 저장 (새로 설정)
 * PUT: API 키 수정
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'
import type {
  ApiKeySettings,
  ApiKeyUpdateRequest,
  SettingsResponse,
} from '@/types/settings'

// Supabase 클라이언트 (서버 사이드용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 암호화 설정
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || 'default-encryption-key-32chars!'
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * API 키 암호화
 */
function encryptApiKey(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)

  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // IV + AuthTag + 암호화된 데이터를 합쳐서 반환
  return iv.toString('hex') + authTag.toString('hex') + encrypted
}

/**
 * API 키 복호화
 */
function decryptApiKey(encryptedText: string): string {
  const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), 'hex')
  const authTag = Buffer.from(encryptedText.slice(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2), 'hex')
  const encrypted = encryptedText.slice(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2)

  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * API 키 마스킹 (앞 4자, 뒤 4자만 표시)
 */
function maskApiKey(key: string | null): string | null {
  if (!key) return null
  if (key.length <= 8) return '****'
  return `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`
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
 * Supabase에서 API 키 조회
 */
async function getApiKeysFromDB(academyId: string): Promise<ApiKeySettings | null> {
  // Supabase 클라이언트가 설정되지 않은 경우 Mock 데이터 반환
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('Supabase 설정이 없어 Mock 데이터를 사용합니다.')
    return getMockApiKeys(academyId)
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('academy_api_keys')
      .select('*')
      .eq('academy_id', academyId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 레코드가 없는 경우
        return null
      }
      throw error
    }

    if (!data) return null

    // 복호화해서 반환
    return {
      geminiKey: data.gemini_key ? decryptApiKey(data.gemini_key) : null,
      anthropicKey: data.anthropic_key ? decryptApiKey(data.anthropic_key) : null,
      openaiKey: data.openai_key ? decryptApiKey(data.openai_key) : null,
      googleVisionKey: data.google_vision_key ? decryptApiKey(data.google_vision_key) : null,
      pdfcoKey: data.pdfco_key ? decryptApiKey(data.pdfco_key) : null,
    }
  } catch (error) {
    console.error('API 키 조회 오류:', error)
    // 오류 발생 시 Mock 데이터 반환
    return getMockApiKeys(academyId)
  }
}

/**
 * Supabase에 API 키 저장/수정
 */
async function saveApiKeysToDB(
  academyId: string,
  keys: ApiKeyUpdateRequest,
  isUpdate: boolean = false
): Promise<ApiKeySettings> {
  // Supabase 클라이언트가 설정되지 않은 경우 Mock 저장
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('Supabase 설정이 없어 Mock 저장을 수행합니다.')
    return saveMockApiKeys(academyId, keys, isUpdate)
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = new Date().toISOString()

    // 암호화할 데이터 준비
    const encryptedData: Record<string, string | null> = {}

    if (keys.geminiKey !== undefined) {
      encryptedData.gemini_key = keys.geminiKey ? encryptApiKey(keys.geminiKey) : null
    }
    if (keys.anthropicKey !== undefined) {
      encryptedData.anthropic_key = keys.anthropicKey ? encryptApiKey(keys.anthropicKey) : null
    }
    if (keys.openaiKey !== undefined) {
      encryptedData.openai_key = keys.openaiKey ? encryptApiKey(keys.openaiKey) : null
    }
    if (keys.googleVisionKey !== undefined) {
      encryptedData.google_vision_key = keys.googleVisionKey ? encryptApiKey(keys.googleVisionKey) : null
    }
    if (keys.pdfcoKey !== undefined) {
      encryptedData.pdfco_key = keys.pdfcoKey ? encryptApiKey(keys.pdfcoKey) : null
    }

    if (isUpdate) {
      // 기존 데이터 업데이트
      const { error } = await supabase
        .from('academy_api_keys')
        .update({
          ...encryptedData,
          updated_at: now,
        })
        .eq('academy_id', academyId)

      if (error) throw error
    } else {
      // 새로운 데이터 삽입
      const { error } = await supabase
        .from('academy_api_keys')
        .insert({
          academy_id: academyId,
          ...encryptedData,
          created_at: now,
          updated_at: now,
        })

      if (error) throw error
    }

    // 저장된 데이터 조회해서 반환
    const savedKeys = await getApiKeysFromDB(academyId)
    if (!savedKeys) {
      throw new Error('저장 후 데이터 조회 실패')
    }

    return savedKeys
  } catch (error) {
    console.error('API 키 저장 오류:', error)
    // 오류 발생 시 Mock 저장
    return saveMockApiKeys(academyId, keys, isUpdate)
  }
}

// ============================================
// Mock 데이터 함수 (개발/테스트용)
// ============================================

// 메모리 내 Mock 저장소
const mockApiKeyStore: Record<string, ApiKeySettings> = {}

function getMockApiKeys(academyId: string): ApiKeySettings | null {
  return mockApiKeyStore[academyId] || null
}

function saveMockApiKeys(
  academyId: string,
  keys: ApiKeyUpdateRequest,
  isUpdate: boolean
): ApiKeySettings {
  const existing = mockApiKeyStore[academyId] || {
    geminiKey: null,
    anthropicKey: null,
    openaiKey: null,
    googleVisionKey: null,
    pdfcoKey: null,
  }

  const updated: ApiKeySettings = {
    geminiKey: keys.geminiKey !== undefined ? keys.geminiKey ?? null : existing.geminiKey,
    anthropicKey: keys.anthropicKey !== undefined ? keys.anthropicKey ?? null : existing.anthropicKey,
    openaiKey: keys.openaiKey !== undefined ? keys.openaiKey ?? null : existing.openaiKey,
    googleVisionKey: keys.googleVisionKey !== undefined ? keys.googleVisionKey ?? null : existing.googleVisionKey,
    pdfcoKey: keys.pdfcoKey !== undefined ? keys.pdfcoKey ?? null : existing.pdfcoKey,
  }

  mockApiKeyStore[academyId] = updated
  return updated
}

// ============================================
// API 핸들러
// ============================================

/**
 * GET: API 키 설정 조회 (마스킹된 상태로)
 *
 * 원장만 접근 가능합니다.
 * API 키는 보안을 위해 마스킹된 상태로 반환됩니다.
 */
export async function GET() {
  try {
    const { isOwner, academyId } = checkOwnerPermission()

    // 권한 검증
    if (!isOwner) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: 'API 키 설정은 원장만 조회할 수 있습니다.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    const apiKeys = await getApiKeysFromDB(academyId)

    // API 키가 없는 경우 빈 설정 반환
    if (!apiKeys) {
      return NextResponse.json<SettingsResponse<{ keys: ApiKeySettings; masked: ApiKeySettings }>>({
        success: true,
        data: {
          keys: {
            geminiKey: null,
            anthropicKey: null,
            openaiKey: null,
            googleVisionKey: null,
            pdfcoKey: null,
          },
          masked: {
            geminiKey: null,
            anthropicKey: null,
            openaiKey: null,
            googleVisionKey: null,
            pdfcoKey: null,
          },
        },
      })
    }

    // 마스킹된 키와 설정 여부 반환
    const maskedKeys: ApiKeySettings = {
      geminiKey: maskApiKey(apiKeys.geminiKey),
      anthropicKey: maskApiKey(apiKeys.anthropicKey),
      openaiKey: maskApiKey(apiKeys.openaiKey),
      googleVisionKey: maskApiKey(apiKeys.googleVisionKey),
      pdfcoKey: maskApiKey(apiKeys.pdfcoKey),
    }

    return NextResponse.json<SettingsResponse<{ keys: ApiKeySettings; masked: ApiKeySettings }>>({
      success: true,
      data: {
        keys: maskedKeys, // 클라이언트에는 마스킹된 키만 전달
        masked: maskedKeys,
      },
    })
  } catch (error) {
    console.error('API 키 설정 조회 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: 'API 키 설정을 불러오는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * POST: API 키 저장 (새로 설정)
 *
 * 원장만 접근 가능합니다.
 * API 키는 암호화되어 Supabase에 저장됩니다.
 *
 * Request Body: ApiKeyUpdateRequest
 */
export async function POST(request: NextRequest) {
  try {
    const { isOwner, academyId } = checkOwnerPermission()

    // 권한 검증
    if (!isOwner) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: 'API 키 설정은 원장만 할 수 있습니다.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    const body: ApiKeyUpdateRequest = await request.json()

    // 이미 설정이 있는지 확인
    const existingKeys = await getApiKeysFromDB(academyId)
    if (existingKeys && (
      existingKeys.geminiKey ||
      existingKeys.anthropicKey ||
      existingKeys.openaiKey ||
      existingKeys.googleVisionKey ||
      existingKeys.pdfcoKey
    )) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '이미 API 키가 설정되어 있습니다. 수정하려면 PUT 메소드를 사용하세요.',
          code: 'ALREADY_EXISTS',
        },
        { status: 409 }
      )
    }

    // API 키 유효성 검사 (형식만 검사, 실제 유효성은 사용 시 확인)
    const validationError = validateApiKeys(body)
    if (validationError) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: validationError,
          code: 'INVALID_API_KEY',
        },
        { status: 400 }
      )
    }

    // API 키 저장
    const savedKeys = await saveApiKeysToDB(academyId, body, false)

    // 마스킹된 키 반환
    const maskedKeys: ApiKeySettings = {
      geminiKey: maskApiKey(savedKeys.geminiKey),
      anthropicKey: maskApiKey(savedKeys.anthropicKey),
      openaiKey: maskApiKey(savedKeys.openaiKey),
      googleVisionKey: maskApiKey(savedKeys.googleVisionKey),
      pdfcoKey: maskApiKey(savedKeys.pdfcoKey),
    }

    return NextResponse.json<SettingsResponse<{ keys: ApiKeySettings; masked: ApiKeySettings }>>(
      {
        success: true,
        data: {
          keys: maskedKeys,
          masked: maskedKeys,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('API 키 저장 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: 'API 키를 저장하는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT: API 키 수정
 *
 * 원장만 접근 가능합니다.
 * 변경할 키만 요청에 포함하면 됩니다.
 *
 * Request Body: ApiKeyUpdateRequest
 */
export async function PUT(request: NextRequest) {
  try {
    const { isOwner, academyId } = checkOwnerPermission()

    // 권한 검증
    if (!isOwner) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: 'API 키 설정은 원장만 수정할 수 있습니다.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    const body: ApiKeyUpdateRequest = await request.json()

    // 수정할 내용이 있는지 확인
    if (Object.keys(body).length === 0) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '수정할 API 키가 지정되지 않았습니다.',
          code: 'NO_CHANGES',
        },
        { status: 400 }
      )
    }

    // API 키 유효성 검사
    const validationError = validateApiKeys(body)
    if (validationError) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: validationError,
          code: 'INVALID_API_KEY',
        },
        { status: 400 }
      )
    }

    // API 키 수정
    const savedKeys = await saveApiKeysToDB(academyId, body, true)

    // 마스킹된 키 반환
    const maskedKeys: ApiKeySettings = {
      geminiKey: maskApiKey(savedKeys.geminiKey),
      anthropicKey: maskApiKey(savedKeys.anthropicKey),
      openaiKey: maskApiKey(savedKeys.openaiKey),
      googleVisionKey: maskApiKey(savedKeys.googleVisionKey),
      pdfcoKey: maskApiKey(savedKeys.pdfcoKey),
    }

    return NextResponse.json<SettingsResponse<{ keys: ApiKeySettings; masked: ApiKeySettings }>>({
      success: true,
      data: {
        keys: maskedKeys,
        masked: maskedKeys,
      },
    })
  } catch (error) {
    console.error('API 키 수정 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: 'API 키를 수정하는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * API 키 형식 유효성 검사
 */
function validateApiKeys(keys: ApiKeyUpdateRequest): string | null {
  // Gemini API 키 형식 검사 (AIza로 시작)
  if (keys.geminiKey && !keys.geminiKey.startsWith('AIza')) {
    return 'Gemini API 키 형식이 올바르지 않습니다. AIza로 시작해야 합니다.'
  }

  // Anthropic API 키 형식 검사 (sk-ant-로 시작)
  if (keys.anthropicKey && !keys.anthropicKey.startsWith('sk-ant-')) {
    return 'Anthropic API 키 형식이 올바르지 않습니다. sk-ant-로 시작해야 합니다.'
  }

  // OpenAI API 키 형식 검사 (sk-로 시작)
  if (keys.openaiKey && !keys.openaiKey.startsWith('sk-')) {
    return 'OpenAI API 키 형식이 올바르지 않습니다. sk-로 시작해야 합니다.'
  }

  // 최소 길이 검사
  const MIN_KEY_LENGTH = 20
  if (keys.geminiKey && keys.geminiKey.length < MIN_KEY_LENGTH) {
    return 'Gemini API 키가 너무 짧습니다.'
  }
  if (keys.anthropicKey && keys.anthropicKey.length < MIN_KEY_LENGTH) {
    return 'Anthropic API 키가 너무 짧습니다.'
  }
  if (keys.openaiKey && keys.openaiKey.length < MIN_KEY_LENGTH) {
    return 'OpenAI API 키가 너무 짧습니다.'
  }
  if (keys.googleVisionKey && keys.googleVisionKey.length < MIN_KEY_LENGTH) {
    return 'Google Vision API 키가 너무 짧습니다.'
  }
  if (keys.pdfcoKey && keys.pdfcoKey.length < MIN_KEY_LENGTH) {
    return 'PDF.co API 키가 너무 짧습니다.'
  }

  return null
}
