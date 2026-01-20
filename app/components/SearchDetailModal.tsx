'use client'

/**
 * 검색 결과 상세 보기 모달
 *
 * Vercel Best Practice: bundle-dynamic-imports
 * - 이 컴포넌트는 동적으로 import되어 초기 번들 크기를 줄임
 * - 모달이 열릴 때만 로드됨
 */

import React, { useEffect, useCallback } from 'react'
import {
  X,
  FileText,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Calendar,
  Tag,
  MapPin,
  Building2,
  Copy,
  Plus,
  Download,
  Check,
} from 'lucide-react'
import type { SearchResultItem, DocumentType } from '@/types/rag'
import { DOCUMENT_TYPE_LABELS } from '@/types/rag'

// ============================================
// 타입 정의
// ============================================

interface SearchDetailModalProps {
  result: SearchResultItem | null
  isOpen: boolean
  onClose: () => void
  onAddToProblemSet?: (result: SearchResultItem) => void
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
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

// ============================================
// 메인 컴포넌트
// ============================================

export default function SearchDetailModal({
  result,
  isOpen,
  onClose,
  onAddToProblemSet,
  isSelected = false,
  onToggleSelect,
}: SearchDetailModalProps) {
  const [copied, setCopied] = React.useState(false)

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // 모달 열릴 때 스크롤 방지
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // 내용 복사
  const handleCopyContent = useCallback(async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('클립보드 복사 실패')
    }
  }, [result])

  // 문제지에 추가
  const handleAddToProblemSet = useCallback(() => {
    if (result && onAddToProblemSet) {
      onAddToProblemSet(result)
    }
  }, [result, onAddToProblemSet])

  // 선택 토글
  const handleToggleSelect = useCallback(() => {
    if (result && onToggleSelect) {
      onToggleSelect(result.id)
    }
  }, [result, onToggleSelect])

  if (!isOpen || !result) return null

  const { id, score, content, metadata, highlight } = result
  const { type, subject, grade, year, unit, publisher, filename } = metadata

  const Icon = getDocumentIcon(type)
  const typeBadgeColor = getTypeBadgeColor(type)
  const typeLabel = DOCUMENT_TYPE_LABELS[type] || type

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden m-4">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between z-10">
          <div className="flex items-center gap-4">
            {/* 아이콘 */}
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary-600" />
            </div>

            <div>
              {/* 배지들 */}
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadgeColor}`}>
                  {typeLabel}
                </span>
                {year && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {year}년
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
                  관련도 {formatScore(score)}
                </span>
              </div>

              {/* 제목 */}
              <h2 className="text-xl font-bold text-gray-900">
                {subject} - {grade}
                {unit && ` / ${unit}`}
              </h2>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 메타데이터 정보 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                과목
              </div>
              <div className="font-medium text-gray-900">{subject}</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                학년
              </div>
              <div className="font-medium text-gray-900">{grade}</div>
            </div>

            {unit && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  단원
                </div>
                <div className="font-medium text-gray-900">{unit}</div>
              </div>
            )}

            {publisher && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  출처
                </div>
                <div className="font-medium text-gray-900">{publisher}</div>
              </div>
            )}
          </div>

          {/* 내용 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">내용</h3>
              <button
                onClick={handleCopyContent}
                className="btn-ghost text-sm flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    복사
                  </>
                )}
              </button>
            </div>

            <div
              className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4 text-gray-700 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: highlight || content,
              }}
            />
          </div>

          {/* 파일 정보 */}
          {filename && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-2">원본 파일</div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{filename}</span>
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onToggleSelect && (
              <button
                onClick={handleToggleSelect}
                className={`btn flex items-center gap-2 ${
                  isSelected
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'btn-secondary'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4" />
                    선택됨
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    선택
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              닫기
            </button>

            {onAddToProblemSet && (
              <button
                onClick={handleAddToProblemSet}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                문제지에 추가
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
