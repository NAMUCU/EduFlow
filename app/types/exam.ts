/**
 * EduFlow 시험/테스트 관련 타입 정의
 *
 * 이 파일은 시험 생성, 관리, 결과 확인에 필요한 모든 타입을 정의합니다.
 * database.ts에서 기본 타입을 가져오고, 시험 전용 확장 타입을 정의합니다.
 */

import {
  Problem,
  Student,
  User,
  ProblemDifficulty,
  ProblemType,
} from './database';

// ============================================
// 시험 관련 ENUM 및 상수
// ============================================

/** 시험 상태 */
export type ExamStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

/** 시험 상태 한국어 라벨 */
export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  scheduled: '예정',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소됨',
};

/** 시험 탭 상태 */
export type ExamTab = 'scheduled' | 'in_progress' | 'completed';

/** 시험 탭 한국어 라벨 */
export const EXAM_TAB_LABELS: Record<ExamTab, string> = {
  scheduled: '예정',
  in_progress: '진행중',
  completed: '완료',
};

/** 학생 시험 진행 상태 */
export type StudentExamStatus = 'not_started' | 'in_progress' | 'submitted' | 'graded';

/** 학생 시험 상태 한국어 라벨 */
export const STUDENT_EXAM_STATUS_LABELS: Record<StudentExamStatus, string> = {
  not_started: '미시작',
  in_progress: '진행 중',
  submitted: '제출 완료',
  graded: '채점 완료',
};

/** 시험 유형 */
export type ExamType = 'regular' | 'mock' | 'placement' | 'practice';

/** 시험 유형 한국어 라벨 */
export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  regular: '정기 시험',
  mock: '모의고사',
  placement: '레벨 테스트',
  practice: '연습 시험',
};

/** 시험 생성 단계 */
export type ExamCreationStep =
  | 'basic_info'
  | 'select_problems'
  | 'set_points'
  | 'select_students'
  | 'set_schedule'
  | 'confirm';

/** 시험 생성 단계 한국어 라벨 */
export const EXAM_CREATION_STEP_LABELS: Record<ExamCreationStep, string> = {
  basic_info: '기본 정보',
  select_problems: '문제 선택',
  set_points: '배점 설정',
  select_students: '응시자 선택',
  set_schedule: '일정 설정',
  confirm: '확인',
};

// ============================================
// 기본 시험 타입 정의
// ============================================

/**
 * 시험 문제 (배점 포함)
 */
export interface ExamProblem {
  problem_id: string;
  order: number; // 문제 순서
  points: number; // 배점
}

/**
 * 시험 (exams)
 * 선생님이 학생들에게 부여하는 시험을 저장합니다.
 */
export interface Exam {
  id: string;                        // UUID, Primary Key
  title: string;                     // 시험 제목
  description: string | null;        // 시험 설명
  academy_id: string;                // 학원 ID
  teacher_id: string;                // 출제 선생님 ID
  exam_type: ExamType;               // 시험 유형
  subject: string;                   // 과목
  grade: string;                     // 대상 학년
  problems: ExamProblem[];           // 포함된 문제 목록 (배점 포함)
  total_points: number;              // 총점
  passing_score: number | null;      // 합격 점수 (선택)
  start_date: string;                // 시험 시작 일시 (ISO 8601)
  end_date: string | null;           // 시험 종료 일시 (선택)
  time_limit: number | null;         // 제한 시간 (분)
  status: ExamStatus;                // 시험 상태
  shuffle_problems: boolean;         // 문제 순서 섞기
  shuffle_options: boolean;          // 객관식 보기 섞기
  show_score_immediately: boolean;   // 제출 즉시 점수 공개
  show_answers_after_exam: boolean;  // 시험 종료 후 답안 공개
  created_at: string;                // 생성 일시
  updated_at: string;                // 수정 일시
}

/**
 * 학생 답안 상세
 */
export interface StudentExamAnswer {
  problem_id: string;
  answer: string;
  is_correct: boolean | null; // null: 미채점
  score: number;
  max_score: number;
  feedback?: string;
  answered_at?: string;
}

/**
 * 학생 시험 (student_exams)
 * 학생별 시험 진행 상황과 결과를 저장합니다.
 */
