/**
 * EduFlow 학생 관련 타입 정의
 *
 * 이 파일은 학생 관리, 필터링, 생성, 수정에 필요한 모든 타입을 정의합니다.
 * database.ts에서 기본 타입을 가져오고, 추가 확장 타입을 정의합니다.
 */

import {
  Student,
  User,
  Grade,
  Attendance,
  Consultation,
  StudentAssignment,
  AttendanceStatus,
  AssignmentStatus,
  ConsultationStatus,
} from './database';

// ============================================
// 학생 관련 ENUM 및 상수
// ============================================

/** 학생 상태 */
export type StudentStatus = '우수' | '정상' | '주의' | '신규';

/** 학년 목록 */
export const GRADE_OPTIONS = [
  '초4', '초5', '초6',
  '중1', '중2', '중3',
  '고1', '고2', '고3',
] as const;

/** 반 목록 (샘플) */
export const CLASS_OPTIONS = [
  'A반', 'B반', 'C반', 'D반',
  '기초반', '심화반', '특목반',
] as const;

/** 과목 목록 */
export const SUBJECT_OPTIONS = [
  '수학', '영어', '국어', '과학', '사회',
] as const;

/** 학생 상태별 색상 클래스 */
export const STUDENT_STATUS_COLORS: Record<StudentStatus, string> = {
  '우수': 'bg-green-100 text-green-700',
  '정상': 'bg-blue-100 text-blue-700',
  '주의': 'bg-red-100 text-red-700',
  '신규': 'bg-purple-100 text-purple-700',
};

// ============================================
// 학생 확장 인터페이스
// ============================================

/**
 * 학부모 정보
 */
export interface ParentInfo {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: '부' | '모' | '조부' | '조모' | '기타';
}

/**
 * 학생 기본 정보 (UI 표시용)
 * - API에서 반환하거나 목록에서 표시할 때 사용
 */
export interface StudentBasicInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  grade: string;
  school: string;
  className?: string;
  subjects: string[];
  parent: ParentInfo;
  status: StudentStatus;
  averageScore?: number;
  enrolledAt: string;
  profileImage?: string;
  memo?: string;
}

/**
 * 학생 목록 아이템 (테이블 표시용)
 */
export interface StudentListItem {
  id: string;
  name: string;
  grade: string;
  school: string;
  className?: string;
  phone?: string;
  parentName: string;
  parentPhone: string;
  subjects: string[];
  recentScore?: number;
  status: StudentStatus;
  enrolledAt: string;
}

/**
 * 학생 통계 요약 (UI용)
 */
export interface StudentStats {
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
  completedAssignments: number;
  totalAssignments: number;
  attendanceRate: number;
  studyHours?: number;
}

/**
 * 최근 활동
 */
export interface RecentActivity {
  description: string;
  date: string;
  type?: 'assignment' | 'grade' | 'attendance' | 'consultation';
}

/**
 * 취약 단원
 */
export interface WeakUnit {
  name: string;
  accuracy: number;
  subject?: string;
}

/**
 * 학생 상세 정보 (모든 정보 포함)
 */
export interface StudentDetail extends StudentBasicInfo {
  // 통계 요약 (UI용)
  stats: StudentStats;

  // 성적 현황
  grades: GradeSummary[];
  recentGrades: Grade[];

  // 과제 현황
  assignmentStats: AssignmentStats;
  recentAssignments: StudentAssignment[];

  // 출결 현황
  attendanceStats: AttendanceStats;
  recentAttendance: Attendance[];

  // 상담 기록
  consultations: Consultation[];

  // 최근 활동 (UI용)
  recentActivities?: RecentActivity[];

  // 취약 단원 (UI용)
  weakUnits?: WeakUnit[];
}

/**
 * 성적 요약
 */
export interface GradeSummary {
  subject: string;
  averageScore: number;
  recentScore?: number;
  trend: 'up' | 'down' | 'stable';
  totalTests: number;
}

/**
 * 과제 통계
 */
export interface AssignmentStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  averageScore: number;
  completionRate: number;
}

/**
 * 출결 통계
 */
export interface AttendanceStats {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  earlyLeave: number;
  attendanceRate: number;
}

// ============================================
// 필터 및 검색 타입
// ============================================

/**
 * 학생 필터 옵션
 */
export interface StudentFilter {
  search?: string;
  grade?: string;
  className?: string;
  status?: StudentStatus;
  subject?: string;
  schoolName?: string;
  enrolledFrom?: string;
  enrolledTo?: string;
}

/**
 * 학생 정렬 옵션
 */
export interface StudentSort {
  field: 'name' | 'grade' | 'school' | 'enrolledAt' | 'recentScore';
  direction: 'asc' | 'desc';
}

/**
 * 학생 목록 쿼리 파라미터
 */
export interface StudentListQuery {
  filter?: StudentFilter;
  sort?: StudentSort;
  page?: number;
  pageSize?: number;
}

// ============================================
// 학생 생성/수정 타입
// ============================================

/**
 * 학생 등록 입력 데이터
 */
export interface CreateStudentInput {
  // 학생 기본 정보
  name: string;
  email?: string;
  phone?: string;
  grade: string;
  school: string;
  className?: string;
  subjects: string[];
  memo?: string;

  // 학부모 정보
  parent: ParentInfo;
}

/**
 * 학생 정보 수정 입력 데이터
 */
export interface UpdateStudentInput {
  name?: string;
  email?: string;
  phone?: string;
  grade?: string;
  school?: string;
  className?: string;
  subjects?: string[];
  memo?: string;
  parent?: Partial<ParentInfo>;
  status?: StudentStatus;
}

// ============================================
// API 응답 타입
// ============================================

/**
 * 학생 목록 API 응답
 */
export interface StudentListResponse {
  success: boolean;
  data?: {
    students: StudentListItem[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

/**
 * 학생 상세 API 응답
 */
export interface StudentDetailResponse {
  success: boolean;
  data?: StudentDetail;
  error?: string;
}

/**
 * 학생 생성/수정 API 응답
 */
export interface StudentMutationResponse {
  success: boolean;
  data?: StudentBasicInfo;
  error?: string;
}

/**
 * 학생 삭제 API 응답
 */
export interface StudentDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 평균 성적을 기반으로 학생 상태 판별
 */
export function getStudentStatus(averageScore?: number, enrolledDays?: number): StudentStatus {
  if (enrolledDays !== undefined && enrolledDays < 30) {
    return '신규';
  }

  if (averageScore === undefined) {
    return '정상';
  }

  if (averageScore >= 90) {
    return '우수';
  } else if (averageScore >= 70) {
    return '정상';
  } else {
    return '주의';
  }
}

/**
 * 성적 추이 계산
 */
export function calculateScoreTrend(scores: number[]): 'up' | 'down' | 'stable' {
  if (scores.length < 2) return 'stable';

  const recent = scores.slice(-3);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = last - first;

  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
}

/**
 * 출석률 계산
 */
export function calculateAttendanceRate(stats: AttendanceStats): number {
  if (stats.totalDays === 0) return 100;
  return Math.round((stats.present / stats.totalDays) * 100);
}

/**
 * 학년 정렬 함수 (초 < 중 < 고)
 */
export function sortByGrade(a: string, b: string): number {
  const gradeOrder: Record<string, number> = {
    '초4': 1, '초5': 2, '초6': 3,
    '중1': 4, '중2': 5, '중3': 6,
    '고1': 7, '고2': 8, '고3': 9,
  };

  return (gradeOrder[a] || 0) - (gradeOrder[b] || 0);
}

/**
 * 전화번호 포맷팅
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}
