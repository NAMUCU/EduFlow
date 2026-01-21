/**
 * PDF 문제지 생성 서비스
 *
 * 기능:
 * - 문제지 PDF 생성 (KaTeX 수학 수식 렌더링 지원)
 * - 정답지 PDF 생성
 * - 학원 로고, 제목, 날짜 포함
 * - 클라이언트/서버 양쪽에서 사용 가능
 */

import jsPDF from 'jspdf';

// ============================================
// 타입 정의
// ============================================

export interface ProblemForPdf {
  id: string;
  question: string;
  answer: string;
  solution?: string;
  difficulty: '하' | '중' | '상' | 'easy' | 'medium' | 'hard';
  type?: string;
  options?: Array<{ id: string; text: string; isCorrect?: boolean }>;
  imageUrl?: string;
}

export interface PdfGenerationOptions {
  // 기본 정보
  title: string;
  academyName?: string;
  academyLogo?: string; // Base64 또는 URL
  studentName?: string;
  date?: string;

  // 레이아웃
  template?: 'default' | 'exam' | 'wrong_note';
  columns?: 1 | 2;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';

  // 표시 옵션
  showDifficulty?: boolean;
  showProblemNumber?: boolean;
  showProblemType?: boolean;
  problemOrder?: 'sequential' | 'random';

  // 수학 수식 옵션
  enableMathRendering?: boolean;

  // 폰트 설정
  fontSize?: number;
}

export interface PdfGenerationResult {
  success: boolean;
  pdfBlob?: Blob;
  pdfBase64?: string;
  fileName: string;
  pageCount: number;
  error?: string;
}

// ============================================
// 상수 정의
// ============================================

const A4 = { width: 210, height: 297 };
const LETTER = { width: 216, height: 279 };

