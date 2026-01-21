'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import {
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Edit3,
  Eye,
  ClipboardList,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  RefreshCw,
} from 'lucide-react'
import type {
  SavedProblem,
  ProblemFilter,
  PaginatedResponse,
  ApiResponse,
} from '@/types/problem'
import {
  PROBLEM_TYPE_LABELS,
  PROBLEM_DIFFICULTY_LABELS,
} from '@/types/database'
import { SUBJECTS, GRADES } from '@/types/problem'

// 난이도 색상
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

// 문제 유형 색상
const TYPE_COLORS: Record<string, string> = {
  multiple_choice: 'bg-blue-100 text-blue-700',
  short_answer: 'bg-purple-100 text-purple-700',
  true_false: 'bg-cyan-100 text-cyan-700',
  essay: 'bg-orange-100 text-orange-700',
}

export default function SavedProblemsPage() {
  // 상태
  const [problems, setProblems] = useState<SavedProblem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 필터 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filter, setFilter] = useState<ProblemFilter>({})
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // 페이지네이션 상태
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  // 모달 상태
  const [selectedProblem, setSelectedProblem] = useState<SavedProblem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  // 문제 목록 조회
  const fetchProblems = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      // 필터 파라미터
      if (filter.subject) params.set('subject', filter.subject)
      if (filter.grade) params.set('grade', filter.grade)
      if (filter.unit) params.set('unit', filter.unit)
      if (filter.difficulty) params.set('difficulty', filter.difficulty)
      if (filter.type) params.set('type', filter.type)
      if (filter.aiGenerated !== undefined) params.set('aiGenerated', String(filter.aiGenerated))
      if (searchTerm) params.set('search', searchTerm)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      // 페이지네이션
      params.set('page', String(pagination.page))
      params.set('limit', String(pagination.limit))

      // 정렬 (최신순)
      params.set('sortField', 'created_at')
      params.set('sortDirection', 'desc')

      const response = await fetch(`/api/problems?${params.toString()}`)
      const result: ApiResponse<PaginatedResponse<SavedProblem>> = await response.json()

      if (result.success && result.data) {
        setProblems(result.data.data)
        setPagination(prev => ({
          ...prev,
          ...result.data!.pagination,
        }))
      } else {
        setError(result.error || '문제를 불러오는 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.')
      console.error('문제 목록 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }, [filter, searchTerm, dateFrom, dateTo, pagination.page, pagination.limit])

  // 초기 로드 및 필터 변경 시 재조회
  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  // 문제 삭제
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/problems/${id}`, {
        method: 'DELETE',
      })
      const result: ApiResponse<{ id: string; message: string }> = await response.json()

      if (result.success) {
        setShowDeleteConfirm(false)
        setSelectedProblem(null)
        fetchProblems()
      } else {
        alert(result.error || '삭제에 실패했습니다.')
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.')
      console.error('문제 삭제 오류:', err)
    }
  }

  // 검색 핸들러 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // 필터 초기화
  const resetFilters = () => {
    setFilter({})
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 문제 내용 미리보기 (최대 100자)
  const getPreviewText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div>
      <Header
        title="저장된 문제"
        subtitle={`총 ${pagination.total}개의 문제가 저장되어 있습니다`}
      />

      <div className="p-8">
        {/* 상단 액션 바 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="문제 내용, 정답 검색..."
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* 필터 */}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`btn-secondary flex items-center gap-2 ${
                Object.keys(filter).length > 0 ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <Filter className="w-4 h-4" />
              필터
              {Object.keys(filter).length > 0 && (
                <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {Object.keys(filter).length}
                </span>
              )}
            </button>
            {/* 새로고침 */}
            <button
              onClick={fetchProblems}
              className="btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>

        {/* 필터 패널 */}
        {showFilterPanel && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">필터 옵션</h3>
              <button
                onClick={resetFilters}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                초기화
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* 과목 */}
              <div>
                <label className="label">과목</label>
                <select
                  className="input"
                  value={filter.subject || ''}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      subject: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">전체</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              {/* 학년 */}
              <div>
                <label className="label">학년</label>
                <select
                  className="input"
                  value={filter.grade || ''}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      grade: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">전체</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
              {/* 난이도 */}
              <div>
                <label className="label">난이도</label>
                <select
                  className="input"
                  value={filter.difficulty || ''}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      difficulty: (e.target.value as 'easy' | 'medium' | 'hard') || undefined,
                    }))
                  }
                >
                  <option value="">전체</option>
                  <option value="easy">쉬움</option>
                  <option value="medium">보통</option>
                  <option value="hard">어려움</option>
                </select>
              </div>
              {/* 문제 유형 */}
              <div>
                <label className="label">문제 유형</label>
                <select
                  className="input"
                  value={filter.type || ''}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      type: (e.target.value as 'multiple_choice' | 'short_answer' | 'true_false' | 'essay') || undefined,
                    }))
                  }
                >
                  <option value="">전체</option>
                  <option value="multiple_choice">객관식</option>
                  <option value="short_answer">주관식</option>
                  <option value="true_false">O/X</option>
                  <option value="essay">서술형</option>
                </select>
              </div>
            </div>
            {/* 날짜 범위 필터 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="label">시작일</label>
                <input
                  type="date"
                  className="input"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="label">종료일</label>
                <input
                  type="date"
                  className="input"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="col-span-2 flex items-end">
                <p className="text-xs text-gray-400">
                  생성일자 기준으로 문제를 필터링합니다
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 로딩 상태 */}
        {loading ? (
          <div className="card p-12 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">문제를 불러오는 중...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="card p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">저장된 문제가 없습니다</p>
            <p className="text-sm text-gray-400">
              문제 생성 페이지에서 문제를 생성하고 저장해보세요
            </p>
          </div>
        ) : (
          <>
            {/* 문제 목록 테이블 */}
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      문제
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 w-24">
                      과목
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 w-24">
                      학년
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 w-24">
                      난이도
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 w-24">
                      유형
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 w-28">
                      생성일
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {problems.map((problem) => (
                    <tr
                      key={problem.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {problem.ai_generated && (
                            <span className="flex-shrink-0 mt-1">
                              <Sparkles className="w-4 h-4 text-primary-500" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="text-gray-900 line-clamp-2">
                              {getPreviewText(problem.question, 80)}
                            </p>
                            {problem.unit && (
                              <p className="text-xs text-gray-400 mt-1">
                                {problem.unit}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {problem.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {problem.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            DIFFICULTY_COLORS[problem.difficulty]
                          }`}
                        >
                          {PROBLEM_DIFFICULTY_LABELS[problem.difficulty]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            TYPE_COLORS[problem.type]
                          }`}
                        >
                          {PROBLEM_TYPE_LABELS[problem.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(problem.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={() =>
                            setShowDropdown(
                              showDropdown === problem.id ? null : problem.id
                            )
                          }
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* 드롭다운 메뉴 */}
                        {showDropdown === problem.id && (
                          <div className="absolute right-6 top-12 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-32">
                            <button
                              onClick={() => {
                                setSelectedProblem(problem)
                                setShowDetailModal(true)
                                setShowDropdown(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              상세보기
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProblem(problem)
                                setShowEditModal(true)
                                setShowDropdown(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" />
                              수정
                            </button>
                            <button
                              onClick={() => {
                                alert('과제 배정 기능은 준비 중입니다.')
                                setShowDropdown(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <ClipboardList className="w-4 h-4" />
                              과제로 배정
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                setSelectedProblem(problem)
                                setShowDeleteConfirm(true)
                                setShowDropdown(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                총 {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={!pagination.hasPrev}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={!pagination.hasNext}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* 문제 상세 모달 */}
        {showDetailModal && selectedProblem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">문제 상세</h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedProblem(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* 메타 정보 */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {selectedProblem.subject}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {selectedProblem.grade}
                  </span>
                  {selectedProblem.unit && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {selectedProblem.unit}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      DIFFICULTY_COLORS[selectedProblem.difficulty]
                    }`}
                  >
                    {PROBLEM_DIFFICULTY_LABELS[selectedProblem.difficulty]}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      TYPE_COLORS[selectedProblem.type]
                    }`}
                  >
                    {PROBLEM_TYPE_LABELS[selectedProblem.type]}
                  </span>
                  {selectedProblem.ai_generated && (
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI 생성
                    </span>
                  )}
                </div>

                {/* 문제 */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">문제</h4>
                  <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {selectedProblem.question}
                  </div>
                </div>

                {/* 보기 (객관식인 경우) */}
                {selectedProblem.options && selectedProblem.options.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">보기</h4>
                    <div className="space-y-2">
                      {selectedProblem.options.map((option, idx) => (
                        <div
                          key={option.id}
                          className={`p-3 rounded-lg border ${
                            option.is_correct
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(9312 + idx)}
                          </span>
                          {option.text}
                          {option.is_correct && (
                            <span className="ml-2 text-green-600 text-sm">(정답)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 정답 */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">정답</h4>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    {selectedProblem.answer}
                  </div>
                </div>

                {/* 풀이 */}
                {selectedProblem.solution && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">풀이</h4>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg whitespace-pre-wrap">
                      {selectedProblem.solution}
                    </div>
                  </div>
                )}

                {/* 태그 */}
                {selectedProblem.tags && selectedProblem.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">태그</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProblem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setShowEditModal(true)
                  }}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  수정
                </button>
                <button
                  onClick={() => {
                    alert('과제 배정 기능은 준비 중입니다.')
                  }}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <ClipboardList className="w-4 h-4" />
                  과제로 배정
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 문제 수정 모달 */}
        {showEditModal && selectedProblem && (
          <EditProblemModal
            problem={selectedProblem}
            onClose={() => {
              setShowEditModal(false)
              setSelectedProblem(null)
            }}
            onSave={() => {
              setShowEditModal(false)
              setSelectedProblem(null)
              fetchProblems()
            }}
          />
        )}

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && selectedProblem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">문제 삭제</h3>
              <p className="text-gray-600 mb-6">
                이 문제를 삭제하시겠습니까? 삭제된 문제는 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setSelectedProblem(null)
                  }}
                  className="flex-1 btn-secondary"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDelete(selectedProblem.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 드롭다운 닫기를 위한 오버레이 */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(null)}
        />
      )}
    </div>
  )
}

// 문제 수정 모달 컴포넌트
function EditProblemModal({
  problem,
  onClose,
  onSave,
}: {
  problem: SavedProblem
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    subject: problem.subject,
    grade: problem.grade,
    unit: problem.unit || '',
    question: problem.question,
    answer: problem.answer,
    solution: problem.solution || '',
    difficulty: problem.difficulty,
    type: problem.type,
    tags: problem.tags?.join(', ') || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/problems/${problem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          unit: formData.unit || undefined,
          solution: formData.solution || undefined,
          tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        }),
      })
      const result = await response.json()

      if (result.success) {
        onSave()
      } else {
        alert(result.error || '수정에 실패했습니다.')
      }
    } catch (err) {
      alert('수정 중 오류가 발생했습니다.')
      console.error('문제 수정 오류:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">문제 수정</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">과목</label>
              <select
                className="input"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                required
              >
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">학년</label>
              <select
                className="input"
                value={formData.grade}
                onChange={(e) => setFormData((prev) => ({ ...prev, grade: e.target.value }))}
                required
              >
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">단원 (선택)</label>
            <input
              type="text"
              className="input"
              value={formData.unit}
              onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
              placeholder="예: 일차방정식"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">난이도</label>
              <select
                className="input"
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    difficulty: e.target.value as 'easy' | 'medium' | 'hard',
                  }))
                }
                required
              >
                <option value="easy">쉬움</option>
                <option value="medium">보통</option>
                <option value="hard">어려움</option>
              </select>
            </div>
            <div>
              <label className="label">문제 유형</label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as 'multiple_choice' | 'short_answer' | 'true_false' | 'essay',
                  }))
                }
                required
              >
                <option value="multiple_choice">객관식</option>
                <option value="short_answer">주관식</option>
                <option value="true_false">O/X</option>
                <option value="essay">서술형</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">문제</label>
            <textarea
              className="input min-h-32"
              value={formData.question}
              onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">정답</label>
            <textarea
              className="input min-h-20"
              value={formData.answer}
              onChange={(e) => setFormData((prev) => ({ ...prev, answer: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">풀이 (선택)</label>
            <textarea
              className="input min-h-32"
              value={formData.solution}
              onChange={(e) => setFormData((prev) => ({ ...prev, solution: e.target.value }))}
              placeholder="문제 풀이 과정을 입력하세요"
            />
          </div>
          <div>
            <label className="label">태그 (쉼표로 구분)</label>
            <input
              type="text"
              className="input"
              value={formData.tags}
              onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="예: 일차방정식, 계산"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              취소
            </button>
            <button type="submit" className="flex-1 btn-primary" disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
