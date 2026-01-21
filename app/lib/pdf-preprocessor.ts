/**
 * PDF 전처리 유틸리티
 * PDF에서 텍스트 추출, 마크다운 변환, 스캔 PDF 감지 등의 기능 제공
 */

// pdf-parse는 CommonJS 모듈이므로 require 사용
// eslint-disable-next-line
const pdfParse = require('pdf-parse');
import * as XLSX from 'xlsx';

// PDF 파싱 결과 타입
interface PdfParseResult {
  numpages: number;
  numrender: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  text: string;
  version: string;
}

// 마크다운 변환 결과 타입
interface MarkdownResult {
  content: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
}

// 텍스트 추출 결과 타입
interface TextExtractionResult {
  text: string;
  pageCount: number;
  isEmpty: boolean;
}

/**
 * PDF에서 텍스트 추출
 * @param buffer - PDF 파일 버퍼
 * @returns 추출된 텍스트와 메타데이터
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<TextExtractionResult> {
  try {
    const data: PdfParseResult = await pdfParse(buffer);

    const text = data.text.trim();

    return {
      text,
      pageCount: data.numpages,
      isEmpty: text.length === 0,
    };
  } catch (error) {
    console.error('PDF 텍스트 추출 실패:', error);
    throw new Error(`PDF 텍스트 추출 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * PDF를 마크다운으로 변환
 * @param buffer - PDF 파일 버퍼
 * @returns 마크다운 형식의 콘텐츠
 */
export async function convertPdfToMarkdown(buffer: Buffer): Promise<MarkdownResult> {
  try {
    const data: PdfParseResult = await pdfParse(buffer);

    // PDF 텍스트를 마크다운으로 변환
    const lines = data.text.split('\n');
    const markdownLines: string[] = [];

    // 메타데이터 추출
    const metadata = {
      title: data.info?.Title as string | undefined,
      author: data.info?.Author as string | undefined,
      creationDate: data.info?.CreationDate as string | undefined,
    };

    // 제목이 있으면 마크다운 헤더로 추가
    if (metadata.title) {
      markdownLines.push(`# ${metadata.title}`);
      markdownLines.push('');
    }

    // 본문 처리
    let inList = false;
    let previousLineEmpty = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 빈 줄 처리 (연속 빈 줄 방지)
      if (trimmedLine === '') {
        if (!previousLineEmpty) {
          markdownLines.push('');
          previousLineEmpty = true;
        }
        inList = false;
        continue;
      }

      previousLineEmpty = false;

      // 번호 매기기 목록 감지 (예: 1. 2. 3.)
      const numberedListMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
      if (numberedListMatch) {
        markdownLines.push(`${numberedListMatch[1]}. ${numberedListMatch[2]}`);
        inList = true;
        continue;
      }

      // 글머리 기호 목록 감지 (예: - • *)
      const bulletMatch = trimmedLine.match(/^[-•*]\s+(.+)$/);
      if (bulletMatch) {
        markdownLines.push(`- ${bulletMatch[1]}`);
        inList = true;
        continue;
      }

      // 대문자로만 구성된 짧은 줄은 헤더로 처리
      if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 50 && trimmedLine.length > 2) {
        if (!inList) {
          markdownLines.push('');
        }
        markdownLines.push(`## ${trimmedLine}`);
        markdownLines.push('');
        continue;
      }

      // 일반 텍스트
      markdownLines.push(trimmedLine);
    }

    // 마크다운 정리 (연속 빈 줄 제거)
    const content = markdownLines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      content,
      pageCount: data.numpages,
      metadata,
    };
  } catch (error) {
    console.error('PDF 마크다운 변환 실패:', error);
    throw new Error(`PDF 마크다운 변환 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 스캔된 PDF인지 확인 (이미지 기반 PDF)
 * 텍스트가 거의 없거나 없으면 스캔 PDF로 판단
 * @param buffer - PDF 파일 버퍼
 * @returns 스캔 PDF 여부
 */
export async function isScannedPdf(buffer: Buffer): Promise<boolean> {
  try {
    const data: PdfParseResult = await pdfParse(buffer);

    const text = data.text.trim();
    const pageCount = data.numpages;

    // 페이지당 평균 문자 수 계산
    const avgCharsPerPage = text.length / pageCount;

    // 페이지당 평균 100자 미만이면 스캔 PDF로 판단
    // (일반 텍스트 PDF는 페이지당 최소 수백 자 이상)
    const SCAN_THRESHOLD = 100;

    return avgCharsPerPage < SCAN_THRESHOLD;
  } catch (error) {
    console.error('스캔 PDF 확인 실패:', error);
    // 파싱 실패 시 스캔 PDF로 간주 (OCR 처리 필요)
    return true;
  }
}

/**
 * 엑셀 파일을 마크다운 테이블로 변환
 * @param buffer - 엑셀 파일 버퍼
 * @returns 마크다운 형식의 테이블
 */
export async function convertExcelToMarkdown(buffer: Buffer): Promise<string> {
  try {
    // 엑셀 파일 읽기
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const markdownSections: string[] = [];

    // 각 시트 처리
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];

      // 시트 이름을 헤더로 추가
      markdownSections.push(`## ${sheetName}`);
      markdownSections.push('');

      // 시트를 JSON으로 변환 (header: 1은 배열 형태로 반환)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
      }) as unknown[][];

      if (jsonData.length === 0) {
        markdownSections.push('*데이터 없음*');
        markdownSections.push('');
        continue;
      }

      // 첫 번째 행을 헤더로 사용
      const headers = jsonData[0] as unknown[];
      if (headers.length === 0) {
        continue;
      }

      // 마크다운 테이블 헤더 생성
      const headerRow = `| ${headers.map(h => String(h || '')).join(' | ')} |`;
      const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;

      markdownSections.push(headerRow);
      markdownSections.push(separatorRow);

      // 데이터 행 추가
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as unknown[];
        // 빈 행 건너뛰기
        if (row.every(cell => cell === '' || cell === null || cell === undefined)) {
          continue;
        }

        // 헤더 길이에 맞춰 셀 조정
        const cells: string[] = [];
        for (let j = 0; j < headers.length; j++) {
          const cellValue = row[j] !== undefined ? String(row[j]) : '';
          // 파이프 문자 이스케이프
          cells.push(cellValue.replace(/\|/g, '\\|'));
        }

        markdownSections.push(`| ${cells.join(' | ')} |`);
      }

      markdownSections.push('');
    }

    return markdownSections.join('\n').trim();
  } catch (error) {
    console.error('엑셀 마크다운 변환 실패:', error);
    throw new Error(`엑셀 마크다운 변환 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}
