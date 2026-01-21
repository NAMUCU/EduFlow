/**
 * PDF 생성 API (PRD F3)
 *
 * PDF.co API를 통해 문제지, 정답지, 제출물 PDF를 생성합니다.
 *
 * POST: PDF 생성 요청
 * - type: 'problems' | 'answers' | 'submission' | 'both' (문제지+정답지 동시 생성)
 * - problems: 문제 배열 (problems, answers 유형에 필수)
 * - submissionData: 제출 데이터 (submission 유형에 필수)
 * - options: PDF 생성 옵션
 *
 * 개선 사항:
 * - 문제지 + 정답지 동시 생성 지원 (type: 'both')
 * - 새로운 pdf-generator 서비스 연동
 * - KaTeX 수학 수식 렌더링 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePdfWithPdfCo, generatePdfPreviewHtml } from '@/lib/pdf-converter';
import {
  type ProblemForPdf,
} from '@/lib/services/pdf-generator';
import {
  GeneratePdfInput,
  GeneratePdfResponse,
  GeneratedProblem,
  PdfGenerateRequest,
  PdfGenerateResponse,
  DEFAULT_PRINT_OPTIONS,
  Problem,
  PrintOptions,
} from '@/types/pdf';

// ============================================
// 확장 타입 정의
// ============================================

// 확장된 타입 정의 (both 포함)
type ExtendedPdfType = 'problems' | 'answers' | 'submission' | 'both';

interface ExtendedPdfInput extends Omit<GeneratePdfInput, 'type'> {
  type: ExtendedPdfType;
}

// ============================================
// 유효성 검사 함수
// ============================================

/**
 * GeneratedProblem 유효성 검사 (PRD F3용)
 */
function validateGeneratedProblem(problem: unknown): problem is GeneratedProblem {
  if (typeof problem !== 'object' || problem === null) return false;
  const p = problem as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.question === 'string' &&
    typeof p.answer === 'string' &&
    typeof p.difficulty === 'string'
  );
}

/**
 * 기존 Problem 유효성 검사 (하위 호환성)
 */
function validateProblem(problem: unknown): problem is Problem {
  if (typeof problem !== 'object' || problem === null) return false;
  const p = problem as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.question === 'string' &&
    typeof p.answer === 'string' &&
    typeof p.solution === 'string' &&
    typeof p.difficulty === 'string'
  );
}

/**
 * GeneratePdfInput 유효성 검사
 */
