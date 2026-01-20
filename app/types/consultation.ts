/**
 * EduFlow 상담 관련 타입 정의
 *
 * 이 파일은 상담 관리, 예약, 기록에 필요한 모든 타입을 정의합니다.
 * database.ts에서 기본 타입을 가져오고, 추가 확장 타입을 정의합니다.
 */

import {
  Consultation,
  ConsultationType,
  ConsultationStatus,
  CONSULTATION_TYPE_LABELS,
  CONSULTATION_STATUS_LABELS,
} from './database';

// ============================================
// 상담 관련 상수
// ============================================

/** 상담 유형 목록 */
export const CONSULTATION_TYPES = ['in_person', 'phone', 'video'] as const;

/** 상담 상태 목록 */
export const CONSULTATION_STATUSES = ['scheduled', 'completed', 'cancelled'] as const;

/** 기본 상담 시간 (분) */
export const DEFAULT_CONSULTATION_DURATIONS = [15, 20, 30, 45, 60] as const;

/** 상담 유형별 색상 클래스 */
export const CONSULTATION_TYPE_COLORS: Record<ConsultationType, string> = {
  in_person: 'bg-blue-100 text-blue-700',
  phone: 'bg-green-100 text-green-700',
  video: 'bg-purple-100 text-purple-700',
};

/** 상담 상태별 색상 클래스 */
export const CONSULTATION_STATUS_COLORS: Record<ConsultationStatus, string> = {
  scheduled: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

// ============================================
// 상담 확장 인터페이스
// ============================================

/**
 * 상담에 연결된 학생 정보
 */
export interface ConsultationStudent {
  id: string;
  name: string;
  grade: string;
  school: string;
  className?: string;
}

/**
 * 상담에 연결된 학부모 정보
 */
export interface ConsultationParent {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

/**
 * 상담에 연결된 선생님 정보
 */
export interface ConsultationTeacher {
  id: string;
  name: string;
  subjects?: string[];
}

/**
 * 상담 목록 아이템 (테이블/캘린더 표시용)
 */
export interface ConsultationListItem {
  id: string;
  date: string;
  time: string;
  duration: number;
  type: ConsultationType;
  topic: string;
  status: ConsultationStatus;
  studentName: string;
  studentGrade?: string;
  parentName: string;
  parentPhone: string;
  teacherName?: string;
}

/**
 * 상담 상세 정보 (모든 정보 포함)
 */
export interface ConsultationDetail {
  id: string;
  date: string;
  time: string;
  duration: number;
  type: ConsultationType;
  topic: string;
  notes: string;
  status: ConsultationStatus;
  student: ConsultationStudent;
  parent: ConsultationParent;
  teacher?: ConsultationTeacher;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 캘린더 이벤트 형식
 */
export interface ConsultationCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: ConsultationType;
  status: ConsultationStatus;
  student: ConsultationStudent;
  parent: ConsultationParent;
}

// ============================================
// 필터 및 검색 타입
// ============================================

/**
 * 상담 필터 옵션
 */
export interface ConsultationFilter {
  search?: string;
  type?: ConsultationType;
  status?: ConsultationStatus;
  studentId?: string;
  teacherId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * 상담 정렬 옵션
 */
export interface ConsultationSort {
  field: 'date' | 'studentName' | 'status' | 'type';
  direction: 'asc' | 'desc';
}

/**
 * 상담 목록 쿼리 파라미터
 */
export interface ConsultationListQuery {
  filter?: ConsultationFilter;
  sort?: ConsultationSort;
  page?: number;
  pageSize?: number;
}

// ============================================
// 상담 생성/수정 타입
// ============================================

/**
 * 상담 예약 요청 입력 데이터
 */
export interface CreateConsultationInput {
  studentId: string;
  parentId?: string;
  teacherId?: string;
  date: string;
  time: string;
  duration: number;
  type: ConsultationType;
  topic: string;
  notes?: string;
}

/**
 * 상담 정보 수정 입력 데이터
 */
export interface UpdateConsultationInput {
  date?: string;
  time?: string;
  duration?: number;
  type?: ConsultationType;
  topic?: string;
  notes?: string;
  status?: ConsultationStatus;
}

/**
 * 상담 기록 작성 입력 데이터
 */
export interface ConsultationRecordInput {
  notes: string;
  status?: ConsultationStatus;
  duration?: number;
}

// ============================================
// API 응답 타입
// ============================================

/**
 * 상담 목록 API 응답
 */
export interface ConsultationListResponse {
  success: boolean;
  data?: {
    consultations: ConsultationListItem[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

/**
 * 상담 상세 API 응답
 */
export interface ConsultationDetailResponse {
  success: boolean;
  data?: ConsultationDetail;
  error?: string;
}

/**
 * 상담 생성/수정 API 응답
 */
export interface ConsultationMutationResponse {
  success: boolean;
  data?: ConsultationListItem;
  error?: string;
}

/**
 * 상담 삭제 API 응답
 */
export interface ConsultationDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 상담 통계 응답
 */
export interface ConsultationStatsResponse {
  success: boolean;
  data?: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    thisMonth: number;
    thisWeek: number;
    byType: Record<ConsultationType, number>;
  };
  error?: string;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 상담 유형을 한국어로 변환
 */
export function getConsultationTypeLabel(type: ConsultationType): string {
  return CONSULTATION_TYPE_LABELS[type];
}

/**
 * 상담 상태를 한국어로 변환
 */
export function getConsultationStatusLabel(status: ConsultationStatus): string {
  return CONSULTATION_STATUS_LABELS[status];
}

/**
 * 상담 일시를 포맷팅
 */
export function formatConsultationDateTime(date: string, time: string): string {
  const dateObj = new Date(`${date}T${time}`);
  return dateObj.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 상담 시간을 분 단위로 포맷팅
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}

/**
 * 오늘 이후의 예약된 상담인지 확인
 */
export function isUpcomingConsultation(date: string, status: ConsultationStatus): boolean {
  if (status !== 'scheduled') return false;
  const consultationDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return consultationDate >= today;
}

/**
 * 상담 예약 가능 시간 슬롯 생성
 */
export function generateTimeSlots(startHour = 9, endHour = 21, intervalMinutes = 30): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push(timeStr);
    }
  }
  return slots;
}

/**
 * 상담 캘린더 이벤트로 변환
 */
export function toCalendarEvent(consultation: ConsultationListItem, student: ConsultationStudent, parent: ConsultationParent): ConsultationCalendarEvent {
  const startDateTime = new Date(`${consultation.date}T${consultation.time}`);
  const endDateTime = new Date(startDateTime.getTime() + consultation.duration * 60000);

  return {
    id: consultation.id,
    title: `${consultation.studentName} - ${consultation.topic}`,
    start: startDateTime,
    end: endDateTime,
    type: consultation.type,
    status: consultation.status,
    student,
    parent,
  };
}

// Re-export base types for convenience
export type { Consultation, ConsultationType, ConsultationStatus };
