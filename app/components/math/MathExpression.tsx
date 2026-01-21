'use client'

/**
 * KaTeX 수식 렌더링 컴포넌트
 */

import { useEffect, useRef } from 'react'

interface MathExpressionProps {
  math: string
  display?: boolean  // true: 블록, false: 인라인
  className?: string
}

// KaTeX 동적 로드 (CDN)
let katexLoaded = false
async function loadKaTeX(): Promise<void> {
  if (katexLoaded || typeof window === 'undefined') return

  // CSS 로드
  if (!document.querySelector('link[href*="katex"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
    document.head.appendChild(link)
  }

  // JS 로드
  if (!(window as unknown as Record<string, unknown>).katex) {
    await new Promise<void>((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
      script.onload = () => resolve()
      document.head.appendChild(script)
    })
  }
  katexLoaded = true
}

export function MathExpression({ math, display = false, className = '' }: MathExpressionProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const render = async () => {
      await loadKaTeX()
      if (ref.current && typeof window !== 'undefined') {
        const katex = (window as unknown as Record<string, { render: (math: string, el: HTMLElement, options: Record<string, unknown>) => void }>).katex
        try {
          katex?.render(math, ref.current, { displayMode: display, throwOnError: false, trust: true })
        } catch {
          ref.current.textContent = math
        }
      }
    }
    render()
  }, [math, display])

  return <span ref={ref} className={className} />
}

// 텍스트 내 수식 자동 변환 ($..$ 또는 $$..$$)
export function MathText({ children, className = '' }: { children: string; className?: string }) {
  const parts = children.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return <MathExpression key={i} math={part.slice(2, -2)} display />
        } else if (part.startsWith('$') && part.endsWith('$')) {
          return <MathExpression key={i} math={part.slice(1, -1)} />
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

export default MathExpression
