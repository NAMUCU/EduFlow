/**
 * 인증 서비스 - Supabase Auth + profiles 테이블
 */
import { createServerSupabaseClient, supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Profile, ProfileRole } from '@/types/database'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: ProfileRole
  academyId: string | null
  phone: string | null
  avatarUrl: string | null
}

// Mock 사용자
const mockUsers: AuthUser[] = [
  { id: 'user-001', email: 'owner@test.com', name: '박원장', role: 'admin', academyId: 'academy-001', phone: '010-1234-5678', avatarUrl: null },
  { id: 'user-002', email: 'teacher@test.com', name: '김수학', role: 'teacher', academyId: 'academy-001', phone: '010-2345-6789', avatarUrl: null },
  { id: 'user-003', email: 'parent@test.com', name: '이학부모', role: 'parent', academyId: 'academy-001', phone: '010-3456-7890', avatarUrl: null },
  { id: 'user-004', email: 'student@test.com', name: '김민수', role: 'student', academyId: 'academy-001', phone: '010-4567-8901', avatarUrl: null },
]

let mockCurrentUser: AuthUser | null = mockUsers[0] // 개발모드 기본값

/**
 * 현재 로그인한 사용자 조회
 */
export async function getCurrentUser(): Promise<{ data: AuthUser | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { data: mockCurrentUser }
  }

  try {
    const supabaseClient = createServerSupabaseClient()
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()

    if (sessionError || !session?.user) {
      return { data: null }
    }

    const { data: profile, error: profileError } = await (supabaseClient
      .from('profiles') as any)
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return { data: null, error: profileError?.message }
    }

    return {
      data: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        academyId: profile.academy_id,
        phone: profile.phone,
        avatarUrl: profile.avatar_url,
      }
    }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : '조회 실패' }
  }
}

/**
 * 이메일/비밀번호로 로그인
 */
export async function signIn(email: string, password: string): Promise<{ data: AuthUser | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    const user = mockUsers.find(u => u.email === email)
    if (user) {
      mockCurrentUser = user
      return { data: user }
    }
    return { data: null, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { data: null, error: error.message }
    }

    return getCurrentUser()
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : '로그인 실패' }
  }
}

/**
 * 회원가입
 */
export async function signUp(params: { email: string; password: string; name: string; role?: ProfileRole; phone?: string }): Promise<{ data: AuthUser | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      email: params.email,
      name: params.name,
      role: params.role || 'student',
      academyId: null,
      phone: params.phone || null,
      avatarUrl: null,
    }
    mockUsers.push(newUser)
    mockCurrentUser = newUser
    return { data: newUser }
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          role: params.role || 'student',
        }
      }
    })

    if (error) {
      return { data: null, error: error.message }
    }

    // 프로필 업데이트 (phone 등)
    if (data.user && params.phone) {
      const supabaseClient = createServerSupabaseClient()
      await (supabaseClient.from('profiles') as any).update({ phone: params.phone }).eq('id', data.user.id)
    }

    return getCurrentUser()
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : '회원가입 실패' }
  }
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    mockCurrentUser = null
    return { success: true }
  }

  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '로그아웃 실패' }
  }
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true }
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '이메일 발송 실패' }
  }
}

/**
 * 비밀번호 변경
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true }
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '비밀번호 변경 실패' }
  }
}

/**
 * 프로필 업데이트
 */
export async function updateProfile(updates: { name?: string; phone?: string; avatarUrl?: string }): Promise<{ data: AuthUser | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    if (mockCurrentUser) {
      if (updates.name) mockCurrentUser.name = updates.name
      if (updates.phone) mockCurrentUser.phone = updates.phone
      if (updates.avatarUrl) mockCurrentUser.avatarUrl = updates.avatarUrl
    }
    return { data: mockCurrentUser }
  }

  try {
    const { data: currentUser } = await getCurrentUser()
    if (!currentUser) {
      return { data: null, error: '로그인이 필요합니다.' }
    }

    const supabaseClient = createServerSupabaseClient()
    const { error } = await (supabaseClient.from('profiles') as any)
      .update({
        name: updates.name,
        phone: updates.phone,
        avatar_url: updates.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentUser.id)

    if (error) {
      return { data: null, error: error.message }
    }

    return getCurrentUser()
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : '프로필 업데이트 실패' }
  }
}

/**
 * 개발모드 Mock 사용자 설정
 */
export function setMockUser(role: ProfileRole) {
  const user = mockUsers.find(u => u.role === role)
  if (user) mockCurrentUser = user
}

/**
 * 권한 체크
 */
export function hasRole(user: AuthUser | null, roles: ProfileRole[]): boolean {
  return user ? roles.includes(user.role) : false
}

export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, ['super_admin', 'admin'])
}

export function isTeacher(user: AuthUser | null): boolean {
  return hasRole(user, ['super_admin', 'admin', 'teacher'])
}

export function isParent(user: AuthUser | null): boolean {
  return hasRole(user, ['parent'])
}

export function isStudent(user: AuthUser | null): boolean {
  return hasRole(user, ['student'])
}
