'use client'

/**
 * SVG 템플릿 에디터 컴포넌트
 * - SVG 코드 편집
 * - 실시간 미리보기
 * - 변수 치환 지원
 */

import { useState, useCallback, useMemo } from 'react'
import SvgPreview from './SvgPreview'

interface TemplateEditorProps {
  initialCode?: string
  variables?: Record<string, string>
  onChange?: (code: string) => void
  onSave?: (code: string) => void
}

// SVG 템플릿 변수 패턴 (예: {{변수명}})
const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g

export default function TemplateEditor({
  initialCode = '',
  variables: initialVariables = {},
  onChange,
  onSave
}: TemplateEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [variables, setVariables] = useState<Record<string, string>>(initialVariables)
  const [showPreview, setShowPreview] = useState(true)

  // 변수 목록 추출
  const variableNames = useMemo(() => {
    const matches = code.matchAll(VARIABLE_PATTERN)
    const names = new Set<string>()
    for (const match of matches) {
      names.add(match[1])
    }
    return Array.from(names)
  }, [code])

  // 변수 치환된 SVG
  const renderedSvg = useMemo(() => {
    let result = code
    for (const [name, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), value)
    }
    return result
  }, [code, variables])

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode)
    onChange?.(newCode)
  }, [onChange])

  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    onSave?.(code)
  }

  const handleFormat = () => {
    // 간단한 SVG 포맷팅
    try {
      const formatted = code
        .replace(/></g, '>\n<')
        .replace(/\n\s*\n/g, '\n')
      setCode(formatted)
    } catch {
      // 포맷팅 실패 시 무시
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 툴바 */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1 rounded text-sm ${
              showPreview ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            미리보기 {showPreview ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleFormat}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            포맷팅
          </button>
        </div>
        {onSave && (
          <button
            onClick={handleSave}
            className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            저장
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 코드 편집기 */}
        <div className={`flex flex-col ${showPreview ? 'w-1/2' : 'w-full'} border-r`}>
          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
            placeholder="SVG 코드를 입력하세요..."
            spellCheck={false}
          />

          {/* 변수 편집 */}
          {variableNames.length > 0 && (
            <div className="border-t p-3 bg-gray-50">
              <div className="text-xs font-medium text-gray-500 mb-2">템플릿 변수</div>
              <div className="grid grid-cols-2 gap-2">
                {variableNames.map(name => (
                  <div key={name} className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 w-20 truncate" title={name}>
                      {name}:
                    </label>
                    <input
                      type="text"
                      value={variables[name] || ''}
                      onChange={(e) => handleVariableChange(name, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder={`{{${name}}}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 미리보기 */}
        {showPreview && (
          <div className="w-1/2 p-4 bg-gray-100 overflow-auto">
            <SvgPreview
              svgCode={renderedSvg}
              width="100%"
              height={300}
              showControls={true}
              title="미리보기"
            />
          </div>
        )}
      </div>
    </div>
  )
}
