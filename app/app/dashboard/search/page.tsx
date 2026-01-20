'use client'

/**
 * 기출/교과서 검색 페이지
 * PRD F7: RAG 검색 프론트엔드
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 검색 결과 캐싱
 * - rerender-memo: 검색 결과 카드 메모이제이션
 * - bundle-dynamic-imports: 상세 모달 lazy loading
 * - rerender-transitions: 검색 중 startTransition 사용
 */

import React, {
  useState,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from 'react'
import {
  Search,
  Filter,
  X,
  Clock,
  Trash2,
  ChevronDown,
  Loader2,
  FileText,
  CheckSquare,
  Square,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { useRagSearch } from '@/hooks/useRagSearch'
import SearchResultCard, { SearchResultCardSkeleton } from '@/components/SearchResultCard'
import type { SearchResultItem, SearchFilter, DocumentType } from '@/types/rag'
import {
  SUBJECT_OPTIONS,
  GRADE_OPTIONS,
  SOURCE_OPTIONS,
  SEARCH_DEBOUNCE_MS,
} from '@/types/search'

// Vercel Best Practice: bundle-dynamic-imports
// 상세 모달은 필요할 때만 로드
const SearchDetailModal = lazy(() => import('@/components/SearchDetailModal'))

// ============================================
// 페이지 컴포넌트
// ============================================

export default function SearchPage() {
  // RAG 검색 훅
  const {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    total,
    isSearching,
    isPending,
    error,
    page,
    hasMore,
    loadMore,
    search,
    clearSearch,
    searchHistory,
    clearHistory,
    applyHistoryItem,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    selectedResults,
  } = useRagSearch()

  // 로컬 상태
  const [showFilters, setShowFilters] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [detailModalResult, setDetailModalResult] = useState<SearchResultItem | null>(null)
  const [localQuery, setLocalQuery] = useState(query)

  // 디바운스 타이머
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // 검색어 입력 핸들러 (디바운스 적용)
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalQuery(value)

    // 이전 타이머 취소
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // 새 타이머 설정
    const timer = setTimeout(() => {
      setQuery(value)
    }, SEARCH_DEBOUNCE_MS)

    setDebounceTimer(timer)
  }, [setQuery, debounceTimer])

  // 검색 폼 제출
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    search(localQuery, filters)
  }, [localQuery, filters, search, debounceTimer])

  // 필터 변경
  const handleFilterChange = useCallback((key: keyof SearchFilter, value: string) => {
    const newFilters = { ...filters }
    if (value) {
      (newFilters as Record<string, string>)[key] = value
    } else {
      delete (newFilters as Record<string, string>)[key]
    }
    setFilters(newFilters)
  }, [filters, setFilters])

  // 검색 초기화
  const handleClearSearch = useCallback(() => {
    setLocalQuery('')
    clearSearch()
  }, [clearSearch])

  // 상세 보기 모달 열기
  const handleViewDetail = useCallback((result: SearchResultItem) => {
    setDetailModalResult(result)
  }, [])

  // 상세 보기 모달 닫기
  const handleCloseDetail = useCallback(() => {
    setDetailModalResult(null)
  }, [])

  // 문제지에 추가 (TODO: 실제 구현)
  const handleAddToProblemSet = useCallback((result: SearchResultItem) => {
    console.log('문제지에 추가:', result)
    // TODO: 문제지 관리 기능 연동
    alert(`"${result.metadata.subject} - ${result.metadata.grade}" 항목이 문제지에 추가되었습니다.`)
  }, [])

  // 선택된 항목 일괄 추가
  const handleAddSelectedToProblemSet = useCallback(() => {
    if (selectedResults.length === 0) return
    console.log('선택된 항목 문제지에 추가:', selectedResults)
    // TODO: 문제지 관리 기능 연동
    alert(`${selectedResults.length}개 항목이 문제지에 추가되었습니다.`)
    clearSelection()
  }, [selectedResults, clearSelection])

  // 활성 필터 개수
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length
  }, [filters])

  // 검색 결과가 있는지 여부
  const hasResults = results.length > 0
  const hasQuery = localQuery.trim().length > 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">기출/교과서 검색</h1>
        <p className="text-gray-500 mt-1">
          키워드나 단원으로 기출문제, 교과서 내용을 검색하세요
        </p>
      </div>

      {/* 검색 폼 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          {/* 검색 입력 */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={localQuery}
              onChange={handleQueryChange}
              placeholder="검색어를 입력하세요 (예: 이차함수, 삼각비)"
              className="input pl-12 pr-10"
              onFocus={() => setShowHistory(true)}
            />
            {localQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* 필터 토글 버튼 */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${
              activeFilterCount > 0 ? 'bg-primary-50 border-primary-300' : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            필터
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* 검색 버튼 */}
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={isSearching || !hasQuery}
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            검색
          </button>
        </div>

        {/* 필터 패널 */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 과목 필터 */}
              <div>
                <label className="label">과목</label>
                <select
                  value={filters.subject || ''}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                  className="input"
                >
                  {SUBJECT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 학년 필터 */}
              <div>
                <label className="label">학년</label>
                <select
                  value={filters.grade || ''}
                  onChange={(e) => handleFilterChange('grade', e.target.value)}
                  className="input"
                >
                  {GRADE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 출처 필터 */}
              <div>
                <label className="label">출처</label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value as DocumentType)}
                  className="input"
                >
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 필터 초기화 */}
            {activeFilterCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setFilters({})}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  필터 초기화
                </button>
              </div>
            )}
          </div>
        )}
      </form>

      {/* 최근 검색 히스토리 */}
      {showHistory && searchHistory.length > 0 && !hasResults && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              최근 검색
            </h3>
            <button
              onClick={clearHistory}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              전체 삭제
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  applyHistoryItem(item)
                  setLocalQuery(item.query)
                  setShowHistory(false)
                }}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
              >
                {item.query}
                {item.filters.subject && ` (${item.filters.subject})`}
                <span className="text-gray-400 ml-1">({item.resultCount})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 선택된 항목 액션 바 */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 bg-primary-50 rounded-xl border border-primary-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-primary-700">
              {selectedIds.size}개 선택됨
            </span>
            <button
              onClick={clearSelection}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              선택 해제
            </button>
          </div>
          <button
            onClick={handleAddSelectedToProblemSet}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            선택 항목 문제지에 추가
          </button>
        </div>
      )}

      {/* 검색 결과 헤더 */}
      {hasQuery && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">
              검색 결과
              {total > 0 && (
                <span className="font-normal text-gray-500 ml-2">
                  {total.toLocaleString()}개
                </span>
              )}
            </h2>
            {(isSearching || isPending) && (
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
            )}
          </div>

          {hasResults && (
            <div className="flex items-center gap-2">
              <button
                onClick={selectedIds.size === results.length ? clearSelection : selectAll}
                className="btn-ghost text-sm flex items-center gap-1"
              >
                {selectedIds.size === results.length ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    전체 해제
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    전체 선택
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-700">검색 중 오류가 발생했습니다</p>
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        </div>
      )}

      {/* 검색 결과 목록 */}
      {isSearching && !hasResults ? (
        // 로딩 스켈레톤
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SearchResultCardSkeleton key={i} />
          ))}
        </div>
      ) : hasResults ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((result) => (
            <SearchResultCard
              key={result.id}
              result={result}
              isSelected={selectedIds.has(result.id)}
              onSelect={toggleSelect}
              onViewDetail={handleViewDetail}
              onAddToProblemSet={handleAddToProblemSet}
            />
          ))}
        </div>
      ) : hasQuery && !isSearching ? (
        // 검색 결과 없음
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            검색 결과가 없습니다
          </h3>
          <p className="text-gray-500 mb-4">
            다른 검색어나 필터를 사용해보세요
          </p>
          <button onClick={handleClearSearch} className="btn-secondary">
            검색 초기화
          </button>
        </div>
      ) : (
        // 초기 상태
        <div className="text-center py-16">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            검색어를 입력하세요
          </h3>
          <p className="text-gray-500">
            기출문제, 교과서, 모의고사 등에서 원하는 내용을 찾아보세요
          </p>
        </div>
      )}

      {/* 더 보기 버튼 */}
      {hasMore && hasResults && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={isSearching}
            className="btn-secondary"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                로딩 중...
              </>
            ) : (
              '더 보기'
            )}
          </button>
        </div>
      )}

      {/* 상세 보기 모달 */}
      <Suspense fallback={null}>
        <SearchDetailModal
          result={detailModalResult}
          isOpen={!!detailModalResult}
          onClose={handleCloseDetail}
          onAddToProblemSet={handleAddToProblemSet}
          isSelected={detailModalResult ? selectedIds.has(detailModalResult.id) : false}
          onToggleSelect={toggleSelect}
        />
      </Suspense>
    </div>
  )
}
