'use client'

/**
 * SVG 템플릿 선택 컴포넌트
 * - 카테고리별 템플릿 목록
 * - 미리보기 + 선택 기능
 *
 * Best Practice 2.1: 직접 import 사용 (barrel file 회피)
 */

import { useState, useMemo, memo } from 'react'
import { SimpleSvgPreview } from './SvgPreview'
// Best Practice 2.1: Avoid Barrel File Imports
// 개별 파일에서 직접 import (tree-shaking 최적화)
import { TRIANGLE_TEMPLATES } from '@/data/fewshot/triangles'
import { QUADRILATERAL_TEMPLATES } from '@/data/fewshot/quadrilaterals'
import { CIRCLE_TEMPLATES } from '@/data/fewshot/circles'
import { GRAPH_TEMPLATES } from '@/data/fewshot/graphs'
import { COORDINATE_TEMPLATES } from '@/data/fewshot/coordinates'
import type { FewshotCategory, FewshotSample } from '@/types/fewshot'

// 로컬에서 조합 (barrel import 회피)
const ALL_TEMPLATES = [
  ...TRIANGLE_TEMPLATES,
  ...QUADRILATERAL_TEMPLATES,
  ...CIRCLE_TEMPLATES,
  ...GRAPH_TEMPLATES,
  ...COORDINATE_TEMPLATES,
]

const TEMPLATES_BY_CATEGORY: Record<FewshotCategory, Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'>[]> = {
  triangle: TRIANGLE_TEMPLATES,
  quadrilateral: QUADRILATERAL_TEMPLATES,
  circle: CIRCLE_TEMPLATES,
  graph: GRAPH_TEMPLATES,
  coordinate: COORDINATE_TEMPLATES,
  illustration: [],
  other: [],
}

interface TemplateSelectorProps {
  onSelect: (template: { name: string; svgCode: string; category: string }) => void
  selectedName?: string
  showCategories?: boolean
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

// Best Practice 5.2: Extract to Memoized Components
const TemplateCard = memo(function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'>
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`p-3 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="aspect-square bg-gray-50 rounded mb-2 flex items-center justify-center overflow-hidden">
        {template.svg_code ? (
          <SimpleSvgPreview
            svgCode={template.svg_code}
            className="w-full h-full p-2"
          />
        ) : (
          <span className="text-gray-400 text-sm">미리보기 없음</span>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-900 truncate">
          {template.name}
        </div>
        {template.description && (
          <div className="text-xs text-gray-500 truncate">
            {template.description}
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
            {CATEGORY_LABELS[template.category as FewshotCategory] || template.category}
          </span>
          {template.subcategory && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600 rounded">
              {template.subcategory}
            </span>
          )}
        </div>
      </div>
    </button>
  )
})

function TemplateSelector({
  onSelect,
  selectedName,
  showCategories = true
}: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<FewshotCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemplates = useMemo(() => {
    let templates = activeCategory === 'all'
      ? ALL_TEMPLATES
      : TEMPLATES_BY_CATEGORY[activeCategory]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return templates
  }, [activeCategory, searchQuery])

  const categories = Object.keys(TEMPLATES_BY_CATEGORY).filter(
    cat => TEMPLATES_BY_CATEGORY[cat as FewshotCategory].length > 0
  ) as FewshotCategory[]

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="템플릿 검색..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* 카테고리 탭 */}
      {showCategories && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {CATEGORY_LABELS[category]}
              <span className="ml-1 text-xs opacity-70">
                ({TEMPLATES_BY_CATEGORY[category].length})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 템플릿 그리드 - Best Practice 6.2: content-visibility for Long Lists */}
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
      >
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.name}
            template={template}
            isSelected={selectedName === template.name}
            onSelect={() => onSelect({
              name: template.name,
              svgCode: template.svg_code || '',
              category: template.category
            })}
          />
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {/* Best Practice 6.7: Use Explicit Conditional Rendering */}
          {searchQuery ? '검색 결과가 없습니다' : '템플릿이 없습니다'}
        </div>
      )}
    </div>
  )
}

export default memo(TemplateSelector)
