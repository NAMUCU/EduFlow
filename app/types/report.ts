/**
 * EduFlow 학습 리포트 타입 정의
 *
 * 이 파일은 학생별 학습 리포트 생성 및 관리에 필요한 모든 타입을 정의합니다.
 * 성적 분석, 출결 분석, AI 추천 사항 등을 포함합니다.
 */

// ============================================
// 리포트 기간 및 상태 타입
// ============================================

/** 리포트 기간 유형 */
export type ReportPeriodType = 'weekly' | 'monthly';

/** 리포트 상태 */
export type ReportStatus = 'draft' | 'generated' | 'sent';

/** 리포트 기간 한국어 라벨 */
export const REPORT_PERIOD_LABELS: Record<ReportPeriodType, string> = {
  weekly: '주간',
  monthly: '월간',
};

/** 리포트 상태 한국어 라벨 */
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: '초안',
  generated: '생성완료',
  sent: '발송완료',
};

/** 리포트 상태 색상 */
export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  generated: 'bg-blue-100 text-blue-700',
  sent: 'bg-green-100 text-green-700',
};

// ============================================
// 리포트 기간 인터페이스
// ============================================

/**
 * 리포트 기간 정보
 */
export interface ReportPeriod {
  type: ReportPeriodType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;     // 표시용 라벨 (예: '2025년 1월 2주차')
  year: number;
  month: number;
  week?: number;     // 주간 리포트인 경우
}

// ============================================
// 성적 분석 관련 타입
// ============================================

/**
 * 과목별 성적 정보
 */
export interface SubjectGradeInfo {
  subject: string;
  currentScore: number;
  previousScore: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  testCount: number;
  trend: 'up' | 'down' | 'stable';
  changeAmount: number;
}

/**
 * 단원별 성적 정보
 */
export interface UnitGradeInfo {
  subject: string;
  unitName: string;
  correctCount: number;
  totalCount: number;
  correctRate: number;
  isWeak: boolean;   // 취약 단원 여부
}

/**
 * 성적 분석 섹션
 */
export interface GradeAnalysisSection {
  // 전체 요약
  overallScore: number;
  previousOverallScore: number;
  overallTrend: 'up' | 'down' | 'stable';
  overallChangeAmount: number;

  // 과목별 성적
  subjectGrades: SubjectGradeInfo[];

  // 단원별 분석
  unitAnalysis: UnitGradeInfo[];

  // 취약 단원
  weakUnits: UnitGradeInfo[];

  // 강점 단원
  strongUnits: UnitGradeInfo[];

  // 성적 분포 (점수대별)
  gradeDistribution: {
    range: string;  // 예: '90-100'
    count: number;
    percentage: number;
  }[];

  // 일별 성적 추이
  dailyScoreTrend: {
    date: string;
    score: number;
    subject?: string;
  }[];
}

// ============================================
// 출결 분석 관련 타입
// ============================================

/**
 * 출결 분석 섹션
 */
export interface AttendanceAnalysisSection {
  // 기간 내 총 수업일
  totalClassDays: number;

  // 출결 현황
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  sickLeaveDays: number;

  // 출석률
  attendanceRate: number;
  previousAttendanceRate: number;
  attendanceRateTrend: 'up' | 'down' | 'stable';

  // 일별 출결 기록
  dailyAttendance: {
    date: string;
    status: 'present' | 'absent' | 'late' | 'early_leave' | 'sick_leave';
    checkInTime?: string;
    checkOutTime?: string;
    memo?: string;
  }[];

  // 특이사항
  notes?: string;
}

// ============================================
// AI 분석 관련 타입
// ============================================

/**
 * AI 분석 결과 - 성적 추이 분석
 */
export interface AIScoreTrendAnalysis {
  summary: string;          // 전체 요약
  trendDescription: string; // 성적 추이 설명
  keyInsights: string[];    // 주요 인사이트
}

/**
 * AI 분석 결과 - 취약 단원 분석
 */
export interface AIWeakUnitAnalysis {
  units: {
    subject: string;
    unitName: string;
    description: string;     // 왜 어려워하는지 분석
    suggestedPriority: number; // 학습 우선순위 (1이 가장 높음)
  }[];
  overallDescription: string;
}

/**
 * AI 분석 결과 - 학습 추천
 */
export interface AIStudyRecommendation {
  // 단기 추천 (다음 주)
  shortTermGoals: {
    goal: string;
    reason: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }[];

  // 중기 추천 (다음 달)
  midTermGoals: {
    goal: string;
    reason: string;
  }[];

