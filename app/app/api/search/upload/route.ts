/**
 * 문서 업로드 API 엔드포인트
 *
 * POST: 교재/기출 PDF 업로드 및 인덱싱
 * DELETE: 문서 삭제
 *
 * 기능:
 * - PDF 파일을 Supabase Storage에 저장
 * - OpenAI Vector Store에 인덱싱
 * - 메타데이터 DB 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import { uploadAndIndexDocument, deleteDocument, listDocuments } from '@/lib/rag'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { DocumentType, SearchFilter } from '@/types/rag'
import type { Profile, ProfileRole } from '@/types/database'

// 최대 파일 크기 (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024

// 허용되는 파일 타입
const ALLOWED_TYPES = ['application/pdf']

// 업로드/삭제 권한이 있는 역할
const ALLOWED_ROLES: ProfileRole[] = ['teacher', 'admin', 'super_admin']

/**
 * 사용자 프로필을 조회하는 헬퍼 함수
 */
async function getUserProfile(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string
): Promise<Pick<Profile, 'role' | 'academy_id'> | null> {
  const { data } = await supabase
    .from('profiles')
    .select('role, academy_id')
    .eq('id', userId)
    .single()

  return data as Pick<Profile, 'role' | 'academy_id'> | null
}

/**
 * POST /api/search/upload
 * 문서 업로드 및 인덱싱
 *
 * FormData:
 * - file: PDF 파일
 * - type: 문서 유형 (exam, textbook, mockexam, workbook)
 * - subject: 과목
 * - grade: 학년
 * - unit: 단원 (선택)
 * - publisher: 출판사 (선택)
 * - year: 출제년도 (선택)
 * - month: 월 (선택)
 */
export async function POST(request: NextRequest) {
  try {
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

    // 권한 확인 (선생님 또는 관리자만 업로드 가능)
    const profile = await getUserProfile(supabase, user.id)

    if (!profile?.academy_id) {
      return NextResponse.json(
        { error: '학원 정보를 찾을 수 없습니다.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.json(
        { error: '문서 업로드 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // FormData 파싱
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as DocumentType | null
    const subject = formData.get('subject') as string | null
    const grade = formData.get('grade') as string | null
    const unit = formData.get('unit') as string | null
    const publisher = formData.get('publisher') as string | null
    const yearStr = formData.get('year') as string | null
    const monthStr = formData.get('month') as string | null

    // 필수 필드 검증
    if (!file) {
      return NextResponse.json(
        { error: '파일을 선택해주세요.' },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { error: '문서 유형을 선택해주세요.' },
        { status: 400 }
      )
    }

    if (!subject) {
      return NextResponse.json(
        { error: '과목을 선택해주세요.' },
        { status: 400 }
      )
    }

    if (!grade) {
      return NextResponse.json(
        { error: '학년을 선택해주세요.' },
        { status: 400 }
      )
    }

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'PDF 파일만 업로드 가능합니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 50MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 문서 유형 검증
    const validTypes: DocumentType[] = ['exam', 'textbook', 'mockexam', 'workbook']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 문서 유형입니다.' },
        { status: 400 }
      )
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 연도/월 파싱
    const year = yearStr ? parseInt(yearStr, 10) : undefined
    const month = monthStr ? parseInt(monthStr, 10) : undefined

    // 업로드 및 인덱싱
    const document = await uploadAndIndexDocument(buffer, file.name, {
      filename: file.name,
      type,
      subject,
      grade,
      unit: unit || undefined,
      publisher: publisher || undefined,
      year,
      month,
      uploaded_by: user.id,
      academy_id: profile.academy_id,
      storage_path: '', // uploadAndIndexDocument에서 설정
    })

    return NextResponse.json({
      success: true,
      message: '문서가 성공적으로 업로드되었습니다.',
      document,
    })
  } catch (error: unknown) {
    console.error('문서 업로드 에러:', error)
    const errorMessage = error instanceof Error ? error.message : '문서 업로드 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/search/upload?id=문서ID
 * 문서 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json(
        { error: '문서 ID가 필요합니다.' },
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

    // 권한 확인 (선생님 또는 관리자만 삭제 가능)
    const profile = await getUserProfile(supabase, user.id)

    if (!profile?.academy_id) {
      return NextResponse.json(
        { error: '학원 정보를 찾을 수 없습니다.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.json(
        { error: '문서 삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 문서 삭제
    await deleteDocument(documentId, profile.academy_id)

    return NextResponse.json({
      success: true,
      message: '문서가 성공적으로 삭제되었습니다.',
    })
  } catch (error: unknown) {
    console.error('문서 삭제 에러:', error)
    const errorMessage = error instanceof Error ? error.message : '문서 삭제 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * GET /api/search/upload
 * 업로드된 문서 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const subject = searchParams.get('subject')
    const grade = searchParams.get('grade')
    const type = searchParams.get('type') as DocumentType | null

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
    const profile = await getUserProfile(supabase, user.id)

    if (!profile?.academy_id) {
      return NextResponse.json(
        { error: '학원 정보를 찾을 수 없습니다.' },
        { status: 400 }
      )
    }

    // 필터 생성
    const filter: SearchFilter = {}
    if (subject) filter.subject = subject
    if (grade) filter.grade = grade
    if (type) filter.type = type

    // 문서 목록 조회
    const documents = await listDocuments(profile.academy_id, filter)

    return NextResponse.json({
      success: true,
      data: documents,
      total: documents.length,
    })
  } catch (error: unknown) {
    console.error('문서 목록 조회 에러:', error)
    const errorMessage = error instanceof Error ? error.message : '문서 목록 조회 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
