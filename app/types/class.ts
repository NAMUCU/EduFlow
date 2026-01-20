/**
 * EduFlow 반/그룹 관련 타입 정의
 *
 * 이 파일은 반 생성, 관리, 학생 배정에 필요한 모든 타입을 정의합니다.
 * 반(Class)은 학원에서 학생들을 그룹으로 관리하기 위한 단위입니다.
 */

// ============================================
// 요일 및 시간 관련 타입
// ============================================

/** 요일 */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/** 요일 한국어 라벨 */
export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일',
  sunday: '일요일',
};

/** 요일 약어 한국어 라벨 */
export const DAY_OF_WEEK_SHORT_LABELS: Record<DayOfWeek, string> = {
  monday: '월',
  tuesday: '화',
  wednesday: '수',
  thursday: '목',
  friday: '금',
  saturday: '토',
  sunday: '일',
};

/**
 * 수업 일정 타입
 * 특정 요일과 시간대의 수업 일정을 나타냅니다.
 */
export interface ClassSchedule {
  day: DayOfWeek;         // 요일
  startTime: string;      // 시작 시간 (HH:MM 형식)
  endTime: string;        // 종료 시간 (HH:MM 형식)
}

// ============================================
// 반 상태 관련 타입
// ============================================

/** 반 상태 */
export type ClassStatus = 'active' | 'inactive' | 'archived';

/** 반 상태 한국어 라벨 */
export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  active: '운영중',
  inactive: '휴강',
  archived: '종료',
};

// ============================================
// 반 기본 타입 정의
// ============================================

/**
 * 반 (Class) 인터페이스
 * 학원에서 학생들을 그룹으로 관리하기 위한 단위
 */
export interface Class {
  id: string;                   // 고유 ID
  name: string;                 // 반 이름 (예: "중1 A반", "수학 심화반")
  description: string | null;   // 반 설명
  academy_id: string;           // 소속 학원 ID
  teacher_id: string;           // 담당 선생님 ID
  teacher_name: string;         // 담당 선생님 이름
  subject: string;              // 과목 (예: "수학", "영어")
  grade: string;                // 대상 학년 (예: "중1", "고2")
  schedule: ClassSchedule[];    // 수업 일정 (복수 가능)
  student_ids: string[];        // 소속 학생 ID 목록
  max_students: number | null;  // 최대 수용 인원 (null이면 제한 없음)
  status: ClassStatus;          // 반 상태
  color: string | null;         // 반 색상 (UI에서 구분용, 예: "#3B82F6")
  room: string | null;          // 강의실
  memo: string | null;          // 메모
  created_at: string;           // 생성 일시
  updated_at: string;           // 수정 일시
}

/**
 * 반 목록에서 표시되는 간략한 정보
 */
export interface ClassListItem {
  id: string;
  name: string;
  subject: string;
  grade: string;
  teacher_name: string;
  schedule: ClassSchedule[];
  student_count: number;
  max_students: number | null;
  status: ClassStatus;
  color: string | null;
}

// ============================================
// 반 생성/수정 타입 정의
// ============================================

/**
 * 반 생성용 입력 데이터
 */
export interface CreateClass {
  name: string;                        // 반 이름 (필수)
  description?: string;                // 반 설명
  academy_id: string;                  // 학원 ID (필수)
  teacher_id: string;                  // 담당 선생님 ID (필수)
  subject: string;                     // 과목 (필수)
  grade: string;                       // 대상 학년 (필수)
  schedule: ClassSchedule[];           // 수업 일정 (필수)
  student_ids?: string[];              // 초기 학생 목록
  max_students?: number | null;        // 최대 수용 인원
  color?: string;                      // 반 색상
  room?: string;                       // 강의실
  memo?: string;                       // 메모
}

/**
 * 반 수정용 입력 데이터
 */
export interface UpdateClass {
  name?: string;                       // 반 이름
  description?: string | null;         // 반 설명
  teacher_id?: string;                 // 담당 선생님 ID
  subject?: string;                    // 과목
  grade?: string;                      // 대상 학년
  schedule?: ClassSchedule[];          // 수업 일정
  max_students?: number | null;        // 최대 수용 인원
  status?: ClassStatus;                // 반 상태
  color?: string | null;               // 반 색상
  room?: string | null;                // 강의실
  memo?: string | null;                // 메모
}