const DEFAULT_OPTIONS: PdfGenerationOptions = {
  title: '문제지',
  date: new Date().toISOString().split('T')[0],
  template: 'default',
  columns: 1,
  pageSize: 'A4',
  orientation: 'portrait',
  showDifficulty: true,
  showProblemNumber: true,
  showProblemType: false,
  problemOrder: 'sequential',
  enableMathRendering: true,
  fontSize: 11,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  '하': '#10B981',
  '중': '#F59E0B',
  '상': '#EF4444',
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '하',
  medium: '중',
  hard: '상',
  '하': '하',
  '중': '중',
  '상': '상',
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 난이도 라벨 반환
 */
function getDifficultyLabel(difficulty: string): string {
  return DIFFICULTY_LABELS[difficulty] || difficulty;
}

/**
 * 난이도 색상 반환
 */
function getDifficultyColor(difficulty: string): string {
  return DIFFICULTY_COLORS[difficulty] || '#6B7280';
}

/**
 * 문제 순서 섞기 (Fisher-Yates)
 */
function shuffleProblems<T>(problems: T[]): T[] {
  const shuffled = [...problems];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * LaTeX/KaTeX 수식 패턴 검출
 */
function containsMathExpression(text: string): boolean {
  // 인라인 수식: $...$, \(...\)
  // 블록 수식: $$...$$, \[...\]
  const mathPatterns = [
    /\$\$[\s\S]+?\$\$/,
    /\$[^$]+\$/,
    /\\\[[\s\S]+?\\\]/,
    /\\\([\s\S]+?\\\)/,
    /\\frac\{/,
    /\\sqrt\{/,
    /\\sum/,
    /\\int/,
    /\\lim/,
    /\^{/,
    /_{/,
  ];
  return mathPatterns.some((pattern) => pattern.test(text));
}

/**
 * 수식을 플레인 텍스트로 변환 (jsPDF용)
 * 실제 구현에서는 서버 사이드 렌더링 또는 canvas 기반 렌더링 사용
 */
function convertMathToPlainText(text: string): string {
  return text
    // 분수: \frac{a}{b} -> a/b
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    // 제곱근: \sqrt{x} -> sqrt(x)
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
    // 지수: x^{2} -> x^2, x^2 유지
    .replace(/\^{([^}]+)}/g, '^$1')
    // 아래첨자: x_{n} -> x_n
    .replace(/_{([^}]+)}/g, '_$1')
    // 곱셈: \times -> x
    .replace(/\\times/g, 'x')
    // 나눗셈: \div -> /
    .replace(/\\div/g, '/')
    // 부등호: \leq, \geq
    .replace(/\\leq/g, '<=')
    .replace(/\\geq/g, '>=')
    // 무한대: \infty
    .replace(/\\infty/g, 'infinity')
    // 파이: \pi
    .replace(/\\pi/g, 'pi')
    // 시그마: \sum
    .replace(/\\sum/g, 'SUM')
    // 적분: \int
    .replace(/\\int/g, 'INT')
    // 극한: \lim
    .replace(/\\lim/g, 'lim')
    // 로그: \log, \ln
    .replace(/\\log/g, 'log')
    .replace(/\\ln/g, 'ln')
    // 삼각함수
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    // 수식 구분자 제거
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\\\[/g, '')
    .replace(/\\\]/g, '')
    .replace(/\\\(/g, '')
    .replace(/\\\)/g, '')
    // 중괄호
    .replace(/\\{/g, '{')
    .replace(/\\}/g, '}')
    // 공백 정리
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 텍스트를 여러 줄로 분할
 */
function splitTextToLines(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  enableMath: boolean
): string[] {
  // 수식이 포함된 경우 플레인 텍스트로 변환
  const processedText = enableMath && containsMathExpression(text)
    ? convertMathToPlainText(text)
    : text;

  const lines: string[] = [];
  const paragraphs = processedText.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }
    const splitLines = doc.splitTextToSize(paragraph, maxWidth);
    lines.push(...splitLines);
  }

  return lines;
}

// ============================================
// HTML 템플릿 생성 (KaTeX 지원)
// ============================================

/**
 * KaTeX CSS 및 JS 포함
 */
function getKatexIncludes(): string {
  return `
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
      onload="renderMathInElement(document.body, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\\\[', right: '\\\\]', display: true},
          {left: '\\\\(', right: '\\\\)', display: false}
        ],
        throwOnError: false
      });"></script>
  `;
}

/**
 * 공통 CSS 스타일
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
        padding: 15mm;
      }

      .header {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #333;
      }

      .header-logo {
        max-height: 50px;
        margin-bottom: 10px;
      }

      .header-title {
        font-size: ${fontSize + 6}pt;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .header-info {
        font-size: ${fontSize - 1}pt;
        color: #666;
      }

      .problems-container {
        columns: var(--columns, 1);
        column-gap: 20px;
      }

      .problem {
        break-inside: avoid;
        margin-bottom: 25px;
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fafafa;
      }

      .problem-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }

      .problem-number {
        font-weight: 700;
        font-size: ${fontSize + 2}pt;
        min-width: 30px;
      }

      .difficulty-badge {
        padding: 3px 10px;
        border-radius: 4px;
        font-size: ${fontSize - 2}pt;
        font-weight: 500;
        color: white;
      }

      .difficulty-easy { background-color: #10B981; }
      .difficulty-medium { background-color: #F59E0B; }
      .difficulty-hard { background-color: #EF4444; }

      .problem-type {
        font-size: ${fontSize - 2}pt;
        color: #888;
      }

      .problem-content {
        margin-bottom: 12px;
        white-space: pre-wrap;
        word-break: keep-all;
      }

      .problem-image {
        max-width: 100%;
        margin: 10px 0;
        border-radius: 4px;
      }

      .problem-options {
        margin-top: 12px;
        padding-left: 15px;
      }

      .problem-option {
        margin-bottom: 6px;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .option-label {
        font-weight: 600;
        min-width: 20px;
      }

      .answer-section {
        margin-top: 15px;
        padding: 12px;
        background: #e3f2fd;
        border-radius: 6px;
        border-left: 4px solid #2196F3;
      }

      .answer-label {
        font-weight: 700;
        color: #1565C0;
        margin-bottom: 5px;
      }

      .solution-section {
        margin-top: 12px;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 6px;
        border-left: 4px solid #757575;
      }

      .solution-label {
        font-weight: 700;
        color: #424242;
        margin-bottom: 5px;
      }

      .answer-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
        margin: 20px 0;
      }

      .answer-grid-item {
        padding: 10px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        text-align: center;
        background: white;
      }

      .answer-grid-number {
        font-weight: 700;
        color: #666;
        font-size: ${fontSize - 1}pt;
      }

      .answer-grid-value {
        font-weight: 600;
        color: #1565C0;
        margin-top: 4px;
      }

      .footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #e0e0e0;
        text-align: center;
        font-size: ${fontSize - 2}pt;
        color: #888;
      }

      .katex { font-size: 1.1em; }
      .katex-display { margin: 10px 0; }

      @media print {
        body { padding: 0; }
        .problem { page-break-inside: avoid; }
      }
    </style>
  `;
}

/**
 * 문제지 HTML 생성
 */
export function generateProblemSheetHtml(
  problems: ProblemForPdf[],
  options: PdfGenerationOptions
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const orderedProblems = opts.problemOrder === 'random'
    ? shuffleProblems(problems)
    : problems;

  const headerHtml = `
    <div class="header">
      ${opts.academyLogo ? `<img src="${opts.academyLogo}" alt="학원 로고" class="header-logo" />` : ''}
      <div class="header-title">${opts.title}</div>
      <div class="header-info">
        ${[opts.academyName, opts.studentName, opts.date].filter(Boolean).join(' | ')}
      </div>
    </div>
  `;

  const problemsHtml = orderedProblems.map((problem, index) => {
    const difficultyClass = `difficulty-${getDifficultyLabel(problem.difficulty) === '하' ? 'easy' : getDifficultyLabel(problem.difficulty) === '중' ? 'medium' : 'hard'}`;

    const optionsHtml = problem.options?.length ? `
      <div class="problem-options">
        ${problem.options.map((opt) => `
          <div class="problem-option">
            <span class="option-label">${opt.id}.</span>
            <span>${opt.text}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    const imageHtml = problem.imageUrl
      ? `<img src="${problem.imageUrl}" alt="문제 이미지" class="problem-image" />`
      : '';

    return `
      <div class="problem">
        <div class="problem-header">
          ${opts.showProblemNumber ? `<span class="problem-number">${index + 1}.</span>` : ''}
          ${opts.showDifficulty ? `<span class="difficulty-badge ${difficultyClass}">${getDifficultyLabel(problem.difficulty)}</span>` : ''}
          ${opts.showProblemType && problem.type ? `<span class="problem-type">(${problem.type})</span>` : ''}
        </div>
        <div class="problem-content">${problem.question}</div>
        ${imageHtml}
        ${optionsHtml}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${opts.title}</title>
      ${getKatexIncludes()}
      ${getCommonStyles(opts.fontSize)}
      <style>
        .problems-container { --columns: ${opts.columns || 1}; }
      </style>
    </head>
    <body>
      ${headerHtml}
      <div class="problems-container">
        ${problemsHtml}
      </div>
      <div class="footer">
        EduFlow - AI 기반 학원 관리 시스템
      </div>
    </body>
    </html>
  `;
}

/**
 * 정답지 HTML 생성
 */
export function generateAnswerSheetHtml(
  problems: ProblemForPdf[],
  options: PdfGenerationOptions
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const orderedProblems = opts.problemOrder === 'random'
    ? shuffleProblems(problems)
    : problems;

  const headerHtml = `
    <div class="header">
      ${opts.academyLogo ? `<img src="${opts.academyLogo}" alt="학원 로고" class="header-logo" />` : ''}
      <div class="header-title">${opts.title} - 정답 및 해설</div>
      <div class="header-info">
        ${[opts.academyName, opts.studentName, opts.date].filter(Boolean).join(' | ')}
      </div>
    </div>
  `;

  // 빠른 정답 확인 그리드
  const answerGridHtml = `
    <h3 style="margin: 20px 0 15px; font-size: 14pt;">빠른 정답 확인</h3>
    <div class="answer-grid">
      ${orderedProblems.map((problem, index) => `
        <div class="answer-grid-item">
          <div class="answer-grid-number">${index + 1}</div>
          <div class="answer-grid-value">${problem.answer}</div>
        </div>
      `).join('')}
    </div>
  `;

  // 상세 해설
  const detailsHtml = `
    <h3 style="margin: 30px 0 15px; font-size: 14pt;">상세 해설</h3>
    ${orderedProblems.map((problem, index) => {
      const difficultyClass = `difficulty-${getDifficultyLabel(problem.difficulty) === '하' ? 'easy' : getDifficultyLabel(problem.difficulty) === '중' ? 'medium' : 'hard'}`;

      return `
        <div class="problem">
          <div class="problem-header">
            <span class="problem-number">${index + 1}.</span>
            <span class="difficulty-badge ${difficultyClass}">${getDifficultyLabel(problem.difficulty)}</span>
          </div>
          <div class="problem-content" style="color: #666; font-size: 10pt;">${problem.question}</div>
          <div class="answer-section">
            <div class="answer-label">정답</div>
            <div>${problem.answer}</div>
          </div>
          ${problem.solution ? `
            <div class="solution-section">
              <div class="solution-label">풀이</div>
              <div>${problem.solution}</div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('')}
  `;

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${opts.title} - 정답지</title>
      ${getKatexIncludes()}
      ${getCommonStyles(opts.fontSize)}
    </head>
    <body>
      ${headerHtml}
      ${answerGridHtml}
      ${detailsHtml}
      <div class="footer">
        EduFlow - AI 기반 학원 관리 시스템
      </div>
    </body>
    </html>
  `;
}

// ============================================
// jsPDF 기반 PDF 생성 (클라이언트용)
// ============================================

/**
 * 문제지 PDF 생성 (jsPDF 사용)
 */
export async function generateProblemSheetPDF(
  problems: ProblemForPdf[],
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const pageSize = opts.pageSize === 'Letter' ? LETTER : A4;
    const isLandscape = opts.orientation === 'landscape';

    const doc = new jsPDF({
      orientation: opts.orientation || 'portrait',
      unit: 'mm',
      format: opts.pageSize || 'A4',
    });

    const pageWidth = isLandscape ? pageSize.height : pageSize.width;
    const pageHeight = isLandscape ? pageSize.width : pageSize.height;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const maxY = pageHeight - margin - 10; // 푸터 공간

    // 문제 순서 처리
    const orderedProblems = opts.problemOrder === 'random'
      ? shuffleProblems(problems)
      : problems;

    let yPos = margin;
    let pageCount = 1;
    const fontSize = opts.fontSize || 11;
    const lineHeight = fontSize * 0.4;

    // 헤더 그리기
    const drawHeader = () => {
      // 로고 (있는 경우)
      if (opts.academyLogo) {
        try {
          doc.addImage(opts.academyLogo, 'PNG', margin, yPos, 15, 15);
        } catch {
          // 로고 로드 실패 시 무시
        }
      }

      // 제목
      doc.setFontSize(fontSize + 6);
      doc.setFont('helvetica', 'bold');
      doc.text(opts.title, pageWidth / 2, yPos + 8, { align: 'center' });

      yPos += 15;

      // 부제목
      const infoParts = [opts.academyName, opts.studentName, opts.date].filter(Boolean);
      if (infoParts.length > 0) {
        doc.setFontSize(fontSize - 1);
        doc.setFont('helvetica', 'normal');
        doc.text(infoParts.join(' | '), pageWidth / 2, yPos + 3, { align: 'center' });
        yPos += 8;
      }

      // 구분선
      doc.setDrawColor(100);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);
      yPos += 10;
    };

    // 푸터 그리기
    const drawFooter = (pageNum: number, total: number) => {
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(`페이지 ${pageNum} / ${total}`, pageWidth / 2, pageHeight - 8, {
        align: 'center',
      });
      doc.setTextColor(0);
    };

    // 새 페이지 추가
    const addNewPage = () => {
      doc.addPage();
      pageCount++;
      yPos = margin;
      drawHeader();
    };

    // 첫 페이지 헤더
    drawHeader();

    // 문제 그리기
    for (let i = 0; i < orderedProblems.length; i++) {
      const problem = orderedProblems[i];

      // 문제 높이 예측
      const questionLines = splitTextToLines(
        doc,
        problem.question,
        contentWidth - 10,
        opts.enableMathRendering || false
      );
      const estimatedHeight = (questionLines.length + 3) * lineHeight + 20;

      // 페이지 넘김 필요 시
      if (yPos + estimatedHeight > maxY) {
        addNewPage();
      }

      // 문제 번호 및 난이도
      doc.setFontSize(fontSize + 1);
      doc.setFont('helvetica', 'bold');

      let headerText = '';
      if (opts.showProblemNumber) {
        headerText = `${i + 1}. `;
      }
      doc.text(headerText, margin, yPos);

      // 난이도 배지
      if (opts.showDifficulty) {
        const numberWidth = doc.getTextWidth(headerText);
        const diffLabel = getDifficultyLabel(problem.difficulty);
        const diffColor = getDifficultyColor(problem.difficulty);

        // 배지 배경
        doc.setFillColor(diffColor);
        doc.roundedRect(
          margin + numberWidth,
          yPos - 4,
          12,
          6,
          1,
          1,
          'F'
        );

        // 배지 텍스트
        doc.setFontSize(fontSize - 2);
        doc.setTextColor(255);
        doc.text(diffLabel, margin + numberWidth + 6, yPos, { align: 'center' });
        doc.setTextColor(0);
      }

      yPos += lineHeight + 3;

      // 문제 내용
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
      for (const line of questionLines) {
        doc.text(line, margin + 5, yPos);
        yPos += lineHeight;
      }

      yPos += lineHeight * 0.5;

      // 객관식 보기
      if (problem.options?.length) {
        for (const opt of problem.options) {
          doc.setFont('helvetica', 'bold');
          doc.text(`${opt.id}.`, margin + 10, yPos);
          doc.setFont('helvetica', 'normal');

          const optText = opts.enableMathRendering && containsMathExpression(opt.text)
            ? convertMathToPlainText(opt.text)
            : opt.text;
          doc.text(optText, margin + 20, yPos);
          yPos += lineHeight;
        }
      }

      yPos += lineHeight * 1.5;
    }

    // 모든 페이지에 푸터 추가
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      drawFooter(p, totalPages);
    }

    // 결과 반환
    const dateStr = (opts.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const fileName = `${opts.title}_${dateStr}.pdf`;

    return {
      success: true,
      pdfBlob: doc.output('blob'),
      pdfBase64: doc.output('datauristring'),
      fileName,
      pageCount: totalPages,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PDF 생성 실패',
      fileName: '',
      pageCount: 0,
    };
  }
}

/**
 * 정답지 PDF 생성 (jsPDF 사용)
 */
export async function generateAnswerSheetPDF(
  problems: ProblemForPdf[],
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const pageSize = opts.pageSize === 'Letter' ? LETTER : A4;
    const isLandscape = opts.orientation === 'landscape';

    const doc = new jsPDF({
      orientation: opts.orientation || 'portrait',
      unit: 'mm',
      format: opts.pageSize || 'A4',
    });

    const pageWidth = isLandscape ? pageSize.height : pageSize.width;
    const pageHeight = isLandscape ? pageSize.width : pageSize.height;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const maxY = pageHeight - margin - 10;

    const orderedProblems = opts.problemOrder === 'random'
      ? shuffleProblems(problems)
      : problems;

    let yPos = margin;
    let pageCount = 1;
    const fontSize = opts.fontSize || 11;
    const lineHeight = fontSize * 0.4;

    // 헤더 그리기
    const drawHeader = () => {
      if (opts.academyLogo) {
        try {
          doc.addImage(opts.academyLogo, 'PNG', margin, yPos, 15, 15);
        } catch {
          // 무시
        }
      }

      doc.setFontSize(fontSize + 6);
      doc.setFont('helvetica', 'bold');
      doc.text(`${opts.title} - 정답 및 해설`, pageWidth / 2, yPos + 8, { align: 'center' });

      yPos += 15;

      const infoParts = [opts.academyName, opts.studentName, opts.date].filter(Boolean);
      if (infoParts.length > 0) {
        doc.setFontSize(fontSize - 1);
        doc.setFont('helvetica', 'normal');
        doc.text(infoParts.join(' | '), pageWidth / 2, yPos + 3, { align: 'center' });
        yPos += 8;
      }

      doc.setDrawColor(100);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);
      yPos += 10;
    };

    const drawFooter = (pageNum: number, total: number) => {
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(`페이지 ${pageNum} / ${total}`, pageWidth / 2, pageHeight - 8, {
        align: 'center',
      });
      doc.setTextColor(0);
    };

    const addNewPage = () => {
      doc.addPage();
      pageCount++;
      yPos = margin;
      drawHeader();
    };

    // 첫 페이지 헤더
    drawHeader();

    // 빠른 정답 확인 섹션
    doc.setFontSize(fontSize + 2);
    doc.setFont('helvetica', 'bold');
    doc.text('빠른 정답 확인', margin, yPos);
    yPos += lineHeight + 5;

    // 정답 그리드 (5열)
    const gridCols = 5;
    const cellWidth = contentWidth / gridCols;
    const cellHeight = 12;

    for (let i = 0; i < orderedProblems.length; i++) {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const x = margin + col * cellWidth;
      const y = yPos + row * cellHeight;

      // 페이지 넘김 체크
      if (y + cellHeight > maxY) {
        addNewPage();
        doc.setFontSize(fontSize + 2);
        doc.setFont('helvetica', 'bold');
        doc.text('빠른 정답 확인 (계속)', margin, yPos);
        yPos += lineHeight + 5;
      }

      // 셀 테두리
      doc.setDrawColor(200);
      doc.rect(x, y, cellWidth - 2, cellHeight - 2);

      // 문제 번호
      doc.setFontSize(fontSize - 2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100);
      doc.text(`${i + 1}`, x + 3, y + 4);

      // 정답
      doc.setFontSize(fontSize);
      doc.setTextColor(21, 101, 192); // #1565C0
      const answerText = opts.enableMathRendering && containsMathExpression(orderedProblems[i].answer)
        ? convertMathToPlainText(orderedProblems[i].answer)
        : orderedProblems[i].answer;
      doc.text(answerText.substring(0, 10), x + 3, y + 9);
      doc.setTextColor(0);
    }

    // 그리드 아래로 이동
    const gridRows = Math.ceil(orderedProblems.length / gridCols);
    yPos += gridRows * cellHeight + 15;

    // 상세 해설 섹션
    if (yPos > maxY - 30) {
      addNewPage();
    }

    doc.setFontSize(fontSize + 2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('상세 해설', margin, yPos);
    yPos += lineHeight + 8;

    // 각 문제별 해설
    for (let i = 0; i < orderedProblems.length; i++) {
      const problem = orderedProblems[i];

      // 높이 예측
      const solutionLines = problem.solution
        ? splitTextToLines(doc, problem.solution, contentWidth - 15, opts.enableMathRendering || false)
        : [];
      const estimatedHeight = (solutionLines.length + 4) * lineHeight + 25;

      if (yPos + estimatedHeight > maxY) {
        addNewPage();
      }

      // 문제 번호 및 난이도
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}.`, margin, yPos);

      if (opts.showDifficulty) {
        const diffLabel = getDifficultyLabel(problem.difficulty);
        const diffColor = getDifficultyColor(problem.difficulty);
        doc.setFillColor(diffColor);
        doc.roundedRect(margin + 12, yPos - 4, 12, 6, 1, 1, 'F');
        doc.setFontSize(fontSize - 2);
        doc.setTextColor(255);
        doc.text(diffLabel, margin + 18, yPos, { align: 'center' });
        doc.setTextColor(0);
      }

      yPos += lineHeight + 5;

      // 정답
      doc.setFillColor(227, 242, 253); // #e3f2fd
      doc.roundedRect(margin + 5, yPos - 4, contentWidth - 10, lineHeight + 6, 2, 2, 'F');
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(21, 101, 192);
      doc.text('정답: ', margin + 8, yPos);
      doc.setFont('helvetica', 'normal');
      const answerText = opts.enableMathRendering && containsMathExpression(problem.answer)
        ? convertMathToPlainText(problem.answer)
        : problem.answer;
      doc.text(answerText, margin + 22, yPos);
      doc.setTextColor(0);
      yPos += lineHeight + 8;

      // 풀이
      if (problem.solution) {
        doc.setFillColor(245, 245, 245);
        const solutionHeight = solutionLines.length * lineHeight + 8;
        doc.roundedRect(margin + 5, yPos - 4, contentWidth - 10, solutionHeight, 2, 2, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(66, 66, 66);
        doc.text('풀이:', margin + 8, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += lineHeight;

        for (const line of solutionLines) {
          doc.text(line, margin + 10, yPos);
          yPos += lineHeight;
        }
        doc.setTextColor(0);
        yPos += 5;
      }

      yPos += lineHeight;
    }

    // 모든 페이지에 푸터 추가
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      drawFooter(p, totalPages);
    }

    const dateStr = (opts.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const fileName = `${opts.title}_정답지_${dateStr}.pdf`;

    return {
      success: true,
      pdfBlob: doc.output('blob'),
      pdfBase64: doc.output('datauristring'),
      fileName,
      pageCount: totalPages,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PDF 생성 실패',
      fileName: '',
      pageCount: 0,
    };
  }
}

/**
 * 문제지 + 정답지 동시 생성
 */
export async function generateBothPdfs(
  problems: ProblemForPdf[],
  options: PdfGenerationOptions
): Promise<{
  problemSheet: PdfGenerationResult;
  answerSheet: PdfGenerationResult;
}> {
  const [problemSheet, answerSheet] = await Promise.all([
    generateProblemSheetPDF(problems, options),
    generateAnswerSheetPDF(problems, options),
  ]);

  return { problemSheet, answerSheet };
}

// ============================================
// PDF 다운로드 유틸리티
// ============================================

/**
 * Blob을 파일로 다운로드
 */
export function downloadPdfBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Base64 PDF를 파일로 다운로드
 */
export function downloadPdfBase64(base64: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = base64;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
