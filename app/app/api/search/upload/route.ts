/**
 * 문서 업로드 API 엔드포인트
 *
 * POST: 교재/기출 PDF 업로드 및 Gemini File Search 인덱싱
 * DELETE: 문서 삭제
 * GET: 문서 목록 조회
 *
 * 기능:
 * - PDF 파일을 Supabase Storage에 저장
 * - PDF 전처리 (자동/마크다운/Vision 선택 가능)
 * - Gemini File API에 업로드 및 인덱싱
 * - 메타데이터 DB 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  uploadAndIndexDocumentGemini,
  deleteDocumentGemini,
  listDocumentsGemini,
} from '@/lib/gemini-file-search'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { DocumentType, PreprocessMethod, SearchFilter } from '@/types/rag'
import type { Profile, ProfileRole } from '@/types/database'

// 최대 파일 크기 (100MB - Gemini 제한에 맞춤)
const MAX_FILE_SIZE = 100 * 1024 * 1024

// 허용되는 파일 타입
const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
  'image/heif',
]

// 업로드/삭제 권한이 있는 역할
const ALLOWED_ROLES: ProfileRole[] = ['teacher', 'admin', 'super_admin']

// 유효한 문서 유형
const VALID_DOCUMENT_TYPES: DocumentType[] = ['exam', 'textbook', 'mockexam', 'workbook']

// 유효한 전처리 방식
const VALID_PREPROCESS_METHODS: PreprocessMethod[] = ['auto', 'markdown', 'vision']

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
 * 인증 및 권한 확인 헬퍼 함수
 */
async function authenticateAndAuthorize(
  request: NextRequest,
  requireWritePermission: boolean = false
): Promise<{
  error?: NextResponse
  user?: { id: string }
  profile?: Pick<Profile, 'role' | 'academy_id'>
}> {
  const supabase = createServerSupabaseClient()
  const authHeader = request.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      ),
    }
  }

  const token = authHeader.substring(7)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: '유효하지 않은 인증입니다.' },
        { status: 401 }
      ),
    }
  }

  const profile = await getUserProfile(supabase, user.id)

  if (!profile?.academy_id) {
    return {
      error: NextResponse.json(
        { error: '학원 정보를 찾을 수 없습니다.' },
        { status: 400 }
      ),
    }
  }

  if (requireWritePermission && !ALLOWED_ROLES.includes(profile.role)) {
    return {
      error: NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      ),
    }
  }

  return { user, profile }
}

/**
 * POST /api/search/upload
 * 문서 업로드 및 Gemini File Search 인덱싱
 *
 * FormData:
 * - file: PDF/이미지 파일
 * - type: 문서 유형 (exam, textbook, mockexam, workbook)
 * - subject: 과목
 * - grade: 학년
 * - unit: 단원 (선택)
 * - publisher: 출판사 (선택)
 * - year: 출제년도 (선택)
 * - month: 월 (선택)
 * - preprocessMethod: 전처리 방식 (auto, markdown, vision) - 기본값: auto
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 및 권한 확인
    const auth = await authenticateAndAuthorize(request, true)
    if (auth.error) return auth.error

    const { user, profile } = auth

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
    const preprocessMethod = (formData.get('preprocessMethod') as PreprocessMethod) || 'auto'

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
        { error: 'PDF 또는 이미지 파일만 업로드 가능합니다. (PDF, PNG, JPEG, WebP, HEIC)' },
        { status: 400 }
      )
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 100MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 문서 유형 검증
    if (!VALID_DOCUMENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 문서 유형입니다.' },
        { status: 400 }
      )
    }

    // 전처리 방식 검증
    if (!VALID_PREPROCESS_METHODS.includes(preprocessMethod)) {
      return NextResponse.json(
        { error: '유효하지 않은 전처리 방식입니다. (auto, markdown, vision)' },
        { status: 400 }
      )
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 연도/월 파싱
    const year = yearStr ? parseInt(yearStr, 10) : undefined
    const month = monthStr ? parseInt(monthStr, 10) : undefined

    // 업로드 및 인덱싱 (Gemini File Search 사용)
    const document = await uploadAndIndexDocumentGemini(buffer, {
      filename: file.name,
      type,
      subject,
      grade,
      unit: unit || undefined,
      publisher: publisher || undefined,
      year,
      month,
      uploadedBy: user!.id,
      academyId: profile!.academy_id!,
      preprocessMethod,
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

    // 인증 및 권한 확인
    const auth = await authenticateAndAuthorize(request, true)
    if (auth.error) return auth.error

    const { profile } = auth

    // 문서 삭제 (Gemini 및 Storage에서 모두 삭제)
    await deleteDocumentGemini(documentId, profile!.academy_id!)

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
 *
 * Query Parameters:
 * - subject: 과목 필터
 * - grade: 학년 필터
 * - type: 문서 유형 필터
 * - unit: 단원 필터 (부분 일치)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const subject = searchParams.get('subject')
    const grade = searchParams.get('grade')
    const type = searchParams.get('type') as DocumentType | null
    const unit = searchParams.get('unit')

    // 인증 확인
    const auth = await authenticateAndAuthorize(request, false)
    if (auth.error) return auth.error

    const { profile } = auth

    // 필터 생성
    const filter: SearchFilter = {}
    if (subject) filter.subject = subject
    if (grade) filter.grade = grade
    if (type) filter.type = type

    // 문서 목록 조회 (Gemini File Search용)
    const documents = await listDocumentsGemini(profile!.academy_id!, {
      ...filter,
      unit: unit || undefined,
    })

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
