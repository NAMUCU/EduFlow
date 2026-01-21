'use client'

/**
 * 문제 검색 컴포넌트
 * - 문제번호, 내용, 단원, 난이도로 검색
 * - 저장된 문제에서 선택
 */

import { useState, useEffect } from 'react'

interface Problem {
  id: string
  question: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  unit: string
  type: string
  grade: string
  createdAt: string
}

interface ProblemSearchProps {
  onSelect?: (problems: Problem[]) => void
  multiSelect?: boolean
  selectedIds?: string[]
  filterGrade?: string
  filterUnit?: string
  className?: string
}

// Mock 데이터
const mockProblems: Problem[] = [
  { id: 'p1', question: '일차함수 $y = 2x + 3$의 기울기는?', answer: '2', difficulty: 'easy', unit: '일차함수', type: '객관식', grade: '중2', createdAt: '2026-01-21' },
  { id: 'p2', question: '두 점 $(1, 3)$, $(3, 7)$을 지나는 직선의 기울기를 구하시오.', answer: '2', difficulty: 'medium', unit: '일차함수', type: '서술형', grade: '중2', createdAt: '2026-01-20' },
  { id: 'p3', question: '이차방정식 $x^2 - 5x + 6 = 0$의 해를 구하시오.', answer: '$x = 2$ 또는 $x = 3$', difficulty: 'medium', unit: '이차방정식', type: '서술형', grade: '중3', createdAt: '2026-01-19' },
  { id: 'p4', question: '$\\sin 30° + \\cos 60°$의 값은?', answer: '1', difficulty: 'easy', unit: '삼각비', type: '단답형', grade: '중3', createdAt: '2026-01-18' },
  { id: 'p5', question: '함수 $f(x) = x^2 - 4x + 3$의 최솟값을 구하시오.', answer: '-1', difficulty: 'hard', unit: '이차함수', type: '서술형', grade: '고1', createdAt: '2026-01-17' },
]

const difficultyLabels: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' }
const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
}

export function ProblemSearch({
  onSelect,
  multiSelect = true,
  selectedIds = [],
  filterGrade,
  filterUnit,
  className = ''
}: ProblemSearchProps) {
  const [problems] = useState<Problem[]>(mockProblems)
  const [searchQuery, setSearchQuery] = useState('')
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds)
  const [gradeFilter, setGradeFilter] = useState(filterGrade || 'all')
  const [unitFilter, setUnitFilter] = useState(filterUnit || 'all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')

  useEffect(() => {
    setLocalSelectedIds(selectedIds)
  }, [selectedIds])

  // 필터링
  const filteredProblems = problems.filter(p => {
    if (gradeFilter !== 'all' && p.grade !== gradeFilter) return false
    if (unitFilter !== 'all' && p.unit !== unitFilter) return false
    if (difficultyFilter !== 'all' && p.difficulty !== difficultyFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return p.question.toLowerCase().includes(query) ||
             p.unit.toLowerCase().includes(query) ||
             p.id.toLowerCase().includes(query)
    }
    return true
  })

  const units = [...new Set(problems.map(p => p.unit))]

  const toggleSelect = (id: string) => {
    let newSelected: string[]
    if (multiSelect) {
      newSelected = localSelectedIds.includes(id)
        ? localSelectedIds.filter(i => i !== id)
        : [...localSelectedIds, id]
    } else {
      newSelected = localSelectedIds.includes(id) ? [] : [id]
    }
    setLocalSelectedIds(newSelected)

    if (onSelect) {
      const selectedProblems = problems.filter(p => newSelected.includes(p.id))
      onSelect(selectedProblems)
    }
  }

  const selectAll = () => {
    const allIds = filteredProblems.map(p => p.id)
    setLocalSelectedIds(allIds)
    if (onSelect) {
      onSelect(filteredProblems)
    }
  }

  const clearSelection = () => {
    setLocalSelectedIds([])
    if (onSelect) {
      onSelect([])
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* 검색 및 필터 */}
      <div className="p-4 border-b">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="문제 ID, 내용, 단원 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
          >
            <option value="all">전체 학년</option>
            <option value="중1">중1</option>
            <option value="중2">중2</option>
            <option value="중3">중3</option>
            <option value="고1">고1</option>
            <option value="고2">고2</option>
            <option value="고3">고3</option>
          </select>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
          >
            <option value="all">전체 단원</option>
            {units.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
          >
            <option value="all">전체 난이도</option>
            <option value="easy">쉬움</option>
            <option value="medium">보통</option>
            <option value="hard">어려움</option>
          </select>
          {multiSelect && (
            <div className="ml-auto flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                전체 선택
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded"
              >
                선택 해제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 선택 상태 */}
      {localSelectedIds.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b text-sm text-blue-800">
          {localSelectedIds.length}개 문제 선택됨
        </div>
      )}

      {/* 문제 목록 */}
      <div className="max-h-96 overflow-y-auto">
        {filteredProblems.map((problem) => (
          <div
            key={problem.id}
            onClick={() => toggleSelect(problem.id)}
            className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
              localSelectedIds.includes(problem.id) ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={localSelectedIds.includes(problem.id)}
                onChange={() => {}}
                className="mt-1 h-4 w-4 text-blue-600 rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">{problem.id}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{problem.grade}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{problem.unit}</span>
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${difficultyColors[problem.difficulty]}`}>
                    {difficultyLabels[problem.difficulty]}
                  </span>
                </div>
                <p className="text-sm text-gray-800 truncate">{problem.question}</p>
                <p className="text-xs text-gray-500 mt-1">
                  정답: <span className="text-green-700">{problem.answer}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProblems.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          검색 결과가 없습니다
        </div>
      )}

      {/* 결과 요약 */}
      <div className="p-3 bg-gray-50 border-t text-sm text-gray-500">
        총 {filteredProblems.length}개 문제
      </div>
    </div>
  )
}

export default ProblemSearch
