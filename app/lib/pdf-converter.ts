/**
 * PDF.co API 기반 PDF 변환 유틸리티 (PRD F3)
 *
 * 기능:
 * - HTML 템플릿 기반 PDF 생성
 * - 문제지, 정답지, 제출물 PDF 생성
 * - Supabase Storage 저장
 */

import { createAdminSupabaseClient } from '@/lib/supabase';
import {
  GeneratePdfInput,
  PdfResult,
  PdfCoApiResponse,
  PdfCoOptions,
  GeneratedProblem,
  PDF_CO_CONFIG,
  DIFFICULTY_COLORS,
} from '@/types/pdf';

// ============================================
// PDF.co API 클라이언트
// ============================================

/**
 * PDF.co API 키 확인
 */
function getPdfCoApiKey(): string {
  const apiKey = process.env.PDF_CO_API_KEY;
  if (!apiKey) {
    throw new Error('PDF_CO_API_KEY 환경변수가 설정되지 않았습니다.');
  }
  return apiKey;
}

/**
 * PDF.co API 호출
 */
async function callPdfCoApi(
  endpoint: string,
  options: PdfCoOptions
): Promise<PdfCoApiResponse> {
  const apiKey = getPdfCoApiKey();
  const url = `${PDF_CO_CONFIG.API_URL}${endpoint}`;

  const requestBody = {
    html: options.html,
    templateId: options.templateId,
    templateData: options.templateData,
    paperSize: options.paperSize || PDF_CO_CONFIG.DEFAULT_PAPER_SIZE,
    orientation: options.orientation || 'Portrait',
    margins: options.margins || PDF_CO_CONFIG.DEFAULT_MARGINS,
    header: options.headerHtml,
    footer: options.footerHtml,
    name: options.name || 'document.pdf',
    async: false,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PDF.co API 오류: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * PDF.co API를 통해 HTML을 PDF로 변환
 */
async function convertHtmlToPdf(
  html: string,
  options: Partial<PdfCoOptions> = {}
): Promise<PdfCoApiResponse> {
  return callPdfCoApi(PDF_CO_CONFIG.HTML_TO_PDF_ENDPOINT, {
    html,
    ...options,
  });
}

// ============================================
// HTML 템플릿 생성 함수
// ============================================

/**
 * 공통 스타일 CSS
 */
function getCommonStyles(fontSize: number = 11): string {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Noto Sans KR', sans-serif;
        font-size: ${fontSize}pt;
        line-height: 1.6;
        color: #333;
        padding: 20mm;
      }

      .header {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #333;
      }

      .header-logo {
        max-height: 40px;
        margin-bottom: 10px;
      }

      .header-title {
        font-size: ${fontSize + 6}pt;
        font-weight: 700;
        margin-bottom: 5px;
      }

      .header-info {
        font-size: ${fontSize - 1}pt;
        color: #666;
      }

      .problem {
        margin-bottom: 25px;
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fafafa;
        page-break-inside: avoid;
      }

      .problem-header {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }

      .problem-number {
        font-weight: 700;
        font-size: ${fontSize + 2}pt;
        margin-right: 10px;
        min-width: 30px;
      }

      .difficulty-badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: ${fontSize - 2}pt;
        font-weight: 500;
        color: white;
      }

      .difficulty-easy { background-color: ${DIFFICULTY_COLORS['하']}; }
      .difficulty-medium { background-color: ${DIFFICULTY_COLORS['중']}; }
      .difficulty-hard { background-color: ${DIFFICULTY_COLORS['상']}; }

      .problem-type {
        margin-left: 8px;
        font-size: ${fontSize - 2}pt;
        color: #888;
      }

      .problem-content {
        margin-bottom: 10px;
        white-space: pre-wrap;
      }

      .problem-options {
        margin-top: 10px;
        padding-left: 20px;
      }

      .problem-option {
        margin-bottom: 5px;
      }

      .problem-option-label {
        font-weight: 500;
        margin-right: 8px;
      }

      .answer-section {
        margin-top: 15px;
        padding: 10px;
        background: #e8f4fc;
        border-radius: 4px;
        border-left: 4px solid #2196F3;
      }

      .answer-label {
        font-weight: 700;
        color: #1976D2;
        margin-bottom: 5px;
      }

      .explanation-section {
        margin-top: 10px;
        padding: 10px;
        background: #f0f0f0;
        border-radius: 4px;
        border-left: 4px solid #666;
      }

      .explanation-label {
        font-weight: 700;
        color: #555;
        margin-bottom: 5px;
      }

      .submission-answer {
        margin-top: 10px;
        padding: 10px;
        background: #fff3e0;
        border-radius: 4px;
        border-left: 4px solid #FF9800;
      }

      .footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #e0e0e0;
        text-align: center;
        font-size: ${fontSize - 2}pt;
        color: #888;
      }

      .answer-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
        margin-top: 20px;
      }

      .answer-grid-item {
        padding: 8px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        text-align: center;
      }

      .answer-grid-number {
        font-weight: 700;
        color: #666;
      }

      .answer-grid-value {
        font-weight: 500;
        color: #333;
      }
    </style>
  `;
}

/**
 * 난이도 클래스 이름 반환
 */
function getDifficultyClass(difficulty: string): string {
  const normalized = difficulty.toLowerCase();
  if (normalized === '하' || normalized === 'easy') return 'difficulty-easy';
  if (normalized === '중' || normalized === 'medium') return 'difficulty-medium';
  if (normalized === '상' || normalized === 'hard') return 'difficulty-hard';
  return 'difficulty-medium';
}

/**
 * 난이도 라벨 반환
 */
function getDifficultyLabel(difficulty: string): string {
  const map: Record<string, string> = {
    easy: '하',
    medium: '중',
    hard: '상',
    '하': '하',
    '중': '중',
    '상': '상',
  };
  return map[difficulty.toLowerCase()] || difficulty;
}

/**
 * 헤더 HTML 생성
 */
function generateHeaderHtml(options: GeneratePdfInput['options']): string {
  const logoHtml = options.academyLogo
    ? `<img src="${options.academyLogo}" alt="학원 로고" class="header-logo" />`
    : '';

  const infoParts: string[] = [];
  if (options.academyName) infoParts.push(options.academyName);
  if (options.studentName) infoParts.push(options.studentName);
  if (options.date) infoParts.push(options.date);

  return `
    <div class="header">
      ${logoHtml}
      <div class="header-title">${options.title || '문제지'}</div>
      ${infoParts.length > 0 ? `<div class="header-info">${infoParts.join(' | ')}</div>` : ''}
    </div>
  `;
}

/**
 * 문제지 HTML 템플릿 생성
 */
function generateProblemsTemplate(
  problems: GeneratedProblem[],
  options: GeneratePdfInput['options']
): string {
  const showAnswers = options.showAnswers ?? false;
  const showExplanations = options.showExplanations ?? false;
  const fontSize = options.fontSize ?? 11;

  const problemsHtml = problems
    .map((problem, index) => {
      // 객관식 보기 HTML
      const optionsHtml = problem.options?.length
        ? `
          <div class="problem-options">
            ${problem.options
              .map(
                (opt) =>
                  `<div class="problem-option">
                    <span class="problem-option-label">${opt.id}.</span>
                    ${opt.text}
                  </div>`
              )
              .join('')}
          </div>
        `
        : '';

      // 정답 HTML
      const answerHtml = showAnswers
        ? `
          <div class="answer-section">
            <div class="answer-label">정답</div>
            <div>${problem.answer}</div>
          </div>
        `
        : '';

      // 해설 HTML
      const explanationHtml = showExplanations && problem.solution
        ? `
          <div class="explanation-section">
            <div class="explanation-label">풀이</div>
            <div>${problem.solution}</div>
          </div>
        `
        : '';

      return `
        <div class="problem">
          <div class="problem-header">
            <span class="problem-number">${index + 1}.</span>
            <span class="difficulty-badge ${getDifficultyClass(problem.difficulty)}">
              ${getDifficultyLabel(problem.difficulty)}
            </span>
            ${problem.type ? `<span class="problem-type">(${problem.type})</span>` : ''}
          </div>
          <div class="problem-content">${problem.question}</div>
          ${optionsHtml}
          ${answerHtml}
          ${explanationHtml}
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${options.title || '문제지'}</title>
      ${getCommonStyles(fontSize)}
    </head>
    <body>
      ${generateHeaderHtml(options)}
      <main>
        ${problemsHtml}
      </main>
      <div class="footer">
        EduFlow - AI 기반 학원 관리 시스템
      </div>
    </body>
    </html>
  `;
}

/**
 * 정답지 HTML 템플릿 생성
 */
function generateAnswersTemplate(
  problems: GeneratedProblem[],
  options: GeneratePdfInput['options']
): string {
  const fontSize = options.fontSize ?? 11;

  // 정답 그리드 생성
  const answerGridHtml = `
    <div class="answer-grid">
      ${problems
        .map(
          (problem, index) => `
          <div class="answer-grid-item">
            <div class="answer-grid-number">${index + 1}</div>
            <div class="answer-grid-value">${problem.answer}</div>
          </div>
        `
        )
        .join('')}
    </div>
  `;

  // 상세 정답 및 해설
  const detailsHtml = problems
    .map((problem, index) => {
      return `
        <div class="problem">
          <div class="problem-header">
            <span class="problem-number">${index + 1}.</span>
            <span class="difficulty-badge ${getDifficultyClass(problem.difficulty)}">
              ${getDifficultyLabel(problem.difficulty)}
            </span>
          </div>
          <div class="answer-section">
            <div class="answer-label">정답</div>
            <div>${problem.answer}</div>
          </div>
          ${
            problem.solution
              ? `
            <div class="explanation-section">
              <div class="explanation-label">풀이</div>
              <div>${problem.solution}</div>
            </div>
          `
              : ''
          }
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${options.title || '정답지'}</title>
      ${getCommonStyles(fontSize)}
    </head>
    <body>
      ${generateHeaderHtml({ ...options, title: (options.title || '정답지') + ' - 정답 및 해설' })}
      <main>
        <h3 style="margin-bottom: 15px;">빠른 정답 확인</h3>
        ${answerGridHtml}
        <h3 style="margin: 30px 0 15px;">상세 해설</h3>
        ${detailsHtml}
      </main>
      <div class="footer">
        EduFlow - AI 기반 학원 관리 시스템
      </div>
    </body>
    </html>
  `;
}

/**
 * 제출물 HTML 템플릿 생성
 */
function generateSubmissionTemplate(
  problems: GeneratedProblem[],
  submissionData: GeneratePdfInput['submissionData'],
  options: GeneratePdfInput['options']
): string {
  const fontSize = options.fontSize ?? 11;

  if (!submissionData) {
    throw new Error('제출물 데이터가 필요합니다.');
  }

  // 학생 답안 맵 생성
  const answerMap = new Map(
    submissionData.answers.map((a) => [a.problemId, a.answer])
  );

  const submissionHtml = problems
    .map((problem, index) => {
      const studentAnswer = answerMap.get(problem.id) || '미제출';
      const isCorrect = studentAnswer === problem.answer;

      return `
        <div class="problem">
          <div class="problem-header">
            <span class="problem-number">${index + 1}.</span>
            <span class="difficulty-badge ${getDifficultyClass(problem.difficulty)}">
              ${getDifficultyLabel(problem.difficulty)}
            </span>
          </div>
          <div class="problem-content">${problem.question}</div>
          <div class="submission-answer">
            <div style="font-weight: 700; margin-bottom: 5px;">
              학생 답안: ${studentAnswer}
              <span style="margin-left: 10px; color: ${isCorrect ? '#4CAF50' : '#F44336'};">
                ${isCorrect ? '(정답)' : '(오답)'}
              </span>
            </div>
          </div>
          <div class="answer-section">
            <div class="answer-label">정답</div>
            <div>${problem.answer}</div>
          </div>
        </div>
      `;
    })
    .join('');

  // 점수 계산
  const correctCount = problems.filter(
    (p) => answerMap.get(p.id) === p.answer
  ).length;
  const totalCount = problems.length;
  const score = Math.round((correctCount / totalCount) * 100);

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${options.title || '제출물'}</title>
      ${getCommonStyles(fontSize)}
      <style>
        .score-summary {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          color: white;
          text-align: center;
          margin-bottom: 25px;
        }
        .score-value {
          font-size: 36pt;
          font-weight: 700;
        }
        .score-detail {
          font-size: 14pt;
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      ${generateHeaderHtml({
        ...options,
        title: options.title || '과제 결과',
        studentName: submissionData.studentName,
      })}
      <main>
        <div class="score-summary">
          <div class="score-value">${score}점</div>
          <div class="score-detail">정답: ${correctCount} / 전체: ${totalCount}</div>
          <div class="score-detail">제출 시간: ${new Date(submissionData.submittedAt).toLocaleString('ko-KR')}</div>
        </div>
        ${submissionHtml}
      </main>
      <div class="footer">
        EduFlow - AI 기반 학원 관리 시스템
      </div>
    </body>
    </html>
  `;
}

