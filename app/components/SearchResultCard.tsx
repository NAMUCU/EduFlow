'use client'

/**
 * 검색 결과 카드 컴포넌트
 *
 * Vercel Best Practice: rerender-memo
 * - React.memo로 불필요한 리렌더링 방지
 * - 검색 결과 목록에서 개별 카드가 변경될 때만 리렌더링
 */

import React, { memo, useCallback } from 'react'
import {
  FileText,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Calendar,
  Tag,
  Check,
  Eye,
  Plus,
} from 'lucide-react'
import type { SearchResultItem, DocumentType } from '@/types/rag'
import { DOCUMENT_TYPE_LABELS } from '@/types/rag'

// ============================================
// 타입 정의
// ============================================

interface SearchResultCardProps {
  result: SearchResultItem
  isSelected: boolean
  onSelect: (id: string) => void
  onViewDetail: (result: SearchResultItem) => void
  onAddToProblemSet?: (result: SearchResultItem) => void
}

// ============================================
// 유틸리티 함수
// ============================================

/** 문서 유형에 따른 아이콘 반환 */
function getDocumentIcon(type: DocumentType) {
  switch (type) {
    case 'exam':
      return FileText
    case 'textbook':
      return BookOpen
    case 'mockexam':
      return GraduationCap
    case 'workbook':
      return ClipboardList
    default:
      return FileText
  }
}

/** 문서 유형에 따른 배지 색상 반환 */
function getTypeBadgeColor(type: DocumentType): string {
  switch (type) {
    case 'exam':
      return 'bg-blue-100 text-blue-700'
    case 'textbook':
      return 'bg-green-100 text-green-700'
    case 'mockexam':
      return 'bg-purple-100 text-purple-700'
    case 'workbook':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

/** 관련도 점수를 퍼센트로 변환 */
function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`
}

/** 텍스트 요약 (최대 길이 제한) */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// ============================================
// 메인 컴포넌트
// ============================================

const SearchResultCard = memo(function SearchResultCard({
  result,
  isSelected,
  onSelect,
  onViewDetail,
  onAddToProblemSet,
}: SearchResultCardProps) {
  const { id, score, content, metadata, highlight } = result
  const { type, subject, grade, year, unit, publisher } = metadata

  const Icon = getDocumentIcon(type)
  const typeBadgeColor = getTypeBadgeColor(type)
  const typeLabel = DOCUMENT_TYPE_LABELS[type] || type

  // 선택 토글 핸들러
  const handleSelect = useCallback(() => {
    onSelect(id)
  }, [id, onSelect])

  // 상세 보기 핸들러
  const handleViewDetail = useCallback(() => {
    onViewDetail(result)
  }, [result, onViewDetail])

  // 문제지에 추가 핸들러
  const handleAddToProblemSet = useCallback(() => {
    if (onAddToProblemSet) {
      onAddToProblemSet(result)
    }
  }, [result, onAddToProblemSet])

  // 표시할 내용 (하이라이트가 있으면 하이라이트 사용)
  const displayContent = highlight || content

  return (
    <div
      className={`search-result-card card hover:shadow-md transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
      }`}
      onClick={handleViewDetail}
    >
      {/* 상단 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* 선택 체크박스 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSelect()
            }}
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'border-gray-300 hover:border-primary-400'
            }`}
            aria-label={isSelected ? '선택 해제' : '선택'}
          >
            {isSelected ? <Check className="w-4 h-4" /> : null}
          </button>

          {/* 문서 유형 아이콘 */}
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>

          {/* 제목 및 유형 배지 */}
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadgeColor}`}>
                {typeLabel}
              </span>
              {year && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {year}년
                </span>
              )}
            </div>
            <h3 className="font-medium text-gray-900 mt-1">
              {subject} - {grade}
              {unit && ` / ${unit}`}
            </h3>
          </div>
        </div>

        {/* 관련도 점수 */}
        <div className="text-right">
          <div className="text-xs text-gray-500">관련도</div>
          <div className="text-lg font-bold text-primary-600">{formatScore(score)}</div>
        </div>
      </div>

      {/* 내용 미리보기 */}
      <div className="mb-4">
        <p
          className="text-sm text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: truncateText(displayContent, 200),
          }}
        />
      </div>

      {/* 메타데이터 태그 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {publisher && (
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {publisher}
          </span>
        )}
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
          {subject}
        </span>
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
          {grade}
        </span>
      </div>

      {/* 하단 액션 버튼 */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleViewDetail()
          }}
          className="btn-ghost text-sm flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          상세 보기
        </button>
        {onAddToProblemSet && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAddToProblemSet()
            }}
            className="btn-primary text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            문제지에 추가
          </button>
        )}
      </div>
    </div>
  )
})

// ============================================
// 스켈레톤 로딩 컴포넌트
// ============================================

export const SearchResultCardSkeleton = memo(function SearchResultCardSkeleton() {
  return (
    <div className="card animate-pulse">
      {/* 상단 헤더 스켈레톤 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-gray-200" />
          <div className="w-10 h-10 rounded-lg bg-gray-200" />
          <div>
            <div className="h-5 w-20 bg-gray-200 rounded mb-1" />
            <div className="h-5 w-40 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="text-right">
          <div className="h-4 w-12 bg-gray-200 rounded mb-1" />
          <div className="h-6 w-16 bg-gray-200 rounded" />
        </div>
      </div>

      {/* 내용 스켈레톤 */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>

      {/* 태그 스켈레톤 */}
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-gray-200 rounded" />
        <div className="h-6 w-12 bg-gray-200 rounded" />
        <div className="h-6 w-14 bg-gray-200 rounded" />
      </div>

      {/* 하단 버튼 스켈레톤 */}
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
        <div className="h-8 w-24 bg-gray-200 rounded" />
        <div className="h-8 w-28 bg-gray-200 rounded" />
      </div>
    </div>
  )
})

export default SearchResultCard
