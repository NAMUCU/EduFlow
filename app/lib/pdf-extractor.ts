/**
 * PDF 텍스트 추출 유틸리티
 * pgvector RAG 인덱싱을 위한 텍스트 추출
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

/**
 * PDF.co API를 통한 텍스트 추출
 */
export async function extractTextWithPdfCo(
  pdfUrl: string
): Promise<string> {
  const apiKey = process.env.PDFCO_API_KEY;

  if (!apiKey) {
    throw new Error('PDFCO_API_KEY가 설정되지 않았습니다.');
  }

  const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: pdfUrl,
      inline: true,
      async: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`PDF.co API 오류: ${response.status}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(`PDF.co 변환 실패: ${result.message}`);
  }

  return result.body || '';
}

/**
 * Gemini Vision을 통한 PDF 텍스트 추출
 * 스캔된 PDF나 이미지 기반 PDF에 효과적
 */
export async function extractTextWithVision(
  pdfBuffer: Buffer,
  mimeType: string = 'application/pdf'
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `이 PDF 문서의 모든 텍스트를 추출해주세요.

추출 규칙:
1. 모든 텍스트를 빠짐없이 추출
2. 문제 번호는 그대로 유지 (1., 2., 가., 나. 등)
3. 수학 공식은 LaTeX 형식으로 변환 (예: $x^2 + y^2 = r^2$)
4. 표가 있으면 마크다운 테이블로 변환
5. 이미지 설명은 [이미지: 설명] 형식으로 표기
6. 원본의 구조와 순서를 유지

출력 형식:
- 제목과 단원명은 ## 헤더로
- 문제는 번호와 함께 명확히 구분
- 보기는 가), 나), 다) 또는 ①, ②, ③ 형식 유지`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: pdfBuffer.toString('base64'),
      },
    },
    { text: prompt },
  ]);

  return result.response.text();
}

/**
 * 자동 방식 선택 PDF 추출
 * - 파일 크기와 유형에 따라 최적의 방식 선택
 */
export async function extractText(
  input: {
    buffer?: Buffer;
    url?: string;
    mimeType?: string;
  },
  options: {
    preferVision?: boolean;
    maxSizeForVision?: number; // bytes, default 10MB
  } = {}
): Promise<{
  text: string;
  method: 'pdfco' | 'vision';
  pageCount?: number;
}> {
  const { preferVision = false, maxSizeForVision = 10 * 1024 * 1024 } = options;

  // URL이 있고 Vision을 선호하지 않으면 PDF.co 사용
  if (input.url && !preferVision) {
    try {
      const text = await extractTextWithPdfCo(input.url);
      return { text, method: 'pdfco' };
    } catch (error) {
      console.warn('PDF.co 추출 실패, Vision으로 폴백:', error);
    }
  }

  // Buffer가 있으면 Vision 사용
  if (input.buffer) {
    // 크기 제한 체크
    if (input.buffer.length > maxSizeForVision) {
      throw new Error(`파일이 너무 큽니다. (최대 ${maxSizeForVision / 1024 / 1024}MB)`);
    }

    const text = await extractTextWithVision(
      input.buffer,
      input.mimeType || 'application/pdf'
    );
    return { text, method: 'vision' };
  }

  throw new Error('buffer 또는 url이 필요합니다.');
}

/**
 * 교육 콘텐츠 전처리
 * - 문제 번호 정규화
 * - 불필요한 공백 제거
 * - 섹션 구분 강화
 */
export function preprocessEducationalContent(text: string): string {
  let processed = text;

  // 1. 연속 공백/줄바꿈 정리
  processed = processed.replace(/\n{3,}/g, '\n\n');
  processed = processed.replace(/[ \t]+/g, ' ');

  // 2. 문제 번호 정규화
  // "1." → "### 문제 1"
  processed = processed.replace(
    /^(\d+)\.\s*/gm,
    (_, num) => `\n### 문제 ${num}\n`
  );

  // 3. 소문제 정규화
  // "(1)" → "#### (1)"
  processed = processed.replace(
    /^\((\d+)\)\s*/gm,
    (_, num) => `#### (${num}) `
  );

  // 4. 보기 정규화
  // "① ②" → 줄바꿈으로 구분
  processed = processed.replace(
    /([①②③④⑤])\s*/g,
    '\n$1 '
  );

  // 5. 정답/해설 섹션 구분
  processed = processed.replace(
    /^(정답|해설|풀이|답)[:\s]*/gim,
    '\n**$1:** '
  );

  // 6. 앞뒤 공백 정리
  processed = processed.trim();

  return processed;
}

/**
 * 문서에서 메타데이터 자동 추출 시도
 */
export function extractMetadata(text: string): {
  subject?: string;
  grade?: string;
  year?: number;
  unit?: string;
} {
  const metadata: {
    subject?: string;
    grade?: string;
    year?: number;
    unit?: string;
  } = {};

  // 과목 추출
  const subjectPatterns: { pattern: RegExp; subject: string }[] = [
    { pattern: /수학|미적분|기하|확률과\s*통계/i, subject: '수학' },
    { pattern: /국어|문학|독서|언어와\s*매체/i, subject: '국어' },
    { pattern: /영어|English/i, subject: '영어' },
    { pattern: /물리|화학|생명과학|지구과학|과학/i, subject: '과학' },
    { pattern: /한국사|세계사|동아시아사|사회/i, subject: '사회' },
  ];

  for (const { pattern, subject } of subjectPatterns) {
    if (pattern.test(text)) {
      metadata.subject = subject;
      break;
    }
  }

  // 학년 추출
  const gradeMatch = text.match(/(고[123]|중[123]|초[1-6]|\d학년)/);
  if (gradeMatch) {
    metadata.grade = gradeMatch[1];
  }

  // 연도 추출 (2020~2030)
  const yearMatch = text.match(/(20[2-3]\d)년?\s*(학년도|수능|모의고사)?/);
  if (yearMatch) {
    metadata.year = parseInt(yearMatch[1]);
  }

  // 단원 추출
  const unitMatch = text.match(/(?:단원|Chapter|Unit)\s*[:\s]*([^\n]+)/i);
  if (unitMatch) {
    metadata.unit = unitMatch[1].trim();
  }

  return metadata;
}
