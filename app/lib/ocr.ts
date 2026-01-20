/**
 * 멀티모델 OCR 클라이언트
 * Claude, Gemini, OpenAI, Google Cloud Vision을 지원합니다.
 */

import {
  OcrProvider,
  OcrResponse,
  ExtractedProblem,
  DEFAULT_OCR_MODEL,
  OcrAnalyzeInput,
  OcrAnalyzeResult,
  TextBlock,
} from '@/types/ocr';

// 기존 타입 호환성을 위한 재export
export type { ExtractedProblem, OcrAnalyzeInput, OcrAnalyzeResult, TextBlock };

// OCR 결과 타입 (기존 호환성)
export interface OcrResult {
  text: string;
  confidence: number;
  problems: ExtractedProblem[];
  provider?: OcrProvider;
  model?: string;
  processingTime?: number;
}

// 환경변수 체크 함수들
const hasAnthropicKey = () => !!process.env.ANTHROPIC_API_KEY;
const hasGeminiKey = () => !!process.env.GEMINI_API_KEY;
const hasOpenAIKey = () => !!process.env.OPENAI_API_KEY;
const hasGoogleVisionKey = () => !!process.env.GOOGLE_CLOUD_VISION_API_KEY;

// Mock 모드 확인 (모든 API 키가 없으면 Mock 모드)
const isMockMode = () => !hasAnthropicKey() && !hasGeminiKey() && !hasOpenAIKey() && !hasGoogleVisionKey();

// 특정 프로바이더의 API 키 존재 여부 확인
export function isProviderAvailable(provider: OcrProvider): boolean {
  switch (provider) {
    case 'claude':
      return hasAnthropicKey();
    case 'gemini':
      return hasGeminiKey();
    case 'openai':
      return hasOpenAIKey();
    case 'google-vision':
      return hasGoogleVisionKey();
    default:
      return false;
  }
}

// 사용 가능한 프로바이더 목록 반환
export function getAvailableProviders(): OcrProvider[] {
  const providers: OcrProvider[] = [];
  if (hasAnthropicKey()) providers.push('claude');
  if (hasGeminiKey()) providers.push('gemini');
  if (hasOpenAIKey()) providers.push('openai');
  if (hasGoogleVisionKey()) providers.push('google-vision');
  return providers;
}

// OCR 프롬프트 (모든 모델에 공통 사용)
const OCR_PROMPT = `이 이미지에서 텍스트를 추출해주세요.

규칙:
1. 이미지에 있는 모든 텍스트를 정확하게 추출합니다.
2. 수학 문제가 있다면 다음 형식으로 구조화합니다:
   - 문제 번호 (예: 1, 2, 3...)
   - 문제 내용
   - 객관식인 경우 보기 (1, 2, 3, 4, 5 또는 원문자)
   - 문제 유형 판별 (객관식/주관식/서술형)
3. 수학 기호는 유니코드로 표현합니다 (예: ², ³, √, ×, ÷, π 등)
4. 표나 그래프가 있으면 텍스트로 설명합니다.

결과는 JSON 형식으로 반환해주세요:
{
  "text": "전체 추출 텍스트",
  "problems": [
    {
      "number": "문제 번호",
      "content": "문제 내용",
      "type": "객관식|주관식|서술형",
      "choices": ["보기1", "보기2", ...] // 객관식인 경우만
    }
  ]
}`;

// Google Cloud Vision API 응답 타입
interface VisionApiResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    fullTextAnnotation?: {
      text: string;
    };
    error?: {
      message: string;
      code: number;
    };
  }>;
}

/**
 * Mock OCR 결과 생성 (테스트용)
 */
function getMockOcrResult(provider: OcrProvider = 'claude', model: string = 'mock'): OcrResult {
  const mockText = `수학 문제집 - 3학년 2학기

1. 다음 식을 계산하시오.
   3x² + 5x - 2 = 0

2. 다음 중 이차방정식의 해가 아닌 것은?
   1 x = 1
   2 x = -2
   3 x = 3
   4 x = -1

3. 직각삼각형에서 빗변의 길이가 10cm이고,
   한 변의 길이가 6cm일 때, 나머지 한 변의
   길이를 구하시오.

4. 함수 f(x) = 2x + 3에서 f(5)의 값을 구하시오.`;

  return {
    text: mockText,
    confidence: 0.95,
    problems: extractProblemsFromText(mockText),
    provider,
    model,
    processingTime: 1000,
  };
}

