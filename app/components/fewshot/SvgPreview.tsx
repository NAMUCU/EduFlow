'use client'

/**
 * SVG 미리보기 컴포넌트
 * - SVG 코드를 렌더링하여 미리보기
 * - 확대/축소 지원
 * - 다운로드 기능
 */

import { useState, useRef } from 'react'

interface SvgPreviewProps {
  svgCode: string
  width?: number | string
  height?: number | string
  className?: string
  showControls?: boolean
  title?: string
}

export default function SvgPreview({
  svgCode,
  width = 200,
  height = 200,
  className = '',
  showControls = true,
  title
}: SvgPreviewProps) {
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))
  const handleReset = () => setScale(1)

  const handleDownload = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'diagram'}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(svgCode)
      alert('SVG 코드가 클립보드에 복사되었습니다.')
    } catch {
      alert('복사에 실패했습니다.')
    }
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* 헤더 */}
      {(title || showControls) && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
          {title && (
            <span className="text-sm font-medium text-gray-700">{title}</span>
          )}
          {showControls && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomOut}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                title="축소"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xs text-gray-500 w-12 text-center">{Math.round(scale * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                title="확대"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={handleReset}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded ml-1"
                title="원래 크기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <button
                onClick={handleCopyCode}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                title="코드 복사"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={handleDownload}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                title="다운로드"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SVG 렌더링 영역 */}
      {/* Best Practice 6.1: Animate SVG Wrapper Instead of SVG Element */}
      <div
        ref={containerRef}
        className="flex items-center justify-center p-4 bg-white overflow-auto"
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        }}
      >
        {/* wrapper div에 transform 적용 - SVG 직접 애니메이션보다 성능 좋음 */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            willChange: scale !== 1 ? 'transform' : 'auto'
          }}
          dangerouslySetInnerHTML={{ __html: svgCode }}
        />
      </div>
    </div>
  )
}

/**
 * 간단한 SVG 미리보기 (컨트롤 없음)
 */
export function SimpleSvgPreview({
  svgCode,
  className = ''
}: {
  svgCode: string
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      dangerouslySetInnerHTML={{ __html: svgCode }}
    />
  )
}
