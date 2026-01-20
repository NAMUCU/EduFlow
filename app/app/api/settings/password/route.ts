/**
 * 비밀번호 변경 API
 *
 * PUT: 비밀번호 변경
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  PasswordChangeRequest,
  PasswordChangeResponse,
  SettingsResponse,
} from '@/types/settings'

/**
 * PUT: 비밀번호 변경
 *
 * Request Body: PasswordChangeRequest
 * - currentPassword: string (현재 비밀번호)
 * - newPassword: string (새 비밀번호)
 * - confirmPassword: string (새 비밀번호 확인)
 *
 * 비밀번호 규칙:
 * - 최소 8자 이상
 * - 영문, 숫자 포함
 * - 특수문자 1개 이상 권장
 */
export async function PUT(request: NextRequest) {
  try {
    const body: PasswordChangeRequest = await request.json()

    // 필수 필드 검증
    if (!body.currentPassword || !body.newPassword || !body.confirmPassword) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '모든 필드를 입력해주세요.',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      )
    }

    // 새 비밀번호와 확인 일치 여부
    if (body.newPassword !== body.confirmPassword) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '새 비밀번호가 일치하지 않습니다.',
          code: 'PASSWORD_MISMATCH',
        },
        { status: 400 }
      )
    }

    // 비밀번호 규칙 검증
    const passwordMinLength = 8
    const hasLetter = /[a-zA-Z]/.test(body.newPassword)
    const hasNumber = /[0-9]/.test(body.newPassword)

    if (body.newPassword.length < passwordMinLength) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: `비밀번호는 최소 ${passwordMinLength}자 이상이어야 합니다.`,
          code: 'PASSWORD_TOO_SHORT',
        },
        { status: 400 }
      )
    }

    if (!hasLetter || !hasNumber) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '비밀번호는 영문과 숫자를 모두 포함해야 합니다.',
          code: 'PASSWORD_WEAK',
        },
        { status: 400 }
      )
    }

    // 현재 비밀번호와 새 비밀번호가 같은 경우
    if (body.currentPassword === body.newPassword) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '현재 비밀번호와 다른 비밀번호를 입력해주세요.',
          code: 'SAME_PASSWORD',
        },
        { status: 400 }
      )
    }

    // TODO: 실제로는 Supabase Auth를 통해 비밀번호 변경
    // const supabase = createServerSupabaseClient()
    // const { error } = await supabase.auth.updateUser({
    //   password: body.newPassword
    // })

    // Mock: 현재 비밀번호 검증 (실제로는 Supabase Auth에서 처리)
    // 테스트용으로 현재 비밀번호가 'password123'이면 성공
    const mockCurrentPassword = 'password123'
    if (body.currentPassword !== mockCurrentPassword) {
      return NextResponse.json<SettingsResponse<null>>(
        {
          success: false,
          error: '현재 비밀번호가 올바르지 않습니다.',
          code: 'INVALID_CURRENT_PASSWORD',
        },
        { status: 401 }
      )
    }

    const response: PasswordChangeResponse = {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    }

    return NextResponse.json<SettingsResponse<PasswordChangeResponse>>({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('비밀번호 변경 오류:', error)
    return NextResponse.json<SettingsResponse<null>>(
      {
        success: false,
        error: '비밀번호를 변경하는 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
