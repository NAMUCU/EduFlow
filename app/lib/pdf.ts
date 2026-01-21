// PDF 생성 유틸리티
// HTML 기반 미리보기 + 브라우저 인쇄 기능 사용 (한글 폰트 지원)

import {
  Problem,
  PrintOptions,
  TemplateLayout,
  TEMPLATE_LAYOUTS,
  PDF_UI_TEXT,
} from '@/types/pdf';

// 문제 배열 섞기 (Fisher-Yates 알고리즘)
function shuffleProblems(problems: Problem[]): Problem[] {
  const shuffled = [...problems];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 난이도에 따른 색상 반환
function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case '상':
      return '#DC2626'; // 빨강
    case '중':
      return '#D97706'; // 노랑
    case '하':
      return '#059669'; // 초록
    default:
      return '#6B7280'; // 회색
  }
}

// HTML 기반 PDF 미리보기 생성
function generateHtmlContent(
  problems: Problem[],
  options: PrintOptions
): string {
  const layout = TEMPLATE_LAYOUTS[options.template];
  const isExamTemplate = options.template === 'exam';
  const isWrongNoteTemplate = options.template === 'wrong_note';

  let html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${options.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: ${options.pageSize} ${options.orientation};
      margin: ${layout.marginTop}mm ${layout.marginRight}mm ${layout.marginBottom}mm ${layout.marginLeft}mm;
    }

    body {
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', '맑은 고딕', sans-serif;
      font-size: ${layout.fontSize.question}pt;
      line-height: ${layout.lineHeight};
      color: #1f2937;
      background: white;
      padding: 20mm;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
    }

    .title {
      font-size: ${layout.fontSize.title}pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: ${layout.fontSize.subtitle}pt;
      color: #6b7280;
    }

    .content {
      ${isExamTemplate ? `
        column-count: 2;
        column-gap: 20px;
        column-rule: 1px solid #e5e7eb;
      ` : ''}
    }

    .problem {
      margin-bottom: 24px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .problem-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .problem-number {
      font-weight: 700;
      color: #111827;
    }

    .difficulty {
      font-size: ${layout.fontSize.question - 2}pt;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }

    .difficulty-상 {
      background: #FEE2E2;
      color: #DC2626;
    }

    .difficulty-중 {
      background: #FEF3C7;
      color: #D97706;
    }

    .difficulty-하 {
      background: #D1FAE5;
      color: #059669;
    }

    .problem-type {
      font-size: ${layout.fontSize.question - 2}pt;
      color: #9ca3af;
    }

    .question {
      padding-left: 16px;
      white-space: pre-wrap;
    }

    .answer {
      margin-top: 12px;
      padding-left: 16px;
    }

    .answer-label {
      font-weight: 700;
      color: #2563eb;
    }

    .answer-text {
      color: #1d4ed8;
    }

    .solution {
      margin-top: 8px;
      padding: 12px;
      padding-left: 16px;
      background: #f9fafb;
      border-radius: 8px;
      margin-left: 16px;
    }

    .solution-label {
      font-weight: 700;
      color: #4b5563;
      font-size: ${layout.fontSize.solution}pt;
      margin-bottom: 4px;
    }

    .solution-text {
      color: #6b7280;
      font-size: ${layout.fontSize.solution}pt;
      white-space: pre-wrap;
    }

    ${isWrongNoteTemplate ? `
    .memo-box {
      margin-top: 16px;
      margin-left: 16px;
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 12px;
      min-height: 80px;
    }

    .memo-label {
      font-size: 10pt;
      color: #9ca3af;
    }

    .wrong-note-guide {
      background: #fffbeb;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 11pt;
      color: #92400e;
    }
    ` : ''}

    @media print {
      body {
        padding: 0;
      }

      .problem {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${options.title}</div>
    <div class="subtitle">
      ${[options.academyName, options.studentName, options.date].filter(Boolean).join(' | ')}
    </div>
  </div>

  ${isWrongNoteTemplate ? `
  <div class="wrong-note-guide">
    ✏️ 틀린 문제를 다시 풀어보고, 풀이 과정을 직접 작성해보세요.
  </div>
  ` : ''}

  <div class="content">
`;

  problems.forEach((problem, index) => {
    html += `
    <div class="problem">
      <div class="problem-header">
        ${options.showProblemNumber ? `<span class="problem-number">${index + 1}.</span>` : ''}
        ${options.showDifficulty ? `<span class="difficulty difficulty-${problem.difficulty}">[${problem.difficulty}]</span>` : ''}
        ${options.showProblemType && problem.type ? `<span class="problem-type">(${problem.type})</span>` : ''}
      </div>
      <div class="question">${escapeHtml(problem.question)}</div>
`;

    if (options.contentType === 'with_answer' || options.contentType === 'with_solution') {
      html += `
      <div class="answer">
        <span class="answer-label">${PDF_UI_TEXT.ANSWER_LABEL}:</span>
        <span class="answer-text">${escapeHtml(problem.answer)}</span>
      </div>
`;
    }

    if (options.contentType === 'with_solution' && problem.solution) {
      html += `
      <div class="solution">
        <div class="solution-label">${PDF_UI_TEXT.SOLUTION_LABEL}:</div>
        <div class="solution-text">${escapeHtml(problem.solution)}</div>
      </div>
`;
    }

    if (isWrongNoteTemplate) {
      html += `
      <div class="memo-box">
        <div class="memo-label">나의 풀이:</div>
      </div>
`;
    }

    html += `
    </div>
`;
  });

  html += `
  </div>
</body>
</html>
`;

  return html;
}

// HTML 이스케이프
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

// 메인 PDF 생성 함수 (HTML 기반)
export async function generatePdf(
  problems: Problem[],
  options: PrintOptions
): Promise<{ pdfBase64: string; pageCount: number; fileName: string }> {
  // 문제 순서 처리
  const orderedProblems =
    options.problemOrder === 'random' ? shuffleProblems(problems) : problems;

  // HTML 생성
  const htmlContent = generateHtmlContent(orderedProblems, options);

  // Data URI로 변환
  const pdfBase64 = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);

  // 파일명 생성
  const dateStr = options.date.replace(/-/g, '');
  const fileName = `${options.title}_${dateStr}.pdf`;

  // 페이지 수 추정 (대략적)
  const pageCount = Math.max(1, Math.ceil(problems.length / 5));

  return {
    pdfBase64,
    pageCount,
    fileName,
  };
}

// PDF Blob 생성 (다운로드용 - HTML 파일)
export async function generatePdfBlob(
  problems: Problem[],
  options: PrintOptions
): Promise<Blob> {
  const orderedProblems =
    options.problemOrder === 'random' ? shuffleProblems(problems) : problems;

  const htmlContent = generateHtmlContent(orderedProblems, options);

  return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
}

// PDF 다운로드 헬퍼 함수
export function downloadPdf(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  // HTML로 다운로드 (브라우저에서 인쇄 → PDF 저장 안내)
  link.download = fileName.replace('.pdf', '.html');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 바로 인쇄 함수 (브라우저 인쇄 다이얼로그)
export function printProblems(problems: Problem[], options: PrintOptions): void {
  const orderedProblems =
    options.problemOrder === 'random' ? shuffleProblems(problems) : problems;

  const htmlContent = generateHtmlContent(orderedProblems, options);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