  // 추천 학습 자료
  recommendedMaterials: {
    type: 'problem' | 'concept' | 'video' | 'worksheet';
    title: string;
    description: string;
    subject: string;
    unit?: string;
  }[];

  // 학습 전략 제안
  studyStrategies: string[];

  // 동기부여 메시지
  motivationMessage: string;
}

/**
 * AI 분석 섹션 전체
 */
export interface AIAnalysisSection {
  scoreTrendAnalysis: AIScoreTrendAnalysis;
  weakUnitAnalysis: AIWeakUnitAnalysis;
  studyRecommendation: AIStudyRecommendation;

  // 학부모용 메시지
  parentMessage: string;

  // 학생용 메시지
  studentMessage: string;

  // 선생님 코멘트 (AI가 생성한 초안)
  teacherCommentDraft: string;

  // AI 생성 시각
  generatedAt: string;

  // AI 모델 정보
  modelInfo?: {
    model: string;
    confidence?: number;
  };
}

// ============================================
// 리포트 섹션 타입
// ============================================

/**
 * 리포트 섹션 유형
 */
export type ReportSectionType =
  | 'summary'        // 요약
  | 'grade'          // 성적 분석
  | 'attendance'     // 출결 분석
  | 'ai_analysis'    // AI 분석
  | 'recommendation' // 추천 사항
  | 'teacher_comment'; // 선생님 코멘트

/**
 * 리포트 섹션 기본 인터페이스
 */
export interface ReportSection {
  id: string;
  type: ReportSectionType;
  title: string;
  order: number;
  isVisible: boolean;
}

// ============================================
// 메인 리포트 인터페이스
// ============================================

/**
 * 학생 기본 정보 (리포트용)
 */
export interface ReportStudentInfo {
  id: string;
  name: string;
  grade: string;
  school: string;
  className?: string;
  subjects: string[];
  profileImage?: string;
}

/**
 * 학부모 정보 (리포트용)
 */
export interface ReportParentInfo {
  id?: string;
  name: string;
  phone: string;
  email?: string;
}

/**
 * 학원 정보 (리포트용)
 */
export interface ReportAcademyInfo {
  id: string;
  name: string;
  teacherName: string;
  teacherPhone?: string;
}

/**
 * 메인 리포트 인터페이스
 */
export interface Report {
  // 기본 정보
  id: string;
  academyId: string;
  studentId: string;

  // 참조 정보
  student: ReportStudentInfo;
  parent?: ReportParentInfo;
  academy: ReportAcademyInfo;

  // 리포트 기간
  period: ReportPeriod;

  // 리포트 상태
  status: ReportStatus;

  // 분석 섹션들
  gradeAnalysis: GradeAnalysisSection;
  attendanceAnalysis: AttendanceAnalysisSection;
  aiAnalysis: AIAnalysisSection;

  // 선생님 최종 코멘트 (AI 초안 수정 가능)
  teacherComment?: string;

  // 발송 정보
  sentAt?: string;
  sentTo?: {
    type: 'sms' | 'email' | 'kakao';
    recipient: string;
  }[];

  // PDF 정보
  pdfUrl?: string;
  pdfGeneratedAt?: string;

