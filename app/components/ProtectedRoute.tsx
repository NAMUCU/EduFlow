'use client';

/**
 * EduFlow 보호된 라우트 컴포넌트
 *
 * 특정 역할만 접근 가능하도록 제한하는 래퍼 컴포넌트입니다.
 * 미들웨어와 함께 사용하여 이중 보안을 제공합니다.
 *
 * 미들웨어: 서버 레벨에서 리다이렉트 (빠름, 첫 요청 시 차단)
 * ProtectedRoute: 클라이언트 레벨에서 추가 확인 (SPA 네비게이션 시 보호)
 *
 * @example
 * ```tsx
 * // 선생님만 접근 가능한 페이지
 * <ProtectedRoute allowedRoles={['teacher']}>
 *   <TeacherDashboard />
 * </ProtectedRoute>
 *
 * // 선생님과 관리자만 접근 가능
 * <ProtectedRoute allowedRoles={['teacher', 'admin']}>
 *   <ClassManagement />
 * </ProtectedRoute>
 * ```
 */

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getRoleDefaultPath, getRoleDisplayName } from '@/lib/auth-utils';

interface ProtectedRouteProps {
  children: ReactNode;                    // 보호할 컴포넌트
  allowedRoles: UserRole[];               // 허용된 역할 목록
  fallbackPath?: string;                  // 권한 없을 때 이동할 경로 (선택)
  loadingComponent?: ReactNode;           // 로딩 중 표시할 컴포넌트 (선택)
  unauthorizedComponent?: ReactNode;      // 권한 없을 때 표시할 컴포넌트 (선택)
}

/**
 * 기본 로딩 컴포넌트
 */
function DefaultLoadingComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
}

/**
 * 기본 권한 없음 컴포넌트
 */
interface UnauthorizedComponentProps {
  userRole: UserRole | null;
  allowedRoles: UserRole[];
  onRedirect: () => void;
}

function DefaultUnauthorizedComponent({
  userRole,
  allowedRoles,
  onRedirect,
}: UnauthorizedComponentProps) {
  const allowedRoleNames = allowedRoles.map(getRoleDisplayName).join(', ');
  const currentRoleName = userRole ? getRoleDisplayName(userRole) : '미로그인';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* 아이콘 */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* 메시지 */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          접근 권한이 없습니다
        </h2>
        <p className="text-gray-600 mb-6">
          이 페이지는 <strong>{allowedRoleNames}</strong> 전용입니다.
          <br />
          현재 로그인된 계정은 <strong>{currentRoleName}</strong>입니다.
        </p>

        {/* 버튼 */}
        <button
          onClick={onRedirect}
          className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          내 페이지로 이동
        </button>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute 컴포넌트
 *
 * 지정된 역할만 접근 가능하도록 제한합니다.
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  fallbackPath,
  loadingComponent,
  unauthorizedComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  // 사용자 역할
  const userRole = user?.role || null;

  // 접근 권한 확인
  const hasAccess = userRole && allowedRoles.includes(userRole);

  // 리다이렉트 경로 계산
  const redirectPath = fallbackPath || (userRole ? getRoleDefaultPath(userRole) : '/login');

  // 리다이렉트 핸들러
  const handleRedirect = () => {
    router.push(redirectPath);
  };

  // 인증/권한 확인 후 리다이렉트
  useEffect(() => {
    // 로딩 중에는 아무것도 하지 않음
    if (isLoading) return;

    // 로그인하지 않은 경우 로그인 페이지로
    if (!isAuthenticated) {
      const loginUrl = `/login?returnUrl=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);
      return;
    }

    // 권한이 없는 경우 (자동 리다이렉트 비활성화 - 사용자에게 안내 메시지 표시)
    // 자동 리다이렉트를 원하면 아래 주석 해제
    // if (!hasAccess) {
    //   router.replace(redirectPath);
    // }
  }, [isLoading, isAuthenticated, hasAccess, pathname, redirectPath, router]);

  // 1. 로딩 중
  if (isLoading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // 2. 미인증 (로그인 페이지로 리다이렉트 중)
  if (!isAuthenticated) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // 3. 권한 없음
  if (!hasAccess) {
    return (
      unauthorizedComponent || (
        <DefaultUnauthorizedComponent
          userRole={userRole}
          allowedRoles={allowedRoles}
          onRedirect={handleRedirect}
        />
      )
    );
  }

  // 4. 접근 허용
  return <>{children}</>;
}

/**
 * 역할별 보호 컴포넌트 (편의를 위한 래퍼)
 */

// 관리자 전용
export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>;
}

// 선생님 전용
export function TeacherRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['teacher']}>{children}</ProtectedRoute>;
}

// 학생 전용
export function StudentRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['student']}>{children}</ProtectedRoute>;
}

// 학부모 전용
export function ParentRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['parent']}>{children}</ProtectedRoute>;
}

// 선생님 또는 관리자
export function StaffRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
      {children}
    </ProtectedRoute>
  );
}

export default ProtectedRoute;
