'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface DesmosExpression {
  id: string
  latex: string
  color?: string
  label?: string
  hidden?: boolean
}

interface DesmosEmbedProps {
  expressions: DesmosExpression[]
  width?: number | string
  height?: number
  className?: string
}

/**
 * Desmos 그래프 임베드 컴포넌트
 * Desmos API를 사용하여 수식을 시각화
 */
export default function DesmosEmbed({
  expressions,
  width = '100%',
  height = 400,
  className = '',
}: DesmosEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const calculatorRef = useRef<any>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 수식 설정 콜백을 useCallback으로 메모이제이션
  const setupExpressions = useCallback((calculator: any, exprs: DesmosExpression[]) => {
    exprs.forEach((expr) => {
      calculator.setExpression({
        id: expr.id,
        latex: expr.latex,
        color: expr.color || '#2d70b3',
        label: expr.label,
        showLabel: !!expr.label,
        hidden: expr.hidden,
      })
    })
  }, [])

  useEffect(() => {
    // Desmos API 스크립트 로드
    if (typeof window !== 'undefined' && !window.Desmos) {
      const script = document.createElement('script')
      script.src = 'https://www.desmos.com/api/v1.8/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6'
      script.async = true
      script.onload = () => setIsLoaded(true)
      script.onerror = () => setError('Desmos API 로드 실패')
      document.head.appendChild(script)
      scriptRef.current = script
    } else if (window.Desmos) {
      setIsLoaded(true)
    }

    // Cleanup: 스크립트 이벤트 핸들러 정리
    return () => {
      if (scriptRef.current) {
        scriptRef.current.onload = null
        scriptRef.current.onerror = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.Desmos) return

    try {
      // 기존 계산기 제거
      if (calculatorRef.current) {
        calculatorRef.current.destroy()
        calculatorRef.current = null
      }

      // 새 계산기 생성
      const calculator = window.Desmos.GraphingCalculator(containerRef.current, {
        expressions: true,
        settingsMenu: false,
        zoomButtons: true,
        expressionsCollapsed: true,
        border: false,
        lockViewport: false,
      })

      // 수식 추가
      setupExpressions(calculator, expressions)

      calculatorRef.current = calculator
    } catch (err) {
      setError('그래프 렌더링 오류')
      console.error(err)
    }

    return () => {
      if (calculatorRef.current) {
        calculatorRef.current.destroy()
        calculatorRef.current = null
      }
    }
  }, [isLoaded, expressions, setupExpressions])

  // 에러 상태 렌더링
  const renderError = () => (
    <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
      <p className="text-red-600 text-sm">{error}</p>
      <div className="mt-2 space-y-1">
        {expressions.map((expr, i) => (
          <code key={i} className="block text-sm bg-red-100 px-2 py-1 rounded">
            {expr.latex}
          </code>
        ))}
      </div>
    </div>
  )

  // 로딩 상태 렌더링
  const renderLoading = () => (
    <div
      className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-gray-500">Desmos 로딩 중...</div>
    </div>
  )

  // 그래프 렌더링
  const renderGraph = () => (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden border ${className}`}
      style={{ width, height }}
    />
  )

  // 조건부 렌더링 - ternary 사용
  return error ? renderError() : !isLoaded ? renderLoading() : renderGraph()
}

// Desmos 타입 선언
declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (
        element: HTMLElement,
        options?: Record<string, unknown>
      ) => {
        setExpression: (expr: Record<string, unknown>) => void
        destroy: () => void
      }
    }
  }
}