/**
 * Claude API를 사용한 OCR
 */
export async function extractTextWithClaude(
  imageBase64: string,
  model: string = 'claude-3-5-haiku-20241022'
): Promise<OcrResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');
  }

  const startTime = Date.now();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: OCR_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Claude API 오류: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';
  const processingTime = Date.now() - startTime;

  return parseOcrResponse(content, 'claude', model, processingTime);
}

/**
 * Gemini API를 사용한 OCR
 */
export async function extractTextWithGemini(
  imageBase64: string,
  model: string = 'gemini-1.5-flash'
): Promise<OcrResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  const startTime = Date.now();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                text: OCR_PROMPT,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API 오류: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const processingTime = Date.now() - startTime;

  return parseOcrResponse(content, 'gemini', model, processingTime);
}

/**
 * OpenAI API를 사용한 OCR
 */
export async function extractTextWithOpenAI(
  imageBase64: string,
  model: string = 'gpt-4o'
): Promise<OcrResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  }

  const startTime = Date.now();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: OCR_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API 오류: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const processingTime = Date.now() - startTime;

  return parseOcrResponse(content, 'openai', model, processingTime);
}

/**
 * Google Cloud Vision API를 사용한 OCR
 */
export async function extractTextWithGoogleVision(imageBase64: string): Promise<OcrResult> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_CLOUD_VISION_API_KEY가 설정되지 않았습니다.');
  }

  const startTime = Date.now();

  const requestBody = {
    requests: [
      {
        image: {
          content: imageBase64,
        },
        features: [
          {
            type: 'TEXT_DETECTION',
            maxResults: 50,
          },
          {
            type: 'DOCUMENT_TEXT_DETECTION',
          },
        ],
        imageContext: {
          languageHints: ['ko', 'en', 'ko-Hang'],
        },
      },
    ],
  };

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Vision API 오류: ${errorData.error?.message || response.statusText}`);
  }

  const data: VisionApiResponse = await response.json();

  if (data.responses[0]?.error) {
    throw new Error(`Vision API 오류: ${data.responses[0].error.message}`);
  }

  const rawText = data.responses[0]?.fullTextAnnotation?.text ||
    data.responses[0]?.textAnnotations?.[0]?.description ||
    '';

  const processedText = postProcessMathText(rawText);
  const problems = extractProblemsFromText(processedText);
  const processingTime = Date.now() - startTime;

  return {
    text: processedText,
    confidence: 0.9,
    problems,
    provider: 'google-vision',
    model: 'vision-api',
    processingTime,
  };
}

/**
 * AI 모델 응답 파싱
 */
function parseOcrResponse(
  content: string,
  provider: OcrProvider,
  model: string,
  processingTime: number
): OcrResult {
  try {
    // JSON 블록 추출 시도
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    // JSON 파싱 시도
    const parsed = JSON.parse(jsonStr.trim());

    return {
      text: parsed.text || content,
      confidence: 0.95,
      problems: parsed.problems || extractProblemsFromText(parsed.text || content),
      provider,
      model,
      processingTime,
    };
  } catch {
    // JSON 파싱 실패 시 텍스트로 처리
    const processedText = postProcessMathText(content);
    return {
      text: processedText,
      confidence: 0.85,
      problems: extractProblemsFromText(processedText),
      provider,
      model,
      processingTime,
    };
  }
}

/**
 * 통합 OCR 함수 (메인)
 */
export async function extractText(
  imageBase64: string,
  provider: OcrProvider = DEFAULT_OCR_MODEL.provider,
  model: string = DEFAULT_OCR_MODEL.model
): Promise<OcrResult> {
  // Mock 모드 확인
  if (isMockMode()) {
    console.log('OCR Mock 모드로 실행 중...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getMockOcrResult(provider, model);
  }

  // 프로바이더가 사용 가능한지 확인
  if (!isProviderAvailable(provider)) {
    // 사용 가능한 첫 번째 프로바이더로 대체
    const availableProviders = getAvailableProviders();
    if (availableProviders.length === 0) {
      console.log('사용 가능한 OCR 프로바이더가 없습니다. Mock 모드로 실행합니다.');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getMockOcrResult(provider, model);
    }

    console.log(`${provider}가 사용 불가능합니다. ${availableProviders[0]}로 대체합니다.`);
    provider = availableProviders[0];
  }

  try {
    switch (provider) {
      case 'claude':
        return await extractTextWithClaude(imageBase64, model);
      case 'gemini':
        return await extractTextWithGemini(imageBase64, model);
      case 'openai':
        return await extractTextWithOpenAI(imageBase64, model);
      case 'google-vision':
        return await extractTextWithGoogleVision(imageBase64);
      default:
        throw new Error(`지원하지 않는 OCR 프로바이더: ${provider}`);
    }
  } catch (error) {
    console.error(`OCR 처리 중 오류 (${provider}/${model}):`, error);
    throw error;
  }
}

/**
 * 이미지에서 텍스트 추출 (기존 함수 - 하위 호환성)
 */
export async function extractTextFromImage(imageBase64: string): Promise<OcrResult> {
  return extractText(imageBase64);
}

/**
 * 수학 수식 후처리
 */
function postProcessMathText(text: string): string {
  let processed = text;

  const replacements: [RegExp, string][] = [
    // 수학 기호 정리
    [/×/g, '×'],
    [/÷/g, '÷'],
    [/\*/g, '×'],
    [/x(?=\d)/gi, '×'],
    [/(\d)\s*X\s*(\d)/g, '$1 × $2'],

    // 분수 표현 정리
    [/(\d+)\s*\/\s*(\d+)/g, '$1/$2'],

    // 제곱 표현 정리
    [/\^2/g, '²'],
    [/\^3/g, '³'],
    [/(\d)2(?!\d)/g, '$1²'],

    // 루트 표현
    [/√/g, '√'],
    [/루트/g, '√'],

    // 부등호 정리
    [/<=/g, '≤'],
    [/>=/g, '≥'],
    [/!=/g, '≠'],

    // 그리스 문자 정리
    [/알파/g, 'α'],
    [/베타/g, 'β'],
    [/세타/g, 'θ'],
    [/파이/g, 'π'],

    // 공백 정리
    [/\s+/g, ' '],
    [/\n\s*\n\s*\n/g, '\n\n'],
  ];

  for (const [pattern, replacement] of replacements) {
    processed = processed.replace(pattern, replacement);
  }

  return processed.trim();
}

/**
 * 텍스트에서 문제 추출
 */
export function extractProblemsFromText(text: string): ExtractedProblem[] {
  const problems: ExtractedProblem[] = [];

  // 문제 번호 패턴: 1., 1), (1), 문제1, Q1 등
  const problemPattern = /(?:^|\n)\s*(?:문제\s*)?(\d+)\s*[.)\]]\s*([\s\S]*?)(?=(?:\n\s*(?:문제\s*)?\d+\s*[.)\]])|$)/gi;

  let match;
  while ((match = problemPattern.exec(text)) !== null) {
    const number = match[1];
    let content = match[2].trim();

    // 문제 유형 판별
    let type: '객관식' | '주관식' | '서술형' = '주관식';
    const choices: string[] = [];

    // 객관식 보기 추출 (1 2 3 4 5 또는 1)2)3)4)5) 형태)
    const choicePattern = /[①②③④⑤]|[1-5]\)\s*/g;
    if (choicePattern.test(content)) {
      type = '객관식';

      // 보기 추출
      const choiceExtractPattern = /([①②③④⑤]|[1-5]\))\s*([^\n①②③④⑤1-5)]+)/g;
      let choiceMatch;
      while ((choiceMatch = choiceExtractPattern.exec(content)) !== null) {
        choices.push(choiceMatch[2].trim());
      }
    }

    // 서술형 판별
    if (/풀이\s*과정|설명하시오|증명하시오|서술하시오|이유를?\s*쓰시오/i.test(content)) {
      type = '서술형';
    }

    problems.push({
      number,
      content: postProcessMathText(content),
      type,
      choices: choices.length > 0 ? choices : undefined,
    });
  }

  // 문제가 추출되지 않았으면 전체 텍스트를 하나의 문제로 처리
  if (problems.length === 0 && text.trim()) {
    problems.push({
      number: '1',
      content: postProcessMathText(text),
      type: '주관식',
    });
  }

  return problems;
}

/**
 * 파일을 Base64로 변환
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * 이미지 URL에서 Base64로 변환
 */
export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// ============================================
// OCR 분석 API 함수 (PRD F3 - 손글씨 풀이 분석)
// ============================================

/**
 * 손글씨 분석 전용 프롬프트
 */
const HANDWRITING_ANALYSIS_PROMPT = `이 이미지에서 손글씨 텍스트와 수식을 분석해주세요.

