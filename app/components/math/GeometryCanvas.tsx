'use client'

/**
 * JSXGraph 기하 도형 시각화 컴포넌트
 */

import { useEffect, useRef, useId } from 'react'

export interface Point { name: string; coords: [number, number]; style?: Record<string, unknown> }
export interface GeometryElement {
  type: 'point' | 'line' | 'segment' | 'circle' | 'polygon' | 'angle' | 'midpoint'
  vertices?: string[]
  center?: string
  radius?: number
  through?: string
  style?: Record<string, unknown>
}

interface GeometryCanvasProps {
  width?: number
  height?: number
  boundingBox?: [number, number, number, number]  // [xMin, yMax, xMax, yMin]
  points?: Point[]
  elements?: GeometryElement[]
  showAxis?: boolean
  showGrid?: boolean
  className?: string
}

export function GeometryCanvas({
  width = 400,
  height = 400,
  boundingBox = [-5, 5, 5, -5],
  points = [],
  elements = [],
  showAxis = true,
  showGrid = true,
  className = ''
}: GeometryCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<unknown>(null)
  const id = useId().replace(/:/g, '')

  useEffect(() => {
    const initBoard = async () => {
      if (typeof window === 'undefined' || !containerRef.current) return

      // JSXGraph 동적 로드
      if (!(window as unknown as Record<string, unknown>).JXG) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdn.jsdelivr.net/npm/jsxgraph@1.8.0/distrib/jsxgraph.css'
        document.head.appendChild(link)

        await new Promise<void>((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/jsxgraph@1.8.0/distrib/jsxgraphcore.js'
          script.onload = () => resolve()
          document.head.appendChild(script)
        })
      }

      const JXG = (window as unknown as Record<string, { JSXGraph: { initBoard: (id: string, options: Record<string, unknown>) => unknown; freeBoard?: (board: unknown) => void } }>).JXG

      // 기존 보드 제거
      if (boardRef.current) {
        try { JXG.JSXGraph.freeBoard?.(boardRef.current) } catch { /* ignore */ }
      }

      const board = JXG.JSXGraph.initBoard(`geometry-${id}`, {
        boundingbox: boundingBox,
        axis: showAxis,
        grid: showGrid,
        showNavigation: false,
        showCopyright: false,
        keepaspectratio: true
      }) as { create: (type: string, params: unknown[], options?: Record<string, unknown>) => unknown }

      boardRef.current = board

      // 점 생성
      const pointsMap: Record<string, unknown> = {}
      points.forEach(p => {
        pointsMap[p.name] = board.create('point', p.coords, { name: p.name, size: 3, ...p.style })
      })

      // 도형 요소 생성
      elements.forEach(el => {
        const getPoints = (names: string[]) => names.map(n => pointsMap[n]).filter(Boolean)

        switch (el.type) {
          case 'segment':
            if (el.vertices?.length === 2) board.create('segment', getPoints(el.vertices), { strokeWidth: 2, ...el.style })
            break
          case 'line':
            if (el.vertices?.length === 2) board.create('line', getPoints(el.vertices), { strokeWidth: 1, ...el.style })
            break
          case 'polygon':
            if (el.vertices && el.vertices.length >= 3) board.create('polygon', getPoints(el.vertices), { fillColor: 'transparent', ...el.style })
            break
          case 'circle':
            if (el.center && el.radius) board.create('circle', [pointsMap[el.center], el.radius], { ...el.style })
            else if (el.center && el.through) board.create('circle', [pointsMap[el.center], pointsMap[el.through]], { ...el.style })
            break
          case 'midpoint':
            if (el.vertices?.length === 2) board.create('midpoint', getPoints(el.vertices), { name: 'M', ...el.style })
            break
          case 'angle':
            if (el.vertices?.length === 3) board.create('angle', getPoints(el.vertices), { radius: 0.5, ...el.style })
            break
        }
      })
    }

    initBoard()

    return () => {
      if (boardRef.current && typeof window !== 'undefined') {
        const JXG = (window as unknown as Record<string, { JSXGraph: { freeBoard: (board: unknown) => void } }>).JXG
        try { JXG?.JSXGraph?.freeBoard?.(boardRef.current) } catch { /* ignore */ }
      }
    }
  }, [id, boundingBox, showAxis, showGrid, points, elements])

  return (
    <div
      ref={containerRef}
      id={`geometry-${id}`}
      className={`bg-white rounded border ${className}`}
      style={{ width, height }}
    />
  )
}

// 자주 쓰는 도형 프리셋
export function Triangle({ A, B, C, showMedian = false }: { A: [number, number]; B: [number, number]; C: [number, number]; showMedian?: boolean }) {
  const points: Point[] = [
    { name: 'A', coords: A },
    { name: 'B', coords: B },
    { name: 'C', coords: C }
  ]
  const elements: GeometryElement[] = [{ type: 'polygon', vertices: ['A', 'B', 'C'] }]
  if (showMedian) {
    elements.push({ type: 'midpoint', vertices: ['B', 'C'] })
    elements.push({ type: 'segment', vertices: ['A', 'M'], style: { strokeColor: 'blue', dash: 2 } })
  }
  return <GeometryCanvas points={points} elements={elements} />
}

export function Cube({ size = 4, offset = 1.5 }: { size?: number; offset?: number }) {
  const points: Point[] = [
    { name: 'A', coords: [0, 0] }, { name: 'B', coords: [size, 0] },
    { name: 'C', coords: [size, size] }, { name: 'D', coords: [0, size] },
    { name: 'E', coords: [offset, offset] }, { name: 'F', coords: [size + offset, offset] },
    { name: 'G', coords: [size + offset, size + offset] }, { name: 'H', coords: [offset, size + offset] }
  ]
  const elements: GeometryElement[] = [
    { type: 'polygon', vertices: ['A', 'B', 'C', 'D'] },
    { type: 'segment', vertices: ['E', 'F'], style: { dash: 2 } },
    { type: 'segment', vertices: ['E', 'H'], style: { dash: 2 } },
    { type: 'segment', vertices: ['E', 'A'], style: { dash: 2 } },
    { type: 'segment', vertices: ['B', 'F'] }, { type: 'segment', vertices: ['C', 'G'] },
    { type: 'segment', vertices: ['D', 'H'] }, { type: 'segment', vertices: ['F', 'G'] },
    { type: 'segment', vertices: ['G', 'H'] }
  ]
  return <GeometryCanvas points={points} elements={elements} boundingBox={[-1, size + offset + 1, size + offset + 1, -1]} showAxis={false} showGrid={false} />
}

export default GeometryCanvas
