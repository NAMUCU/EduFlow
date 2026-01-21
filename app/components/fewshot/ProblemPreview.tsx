'use client'

/**
 * 문제 미리보기 컴포넌트
 * - 문제 텍스트 + SVG 이미지 통합 표시
 * - 난이도 표시
 * - 정답/풀이 토글
 */

import { useState } from 'react'
import { SimpleSvgPreview } from './SvgPreview'
import type { MergedContent } from '@/types/fewshot'

interface ProblemPreviewProps {
  number?: number
  text: string
  answer: string
  solution?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  mergedContent?: MergedContent
  showAnswer?: boolean
  className?: string
}

const difficultyConfig = {
  easy: { label: '쉬움', color: 'bg-green-100 text-green-800' },
  medium: { label: '보통', color: 'bg-yellow-100 text-yellow-800' },
  hard: { label: '어려움', color: 'bg-red-100 text-red-800' }
}

export default function ProblemPreview({
  number,
  text,
  answer,
  solution,
  difficulty = 'medium',
  mergedContent,
  showAnswer: initialShowAnswer = false,
  className = ''
}: ProblemPreviewProps) {
  const [showAnswer, setShowAnswer] = useState(initialShowAnswer)
  const [showSolution, setShowSolution] = useState(false)

  const config = difficultyConfig[difficulty]

  // 이미지 분리
  const beforeImages = mergedContent?.images.filter(img => img.position === 0) || []
  const afterImages = mergedContent?.images.filter(img => img.position > 0) || []

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          {number !== undefined && (
            <span className="font-bold text-blue-600">{number}번</span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAnswer ? '정답 숨기기' : '정답 보기'}
          </button>
          {solution && (
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {showSolution ? '풀이 숨기기' : '풀이 보기'}
            </button>
          )}
        </div>
      </div>

      {/* 문제 내용 */}
      <div className="p-4">
        {/* 이미지 (텍스트 전) */}
        {beforeImages.map((img, idx) => (
          <div key={`before-${idx}`} className="mb-4">
            {img.svg ? (
              <div className="flex justify-center">
                <SimpleSvgPreview svgCode={img.svg} className="max-w-xs" />
              </div>
            ) : img.url ? (
              <div className="flex justify-center">
                <img src={img.url} alt={img.caption || '문제 그림'} className="max-w-xs" />
              </div>
            ) : null}
            {img.caption && (
              <p className="text-center text-sm text-gray-500 mt-1">{img.caption}</p>
            )}
          </div>
        ))}

        {/* 문제 텍스트 */}
        <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
          {renderMathText(mergedContent?.text || text)}
        </div>

        {/* 이미지 (텍스트 후) */}
        {afterImages.map((img, idx) => (
          <div key={`after-${idx}`} className="mt-4">
            {img.svg ? (
              <div className="flex justify-center">
                <SimpleSvgPreview svgCode={img.svg} className="max-w-xs" />
              </div>
            ) : img.url ? (
              <div className="flex justify-center">
                <img src={img.url} alt={img.caption || '문제 그림'} className="max-w-xs" />
              </div>
            ) : null}
            {img.caption && (
              <p className="text-center text-sm text-gray-500 mt-1">{img.caption}</p>
            )}
          </div>
        ))}
      </div>

      {/* 정답 */}
      {showAnswer && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200">
          <span className="text-sm font-medium text-green-800">정답: </span>
          <span className="text-green-900 font-bold">{renderMathText(answer)}</span>
        </div>
      )}

      {/* 풀이 */}
      {showSolution && solution && (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
          <div className="text-sm font-medium text-blue-800 mb-1">풀이:</div>
          <div className="text-blue-900 text-sm whitespace-pre-wrap">
            {renderMathText(solution)}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 수학 텍스트 렌더링 (간단한 LaTeX 변환)
 */
function renderMathText(text: string): React.ReactNode {
  // 기본 심볼 변환
  const converted = text
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\pm/g, '±')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/_(\d)/g, (_, digit) => {
      const subscripts = '₀₁₂₃₄₅₆₇₈₉'
      const idx = parseInt(digit, 10)
      return subscripts[idx] || digit
    })

  return converted
}

/**
 * 문제 목록 미리보기
 */
export function ProblemListPreview({
  problems,
  showAnswers = false
}: {
  problems: Array<{
    text: string
    answer: string
    solution?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    mergedContent?: MergedContent
  }>
  showAnswers?: boolean
}) {
  return (
    <div className="space-y-4">
      {problems.map((problem, idx) => (
        <ProblemPreview
          key={idx}
          number={idx + 1}
          {...problem}
          showAnswer={showAnswers}
        />
      ))}
    </div>
  )
}
