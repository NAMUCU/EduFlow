'use client'

/**
 * Function Plot 함수 그래프 시각화 컴포넌트
 */

import { useEffect, useRef, useId } from 'react'

export interface FunctionData {
  fn: string           // 함수식 (예: 'x^2', 'sin(x)', '2*x+1')
  color?: string
  range?: [number, number]
  derivative?: boolean // 도함수 표시
}

interface GraphPlotProps {
  functions: FunctionData[]
  width?: number
  height?: number
  xDomain?: [number, number]
  yDomain?: [number, number]
  showGrid?: boolean
  title?: string
  className?: string
}

export function GraphPlot({
  functions,
  width = 400,
  height = 400,
  xDomain = [-10, 10],
  yDomain = [-10, 10],
  showGrid = true,
  title,
  className = ''
}: GraphPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const id = useId().replace(/:/g, '')

  useEffect(() => {
    const initPlot = async () => {
      if (typeof window === 'undefined' || !containerRef.current) return

      // function-plot 동적 로드
      let functionPlot = (window as unknown as Record<string, unknown>).functionPlot as ((options: Record<string, unknown>) => void) | undefined
      if (!functionPlot) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/function-plot@1/dist/function-plot.js'
          script.onload = () => resolve()
          document.head.appendChild(script)
        })
        functionPlot = (window as unknown as Record<string, (options: Record<string, unknown>) => void>).functionPlot
      }

      if (!functionPlot) return

      // 기존 내용 제거
      containerRef.current.innerHTML = ''

      const data = functions.flatMap(f => {
        const items = [{ fn: f.fn, color: f.color || 'steelblue', range: f.range }]
        if (f.derivative) items.push({ fn: f.fn, derivative: { fn: f.fn }, color: 'red', range: f.range } as unknown as typeof items[0])
        return items
      })

      functionPlot({
        target: `#graph-${id}`,
        width,
        height,
        xAxis: { domain: xDomain },
        yAxis: { domain: yDomain },
        grid: showGrid,
        title,
        data
      })
    }

    initPlot()
  }, [id, functions, width, height, xDomain, yDomain, showGrid, title])

  return (
    <div
      ref={containerRef}
      id={`graph-${id}`}
      className={`bg-white rounded border ${className}`}
      style={{ width, height }}
    />
  )
}

// 자주 쓰는 함수 프리셋
export function LinearFunction({ a = 1, b = 0, color = 'blue' }: { a?: number; b?: number; color?: string }) {
  const fn = b >= 0 ? `${a}*x+${b}` : `${a}*x${b}`
  return <GraphPlot functions={[{ fn, color }]} />
}

export function QuadraticFunction({ a = 1, b = 0, c = 0, showVertex = false }: { a?: number; b?: number; c?: number; showVertex?: boolean }) {
  const fn = `${a}*x^2+${b}*x+${c}`
  const functions: FunctionData[] = [{ fn, color: 'blue' }]
  if (showVertex) functions.push({ fn, derivative: true })
  return <GraphPlot functions={functions} />
}

export function TrigFunction({ type = 'sin', amplitude = 1, frequency = 1 }: { type?: 'sin' | 'cos' | 'tan'; amplitude?: number; frequency?: number }) {
  const fn = `${amplitude}*${type}(${frequency}*x)`
  const yDomain: [number, number] = type === 'tan' ? [-10, 10] : [-amplitude - 1, amplitude + 1]
  return <GraphPlot functions={[{ fn, color: 'green' }]} yDomain={yDomain} />
}

export function ExponentialFunction({ base = 2, showLog = false }: { base?: number; showLog?: boolean }) {
  const functions: FunctionData[] = [{ fn: `${base}^x`, color: 'purple' }]
  if (showLog) functions.push({ fn: `log(x)/log(${base})`, color: 'orange' })
  return <GraphPlot functions={functions} xDomain={[-5, 5]} yDomain={[-2, 10]} />
}

export function CompareFunction({ fn1, fn2, label1 = 'f(x)', label2 = 'g(x)' }: { fn1: string; fn2: string; label1?: string; label2?: string }) {
  return (
    <div className="relative">
      <GraphPlot functions={[{ fn: fn1, color: 'blue' }, { fn: fn2, color: 'red' }]} />
      <div className="absolute top-2 right-2 text-sm">
        <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500" /> {label1}</div>
        <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500" /> {label2}</div>
      </div>
    </div>
  )
}

export default GraphPlot
