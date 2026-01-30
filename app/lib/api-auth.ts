/**
 * API 인증 유틸리티
 * API 라우트에서 사용하는 인증 체크
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import type { ProfileRole } from '@/types/database';

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: ProfileRole;
  academyId: string | null;
}

// 개발 모드 Mock 사용자
const DEV_MOCK_USER: ApiUser = {
  id: 'dev-user-001',
  email: 'dev@eduflow.dev',
  name: '개발자 (Mock)',
  role: 'admin',
  academyId: 'academy-001',
};

/**
 * API 요청에서 인증된 사용자 정보 추출
 */
export async function getApiUser(request: NextRequest): Promise<ApiUser | null> {
  // 개발 모드 또는 Supabase 미설정 시 Mock 사용자 반환
  if (process.env.NODE_ENV === 'development' && !isSupabaseConfigured()) {
    return DEV_MOCK_USER;
  }

  try {
    const supabase = createServerSupabaseClient();

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      // 프로필 조회
      const { data: profile } = await (supabase.from('profiles') as any)
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return null;
      }

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        academyId: profile.academy_id,
      };
    }

    // 쿠키 기반 세션 확인
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      academyId: profile.academy_id,
    };
  } catch (error) {
    console.error('API 인증 오류:', error);
    return null;
  }
}

/**
 * 인증 필수 API 래퍼
 */
export function withAuth<T>(
  handler: (request: NextRequest, user: ApiUser) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getApiUser(request);

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

/**
 * 역할 기반 인증 래퍼
 */
export function withRoles<T>(
  roles: ProfileRole[],
  handler: (request: NextRequest, user: ApiUser) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getApiUser(request);

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return handler(request, user);
  };
}

/**
 * 학원 접근 권한 체크
 * 사용자가 해당 학원에 접근할 수 있는지 확인
 */
export function canAccessAcademy(user: ApiUser, academyId: string): boolean {
  // Super Admin은 모든 학원 접근 가능
  if (user.role === 'super_admin') {
    return true;
  }

  // 본인 소속 학원만 접근 가능
  return user.academyId === academyId;
}

/**
 * 학원 접근 권한 체크가 포함된 래퍼
 */
export function withAcademyAccess<T>(
  getAcademyId: (request: NextRequest) => string | null,
  handler: (request: NextRequest, user: ApiUser) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getApiUser(request);

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const academyId = getAcademyId(request);
    if (academyId && !canAccessAcademy(user, academyId)) {
      return NextResponse.json(
        { error: '해당 학원에 대한 접근 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return handler(request, user);
  };
}
