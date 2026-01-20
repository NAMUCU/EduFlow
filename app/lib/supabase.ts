/**
 * Supabase 클라이언트 설정
 *
 * 이 파일은 Supabase 데이터베이스에 연결하기 위한 클라이언트를 생성합니다.
 * - 브라우저(클라이언트) 컴포넌트용 클라이언트
 * - 서버 컴포넌트/API 라우트용 클라이언트
 * 두 가지를 각각 제공합니다.
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// 환경 변수에서 Supabase 연결 정보를 가져옵니다
// NEXT_PUBLIC_ 접두사가 붙은 환경변수는 브라우저에서도 접근 가능합니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * 브라우저(클라이언트) 컴포넌트용 Supabase 클라이언트
 *
 * 사용 시점:
 * - 'use client' 지시어가 있는 컴포넌트에서 사용
 * - 브라우저에서 실행되는 코드에서 사용
 *
 * 예시:
 * import { supabase } from '@/lib/supabase'
 * const { data } = await supabase.from('users').select('*')
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

/**
 * 서버 컴포넌트/API 라우트용 Supabase 클라이언트 생성 함수
 *
 * 매번 새로운 클라이언트를 생성하는 이유:
 * - 서버에서는 각 요청마다 독립적인 클라이언트가 필요합니다
 * - 인증 상태가 요청 간에 공유되지 않도록 합니다
 *
 * 사용 시점:
 * - 서버 컴포넌트에서 사용
 * - API 라우트(route.ts)에서 사용
 * - 서버 액션에서 사용
 *
 * 예시:
 * import { createServerSupabaseClient } from '@/lib/supabase'
 * const supabase = createServerSupabaseClient()
 * const { data } = await supabase.from('users').select('*')
 */
export function createServerSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      // 서버에서는 세션을 자동으로 저장하지 않습니다
      persistSession: false,
      // 서버에서는 세션을 자동으로 감지하지 않습니다
      autoRefreshToken: false,
      // 서버에서는 URL에서 세션을 감지하지 않습니다
      detectSessionInUrl: false,
    },
  })
}

/**
 * 서비스 역할 키를 사용하는 관리자용 클라이언트
 *
 * 주의: 이 클라이언트는 모든 Row Level Security(RLS)를 우회합니다.
 * 관리 작업이나 서버 사이드에서만 사용해야 합니다.
 *
 * 환경변수 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.
 * (이 키는 절대 클라이언트에 노출되면 안 됩니다!)
 */
export function createAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
