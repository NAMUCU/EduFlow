'use client';

/**
 * PDF 미리보기 컴포넌트
 *
 * 기능:
 * - 문제지/정답지 PDF 미리보기
 * - 다운로드 버튼 (문제지/정답지 각각 또는 동시)
 * - 줌 조절
 * - 인쇄 기능
 * - KaTeX 수학 수식 렌더링 지원
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  X,
  FileText,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import {
  generateProblemSheetPDF,
  generateAnswerSheetPDF,
  generateBothPdfs,
  generateProblemSheetHtml,
  generateAnswerSheetHtml,
  downloadPdfBlob,
  type ProblemForPdf,
  type PdfGenerationOptions,
  type PdfGenerationResult,
} from '@/lib/services/pdf-generator';

// ============================================
// 타입 정의
// ============================================

interface PDFPreviewProps {
  /** 문제 배열 */
  problems: ProblemForPdf[];
  /** PDF 생성 옵션 */
  options: PdfGenerationOptions;
  /** 닫기 핸들러 */
  onClose?: () => void;
  /** 미리보기 표시 여부 */
  isOpen: boolean;
  /** 초기 표시 모드 */
  initialMode?: 'problems' | 'answers';
  /** 생성 완료 콜백 */
  onGenerated?: (result: { problemSheet?: PdfGenerationResult; answerSheet?: PdfGenerationResult }) => void;
}

// ============================================
// 컴포넌트
// ============================================

export default function PDFPreview({
  problems,
  options,
  onClose,
  isOpen,
  initialMode = 'problems',
  onGenerated,
}: PDFPreviewProps) {
  // 상태
  const [activeTab, setActiveTab] = useState<'problems' | 'answers'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  // PDF 결과 상태
  const [problemSheetResult, setProblemSheetResult] = useState<PdfGenerationResult | null>(null);
  const [answerSheetResult, setAnswerSheetResult] = useState<PdfGenerationResult | null>(null);

  // HTML 미리보기 상태
  const [previewHtml, setPreviewHtml] = useState<string>('');

  // iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 미리보기 HTML 생성
  const generatePreviewHtml = useCallback(() => {
    if (problems.length === 0) {
      setError('선택된 문제가 없습니다.');
      return;
    }

    try {
      const html = activeTab === 'problems'
        ? generateProblemSheetHtml(problems, options)
        : generateAnswerSheetHtml(problems, options);
      setPreviewHtml(html);
      setError(null);
    } catch (err) {
      console.error('HTML 미리보기 생성 오류:', err);
      setError('미리보기 생성 중 오류가 발생했습니다.');
    }
  }, [problems, options, activeTab]);

  // PDF 생성
  const generatePdf = useCallback(async (type: 'problems' | 'answers' | 'both') => {
    if (problems.length === 0) {
      setError('선택된 문제가 없습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (type === 'both') {
        const results = await generateBothPdfs(problems, options);
        setProblemSheetResult(results.problemSheet);
        setAnswerSheetResult(results.answerSheet);

        if (onGenerated) {
          onGenerated(results);
        }

        // 성공 시 자동 다운로드 (옵션)
        if (results.problemSheet.success && results.problemSheet.pdfBlob) {
          downloadPdfBlob(results.problemSheet.pdfBlob, results.problemSheet.fileName);
        }
        if (results.answerSheet.success && results.answerSheet.pdfBlob) {
          downloadPdfBlob(results.answerSheet.pdfBlob, results.answerSheet.fileName);
        }
      } else {
        const result = type === 'problems'
          ? await generateProblemSheetPDF(problems, options)
          : await generateAnswerSheetPDF(problems, options);

        if (type === 'problems') {
          setProblemSheetResult(result);
        } else {
          setAnswerSheetResult(result);
        }

        if (onGenerated) {
          onGenerated({
            [type === 'problems' ? 'problemSheet' : 'answerSheet']: result,
          });
        }

        // 성공 시 자동 다운로드
        if (result.success && result.pdfBlob) {
          downloadPdfBlob(result.pdfBlob, result.fileName);
        }
      }
    } catch (err) {
      console.error('PDF 생성 오류:', err);
      setError('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [problems, options, onGenerated]);

  // 컴포넌트 열릴 때 미리보기 생성
  useEffect(() => {
    if (isOpen && problems.length > 0) {
      generatePreviewHtml();
    }
  }, [isOpen, generatePreviewHtml, problems.length]);

  // 탭 변경 시 미리보기 갱신
  useEffect(() => {
    if (isOpen && problems.length > 0) {
      generatePreviewHtml();
      setCurrentPage(1);
    }
  }, [activeTab, isOpen, generatePreviewHtml, problems.length]);

  // 다운로드 처리
  const handleDownload = async (type: 'problems' | 'answers' | 'both') => {
    await generatePdf(type);
  };

  // 인쇄 처리
  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  // 줌 조절
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  if (!isOpen) return null;

  const activeResult = activeTab === 'problems' ? problemSheetResult : answerSheetResult;
  const totalPages = activeResult?.pageCount || 1;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">PDF 미리보기</h2>

            {/* 탭 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('problems')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'problems'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                문제지
              </button>
              <button
                onClick={() => setActiveTab('answers')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'answers'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                정답지
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 줌 컨트롤 */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                title="축소"
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600 w-12 text-center font-medium">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                title="확대"
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* 새로고침 */}
            <button
              onClick={generatePreviewHtml}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>

            {/* 인쇄 */}
            <button
              onClick={handlePrint}
              disabled={!previewHtml || isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="인쇄"
            >
              <Printer className="w-5 h-5 text-gray-600" />
            </button>

            {/* 닫기 */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* PDF 뷰어 */}
        <div className="flex-1 bg-gray-100 overflow-auto">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">PDF 생성 중...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-red-500 text-lg mb-4">{error}</div>
              <button
                onClick={generatePreviewHtml}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : previewHtml ? (
            <div className="p-6 flex justify-center">
              <div
                className="bg-white shadow-xl rounded-lg overflow-hidden"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                }}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={previewHtml}
                  className="w-[210mm] min-h-[297mm] border-0"
                  title="PDF 미리보기"
                  style={{ height: 'auto' }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              선택된 문제가 없습니다.
            </div>
          )}
        </div>

        {/* 하단 액션 바 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          {/* 페이지 네비게이션 (다중 페이지일 때만 표시) */}
          <div className="flex items-center gap-4">
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-sm text-gray-600">
                  페이지 {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}

            <div className="text-sm text-gray-500">
              문제 {problems.length}개 | {options.title || '문제지'}
            </div>
          </div>

          {/* 다운로드 버튼들 */}
          <div className="flex items-center gap-3">
            {/* 현재 탭 다운로드 */}
            <button
              onClick={() => handleDownload(activeTab)}
              disabled={isLoading || problems.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">
                {activeTab === 'problems' ? '문제지 다운로드' : '정답지 다운로드'}
              </span>
            </button>

            {/* 문제지 + 정답지 동시 다운로드 */}
            <button
              onClick={() => handleDownload('both')}
              disabled={isLoading || problems.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">문제지 + 정답지 다운로드</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