분석 규칙:
1. 모든 텍스트를 정확하게 추출합니다.
2. 수학 수식은 LaTeX 형식과 일반 텍스트 형식 모두 제공합니다.
3. 텍스트 블록의 위치 정보를 추정하여 제공합니다.
4. 신뢰도를 0-1 사이의 값으로 평가합니다.
5. 손글씨의 특성을 고려하여 불확실한 문자는 [?] 표시합니다.

결과는 JSON 형식으로 반환해주세요:
{
  "text": "전체 추출 텍스트",
  "confidence": 0.95,
  "blocks": [
    {
      "text": "블록 텍스트",
      "confidence": 0.9,
      "boundingBox": { "x": 0, "y": 0, "width": 100, "height": 50 }
    }
  ],
  "mathExpressions": ["수식1", "수식2"]
}`;

/**
 * Google Vision API 상세 분석 응답 타입
 */
interface VisionAnnotateResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{ x?: number; y?: number }>;
      };
      locale?: string;
    }>;
    fullTextAnnotation?: {
      text: string;
      pages: Array<{
        blocks: Array<{
          paragraphs: Array<{
            words: Array<{
              symbols: Array<{
                text: string;
                confidence?: number;
              }>;
              boundingBox?: {
                vertices: Array<{ x?: number; y?: number }>;
              };
              confidence?: number;
            }>;
          }>;
          boundingBox?: {
            vertices: Array<{ x?: number; y?: number }>;
          };
          confidence?: number;
        }>;
      }>;
    };
    error?: {
      message: string;
      code: number;
    };
  }>;
}

/**
 * Google Cloud Vision API로 상세 OCR 분석
 */
async function analyzeWithGoogleVision(
  imageBase64: string,
  language: string = 'ko'
): Promise<OcrAnalyzeResult> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_CLOUD_VISION_API_KEY가 설정되지 않았습니다.');
  }

  const startTime = Date.now();

  // 언어 힌트 설정
  const languageHints = language === 'ko'
    ? ['ko', 'en', 'ko-Hang']
    : [language, 'en'];

  const requestBody = {
    requests: [
      {
        image: {
          content: imageBase64,
        },
        features: [
          {
            type: 'DOCUMENT_TEXT_DETECTION',
          },
        ],
        imageContext: {
          languageHints,
        },
      },
    ],
  };

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Vision API 오류: ${errorData.error?.message || response.statusText}`);
  }

  const data: VisionAnnotateResponse = await response.json();

  if (data.responses[0]?.error) {
    throw new Error(`Vision API 오류: ${data.responses[0].error.message}`);
  }

  const fullTextAnnotation = data.responses[0]?.fullTextAnnotation;
  const textAnnotations = data.responses[0]?.textAnnotations;

  // 전체 텍스트 추출
  const rawText = fullTextAnnotation?.text || textAnnotations?.[0]?.description || '';
  const processedText = postProcessMathText(rawText);

  // 블록 정보 추출
  const blocks: TextBlock[] = [];

  if (fullTextAnnotation?.pages) {
    for (const page of fullTextAnnotation.pages) {
      for (const block of page.blocks) {
        const vertices = block.boundingBox?.vertices || [];
        const minX = Math.min(...vertices.map(v => v.x || 0));
        const minY = Math.min(...vertices.map(v => v.y || 0));
        const maxX = Math.max(...vertices.map(v => v.x || 0));
        const maxY = Math.max(...vertices.map(v => v.y || 0));

        // 블록 텍스트 조합
        let blockText = '';
        for (const paragraph of block.paragraphs) {
          for (const word of paragraph.words) {
            const wordText = word.symbols.map(s => s.text).join('');
            blockText += wordText + ' ';
          }
          blockText += '\n';
        }

        blocks.push({
          text: postProcessMathText(blockText.trim()),
          confidence: block.confidence || 0.8,
          boundingBox: {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          },
        });
      }
    }
  } else if (textAnnotations && textAnnotations.length > 1) {
    // fullTextAnnotation이 없는 경우 textAnnotations 사용
    for (let i = 1; i < textAnnotations.length; i++) {
      const annotation = textAnnotations[i];
      const vertices = annotation.boundingPoly.vertices;
      const minX = Math.min(...vertices.map(v => v.x || 0));
      const minY = Math.min(...vertices.map(v => v.y || 0));
      const maxX = Math.max(...vertices.map(v => v.x || 0));
      const maxY = Math.max(...vertices.map(v => v.y || 0));

      blocks.push({
        text: annotation.description,
        confidence: 0.85,
        boundingBox: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
      });
    }
  }

  // 수식 추출
  const mathExpressions = extractMathExpressions(processedText);

  // 평균 신뢰도 계산
  const avgConfidence = blocks.length > 0
    ? blocks.reduce((sum, b) => sum + b.confidence, 0) / blocks.length
    : 0.8;

  const processingTime = Date.now() - startTime;

  return {
    text: processedText,
    confidence: avgConfidence,
    blocks,
    mathExpressions: mathExpressions.length > 0 ? mathExpressions : undefined,
    language,
    provider: 'google-vision',
    model: 'vision-api',
    processingTime,
  };
}

