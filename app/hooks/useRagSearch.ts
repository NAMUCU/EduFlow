/**
 * RAG 기출/교과서 검색을 위한 SWR 훅
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 검색 결과 캐싱 및 요청 중복 제거
 * - rerender-transitions: 검색 중 startTransition 사용으로 UI 응답성 유지
 */

import useSWR from 'swr'
import {
  useState,
  useCallback,
  useTransition,
  useMemo,
  useEffect,
} from 'react'
import type { SearchFilter, SearchResultItem, SearchResponse } from '@/types/rag'
import type { SearchHistoryItem } from '@/types/search'
import {
  SEARCH_PAGE_SIZE,
  MAX_SEARCH_HISTORY,
  SEARCH_DEBOUNCE_MS,
} from '@/types/search'

// ============================================
// 타입 정의
// ============================================

interface SearchParams {
  query: string
  filter: SearchFilter
  limit?: number
  offset?: number
}

interface UseRagSearchReturn {
  // 검색 상태
  query: string
  setQuery: (query: string) => void
  filters: SearchFilter
  setFilters: (filters: SearchFilter) => void

  // 검색 결과
  results: SearchResultItem[]
  total: number
  isSearching: boolean
  isPending: boolean
  error: Error | null

  // 페이지네이션
  page: number
  setPage: (page: number) => void
  hasMore: boolean
  loadMore: () => void

  // 검색 실행
  search: (newQuery?: string, newFilters?: SearchFilter) => void
  clearSearch: () => void

  // 검색 히스토리
  searchHistory: SearchHistoryItem[]
  clearHistory: () => void
  applyHistoryItem: (item: SearchHistoryItem) => void

  // 선택된 결과 (문제지 추가용)
  selectedIds: Set<string>
  toggleSelect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  selectedResults: SearchResultItem[]
}

// ============================================
// Fetcher 함수
// ============================================

const searchFetcher = async (url: string): Promise<SearchResponse & { success: boolean }> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || '검색 중 오류가 발생했습니다.')
  }

  return response.json()
}

// POST 검색 fetcher (복합 필터용)
const postSearchFetcher = async ([url, params]: [string, SearchParams]): Promise<SearchResponse & { success: boolean }> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || '검색 중 오류가 발생했습니다.')
  }

  return response.json()
}

// ============================================
// URL 빌더
// ============================================

function buildSearchUrl(query: string, filter: SearchFilter, page: number): string | null {
  if (!query.trim()) return null

  const params = new URLSearchParams()
  params.append('q', query.trim())
  params.append('limit', String(SEARCH_PAGE_SIZE))
  params.append('offset', String(page * SEARCH_PAGE_SIZE))

  if (filter.subject) params.append('subject', filter.subject)
  if (filter.grade) params.append('grade', filter.grade)
  if (filter.type) params.append('type', filter.type)
  if (filter.unit) params.append('unit', filter.unit)

  return `/api/search?${params.toString()}`
}

// ============================================
// 로컬 스토리지 키
// ============================================

const HISTORY_STORAGE_KEY = 'eduflow_search_history'

// ============================================
// 메인 훅
// ============================================

