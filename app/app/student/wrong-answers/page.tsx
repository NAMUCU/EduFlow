'use client'

/**
 * 오답노트 페이지 (학생용)
 *
 * 기능:
 * - 오답 문제 목록
 * - 단원별/날짜별/과목별 필터
 * - 다시 풀기 기능
 * - AI 해설 및 유사 문제 생성
 * - 복습 완료/해결 처리
 */

import { useState, useCallback, useEffect } from 'react'
import {
  BookX,
  Filter,
  RotateCcw,
  CheckCircle,
  Clock,
  Play,
  Search,
  Calendar,
  SortAsc,
  SortDesc,
  Loader2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Brain,
  TrendingUp,
  Lightbulb,
  Heart,
} from 'lucide-react'
import WrongAnswerCard from '@/components/student/WrongAnswerCard'
import type { WrongAnswer, WrongAnswerStats, SimilarProblem } from '@/lib/services/wrong-answers'
import type { ProblemDifficulty } from '@/types/database'

// UI 텍스트 상수
const UI_TEXT = {
  pageTitle: '오답노트',
  pageSubtitle: '틀린 문제들을 다시 풀어보며 실력을 키워보세요',
  totalWrongAnswers: '총 틀린 문제',
  notReviewed: '복습 안함',
  reviewed: '복습 완료',
  resolved: '해결 완료',
  allSubjects: '전체 과목',
  filterBySubject: '과목별',
  filterByDate: '날짜별',
  filterByStatus: '상태별',
  filterByDifficulty: '난이도별',
  retryAll: '전체 다시 풀기',
  retrySelected: '선택 다시 풀기',
  problemCount: '문제',
  searchPlaceholder: '문제 검색...',
  sortBy: '정렬',
  sortByDate: '날짜순',
  sortBySubject: '과목순',
  sortByDifficulty: '난이도순',
  noResults: '해당하는 오답이 없습니다.',
  loading: '불러오는 중...',
  error: '오류가 발생했습니다.',
  retry: '다시 시도',
  selectAll: '전체 선택',
  dateFrom: '시작일',
  dateTo: '종료일',
  applyFilter: '적용',
  resetFilter: '초기화',
  difficulty: {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
  },
  page: '페이지',
  of: '/',
  aiAnalysis: 'AI 분석',
  analyzeWrongAnswers: '오답 분석하기',
  analyzingInProgress: '분석 중...',
  analysisPeriod: '분석 기간',
  analysisSubject: '분석 과목',
  dailyLimitInfo: '일일 분석 가능 횟수',
  remainingAnalysis: '남은 횟수',
  analysisResult: '분석 결과',
  weakPoints: '취약 영역',
  conceptGaps: '부족한 개념',
  studyRecommendations: '학습 추천',
  closeModal: '닫기',
}

// 과목 목록
const SUBJECTS = ['수학', '영어', '국어', '과학', '사회', '역사']

// 과목별 색상
const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  수학: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  영어: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  국어: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  과학: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  사회: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  역사: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
}

// Mock 학생 ID (실제로는 세션에서 가져옴)
const MOCK_STUDENT_ID = 'student-001'

