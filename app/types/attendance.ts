/**
 * EduFlow 출결 관련 타입 정의
 *
 * 이 파일은 출결 관리에 필요한 모든 타입을 정의합니다.
 * 학생 출석, 결석, 지각, 조퇴, 병결 상태를 관리합니다.
 */

// ============================================
// 출결 상태 ENUM 및 상수
// ============================================

/** 출결 상태 */
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave' | 'sick_leave';

/** 출결 상태 한국어 라벨 */
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: '출석',
  absent: '결석',
  late: '지각',
  early_leave: '조퇴',
  sick_leave: '병결',
};

/** 출결 상태 색상 클래스 */
export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'text-green-600 bg-green-100',
  absent: 'text-red-600 bg-red-100',
  late: 'text-yellow-600 bg-yellow-100',
  early_leave: 'text-orange-600 bg-orange-100',
  sick_leave: 'text-purple-600 bg-purple-100',
};

/** 출결 상태 아이콘 색상 */
export const ATTENDANCE_STATUS_ICON_COLORS: Record<AttendanceStatus, string> = {
  present: 'text-green-500',
  absent: 'text-red-500',
  late: 'text-yellow-500',
  early_leave: 'text-orange-500',
  sick_leave: 'text-purple-500',
};

// ============================================
// 출결 기본 타입
// ============================================

/**
 * 출결 기록 인터페이스
 */
export interface Attendance {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  academy_id: string;
  date: string; // YYYY-MM-DD 형식
  status: AttendanceStatus;
  check_in_time?: string | null; // HH:mm 형식
  check_out_time?: string | null; // HH:mm 형식
  memo?: string | null;
  sms_sent?: boolean;
  sms_sent_at?: string | null;
  created_by: string; // 등록자 ID
  created_at: string;
  updated_at: string;
}

/**
 * 출결 생성 입력 데이터
 */
export interface AttendanceCreateInput {
  student_id: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  memo?: string;
  send_sms?: boolean;
}

/**
 * 출결 수정 입력 데이터
 */
export interface AttendanceUpdateInput {
  status?: AttendanceStatus;
  check_in_time?: string | null;
  check_out_time?: string | null;
  memo?: string | null;
  send_sms?: boolean;
}

/**
 * 반 전체 출결 일괄 등록 입력 데이터
 */
export interface BulkAttendanceInput {
  class_id: string;
  date: string;
  attendances: {
    student_id: string;
    status: AttendanceStatus;
    check_in_time?: string;
    memo?: string;
  }[];
  send_sms_for_absent?: boolean; // 결석/지각 학생에게 SMS 발송
}

// ============================================
// 필터 및 조회 타입
// ============================================

/**
 * 출결 필터 옵션
 */
export interface AttendanceFilterOptions {
  date?: string;
  date_from?: string;
  date_to?: string;
  class_id?: string;
  student_id?: string;
  status?: AttendanceStatus;
  academy_id?: string;
}

/**
 * 학생별 출결 요약
 */
export interface StudentAttendanceSummary {
  student_id: string;
  student_name: string;
  class_name: string;
  total_days: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  early_leave_count: number;
  sick_leave_count: number;
  attendance_rate: number; // 출석률 (%)
}

/**
 * 반별 출결 현황
 */
export interface ClassAttendanceStatus {
  class_id: string;
  class_name: string;
  date: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  early_leave_count: number;
  sick_leave_count: number;
  students: {
    student_id: string;
    student_name: string;
    status: AttendanceStatus;
    check_in_time?: string | null;
    memo?: string | null;
  }[];
}

/**
 * 출결 통계
 */
export interface AttendanceStatistics {
  period: {
    from: string;
    to: string;
  };
  total_records: number;
  by_status: Record<AttendanceStatus, number>;
  by_class: {
    class_id: string;
    class_name: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    early_leave: number;
    sick_leave: number;
    attendance_rate: number;
  }[];
  daily_trend: {
    date: string;
    present: number;
    absent: number;
    late: number;
    early_leave: number;
    sick_leave: number;
  }[];
}

// ============================================
// API 응답 타입
// ============================================

/**
 * 출결 목록 API 응답
 */
export interface AttendanceListResponse {
  success: boolean;
  data?: {
    attendances: Attendance[];
    total: number;
    page: number;
    page_size: number;
  };
  error?: string;
}

/**
 * 출결 상세 API 응답
 */
export interface AttendanceDetailResponse {
  success: boolean;
  data?: Attendance;
  error?: string;
}

/**
 * 출결 생성/수정 API 응답
 */
export interface AttendanceMutationResponse {
  success: boolean;
  data?: Attendance;
  message?: string;
  error?: string;
}

/**
 * 출결 삭제 API 응답
 */
export interface AttendanceDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 일괄 출결 등록 API 응답
 */
export interface BulkAttendanceResponse {
  success: boolean;
  data?: {
    created_count: number;
    updated_count: number;
    sms_sent_count: number;
  };
  message?: string;
  error?: string;
}

/**
 * 출결 통계 API 응답
 */
export interface AttendanceStatisticsResponse {
  success: boolean;
  data?: AttendanceStatistics;
  error?: string;
}

/**
 * 학생별 출결 요약 API 응답
 */
export interface StudentAttendanceSummaryResponse {
  success: boolean;
  data?: StudentAttendanceSummary[];
  error?: string;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 출결 상태에 따른 색상 클래스 반환
 */
export function getAttendanceStatusColor(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_COLORS[status];
}

/**
 * 출결 상태에 따른 한국어 라벨 반환
 */
export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_LABELS[status];
}

/**
 * 출석률 계산
 */
export function calculateAttendanceRate(
  presentCount: number,
  totalDays: number
): number {
  if (totalDays === 0) return 0;
  return Math.round((presentCount / totalDays) * 100);
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD -> YYYY년 MM월 DD일)
 */
export function formatDateKorean(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 요일 반환
 */
export function getDayOfWeek(dateString: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateString);
  return days[date.getDay()];
}

/**
 * 오늘 날짜 반환 (YYYY-MM-DD 형식)
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 시간 포맷팅 (HH:mm -> 오전/오후 H시 mm분)
 */
export function formatTimeKorean(timeString: string | null | undefined): string {
  if (!timeString) return '-';

  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours < 12 ? '오전' : '오후';
  const displayHours = hours % 12 || 12;

  return `${period} ${displayHours}시 ${minutes}분`;
}