/**
 * AI 모델로 손글씨 분석 (Claude, Gemini, OpenAI)
 */
async function analyzeWithAIModel(
  imageBase64: string,
  provider: OcrProvider,
  model: string,
  language: string = 'ko'
): Promise<OcrAnalyzeResult> {
  const startTime = Date.now();
  let content = '';

  if (provider === 'claude') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: HANDWRITING_ANALYSIS_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API 오류: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    content = data.content?.[0]?.text || '';
  } else if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageBase64,
                  },
                },
                {
                  text: HANDWRITING_ANALYSIS_PROMPT,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API 오류: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: HANDWRITING_ANALYSIS_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API 오류: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    content = data.choices?.[0]?.message?.content || '';
  }

  const processingTime = Date.now() - startTime;

  return parseAnalyzeResponse(content, provider, model, language, processingTime);
}

/**
 * AI 모델 응답 파싱 (분석용)
 */
function parseAnalyzeResponse(
  content: string,
  provider: OcrProvider,
  model: string,
  language: string,
  processingTime: number
): OcrAnalyzeResult {
  try {
    // JSON 블록 추출 시도
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    // JSON 파싱 시도
    const parsed = JSON.parse(jsonStr.trim());

    return {
      text: parsed.text || content,
      confidence: parsed.confidence || 0.85,
      blocks: parsed.blocks || [],
      mathExpressions: parsed.mathExpressions,
      language,
      provider,
      model,
      processingTime,
    };
  } catch {
    // JSON 파싱 실패 시 텍스트로 처리
    const processedText = postProcessMathText(content);
    const mathExpressions = extractMathExpressions(processedText);

    return {
      text: processedText,
      confidence: 0.75,
      blocks: [{
        text: processedText,
        confidence: 0.75,
        boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      }],
      mathExpressions: mathExpressions.length > 0 ? mathExpressions : undefined,
      language,
      provider,
      model,
      processingTime,
    };
  }
}

