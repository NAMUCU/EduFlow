'use client';

// PDF 미리보기 컴포넌트
// 생성될 PDF를 미리 확인하고 다운로드할 수 있는 컴포넌트

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  X,
} from 'lucide-react';
import { Problem, PrintOptions, PDF_UI_TEXT } from '@/types/pdf';
import { generatePdf, generatePdfBlob, downloadPdf } from '@/lib/pdf';

interface PdfPreviewProps {
  problems: Problem[];
  options: PrintOptions;
  onClose?: () => void;
  isOpen: boolean;
}

export default function PdfPreview({
  problems,
  options,
  onClose,
  isOpen,
}: PdfPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fileName, setFileName] = useState('');

  // PDF 생성
  const generatePreview = useCallback(async () => {
    if (problems.length === 0) {
      setError(PDF_UI_TEXT.NO_PROBLEMS_SELECTED);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await generatePdf(problems, options);
      setPdfUrl(result.pdfBase64);
      setTotalPages(result.pageCount);
      setFileName(result.fileName);
      setCurrentPage(1);
    } catch (err) {
      console.error('PDF 생성 오류:', err);
      setError(PDF_UI_TEXT.PDF_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [problems, options]);

  // 컴포넌트가 열릴 때 PDF 생성
  useEffect(() => {
    if (isOpen && problems.length > 0) {
      generatePreview();
    }
  }, [isOpen, generatePreview, problems.length]);

  // 이전 URL 정리
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // 다운로드 처리
  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const blob = await generatePdfBlob(problems, options);
      downloadPdf(blob, fileName || `${options.title}.pdf`);
    } catch (err) {
      console.error('다운로드 오류:', err);
      setError('다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 인쇄 처리
  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  // 줌 조절
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  // 페이지 네비게이션
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            {PDF_UI_TEXT.PREVIEW}
          </h2>
          <div className="flex items-center gap-2">
            {/* 줌 컨트롤 */}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="축소"
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600 w-12 text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="확대"
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* 새로고침 */}
            <button
              onClick={generatePreview}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${
                  isLoading ? 'animate-spin' : ''
                }`}
              />
            </button>

            {/* 인쇄 */}
            <button
              onClick={handlePrint}
              disabled={!pdfUrl || isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title={PDF_UI_TEXT.PRINT}
            >
              <Printer className="w-5 h-5 text-gray-600" />
            </button>

            {/* 다운로드 */}
            <button
              onClick={handleDownload}
              disabled={!pdfUrl || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">{PDF_UI_TEXT.DOWNLOAD}</span>
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
        <div className="flex-1 bg-gray-100 overflow-auto p-6">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600">{PDF_UI_TEXT.GENERATING_PDF}</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-red-500 text-lg mb-4">{error}</div>
              <button
                onClick={generatePreview}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : pdfUrl ? (
            <div
              className="flex justify-center"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            >
              <iframe
                src={pdfUrl}
                className="w-[210mm] h-[297mm] bg-white shadow-lg border border-gray-300"
                title="PDF 미리보기"
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              {PDF_UI_TEXT.NO_PROBLEMS_SELECTED}
            </div>
          )}
        </div>

        {/* 페이지 네비게이션 */}
        {pdfUrl && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 px-6 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600">
              {PDF_UI_TEXT.PAGE_LABEL} {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
