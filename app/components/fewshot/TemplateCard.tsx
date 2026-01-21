'use client'

/**
 * 템플릿 카드 컴포넌트
 * - 템플릿 미리보기 카드
 * - 선택/삭제/편집 액션
 */

import { SimpleSvgPreview } from './SvgPreview'
import type { FewshotCategory } from '@/types/fewshot'

interface TemplateCardProps {
  name: string
  category: FewshotCategory
  subcategory?: string
  description?: string
  svgCode?: string
  tags?: string[]
  isSelected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
}

const CATEGORY_LABELS: Record<FewshotCategory, string> = {
  triangle: '삼각형',
  quadrilateral: '사각형',
  circle: '원',
  graph: '그래프',
  coordinate: '좌표평면',
  illustration: '삽화',
  other: '기타',
}

const CATEGORY_COLORS: Record<FewshotCategory, string> = {
  triangle: 'bg-blue-100 text-blue-800',
  quadrilateral: 'bg-green-100 text-green-800',
  circle: 'bg-purple-100 text-purple-800',
  graph: 'bg-orange-100 text-orange-800',
  coordinate: 'bg-teal-100 text-teal-800',
  illustration: 'bg-pink-100 text-pink-800',
  other: 'bg-gray-100 text-gray-800',
}

export default function TemplateCard({
  name,
  category,
  subcategory,
  description,
  svgCode,
  tags = [],
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  showActions = true
}: TemplateCardProps) {
  return (
    <div
      className={`
        relative bg-white border rounded-lg overflow-hidden transition-all
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
        ${onSelect ? 'cursor-pointer hover:border-blue-400 hover:shadow-md' : ''}
      `}
      onClick={onSelect}
    >
      {/* SVG 미리보기 */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center p-3 border-b">
        {svgCode ? (
          <SimpleSvgPreview svgCode={svgCode} className="w-full h-full" />
        ) : (
          <div className="text-gray-400 text-sm">미리보기 없음</div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-3">
        <div className="font-medium text-gray-900 text-sm truncate" title={name}>
          {name}
        </div>

        {description && (
          <div className="text-xs text-gray-500 mt-1 truncate" title={description}>
            {description}
          </div>
        )}

        {/* 카테고리/태그 */}
        <div className="flex flex-wrap gap-1 mt-2">
          <span className={`px-1.5 py-0.5 text-xs rounded ${CATEGORY_COLORS[category]}`}>
            {CATEGORY_LABELS[category]}
          </span>
          {subcategory && (
            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {subcategory}
            </span>
          )}
        </div>

        {/* 태그 (최대 3개) */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs text-gray-500">
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-400">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      {showActions && (onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1 bg-white rounded shadow hover:bg-gray-50"
              title="편집"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 bg-white rounded shadow hover:bg-red-50"
              title="삭제"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* 선택 체크 표시 */}
      {isSelected && (
        <div className="absolute top-2 left-2">
          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 템플릿 카드 그리드
 */
export function TemplateCardGrid({
  templates,
  selectedName,
  onSelect,
  columns = 4
}: {
  templates: Array<{
    name: string
    category: FewshotCategory
    subcategory?: string
    description?: string
    svg_code?: string
    tags?: string[]
  }>
  selectedName?: string
  onSelect?: (name: string) => void
  columns?: 2 | 3 | 4 | 5
}) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {templates.map(template => (
        <TemplateCard
          key={template.name}
          name={template.name}
          category={template.category}
          subcategory={template.subcategory}
          description={template.description}
          svgCode={template.svg_code}
          tags={template.tags}
          isSelected={selectedName === template.name}
          onSelect={onSelect ? () => onSelect(template.name) : undefined}
          showActions={false}
        />
      ))}
    </div>
  )
}
