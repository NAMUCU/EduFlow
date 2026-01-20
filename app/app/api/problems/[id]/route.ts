/**
 * 문제 상세 조회, 수정, 삭제 API
 *
 * GET: 문제 상세 조회
 * PUT: 문제 수정
 * DELETE: 문제 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type {
  ProblemStore,
  SavedProblem,
  UpdateProblemRequest,
  ApiResponse,
} from '@/types/problem'

// 데이터 파일 경로
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'saved-problems.json')

/**
 * 데이터 파일 읽기
 */
async function readProblemsData(): Promise<ProblemStore> {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8')
    return JSON.parse(data) as ProblemStore
  } catch (error) {
    return {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      problems: [],
    }
  }
}

/**
 * 데이터 파일 쓰기
 */
async function writeProblemsData(store: ProblemStore): Promise<void> {
  store.lastModified = new Date().toISOString()
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8')
}

/**
 * GET: 문제 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '문제 ID가 필요합니다.',
        },
        { status: 400 }
      )
    }

    const store = await readProblemsData()
    const problem = store.problems.find((p) => p.id === id)

    if (!problem) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '문제를 찾을 수 없습니다.',
          details: `ID: ${id}`,
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse<SavedProblem>>({
      success: true,
      data: problem,
    })
  } catch (error) {
    console.error('문제 상세 조회 오류:', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: '문제를 불러오는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT: 문제 수정
 *
 * Request Body: UpdateProblemRequest
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '문제 ID가 필요합니다.',
        },
        { status: 400 }
      )
    }

    const body: UpdateProblemRequest = await request.json()

    // 수정할 내용이 없는 경우
    if (Object.keys(body).length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '수정할 내용이 없습니다.',
        },
        { status: 400 }
      )
    }

    const store = await readProblemsData()
    const problemIndex = store.problems.findIndex((p) => p.id === id)

    if (problemIndex === -1) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '문제를 찾을 수 없습니다.',
          details: `ID: ${id}`,
        },
        { status: 404 }
      )
    }

    // 객관식으로 변경하는 경우 보기 검증
    const newType = body.type || store.problems[problemIndex].type
    if (newType === 'multiple_choice') {
      const newOptions = body.options || store.problems[problemIndex].options
      if (!newOptions || newOptions.length < 2) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: '객관식 문제는 보기가 필수입니다.',
            details: '최소 2개 이상의 보기를 제공해주세요.',
          },
          { status: 400 }
        )
      }
    }

    // 문제 수정
    const now = new Date().toISOString()
    const updatedProblem: SavedProblem = {
      ...store.problems[problemIndex],
      ...body,
      unit: body.unit !== undefined ? body.unit : store.problems[problemIndex].unit,
      solution: body.solution !== undefined ? body.solution : store.problems[problemIndex].solution,
      options: body.options !== undefined ? body.options : store.problems[problemIndex].options,
      image_url: body.image_url !== undefined ? body.image_url : store.problems[problemIndex].image_url,
      tags: body.tags !== undefined ? body.tags : store.problems[problemIndex].tags,
      updated_at: now,
    }

    store.problems[problemIndex] = updatedProblem

    // 저장
    await writeProblemsData(store)

    return NextResponse.json<ApiResponse<SavedProblem>>({
      success: true,
      data: updatedProblem,
    })
  } catch (error) {
    console.error('문제 수정 오류:', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: '문제를 수정하는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE: 문제 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '문제 ID가 필요합니다.',
        },
        { status: 400 }
      )
    }

    const store = await readProblemsData()
    const problemIndex = store.problems.findIndex((p) => p.id === id)

    if (problemIndex === -1) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '문제를 찾을 수 없습니다.',
          details: `ID: ${id}`,
        },
        { status: 404 }
      )
    }

    // 삭제할 문제 정보 (응답용)
    const deletedProblem = store.problems[problemIndex]

    // 문제 삭제
    store.problems.splice(problemIndex, 1)

    // 저장
    await writeProblemsData(store)

    return NextResponse.json<ApiResponse<{ id: string; message: string }>>({
      success: true,
      data: {
        id: deletedProblem.id,
        message: '문제가 성공적으로 삭제되었습니다.',
      },
    })
  } catch (error) {
    console.error('문제 삭제 오류:', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: '문제를 삭제하는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
