/**
 * 텍스트 + 이미지 병합 로직
 */

import { MergedContent, ImageRequirement, FewshotSample } from '@/types/fewshot'
import { analyzeQuickly } from './image-analyzer'
import { matchTemplate } from './template-matcher'

interface ContentSection {
  type: 'text' | 'image'
  content: string  // text면 텍스트, image면 SVG 코드 또는 URL
  caption?: string
}

interface MergeOptions {
  imagePosition?: 'before' | 'after' | 'inline'  // 이미지 위치
  addCaption?: boolean
}

/**
 * 문제 텍스트와 이미지 병합
 */
export function mergeContentWithImage(
  text: string,
  svgCode: string | null,
  imageUrl: string | null,
  options: MergeOptions = {}
): MergedContent {
  const { imagePosition = 'before', addCaption = true } = options

  const images: MergedContent['images'] = []

  if (svgCode || imageUrl) {
    images.push({
      position: imagePosition === 'after' ? 1 : 0,
      svg: svgCode || undefined,
      url: imageUrl || undefined,
      caption: addCaption ? '문제 그림' : undefined,
    })
  }

  return {
    text,
    images,
  }
}

/**
 * 문제 분석 → 이미지 생성 → 병합 파이프라인
 */
export async function processContent(
  problemText: string,
  generateIllustration?: (description: string) => Promise<string | null>
): Promise<MergedContent> {
  // 1. 이미지 필요 여부 분석
  const requirement = analyzeQuickly(problemText)

  if (!requirement.needed) {
    return { text: problemText, images: [] }
  }

  // 2. 템플릿 매칭
  const matchResult = matchTemplate(requirement)

  // 3-A. SVG 템플릿이 있으면 사용
  if (matchResult.template?.svg_code) {
    return mergeContentWithImage(
      problemText,
      matchResult.template.svg_code,
      null,
      { imagePosition: 'before' }
    )
  }

  // 3-B. 삽화가 필요하면 DALL-E 호출
  if (requirement.category === 'illustration' && generateIllustration && requirement.description) {
    const imageUrl = await generateIllustration(requirement.description)
    return mergeContentWithImage(
      problemText,
      null,
      imageUrl,
      { imagePosition: 'before' }
    )
  }

  // 4. 매칭 실패 시 텍스트만 반환
  return { text: problemText, images: [] }
}

/**
 * 배치 처리
 */
export async function processBatch(
  problems: string[],
  generateIllustration?: (description: string) => Promise<string | null>
): Promise<MergedContent[]> {
  const results = await Promise.all(
    problems.map(p => processContent(p, generateIllustration))
  )
  return results
}

/**
 * SVG를 data URL로 변환 (PDF 변환용)
 */
export function svgToDataUrl(svgCode: string): string {
  const encoded = encodeURIComponent(svgCode)
  return `data:image/svg+xml,${encoded}`
}

/**
 * SVG를 base64로 변환
 */
export function svgToBase64(svgCode: string): string {
  if (typeof window !== 'undefined') {
    return btoa(unescape(encodeURIComponent(svgCode)))
  }
  return Buffer.from(svgCode).toString('base64')
}

/**
 * MergedContent를 HTML로 변환
 */
export function mergedContentToHtml(content: MergedContent): string {
  let html = ''

  // 이미지가 텍스트 전에 오는 경우
  const beforeImages = content.images.filter(img => img.position === 0)
  for (const img of beforeImages) {
    if (img.svg) {
      html += `<div class="problem-image">${img.svg}</div>`
    } else if (img.url) {
      html += `<div class="problem-image"><img src="${img.url}" alt="${img.caption || '문제 그림'}" /></div>`
    }
    if (img.caption) {
      html += `<p class="image-caption">${img.caption}</p>`
    }
  }

  // 텍스트
  html += `<div class="problem-text">${content.text}</div>`

  // 이미지가 텍스트 후에 오는 경우
  const afterImages = content.images.filter(img => img.position > 0)
  for (const img of afterImages) {
    if (img.svg) {
      html += `<div class="problem-image">${img.svg}</div>`
    } else if (img.url) {
      html += `<div class="problem-image"><img src="${img.url}" alt="${img.caption || '문제 그림'}" /></div>`
    }
    if (img.caption) {
      html += `<p class="image-caption">${img.caption}</p>`
    }
  }

  return html
}

/**
 * MergedContent를 Markdown으로 변환
 */
export function mergedContentToMarkdown(content: MergedContent): string {
  let md = ''

  // 이미지가 텍스트 전에 오는 경우
  const beforeImages = content.images.filter(img => img.position === 0)
  for (const img of beforeImages) {
    if (img.svg) {
      md += `\n\n${img.svg}\n\n`
    } else if (img.url) {
      md += `\n\n![${img.caption || '문제 그림'}](${img.url})\n\n`
    }
  }

  // 텍스트
  md += content.text

  // 이미지가 텍스트 후에 오는 경우
  const afterImages = content.images.filter(img => img.position > 0)
  for (const img of afterImages) {
    if (img.svg) {
      md += `\n\n${img.svg}\n\n`
    } else if (img.url) {
      md += `\n\n![${img.caption || '문제 그림'}](${img.url})\n\n`
    }
  }

  return md
}