// ============================================
// Supabase Storage 저장 함수
// ============================================

/**
 * PDF 파일을 Supabase Storage에 저장
 */
async function savePdfToStorage(
  pdfUrl: string,
  fileName: string
): Promise<{ url: string; path: string }> {
  const supabase = createAdminSupabaseClient();

  // PDF.co에서 PDF 다운로드
  const pdfResponse = await fetch(pdfUrl);
  if (!pdfResponse.ok) {
    throw new Error('PDF 파일 다운로드 실패');
  }

  const pdfBuffer = await pdfResponse.arrayBuffer();
  const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

  // Storage 경로 생성 (pdfs/YYYY/MM/filename.pdf)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now();
  const storagePath = `pdfs/${year}/${month}/${timestamp}_${fileName}`;

  // Supabase Storage에 업로드
  const { data, error } = await supabase.storage
    .from('eduflow-files')
    .upload(storagePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage 업로드 실패: ${error.message}`);
  }

  // 공개 URL 생성
  const { data: urlData } = supabase.storage
    .from('eduflow-files')
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

// ============================================
// Mock 모드 (API 키 없을 때)
// ============================================

/**
 * Mock PDF 생성 (개발/테스트용)
 */
function generateMockPdfResult(
  type: string,
  problemCount: number
): PdfResult {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PDF_CO_CONFIG.URL_EXPIRY_HOURS * 60 * 60 * 1000);
  const fileName = `${type}_${now.getTime()}.pdf`;

  return {
    url: `https://example.com/mock/${fileName}`,
    downloadUrl: `https://example.com/mock/download/${fileName}`,
    expiresAt: expiresAt.toISOString(),
    pageCount: Math.ceil(problemCount / 4),
    fileSize: problemCount * 2048,
    fileName,
  };
}

