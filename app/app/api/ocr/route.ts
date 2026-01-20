import { NextRequest, NextResponse } from 'next/server';
import {
  extractText,
  extractProblemsFromText,
  isProviderAvailable,
  getAvailableProviders,
} from '@/lib/ocr';
import {
  OcrProvider,
  OCR_PROVIDERS,
  MODELS_BY_PROVIDER,
  DEFAULT_OCR_MODEL,
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
 * POST /api/ocr
 * 이미지에서 텍스트를 추출합니다.
 *
 * Request Body:
 * - FormData: image 필드에 이미지 파일, provider/model 필드 (선택)
 * - 또는 JSON: { imageBase64: string, provider?: string, model?: string }
 *
 * Response:
 * - 성공: { success: true, data: OcrResult }
 * - 실패: { success: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let imageBase64: string;
    let provider: OcrProvider = DEFAULT_OCR_MODEL.provider;
    let model: string = DEFAULT_OCR_MODEL.model;

    // FormData 형식인 경우
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: '이미지 파일이 필요합니다.' },
          { status: 400 }
        );
      }

      // 파일 타입 검증
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `지원하지 않는 이미지 형식입니다. 지원 형식: ${ALLOWED_MIME_TYPES.join(', ')}`,
          },
          { status: 400 }
        );
      }

      // 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 가능합니다.`,
          },
          { status: 400 }
        );
      }

      // 파일을 Base64로 변환
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageBase64 = buffer.toString('base64');

      // provider, model 추출
      const providerValue = formData.get('provider') as string | null;
      const modelValue = formData.get('model') as string | null;

      if (providerValue && isValidProvider(providerValue)) {
        provider = providerValue as OcrProvider;
      }
      if (modelValue) {
        model = modelValue;
      }
    }
    // JSON 형식인 경우
    else if (contentType.includes('application/json')) {
      const body = await request.json();

      if (!body.imageBase64) {
        return NextResponse.json(
          { success: false, error: 'imageBase64 필드가 필요합니다.' },
          { status: 400 }
        );
      }

      imageBase64 = body.imageBase64;

      // Base64 데이터 크기 검증
      const estimatedSize = (imageBase64.length * 3) / 4;
      if (estimatedSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 가능합니다.`,
          },
          { status: 400 }
        );
      }

      // provider, model 추출
      if (body.provider && isValidProvider(body.provider)) {
        provider = body.provider as OcrProvider;
      }
      if (body.model) {
        model = body.model;
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: '지원하지 않는 Content-Type입니다. multipart/form-data 또는 application/json을 사용하세요.',
        },
        { status: 400 }
      );
    }

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

    // OCR 처리
    const result = await extractText(imageBase64, provider, model);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('OCR API 오류:', error);

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
 * PUT /api/ocr
 * 이미 추출된 텍스트에서 문제를 추출합니다.
 *
 * Request Body: { text: string }
 *
 * Response:
 * - 성공: { success: true, problems: ExtractedProblem[] }
 * - 실패: { success: false, error: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { success: false, error: '텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    const problems = extractProblemsFromText(body.text);

    return NextResponse.json({
      success: true,
      problems,
    });
  } catch (error) {
    console.error('문제 추출 API 오류:', error);

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
 * GET /api/ocr
 * API 상태 확인 및 사용 가능한 모델 목록 반환
 */
export async function GET() {
  const availableProviders = getAvailableProviders();
  const isMockMode = availableProviders.length === 0;

  // 각 provider별 상태 확인
  const providersStatus = OCR_PROVIDERS.map((p) => ({
    provider: p.id,
    name: p.name,
    available: isProviderAvailable(p.id),
    models: MODELS_BY_PROVIDER[p.id],
    message: isProviderAvailable(p.id)
      ? `${p.name}이(가) 사용 가능합니다.`
      : `${p.envKey}가 설정되지 않았습니다.`,
  }));

  return NextResponse.json({
    success: true,
    status: 'healthy',
    mockMode: isMockMode,
    message: isMockMode
      ? 'Mock 모드로 실행 중입니다. OCR을 사용하려면 API 키를 설정하세요.'
      : `${availableProviders.length}개의 OCR 프로바이더가 사용 가능합니다.`,
    providers: providersStatus,
    defaultModel: DEFAULT_OCR_MODEL,
    availableProviders,
  });
}

/**
 * 유효한 provider인지 확인
 */
function isValidProvider(provider: string): boolean {
  return ['claude', 'gemini', 'openai', 'google-vision'].includes(provider);
}
