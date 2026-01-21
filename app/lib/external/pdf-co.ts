/**
 * PDF.co API 클라이언트 - PDF 변환/생성
 */

const isConfigured = () => !!process.env.PDFCO_API_KEY
const API_BASE = 'https://api.pdf.co/v1'

export interface PDFGenerateInput { html?: string; url?: string; name?: string }
export interface PDFConvertInput { file: Buffer | string; fileName?: string; outputFormat: 'png' | 'jpg' | 'text' }
export interface PDFMergeInput { files: Array<Buffer | string>; outputName?: string }
export interface PDFResult { success: boolean; url?: string; data?: Buffer; error?: string }

async function apiCall(endpoint: string, body: Record<string, unknown>): Promise<{ url?: string; error?: string }> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.PDFCO_API_KEY! },
    body: JSON.stringify(body)
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return await response.json()
}

export async function generatePDF(input: PDFGenerateInput): Promise<PDFResult> {
  if (!isConfigured()) {
    console.log('[Mock PDF Generate]', input.name || 'document.pdf')
    return { success: true, url: `https://mock.pdf.co/${input.name || 'document.pdf'}` }
  }
  try {
    const result = await apiCall('/pdf/convert/from/html', { html: input.html, url: input.url, name: input.name || 'document.pdf' })
    return { success: true, url: result.url }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : '생성 실패' } }
}

export async function convertPDFToImage(input: PDFConvertInput): Promise<PDFResult> {
  if (!isConfigured()) {
    console.log('[Mock PDF to Image]', input.fileName)
    return { success: true, url: 'https://mock.pdf.co/page1.png' }
  }
  try {
    const fileUrl = typeof input.file === 'string' ? input.file : await uploadFile(input.file, input.fileName || 'document.pdf')
    const endpoint = input.outputFormat === 'text' ? '/pdf/convert/to/text' : `/pdf/convert/to/${input.outputFormat}`
    const result = await apiCall(endpoint, { url: fileUrl, pages: '0-' })
    return { success: true, url: result.url }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : '변환 실패' } }
}

export async function convertImageToPDF(images: Array<Buffer | string>, outputName?: string): Promise<PDFResult> {
  if (!isConfigured()) {
    console.log('[Mock Image to PDF]', outputName)
    return { success: true, url: 'https://mock.pdf.co/output.pdf' }
  }
  try {
    const urls = await Promise.all(images.map((img, i) => typeof img === 'string' ? img : uploadFile(img, `image${i}.jpg`)))
    const result = await apiCall('/pdf/convert/from/image', { url: urls.join(','), name: outputName || 'output.pdf' })
    return { success: true, url: result.url }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : '변환 실패' } }
}

export async function mergePDFs(input: PDFMergeInput): Promise<PDFResult> {
  if (!isConfigured()) {
    console.log('[Mock PDF Merge]', input.outputName)
    return { success: true, url: 'https://mock.pdf.co/merged.pdf' }
  }
  try {
    const urls = await Promise.all(input.files.map((f, i) => typeof f === 'string' ? f : uploadFile(f, `doc${i}.pdf`)))
    const result = await apiCall('/pdf/merge', { url: urls.join(','), name: input.outputName || 'merged.pdf' })
    return { success: true, url: result.url }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : '병합 실패' } }
}

export async function extractText(file: Buffer | string, fileName?: string): Promise<{ text: string; error?: string }> {
  if (!isConfigured()) return { text: '추출된 텍스트 샘플입니다. x² + 2x + 1 = 0' }
  try {
    const result = await convertPDFToImage({ file, fileName, outputFormat: 'text' })
    if (!result.url) throw new Error('변환 실패')
    const response = await fetch(result.url)
    return { text: await response.text() }
  } catch (e) { return { text: '', error: e instanceof Error ? e.message : '추출 실패' } }
}

async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  const presignRes = await fetch(`${API_BASE}/file/upload/get-presigned-url?name=${fileName}&contenttype=application/octet-stream`, {
    headers: { 'x-api-key': process.env.PDFCO_API_KEY! }
  })
  const { presignedUrl, url } = await presignRes.json()
  await fetch(presignedUrl, { method: 'PUT', body: new Uint8Array(buffer), headers: { 'Content-Type': 'application/octet-stream' } })
  return url
}

export async function generateProblemSheetPDF(problems: Array<{ question: string; options?: string[] }>, title?: string): Promise<PDFResult> {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:sans-serif;padding:40px}h1{text-align:center}.problem{margin:20px 0;padding:15px;border:1px solid #ddd}.q{font-weight:bold}.options{margin-top:10px;padding-left:20px}</style></head><body><h1>${title || '문제지'}</h1>${problems.map((p, i) => `<div class="problem"><div class="q">${i + 1}. ${p.question}</div>${p.options ? `<div class="options">${p.options.map((o, j) => `<div>${String.fromCharCode(9312 + j)} ${o}</div>`).join('')}</div>` : ''}</div>`).join('')}</body></html>`
  return generatePDF({ html, name: `${title || 'problems'}.pdf` })
}
