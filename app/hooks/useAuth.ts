'use client';

/**
 * EduFlow 인증 훅
 *
 * AuthContext를 쉽게 사용하기 위한 커스텀 훅입니다.
 * 컴포넌트에서 인증 상태와 함수에 접근할 때 사용합니다.
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * if (isAuthenticated) {
 *   console.log(`안녕하세요, ${user.name}님!`);
 * }
 * ```
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { AuthContextType } from '@/types/auth';

/**
 * useAuth 훅
 *
 * AuthContext에서 인증 상태와 함수들을 가져옵니다.
 * AuthProvider 내부에서만 사용 가능합니다.
 *
 * @returns AuthContextType - 인증 상태와 함수들
 * @throws Error - AuthProvider 외부에서 사용 시 에러
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, isLoading, login, logout } = useAuth();
 *
 *   if (isLoading) return <Loading />;
 *
 *   if (!isAuthenticated) {
 *     return <LoginButton onClick={() => login({ email, password })} />;
 *   }
 *
 *   return <UserProfile user={user} onLogout={logout} />;
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  // AuthProvider 외부에서 사용된 경우 에러 발생
  if (!context) {
    throw new Error(
      'useAuth는 AuthProvider 내부에서만 사용할 수 있습니다. ' +
        'app/layout.tsx에서 AuthProvider로 감싸주세요.'
    );
  }

  return context;
}

/**
 * useCurrentUser 훅
 *
 * 현재 로그인한 사용자 정보만 가져옵니다.
 * 로그인하지 않은 경우 null을 반환합니다.
 *
 * @returns User | null - 현재 사용자 정보
 *
 * @example
 * ```tsx
 * const user = useCurrentUser();
 * if (user) {
 *   console.log(user.name);
 * }
 * ```
 */
export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}

/**
 * useUserRole 훅
 *
 * 현재 사용자의 역할만 가져옵니다.
 *
 * @returns UserRole | null - 현재 사용자 역할
 *
 * @example
 * ```tsx
 * const role = useUserRole();
 * if (role === 'teacher') {
 *   // 선생님 전용 기능
 * }
 * ```
 */
export function useUserRole() {
  const { user } = useAuth();
  return user?.role ?? null;
}

/**
 * useIsAuthenticated 훅
 *
 * 인증 여부만 빠르게 확인할 때 사용합니다.
 *
 * @returns boolean - 인증 여부
 *
 * @example
 * ```tsx
 * const isAuthenticated = useIsAuthenticated();
 * if (!isAuthenticated) {
 *   redirect('/login');
 * }
 * ```
 */
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * useAcademy 훅
 *
 * 현재 사용자의 학원 정보를 가져옵니다.
 *
 * @returns Academy | null - 학원 정보
 */
export function useAcademy() {
  const { academy } = useAuth();
  return academy;
}

// 기본 export
export default useAuth;
