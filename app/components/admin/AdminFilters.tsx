'use client'

/**
 * 슈퍼 어드민용 검색/필터 컴포넌트
 * - 검색 입력 (debounce 적용)
 * - 상태 필터 드롭다운
 * - 기간 선택 (날짜 범위)
 * - 정렬 옵션
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Search,
  Filter,
  Calendar,
  ArrowUpDown,
  X,
  ChevronDown,
  RotateCcw,
} from 'lucide-react'

// 필터 옵션 타입
export interface FilterOption {
  value: string
  label: string
}

// 정렬 옵션 타입
export interface SortOption {
  value: string
  label: string
  direction?: 'asc' | 'desc'
}

// 날짜 범위 타입
export interface DateRange {
  start: string | null
  end: string | null
}

// Props 타입
export interface AdminFiltersProps {
  // 검색 관련
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  searchValue?: string
  debounceMs?: number

  // 상태 필터 관련
  statusOptions?: FilterOption[]
  onStatusChange?: (value: string) => void
  statusValue?: string
  statusLabel?: string

  // 추가 필터 (커스텀)
  extraFilters?: {
    key: string
    label: string
    options: FilterOption[]
    value?: string
    onChange?: (value: string) => void
  }[]

  // 날짜 범위 관련
  showDateRange?: boolean
  onDateRangeChange?: (range: DateRange) => void
  dateRangeValue?: DateRange
  dateRangeLabel?: string

  // 정렬 관련
  sortOptions?: SortOption[]
  onSortChange?: (value: string, direction: 'asc' | 'desc') => void
  sortValue?: string
  sortDirection?: 'asc' | 'desc'

  // 필터 초기화
  onReset?: () => void
  showResetButton?: boolean

  // 스타일
  className?: string
  compact?: boolean
}

// Debounce 훅
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export function AdminFilters({
  // 검색
  searchPlaceholder = '검색어를 입력하세요...',
  onSearchChange,
  searchValue: externalSearchValue,
  debounceMs = 300,

  // 상태 필터
  statusOptions,
  onStatusChange,
  statusValue = 'all',
  statusLabel = '상태',

  // 추가 필터
  extraFilters = [],

  // 날짜 범위
  showDateRange = false,
  onDateRangeChange,
  dateRangeValue,
  dateRangeLabel = '기간',

  // 정렬
  sortOptions,
  onSortChange,
  sortValue,
  sortDirection = 'desc',

  // 초기화
  onReset,
  showResetButton = true,

  // 스타일
  className = '',
  compact = false,
}: AdminFiltersProps) {
  // 내부 검색어 상태
  const [internalSearchValue, setInternalSearchValue] = useState(externalSearchValue || '')

  // 날짜 범위 내부 상태
  const [internalDateRange, setInternalDateRange] = useState<DateRange>(
    dateRangeValue || { start: null, end: null }
  )

  // 정렬 방향 내부 상태
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>(sortDirection)

  // 날짜 선택 드롭다운 상태
  const [showDateDropdown, setShowDateDropdown] = useState(false)
  const dateDropdownRef = useRef<HTMLDivElement>(null)

  // Debounced 검색어
  const debouncedSearchValue = useDebounce(internalSearchValue, debounceMs)

  // 외부 검색어 동기화
  useEffect(() => {
    if (externalSearchValue !== undefined) {
      setInternalSearchValue(externalSearchValue)
    }
  }, [externalSearchValue])

  // 외부 날짜 범위 동기화
  useEffect(() => {
    if (dateRangeValue) {
      setInternalDateRange(dateRangeValue)
    }
  }, [dateRangeValue])

  // Debounced 검색어 변경 시 콜백
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearchValue)
    }
  }, [debouncedSearchValue, onSearchChange])

  // 검색어 입력 핸들러
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalSearchValue(e.target.value)
  }, [])

  // 검색어 초기화
  const handleClearSearch = useCallback(() => {
    setInternalSearchValue('')
    if (onSearchChange) {
      onSearchChange('')
    }
  }, [onSearchChange])

  // 날짜 범위 변경 핸들러
  const handleDateRangeChange = useCallback((type: 'start' | 'end', value: string) => {
    const newRange = {
      ...internalDateRange,
      [type]: value || null,
    }
    setInternalDateRange(newRange)
    if (onDateRangeChange) {
      onDateRangeChange(newRange)
    }
  }, [internalDateRange, onDateRangeChange])

  // 날짜 범위 초기화
  const handleClearDateRange = useCallback(() => {
    const emptyRange = { start: null, end: null }
    setInternalDateRange(emptyRange)
    if (onDateRangeChange) {
      onDateRangeChange(emptyRange)
    }
    setShowDateDropdown(false)
  }, [onDateRangeChange])

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((value: string) => {
    if (onSortChange) {
      // 같은 정렬 필드 선택 시 방향 전환
      if (sortValue === value) {
        const newDirection = internalSortDirection === 'asc' ? 'desc' : 'asc'
        setInternalSortDirection(newDirection)
        onSortChange(value, newDirection)
      } else {
        setInternalSortDirection('desc')
        onSortChange(value, 'desc')
      }
    }
  }, [sortValue, internalSortDirection, onSortChange])

  // 전체 필터 초기화
  const handleReset = useCallback(() => {
    setInternalSearchValue('')
    setInternalDateRange({ start: null, end: null })
    setInternalSortDirection('desc')
    if (onReset) {
      onReset()
    }
  }, [onReset])

  // 날짜 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 활성 필터 개수 계산
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (internalSearchValue) count++
    if (statusValue && statusValue !== 'all') count++
    if (internalDateRange.start || internalDateRange.end) count++
    extraFilters.forEach(filter => {
      if (filter.value && filter.value !== 'all') count++
    })
    return count
  }, [internalSearchValue, statusValue, internalDateRange, extraFilters])

  // 날짜 범위 표시 문자열
  const dateRangeDisplay = useMemo(() => {
    if (!internalDateRange.start && !internalDateRange.end) {
      return dateRangeLabel
    }
    const start = internalDateRange.start || '시작일'
    const end = internalDateRange.end || '종료일'
    return `${start} ~ ${end}`
  }, [internalDateRange, dateRangeLabel])

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      <div className={`flex flex-wrap items-center gap-3 ${compact ? 'p-3' : 'p-4'}`}>
        {/* 검색 입력 */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={internalSearchValue}
            onChange={handleSearchInput}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
          />
          {internalSearchValue && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="검색어 지우기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 상태 필터 */}
        {statusOptions && statusOptions.length > 0 && (
          <div className="relative">
            <select
              value={statusValue}
              onChange={(e) => onStatusChange?.(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm cursor-pointer min-w-[120px]"
            >
              <option value="all">전체 {statusLabel}</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* 추가 필터들 */}
        {extraFilters.map((filter) => (
          <div key={filter.key} className="relative">
            <select
              value={filter.value || 'all'}
              onChange={(e) => filter.onChange?.(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm cursor-pointer min-w-[120px]"
            >
              <option value="all">전체 {filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        ))}

        {/* 날짜 범위 선택 */}
        {showDateRange && (
          <div className="relative" ref={dateDropdownRef}>
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg transition-all text-sm ${
                internalDateRange.start || internalDateRange.end
                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="whitespace-nowrap">{dateRangeDisplay}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* 날짜 선택 드롭다운 */}
            {showDateDropdown && (
              <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[280px]">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">시작일</label>
                    <input
                      type="date"
                      value={internalDateRange.start || ''}
                      onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">종료일</label>
                    <input
                      type="date"
                      value={internalDateRange.end || ''}
                      onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={handleClearDateRange}
                      className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      초기화
                    </button>
                    <button
                      onClick={() => setShowDateDropdown(false)}
                      className="flex-1 px-3 py-2 text-sm bg-violet-500 text-white hover:bg-violet-600 rounded-lg transition-colors"
                    >
                      적용
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 정렬 옵션 */}
        {sortOptions && sortOptions.length > 0 && (
          <div className="relative">
            <select
              value={sortValue || ''}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm cursor-pointer min-w-[140px]"
            >
              <option value="">정렬 선택</option>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* 정렬 방향 토글 */}
        {sortOptions && sortValue && (
          <button
            onClick={() => {
              const newDirection = internalSortDirection === 'asc' ? 'desc' : 'asc'
              setInternalSortDirection(newDirection)
              if (onSortChange && sortValue) {
                onSortChange(sortValue, newDirection)
              }
            }}
            className={`p-2.5 border rounded-lg transition-all ${
              internalSortDirection === 'asc'
                ? 'border-violet-500 bg-violet-50 text-violet-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
            title={internalSortDirection === 'asc' ? '오름차순' : '내림차순'}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        )}

        {/* 필터 초기화 버튼 */}
        {showResetButton && activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            title="필터 초기화"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">초기화</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-violet-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* 활성 필터 태그 (선택사항) */}
      {activeFilterCount > 0 && !compact && (
        <div className="px-4 pb-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">활성 필터:</span>

          {internalSearchValue && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 text-xs rounded-full">
              검색: {internalSearchValue}
              <button onClick={handleClearSearch} className="hover:text-violet-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {statusValue && statusValue !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {statusLabel}: {statusOptions?.find(o => o.value === statusValue)?.label}
              <button onClick={() => onStatusChange?.('all')} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(internalDateRange.start || internalDateRange.end) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              기간: {dateRangeDisplay}
              <button onClick={handleClearDateRange} className="hover:text-green-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {extraFilters.map((filter) =>
            filter.value && filter.value !== 'all' ? (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
              >
                {filter.label}: {filter.options.find(o => o.value === filter.value)?.label}
                <button onClick={() => filter.onChange?.('all')} className="hover:text-orange-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}

export default AdminFilters