export interface StudentExam {
  id: string;                        // UUID, Primary Key
  exam_id: string;                   // 시험 ID
  student_id: string;                // 학생 ID
  status: StudentExamStatus;         // 진행 상태
  score: number | null;              // 총 점수
  percentage: number | null;         // 백분율 점수
  rank: number | null;               // 순위
  answers: StudentExamAnswer[] | null; // 학생의 답안
  feedback: string | null;           // 선생님 피드백
  started_at: string | null;         // 시작 시간
  submitted_at: string | null;       // 제출 시간
  graded_at: string | null;          // 채점 시간
  created_at: string;                // 생성 일시
  updated_at: string;                // 수정 일시
}

// ============================================
// 확장된 시험 타입 정의
// ============================================

/**
 * 시험 생성용 입력 데이터
 */
export interface ExamCreateInput {
  title: string;
  description?: string;
  academy_id: string;
  teacher_id: string;
  exam_type: ExamType;
  subject: string;
  grade: string;
  problems: ExamProblem[];
  total_points?: number;
  passing_score?: number;
  start_date: string;
  end_date?: string;
  time_limit?: number;
  student_ids: string[];
  class_ids?: string[];
  shuffle_problems?: boolean;
  shuffle_options?: boolean;
  show_score_immediately?: boolean;
  show_answers_after_exam?: boolean;
}

/**
 * 시험 수정용 입력 데이터
 */
export interface ExamUpdateInput {
  title?: string;
  description?: string;
  exam_type?: ExamType;
  subject?: string;
  grade?: string;
  problems?: ExamProblem[];
  total_points?: number;
  passing_score?: number;
  start_date?: string;
  end_date?: string;
  time_limit?: number;
  status?: ExamStatus;
  shuffle_problems?: boolean;
  shuffle_options?: boolean;
  show_score_immediately?: boolean;
  show_answers_after_exam?: boolean;
}

/**
 * 시험 필터 옵션
 */
export interface ExamFilterOptions {
  status?: ExamTab;
  exam_type?: ExamType;
  subject?: string;
  grade?: string;
  start_date_from?: string;
  start_date_to?: string;
  student_id?: string;
  teacher_id?: string;
  academy_id?: string;
  search?: string;
}

/**
 * 시험에 포함된 문제 (상세 정보 포함)
 */
export interface ExamProblemDetail extends Problem {
  order: number;
  points: number;
}

/**
 * 학생별 시험 현황 (상세 정보 포함)
 */
export interface StudentExamDetail extends StudentExam {
  student: Pick<Student, 'id' | 'grade' | 'school_name' | 'class_name'> & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  };
  progress_percentage: number;
  correct_count: number;
  total_count: number;
  remaining_time?: number;
}

/**
 * 시험 상세 정보 (문제와 학생 현황 포함)
 */
export interface ExamDetail extends Exam {
  teacher: Pick<User, 'id' | 'name' | 'email'>;
  problems_detail: ExamProblemDetail[];
  student_exams: StudentExamDetail[];
  statistics: ExamStatistics;
}

/**
 * 시험 통계
 */
export interface ExamStatistics {
  total_students: number;           // 전체 응시자 수
  not_started_count: number;        // 미시작
  in_progress_count: number;        // 진행 중
  submitted_count: number;          // 제출 완료
  graded_count: number;             // 채점 완료
  average_score: number | null;     // 평균 점수
  average_percentage: number | null; // 평균 백분율
  highest_score: number | null;     // 최고 점수
  lowest_score: number | null;      // 최저 점수
  pass_count: number;               // 합격자 수
  fail_count: number;               // 불합격자 수
  pass_rate: number | null;         // 합격률 (%)
  completion_rate: number;          // 완료율 (%)
}

/**
 * 시험 목록 아이템 (간략한 정보)
 */
export interface ExamListItem {
  id: string;
  title: string;
  description: string | null;
  exam_type: ExamType;
  subject: string;
  grade: string;
  total_points: number;
  start_date: string;
  end_date: string | null;
  time_limit: number | null;
  status: ExamStatus;
  problem_count: number;
  student_count: number;
  completed_count: number;
  average_score: number | null;
  created_at: string;
  teacher_name: string;
}

// ============================================
// API 응답 타입
// ============================================

/**
 * 시험 목록 API 응답
 */
export interface ExamListResponse {
  success: boolean;
  data?: {
    exams: ExamListItem[];
    total: number;
    page: number;
    page_size: number;
  };
  error?: string;
}

/**
 * 시험 상세 API 응답
 */
export interface ExamDetailResponse {
  success: boolean;
  data?: ExamDetail;
  error?: string;
}

/**
 * 시험 생성/수정 API 응답
 */
