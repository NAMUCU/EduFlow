'use client'

/**
 * 문제 세트 상세 페이지
 * - 포함된 문제 목록
 * - 문제 추가/제거
 * - 문제 순서 변경
 */

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Problem {
  id: string
  number: number
  question: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  unit: string
  type: string
}

interface ProblemSet {
  id: string
  name: string
  type: 'assignment' | 'class' | 'exam'
  subject: string
  grade: string
  description?: string
  createdAt: string
  problems: Problem[]
}

// Mock 데이터
const mockProblemSet: ProblemSet = {
  id: '1',
  name: '중2 일차함수 기본',
  type: 'assignment',
  subject: '수학',
  grade: '중2',
  description: '일차함수의 그래프와 기울기를 이해하는 문제 세트입니다.',
  createdAt: '2026-01-21',
  problems: [
    { id: 'p1', number: 1, question: '일차함수 $y = 2x + 3$의 기울기는?', answer: '2', difficulty: 'easy', unit: '일차함수', type: '객관식' },
    { id: 'p2', number: 2, question: '일차함수 $y = -x + 5$가 y축과 만나는 점의 좌표는?', answer: '(0, 5)', difficulty: 'easy', unit: '일차함수', type: '단답형' },
    { id: 'p3', number: 3, question: '두 점 $(1, 3)$, $(3, 7)$을 지나는 직선의 기울기를 구하시오.', answer: '2', difficulty: 'medium', unit: '일차함수', type: '서술형' },
    { id: 'p4', number: 4, question: '일차함수 $y = ax + 2$가 점 $(2, 8)$을 지날 때, $a$의 값은?', answer: '3', difficulty: 'medium', unit: '일차함수', type: '단답형' },
    { id: 'p5', number: 5, question: '기울기가 $-\\frac{1}{2}$이고 $y$절편이 4인 일차함수의 식을 구하시오.', answer: '$y = -\\frac{1}{2}x + 4$', difficulty: 'hard', unit: '일차함수', type: '서술형' },
  ]
}

const difficultyLabels: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' }
const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
}
const typeLabels: Record<string, string> = { assignment: '과제', class: '수업', exam: '시험' }

export default function ProblemSetDetailPage() {
  const params = useParams()
  const [problemSet] = useState<ProblemSet>(mockProblemSet)
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleProblem = (id: string) => {
    setSelectedProblems(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const filteredProblems = problemSet.problems.filter(p =>
    searchQuery === '' ||
    p.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.number.toString() === searchQuery
  )

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/problem-sets" className="hover:text-blue-600">문제 세트</Link>
          <span>/</span>
          <span>{problemSet.name}</span>
        </div>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{problemSet.name}</h1>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {typeLabels[problemSet.type]}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{problemSet.description}</p>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>{problemSet.grade} · {problemSet.subject}</span>
              <span>{problemSet.problems.length}문제</span>
              <span>생성일: {problemSet.createdAt}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              인쇄
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PDF
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              문제 추가
            </button>
          </div>
        </div>
      </div>

      {/* 검색 및 일괄 작업 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="문제번호 또는 내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">
              {selectedProblems.length > 0 && `${selectedProblems.length}개 선택됨`}
            </span>
          </div>
          {selectedProblems.length > 0 && (
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                순서 변경
              </button>
              <button className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50">
                선택 삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 문제 목록 */}
      <div className="space-y-4">
        {filteredProblems.map((problem) => (
          <div
            key={problem.id}
            className={`bg-white rounded-lg shadow p-4 border-l-4 ${
              selectedProblems.includes(problem.id) ? 'border-blue-500 bg-blue-50' : 'border-transparent'
            }`}
          >
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selectedProblems.includes(problem.id)}
                onChange={() => toggleProblem(problem.id)}
                className="mt-1 h-4 w-4 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg text-gray-900">#{problem.number}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${difficultyColors[problem.difficulty]}`}>
                    {difficultyLabels[problem.difficulty]}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {problem.type}
                  </span>
                  <span className="text-xs text-gray-500">{problem.unit}</span>
                </div>
                <p className="text-gray-800 mb-2">{problem.question}</p>
                <div className="text-sm">
                  <span className="text-gray-500">정답: </span>
                  <span className="font-medium text-green-700">{problem.answer}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-2 text-gray-400 hover:text-gray-600" title="위로">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600" title="아래로">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-blue-600" title="편집">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600" title="삭제">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProblems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery ? '검색 결과가 없습니다' : '문제가 없습니다'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? '다른 검색어를 시도해보세요.' : '문제 추가 버튼을 눌러 문제를 추가하세요.'}
          </p>
        </div>
      )}

      {/* 문제 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">문제 추가</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="저장된 문제 검색..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">검색</button>
              </div>
              <div className="border rounded-lg p-4 text-center text-gray-500">
                <p>저장된 문제에서 검색하거나</p>
                <Link href="/dashboard/problems" className="text-blue-600 hover:underline">새 문제 생성</Link>
                <span> 페이지에서 문제를 만들어 추가하세요.</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
