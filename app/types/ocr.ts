/**
 * OCR 멀티모델 지원을 위한 타입 정의
 */

// OCR 제공자 타입
export type OcrProvider = 'claude' | 'gemini' | 'openai' | 'google-vision';

// OCR 모델 정의
export interface OcrModel {
  provider: OcrProvider;
  model: string;
  name: string; // 표시용 이름
  price: string; // 가격 정보
  description?: string; // 모델 설명
}

// Claude 모델 목록
export const CLAUDE_MODELS: OcrModel[] = [
  {
    provider: 'claude',
    model: 'claude-3-5-haiku-20241022',
    name: 'Claude Haiku 3.5',
    price: '저렴',
    description: '빠르고 경제적인 모델, 기본 OCR에 적합',
  },
  {
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
    name: 'Claude Sonnet 3.5',
    price: '보통',
    description: '균형 잡힌 성능과 가격',
  },
  {
    provider: 'claude',
    model: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4.5',
    price: '높음',
    description: '최고 성능, 복잡한 문서에 적합',
  },
];

// Gemini 모델 목록
export const GEMINI_MODELS: OcrModel[] = [
  {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    price: '저렴',
    description: '빠른 처리 속도, 간단한 문서용',
  },
  {
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    price: '보통',
    description: '높은 정확도, 복잡한 문서용',
  },
  {
    provider: 'gemini',
    model: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    price: '저렴',
    description: '최신 모델, 빠른 처리',
  },
];

// OpenAI 모델 목록
export const OPENAI_MODELS: OcrModel[] = [
  {
    provider: 'openai',
    model: 'gpt-4o',
    name: 'GPT-4o',
    price: '보통',
    description: '고성능 멀티모달 모델',
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    price: '저렴',
    description: '경제적인 멀티모달 모델',
  },
];

// Google Vision 모델 (단일)
export const GOOGLE_VISION_MODELS: OcrModel[] = [
  {
    provider: 'google-vision',
    model: 'vision-api',
    name: 'Google Cloud Vision',
    price: '저렴',
    description: '전통적인 OCR, 단순 텍스트 추출에 최적화',
  },
];

// 전체 모델 목록
export const ALL_OCR_MODELS: OcrModel[] = [
  ...CLAUDE_MODELS,
  ...GEMINI_MODELS,
  ...OPENAI_MODELS,
  ...GOOGLE_VISION_MODELS,
];

// 제공자별 모델 매핑
export const MODELS_BY_PROVIDER: Record<OcrProvider, OcrModel[]> = {
  claude: CLAUDE_MODELS,
  gemini: GEMINI_MODELS,
  openai: OPENAI_MODELS,
  'google-vision': GOOGLE_VISION_MODELS,
};

// 제공자 정보
export interface OcrProviderInfo {
  id: OcrProvider;
  name: string;
  description: string;
  envKey: string; // 필요한 환경변수 키
}

// 제공자 목록
export const OCR_PROVIDERS: OcrProviderInfo[] = [
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    description: 'Anthropic의 Claude AI 모델',
    envKey: 'ANTHROPIC_API_KEY',
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    description: 'Google의 Gemini AI 모델',
    envKey: 'GEMINI_API_KEY',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI의 GPT 모델',
    envKey: 'OPENAI_API_KEY',
  },
  {
    id: 'google-vision',
    name: 'Google Cloud Vision',
    description: 'Google Cloud의 전통적 OCR 서비스',
    envKey: 'GOOGLE_CLOUD_VISION_API_KEY',
  },
];

// 기본 모델 설정 - Claude Sonnet 4.5 (OCR + 풀이 분석 + 정리 통합)
export const DEFAULT_OCR_MODEL: OcrModel = CLAUDE_MODELS[2]; // Claude Sonnet 4.5

// OCR 요청 타입
export interface OcrRequest {
  imageBase64: string;
  provider: OcrProvider;
  model: string;
}

// OCR 응답 타입 (기존 OcrResult와 호환)
export interface OcrResponse {
  text: string;
  confidence: number;
  problems: ExtractedProblem[];
  provider: OcrProvider;
  model: string;
  processingTime?: number; // 처리 시간 (ms)
}

// 추출된 문제 타입 (기존 타입과 호환)
export interface ExtractedProblem {
  number: string;
  content: string;
  type: '객관식' | '주관식' | '서술형';
  choices?: string[];
}

// API 상태 타입
export interface OcrApiStatus {
  available: boolean;
  mockMode: boolean;
  providers: {
    provider: OcrProvider;
    available: boolean;
    message: string;
  }[];
}

// 가격 레벨 색상 매핑 (UI용)
export const PRICE_COLORS: Record<string, string> = {
  저렴: 'text-green-600 bg-green-50',
  보통: 'text-yellow-600 bg-yellow-50',
  높음: 'text-red-600 bg-red-50',
};

// 제공자 아이콘 (이모지 대신 텍스트 라벨)
export const PROVIDER_LABELS: Record<OcrProvider, string> = {
  claude: 'Claude',
  gemini: 'Gemini',
  openai: 'OpenAI',
  'google-vision': 'GCP',
};

// ============================================
// OCR 분석 API 타입 정의 (PRD F3)
// ============================================

/**
 * OCR 분석 입력 타입
 * 손글씨 풀이 분석용
 */
export interface OcrAnalyzeInput {
  image: string;          // base64 또는 URL
  type: 'base64' | 'url';
  language?: string;      // 기본 ko
  provider?: OcrProvider; // 사용할 OCR 제공자
  model?: string;         // 사용할 모델
  enhanceContrast?: boolean; // 대비 조정 여부
}

/**
 * 텍스트 블록 정보
 */
export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * OCR 분석 결과 타입
 */
export interface OcrAnalyzeResult {
  text: string;               // 추출된 전체 텍스트
  confidence: number;         // 0-1 신뢰도
  blocks: TextBlock[];        // 블록별 텍스트
  mathExpressions?: string[]; // 인식된 수식
  language: string;           // 인식된 언어
  provider: OcrProvider;      // 사용된 제공자
  model: string;              // 사용된 모델
  processingTime: number;     // 처리 시간 (ms)
}