export default function WrongAnswersPage() {
  // 데이터 상태
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([])
  const [stats, setStats] = useState<WrongAnswerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 필터 상태
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_reviewed' | 'reviewed' | 'resolved'>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<ProblemDifficulty | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // 정렬 상태
  const [sortBy, setSortBy] = useState<'wrong_date' | 'subject' | 'difficulty'>('wrong_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // 선택 상태
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // 필터 패널 표시
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // AI 분석 상태
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [analysisSubject, setAnalysisSubject] = useState<string>('all')
  const [analysisDateFrom, setAnalysisDateFrom] = useState('')
  const [analysisDateTo, setAnalysisDateTo] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<{
    summary: string
    weakPoints: Array<{
      area: string
      description: string
      frequency: number
      recommendations: string[]
    }>
    conceptGaps: string[]
    studyRecommendations: string[]
    encouragement: string
  } | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // 일일 분석 횟수 (localStorage에서 관리)
  const [dailyAnalysisCount, setDailyAnalysisCount] = useState(0)
  const MAX_DAILY_ANALYSIS = 3

  // 일일 분석 횟수 로드
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const storedData = localStorage.getItem('analysisCount')
    if (storedData) {
      const { date, count } = JSON.parse(storedData)
      if (date === today) {
        setDailyAnalysisCount(count)
      } else {
        // 날짜가 바뀌면 리셋
        localStorage.setItem('analysisCount', JSON.stringify({ date: today, count: 0 }))
        setDailyAnalysisCount(0)
      }
    }
  }, [])

  // 데이터 로드
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 통계 조회
      const statsResponse = await fetch(`/api/wrong-answers?studentId=${MOCK_STUDENT_ID}&stats=true`)
      const statsData = await statsResponse.json()
      if (statsData.success) {
        setStats(statsData.data)
      }

      // 오답 목록 조회
      const params = new URLSearchParams({
        studentId: MOCK_STUDENT_ID,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortDirection,
      })

      if (subjectFilter !== 'all') params.append('subject', subjectFilter)
      if (statusFilter === 'not_reviewed') params.append('reviewed', 'false')
      if (statusFilter === 'reviewed') params.append('reviewed', 'true')
      if (statusFilter === 'resolved') params.append('resolved', 'true')
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter)
      if (searchQuery) params.append('search', searchQuery)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await fetch(`/api/wrong-answers?${params}`)
      const data = await response.json()

      if (data.success) {
        setWrongAnswers(data.data.items)
        setTotalPages(data.data.pagination.totalPages)
        setTotalItems(data.data.pagination.total)
      } else {
        setError(data.error || '데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, subjectFilter, statusFilter, difficultyFilter, searchQuery, dateFrom, dateTo, sortBy, sortDirection])

  // 초기 로드 및 필터 변경 시 데이터 로드
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1)
  }, [subjectFilter, statusFilter, difficultyFilter, searchQuery, dateFrom, dateTo])

  // 선택 토글
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  // 전체 선택
  const selectAll = useCallback(() => {
    if (selectedIds.length === wrongAnswers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(wrongAnswers.map((w) => w.id))
    }
  }, [selectedIds.length, wrongAnswers])

  // 복습 완료 처리
  const handleMarkAsReviewed = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/wrong-answers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'review' }),
      })
      const data = await response.json()
      if (data.success) {
        fetchData()
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      throw err
    }
  }, [fetchData])

  // 해결 완료 처리
  const handleMarkAsResolved = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/wrong-answers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'resolve' }),
      })
      const data = await response.json()
      if (data.success) {
        fetchData()
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      throw err
    }
  }, [fetchData])

  // 다시 풀기
  const handleRetry = useCallback((wrongAnswer: WrongAnswer) => {
    // 재시도 횟수 증가
    fetch('/api/wrong-answers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: wrongAnswer.id, action: 'retry' }),
    })

    // TODO: 다시 풀기 모달/페이지로 이동
    alert(`"${wrongAnswer.question}" 문제를 다시 풀어보세요!`)
  }, [])

  // 유사 문제 생성
  const handleGenerateSimilar = useCallback(async (problemId: string): Promise<SimilarProblem | null> => {
    try {
      const response = await fetch('/api/wrong-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-similar', problemId }),
      })
      const data = await response.json()
      if (data.success) {
        return data.data as SimilarProblem
      }
      return null
    } catch {
      return null
    }
  }, [])

  // AI 해설 생성
  const handleGenerateExplanation = useCallback(async (problemId: string): Promise<{ explanation: string; relatedConcept: string } | null> => {
    try {
      const response = await fetch('/api/wrong-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-explanation', problemId }),
      })
      const data = await response.json()
      if (data.success) {
        return data.data
      }
      return null
    } catch {
      return null
    }
  }, [])

  // 선택된 문제 다시 풀기
  const handleRetrySelected = useCallback(() => {
    if (selectedIds.length === 0) return
    const selectedProblems = wrongAnswers.filter((w) => selectedIds.includes(w.id))
    alert(`${selectedProblems.length}개의 문제를 다시 풀어보세요!`)
    // TODO: 다시 풀기 페이지로 이동
  }, [selectedIds, wrongAnswers])

  // 전체 다시 풀기
  const handleRetryAll = useCallback(() => {
    alert(`${totalItems}개의 문제를 다시 풀어보세요!`)
    // TODO: 다시 풀기 페이지로 이동
  }, [totalItems])

  // AI 분석 실행
  const handleAnalyze = useCallback(async () => {
    if (dailyAnalysisCount >= MAX_DAILY_ANALYSIS) {
      setAnalysisError('일일 분석 횟수를 초과했습니다. (하루 3회 제한)')
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisResult(null)

    try {
      const response = await fetch('/api/wrong-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-analyze-count': dailyAnalysisCount.toString(),
        },
        body: JSON.stringify({
          action: 'analyze',
          studentId: MOCK_STUDENT_ID,
          subject: analysisSubject,
          dateFrom: analysisDateFrom,
          dateTo: analysisDateTo,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAnalysisResult(data.data.analysis)
        // 분석 횟수 증가
        const newCount = dailyAnalysisCount + 1
        setDailyAnalysisCount(newCount)
        const today = new Date().toISOString().split('T')[0]
        localStorage.setItem('analysisCount', JSON.stringify({ date: today, count: newCount }))
      } else {
        setAnalysisError(data.error || '분석에 실패했습니다.')
      }
    } catch (err) {
      setAnalysisError('서버 연결에 실패했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [dailyAnalysisCount, analysisSubject, analysisDateFrom, analysisDateTo])

  // 분석 모달 닫기
  const closeAnalysisModal = useCallback(() => {
    setShowAnalysisModal(false)
    setAnalysisResult(null)
    setAnalysisError(null)
    setAnalysisSubject('all')
    setAnalysisDateFrom('')
    setAnalysisDateTo('')
  }, [])

  // 정렬 토글
  const toggleSort = useCallback((field: 'wrong_date' | 'subject' | 'difficulty') => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDirection('desc')
    }
  }, [sortBy])

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setSubjectFilter('all')
    setStatusFilter('all')
    setDifficultyFilter('all')
    setSearchQuery('')
    setDateFrom('')
    setDateTo('')
    setSortBy('wrong_date')
    setSortDirection('desc')
  }, [])

  return (
    <div className="p-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookX className="w-7 h-7 text-red-500" />
          {UI_TEXT.pageTitle}
        </h1>
        <p className="text-gray-500 mt-1">{UI_TEXT.pageSubtitle}</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{UI_TEXT.totalWrongAnswers}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {stats?.total ?? 0}
                <span className="text-lg text-gray-400 ml-1">{UI_TEXT.problemCount}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <BookX className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{UI_TEXT.notReviewed}</p>
              <p className="text-3xl font-bold text-orange-500 mt-1">
                {stats?.notReviewed ?? 0}
                <span className="text-lg text-gray-400 ml-1">{UI_TEXT.problemCount}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{UI_TEXT.reviewed}</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats?.reviewed ?? 0}
                <span className="text-lg text-gray-400 ml-1">{UI_TEXT.problemCount}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{UI_TEXT.resolved}</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats?.resolved ?? 0}
                <span className="text-lg text-gray-400 ml-1">{UI_TEXT.problemCount}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 과목별 통계 */}
      {stats && Object.keys(stats.bySubject).length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">{UI_TEXT.filterBySubject}</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.bySubject).map(([subject, count]) => {
              const colors = SUBJECT_COLORS[subject] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' }
              return (
                <button
                  key={subject}
                  onClick={() => setSubjectFilter(subject)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    subjectFilter === subject
                      ? `${colors.bg} ${colors.text} border-2 ${colors.border}`
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  {subject} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 검색 */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={UI_TEXT.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 기본 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />

            {/* 과목 필터 */}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{UI_TEXT.allSubjects}</option>
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            {/* 상태 필터 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 상태</option>
              <option value="not_reviewed">{UI_TEXT.notReviewed}</option>
              <option value="reviewed">{UI_TEXT.reviewed}</option>
              <option value="resolved">{UI_TEXT.resolved}</option>
            </select>

            {/* 난이도 필터 */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as ProblemDifficulty | 'all')}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 난이도</option>
              <option value="easy">{UI_TEXT.difficulty.easy}</option>
              <option value="medium">{UI_TEXT.difficulty.medium}</option>
              <option value="hard">{UI_TEXT.difficulty.hard}</option>
            </select>

            {/* 고급 필터 토글 */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                showAdvancedFilters
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4 inline-block mr-1" />
              {UI_TEXT.filterByDate}
            </button>
          </div>

          {/* 정렬 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSort('wrong_date')}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                sortBy === 'wrong_date'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sortBy === 'wrong_date' && sortDirection === 'asc' ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
              {UI_TEXT.sortByDate}
            </button>
            <button
              onClick={() => toggleSort('difficulty')}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                sortBy === 'difficulty'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sortBy === 'difficulty' && sortDirection === 'asc' ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
              {UI_TEXT.sortByDifficulty}
            </button>
          </div>
        </div>

        {/* 날짜 필터 (고급) */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{UI_TEXT.dateFrom}:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{UI_TEXT.dateTo}:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
            >
              {UI_TEXT.resetFilter}
            </button>
          </div>
        )}
      </div>

      {/* 액션 버튼 & 선택 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length === wrongAnswers.length && wrongAnswers.length > 0}
              onChange={selectAll}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              {UI_TEXT.selectAll} ({wrongAnswers.length}개)
            </span>
          </label>

          {selectedIds.length > 0 && (
            <span className="text-sm text-blue-600 font-medium">
              {selectedIds.length}개 선택됨
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* AI 분석 버튼 */}
          <button
            onClick={() => setShowAnalysisModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            <Brain className="w-4 h-4" />
            {UI_TEXT.aiAnalysis}
            <span className="text-xs bg-purple-500 px-2 py-0.5 rounded-full">
              {MAX_DAILY_ANALYSIS - dailyAnalysisCount}/{MAX_DAILY_ANALYSIS}
            </span>
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={handleRetrySelected}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {UI_TEXT.retrySelected} ({selectedIds.length})
            </button>
          )}
          <button
            onClick={handleRetryAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
          >
            <Play className="w-4 h-4" />
            {UI_TEXT.retryAll}
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 text-red-600 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="ml-auto px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
          >
            {UI_TEXT.retry}
          </button>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 로딩 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500">{UI_TEXT.loading}</p>
        </div>
      ) : wrongAnswers.length === 0 ? (
        /* 결과 없음 */
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookX className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">{UI_TEXT.noResults}</p>
          {(subjectFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              {UI_TEXT.resetFilter}
            </button>
          )}
        </div>
      ) : (
        /* 문제 목록 */
        <div className="space-y-4">
          {wrongAnswers.map((wrongAnswer) => (
            <WrongAnswerCard
              key={wrongAnswer.id}
              wrongAnswer={wrongAnswer}
              isSelected={selectedIds.includes(wrongAnswer.id)}
              onSelect={toggleSelect}
              onMarkAsReviewed={handleMarkAsReviewed}
              onMarkAsResolved={handleMarkAsResolved}
              onRetry={handleRetry}
              onGenerateSimilar={handleGenerateSimilar}
              onGenerateExplanation={handleGenerateExplanation}
            />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <span className="ml-4 text-sm text-gray-500">
            {UI_TEXT.page} {currentPage} {UI_TEXT.of} {totalPages}
          </span>
        </div>
      )}

      {/* AI 분석 모달 */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{UI_TEXT.aiAnalysis}</h3>
                  <p className="text-sm text-gray-500">
                    {UI_TEXT.remainingAnalysis}: {MAX_DAILY_ANALYSIS - dailyAnalysisCount}회
                  </p>
                </div>
              </div>
              <button
                onClick={closeAnalysisModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* 분석 결과가 없을 때: 옵션 선택 */}
              {!analysisResult && (
                <div className="space-y-6">
                  {/* 과목 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {UI_TEXT.analysisSubject}
                    </label>
                    <select
                      value={analysisSubject}
                      onChange={(e) => setAnalysisSubject(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">{UI_TEXT.allSubjects}</option>
                      {SUBJECTS.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 기간 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {UI_TEXT.analysisPeriod}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{UI_TEXT.dateFrom}</label>
                        <input
                          type="date"
                          value={analysisDateFrom}
                          onChange={(e) => setAnalysisDateFrom(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{UI_TEXT.dateTo}</label>
                        <input
                          type="date"
                          value={analysisDateTo}
                          onChange={(e) => setAnalysisDateTo(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      * 기간을 선택하지 않으면 전체 기간을 분석합니다.
                    </p>
                  </div>

                  {/* 에러 메시지 */}
                  {analysisError && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{analysisError}</span>
                    </div>
                  )}

                  {/* 분석 버튼 */}
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || dailyAnalysisCount >= MAX_DAILY_ANALYSIS}
                    className="w-full py-4 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {UI_TEXT.analyzingInProgress}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {UI_TEXT.analyzeWrongAnswers}
                      </>
                    )}
                  </button>

                  {dailyAnalysisCount >= MAX_DAILY_ANALYSIS && (
                    <p className="text-center text-sm text-orange-500">
                      오늘의 분석 횟수를 모두 사용했습니다. 내일 다시 시도해주세요.
                    </p>
                  )}
                </div>
              )}

              {/* 분석 결과 표시 */}
              {analysisResult && (
                <div className="space-y-6">
                  {/* 요약 */}
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <p className="text-purple-800 leading-relaxed">{analysisResult.summary}</p>
                  </div>

                  {/* 취약 영역 */}
                  {analysisResult.weakPoints && analysisResult.weakPoints.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-red-500" />
                        {UI_TEXT.weakPoints}
                      </h4>
                      <div className="space-y-3">
                        {analysisResult.weakPoints.map((wp, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-white border border-gray-200 rounded-xl"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{wp.area}</span>
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                오답 {wp.frequency}회
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{wp.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {wp.recommendations.map((rec, recIdx) => (
                                <span
                                  key={recIdx}
                                  className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full"
                                >
                                  💡 {rec}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 부족한 개념 */}
                  {analysisResult.conceptGaps && analysisResult.conceptGaps.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        {UI_TEXT.conceptGaps}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.conceptGaps.map((concept, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-yellow-50 text-yellow-800 rounded-xl text-sm"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 학습 추천 */}
                  {analysisResult.studyRecommendations && analysisResult.studyRecommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-500" />
                        {UI_TEXT.studyRecommendations}
                      </h4>
                      <ul className="space-y-2">
                        {analysisResult.studyRecommendations.map((rec, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-gray-700"
                          >
                            <span className="text-green-500 mt-1">✓</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 격려 메시지 */}
                  {analysisResult.encouragement && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Heart className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-700 leading-relaxed">{analysisResult.encouragement}</p>
                      </div>
                    </div>
                  )}

                  {/* 다시 분석 버튼 */}
                  <div className="flex gap-3">
                    <button
                      onClick={closeAnalysisModal}
                      className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      {UI_TEXT.closeModal}
                    </button>
                    <button
                      onClick={() => {
                        setAnalysisResult(null)
                        setAnalysisError(null)
                      }}
                      disabled={dailyAnalysisCount >= MAX_DAILY_ANALYSIS}
                      className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      다시 분석하기 ({MAX_DAILY_ANALYSIS - dailyAnalysisCount}회 남음)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
