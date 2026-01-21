/**
 * SVG 렌더링 유틸리티
 * - SVG 검증
 * - SVG 최적화
 * - SVG → 이미지 변환
 */

/**
 * SVG 문자열 검증
 */
export function validateSvg(svgCode: string): { valid: boolean; error?: string } {
  if (!svgCode || typeof svgCode !== 'string') {
    return { valid: false, error: 'SVG 코드가 비어있습니다.' }
  }

  // 기본 SVG 태그 확인
  if (!svgCode.includes('<svg')) {
    return { valid: false, error: 'SVG 태그가 없습니다.' }
  }

  // 닫는 태그 확인
  if (!svgCode.includes('</svg>') && !svgCode.includes('/>')) {
    return { valid: false, error: 'SVG 태그가 올바르게 닫히지 않았습니다.' }
  }

  // viewBox 확인 (권장)
  if (!svgCode.includes('viewBox')) {
    console.warn('SVG에 viewBox가 없습니다. 반응형 렌더링이 제한될 수 있습니다.')
  }

  return { valid: true }
}

/**
 * SVG 정규화 (공통 속성 추가)
 */
export function normalizeSvg(svgCode: string, options: {
  width?: number | string
  height?: number | string
  preserveAspectRatio?: string
} = {}): string {
  const { width, height, preserveAspectRatio = 'xMidYMid meet' } = options

  let normalized = svgCode

  // xmlns 속성 추가 (없는 경우)
  if (!normalized.includes('xmlns=')) {
    normalized = normalized.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  }

  // preserveAspectRatio 추가 (없는 경우)
  if (!normalized.includes('preserveAspectRatio=')) {
    normalized = normalized.replace('<svg', `<svg preserveAspectRatio="${preserveAspectRatio}"`)
  }

  // 너비/높이 설정
  if (width) {
    if (normalized.includes('width=')) {
      normalized = normalized.replace(/width="[^"]*"/, `width="${width}"`)
    } else {
      normalized = normalized.replace('<svg', `<svg width="${width}"`)
    }
  }

  if (height) {
    if (normalized.includes('height=')) {
      normalized = normalized.replace(/height="[^"]*"/, `height="${height}"`)
    } else {
      normalized = normalized.replace('<svg', `<svg height="${height}"`)
    }
  }

  return normalized
}

/**
 * SVG를 data URL로 변환
 */
export function svgToDataUrl(svgCode: string): string {
  const encoded = encodeURIComponent(svgCode)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')
  return `data:image/svg+xml,${encoded}`
}

/**
 * SVG를 base64 data URL로 변환
 */
export function svgToBase64DataUrl(svgCode: string): string {
  let base64: string
  if (typeof window !== 'undefined') {
    base64 = btoa(unescape(encodeURIComponent(svgCode)))
  } else {
    base64 = Buffer.from(svgCode).toString('base64')
  }
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * SVG 색상 변경
 */
export function changeSvgColors(
  svgCode: string,
  colorMap: Record<string, string>
): string {
  let result = svgCode
  for (const [oldColor, newColor] of Object.entries(colorMap)) {
    const regex = new RegExp(oldColor.replace('#', '\\#'), 'gi')
    result = result.replace(regex, newColor)
  }
  return result
}

/**
 * SVG 크기 조정
 */
export function resizeSvg(svgCode: string, scale: number): string {
  // viewBox에서 크기 추출
  const viewBoxMatch = svgCode.match(/viewBox="([^"]*)"/)
  if (!viewBoxMatch) {
    return svgCode
  }

  const [minX, minY, width, height] = viewBoxMatch[1].split(' ').map(Number)
  const newWidth = width * scale
  const newHeight = height * scale

  return svgCode
    .replace(/viewBox="[^"]*"/, `viewBox="${minX} ${minY} ${newWidth} ${newHeight}"`)
}

/**
 * SVG 텍스트 추출
 */
export function extractSvgText(svgCode: string): string[] {
  const textMatches = svgCode.matchAll(/<text[^>]*>([^<]*)<\/text>/g)
  const texts: string[] = []
  for (const match of textMatches) {
    if (match[1]) {
      texts.push(match[1].trim())
    }
  }
  return texts
}

/**
 * SVG 요소 개수 카운트
 */
export function countSvgElements(svgCode: string): Record<string, number> {
  const elements = [
    'line', 'circle', 'rect', 'polygon', 'polyline', 'path',
    'text', 'ellipse', 'g', 'defs', 'marker', 'use'
  ]

  const counts: Record<string, number> = {}
  for (const element of elements) {
    const regex = new RegExp(`<${element}[\\s/>]`, 'g')
    const matches = svgCode.match(regex)
    if (matches) {
      counts[element] = matches.length
    }
  }

  return counts
}

/**
 * SVG 최적화 (불필요한 공백 제거)
 */
export function optimizeSvg(svgCode: string): string {
  return svgCode
    .replace(/>\s+</g, '><')  // 태그 사이 공백 제거
    .replace(/\s+/g, ' ')      // 연속 공백을 단일 공백으로
    .replace(/\s*([=<>])\s*/g, '$1')  // 연산자 주변 공백 제거
    .trim()
}

/**
 * SVG 메타데이터 추가
 */
export function addSvgMetadata(
  svgCode: string,
  metadata: { title?: string; description?: string }
): string {
  const { title, description } = metadata

  let metaTags = ''
  if (title) {
    metaTags += `<title>${title}</title>`
  }
  if (description) {
    metaTags += `<desc>${description}</desc>`
  }

  if (!metaTags) return svgCode

  // svg 태그 바로 다음에 메타데이터 삽입
  return svgCode.replace(/<svg([^>]*)>/, `<svg$1>${metaTags}`)
}