function validateGeneratePdfInput(body: unknown): body is ExtendedPdfInput {
  if (typeof body !== 'object' || body === null) return false;
  const input = body as Record<string, unknown>;

  // type 필드 확인 (both 추가)
  if (!['problems', 'answers', 'submission', 'both'].includes(input.type as string)) {
    return false;
  }

  // problems/answers/both 유형은 문제 배열 필수
  if (
    (input.type === 'problems' || input.type === 'answers' || input.type === 'both') &&
    (!Array.isArray(input.problems) || input.problems.length === 0)
  ) {
    return false;
  }

  // submission 유형은 submissionData 필수
  if (input.type === 'submission') {
    const submission = input.submissionData as Record<string, unknown> | undefined;
    if (
      !submission ||
      typeof submission.studentName !== 'string' ||
      typeof submission.submittedAt !== 'string' ||
      !Array.isArray(submission.answers)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * GeneratedProblem을 ProblemForPdf로 변환
 */
function convertToProblemForPdf(problem: GeneratedProblem): ProblemForPdf {
  return {
    id: problem.id,
    question: problem.question,
    answer: problem.answer,
    solution: problem.solution,
    difficulty: problem.difficulty as '하' | '중' | '상',
    type: problem.type,
    options: problem.options,
    imageUrl: problem.imageUrl,
  };
}

/**
 * 기존 옵션 형식 정리 (하위 호환성)
 */
function sanitizeOptions(options: Partial<PrintOptions>): PrintOptions {
  return {
    title: options.title || DEFAULT_PRINT_OPTIONS.title,
    academyName: options.academyName || DEFAULT_PRINT_OPTIONS.academyName,
    academyLogo: options.academyLogo,
    studentName: options.studentName || DEFAULT_PRINT_OPTIONS.studentName,
    date: options.date || new Date().toISOString().split('T')[0],
    contentType: ['problem_only', 'with_answer', 'with_solution'].includes(
      options.contentType as string
    )
      ? options.contentType!
      : DEFAULT_PRINT_OPTIONS.contentType,
    template: ['default', 'exam', 'wrong_note'].includes(options.template as string)
      ? options.template!
      : DEFAULT_PRINT_OPTIONS.template,
    problemOrder: ['sequential', 'random'].includes(options.problemOrder as string)
      ? options.problemOrder!
      : DEFAULT_PRINT_OPTIONS.problemOrder,
    showDifficulty:
      typeof options.showDifficulty === 'boolean'
        ? options.showDifficulty
        : DEFAULT_PRINT_OPTIONS.showDifficulty,
    showProblemNumber:
      typeof options.showProblemNumber === 'boolean'
        ? options.showProblemNumber
        : DEFAULT_PRINT_OPTIONS.showProblemNumber,
    showProblemType:
      typeof options.showProblemType === 'boolean'
        ? options.showProblemType
        : DEFAULT_PRINT_OPTIONS.showProblemType,
    pageSize: 'A4',
    orientation:
      options.orientation === 'landscape' ? 'landscape' : 'portrait',
  };
}

/**
 * Problem을 GeneratedProblem으로 변환
 */
function convertToGeneratedProblem(problem: Problem): GeneratedProblem {
  return {
    id: problem.id,
    question: problem.question,
    answer: problem.answer,
    solution: problem.solution,
    difficulty: problem.difficulty,
    type: problem.type,
  };
}

// ============================================
// API 핸들러
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<GeneratePdfResponse | PdfGenerateResponse>> {
  try {
    const body = await request.json();

    // PRD F3 형식 (새로운 형식) 확인
    if (validateGeneratePdfInput(body)) {
      return handleNewFormat(body);
    }

    // 기존 형식 (하위 호환성)
    if (body.problems && Array.isArray(body.problems)) {
      return handleLegacyFormat(body);
    }

    return NextResponse.json(
      {
        success: false,
        error: '잘못된 요청 형식입니다. problems 배열 또는 type 필드가 필요합니다.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('PDF 생성 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'PDF 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 새로운 PRD F3 형식 처리
 */
async function handleNewFormat(
  input: ExtendedPdfInput
): Promise<NextResponse<GeneratePdfResponse | { success: boolean; problemSheet?: unknown; answerSheet?: unknown; error?: string; details?: string }>> {
  const { type, problems, submissionData, options } = input;

  // 문제 유효성 검사
  if (problems) {
    const validProblems: GeneratedProblem[] = [];
    for (const problem of problems) {
      if (validateGeneratedProblem(problem)) {
        validProblems.push(problem);
      }
    }

    if (validProblems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '유효한 문제가 없습니다. 문제 형식을 확인해주세요.',
        },
        { status: 400 }
      );
    }

    // 유효한 문제만 사용
    input.problems = validProblems;
  }

  try {
    // type이 'both'인 경우 문제지와 정답지 동시 생성
    if (type === 'both') {
      // PDF.co로 두 PDF 동시 생성
      const [problemSheetResult, answerSheetResult] = await Promise.all([
        generatePdfWithPdfCo({
          ...input,
          type: 'problems',
          options: { ...options, title: options.title || '문제지' },
        }),
        generatePdfWithPdfCo({
          ...input,
          type: 'answers',
          options: { ...options, title: (options.title || '문제지') + ' - 정답지' },
        }),
      ]);

      return NextResponse.json({
        success: true,
        problemSheet: problemSheetResult,
        answerSheet: answerSheetResult,
      });
    }

    // 기존 단일 PDF 생성 로직
    const result = await generatePdfWithPdfCo(input as GeneratePdfInput);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('PDF 생성 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'PDF 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 기존 형식 처리 (하위 호환성)
 */
async function handleLegacyFormat(
  body: PdfGenerateRequest
): Promise<NextResponse<PdfGenerateResponse>> {
  const { problems, options } = body;

  // 문제 배열 유효성 검사
  if (!Array.isArray(problems) || problems.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: '문제가 선택되지 않았습니다. 최소 1개 이상의 문제를 선택해주세요.',
      },
      { status: 400 }
    );
  }

  // 각 문제 유효성 검사
  const validProblems: Problem[] = [];
  for (const problem of problems) {
    if (validateProblem(problem)) {
      validProblems.push(problem);
    }
  }

  if (validProblems.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: '유효한 문제가 없습니다. 문제 형식을 확인해주세요.',
      },
      { status: 400 }
    );
  }

  // 옵션 정리
  const sanitizedOptions = sanitizeOptions(options || {});

  // 새로운 형식으로 변환하여 PDF 생성 시도
  try {
    // contentType에 따라 showAnswers, showExplanations 설정
    const showAnswers = sanitizedOptions.contentType !== 'problem_only';
    const showExplanations = sanitizedOptions.contentType === 'with_solution';

    const pdfInput: GeneratePdfInput = {
      type: 'problems',
      problems: validProblems.map(convertToGeneratedProblem),
      options: {
        title: sanitizedOptions.title,
        showAnswers,
        showExplanations,
        academyName: sanitizedOptions.academyName,
        academyLogo: sanitizedOptions.academyLogo,
        studentName: sanitizedOptions.studentName,
        date: sanitizedOptions.date,
        paperSize: sanitizedOptions.pageSize,
      },
    };

    const result = await generatePdfWithPdfCo(pdfInput);

    return NextResponse.json({
      success: true,
      pdfBase64: undefined, // 새로운 방식은 URL 반환
      fileName: result.fileName,
      pageCount: result.pageCount,
    });
  } catch (error) {
    // PDF.co 실패 시 기존 방식 (클라이언트 생성) 응답
    console.warn('PDF.co 생성 실패, 클라이언트 생성 모드:', error);
    return NextResponse.json({
      success: true,
      pdfBase64: undefined, // 클라이언트에서 생성
      fileName: `${sanitizedOptions.title}_${sanitizedOptions.date.replace(/-/g, '')}.pdf`,
      pageCount: Math.ceil(validProblems.length / (sanitizedOptions.template === 'exam' ? 6 : 3)),
    });
  }
}

// ============================================
// HTML 미리보기 API
// ============================================

export async function PUT(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateGeneratePdfInput(body)) {
      return NextResponse.json(
        {
          success: false,
          error: '잘못된 요청 형식입니다.',
        },
        { status: 400 }
      );
    }

    // HTML 미리보기 생성 (both 타입은 problems로 처리)
    const previewInput = body.type === 'both' ? { ...body, type: 'problems' as const } : body;
    const html = generatePdfPreviewHtml(previewInput as GeneratePdfInput);

    return NextResponse.json({
      success: true,
      html,
    });
  } catch (error) {
    console.error('HTML 미리보기 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'HTML 미리보기 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

// ============================================
// API 상태 확인
// ============================================

export async function GET(): Promise<NextResponse> {
  // PDF.co API 키 확인
  const hasPdfCoKey = !!process.env.PDF_CO_API_KEY;

  return NextResponse.json({
    status: 'ok',
    message: 'PDF 생성 API가 정상 작동 중입니다.',
    version: '2.1.0',
    features: {
      pdfCoEnabled: hasPdfCoKey,
      supportedTypes: ['problems', 'answers', 'submission', 'both'],
      supportedPaperSizes: ['A4', 'Letter'],
      storageEnabled: true,
      mathRendering: true, // KaTeX 수학 수식 렌더링 지원
    },
    endpoints: {
      POST: {
        description: 'PDF 생성 (PRD F3 형식 또는 기존 형식)',
        newFormat: {
          type: "'problems' | 'answers' | 'submission' | 'both' - PDF 유형 (both: 문제지+정답지 동시 생성)",
          problems: 'GeneratedProblem[] - 문제 배열',
          submissionData: '{ studentName, submittedAt, answers } - 제출 데이터 (submission 유형)',
          options: '{ title, showAnswers, showExplanations, fontSize, paperSize, academyLogo, academyName, ... }',
        },
        legacyFormat: {
          problems: 'Problem[] - 문제 배열',
          options: 'PrintOptions - 출력 옵션',
        },
        bothFormat: {
          description: '문제지와 정답지를 동시에 생성합니다',
          response: '{ success, problemSheet: PdfResult, answerSheet: PdfResult }',
        },
      },
      PUT: {
        description: 'HTML 미리보기 생성',
        body: 'GeneratePdfInput - POST와 동일한 형식',
        response: '{ success, html }',
      },
    },
  });
}