// ============================================
// 메인 PDF 생성 함수
// ============================================

/**
 * PDF 생성 메인 함수
 *
 * @param input - PDF 생성 입력 데이터
 * @returns PDF 생성 결과
 *
 * @example
 * // 문제지 생성
 * const result = await generatePdfWithPdfCo({
 *   type: 'problems',
 *   problems: [...],
 *   options: { title: '수학 문제지', showAnswers: false }
 * });
 *
 * @example
 * // 정답지 생성
 * const result = await generatePdfWithPdfCo({
 *   type: 'answers',
 *   problems: [...],
 *   options: { title: '수학 정답지' }
 * });
 *
 * @example
 * // 제출물 PDF 생성
 * const result = await generatePdfWithPdfCo({
 *   type: 'submission',
 *   problems: [...],
 *   submissionData: { studentName: '홍길동', submittedAt: '...', answers: [...] },
 *   options: { title: '과제 결과' }
 * });
 */
export async function generatePdfWithPdfCo(
  input: GeneratePdfInput
): Promise<PdfResult> {
  const { type, problems, submissionData, options } = input;

  // 입력 검증
  if ((type === 'problems' || type === 'answers') && (!problems || problems.length === 0)) {
    throw new Error('문제 목록이 필요합니다.');
  }

  if (type === 'submission' && !submissionData) {
    throw new Error('제출 데이터가 필요합니다.');
  }

  // API 키 확인 (없으면 Mock 모드)
  const apiKey = process.env.PDF_CO_API_KEY;
  if (!apiKey) {
    console.warn('PDF_CO_API_KEY가 설정되지 않았습니다. Mock 모드로 동작합니다.');
    return generateMockPdfResult(type, problems?.length || 0);
  }

  // HTML 템플릿 생성
  let html: string;
  switch (type) {
    case 'problems':
      html = generateProblemsTemplate(problems!, options);
      break;
    case 'answers':
      html = generateAnswersTemplate(problems!, options);
      break;
    case 'submission':
      html = generateSubmissionTemplate(problems!, submissionData, options);
      break;
    default:
      throw new Error(`지원하지 않는 PDF 유형: ${type}`);
  }

  // 파일명 생성
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `${options.title || type}_${dateStr}.pdf`;

  // PDF.co API 호출
  const pdfResponse = await convertHtmlToPdf(html, {
    paperSize: options.paperSize || 'A4',
    orientation: 'Portrait',
    margins: '15',
    name: fileName,
  });

  if (pdfResponse.error || !pdfResponse.url) {
    throw new Error(pdfResponse.message || 'PDF 생성 실패');
  }

  // Supabase Storage에 저장 (선택적)
  let storageResult: { url: string; path: string } | null = null;
  try {
    storageResult = await savePdfToStorage(pdfResponse.url, fileName);
  } catch (storageError) {
    console.warn('Supabase Storage 저장 실패, PDF.co URL 사용:', storageError);
  }

  // 결과 반환
  const expiresAt = new Date(
    now.getTime() + PDF_CO_CONFIG.URL_EXPIRY_HOURS * 60 * 60 * 1000
  );

  return {
    url: storageResult?.url || pdfResponse.url,
    downloadUrl: storageResult?.url || pdfResponse.url,
    expiresAt: expiresAt.toISOString(),
    pageCount: pdfResponse.pageCount || 1,
    fileName,
  };
}

/**
 * HTML 미리보기용 함수 (PDF 생성 없이 HTML만 반환)
 */
export function generatePdfPreviewHtml(input: GeneratePdfInput): string {
  const { type, problems, submissionData, options } = input;

  switch (type) {
    case 'problems':
      return generateProblemsTemplate(problems!, options);
    case 'answers':
      return generateAnswersTemplate(problems!, options);
    case 'submission':
      return generateSubmissionTemplate(problems!, submissionData, options);
    default:
      throw new Error(`지원하지 않는 PDF 유형: ${type}`);
  }
}

// 기존 클라이언트용 함수와 호환성 유지를 위한 re-export
export { generatePdf, generatePdfBlob, downloadPdf } from './pdf';
