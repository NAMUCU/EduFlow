// PDF 출력 관련 타입 정의

// 문제 타입
export interface Problem {
  id: string;
  question: string;
  answer: string;
  solution: string;
  difficulty: '하' | '중' | '상';
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

// PDF 출력 옵션
export interface PrintOptions {
  // 기본 정보
  title: string;
  academyName: string;
  academyLogo?: string; // Base64 인코딩된 이미지 또는 URL
  studentName?: string;
  date: string;

  // 출력 내용 설정
  contentType: 'problem_only' | 'with_answer' | 'with_solution';

  // 템플릿 선택
  template: 'default' | 'exam' | 'wrong_note';

  // 문제 순서
  problemOrder: 'sequential' | 'random';

  // 표시 옵션
  showDifficulty: boolean;
  showProblemNumber: boolean;
  showProblemType: boolean;

  // 페이지 설정
  pageSize: 'A4';
  orientation: 'portrait' | 'landscape';
}

// PDF 생성 요청
export interface PdfGenerateRequest {
  problems: Problem[];
  options: PrintOptions;
}

// PDF 생성 응답
export interface PdfGenerateResponse {
  success: boolean;
  pdfBase64?: string;
  fileName?: string;
  pageCount?: number;
  error?: string;
}

// 템플릿별 레이아웃 설정
export interface TemplateLayout {
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  headerHeight: number;
  footerHeight: number;
  columns: 1 | 2;
  fontSize: {
    title: number;
    subtitle: number;
    question: number;
    answer: number;
    solution: number;
  };
  lineHeight: number;
}

// 기본 출력 옵션 (상수)
export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  title: '문제지',
  academyName: '',
  studentName: '',
  date: new Date().toISOString().split('T')[0],
  contentType: 'problem_only',
  template: 'default',
  problemOrder: 'sequential',
  showDifficulty: true,
  showProblemNumber: true,
  showProblemType: false,
  pageSize: 'A4',
  orientation: 'portrait',
};

// 템플릿별 기본 레이아웃
export const TEMPLATE_LAYOUTS: Record<PrintOptions['template'], TemplateLayout> = {
  default: {
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
    headerHeight: 30,
    footerHeight: 15,
    columns: 1,
    fontSize: {
      title: 18,
      subtitle: 12,
      question: 11,
      answer: 10,
      solution: 9,
    },
    lineHeight: 1.5,
  },
  exam: {
    marginTop: 15,
    marginBottom: 15,
    marginLeft: 15,
    marginRight: 15,
    headerHeight: 25,
    footerHeight: 15,
    columns: 2,
    fontSize: {
      title: 16,
      subtitle: 10,
      question: 10,
      answer: 9,
      solution: 8,
    },
    lineHeight: 1.4,
  },
  wrong_note: {
    marginTop: 25,
    marginBottom: 20,
    marginLeft: 25,
    marginRight: 25,
    headerHeight: 35,
    footerHeight: 15,
    columns: 1,
    fontSize: {
      title: 18,
      subtitle: 12,
      question: 12,
      answer: 11,
      solution: 10,
    },
    lineHeight: 1.6,
  },
};

// UI 텍스트 상수 (한국어)
export const PDF_UI_TEXT = {
  // 출력 옵션
  TITLE: '제목',
  ACADEMY_NAME: '학원명',
  ACADEMY_LOGO: '학원 로고',
  STUDENT_NAME: '학생 이름',
  DATE: '날짜',

  // 출력 내용
  CONTENT_TYPE: '출력 내용',
  PROBLEM_ONLY: '문제만',
  WITH_ANSWER: '문제 + 정답',
  WITH_SOLUTION: '문제 + 정답 + 풀이',

  // 템플릿
  TEMPLATE: '템플릿 선택',
  TEMPLATE_DEFAULT: '기본 문제지',
  TEMPLATE_EXAM: '시험지 (2단)',
  TEMPLATE_WRONG_NOTE: '오답 노트',

  // 정렬
  PROBLEM_ORDER: '문제 순서',
  SEQUENTIAL: '순서대로',
  RANDOM: '랜덤',

  // 표시 옵션
  DISPLAY_OPTIONS: '표시 옵션',
  SHOW_DIFFICULTY: '난이도 표시',
  SHOW_PROBLEM_NUMBER: '문제 번호 표시',
  SHOW_PROBLEM_TYPE: '문제 유형 표시',

  // 버튼
  PREVIEW: '미리보기',
  DOWNLOAD: '다운로드',
  PRINT: '인쇄',

  // 문제지 텍스트
  ANSWER_LABEL: '정답',
  SOLUTION_LABEL: '풀이',
  DIFFICULTY_LABEL: '난이도',
  PAGE_LABEL: '페이지',

  // 메시지
  NO_PROBLEMS_SELECTED: '선택된 문제가 없습니다.',
  GENERATING_PDF: 'PDF 생성 중...',
  PDF_GENERATED: 'PDF가 생성되었습니다.',
  PDF_ERROR: 'PDF 생성 중 오류가 발생했습니다.',
};

