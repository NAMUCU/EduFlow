'use client'

/**
 * 문제 카드 컴포넌트 - 문제 + 시각화 통합 표시
 */

import { MathText } from './MathExpression'
import { GeometryCanvas, Point, GeometryElement } from './GeometryCanvas'
import { GraphPlot, FunctionData } from './GraphPlot'

export interface Problem {
  id: string
  number?: number
  question: string
  options?: string[]
  answer?: string
  solution?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  type?: string
  visualization?: {
    type: 'none' | 'geometry' | 'graph'
    data?: {
      points?: Point[]
      elements?: GeometryElement[]
      functions?: FunctionData[]
      boundingBox?: [number, number, number, number]
      xDomain?: [number, number]
      yDomain?: [number, number]
    }
  }
}

interface ProblemCardProps {
  problem: Problem
  showAnswer?: boolean
  showSolution?: boolean
  onSelect?: (id: string) => void
  selected?: boolean
  className?: string
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
}

const difficultyLabels = { easy: '쉬움', medium: '보통', hard: '어려움' }

export function ProblemCard({
  problem,
  showAnswer = false,
  showSolution = false,
  onSelect,
  selected = false,
  className = ''
}: ProblemCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 bg-white ${selected ? 'ring-2 ring-blue-500' : ''} ${onSelect ? 'cursor-pointer hover:shadow-md' : ''} ${className}`}
      onClick={() => onSelect?.(problem.id)}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {problem.number ? <span className="font-bold text-lg">Q{problem.number}</span> : null}
          {problem.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded ${difficultyColors[problem.difficulty]}`}>
              {difficultyLabels[problem.difficulty]}
            </span>
          )}
          {problem.type ? <span className="text-xs text-gray-500">{problem.type}</span> : null}
        </div>
      </div>

      {/* 문제 본문 */}
      <div className="mb-4">
        <MathText className="text-gray-800 leading-relaxed">{problem.question}</MathText>
      </div>

      {/* 시각화 */}
      {problem.visualization?.type !== 'none' && problem.visualization?.data && (
        <div className="mb-4 flex justify-center">
          {problem.visualization.type === 'geometry' && (
            <GeometryCanvas
              points={problem.visualization.data.points}
              elements={problem.visualization.data.elements}
              boundingBox={problem.visualization.data.boundingBox}
              width={300}
              height={300}
            />
          )}
          {problem.visualization.type === 'graph' && (
            <GraphPlot
              functions={problem.visualization.data.functions || []}
              xDomain={problem.visualization.data.xDomain}
              yDomain={problem.visualization.data.yDomain}
              width={300}
              height={300}
            />
          )}
        </div>
      )}

      {/* 객관식 보기 */}
      {problem.options && problem.options.length > 0 && (
        <div className="mb-4 space-y-2">
          {problem.options.map((opt, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-gray-500">{String.fromCharCode(9312 + i)}</span>
              <MathText>{opt}</MathText>
            </div>
          ))}
        </div>
      )}

      {/* 정답 */}
      {showAnswer && problem.answer && (
        <div className="mt-4 pt-3 border-t">
          <div className="text-sm font-medium text-gray-600 mb-1">정답</div>
          <MathText className="text-blue-600 font-medium">{problem.answer}</MathText>
        </div>
      )}

      {/* 해설 */}
      {showSolution && problem.solution && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-sm font-medium text-gray-600 mb-1">해설</div>
          <MathText className="text-gray-700">{problem.solution}</MathText>
        </div>
      )}
    </div>
  )
}

// 문제 목록 컴포넌트
export function ProblemList({
  problems,
  showAnswer = false,
  showSolution = false,
  selectable = false,
  selectedIds = [],
  onSelect,
  className = ''
}: {
  problems: Problem[]
  showAnswer?: boolean
  showSolution?: boolean
  selectable?: boolean
  selectedIds?: string[]
  onSelect?: (ids: string[]) => void
  className?: string
}) {
  const handleSelect = (id: string) => {
    if (!selectable || !onSelect) return
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id]
    onSelect(newIds)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {problems.map((p, i) => (
        <ProblemCard
          key={p.id}
          problem={{ ...p, number: p.number || i + 1 }}
          showAnswer={showAnswer}
          showSolution={showSolution}
          onSelect={selectable ? handleSelect : undefined}
          selected={selectedIds.includes(p.id)}
        />
      ))}
    </div>
  )
}

export default ProblemCard
