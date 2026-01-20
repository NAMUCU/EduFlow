import { NextRequest, NextResponse } from 'next/server';

// Mock OCR 결과 (실제로는 Google Cloud Vision 등의 서비스 사용)
function mockOcrProcess(imageBase64: string): {
  text: string;
  confidence: number;
} {
  // Mock: 이미지에서 추출된 텍스트라고 가정
  const mockTexts = [
    'x = 2 또는 x = 3',
    'f(x) = 2x + 3',
    '3x + 5 = 11, x = 2',
    '기울기: 2, y절편: -3',
    '(1, 1)',
    '사과: 700원, 배: 1000원',
  ];

  // 랜덤하게 Mock 텍스트 선택 (실제로는 OCR 결과)
  const randomIndex = Math.floor(Math.random() * mockTexts.length);

  return {
    text: mockTexts[randomIndex],
    confidence: 0.85 + Math.random() * 0.1, // 85~95% 정확도
  };
}

/**
 * Mock 이미지 업로드 (실제로는 Supabase Storage 등 사용)
 */
function mockImageUpload(imageBase64: string): string {
  // Mock URL 생성
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  return `/uploads/handwriting/${timestamp}_${randomId}.jpg`;
}

/**
 * POST /api/assignments/student/[id]/upload
 * 손글씨 이미지를 업로드하고 OCR 처리합니다.
 *
 * Request Body:
 * {
 *   image: string (base64),
 *   processOcr?: boolean (기본값: true)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.image) {
      return NextResponse.json(
        { success: false, error: '이미지 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    const { image, processOcr = true } = body;

    // 이미지 업로드 (Mock)
    const imageUrl = mockImageUpload(image);

    // OCR 처리
    let ocrResult = null;
    if (processOcr) {
      // OCR API 호출 (Mock 또는 실제 서비스)
      try {
        // 실제 구현에서는 Google Cloud Vision API를 호출합니다.
        // import { extractText } from '@/lib/ocr';
        // const ocrData = await extractText(image);

        // Mock OCR 결과
        const mockResult = mockOcrProcess(image);
        ocrResult = {
          success: true,
          text: mockResult.text,
          confidence: mockResult.confidence,
        };

        console.log(`[OCR] 학생과제 ${id}: "${mockResult.text}" (신뢰도: ${(mockResult.confidence * 100).toFixed(1)}%)`);
      } catch (ocrError) {
        console.error('OCR 처리 오류:', ocrError);
        ocrResult = {
          success: false,
          text: '',
          confidence: 0,
          error: 'OCR 처리 중 오류가 발생했습니다.',
        };
      }
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      ocrResult,
      message: processOcr
        ? '이미지 업로드 및 OCR 처리가 완료되었습니다.'
        : '이미지 업로드가 완료되었습니다.',
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    return NextResponse.json(
      { success: false, error: '이미지를 업로드하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
