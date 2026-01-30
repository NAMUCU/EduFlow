/**
 * EduFlow 미들웨어
 *
 * Next.js 14의 미들웨어를 사용한 역할별 라우팅 제어입니다.
 * 모든 요청에 대해 인증 상태와 역할을 확인하고 적절히 리다이렉트합니다.
 *
 * 주요 기능:
 * - 인증 체크 (로그인 여부)
 * - 역할별 접근 제어:
 *   - /admin/* -> 관리자만
 *   - /dashboard/* -> 선생님만
 *   - /student/* -> 학생만
 *   - /parent/* -> 학부모만
 * - 미인증 시 /login으로 리다이렉트
 * - 권한 없는 접근 시 해당 역할 대시보드로 리다이렉트
 *
 * 참고: 미들웨어는 Edge Runtime에서 실행되어 React Context를 사용할 수 없습니다.
 * 따라서 쿠키/토큰 기반으로 인증을 확인합니다.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 사용자 역할 타입
type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

// 인증 정보 타입 (쿠키에서 파싱)
interface AuthInfo {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  } | null;
}

// 역할별 기본 경로
const ROLE_DEFAULT_PATHS: Record<UserRole, string> = {
  admin: '/admin',
  teacher: '/dashboard',
  student: '/student',
  parent: '/parent',
};

// 공개 경로 (인증 불필요)
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

// API 및 정적 파일 경로 (미들웨어 스킵)
const SKIP_PATHS = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
];

/**
 * 경로가 공개 경로인지 확인
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );
}

/**
 * 미들웨어를 스킵해야 하는 경로인지 확인
 */
function shouldSkipMiddleware(pathname: string): boolean {
  return SKIP_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * 경로에서 필요한 역할 추출
 */
function getRequiredRole(pathname: string): UserRole | null {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/dashboard')) return 'teacher';
  if (pathname.startsWith('/student')) return 'student';
  if (pathname.startsWith('/parent')) return 'parent';
  return null;
}

/**
 * 개발 모드 Mock 사용자
 * Supabase 연동 전까지 개발용으로 사용
 */
const DEV_MOCK_USERS: Record<string, AuthInfo['user']> = {
  teacher: {
    id: 'dev-teacher-001',
    email: 'teacher@eduflow.dev',
    name: '김선생 (개발모드)',
    role: 'teacher',
  },
  admin: {
    id: 'dev-admin-001',
    email: 'admin@eduflow.dev',
    name: '관리자 (개발모드)',
    role: 'admin',
  },
  student: {
    id: 'dev-student-001',
    email: 'student@eduflow.dev',
    name: '학생 (개발모드)',
    role: 'student',
  },
  parent: {
    id: 'dev-parent-001',
    email: 'parent@eduflow.dev',
    name: '학부모 (개발모드)',
    role: 'parent',
  },
};

/**
 * 쿠키에서 인증 정보 추출
 *
 * 현재는 로컬 스토리지 기반 Mock 인증이므로
 * 클라이언트에서 설정한 쿠키를 사용합니다.
 *
 * TODO: Supabase Auth 연동 시 supabase.auth.getSession() 사용
 */
function getAuthFromCookie(request: NextRequest): AuthInfo {
  try {
    // 'eduflow_auth_cookie' 쿠키에서 인증 정보 추출
    const authCookie = request.cookies.get('eduflow_auth_cookie');
    if (!authCookie?.value) {
      return { user: null };
    }

    const decoded = decodeURIComponent(authCookie.value);
    const parsed = JSON.parse(decoded);
    return { user: parsed.user || null };
  } catch (error) {
    console.error('인증 쿠키 파싱 실패:', error);
    return { user: null };
  }
}

/**
 * 미들웨어 함수
 *
 * 모든 요청에 대해 실행되어 인증/권한을 확인합니다.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. API 및 정적 파일 경로는 스킵
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  // 2. 인증 정보 확인
  const { user } = getAuthFromCookie(request);
  const isAuthenticated = !!user;
  const userRole = user?.role || null;

  // 3. 공개 경로 처리
  if (isPublicPath(pathname)) {
    // 이미 로그인한 사용자가 로그인/회원가입 페이지 접근 시
    // 해당 역할의 기본 페이지로 리다이렉트
    if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
      const redirectPath = ROLE_DEFAULT_PATHS[userRole as UserRole];
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return NextResponse.next();
  }

  // 4. 보호된 경로 - 미인증 시 로그인 페이지로
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // 로그인 후 원래 페이지로 돌아갈 수 있도록 returnUrl 파라미터 추가
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. 역할별 접근 권한 체크
  const requiredRole = getRequiredRole(pathname);

  if (requiredRole && requiredRole !== userRole) {
    // 권한이 없는 경우 해당 역할의 기본 페이지로 리다이렉트
    console.log(
      `[미들웨어] 권한 없음: ${userRole} 사용자가 ${requiredRole} 페이지(${pathname})에 접근 시도`
    );
    const redirectPath = ROLE_DEFAULT_PATHS[userRole as UserRole];
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // 6. 접근 허용
  return NextResponse.next();
}

/**
 * 미들웨어가 적용될 경로 설정
 *
 * matcher를 사용하여 특정 경로에만 미들웨어 적용
 * API 경로와 정적 파일은 제외
 */
export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 미들웨어 적용:
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