export interface ExamMutationResponse {
  success: boolean;
  data?: Exam;
  message?: string;
  error?: string;
}

/**
 * 시험 삭제 API 응답
 */
export interface ExamDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ============================================
// 시험 생성 폼 상태
// ============================================

/**
 * 시험 생성 폼 상태
 */
export interface ExamFormState {
  step: ExamCreationStep;
  data: {
    title: string;
    description: string;
    examType: ExamType;
    subject: string;
    grade: string;
    selectedProblems: (Problem & { points: number })[];
    totalPoints: number;
    passingScore: number | null;
    selectedStudents: (Student & { user: User })[];
    selectedClasses: string[];
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    timeLimit: number | null;
    shuffleProblems: boolean;
    shuffleOptions: boolean;
    showScoreImmediately: boolean;
    showAnswersAfterExam: boolean;
  };
  errors: Record<string, string | undefined>;
}

/**
 * 시험 생성 폼 초기 상태
 */
export const INITIAL_EXAM_FORM_STATE: ExamFormState = {
  step: 'basic_info',
  data: {
    title: '',
    description: '',
    examType: 'regular',
    subject: '',
    grade: '',
    selectedProblems: [],
    totalPoints: 100,
    passingScore: null,
    selectedStudents: [],
    selectedClasses: [],
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    timeLimit: 60,
    shuffleProblems: false,
    shuffleOptions: false,
    showScoreImmediately: false,
    showAnswersAfterExam: true,
  },
  errors: {},
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 시험 상태 판별 함수
 * @param exam 시험 정보
 * @returns 시험 상태
 */
export function getExamStatus(exam: Pick<Exam, 'start_date' | 'end_date' | 'status'>): ExamStatus {
  if (exam.status === 'cancelled') {
    return 'cancelled';
  }

  const now = new Date();
  const startDate = new Date(exam.start_date);
  const endDate = exam.end_date ? new Date(exam.end_date) : null;

  if (now < startDate) {
    return 'scheduled';
  }

  if (endDate && now > endDate) {
    return 'completed';
  }

  if (now >= startDate && (!endDate || now <= endDate)) {
    return 'in_progress';
  }

  return exam.status;
}

/**
 * 시험 탭 상태 판별 함수
 * @param exam 시험 정보
 * @returns 시험 탭 상태
 */
export function getExamTabStatus(exam: Pick<Exam, 'start_date' | 'end_date' | 'status'>): ExamTab {
  const status = getExamStatus(exam);
  if (status === 'cancelled' || status === 'completed') {
    return 'completed';
  }
  return status;
}

/**
 * 학생 시험 상태에 따른 색상 클래스 반환
 */
export function getStudentExamStatusColorClass(status: StudentExamStatus): string {
  const colorMap: Record<StudentExamStatus, string> = {
    not_started: 'text-gray-500 bg-gray-100',
    in_progress: 'text-blue-600 bg-blue-100',
    submitted: 'text-orange-600 bg-orange-100',
    graded: 'text-green-600 bg-green-100',
  };
  return colorMap[status];
}

/**
 * 시험 상태에 따른 색상 클래스 반환
 */
export function getExamStatusColorClass(status: ExamStatus): string {
  const colorMap: Record<ExamStatus, string> = {
    scheduled: 'text-blue-600 bg-blue-100',
    in_progress: 'text-yellow-600 bg-yellow-100',
    completed: 'text-green-600 bg-green-100',
    cancelled: 'text-red-600 bg-red-100',
  };
  return colorMap[status];
}

/**
 * 시험까지 남은 시간 계산
 */
export function getRemainingTimeToExam(startDate: string): string {
  const now = new Date();
  const start = new Date(startDate);
  const diff = start.getTime() - now.getTime();

  if (diff < 0) return '시작됨';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}일 ${hours}시간 후`;
  if (hours > 0) return `${hours}시간 ${minutes}분 후`;
  return `${minutes}분 후`;
}

/**
 * 날짜/시간 포맷팅 (YYYY.MM.DD HH:mm)
 */
export function formatExamDateTime(dateString: string | null): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

/**
 * 점수에 따른 등급 반환
 */
export function getScoreGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * 점수 등급에 따른 색상 클래스 반환
 */
export function getScoreGradeColorClass(percentage: number): string {
  if (percentage >= 90) return 'text-green-600 bg-green-100';
  if (percentage >= 80) return 'text-blue-600 bg-blue-100';
  if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
  if (percentage >= 60) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}
