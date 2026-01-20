import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeHandwriting,
  isProviderAvailable,
  getAvailableProviders,
  urlToBase64,
} from '@/lib/ocr';
import {
  OcrProvider,
  OcrAnalyzeInput,
  DEFAULT_OCR_MODEL,
  MODELS_BY_PROVIDER,
} from '@/types/ocr';

// 허용되는 이미지 MIME 타입
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
];

// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * 유효한 provider인지 확인
 */
function isValidProvider(provider: string): boolean {
  return ['claude', 'gemini', 'openai', 'google-vision'].includes(provider);
}

/**
 * POST /api/ocr/analyze
 * 손글씨 풀이 이미지를 분석합니다.
 *
 * PRD F3. OCR 분석
 * - Google Cloud Vision API로 손글씨 풀이 분석
 * - 텍스트 추출, 신뢰도, 수식 인식 결과 반환
 *
 * Request Body (JSON):
 * {
 *   image: string,           // base64 또는 URL
 *   type: 'base64' | 'url',  // 이미지 타입
 *   language?: string,       // 언어 (기본값: 'ko')
 *   provider?: string,       // OCR 제공자 (기본값: claude)
 *   model?: string,          // 모델 (기본값: 제공자별 기본 모델)
 *   enhanceContrast?: boolean // 대비 조정 여부 (향후 구현)
 * }
 *
 * Response:
 * - 성공: { success: true, data: OcrAnalyzeResult }
 * - 실패: { success: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // JSON 요청만 허용
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content-Type은 application/json이어야 합니다.',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // 필수 필드 검증
    if (!body.image) {
      return NextResponse.json(
        { success: false, error: 'image 필드가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!body.type || !['base64', 'url'].includes(body.type)) {
      return NextResponse.json(
        { success: false, error: "type 필드는 'base64' 또는 'url'이어야 합니다." },
        { status: 400 }
      );
    }

    // URL 타입인 경우 URL 유효성 검증
    if (body.type === 'url') {
      try {
        new URL(body.image);
      } catch {
        return NextResponse.json(
          { success: false, error: '유효하지 않은 URL입니다.' },
          { status: 400 }
        );
      }
    }

    // base64 타입인 경우 크기 검증
    if (body.type === 'base64') {
      const base64Data = body.image.replace(/^data:image\/[a-z]+;base64,/, '');
      const estimatedSize = (base64Data.length * 3) / 4;

      if (estimatedSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 가능합니다.`,
          },
          { status: 400 }
        );
      }
    }

    // provider 검증
    let provider: OcrProvider = DEFAULT_OCR_MODEL.provider;
    if (body.provider) {
      if (!isValidProvider(body.provider)) {
        return NextResponse.json(
          {
            success: false,
            error: `유효하지 않은 provider입니다. 사용 가능: claude, gemini, openai, google-vision`,
          },
          { status: 400 }
        );
      }
      provider = body.provider as OcrProvider;
    }

    // model 설정
    let model = body.model || DEFAULT_OCR_MODEL.model;

    // 선택된 provider가 사용 가능한지 확인
    if (!isProviderAvailable(provider)) {
      const availableProviders = getAvailableProviders();
      if (availableProviders.length > 0) {
        console.log(`${provider}를 사용할 수 없습니다. ${availableProviders[0]}로 대체합니다.`);
        provider = availableProviders[0];
        // 대체된 provider의 기본 모델 사용
        model = MODELS_BY_PROVIDER[provider][0].model;
      }
    }

    // 입력 데이터 구성
    const input: OcrAnalyzeInput = {
      image: body.image,
      type: body.type,
      language: body.language || 'ko',
      provider,
      model,
      enhanceContrast: body.enhanceContrast || false,
    };

    // OCR 분석 실행
    const result = await analyzeHandwriting(input);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('OCR 분석 API 오류:', error);

    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ocr/analyze
 * OCR 분석 API 상태 및 사용 가능한 옵션 반환
 */
export async function GET() {
  const availableProviders = getAvailableProviders();
  const isMockMode = availableProviders.length === 0;

  // 각 provider별 상태 확인
  const providersStatus = ['claude', 'gemini', 'openai', 'google-vision'].map((providerId) => {
    const provider = providerId as OcrProvider;
    const available = isProviderAvailable(provider);

    return {
      provider,
      available,
      models: MODELS_BY_PROVIDER[provider],
      message: available
        ? `${provider}가 사용 가능합니다.`
        : `${provider}의 API 키가 설정되지 않았습니다.`,
    };
  });

  return NextResponse.json({
    success: true,
    endpoint: '/api/ocr/analyze',
    description: '손글씨 풀이 분석 API (PRD F3)',
    status: 'healthy',
    mockMode: isMockMode,
    message: isMockMode
      ? 'Mock 모드로 실행 중입니다. OCR을 사용하려면 API 키를 설정하세요.'
      : `${availableProviders.length}개의 OCR 프로바이더가 사용 가능합니다.`,
    providers: providersStatus,
    defaultProvider: DEFAULT_OCR_MODEL.provider,
    defaultModel: DEFAULT_OCR_MODEL.model,
    supportedLanguages: ['ko', 'en', 'ja', 'zh'],
    requestFormat: {
      image: 'string (base64 또는 URL)',
      type: "'base64' | 'url'",
      language: "string (기본값: 'ko')",
      provider: "'claude' | 'gemini' | 'openai' | 'google-vision'",
      model: 'string (제공자별 모델 ID)',
      enhanceContrast: 'boolean (향후 구현)',
    },
    responseFormat: {
      text: '추출된 전체 텍스트',
      confidence: '0-1 신뢰도',
      blocks: '블록별 텍스트 배열',
      mathExpressions: '인식된 수식 배열',
      language: '인식된 언어',
      provider: '사용된 제공자',
      model: '사용된 모델',
      processingTime: '처리 시간 (ms)',
    },
  });
}