export function useRagSearch(): UseRagSearchReturn {
  // 상태 관리
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilter>({})
  const [page, setPage] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])

  // Vercel Best Practice: rerender-transitions
  // startTransition을 사용해 검색 결과 렌더링이 UI를 블로킹하지 않도록 함
  const [isPending, startTransition] = useTransition()

  // 검색 URL 생성
  const searchUrl = useMemo(
    () => buildSearchUrl(query, filters, page),
    [query, filters, page]
  )

  // Vercel Best Practice: client-swr-dedup
  // SWR로 검색 결과 캐싱 및 요청 중복 제거
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(
    searchUrl,
    searchFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: SEARCH_DEBOUNCE_MS,
      keepPreviousData: true,
      onSuccess: (responseData) => {
        // 검색 성공 시 히스토리에 추가
        if (query.trim() && responseData.total > 0) {
          addToHistory({
            id: `${Date.now()}`,
            query: query.trim(),
            filters,
            resultCount: responseData.total,
            timestamp: new Date().toISOString(),
          })
        }
      },
    }
  )

  // 로컬 스토리지에서 히스토리 로드
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (stored) {
        setSearchHistory(JSON.parse(stored))
      }
    } catch {
      // 로컬 스토리지 접근 실패 시 무시
    }
  }, [])

  // 히스토리 저장 함수
  const saveHistory = useCallback((history: SearchHistoryItem[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
    } catch {
      // 로컬 스토리지 저장 실패 시 무시
    }
  }, [])

  // 히스토리에 추가
  const addToHistory = useCallback((item: SearchHistoryItem) => {
    setSearchHistory((prev) => {
      // 중복 제거 (같은 쿼리 + 필터 조합)
      const filtered = prev.filter(
        (h) =>
          h.query !== item.query ||
          JSON.stringify(h.filters) !== JSON.stringify(item.filters)
      )

      // 최신 항목을 앞에 추가하고 최대 개수 제한
      const newHistory = [item, ...filtered].slice(0, MAX_SEARCH_HISTORY)
      saveHistory(newHistory)
      return newHistory
    })
  }, [saveHistory])

  // 히스토리 전체 삭제
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    saveHistory([])
  }, [saveHistory])

  // 히스토리 항목 적용
  const applyHistoryItem = useCallback((item: SearchHistoryItem) => {
    startTransition(() => {
      setQuery(item.query)
      setFilters(item.filters)
      setPage(0)
    })
  }, [])

  // 검색 실행
  const search = useCallback((newQuery?: string, newFilters?: SearchFilter) => {
    startTransition(() => {
      if (newQuery !== undefined) setQuery(newQuery)
      if (newFilters !== undefined) setFilters(newFilters)
      setPage(0)
      setSelectedIds(new Set())
    })
  }, [])

  // 검색 초기화
  const clearSearch = useCallback(() => {
    startTransition(() => {
      setQuery('')
      setFilters({})
      setPage(0)
      setSelectedIds(new Set())
    })
    mutate(undefined, { revalidate: false })
  }, [mutate])

  // 더 보기
  const loadMore = useCallback(() => {
    startTransition(() => {
      setPage((prev) => prev + 1)
    })
  }, [])

  // 선택 토글
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // 전체 선택
  const selectAll = useCallback(() => {
    if (!data?.results) return
    setSelectedIds(new Set(data.results.map((r) => r.id)))
  }, [data?.results])

  // 선택 해제
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // 선택된 결과 목록
  const selectedResults = useMemo(() => {
    if (!data?.results) return []
    return data.results.filter((r) => selectedIds.has(r.id))
  }, [data?.results, selectedIds])

  // 더 보기 가능 여부
  const hasMore = useMemo(() => {
    if (!data) return false
    return (page + 1) * SEARCH_PAGE_SIZE < data.total
  }, [data, page])

  return {
    // 검색 상태
    query,
    setQuery: (newQuery: string) => {
      startTransition(() => {
        setQuery(newQuery)
        setPage(0)
      })
    },
    filters,
    setFilters: (newFilters: SearchFilter) => {
      startTransition(() => {
        setFilters(newFilters)
        setPage(0)
      })
    },

    // 검색 결과
    results: data?.results ?? [],
    total: data?.total ?? 0,
    isSearching: isLoading || isValidating,
    isPending,
    error: error ?? null,

    // 페이지네이션
    page,
    setPage,
    hasMore,
    loadMore,

    // 검색 실행
    search,
    clearSearch,

    // 검색 히스토리
    searchHistory,
    clearHistory,
    applyHistoryItem,

    // 선택된 결과
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    selectedResults,
  }
}

// ============================================
// 개별 문서 상세 조회 훅
// ============================================

interface UseSearchResultDetailReturn {
  result: SearchResultItem | null
  isLoading: boolean
  error: Error | null
}

export function useSearchResultDetail(id: string | null): UseSearchResultDetailReturn {
  const { data, error, isLoading } = useSWR(
    id ? `/api/search/document/${id}` : null,
    searchFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    result: data?.results?.[0] ?? null,
    isLoading,
    error: error ?? null,
  }
}

// 디폴트 export
export default useRagSearch
