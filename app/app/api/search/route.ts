/**
 * RAG 검색 API 엔드포인트
 *
 * GET: 키워드 기반 간단 검색
 * POST: 복합 조건 검색 (과목, 학년, 단원, 키워드)
 *
 * 기능:
 * - 기출문제/교과서/모의고사 검색
 * - 필터 조건 적용
 * - 검색 결과 스트리밍 (async-defer-await 패턴)
 * - LRU 캐시를 통한 빠른 응답
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchDocuments, streamSearchResults, listDocuments } from '@/lib/rag'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { SearchRequest, SearchFilter, DocumentType } from '@/types/rag'
import type { Profile } from '@/types/database'

// 스트리밍을 위한 엔코더
const encoder = new TextEncoder()

/**
 * 사용자의 학원 ID를 조회하는 헬퍼 함수
 */
async function getUserAcademyId(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string
): Promise<string | null> {
  // profiles 테이블에서 academy_id 조회
  const { data } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', userId)
    .single()

  // 타입 단언
  const profile = data as Pick<Profile, 'academy_id'> | null
  return profile?.academy_id ?? null
}

/**
 * GET /api/search?q=검색어&subject=수학&grade=고1
 * 키워드 기반 간단 검색
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const subject = searchParams.get('subject')
    const grade = searchParams.get('grade')
    const unit = searchParams.get('unit')
    const type = searchParams.get('type') as DocumentType | null
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const stream = searchParams.get('stream') === 'true'

    // 인증 확인
    const supabase = createServerSupabaseClient()
    const authHeader = request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 인증입니다.' },
        { status: 401 }
      )
    }

    // 사용자의 학원 ID 조회
    const academyId = await getUserAcademyId(supabase, user.id)

    if (!academyId) {
      return NextResponse.json(
        { error: '학원 정보를 찾을 수 없습니다.' },
        { status: 400 }
      )
    }

    // 검색어 없이 목록 조회
    if (!query) {
      const filter: SearchFilter = {}
      if (subject) filter.subject = subject
      if (grade) filter.grade = grade
      if (type) filter.type = type
      if (unit) filter.unit = unit

      const documents = await listDocuments(academyId, filter)
      return NextResponse.json({
        success: true,
        data: documents,
        total: documents.length,
      })
    }

    // 검색 요청 생성
    const searchRequest: SearchRequest = {
      query,
      filter: {
        subject: subject || undefined,
        grade: grade || undefined,
        unit: unit || undefined,
        type: type || undefined,
      },
      limit,
      offset,
    }

    // 스트리밍 모드
    if (stream) {
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const generator = streamSearchResults(searchRequest, academyId)

            for await (const result of generator) {
              const data = JSON.stringify(result) + '\n'
              controller.enqueue(encoder.encode(`data: ${data}\n`))
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '검색 중 오류 발생'
            controller.enqueue(encoder.encode(`data: {"error": "${errorMessage}"}\n\n`))
            controller.close()
          }
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // 일반 검색 (비스트리밍)
    const result = await searchDocuments(searchRequest, academyId)

    return NextResponse.json({
      success: true,
      data: result.results,
      total: result.total,
      took: result.took,
      query: result.query,
    })
  } catch (error: unknown) {
    console.error('검색 API 에러:', error)
    const errorMessage = error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/search
 * 복합 조건 검색
 *
 * Body:
 * {
 *   "query": "이차함수",
 *   "filter": {
 *     "subject": "수학",
 *     "grade": "고1",
 *     "unit": "이차함수",
 *     "type": "exam",
 *     "yearFrom": 2020,
 *     "yearTo": 2024,
 *     "publisher": "EBS"
 *   },
 *   "limit": 10,
 *   "offset": 0
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, filter, limit = 10, offset = 0, stream = false } = body

    if (!query) {
      return NextResponse.json(
        { error: '검색어를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 인증 확인
    const supabase = createServerSupabaseClient()
    const authHeader = request.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 인증입니다.' },
        { status: 401 }
      )
    }

    // 사용자의 학원 ID 조회
    const academyId = await getUserAcademyId(supabase, user.id)

    if (!academyId) {
      return NextResponse.json(
        { error: '학원 정보를 찾을 수 없습니다.' },
        { status: 400 }
      )
    }

    // 검색 요청 생성
    const searchRequest: SearchRequest = {
      query,
      filter: filter || {},
      limit,
      offset,
    }

    // 스트리밍 모드
    if (stream) {
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const generator = streamSearchResults(searchRequest, academyId)

            for await (const result of generator) {
              const data = JSON.stringify(result) + '\n'
              controller.enqueue(encoder.encode(`data: ${data}\n`))
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '검색 중 오류 발생'
            controller.enqueue(encoder.encode(`data: {"error": "${errorMessage}"}\n\n`))
            controller.close()
          }
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // 일반 검색 (비스트리밍)
    const result = await searchDocuments(searchRequest, academyId)

    return NextResponse.json({
      success: true,
      data: result.results,
      total: result.total,
      took: result.took,
      query: result.query,
    })
  } catch (error: unknown) {
    console.error('검색 API 에러:', error)
    const errorMessage = error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
