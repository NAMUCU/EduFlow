// PDF 생성 유틸리티 (jsPDF 사용)
// 한글 폰트 지원을 위해 Noto Sans KR 사용

import jsPDF from 'jspdf';
import {
  Problem,
  PrintOptions,
  TemplateLayout,
  TEMPLATE_LAYOUTS,
  PDF_UI_TEXT,
} from '@/types/pdf';

// A4 사이즈 (mm)
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

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
      return '#EF4444'; // 빨강
    case '중':
      return '#F59E0B'; // 노랑
    case '하':
      return '#10B981'; // 초록
    default:
      return '#6B7280'; // 회색
  }
}

// 텍스트 줄바꿈 처리
function splitTextToLines(
  doc: jsPDF,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

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

// PDF 헤더 그리기
function drawHeader(
  doc: jsPDF,
  options: PrintOptions,
  layout: TemplateLayout,
  pageWidth: number
): number {
  let yPos = layout.marginTop;
  const contentWidth = pageWidth - layout.marginLeft - layout.marginRight;

  // 학원 로고 (있는 경우)
  if (options.academyLogo) {
    try {
      doc.addImage(
        options.academyLogo,
        'PNG',
        layout.marginLeft,
        yPos,
        20,
        20
      );
    } catch {
      // 로고 로드 실패 시 무시
    }
  }

  // 제목
  doc.setFontSize(layout.fontSize.title);
  doc.setFont('NotoSansKR', 'bold');
  doc.text(options.title, pageWidth / 2, yPos + 8, { align: 'center' });

  yPos += 15;

  // 부제목 (학원명, 학생 이름, 날짜)
  doc.setFontSize(layout.fontSize.subtitle);
  doc.setFont('NotoSansKR', 'normal');

  const subtitleParts: string[] = [];
  if (options.academyName) subtitleParts.push(options.academyName);
  if (options.studentName) subtitleParts.push(`${options.studentName}`);
  if (options.date) subtitleParts.push(options.date);

  if (subtitleParts.length > 0) {
    doc.text(subtitleParts.join(' | '), pageWidth / 2, yPos + 5, {
      align: 'center',
    });
    yPos += 10;
  }

  // 구분선
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(layout.marginLeft, yPos + 5, pageWidth - layout.marginRight, yPos + 5);

  return yPos + layout.headerHeight - 10;
}

// PDF 푸터 그리기
function drawFooter(
  doc: jsPDF,
  pageNumber: number,
  totalPages: number,
  layout: TemplateLayout,
  pageWidth: number,
  pageHeight: number
): void {
  const yPos = pageHeight - layout.marginBottom;

  doc.setFontSize(9);
  doc.setFont('NotoSansKR', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text(
    `${PDF_UI_TEXT.PAGE_LABEL} ${pageNumber} / ${totalPages}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);
}

// 문제 하나 그리기
function drawProblem(
  doc: jsPDF,
  problem: Problem,
  index: number,
  options: PrintOptions,
  layout: TemplateLayout,
  yPos: number,
  columnWidth: number,
  xOffset: number
): number {
  const lineHeight = layout.fontSize.question * layout.lineHeight * 0.35;
  let currentY = yPos;

  // 문제 헤더 (번호, 난이도, 유형)
  doc.setFontSize(layout.fontSize.question);
  doc.setFont('NotoSansKR', 'bold');

  let headerText = '';
  if (options.showProblemNumber) {
    headerText += `${index + 1}. `;
  }

  doc.text(headerText, xOffset, currentY);

  // 난이도 표시
  if (options.showDifficulty) {
    const numberWidth = doc.getTextWidth(headerText);
    doc.setFontSize(layout.fontSize.question - 2);
    const color = getDifficultyColor(problem.difficulty);
    doc.setTextColor(color);
    doc.text(`[${problem.difficulty}]`, xOffset + numberWidth, currentY);
    doc.setTextColor(0, 0, 0);
  }

  // 문제 유형 표시
  if (options.showProblemType && problem.type) {
    const typeWidth =
      doc.getTextWidth(headerText) +
      (options.showDifficulty ? doc.getTextWidth(`[${problem.difficulty}] `) : 0);
    doc.setFontSize(layout.fontSize.question - 2);
    doc.setTextColor(100, 100, 100);
    doc.text(`(${problem.type})`, xOffset + typeWidth + 5, currentY);
    doc.setTextColor(0, 0, 0);
  }

  currentY += lineHeight;

  // 문제 내용
  doc.setFontSize(layout.fontSize.question);
  doc.setFont('NotoSansKR', 'normal');
  const questionLines = splitTextToLines(doc, problem.question, columnWidth - 10);
  for (const line of questionLines) {
    doc.text(line, xOffset + 5, currentY);
    currentY += lineHeight;
  }

  currentY += lineHeight * 0.5;

  // 정답 (옵션에 따라)
  if (options.contentType === 'with_answer' || options.contentType === 'with_solution') {
    doc.setFontSize(layout.fontSize.answer);
    doc.setFont('NotoSansKR', 'bold');
    doc.setTextColor(0, 100, 180);
    doc.text(`${PDF_UI_TEXT.ANSWER_LABEL}: `, xOffset + 5, currentY);

    doc.setFont('NotoSansKR', 'normal');
    const answerX = xOffset + 5 + doc.getTextWidth(`${PDF_UI_TEXT.ANSWER_LABEL}: `);
    const answerLines = splitTextToLines(doc, problem.answer, columnWidth - 15);
    for (let i = 0; i < answerLines.length; i++) {
      doc.text(answerLines[i], i === 0 ? answerX : xOffset + 10, currentY);
      currentY += lineHeight * 0.9;
    }
    doc.setTextColor(0, 0, 0);
    currentY += lineHeight * 0.3;
  }

  // 풀이 (옵션에 따라)
  if (options.contentType === 'with_solution' && problem.solution) {
    doc.setFontSize(layout.fontSize.solution);
    doc.setFont('NotoSansKR', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(`${PDF_UI_TEXT.SOLUTION_LABEL}:`, xOffset + 5, currentY);
    currentY += lineHeight * 0.8;

    doc.setFont('NotoSansKR', 'normal');
    const solutionLines = splitTextToLines(doc, problem.solution, columnWidth - 15);
    for (const line of solutionLines) {
      doc.text(line, xOffset + 10, currentY);
      currentY += lineHeight * 0.85;
    }
    doc.setTextColor(0, 0, 0);
    currentY += lineHeight * 0.5;
  }

  // 문제 간 여백
  currentY += lineHeight;

  return currentY;
}

// 기본 템플릿 PDF 생성
function generateDefaultTemplate(
  doc: jsPDF,
  problems: Problem[],
  options: PrintOptions,
  layout: TemplateLayout
): number {
  const pageWidth = A4_WIDTH;
  const pageHeight = A4_HEIGHT;
  const contentWidth = pageWidth - layout.marginLeft - layout.marginRight;
  const maxY = pageHeight - layout.marginBottom - layout.footerHeight;

  let pageCount = 1;
  let yPos = drawHeader(doc, options, layout, pageWidth);

  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];

    // 문제 높이 예측 (대략적)
    const estimatedHeight = estimateProblemHeight(doc, problem, options, layout, contentWidth);

    // 페이지 넘김 필요 시
    if (yPos + estimatedHeight > maxY) {
      doc.addPage();
      pageCount++;
      yPos = drawHeader(doc, options, layout, pageWidth);
    }

    yPos = drawProblem(
      doc,
      problem,
      i,
      options,
      layout,
      yPos,
      contentWidth,
      layout.marginLeft
    );
  }

  return pageCount;
}

// 시험지 템플릿 (2단) PDF 생성
function generateExamTemplate(
  doc: jsPDF,
  problems: Problem[],
  options: PrintOptions,
  layout: TemplateLayout
): number {
  const pageWidth = A4_WIDTH;
  const pageHeight = A4_HEIGHT;
  const columnGap = 10;
  const columnWidth = (pageWidth - layout.marginLeft - layout.marginRight - columnGap) / 2;
  const maxY = pageHeight - layout.marginBottom - layout.footerHeight;

  let pageCount = 1;
  let yPosLeft = drawHeader(doc, options, layout, pageWidth);
  let yPosRight = yPosLeft;
  let currentColumn = 0; // 0: 왼쪽, 1: 오른쪽

  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    const xOffset =
      currentColumn === 0
        ? layout.marginLeft
        : layout.marginLeft + columnWidth + columnGap;
    const currentY = currentColumn === 0 ? yPosLeft : yPosRight;

    // 문제 높이 예측
    const estimatedHeight = estimateProblemHeight(doc, problem, options, layout, columnWidth);

    // 현재 컬럼에 공간이 부족한 경우
    if (currentY + estimatedHeight > maxY) {
      if (currentColumn === 0) {
        // 오른쪽 컬럼으로 이동
        currentColumn = 1;
        i--; // 문제 다시 시도
        continue;
      } else {
        // 새 페이지
        doc.addPage();
        pageCount++;
        yPosLeft = drawHeader(doc, options, layout, pageWidth);
        yPosRight = yPosLeft;
        currentColumn = 0;
        i--; // 문제 다시 시도
        continue;
      }
    }

    const newY = drawProblem(
      doc,
      problem,
      i,
      options,
      layout,
      currentY,
      columnWidth,
      xOffset
    );

    if (currentColumn === 0) {
      yPosLeft = newY;
      currentColumn = 1;
    } else {
      yPosRight = newY;
      currentColumn = 0;
    }
  }

  return pageCount;
}

// 오답 노트 템플릿 PDF 생성
function generateWrongNoteTemplate(
  doc: jsPDF,
  problems: Problem[],
  options: PrintOptions,
  layout: TemplateLayout
): number {
  const pageWidth = A4_WIDTH;
  const pageHeight = A4_HEIGHT;
  const contentWidth = pageWidth - layout.marginLeft - layout.marginRight;
  const maxY = pageHeight - layout.marginBottom - layout.footerHeight;

  let pageCount = 1;
  let yPos = drawHeader(doc, options, layout, pageWidth);

  // 오답 노트 안내 문구
  doc.setFontSize(10);
  doc.setFont('NotoSansKR', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('* 틀린 문제를 다시 풀어보고, 풀이 과정을 직접 작성해보세요.', layout.marginLeft, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];

    // 문제 높이 예측 + 메모 공간
    const estimatedHeight = estimateProblemHeight(doc, problem, options, layout, contentWidth) + 40;

    // 페이지 넘김 필요 시
    if (yPos + estimatedHeight > maxY) {
      doc.addPage();
      pageCount++;
      yPos = drawHeader(doc, options, layout, pageWidth);
    }

    yPos = drawProblem(
      doc,
      problem,
      i,
      options,
      layout,
      yPos,
      contentWidth,
      layout.marginLeft
    );

    // 메모 공간 (점선 박스)
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(layout.marginLeft + 5, yPos, contentWidth - 10, 30);
    doc.setLineDashPattern([], 0);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('나의 풀이:', layout.marginLeft + 10, yPos + 8);
    doc.setTextColor(0, 0, 0);

    yPos += 40;
  }

  return pageCount;
}

// 문제 높이 예측
function estimateProblemHeight(
  doc: jsPDF,
  problem: Problem,
  options: PrintOptions,
  layout: TemplateLayout,
  columnWidth: number
): number {
  const lineHeight = layout.fontSize.question * layout.lineHeight * 0.35;
  let height = lineHeight * 2; // 헤더

  // 문제 줄 수
  const questionLines = splitTextToLines(doc, problem.question, columnWidth - 10);
  height += questionLines.length * lineHeight;

  // 정답 줄 수
  if (options.contentType === 'with_answer' || options.contentType === 'with_solution') {
    const answerLines = splitTextToLines(doc, problem.answer, columnWidth - 15);
    height += answerLines.length * lineHeight * 0.9 + lineHeight;
  }

  // 풀이 줄 수
  if (options.contentType === 'with_solution' && problem.solution) {
    const solutionLines = splitTextToLines(doc, problem.solution, columnWidth - 15);
    height += solutionLines.length * lineHeight * 0.85 + lineHeight * 2;
  }

  return height + lineHeight * 2; // 여백
}

// ArrayBuffer를 Base64로 변환하는 헬퍼 함수
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 한글 폰트 로드 (Noto Sans KR)
async function loadKoreanFont(doc: jsPDF): Promise<void> {
  // Noto Sans KR 폰트를 CDN에서 로드
  // 실제 프로덕션에서는 폰트 파일을 로컬에 저장하는 것을 권장합니다
  try {
    // Regular 폰트
    const regularResponse = await fetch(
      'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr@5.0.5/files/noto-sans-kr-all-400-normal.woff'
    );
    if (regularResponse.ok) {
      const regularBuffer = await regularResponse.arrayBuffer();
      const regularBase64 = arrayBufferToBase64(regularBuffer);
      doc.addFileToVFS('NotoSansKR-Regular.ttf', regularBase64);
      doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
    }

    // Bold 폰트
    const boldResponse = await fetch(
      'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr@5.0.5/files/noto-sans-kr-all-700-normal.woff'
    );
    if (boldResponse.ok) {
      const boldBuffer = await boldResponse.arrayBuffer();
      const boldBase64 = arrayBufferToBase64(boldBuffer);
      doc.addFileToVFS('NotoSansKR-Bold.ttf', boldBase64);
      doc.addFont('NotoSansKR-Bold.ttf', 'NotoSansKR', 'bold');
    }
  } catch (error) {
    console.warn('한글 폰트 로드 실패, 기본 폰트 사용:', error);
  }
}

// 메인 PDF 생성 함수
export async function generatePdf(
  problems: Problem[],
  options: PrintOptions
): Promise<{ pdfBase64: string; pageCount: number; fileName: string }> {
  // PDF 문서 생성
  const doc = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: options.pageSize,
  });

  // 한글 폰트 로드
  await loadKoreanFont(doc);
  doc.setFont('NotoSansKR', 'normal');

  // 문제 순서 처리
  const orderedProblems =
    options.problemOrder === 'random' ? shuffleProblems(problems) : problems;

  // 템플릿 레이아웃 가져오기
  const layout = TEMPLATE_LAYOUTS[options.template];

  // 템플릿별 PDF 생성
  let pageCount: number;
  switch (options.template) {
    case 'exam':
      pageCount = generateExamTemplate(doc, orderedProblems, options, layout);
      break;
    case 'wrong_note':
      pageCount = generateWrongNoteTemplate(doc, orderedProblems, options, layout);
      break;
    default:
      pageCount = generateDefaultTemplate(doc, orderedProblems, options, layout);
  }

  // 모든 페이지에 푸터 추가
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(
      doc,
      i,
      totalPages,
      layout,
      options.orientation === 'landscape' ? A4_HEIGHT : A4_WIDTH,
      options.orientation === 'landscape' ? A4_WIDTH : A4_HEIGHT
    );
  }

  // PDF를 Base64로 변환
  const pdfBase64 = doc.output('datauristring');

  // 파일명 생성
  const dateStr = options.date.replace(/-/g, '');
  const fileName = `${options.title}_${dateStr}.pdf`;

  return {
    pdfBase64,
    pageCount,
    fileName,
  };
}

// PDF Blob 생성 (다운로드용)
export async function generatePdfBlob(
  problems: Problem[],
  options: PrintOptions
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: options.pageSize,
  });

  await loadKoreanFont(doc);
  doc.setFont('NotoSansKR', 'normal');

  const orderedProblems =
    options.problemOrder === 'random' ? shuffleProblems(problems) : problems;
  const layout = TEMPLATE_LAYOUTS[options.template];

  switch (options.template) {
    case 'exam':
      generateExamTemplate(doc, orderedProblems, options, layout);
      break;
    case 'wrong_note':
      generateWrongNoteTemplate(doc, orderedProblems, options, layout);
      break;
    default:
      generateDefaultTemplate(doc, orderedProblems, options, layout);
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(
      doc,
      i,
      totalPages,
      layout,
      options.orientation === 'landscape' ? A4_HEIGHT : A4_WIDTH,
      options.orientation === 'landscape' ? A4_WIDTH : A4_HEIGHT
    );
  }

  return doc.output('blob');
}

// PDF 다운로드 헬퍼 함수
export function downloadPdf(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