// ============================================
// PDF.co API 관련 타입 정의 (PRD F3)
// ============================================

/**
 * 생성된 문제 타입 (AI 생성 문제용)
 * PDF 변환 시 사용되는 문제 형식
 */
export interface GeneratedProblem {
  id: string;
  question: string;
  answer: string;
  solution?: string;
  difficulty: '하' | '중' | '상';
  type?: string;
  subject?: string;
  grade?: string;
  unit?: string;
  options?: Array<{ id: string; text: string; isCorrect?: boolean }>;
  imageUrl?: string;
}

/**
 * PDF 생성 입력 타입
 * 문제지, 정답지, 제출물 PDF 생성에 사용
 */
export interface GeneratePdfInput {
  /** PDF 유형: problems(문제지), answers(정답지), submission(제출물) */
  type: 'problems' | 'answers' | 'submission';
  /** 문제 목록 (problems, answers 유형에 필수) */
  problems?: GeneratedProblem[];
  /** 학생 제출 데이터 (submission 유형에 필수) */
  submissionData?: {
    studentName: string;
    submittedAt: string;
    answers: Array<{ problemId: string; answer: string }>;
  };
  /** PDF 생성 옵션 */
  options: {
    /** PDF 제목 */
    title?: string;
    /** 정답 표시 여부 */
    showAnswers?: boolean;
    /** 해설 표시 여부 */
    showExplanations?: boolean;
    /** 폰트 크기 (기본: 11) */
    fontSize?: number;
    /** 용지 크기 (기본: A4) */
    paperSize?: 'A4' | 'Letter';
    /** 학원명 */
    academyName?: string;
    /** 학원 로고 URL */
    academyLogo?: string;
    /** 학생 이름 */
    studentName?: string;
    /** 날짜 */
    date?: string;
  };
}

/**
 * PDF 생성 결과 타입
 */
export interface PdfResult {
  /** PDF 파일 URL (Supabase Storage 또는 PDF.co) */
  url: string;
  /** 다운로드 링크 */
  downloadUrl: string;
  /** URL 만료 시간 (ISO 8601 형식) */
  expiresAt: string;
  /** 페이지 수 */
  pageCount: number;
  /** 파일 크기 (bytes) */
  fileSize?: number;
  /** 파일명 */
  fileName?: string;
}

/**
 * PDF.co API 응답 타입
 */
export interface PdfCoApiResponse {
  url?: string;
  error?: boolean;
  status?: number;
  message?: string;
  name?: string;
  pageCount?: number;
  credits?: number;
  remainingCredits?: number;
}

/**
 * PDF 생성 API 응답 타입
 */
export interface GeneratePdfResponse {
  success: boolean;
  data?: PdfResult;
  error?: string;
  details?: string;
}

/**
 * PDF 템플릿 타입
 */
export type PdfTemplateType = 'problems' | 'answers' | 'submission';

/**
 * PDF.co API 요청 옵션
 */
export interface PdfCoOptions {
  /** HTML 콘텐츠 */
  html?: string;
  /** 템플릿 ID */
  templateId?: string;
  /** 템플릿 데이터 */
  templateData?: Record<string, unknown>;
  /** 용지 크기 */
  paperSize?: 'A4' | 'Letter';
  /** 방향 */
  orientation?: 'Portrait' | 'Landscape';
  /** 여백 (mm) */
  margins?: string;
  /** 헤더 HTML */
  headerHtml?: string;
  /** 푸터 HTML */
  footerHtml?: string;
  /** 파일명 */
  name?: string;
}

// PDF.co 관련 상수
export const PDF_CO_CONFIG = {
  /** API 기본 URL */
  API_URL: 'https://api.pdf.co/v1',
  /** HTML to PDF 엔드포인트 */
  HTML_TO_PDF_ENDPOINT: '/pdf/convert/from/html',
  /** URL to PDF 엔드포인트 */
  URL_TO_PDF_ENDPOINT: '/pdf/convert/from/url',
  /** 기본 용지 크기 */
  DEFAULT_PAPER_SIZE: 'A4' as const,
  /** 기본 여백 (mm) */
  DEFAULT_MARGINS: '10',
  /** URL 유효 기간 (1시간) */
  URL_EXPIRY_HOURS: 1,
};

// 난이도 색상 매핑
export const DIFFICULTY_COLORS = {
  '하': '#10B981', // 초록
  '중': '#F59E0B', // 노랑
  '상': '#EF4444', // 빨강
} as const;

// 난이도 라벨 (영문 -> 한글)
export const DIFFICULTY_LABELS = {
  easy: '하',
  medium: '중',
  hard: '상',
} as const;
