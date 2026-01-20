/**
 * EduFlow 과제 관련 타입 정의
 *
 * 이 파일은 과제 생성, 배정, 관리에 필요한 모든 타입을 정의합니다.
 * database.ts에서 기본 타입을 가져오고, 추가 확장 타입을 정의합니다.
 */

import {
  Assignment,
  StudentAssignment,
  Problem,
  Student,
  User,
  AssignmentStatus,
  ProblemDifficulty,
  ProblemType,
} from './database';

// ============================================
// 과제 관련 ENUM 및 상수
// ============================================

/** 과제 탭 상태 */
export type AssignmentTab = 'in_progress' | 'scheduled' | 'completed';

/** 과제 탭 한국어 라벨 */
export const ASSIGNMENT_TAB_LABELS: Record<AssignmentTab, string> = {
  in_progress: '진행중',
  scheduled: '예정',
  completed: '완료',
};

/** 과제 생성 단계 */
export type AssignmentCreationStep =
  | 'basic_info'
  | 'select_problems'
  | 'select_students'
  | 'set_deadline'
  | 'confirm';

/** 과제 생성 단계 한국어 라벨 */
export const ASSIGNMENT_CREATION_STEP_LABELS: Record<AssignmentCreationStep, string> = {
  basic_info: '기본 정보',
  select_problems: '문제 선택',
  select_students: '학생 선택',
  set_deadline: '마감일 설정',
  confirm: '확인',
};

/** 채점 방식 */
export type GradingType = 'auto' | 'manual' | 'mixed';

/** 채점 방식 한국어 라벨 */
export const GRADING_TYPE_LABELS: Record<GradingType, string> = {
  auto: '자동 채점',
  manual: '수동 채점',
  mixed: '혼합 채점',
};

// ============================================
// 확장된 과제 타입 정의
// ============================================

/**
 * 과제 생성용 입력 데이터
 */
export interface AssignmentCreateInput {
  title: string;
  description?: string;
  academy_id: string;
  teacher_id: string;
  problems: string[]; // 문제 ID 배열
  student_ids: string[]; // 학생 ID 배열 (선택할 학생들)
  class_ids?: string[]; // 반 ID 배열 (반 전체 선택 시)
  due_date?: string; // ISO 8601 형식
  time_limit?: number; // 제한 시간 (분)
  grading_type?: GradingType;
  shuffle_problems?: boolean; // 문제 순서 섞기
  shuffle_options?: boolean; // 객관식 보기 섞기
  show_answers_after_submit?: boolean; // 제출 후 답안 공개
  allow_retry?: boolean; // 재시도 허용
  max_retry_count?: number; // 최대 재시도 횟수
}

/**
 * 과제 수정용 입력 데이터
 */
export interface AssignmentUpdateInput {
  title?: string;
  description?: string;
  problems?: string[];
  due_date?: string;
  time_limit?: number;
  is_active?: boolean;
}

/**
 * 과제 필터 옵션
 */
export interface AssignmentFilterOptions {
  status?: AssignmentTab;
  due_date_from?: string;
  due_date_to?: string;
  student_id?: string;
  teacher_id?: string;
  academy_id?: string;
  search?: string;
}

/**
 * 과제에 포함된 문제 (확장 정보 포함)
 */
export interface AssignmentProblem extends Problem {
  order: number; // 문제 순서
  points: number; // 배점
}

/**
 * 학생별 과제 현황 (상세 정보 포함)
 */
export interface StudentAssignmentDetail extends StudentAssignment {
  student: Pick<Student, 'id' | 'grade' | 'school_name' | 'class_name'> & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  };
  progress_percentage: number; // 진행률 (%)
  correct_count: number; // 정답 수
  total_count: number; // 전체 문제 수
  remaining_time?: number; // 남은 시간 (초)
}

/**
 * 과제 상세 정보 (문제와 학생 현황 포함)
 */
export interface AssignmentDetail extends Assignment {
  teacher: Pick<User, 'id' | 'name' | 'email'>;
  problems_detail: AssignmentProblem[];
  student_assignments: StudentAssignmentDetail[];
  statistics: AssignmentStatistics;
}

/**
 * 과제 통계
 */
export interface AssignmentStatistics {
  total_students: number; // 전체 학생 수
  not_started_count: number; // 미시작
  in_progress_count: number; // 진행 중
  submitted_count: number; // 제출 완료
  graded_count: number; // 채점 완료
  average_score: number | null; // 평균 점수
  highest_score: number | null; // 최고 점수
  lowest_score: number | null; // 최저 점수
  completion_rate: number; // 완료율 (%)
}

/**
 * 과제 목록 아이템 (간략한 정보)
 */
export interface AssignmentListItem {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_active: boolean;
  problem_count: number;
  student_count: number;
  completed_count: number;
  created_at: string;
  teacher_name: string;
  status: AssignmentTab;
}

