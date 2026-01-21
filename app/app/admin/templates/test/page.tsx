'use client'

/**
 * SVG 템플릿 테스트 페이지
 * - 실시간 문제 텍스트 → SVG 변환 테스트
 */

import { useState } from 'react'
import { SvgPreview } from '@/components/fewshot'
import { useProblemAnalysis } from '@/hooks/useSvgTemplates'

const SAMPLE_PROBLEMS = [
  '삼각형 ABC에서 점 D는 변 BC의 중점이다. AD의 길이를 구하시오.',
  '원 O의 반지름이 5cm일 때, 원의 넓이를 구하시오.',
  '좌표평면에서 두 점 A(1, 2)와 B(4, 6) 사이의 거리를 구하시오.',
  '이차함수 y = x² - 4x + 3의 그래프를 그리고, 꼭짓점의 좌표를 구하시오.',
  '평행사변형 ABCD에서 대각선 AC와 BD의 교점을 O라 할 때, AO = OC임을 증명하시오.',
  '원에 내접하는 사각형 ABCD에서 ∠A + ∠C = 180°임을 증명하시오.',
  '직각삼각형에서 빗변의 길이가 10이고, 한 예각이 30°일 때, 다른 두 변의 길이를 구하시오.',
  '집에서 학교까지 거리가 3km이고, 자전거로 15분 걸린다면 자전거의 속력은?'
]

export default function TemplateTestPage() {
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // 실시간 분석
  const { analysis, loading: analyzing } = useProblemAnalysis(inputText)

  const handleTest = async () => {
    if (!inputText.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemText: inputText, format: 'raw' })
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: '테스트 실패' })
    } finally {
      setLoading(false)
    }
  }

  const handleSampleClick = (sample: string) => {
    setInputText(sample)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">SVG 템플릿 테스트</h1>
      <p className="text-gray-600 mb-6">문제 텍스트를 입력하면 자동으로 분석하여 적절한 SVG 템플릿을 매칭합니다.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 입력 영역 */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              문제 텍스트
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="문제 텍스트를 입력하세요..."
            />

            <div className="flex items-center justify-between mt-3">
              <button
                onClick={handleTest}
                disabled={loading || !inputText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '분석 중...' : '템플릿 매칭 실행'}
              </button>

              {analyzing && (
                <span className="text-sm text-gray-500">실시간 분석 중...</span>
              )}
            </div>
          </div>

          {/* 실시간 분석 결과 */}
          {analysis && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">실시간 분석</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">이미지 필요:</span>{' '}
                  <span className={analysis.needed ? 'text-green-600 font-medium' : 'text-gray-400'}>
                    {analysis.needed ? '예' : '아니오'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">카테고리:</span>{' '}
                  <span className="font-medium">{analysis.category || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">서브카테고리:</span>{' '}
                  <span className="font-medium">{analysis.subcategory || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">태그:</span>{' '}
                  <span className="font-medium">{analysis.tags?.join(', ') || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* 샘플 문제 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">샘플 문제</h3>
            <div className="space-y-2">
              {SAMPLE_PROBLEMS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSampleClick(sample)}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 rounded border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 결과 영역 */}
        <div className="space-y-4">
          {result && (
            <>
              {/* 분석 결과 */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-medium text-gray-900 mb-3">분석 결과</h3>

                {result.success ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-500 mb-1">이미지 필요</div>
                        <div className={`font-medium ${result.analysis?.needed ? 'text-green-600' : 'text-gray-400'}`}>
                          {result.analysis?.needed ? '예' : '아니오'}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-500 mb-1">카테고리</div>
                        <div className="font-medium">{result.analysis?.category || '-'}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-500 mb-1">매칭 템플릿</div>
                        <div className="font-medium text-blue-600">{result.match?.template || '없음'}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-500 mb-1">매칭 점수</div>
                        <div className="font-medium">{result.match?.score?.toFixed(2) || '-'}</div>
                      </div>
                    </div>

                    {result.match?.reason && (
                      <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                        {result.match.reason}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-600">{result.error}</div>
                )}
              </div>

              {/* SVG 미리보기 */}
              {result.success && result.data?.images?.[0]?.svg && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-900 mb-3">생성된 SVG</h3>
                  <SvgPreview
                    svgCode={result.data.images[0].svg}
                    width="100%"
                    height={300}
                    showControls={true}
                    title={result.match?.template || '미리보기'}
                  />
                </div>
              )}

              {/* 원본 데이터 */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-medium text-gray-900 mb-3">원본 응답</h3>
                <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </>
          )}

          {!result && (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              문제를 입력하고 테스트 버튼을 클릭하세요
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
