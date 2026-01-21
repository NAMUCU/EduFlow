/**
 * PDF + SVG 변환 유틸리티
 * - SVG를 PDF 삽입용 형식으로 변환
 * - HTML 템플릿에 SVG 삽입
 */

import { svgToBase64DataUrl, normalizeSvg } from './svg-renderer'
import { MergedContent } from '@/types/fewshot'

interface PdfSvgOptions {
  width?: number
  height?: number
  margin?: number
}

/**
 * SVG를 PDF 삽입용 이미지 태그로 변환
 */
export function svgToPdfImage(
  svgCode: string,
  options: PdfSvgOptions = {}
): string {
  const { width = 200, height = 200 } = options

  // SVG 정규화
  const normalizedSvg = normalizeSvg(svgCode, { width, height })

  // base64 data URL로 변환
  const dataUrl = svgToBase64DataUrl(normalizedSvg)

  return `<img src="${dataUrl}" width="${width}" height="${height}" style="display: block; margin: 10px auto;" />`
}

/**
 * MergedContent를 PDF용 HTML로 변환
 */
export function mergedContentToPdfHtml(
  content: MergedContent,
  options: PdfSvgOptions = {}
): string {
  const { margin = 20 } = options
  let html = ''

  // 이미지가 텍스트 전에 오는 경우
  const beforeImages = content.images.filter(img => img.position === 0)
  for (const img of beforeImages) {
    if (img.svg) {
      html += svgToPdfImage(img.svg, options)
    } else if (img.url) {
      html += `<img src="${img.url}" style="display: block; margin: 10px auto; max-width: 100%;" />`
    }
    if (img.caption) {
      html += `<p style="text-align: center; font-size: 12px; color: #666; margin: 5px 0 ${margin}px;">${img.caption}</p>`
    }
  }

  // 텍스트 (LaTeX 수식 지원)
  html += `<div style="margin: ${margin}px 0; line-height: 1.6;">${formatMathText(content.text)}</div>`

  // 이미지가 텍스트 후에 오는 경우
  const afterImages = content.images.filter(img => img.position > 0)
  for (const img of afterImages) {
    if (img.svg) {
      html += svgToPdfImage(img.svg, options)
    } else if (img.url) {
      html += `<img src="${img.url}" style="display: block; margin: 10px auto; max-width: 100%;" />`
    }
    if (img.caption) {
      html += `<p style="text-align: center; font-size: 12px; color: #666; margin: 5px 0;">${img.caption}</p>`
    }
  }

  return html
}

/**
 * 수학 텍스트 포맷팅 (LaTeX 기호 변환)
 */
function formatMathText(text: string): string {
  return text
    // 인라인 수식 마크업
    .replace(/\$([^$]+)\$/g, '<span class="math-inline">$1</span>')
    // 디스플레이 수식 마크업
    .replace(/\$\$([^$]+)\$\$/g, '<div class="math-display">$1</div>')
    // 기본 LaTeX 심볼 변환
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="fraction"><span class="num">$1</span><span class="den">$2</span></span>')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\pm/g, '±')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    .replace(/\\pi/g, 'π')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\degree/g, '°')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/_(\d)/g, '<sub>$1</sub>')
    .replace(/\n/g, '<br/>')
}

/**
 * 문제 세트를 PDF용 HTML 문서로 변환
 */
export function problemSetToPdfHtml(
  problems: MergedContent[],
  options: {
    title?: string
    showNumbers?: boolean
    pageBreakAfter?: number
  } = {}
): string {
  const { title, showNumbers = true, pageBreakAfter = 5 } = options

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Noto Sans KR', sans-serif;
      font-size: 14px;
      line-height: 1.8;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      font-size: 20px;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
    }
    .problem {
      margin-bottom: 30px;
      padding: 15px;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
    }
    .problem-number {
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .math-inline {
      font-family: 'Times New Roman', serif;
      font-style: italic;
    }
    .math-display {
      text-align: center;
      font-family: 'Times New Roman', serif;
      font-style: italic;
      margin: 15px 0;
      font-size: 16px;
    }
    .fraction {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      vertical-align: middle;
    }
    .fraction .num {
      border-bottom: 1px solid #000;
      padding: 0 5px 2px;
    }
    .fraction .den {
      padding: 2px 5px 0;
    }
    .page-break {
      page-break-after: always;
    }
    @media print {
      body { padding: 20px; }
      .problem { border: none; border-bottom: 1px solid #ddd; }
    }
  </style>
</head>
<body>
`

  if (title) {
    html += `<h1>${title}</h1>`
  }

  problems.forEach((problem, index) => {
    html += '<div class="problem">'

    if (showNumbers) {
      html += `<div class="problem-number">${index + 1}번</div>`
    }

    html += mergedContentToPdfHtml(problem)
    html += '</div>'

    // 페이지 나눔
    if (pageBreakAfter && (index + 1) % pageBreakAfter === 0 && index < problems.length - 1) {
      html += '<div class="page-break"></div>'
    }
  })

  html += '</body></html>'

  return html
}

/**
 * 답안지 HTML 생성
 */
export function answerSheetToPdfHtml(
  answers: { number: number; answer: string; solution?: string }[]
): string {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Noto Sans KR', sans-serif;
      font-size: 14px;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
    }
    .answer-item {
      margin-bottom: 15px;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 5px;
    }
    .answer-number {
      font-weight: bold;
      color: #2563eb;
    }
    .answer-value {
      color: #16a34a;
      font-weight: bold;
    }
    .solution {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #ddd;
      font-size: 13px;
      color: #666;
    }
  </style>
</head>
<body>
<h1>정답 및 풀이</h1>
`

  for (const item of answers) {
    html += `
<div class="answer-item">
  <span class="answer-number">${item.number}번</span>
  <span class="answer-value">${formatMathText(item.answer)}</span>
  ${item.solution ? `<div class="solution">${formatMathText(item.solution)}</div>` : ''}
</div>
`
  }

  html += '</body></html>'
  return html
}