// ============================================
// 학생 답안 관련 타입
// ============================================

/**
 * 학생 답안 상세
 */
export interface StudentAnswerDetail {
  problem_id: string;
  problem: Pick<Problem, 'id' | 'question' | 'answer' | 'type' | 'options' | 'solution'>;
  student_answer: string;
  is_correct: boolean | null; // null: 미채점
  score: number;
  max_score: number;
  feedback?: string;
  answered_at?: string;
}

/**
 * 학생 과제 제출 데이터
 */
export interface AssignmentSubmitInput {
  assignment_id: string;
  answers: {
    problem_id: string;
    answer: string;
  }[];
}

/**
 * 채점 입력 데이터
 */
export interface GradingInput {
  student_assignment_id: string;
  grades: {
    problem_id: string;
    is_correct: boolean;
    score: number;
    feedback?: string;
  }[];
  overall_feedback?: string;
}

// ============================================
// API 응답 타입
// ============================================

/**
 * 과제 목록 API 응답
 */
export interface AssignmentListResponse {
  success: boolean;
  data?: {
    assignments: AssignmentListItem[];
    total: number;
    page: number;
    page_size: number;
  };
  error?: string;
}

/**
 * 과제 상세 API 응답
 */
export interface AssignmentDetailResponse {
  success: boolean;
  data?: AssignmentDetail;
  error?: string;
}

/**
 * 과제 생성/수정 API 응답
 */
export interface AssignmentMutationResponse {
  success: boolean;
  data?: Assignment;
  error?: string;
}

/**
 * 과제 삭제 API 응답
 */
export interface AssignmentDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ============================================
// 과제 생성 폼 상태
// ============================================

/**
 * 과제 생성 폼 상태
 */
export interface AssignmentFormState {
  step: AssignmentCreationStep;
  data: {
    title: string;
    description: string;
    selectedProblems: Problem[];
    selectedStudents: (Student & { user: User })[];
    selectedClasses: string[];
    dueDate: string;
    dueTime: string;
    timeLimit: number | null;
    gradingType: GradingType;
    shuffleProblems: boolean;
    shuffleOptions: boolean;
    showAnswersAfterSubmit: boolean;
    allowRetry: boolean;
    maxRetryCount: number;
  };
  errors: Record<string, string | undefined>;
}

/**
 * 과제 생성 폼 초기 상태
 */
export const INITIAL_ASSIGNMENT_FORM_STATE: AssignmentFormState = {
  step: 'basic_info',
  data: {
    title: '',
    description: '',
    selectedProblems: [],
    selectedStudents: [],
    selectedClasses: [],
    dueDate: '',
    dueTime: '23:59',
    timeLimit: null,
    gradingType: 'auto',
    shuffleProblems: false,
    shuffleOptions: false,
    showAnswersAfterSubmit: true,
    allowRetry: false,
    maxRetryCount: 1,
  },
  errors: {},
};

// ============================================
// 유틸리티 타입 및 함수
// ============================================

/**
 * 과제 상태 판별 함수
 * @param assignment 과제 정보
 * @returns 과제 탭 상태
 */
export function getAssignmentTabStatus(assignment: Pick<Assignment, 'due_date' | 'is_active'>): AssignmentTab {
  const now = new Date();
  const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;

  if (!assignment.is_active) {
    return 'completed';
  }

  if (dueDate && dueDate < now) {
    return 'completed';
  }

  // 아직 시작 시간 전이면 'scheduled'로 표시할 수 있지만,
  // 현재 구현에서는 활성화되어 있고 마감 전이면 'in_progress'
  return 'in_progress';
}

/**
 * 학생 과제 상태에 따른 색상 클래스 반환
 */
export function getStatusColorClass(status: AssignmentStatus): string {
  const colorMap: Record<AssignmentStatus, string> = {
    not_started: 'text-gray-500 bg-gray-100',
    in_progress: 'text-blue-600 bg-blue-100',
    submitted: 'text-orange-600 bg-orange-100',
    graded: 'text-green-600 bg-green-100',
  };
  return colorMap[status];
}

/**
 * 난이도에 따른 색상 클래스 반환
 */
export function getDifficultyColorClass(difficulty: ProblemDifficulty): string {
  const colorMap: Record<ProblemDifficulty, string> = {
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100',
  };
  return colorMap[difficulty];
}

/**
 * 마감일까지 남은 시간 계산
 */
export function getRemainingTime(dueDate: string | null): string {
  if (!dueDate) return '마감일 없음';

  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();

  if (diff < 0) return '마감됨';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  return `${minutes}분 남음`;
}

/**
 * 날짜 포맷팅 (YYYY.MM.DD HH:mm)
 */
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}
