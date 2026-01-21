/**
 * 커리큘럼 RAG Store API
 * File Search Store 정보 조회 및 관리
 */

import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const CURRICULUM_STORE_NAME = 'EduFlow_Curriculum_Store'

function getGenAIClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY 환경변수가 설정되지 않았습니다.')
  }
  return new GoogleGenAI({ apiKey })
}

// Store 정보 조회
export async function GET() {
  try {
    const client = getGenAIClient() as any

    // File Search Store 목록 조회
    const stores = await client.fileSearchStores?.list?.()

    if (!stores) {
      return NextResponse.json({
        success: true,
        store: null,
        files: [],
        message: 'File Search Store API를 사용할 수 없습니다.',
      })
    }

    // 커리큘럼 Store 찾기
    let curriculumStore = null
    const storeList = stores.fileSearchStores || stores || []

    for (const store of storeList) {
      if (store.displayName === CURRICULUM_STORE_NAME || store.name?.includes('curriculum')) {
        curriculumStore = store
        break
      }
    }

    if (!curriculumStore) {
      return NextResponse.json({
        success: true,
        store: null,
        files: [],
      })
    }

    // Store의 파일 목록 조회
    const filesResponse = await client.fileSearchStores?.listFiles?.(curriculumStore.name)
    const files = filesResponse?.files || []

    return NextResponse.json({
      success: true,
      store: {
        name: curriculumStore.name,
        displayName: curriculumStore.displayName,
        fileCount: files.length,
      },
      files: files.map((f: { displayName?: string; name?: string }) => ({
        name: f.displayName || f.name,
        status: 'success',
      })),
    })
  } catch (error) {
    console.error('Store 조회 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Store 조회에 실패했습니다.',
      },
      { status: 500 }
    )
  }
}