  // 타임스탬프
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * 리포트 목록 아이템 (목록 조회용)
 */
export interface ReportListItem {
  id: string;
  studentId: string;
  studentName: string;
  studentGrade: string;
  studentSchool: string;
  period: ReportPeriod;
  status: ReportStatus;
  overallScore: number;
  previousScore: number;
  scoreTrend: 'up' | 'down' | 'stable';
  sentAt?: string;
  createdAt: string;
}

// ============================================
// API 요청/응답 타입
// ============================================

/**
 * 리포트 생성 요청
 */
export interface ReportGenerateRequest {
  studentId: string;
  periodType: ReportPeriodType;
  startDate: string;
  endDate: string;
  includeAIAnalysis?: boolean;
}

/**
 * 리포트 생성 응답
 */
export interface ReportGenerateResponse {
  success: boolean;
  data?: Report;
  message?: string;
  error?: string;
}

/**
 * 리포트 목록 조회 필터
 */
export interface ReportListFilter {
  academyId?: string;
  studentId?: string;
  periodType?: ReportPeriodType;
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * 리포트 목록 응답
 */
export interface ReportListResponse {
  success: boolean;
  data?: {
    reports: ReportListItem[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

/**
 * 리포트 상세 조회 응답
 */
export interface ReportDetailResponse {
  success: boolean;
  data?: Report;
  error?: string;
}

/**
 * 리포트 저장 요청
 */
export interface ReportSaveRequest {
  id?: string;  // 없으면 새로 생성
  studentId: string;
  period: ReportPeriod;
  gradeAnalysis: GradeAnalysisSection;
  attendanceAnalysis: AttendanceAnalysisSection;
  aiAnalysis?: AIAnalysisSection;
  teacherComment?: string;
  status?: ReportStatus;
}

/**
 * 리포트 저장 응답
 */
export interface ReportSaveResponse {
  success: boolean;
  data?: Report;
  message?: string;
  error?: string;
}

/**
 * 리포트 발송 요청
 */
export interface ReportSendRequest {
  reportId: string;
  sendType: 'sms' | 'email' | 'kakao';
  recipient?: string;  // 없으면 학부모 기본 연락처 사용
  message?: string;    // 추가 메시지
}

/**
 * 리포트 발송 응답
 */
export interface ReportSendResponse {
  success: boolean;
  data?: {
    sentAt: string;
    sentTo: string;
    messageId?: string;
  };
  message?: string;
  error?: string;
}

/**
 * PDF 생성 요청
 */
export interface ReportPDFRequest {
  reportId: string;
  includeAIAnalysis?: boolean;
  includeTeacherComment?: boolean;
}

/**
 * PDF 생성 응답
 */
export interface ReportPDFResponse {
  success: boolean;
  data?: {
    pdfUrl: string;
    generatedAt: string;
  };
  error?: string;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 점수 변화에 따른 추이 판단
 */
export function calculateScoreTrend(
  currentScore: number,
  previousScore: number
): 'up' | 'down' | 'stable' {
  const diff = currentScore - previousScore;
  if (diff > 3) return 'up';
  if (diff < -3) return 'down';
  return 'stable';
}

/**
 * 리포트 기간 라벨 생성
 */
export function generatePeriodLabel(
  periodType: ReportPeriodType,
  startDate: string,
  endDate: string
): string {
  const start = new Date(startDate);
  const year = start.getFullYear();
  const month = start.getMonth() + 1;

  if (periodType === 'monthly') {
    return `${year}년 ${month}월`;
  }

  // 주간: 해당 월의 몇 번째 주인지 계산
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const dayOfMonth = start.getDate();
  const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);

  return `${year}년 ${month}월 ${weekOfMonth}주차`;
}

/**
 * 출석률 계산
 */
export function calculateAttendanceRate(
  presentDays: number,
  totalDays: number
): number {
  if (totalDays === 0) return 0;
  return Math.round((presentDays / totalDays) * 100);
}

/**
 * 취약 단원 판별 (정답률 기준)
 */
export function isWeakUnit(
  correctRate: number,
  threshold: number = 60
): boolean {
  return correctRate < threshold;
}

/**
 * 점수 변화량 포맷팅
 */
export function formatScoreChange(change: number): string {
  if (change > 0) return `+${change}점`;
  if (change < 0) return `${change}점`;
  return '변동없음';
}

/**
 * 리포트 상태 색상 반환
 */
export function getReportStatusColor(status: ReportStatus): string {
  return REPORT_STATUS_COLORS[status];
}

/**
 * 리포트 상태 라벨 반환
 */
export function getReportStatusLabel(status: ReportStatus): string {
  return REPORT_STATUS_LABELS[status];
}

/**
 * 리포트 기간 유형 라벨 반환
 */
export function getReportPeriodLabel(periodType: ReportPeriodType): string {
  return REPORT_PERIOD_LABELS[periodType];
}

// ============================================
// 자동 보고서 생성 관련 타입
// ============================================

/** 보고서 대상 유형 */
export type ReportTargetType = 'parent' | 'teacher';

/** 보고서 대상 유형 한국어 라벨 */
export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  parent: '학부모용',
  teacher: '강사용',
};

/**
 * 학부모용 보고서 - 대화거리 중심
 * 가정에서 자녀와 나눌 대화 주제와 칭찬/격려 포인트 제공
 */
export interface ParentReport {
  /** 보고서 ID */
  id: string;
  /** 학생 ID */
  studentId: string;
  /** 학생 이름 */
  studentName: string;
  /** 보고서 기간 */
  period: ReportPeriod;
  /** 생성 일시 */
  generatedAt: string;

  /** 이번 주/월 핵심 요약 (1-2문장) */
  summary: string;

  /** 칭찬 포인트 - 잘한 점 */
  praisePoints: {
    title: string;
    description: string;
    emoji?: string;
  }[];

  /** 대화거리 - 가정에서 나눌 수 있는 주제 */
  conversationTopics: {
    topic: string;
    suggestedQuestion: string;
    context: string;
  }[];

  /** 격려 메시지 - 부족한 부분에 대한 긍정적 피드백 */
  encouragementMessage: string;

  /** 다음 주/월 목표 */
  upcomingGoals: {
    goal: string;
    howToSupport: string;
  }[];

  /** 출석 요약 */
  attendanceSummary: {
    totalDays: number;
    presentDays: number;
    message: string;
  };

  /** 성적 요약 (구체적 점수보다는 경향 중심) */
  gradeSummary: {
    trend: 'improving' | 'stable' | 'needs_attention';
    trendMessage: string;
    strongSubjects: string[];
    focusAreas: string[];
  };

  /** AI 생성 종합 코멘트 */
  aiComment: string;
}

/**
 * 강사용 보고서 - 상세 데이터 중심
 * 수업 준비와 학생 관리에 필요한 상세 정보 제공
 */
export interface TeacherReport {
  /** 보고서 ID */
  id: string;
  /** 학생 ID */
  studentId: string;
  /** 학생 이름 */
  studentName: string;
  /** 보고서 기간 */
  period: ReportPeriod;
  /** 생성 일시 */
  generatedAt: string;

  /** 성적 상세 분석 */
  gradeAnalysis: {
    /** 전체 평균 점수 */
    overallAverage: number;
    /** 이전 기간 대비 변화 */
    changeFromPrevious: number;
    /** 과목별 상세 */
    bySubject: {
      subject: string;
      average: number;
      change: number;
      testsCount: number;
      highestScore: number;
      lowestScore: number;
    }[];
    /** 단원별 정답률 */
    byUnit: {
      subject: string;
      unit: string;
      correctRate: number;
      totalProblems: number;
      isWeak: boolean;
    }[];
  };

  /** 취약점 분석 */
  weaknessAnalysis: {
    /** 취약 단원 TOP 5 */
    weakUnits: {
      subject: string;
      unit: string;
      correctRate: number;
      suggestedAction: string;
    }[];
    /** 오답 패턴 */
    errorPatterns: {
      pattern: string;
      frequency: number;
      description: string;
    }[];
  };

  /** 출결 상세 */
  attendanceDetails: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
    /** 특이사항 */
    notes: string[];
  };

  /** 과제 수행 현황 */
  assignmentStatus: {
    totalAssigned: number;
    completed: number;
    pending: number;
    averageScore: number;
    onTimeRate: number;
  };

  /** 학습 추천 사항 */
  recommendations: {
    priority: number;
    type: 'concept_review' | 'practice' | 'challenge' | 'counseling';
    title: string;
    description: string;
    targetUnit?: string;
  }[];

  /** 다음 수업 준비 사항 */
  nextClassPrep: {
    suggestedTopics: string[];
    reviewNeeded: string[];
    challengeReady: string[];
  };

  /** AI 분석 종합 */
  aiAnalysis: {
    summary: string;
    keyInsights: string[];
    actionItems: string[];
  };
}

/**
 * 자동 보고서 생성 요청
 */
export interface AutoReportGenerateRequest {
  /** 학생 ID 목록 (비어있으면 전체 학생) */
  studentIds?: string[];
  /** 보고서 기간 유형 */
  periodType: ReportPeriodType;
  /** 시작일 (YYYY-MM-DD) */
  startDate: string;
  /** 종료일 (YYYY-MM-DD) */
  endDate: string;
  /** 생성할 보고서 유형 */
  targetTypes: ReportTargetType[];
  /** 학원 ID */
  academyId: string;
}

/**
 * 자동 보고서 생성 결과
 */
export interface AutoReportGenerateResult {
  /** 학생 ID */
  studentId: string;
  /** 학생 이름 */
  studentName: string;
  /** 학부모용 보고서 */
  parentReport?: ParentReport;
  /** 강사용 보고서 */
  teacherReport?: TeacherReport;
  /** 성공 여부 */
  success: boolean;
  /** 에러 메시지 (실패 시) */
  error?: string;
}

/**
 * 자동 보고서 생성 응답
 */
export interface AutoReportGenerateResponse {
  success: boolean;
  data?: {
    results: AutoReportGenerateResult[];
    totalStudents: number;
    successCount: number;
    failCount: number;
    generatedAt: string;
  };
  error?: string;
}