/**
 * 수식 추출
 */
function extractMathExpressions(text: string): string[] {
  const expressions: string[] = [];

  // 수식 패턴들
  const patterns = [
    // 방정식 형태: ax + b = c, x^2 + y^2 = z^2
    /[a-zA-Z0-9\s\+\-\*\/\^\(\)]+\s*=\s*[a-zA-Z0-9\s\+\-\*\/\^\(\)]+/g,
    // 분수 형태: a/b
    /\d+\s*\/\s*\d+/g,
    // 제곱근: sqrt, 루트
    /(?:sqrt|루트|√)\s*\([^)]+\)|√\d+/gi,
    // 거듭제곱: x^2, x², x³
    /[a-zA-Z]\s*[\^²³]/g,
    // 삼각함수: sin, cos, tan
    /(?:sin|cos|tan|log|ln)\s*\([^)]+\)/gi,
    // 적분/미분 기호
    /∫[^∫]+d[a-z]/g,
    // 시그마 합: Σ
    /Σ[^Σ]+/g,
    // 파이: π
    /\d*π/g,
    // 무한대: ∞
    /[^\s]*∞[^\s]*/g,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const trimmed = match.trim();
        if (trimmed && !expressions.includes(trimmed)) {
          expressions.push(trimmed);
        }
      }
    }
  }

  return expressions;
}

