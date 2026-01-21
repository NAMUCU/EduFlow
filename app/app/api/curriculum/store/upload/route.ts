/**
 * 커리큘럼 문서 업로드 API
 * PDF.co + Claude Vision으로 전처리 후 File Search Store에 업로드
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const CURRICULUM_STORE_NAME = 'EduFlow_Curriculum_Store'
const PDFCO_API_BASE = 'https://api.pdf.co/v1'

function getGenAIClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY 환경변수가 설정되지 않았습니다.')
  }
  return new GoogleGenAI({ apiKey })
}

function getClaudeClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.')
  }
  return new Anthropic({ apiKey })
}

// PDF.co에 파일 업로드
async function uploadToPdfCo(buffer: Buffer, fileName: string): Promise<string> {
  const apiKey = process.env.PDFCO_API_KEY
  if (!apiKey) {
    throw new Error('PDFCO_API_KEY 환경변수가 설정되지 않았습니다.')
  }

  // Presigned URL 가져오기
  const presignRes = await fetch(
    `${PDFCO_API_BASE}/file/upload/get-presigned-url?name=${encodeURIComponent(fileName)}&contenttype=application/pdf`,
    { headers: { 'x-api-key': apiKey } }
  )
  const { presignedUrl, url } = await presignRes.json()

  // 파일 업로드
  await fetch(presignedUrl, {
    method: 'PUT',
    body: new Uint8Array(buffer),
    headers: { 'Content-Type': 'application/pdf' },
  })

  return url
}

// PDF.co로 PDF → 이미지 변환
async function pdfToImages(pdfBuffer: Buffer, fileName: string): Promise<string[]> {
  const apiKey = process.env.PDFCO_API_KEY
  if (!apiKey) {
    console.log('[Mock] PDF.co API 키 없음, 빈 배열 반환')
    return []
  }

  try {
    // PDF 업로드
    const pdfUrl = await uploadToPdfCo(pdfBuffer, fileName)

    // PDF → PNG 변환
    const response = await fetch(`${PDFCO_API_BASE}/pdf/convert/to/png`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        url: pdfUrl,
        pages: '0-',  // 모든 페이지
      }),
    })

    const result = await response.json()

    if (result.error) {
      console.error('PDF.co 변환 오류:', result.message)
      return []
    }

    // urls 배열 반환 (각 페이지별 이미지 URL)
    return result.urls || (result.url ? [result.url] : [])
  } catch (error) {
    console.error('PDF → 이미지 변환 실패:', error)
    return []
  }
}

// Claude Vision으로 이미지 URL을 마크다운으로 변환 (병렬 처리)
async function convertWithClaudeVision(
  claude: Anthropic,
  imageUrls: string[]
): Promise<string> {
  // 병렬로 모든 페이지 처리
  const results = await Promise.all(
    imageUrls.map(async (imageUrl, i) => {
      try {
        const response = await claude.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'url',
                    url: imageUrl,
                  },
                },
                {
                  type: 'text',
                  text: `이 페이지를 마크다운으로 정확하게 변환해주세요.

규칙:
- 표는 마크다운 표 형식으로 정확히 변환
- 수학 공식은 LaTeX 형식으로 ($...$ 또는 $$...$$)
- 숫자와 단위를 정확하게 추출
- 제목, 소제목 구조 유지
- 한국어로 작성`,
                },
              ],
            },
          ],
        })

        const text = response.content[0].type === 'text' ? response.content[0].text : ''
        return { index: i, content: `## 페이지 ${i + 1}\n\n${text}` }
      } catch (error) {
        console.error(`페이지 ${i + 1} 처리 실패:`, error)
        return { index: i, content: `## 페이지 ${i + 1}\n\n[처리 실패]` }
      }
    })
  )

  // 페이지 순서대로 정렬 후 합치기
  return results
    .sort((a, b) => a.index - b.index)
    .map(r => r.content)
    .join('\n\n---\n\n')
}

// Store 가져오기 또는 생성
async function getOrCreateStore(client: GoogleGenAI) {
  try {
    const c = client as any
    const stores = await c.fileSearchStores?.list?.()
    const storeList = stores?.fileSearchStores || stores || []

    // 기존 Store 찾기
    for (const store of storeList) {
      if (store.displayName === CURRICULUM_STORE_NAME) {
        return store
      }
    }

    // 없으면 새로 생성
    const newStore = await c.fileSearchStores?.create?.({
      config: { displayName: CURRICULUM_STORE_NAME },
    })

    return newStore
  } catch (error) {
    console.error('Store 생성/조회 실패:', error)
    throw error
  }
}

// 파일 업로드 처리
export async function POST(request: NextRequest) {
  let mdFilePath: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다.' },
        { status: 400 }
      )
    }

    const gemini = getGenAIClient()
    const claude = getClaudeClient()

    // Store 가져오기/생성
    const store = await getOrCreateStore(gemini)
    if (!store?.name) {
      return NextResponse.json(
        { success: false, error: 'File Search Store를 사용할 수 없습니다.' },
        { status: 500 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'

    let markdownContent: string | null = null
    let displayName = file.name

    // PDF 파일인 경우 PDF.co + Claude Vision으로 전처리
    if (ext === 'pdf') {
      console.log('[커리큘럼 업로드] PDF 감지, PDF.co + Claude Vision으로 전처리 시작')

      // PDF.co로 이미지 변환
      const imageUrls = await pdfToImages(buffer, file.name)

      if (imageUrls.length > 0) {
        // Claude Vision으로 마크다운 변환
        markdownContent = await convertWithClaudeVision(claude, imageUrls)
        displayName = `${file.name} (Claude Vision 전처리)`
        console.log(`[커리큘럼 업로드] 전처리 완료: ${imageUrls.length}페이지 → 마크다운`)
      } else {
        console.log('[커리큘럼 업로드] PDF.co 변환 실패, 원본 PDF 업로드')
      }
    }

    // Gemini에 파일 업로드
    const g = gemini as any
    let uploadedFile

    if (markdownContent) {
      // 전처리된 마크다운 업로드
      mdFilePath = join(tmpdir(), `curriculum-${Date.now()}.md`)
      writeFileSync(mdFilePath, markdownContent, 'utf-8')

      uploadedFile = await g.files?.upload?.({
        file: mdFilePath,
        config: {
          mimeType: 'text/markdown',
          displayName,
        },
      })
    } else {
      // 원본 파일 업로드 (PDF 변환 실패 또는 다른 형식)
      const tempPath = join(tmpdir(), `curriculum-${Date.now()}.${ext}`)
      writeFileSync(tempPath, buffer)

      const mimeTypes: Record<string, string> = {
        pdf: 'application/pdf',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
        txt: 'text/plain',
        md: 'text/markdown',
        csv: 'text/csv',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }

      uploadedFile = await g.files?.upload?.({
        file: tempPath,
        config: {
          mimeType: mimeTypes[ext] || 'application/octet-stream',
          displayName: file.name,
        },
      })

      try { unlinkSync(tempPath) } catch { /* 무시 */ }
    }

    if (!uploadedFile?.name) {
      return NextResponse.json(
        { success: false, error: '파일 업로드에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 파일 처리 완료 대기 (최대 60초)
    let fileStatus = uploadedFile.state
    let waitTime = 0
    const maxWait = 60000

    while (fileStatus === 'PROCESSING' && waitTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      waitTime += 2000
      const fileInfo = await g.files?.get?.(uploadedFile.name)
      fileStatus = fileInfo?.state
    }

    // File Search Store에 import
    const importResult = await g.fileSearchStores?.importFile?.({
      fileSearchStoreName: store.name,
      fileName: uploadedFile.name,
    })

    // import 작업 완료 대기
    if (importResult?.name) {
      let opStatus = importResult.done
      waitTime = 0

      while (!opStatus && waitTime < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        waitTime += 2000
        const opInfo = await g.operations?.get?.(importResult.name)
        opStatus = opInfo?.done
      }
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        geminiFileId: uploadedFile.name,
        preprocessed: ext === 'pdf' && !!markdownContent,
      },
    })
  } catch (error) {
    console.error('업로드 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '업로드에 실패했습니다.',
      },
      { status: 500 }
    )
  } finally {
    if (mdFilePath) {
      try { unlinkSync(mdFilePath) } catch { /* 무시 */ }
    }
  }
}