// ============================================
// 학생 추가/제거 타입 정의
// ============================================

/**
 * 반에 학생 추가 요청
 */
export interface AddStudentsToClass {
  student_ids: string[];               // 추가할 학생 ID 목록
}

/**
 * 반에서 학생 제거 요청
 */
export interface RemoveStudentsFromClass {
  student_ids: string[];               // 제거할 학생 ID 목록
}

// ============================================
// 반 상세 정보 타입 정의
// ============================================

/**
 * 반에 소속된 학생 정보 (확장)
 */
export interface ClassStudent {
  id: string;                          // 학생 ID
  name: string;                        // 학생 이름
  email: string | null;                // 이메일
  grade: string | null;                // 학년
  school_name: string | null;          // 학교명
  phone: string | null;                // 연락처
  joined_at: string | null;            // 반 가입일
}

/**
 * 반 과제 현황
 */
export interface ClassAssignmentSummary {
  total: number;                       // 전체 과제 수
  active: number;                      // 진행중인 과제 수
  completed: number;                   // 완료된 과제 수
  average_completion_rate: number;     // 평균 완료율 (%)
}

/**
 * 반 상세 정보 (학생 목록, 과제 현황 포함)
 */
export interface ClassDetail extends Class {
  students: ClassStudent[];            // 소속 학생 목록
  assignment_summary: ClassAssignmentSummary; // 과제 현황 요약
}

// ============================================
// 필터 및 검색 타입 정의
// ============================================

/**
 * 반 목록 필터 옵션
 */
export interface ClassFilterOptions {
  status?: ClassStatus;                // 상태 필터
  subject?: string;                    // 과목 필터
  grade?: string;                      // 학년 필터
  teacher_id?: string;                 // 선생님 필터
  search?: string;                     // 검색어 (이름, 설명)
}

// ============================================
// API 응답 타입 정의
// ============================================

/**
 * 반 목록 API 응답
 */
export interface ClassListResponse {
  success: boolean;
  data?: {
    classes: ClassListItem[];
    total: number;
    page: number;
    page_size: number;
  };
  error?: string;
}

/**
 * 반 상세 API 응답
 */
export interface ClassDetailResponse {
  success: boolean;
  data?: ClassDetail;
  error?: string;
}

/**
 * 반 생성/수정 API 응답
 */
export interface ClassMutationResponse {
  success: boolean;
  data?: Class;
  message?: string;
  error?: string;
}

/**
 * 반 삭제 API 응답
 */
export interface ClassDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 학생 추가/제거 API 응답
 */
export interface ClassStudentMutationResponse {
  success: boolean;
  data?: {
    class_id: string;
    student_ids: string[];
  };
  message?: string;
  error?: string;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 수업 일정을 한국어 문자열로 변환
 * @param schedule 수업 일정 배열
 * @returns 예: "월 14:00~16:00, 수 14:00~16:00"
 */
export function formatScheduleToString(schedule: ClassSchedule[]): string {
  if (!schedule || schedule.length === 0) return '일정 없음';

  return schedule
    .map((s) => `${DAY_OF_WEEK_SHORT_LABELS[s.day]} ${s.startTime}~${s.endTime}`)
    .join(', ');
}

/**
 * 반 상태에 따른 색상 클래스 반환
 */
export function getClassStatusColorClass(status: ClassStatus): string {
  const colorMap: Record<ClassStatus, string> = {
    active: 'text-green-600 bg-green-100',
    inactive: 'text-yellow-600 bg-yellow-100',
    archived: 'text-gray-600 bg-gray-100',
  };
  return colorMap[status];
}

/**
 * 학생 수용 현황을 퍼센트로 계산
 * @param currentCount 현재 학생 수
 * @param maxStudents 최대 수용 인원
 * @returns 수용률 (0~100)
 */
export function calculateCapacityPercentage(currentCount: number, maxStudents: number | null): number {
  if (maxStudents === null || maxStudents === 0) return 0;
  return Math.min(100, Math.round((currentCount / maxStudents) * 100));
}

/**
 * 수용 현황에 따른 색상 클래스 반환
 */
export function getCapacityColorClass(percentage: number): string {
  if (percentage >= 100) return 'text-red-600 bg-red-100';
  if (percentage >= 80) return 'text-yellow-600 bg-yellow-100';
  return 'text-green-600 bg-green-100';
}
