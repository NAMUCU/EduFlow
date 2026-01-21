'use client'

/**
 * 문제 세트 목록 페이지
 * - 날짜별/과제별 필터링
 * - 문제번호 검색
 */

import { useState } from 'react'
import Link from 'next/link'

interface ProblemSet {
  id: string
  name: string
  type: 'assignment' | 'class' | 'exam'
  subject: string
  grade: string
  problemCount: number
  createdAt: string
  assignmentId?: string
  assignmentName?: string
}

// Mock 데이터
const mockProblemSets: ProblemSet[] = [
  { id: '1', name: '중2 일차함수 기본', type: 'assignment', subject: '수학', grade: '중2', problemCount: 10, createdAt: '2026-01-21', assignmentId: 'a1', assignmentName: '1월 3주차 과제' },
  { id: '2', name: '중3 이차방정식 심화', type: 'class', subject: '수학', grade: '중3', problemCount: 15, createdAt: '2026-01-20' },
  { id: '3', name: '고1 수학 모의고사', type: 'exam', subject: '수학', grade: '고1', problemCount: 30, createdAt: '2026-01-19' },
  { id: '4', name: '중2 연립방정식', type: 'assignment', subject: '수학', grade: '중2', problemCount: 8, createdAt: '2026-01-18', assignmentId: 'a2', assignmentName: '1월 2주차 과제' },
  { id: '5', name: '중1 정수와 유리수', type: 'class', subject: '수학', grade: '중1', problemCount: 12, createdAt: '2026-01-17' },
]

const typeLabels: Record<string, string> = {
  assignment: '과제',
  class: '수업',
  exam: '시험'
}

const typeColors: Record<string, string> = {
  assignment: 'bg-blue-100 text-blue-800',
  class: 'bg-green-100 text-green-800',
  exam: 'bg-purple-100 text-purple-800'
}

export default function ProblemSetsPage() {
  const [problemSets] = useState<ProblemSet[]>(mockProblemSets)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // 필터링
  const filteredSets = problemSets.filter(set => {
    if (filterType !== 'all' && set.type !== filterType) return false
    if (filterDate && !set.createdAt.startsWith(filterDate)) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return set.name.toLowerCase().includes(query) ||
             set.grade.toLowerCase().includes(query) ||
             set.assignmentName?.toLowerCase().includes(query)
    }
    return true
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">문제 세트</h1>
          <p className="text-gray-600 mt-1">과제, 수업, 시험별 문제 묶음 관리</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 문제 세트
        </button>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 검색 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <input
              type="text"
              placeholder="문제 세트명, 학년, 과제명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 유형 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체</option>
              <option value="assignment">과제</option>
              <option value="class">수업</option>
              <option value="exam">시험</option>
            </select>
          </div>

          {/* 날짜 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 문제 세트 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">문제 세트</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학년</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">문제 수</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연결된 과제</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSets.map((set) => (
              <tr key={set.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/dashboard/problem-sets/${set.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                    {set.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[set.type]}`}>
                    {typeLabels[set.type]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{set.grade}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{set.problemCount}문제</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{set.createdAt}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {set.assignmentName ? (
                    <Link href={`/dashboard/assignments/${set.assignmentId}`} className="text-green-600 hover:text-green-800">
                      {set.assignmentName}
                    </Link>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/dashboard/problem-sets/${set.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      보기
                    </Link>
                    <button className="text-gray-600 hover:text-gray-900">복제</button>
                    <button className="text-red-600 hover:text-red-900">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSets.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">문제 세트가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">새 문제 세트를 만들어보세요.</p>
          </div>
        )}
      </div>

      {/* 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">새 문제 세트 만들기</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="예: 중2 일차함수 기본" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="assignment">과제</option>
                  <option value="class">수업</option>
                  <option value="exam">시험</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>중1</option>
                  <option>중2</option>
                  <option>중3</option>
                  <option>고1</option>
                  <option>고2</option>
                  <option>고3</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                  취소
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  만들기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
