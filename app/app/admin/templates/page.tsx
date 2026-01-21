'use client'

/**
 * SVG 템플릿 갤러리 페이지 (관리자용)
 * - 모든 SVG 템플릿 미리보기
 * - 카테고리별 필터링
 * - 테스트 도구
 */

import { useState } from 'react'
import { SvgPreview, TemplateSelector, TemplateEditor } from '@/components/fewshot'
import { ALL_TEMPLATES, TEMPLATES_BY_CATEGORY } from '@/data/fewshot'
import type { FewshotCategory } from '@/types/fewshot'

const CATEGORY_LABELS: Record<FewshotCategory, string> = {
  triangle: '삼각형',
  quadrilateral: '사각형',
  circle: '원',
  graph: '그래프',
  coordinate: '좌표평면',
  illustration: '삽화',
  other: '기타',
}

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'test' | 'editor'>('gallery')
  const [selectedTemplate, setSelectedTemplate] = useState<{ name: string; svgCode: string; category: string } | null>(null)
  const [testText, setTestText] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  // 문제 텍스트 테스트
  const handleTest = async () => {
    if (!testText.trim()) return

    setTesting(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemText: testText, format: 'raw' })
      })
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, error: '테스트 실패' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SVG 템플릿 관리</h1>
        <p className="text-gray-600 mt-1">수학 문제에 사용되는 도형 템플릿을 관리합니다</p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">전체</div>
          <div className="text-2xl font-bold text-gray-900">{ALL_TEMPLATES.length}개</div>
        </div>
        {Object.entries(TEMPLATES_BY_CATEGORY)
          .filter(([, templates]) => templates.length > 0)
          .map(([category, templates]) => (
            <div key={category} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">
                {CATEGORY_LABELS[category as FewshotCategory]}
              </div>
              <div className="text-2xl font-bold text-blue-600">{templates.length}개</div>
            </div>
          ))}
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {[
            { id: 'gallery', label: '갤러리' },
            { id: 'test', label: '테스트' },
            { id: 'editor', label: '에디터' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 갤러리 탭 */}
      {activeTab === 'gallery' && (
        <div className="bg-white rounded-lg shadow p-6">
          <TemplateSelector
            onSelect={setSelectedTemplate}
            selectedName={selectedTemplate?.name}
          />

          {/* 선택된 템플릿 상세 */}
          {selectedTemplate && (
            <div className="mt-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h3 className="font-medium text-gray-900 mb-3">선택된 템플릿: {selectedTemplate.name}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <SvgPreview
                  svgCode={selectedTemplate.svgCode}
                  width="100%"
                  height={250}
                  showControls={true}
                  title="미리보기"
                />
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">SVG 코드</h4>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-auto max-h-48">
                    {selectedTemplate.svgCode}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 테스트 탭 */}
      {activeTab === 'test' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium text-gray-900 mb-4">문제 텍스트 → 템플릿 매칭 테스트</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                문제 텍스트
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 삼각형 ABC에서 점 D는 변 BC의 중점이다. AD의 길이를 구하시오."
              />
            </div>

            <button
              onClick={handleTest}
              disabled={testing || !testText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {testing ? '분석 중...' : '분석 실행'}
            </button>

            {/* 테스트 결과 */}
            {testResult && (
              <div className="mt-4 p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">분석 결과</h4>

                {testResult.success ? (
                  <div className="space-y-4">
                    {/* 분석 정보 */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">이미지 분석</h5>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p>필요 여부: <span className={testResult.analysis?.needed ? 'text-green-600' : 'text-gray-500'}>
                            {testResult.analysis?.needed ? '필요' : '불필요'}
                          </span></p>
                          <p>카테고리: {testResult.analysis?.category || '-'}</p>
                          <p>서브카테고리: {testResult.analysis?.subcategory || '-'}</p>
                          <p>태그: {testResult.analysis?.tags?.join(', ') || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">템플릿 매칭</h5>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p>매칭 템플릿: <span className="font-medium">{testResult.match?.template || '없음'}</span></p>
                          <p>매칭 점수: {testResult.match?.score?.toFixed(2) || '-'}</p>
                          <p>사유: {testResult.match?.reason || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* SVG 미리보기 */}
                    {testResult.data?.images?.[0]?.svg && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">생성된 이미지</h5>
                        <SvgPreview
                          svgCode={testResult.data.images[0].svg}
                          width="100%"
                          height={200}
                          showControls={true}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-600">
                    오류: {testResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 에디터 탭 */}
      {activeTab === 'editor' && (
        <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: '600px' }}>
          <TemplateEditor
            initialCode={selectedTemplate?.svgCode || `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- SVG 코드를 여기에 입력하세요 -->
  <circle cx="100" cy="100" r="50" fill="none" stroke="#333" stroke-width="2"/>
</svg>`}
            onChange={(code) => console.log('Code changed:', code.length, 'chars')}
          />
        </div>
      )}
    </div>
  )
}
