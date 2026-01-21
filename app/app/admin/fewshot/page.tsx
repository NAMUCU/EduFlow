'use client'

/**
 * Few-shot 샘플 관리 페이지 (관리자용)
 * - AI 문제 생성 시 참고할 예시 문제 관리
 * - 과목/단원/난이도별 분류
 * - CRUD 기능 + API 연동
 */

import { useState, useEffect, useCallback } from 'react'
import type { ProblemDifficulty } from '@/types/database'

interface FewShotSample {
  id: string
  subject: string
  grade: string
  unit: string
  difficulty: ProblemDifficulty
  question: string
  answer: string
  solution: string | null
  tags: string[]
  usage_count: number
  is_active: boolean
  created_at: string
}

interface Stats {
  total: number
  byDifficulty: {
    easy: number
    medium: number
    hard: number
  }
  bySubject: Record<string, number>
  totalUsage: number
}

const difficultyLabels: Record<ProblemDifficulty, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움'
}

const difficultyColors: Record<ProblemDifficulty, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
}

const subjects = ['수학', '영어', '국어', '과학', '사회']
const grades = ['중1', '중2', '중3', '고1', '고2', '고3']

export default function FewShotPage() {
  const [samples, setSamples] = useState<FewShotSample[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [units, setUnits] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 필터 상태
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterGrade, setFilterGrade] = useState('all')
  const [filterUnit, setFilterUnit] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSample, setEditingSample] = useState<FewShotSample | null>(null)
  const [formData, setFormData] = useState({
    subject: '수학',
    grade: '중1',
    unit: '',
    difficulty: 'medium' as ProblemDifficulty,
    question: '',
    answer: '',
    solution: '',
    tags: ''
  })
  const [saving, setSaving] = useState(false)

  // 선택 상태 (다중 삭제용)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 데이터 로드
  const fetchSamples = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filterSubject !== 'all') params.append('subject', filterSubject)
      if (filterGrade !== 'all') params.append('grade', filterGrade)
      if (filterUnit !== 'all') params.append('unit', filterUnit)
      if (filterDifficulty !== 'all') params.append('difficulty', filterDifficulty)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/fewshot?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setSamples(result.data)
      } else {
        setError(result.error || '데이터 로드 실패')
      }
    } catch (err) {
      setError('서버 연결 오류')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterSubject, filterGrade, filterUnit, filterDifficulty, searchQuery])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/fewshot?action=stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (err) {
      console.error('통계 로드 오류:', err)
    }
  }

  useEffect(() => {
    fetchSamples()
    fetchStats()
  }, [fetchSamples])

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const params = new URLSearchParams()
        if (filterSubject !== 'all') params.append('subject', filterSubject)
        if (filterGrade !== 'all') params.append('grade', filterGrade)
        params.append('action', 'units')

        const response = await fetch(`/api/fewshot?${params.toString()}`)
        const result = await response.json()
        if (result.success) {
          setUnits(result.data)
        }
      } catch (err) {
        console.error('단원 목록 로드 오류:', err)
      }
    }
    loadUnits()
  }, [filterSubject, filterGrade])

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      subject: '수학',
      grade: '중1',
      unit: '',
      difficulty: 'medium',
      question: '',
      answer: '',
      solution: '',
      tags: ''
    })
  }

  // 모달 열기 (생성/수정)
  const openModal = (sample?: FewShotSample) => {
    if (sample) {
      setEditingSample(sample)
      setFormData({
        subject: sample.subject,
        grade: sample.grade,
        unit: sample.unit,
        difficulty: sample.difficulty,
        question: sample.question,
        answer: sample.answer,
        solution: sample.solution || '',
        tags: sample.tags.join(', ')
      })
    } else {
      setEditingSample(null)
      resetForm()
    }
    setShowCreateModal(true)
  }

  // 모달 닫기
  const closeModal = () => {
    setShowCreateModal(false)
    setEditingSample(null)
    resetForm()
  }

  // 저장 (생성/수정)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.unit || !formData.question || !formData.answer) {
      alert('단원, 문제, 정답은 필수 입력 항목입니다.')
      return
    }

    setSaving(true)

    try {
      const url = '/api/fewshot'
      const method = editingSample ? 'PUT' : 'POST'
      const body = editingSample
        ? { id: editingSample.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        closeModal()
        fetchSamples()
        fetchStats()
      } else {
        alert(result.error || '저장 실패')
      }
    } catch (err) {
      console.error('저장 오류:', err)
      alert('서버 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch('/api/fewshot', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      const result = await response.json()

      if (result.success) {
        fetchSamples()
        fetchStats()
      } else {
        alert(result.error || '삭제 실패')
      }
    } catch (err) {
      console.error('삭제 오류:', err)
      alert('서버 오류가 발생했습니다.')
    }
  }

  // 다중 삭제
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`선택한 ${selectedIds.size}개 샘플을 삭제하시겠습니까?`)) return

    try {
      const response = await fetch('/api/fewshot', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      })

      const result = await response.json()

      if (result.success) {
        setSelectedIds(new Set())
        fetchSamples()
        fetchStats()
      } else {
        alert(result.error || '삭제 실패')
      }
    } catch (err) {
      console.error('다중 삭제 오류:', err)
      alert('서버 오류가 발생했습니다.')
    }
  }

  // 체크박스 토글
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === samples.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(samples.map(s => s.id)))
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Few-shot 샘플 관리</h1>
          <p className="text-gray-600 mt-1">AI 문제 생성 시 참고할 예시 문제를 관리합니다</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 샘플 추가
        </button>
      </div>

      {/* 통계 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">전체 샘플</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}개</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">쉬움</div>
            <div className="text-2xl font-bold text-green-600">{stats.byDifficulty.easy}개</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">보통</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.byDifficulty.medium}개</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">어려움</div>
            <div className="text-2xl font-bold text-red-600">{stats.byDifficulty.hard}개</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">총 사용 횟수</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsage}회</div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="문제 내용 또는 태그 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 과목</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 학년</option>
            {grades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 단원</option>
            {units.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 난이도</option>
            <option value="easy">쉬움</option>
            <option value="medium">보통</option>
            <option value="hard">어려움</option>
          </select>
        </div>
      </div>

      {/* 다중 선택 액션 */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="text-blue-700">
            {selectedIds.size}개 선택됨
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            선택 삭제
          </button>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">로딩 중...</p>
        </div>
      )}

      {/* 샘플 목록 */}
      {!loading && (
        <div className="space-y-4">
          {/* 전체 선택 */}
          {samples.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={selectedIds.size === samples.length}
                onChange={toggleSelectAll}
                className="rounded border-gray-300"
              />
              <span>전체 선택</span>
            </div>
          )}

          {samples.map((sample) => (
            <div key={sample.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(sample.id)}
                    onChange={() => toggleSelect(sample.id)}
                    className="rounded border-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {sample.subject}
                    </span>
                    <span className="font-medium text-gray-900">{sample.grade}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600">{sample.unit}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${difficultyColors[sample.difficulty]}`}>
                      {difficultyLabels[sample.difficulty]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span title="사용 횟수" className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {sample.usage_count}회
                  </span>
                  <button
                    onClick={() => openModal(sample)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => handleDelete(sample.id)}
                    className="text-red-600 hover:text-red-800 hover:underline"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div className="space-y-2 ml-7">
                <div>
                  <span className="text-sm font-medium text-gray-500">문제:</span>
                  <p className="text-gray-800 whitespace-pre-wrap">{sample.question}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">정답:</span>
                  <p className="text-green-700 font-medium">{sample.answer}</p>
                </div>
                {sample.solution && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">풀이:</span>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{sample.solution}</p>
                  </div>
                )}
              </div>

              {sample.tags.length > 0 && (
                <div className="flex gap-1 mt-3 ml-7">
                  {sample.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && samples.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mt-2">
            {searchQuery || filterSubject !== 'all' || filterGrade !== 'all' || filterUnit !== 'all' || filterDifficulty !== 'all'
              ? '조건에 맞는 샘플이 없습니다'
              : 'Few-shot 샘플이 없습니다. 새 샘플을 추가해주세요.'}
          </p>
          {!searchQuery && filterSubject === 'all' && (
            <button
              onClick={() => openModal()}
              className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              + 첫 번째 샘플 추가하기
            </button>
          )}
        </div>
      )}

      {/* 생성/편집 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">
                {editingSample ? 'Few-shot 샘플 편집' : '새 Few-shot 샘플 추가'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    과목 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    학년 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    난이도 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as ProblemDifficulty }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="easy">쉬움</option>
                    <option value="medium">보통</option>
                    <option value="hard">어려움</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  단원 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 일차함수, 현재완료"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  문제 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="LaTeX 수식 사용 가능 (예: $x^2 + 2x + 1$)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: 수식은 $...$ 또는 $$...$$ 로 감싸서 입력하세요
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  정답 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="정답을 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  풀이 (선택)
                </label>
                <textarea
                  rows={4}
                  value={formData.solution}
                  onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="단계별 풀이 과정을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  태그 (선택)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="쉼표로 구분 (예: 기울기, 직선의 방정식, 기본)"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  disabled={saving}
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {editingSample ? '저장' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
