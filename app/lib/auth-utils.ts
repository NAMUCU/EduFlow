/**
 * EduFlow 인증 유틸리티 함수
 *
 * 역할별 라우팅과 접근 권한 체크에 사용되는 유틸리티 함수들입니다.
 * 미들웨어와 클라이언트 컴포넌트 모두에서 사용할 수 있습니다.
 */

import { UserRole, RoleRouteMap } from '@/types/auth';

// 역할별 라우트 설정
// 각 역할이 접근할 수 있는 경로와 기본 리다이렉트 경로를 정의합니다.
export const ROLE_ROUTES: RoleRouteMap = {
  admin: {
    defaultPath: '/admin',
    allowedPaths: ['/admin', '/admin/*'],
  },
  teacher: {
    defaultPath: '/dashboard',
    allowedPaths: ['/dashboard', '/dashboard/*'],
  },
  student: {
    defaultPath: '/student',
    allowedPaths: ['/student', '/student/*'],
  },
  parent: {
    defaultPath: '/parent',
    allowedPaths: ['/parent', '/parent/*'],
  },
};

// 인증이 필요 없는 공개 경로
export const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/api/auth/*',
];

/**
 * 역할별 기본 경로 반환
 *
 * @param role - 사용자 역할
 * @returns 해당 역할의 기본 대시보드 경로
 *
 * @example
 * getRoleDefaultPath('teacher') // '/dashboard'
 * getRoleDefaultPath('student') // '/student'
 */
export function getRoleDefaultPath(role: UserRole): string {
  return ROLE_ROUTES[role]?.defaultPath || '/';
}

/**
 * 경로 패턴 매칭 함수
 * 와일드카드(*)를 지원하는 경로 패턴 매칭
 *
 * @param pattern - 경로 패턴 (예: '/dashboard/*')
 * @param path - 실제 경로 (예: '/dashboard/students')
 * @returns 매칭 여부
 */
function matchPath(pattern: string, path: string): boolean {
  // 정확히 일치하는 경우
  if (pattern === path) return true;

  // 와일드카드 패턴 처리 (예: '/dashboard/*')
  if (pattern.endsWith('/*')) {
    const basePath = pattern.slice(0, -2); // '/*' 제거
    return path === basePath || path.startsWith(basePath + '/');
  }

  return false;
}

/**
 * 공개 경로 여부 확인
 *
 * @param path - 확인할 경로
 * @returns 공개 경로 여부
 */
export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((pattern) => matchPath(pattern, path));
}

/**
 * 역할별 접근 권한 체크
 *
 * 특정 역할이 주어진 경로에 접근할 수 있는지 확인합니다.
 *
 * @param role - 사용자 역할
 * @param path - 확인할 경로
 * @returns 접근 가능 여부
 *
 * @example
 * checkRoleAccess('teacher', '/dashboard/students') // true
 * checkRoleAccess('student', '/dashboard/students') // false
 */
export function checkRoleAccess(role: UserRole, path: string): boolean {
  // 공개 경로는 모든 역할이 접근 가능
  if (isPublicPath(path)) return true;

  // 역할별 허용 경로 확인
  const roleConfig = ROLE_ROUTES[role];
  if (!roleConfig) return false;

  return roleConfig.allowedPaths.some((pattern) => matchPath(pattern, path));
}

/**
 * 경로에서 역할 추출
 *
 * 경로의 첫 번째 세그먼트를 기반으로 필요한 역할을 추출합니다.
 *
 * @param path - 확인할 경로
 * @returns 필요한 역할 또는 null (공개 경로인 경우)
 *
 * @example
 * getRequiredRole('/admin/users') // 'admin'
 * getRequiredRole('/dashboard') // 'teacher'
 */
export function getRequiredRole(path: string): UserRole | null {
  // 공개 경로는 역할이 필요 없음
  if (isPublicPath(path)) return null;

  // 경로의 첫 번째 세그먼트 추출
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const firstSegment = segments[0];

  // 세그먼트별 역할 매핑
  const pathRoleMap: Record<string, UserRole> = {
    admin: 'admin',
    dashboard: 'teacher',
    student: 'student',
    parent: 'parent',
  };

  return pathRoleMap[firstSegment] || null;
}

/**
 * 접근 거부 시 리다이렉트 경로 결정
 *
 * 사용자가 접근 권한이 없는 페이지에 접근할 때
 * 해당 역할의 기본 페이지로 리다이렉트합니다.
 *
 * @param userRole - 현재 사용자 역할
 * @param attemptedPath - 접근 시도한 경로
 * @returns 리다이렉트할 경로
 */
export function getRedirectPath(
  userRole: UserRole | null,
  attemptedPath: string
): string {
  // 로그인하지 않은 경우 로그인 페이지로
  if (!userRole) return '/login';

  // 권한이 있는 경우 해당 경로 유지
  if (checkRoleAccess(userRole, attemptedPath)) return attemptedPath;

  // 권한이 없는 경우 역할별 기본 경로로
  return getRoleDefaultPath(userRole);
}

/**
 * 역할 표시 이름 반환
 *
 * @param role - 사용자 역할
 * @returns 한국어 역할명
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    admin: '관리자',
    teacher: '선생님',
    student: '학생',
    parent: '학부모',
  };

  return displayNames[role] || '알 수 없음';
}
