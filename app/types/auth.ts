/**
 * EduFlow 인증 관련 타입 정의
 *
 * 사용자 역할과 인증 상태에 관한 모든 타입을 정의합니다.
 * Supabase Auth와 호환되는 구조로 설계되어 있습니다.
 */

// 사용자 역할 (super_admin: 시스템 관리자, admin: 학원 관리자, teacher: 선생님, student: 학생, parent: 학부모)
export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent';

// 사용자 정보 타입
export interface User {
  id: string;           // 고유 ID
  email: string;        // 이메일
  name: string;         // 이름
  role: UserRole;       // 역할
  academyId?: string;   // 소속 학원 ID (선택)
  academyName?: string; // 소속 학원명 (선택)
  profileImage?: string; // 프로필 이미지 URL (선택)
  createdAt: string;    // 생성일
  updatedAt: string;    // 수정일
}

// 학원 정보 타입
export interface Academy {
  id: string;           // 고유 ID
  name: string;         // 학원명
  address?: string;     // 주소 (선택)
  phone?: string;       // 전화번호 (선택)
  createdAt: string;    // 생성일
}

// 인증 상태 타입
export interface AuthState {
  user: User | null;           // 현재 로그인한 사용자
  academy: Academy | null;     // 현재 사용자의 학원 정보
  isAuthenticated: boolean;    // 인증 여부
  isLoading: boolean;          // 로딩 상태
  error: string | null;        // 에러 메시지
}

// 로그인 요청 타입
export interface LoginCredentials {
  email: string;
  password: string;
}

// 회원가입 요청 타입
export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  academyId?: string;
}

// 인증 컨텍스트에서 제공하는 함수들의 타입
export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;    // 로그인
  logout: () => Promise<void>;                                 // 로그아웃
  signup: (credentials: SignupCredentials) => Promise<void>;  // 회원가입
  updateProfile: (data: Partial<User>) => Promise<void>;      // 프로필 업데이트
}

// 역할별 접근 가능한 경로 매핑 타입
export interface RoleRouteConfig {
  defaultPath: string;        // 기본 리다이렉트 경로
  allowedPaths: string[];     // 접근 가능한 경로 패턴
}

// 역할별 라우트 설정
export type RoleRouteMap = Record<UserRole, RoleRouteConfig>;
