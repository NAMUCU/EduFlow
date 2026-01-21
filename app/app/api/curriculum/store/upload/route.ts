/**
 * 커리큘럼 문서 업로드 API
 * Claude Vision으로 전처리 후 File Search Store에 업로드
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, unlinkSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { execSync } from 'child_process'

const CURRICULUM_STORE_NAME = 'EduFlow_Curriculum_Store'

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

// PDF를 이미지로 변환 (pdf-poppler 또는 pdftoppm 사용)
async function pdfToImages(pdfPath: string): Promise<string[]> {
  const outputDir = join(tmpdir(), `pdf-images-${Date.now()}`)
  execSync(`mkdir -p "${outputDir}"`)

  try {
    // pdftoppm 사용 (poppler-utils 필요)
    execSync(`pdftoppm -png -r 150 "${pdfPath}" "${outputDir}/page"`)

    // 생성된 이미지 파일 목록
    const files = execSync(`ls "${outputDir}"/*.png 2>/dev/null || true`)
      .toString()
      .trim()
      .split('\n')
      .filter(f => f)

    return files
  } catch (error) {
    console.error('PDF → 이미지 변환 실패:', error)
    return []
  }
}

// Claude Vision으로 이미지를 마크다운으로 변환 (병렬 처리 - async-parallel)
async function convertWithClaudeVision(
  claude: Anthropic,
  imagePaths: string[]
): Promise<string> {
  // 병렬로 모든 페이지 처리
  const results = await Promise.all(
    imagePaths.map(async (imagePath, i) => {
      const imageData = readFileSync(imagePath)
      const base64 = imageData.toString('base64')

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
                    type: 'base64',
                    media_type: 'image/png',
                    data: base64,
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
  let tempFilePath: string | null = null
  let mdFilePath: string | null = null
  const imagePaths: string[] = []

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

    // 파일을 임시 경로에 저장
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    tempFilePath = join(tmpdir(), `curriculum-upload-${Date.now()}.${ext}`)
    writeFileSync(tempFilePath, buffer)

    let uploadPath = tempFilePath
    let mimeType = 'application/octet-stream'
    let displayName = file.name

    // PDF 파일인 경우 Claude Vision으로 전처리
    if (ext === 'pdf') {
      console.log('[커리큘럼 업로드] PDF 감지, Claude Vision으로 전처리 시작')

      // PDF → 이미지 변환
      const images = await pdfToImages(tempFilePath)
      imagePaths.push(...images)

      if (images.length > 0) {
        // Claude Vision으로 마크다운 변환
        const markdown = await convertWithClaudeVision(claude, images)

        // 마크다운 파일로 저장
        mdFilePath = tempFilePath.replace('.pdf', '.md')
        writeFileSync(mdFilePath, markdown, 'utf-8')

        uploadPath = mdFilePath
        mimeType = 'text/markdown'
        displayName = `${file.name} (Claude Vision 전처리)`

        console.log(`[커리큘럼 업로드] 전처리 완료: ${images.length}페이지 → 마크다운`)
      }
    } else {
      // 다른 파일은 그대로 업로드
      const mimeTypes: Record<string, string> = {
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
        txt: 'text/plain',
        md: 'text/markdown',
        csv: 'text/csv',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }
      mimeType = mimeTypes[ext] || 'application/octet-stream'
    }

    // Gemini에 파일 업로드
    const g = gemini as any
    const uploadedFile = await g.files?.upload?.({
      file: uploadPath,
      config: {
        mimeType,
        displayName,
      },
    })

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
        preprocessed: ext === 'pdf',
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
    // 임시 파일들 삭제
    if (tempFilePath) {
      try { unlinkSync(tempFilePath) } catch { /* 무시 */ }
    }
    if (mdFilePath) {
      try { unlinkSync(mdFilePath) } catch { /* 무시 */ }
    }
    for (const imgPath of imagePaths) {
      try { unlinkSync(imgPath) } catch { /* 무시 */ }
    }
  }
}