/**
 * Mock 분석 결과 생성 (테스트용)
 */
function getMockAnalyzeResult(
  provider: OcrProvider = 'claude',
  model: string = 'mock',
  language: string = 'ko'
): OcrAnalyzeResult {
  return {
    text: `손글씨 풀이 예시

1. 이차방정식 풀이
x² - 5x + 6 = 0
(x - 2)(x - 3) = 0
x = 2 또는 x = 3

2. 피타고라스 정리
a² + b² = c²
3² + 4² = 5²
9 + 16 = 25`,
    confidence: 0.92,
    blocks: [
      {
        text: '손글씨 풀이 예시',
        confidence: 0.95,
        boundingBox: { x: 10, y: 10, width: 200, height: 30 },
      },
      {
        text: '1. 이차방정식 풀이\nx² - 5x + 6 = 0\n(x - 2)(x - 3) = 0\nx = 2 또는 x = 3',
        confidence: 0.90,
        boundingBox: { x: 10, y: 50, width: 250, height: 100 },
      },
      {
        text: '2. 피타고라스 정리\na² + b² = c²\n3² + 4² = 5²\n9 + 16 = 25',
        confidence: 0.88,
        boundingBox: { x: 10, y: 160, width: 200, height: 100 },
      },
    ],
    mathExpressions: [
      'x² - 5x + 6 = 0',
      '(x - 2)(x - 3) = 0',
      'a² + b² = c²',
      '3² + 4² = 5²',
      '9 + 16 = 25',
    ],
    language,
    provider,
    model,
    processingTime: 1200,
  };
}

/**
 * 손글씨 풀이 분석 (메인 함수)
 * PRD F3. OCR 분석
 */
export async function analyzeHandwriting(input: OcrAnalyzeInput): Promise<OcrAnalyzeResult> {
  const {
    image,
    type,
    language = 'ko',
    provider = DEFAULT_OCR_MODEL.provider,
    model = DEFAULT_OCR_MODEL.model,
  } = input;

  // 이미지 데이터 준비
  let imageBase64: string;
  if (type === 'url') {
    imageBase64 = await urlToBase64(image);
  } else {
    // base64 데이터에서 데이터 URI 스킴 제거 (있는 경우)
    imageBase64 = image.replace(/^data:image\/[a-z]+;base64,/, '');
  }

  // Mock 모드 확인
  if (isMockMode()) {
    console.log('OCR 분석 Mock 모드로 실행 중...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getMockAnalyzeResult(provider, model, language);
  }

  // 프로바이더 사용 가능 여부 확인
  let activeProvider = provider;
  let activeModel = model;

  if (!isProviderAvailable(provider)) {
    const availableProviders = getAvailableProviders();
    if (availableProviders.length === 0) {
      console.log('사용 가능한 OCR 프로바이더가 없습니다. Mock 모드로 실행합니다.');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getMockAnalyzeResult(provider, model, language);
    }

    console.log(`${provider}가 사용 불가능합니다. ${availableProviders[0]}로 대체합니다.`);
    activeProvider = availableProviders[0];

    // Google Vision은 모델 불필요
    if (activeProvider !== 'google-vision') {
      const { MODELS_BY_PROVIDER } = await import('@/types/ocr');
      activeModel = MODELS_BY_PROVIDER[activeProvider][0].model;
    }
  }

  try {
    // Google Vision은 블록 정보를 직접 제공하므로 별도 처리
    if (activeProvider === 'google-vision') {
      return await analyzeWithGoogleVision(imageBase64, language);
    }

    // AI 모델로 분석
    return await analyzeWithAIModel(imageBase64, activeProvider, activeModel, language);
  } catch (error) {
    console.error(`OCR 분석 중 오류 (${activeProvider}/${activeModel}):`, error);
    throw error;
  }
}
