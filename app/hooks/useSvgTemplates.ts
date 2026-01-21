'use client'

/**
 * SVG 템플릿 관련 React Hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { FewshotCategory } from '@/types/fewshot'

interface Template {
  name: string
  category: string
  subcategory?: string
  description?: string
  svg_code?: string
  tags?: string[]
}

interface UseTemplatesResult {
  templates: Template[]
  loading: boolean
  error: string | null
  categories: { category: string; count: number }[]
  getTemplate: (category: FewshotCategory, subcategory?: string) => Promise<Template | null>
  searchTemplates: (keywords: string[]) => Promise<Template | null>
  analyzeText: (text: string, useLLM?: boolean) => Promise<{
    needed: boolean
    category?: string
    subcategory?: string
    tags?: string[]
  }>
  processContent: (text: string, forceTemplate?: string) => Promise<{
    html: string
    hasImage: boolean
    templateUsed?: string
  }>
}

export function useSvgTemplates(): UseTemplatesResult {
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 템플릿 목록 로드
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/templates')
        const result = await response.json()

        if (result.success) {
          setTemplates(result.data)
          setCategories(result.categories || [])
        } else {
          setError(result.error || '템플릿 로드 실패')
        }
      } catch (err) {
        setError('서버 연결 오류')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadTemplates()
  }, [])

  // 특정 템플릿 조회
  const getTemplate = useCallback(async (
    category: FewshotCategory,
    subcategory?: string
  ): Promise<Template | null> => {
    try {
      const params = new URLSearchParams({ category })
      if (subcategory) params.append('subcategory', subcategory)

      const response = await fetch(`/api/templates?${params.toString()}`)
      const result = await response.json()

      return result.success ? result.data : null
    } catch {
      return null
    }
  }, [])

  // 키워드로 템플릿 검색
  const searchTemplates = useCallback(async (
    keywords: string[]
  ): Promise<Template | null> => {
    try {
      const response = await fetch(`/api/templates?keywords=${keywords.join(',')}`)
      const result = await response.json()

      return result.success ? result.data : null
    } catch {
      return null
    }
  }, [])

  // 텍스트 분석
  const analyzeText = useCallback(async (
    text: string,
    useLLM = false
  ): Promise<{
    needed: boolean
    category?: string
    subcategory?: string
    tags?: string[]
  }> => {
    try {
      const response = await fetch('/api/templates/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, useLLM })
      })
      const result = await response.json()

      return result.success ? result.data : { needed: false }
    } catch {
      return { needed: false }
    }
  }, [])

  // 콘텐츠 처리 (텍스트 → HTML with SVG)
  const processContent = useCallback(async (
    text: string,
    forceTemplate?: string
  ): Promise<{
    html: string
    hasImage: boolean
    templateUsed?: string
  }> => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemText: text,
          format: 'html',
          forceTemplate
        })
      })
      const result = await response.json()

      if (result.success) {
        return {
          html: typeof result.data === 'string' ? result.data : result.data.text || '',
          hasImage: result.data?.images?.length > 0 || false,
          templateUsed: result.match?.template || undefined
        }
      }

      return { html: text, hasImage: false }
    } catch {
      return { html: text, hasImage: false }
    }
  }, [])

  return {
    templates,
    loading,
    error,
    categories,
    getTemplate,
    searchTemplates,
    analyzeText,
    processContent
  }
}

/**
 * 단일 템플릿 미리보기 Hook
 * Best Practice: 직접 API 호출로 불필요한 데이터 로드 방지
 */
export function useTemplatePreview(templateName: string | null) {
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!templateName) {
      setTemplate(null)
      return
    }

    // Best Practice 7.8: Early Return
    let cancelled = false

    const loadTemplate = async () => {
      setLoading(true)
      try {
        // Best Practice: 특정 템플릿만 조회 (전체 목록 로드 방지)
        const response = await fetch(`/api/templates/preview?name=${encodeURIComponent(templateName)}`)

        if (cancelled) return

        if (response.ok) {
          // SVG 직접 반환하므로 처리 방식 변경
          const svgCode = await response.text()
          setTemplate({
            name: templateName,
            category: '',
            svg_code: svgCode
          })
        } else {
          setTemplate(null)
        }
      } catch {
        if (!cancelled) setTemplate(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTemplate()

    return () => { cancelled = true }
  }, [templateName])

  return { template, loading }
}

/**
 * 문제 분석 결과 캐싱 Hook
 * Best Practice 5.1: Defer State Reads, 7.4: Cache Repeated Function Calls
 */

// 모듈 레벨 캐시 (Best Practice 7.4)
const analysisCache = new Map<string, {
  needed: boolean
  category?: string
  subcategory?: string
  tags?: string[]
  templateMatch?: string
}>()

export function useProblemAnalysis(problemText: string) {
  const [analysis, setAnalysis] = useState<{
    needed: boolean
    category?: string
    subcategory?: string
    tags?: string[]
    templateMatch?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Best Practice 7.8: Early Return
    if (!problemText || problemText.length < 10) {
      setAnalysis(null)
      return
    }

    // 캐시 확인 (Best Practice 7.4)
    const cached = analysisCache.get(problemText)
    if (cached) {
      setAnalysis(cached)
      return
    }

    let cancelled = false

    const analyze = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/templates/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: problemText })
        })

        if (cancelled) return

        const result = await response.json()

        if (result.success) {
          // 결과 캐싱
          analysisCache.set(problemText, result.data)
          setAnalysis(result.data)
        }
      } catch {
        if (!cancelled) setAnalysis(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // 디바운스 (Best Practice: useTransition 대안)
    const timer = setTimeout(analyze, 500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [problemText])

  return { analysis, loading }
}
