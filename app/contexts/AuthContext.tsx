'use client';

/**
 * EduFlow 인증 컨텍스트
 *
 * 애플리케이션 전체에서 인증 상태를 관리하는 React Context입니다.
 * 현재는 Mock 인증으로 구현되어 있으며, 나중에 Supabase Auth로 교체 가능합니다.
 *
 * 주요 기능:
 * - 사용자 정보 (user, role, academy) 관리
 * - 로그인/로그아웃 함수
 * - 로딩 상태 관리
 */

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  User,
  Academy,
  AuthContextType,
  LoginCredentials,
  SignupCredentials,
  UserRole,
} from '@/types/auth';
import { getRoleDefaultPath } from '@/lib/auth-utils';

// Mock 사용자 데이터 (개발/테스트용)
// 나중에 Supabase 연동 시 제거됩니다.
const MOCK_USERS: Record<string, User & { password: string }> = {
  'admin@eduflow.com': {
    id: 'user-admin-001',
    email: 'admin@eduflow.com',
    password: 'admin123',
    name: '관리자',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'teacher@eduflow.com': {
    id: 'user-teacher-001',
    email: 'teacher@eduflow.com',
    password: 'teacher123',
    name: '김선생',
    role: 'teacher',
    academyId: 'academy-001',
    academyName: '스마트 수학학원',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'student@eduflow.com': {
    id: 'user-student-001',
    email: 'student@eduflow.com',
    password: 'student123',
    name: '이학생',
    role: 'student',
    academyId: 'academy-001',
    academyName: '스마트 수학학원',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'parent@eduflow.com': {
    id: 'user-parent-001',
    email: 'parent@eduflow.com',
    password: 'parent123',
    name: '박학부모',
    role: 'parent',
    academyId: 'academy-001',
    academyName: '스마트 수학학원',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// Mock 학원 데이터
const MOCK_ACADEMY: Academy = {
  id: 'academy-001',
  name: '스마트 수학학원',
  address: '서울시 강남구 테헤란로 123',
  phone: '02-1234-5678',
  createdAt: new Date().toISOString(),
};

// 인증 컨텍스트 기본값
const defaultAuthContext: AuthContextType = {
  user: null,
  academy: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
  updateProfile: async () => {},
};

// 인증 컨텍스트 생성
export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// 로컬 스토리지 키
const AUTH_STORAGE_KEY = 'eduflow_auth';
// 미들웨어와 동기화를 위한 쿠키 키
const AUTH_COOKIE_KEY = 'eduflow_auth_cookie';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 쿠키 설정 유틸리티 함수
 * 미들웨어에서 인증 상태를 확인할 수 있도록 쿠키를 설정합니다.
 */
function setAuthCookie(user: User | null, academy: Academy | null) {
  if (typeof document === 'undefined') return;

  if (user) {
    // 쿠키에 저장할 최소한의 정보만 포함
    const cookieData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
    const encoded = encodeURIComponent(JSON.stringify(cookieData));
    // 7일간 유효한 쿠키 설정
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${AUTH_COOKIE_KEY}=${encoded}; path=/; expires=${expires}; SameSite=Lax`;
  } else {
    // 쿠키 삭제
    document.cookie = `${AUTH_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

/**
 * 인증 Provider 컴포넌트
 *
 * 애플리케이션의 최상위에서 인증 상태를 제공합니다.
 * app/layout.tsx에서 사용됩니다.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // 상태 정의
  const [user, setUser] = useState<User | null>(null);
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 인증 여부 계산
  const isAuthenticated = !!user;

  /**
   * 로컬 스토리지에서 인증 정보 복원
   * 페이지 새로고침 시에도 로그인 상태 유지를 위해 사용
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 브라우저 환경에서만 실행
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(AUTH_STORAGE_KEY);
          if (stored) {
            const { user: storedUser, academy: storedAcademy } =
              JSON.parse(stored);
            setUser(storedUser);
            setAcademy(storedAcademy);
            // 쿠키도 동기화 (미들웨어용)
            setAuthCookie(storedUser, storedAcademy);
          }
        }
      } catch (err) {
        console.error('인증 정보 복원 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * 인증 정보 저장
   * 로컬 스토리지와 쿠키 모두에 저장하여
   * 클라이언트(로컬 스토리지)와 미들웨어(쿠키) 모두에서 접근 가능하도록 합니다.
   */
  const saveAuth = useCallback((user: User | null, academy: Academy | null) => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ user, academy })
        );
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      // 미들웨어 동기화를 위해 쿠키도 설정
      setAuthCookie(user, academy);
    }
  }, []);

  /**
   * 로그인 함수
   *
   * Mock 인증: 이메일/비밀번호가 MOCK_USERS와 일치하면 로그인 성공
   * TODO: Supabase Auth로 교체 예정
   *
   * @param credentials - 로그인 정보 (이메일, 비밀번호)
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // Mock 인증 로직 (나중에 Supabase로 교체)
        // 실제 API 호출을 시뮬레이션하기 위해 약간의 지연 추가
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockUser = MOCK_USERS[credentials.email];

        if (!mockUser || mockUser.password !== credentials.password) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
        }

        // 비밀번호 제외한 사용자 정보 저장
        const { password: _, ...userWithoutPassword } = mockUser;
        const authenticatedUser = userWithoutPassword as User;

        // 학원 정보 설정 (학원에 소속된 사용자인 경우)
        const userAcademy = authenticatedUser.academyId ? MOCK_ACADEMY : null;

        setUser(authenticatedUser);
        setAcademy(userAcademy);
        saveAuth(authenticatedUser, userAcademy);

        // TODO: Supabase Auth 연동 시 아래 코드 사용
        // const { data, error } = await supabase.auth.signInWithPassword({
        //   email: credentials.email,
        //   password: credentials.password,
        // });
        // if (error) throw error;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '로그인에 실패했습니다.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [saveAuth]
  );

  /**
   * 로그아웃 함수
   *
   * 모든 인증 상태를 초기화하고 로컬 스토리지에서 정보 삭제
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      // Mock 로그아웃 (나중에 Supabase로 교체)
      await new Promise((resolve) => setTimeout(resolve, 300));

      setUser(null);
      setAcademy(null);
      saveAuth(null, null);

      // TODO: Supabase Auth 연동 시 아래 코드 사용
      // await supabase.auth.signOut();
    } catch (err) {
      console.error('로그아웃 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [saveAuth]);

  /**
   * 회원가입 함수
   *
   * 새로운 사용자를 등록합니다.
   * TODO: Supabase Auth로 교체 예정
   */
  const signup = useCallback(
    async (credentials: SignupCredentials): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // Mock 회원가입 로직
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 이미 존재하는 이메일 체크
        if (MOCK_USERS[credentials.email]) {
          throw new Error('이미 사용 중인 이메일입니다.');
        }

        // 새 사용자 생성 (실제로는 서버에서 처리)
        const newUser: User = {
          id: `user-${Date.now()}`,
          email: credentials.email,
          name: credentials.name,
          role: credentials.role,
          academyId: credentials.academyId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Mock에서는 바로 로그인 처리
        setUser(newUser);
        const userAcademy = newUser.academyId ? MOCK_ACADEMY : null;
        setAcademy(userAcademy);
        saveAuth(newUser, userAcademy);

        // TODO: Supabase Auth 연동 시 아래 코드 사용
        // const { data, error } = await supabase.auth.signUp({
        //   email: credentials.email,
        //   password: credentials.password,
        //   options: {
        //     data: { name: credentials.name, role: credentials.role }
        //   }
        // });
        // if (error) throw error;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '회원가입에 실패했습니다.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [saveAuth]
  );

  /**
   * 프로필 업데이트 함수
   */
  const updateProfile = useCallback(
    async (data: Partial<User>): Promise<void> => {
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      setIsLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));

        const updatedUser: User = {
          ...user,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        setUser(updatedUser);
        saveAuth(updatedUser, academy);

        // TODO: Supabase에서 프로필 업데이트
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : '프로필 업데이트에 실패했습니다.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, academy, saveAuth]
  );

  // Context 값
  const contextValue: AuthContextType = {
    user,
    academy,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    signup,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export default AuthContext;
