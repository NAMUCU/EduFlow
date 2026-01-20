/**
 * EduFlow 강사 관련 타입 정의
 *
 * 이 파일은 강사 관리, 필터링, 생성, 수정에 필요한 모든 타입을 정의합니다.
 * PRD F6 - 강사 관리 기능을 위한 타입 정의
 */

// ============================================
// 강사 상태 및 역할 관련 타입
// ============================================

/** 강사 상태 */
export type TeacherStatus = 'active' | 'inactive';

/** 강사 상태 한국어 라벨 */
export const TEACHER_STATUS_LABELS: Record<TeacherStatus, string> = {
  active: '활동중',
  inactive: '비활동',
};

/** 강사 역할 */
export type TeacherRole = 'admin' | 'teacher';

/** 강사 역할 한국어 라벨 */
export const TEACHER_ROLE_LABELS: Record<TeacherRole, string> = {
  admin: '관리자',
  teacher: '강사',
};

/** 강사 상태별 색상 클래스 */
export const TEACHER_STATUS_COLORS: Record<TeacherStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
};

/** 강사 역할별 색상 클래스 */
export const TEACHER_ROLE_COLORS: Record<TeacherRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100 text-blue-700',
};

// ============================================
// 강사 기본 타입 정의
// ============================================

/**
 * 담당 반 정보 (간략)
 */
export interface AssignedClass {
  id: string;
  name: string;
}

/**
 * 강사 인터페이스
 * 학원에서 수업을 담당하는 강사 정보
 */
export interface Teacher {
  id: string;                   // 고유 ID
  name: string;                 // 강사 이름
  email: string;                // 이메일 (로그인용)
  phone: string;                // 연락처
  subjects: string[];           // 담당 과목 목록
  classes: AssignedClass[];     // 담당 반 목록
  status: TeacherStatus;        // 강사 상태
  role: TeacherRole;            // 역할 (admin/teacher)
  academy_id: string;           // 소속 학원 ID
  profile_image?: string;       // 프로필 이미지 URL
  memo?: string;                // 메모
  created_at: string;           // 생성 일시
  updated_at: string;           // 수정 일시
}

/**
 * 강사 목록에서 표시되는 간략한 정보
 */
export interface TeacherListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  classes: AssignedClass[];
  status: TeacherStatus;
  role: TeacherRole;
  created_at: string;
}

/**
 * 강사 상세 정보 (통계 포함)
 */
export interface TeacherDetail extends Teacher {
  // 담당 현황
  total_classes: number;        // 담당 반 수
  total_students: number;       // 담당 학생 수

  // 활동 통계
  assignments_created: number;  // 생성한 과제 수
  problems_created: number;     // 생성한 문제 수
  consultations_count: number;  // 상담 횟수

  // 최근 활동
  last_login_at?: string;       // 마지막 로그인
  last_activity_at?: string;    // 마지막 활동
}

// ============================================
// 강사 생성/수정 타입 정의
// ============================================

/**
 * 강사 등록 입력 데이터
 */
export interface CreateTeacherInput {
  name: string;                 // 강사 이름 (필수)
  email: string;                // 이메일 (필수, 로그인 ID로 사용)
  phone: string;                // 연락처 (필수)
  subjects: string[];           // 담당 과목 목록 (필수)
  class_ids?: string[];         // 담당 반 ID 목록 (선택)
  role: TeacherRole;            // 역할 (필수)
  memo?: string;                // 메모 (선택)
}

/**
 * 강사 정보 수정 입력 데이터
 */
export interface UpdateTeacherInput {
  name?: string;                // 강사 이름
  email?: string;               // 이메일
  phone?: string;               // 연락처
  subjects?: string[];          // 담당 과목 목록
  class_ids?: string[];         // 담당 반 ID 목록
  status?: TeacherStatus;       // 강사 상태
  role?: TeacherRole;           // 역할
  memo?: string;                // 메모
}

// ============================================
// 필터 및 검색 타입 정의
// ============================================

/**
 * 강사 필터 옵션
 */
export interface TeacherFilter {
  search?: string;              // 검색어 (이름, 이메일, 연락처)
  status?: TeacherStatus;       // 상태 필터
  role?: TeacherRole;           // 역할 필터
  subject?: string;             // 과목 필터
  class_id?: string;            // 담당 반 필터
}

/**
 * 강사 정렬 옵션
 */
export interface TeacherSort {
  field: 'name' | 'email' | 'created_at' | 'status';
  direction: 'asc' | 'desc';
}

// ============================================
// API 응답 타입 정의
// ============================================

/**
 * 강사 목록 API 응답
 */
export interface TeacherListResponse {
  success: boolean;
  data?: {
    teachers: TeacherListItem[];
    total: number;
    page: number;
    page_size: number;
  };
  error?: string;
}

/**
 * 강사 상세 API 응답
 */
export interface TeacherDetailResponse {
  success: boolean;
  data?: TeacherDetail;
  error?: string;
}

/**
 * 강사 생성/수정 API 응답
 */
export interface TeacherMutationResponse {
  success: boolean;
  data?: Teacher;
  message?: string;
  error?: string;
}

/**
 * 강사 삭제 API 응답
 */
export interface TeacherDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 담당 과목 목록을 문자열로 변환
 * @param subjects 과목 배열
 * @returns 예: "수학, 영어, 과학"
 */
export function formatSubjectsToString(subjects: string[]): string {
  if (!subjects || subjects.length === 0) return '미지정';
  return subjects.join(', ');
}

/**
 * 담당 반 목록을 문자열로 변환
 * @param classes 담당 반 배열
 * @returns 예: "중1 A반, 고2 B반"
 */
export function formatClassesToString(classes: AssignedClass[]): string {
  if (!classes || classes.length === 0) return '미지정';
  return classes.map(c => c.name).join(', ');
}

/**
 * 전화번호 포맷팅
 * @param phone 전화번호 문자열
 * @returns 포맷팅된 전화번호
 */
export function formatTeacherPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

/**
 * 강사 상태에 따른 색상 클래스 반환
 */
export function getTeacherStatusColorClass(status: TeacherStatus): string {
  return TEACHER_STATUS_COLORS[status];
}

/**
 * 강사 역할에 따른 색상 클래스 반환
 */
export function getTeacherRoleColorClass(role: TeacherRole): string {
  return TEACHER_ROLE_COLORS[role];
}
