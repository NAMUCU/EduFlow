/**
 * 커리큘럼 개념자료 생성 API
 * POST: 단일/배치 생성
 * GET: 단원 목록 조회
 * DELETE: 단원 콘텐츠 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateConceptContent, generateBatchContents, ConceptContent } from '@/lib/curriculum-generator'
import { ALL_MATH_UNITS, getUnitById, getUnitsByGrade } from '@/data/curriculum/math'
import { GradeLevel, GRADE_LABELS } from '@/types/curriculum'
import { createServerSupabaseClient } from '@/lib/supabase'

// 커리큘럼 콘텐츠 DB 레코드 타입
interface CurriculumContentRecord {
  unit_id: string
  id: string
  title: string
  summary: string
  core_concepts: ConceptContent['core_concepts']
  advanced_topics: ConceptContent['advanced_topics']
  common_mistakes: ConceptContent['common_mistakes']
  problem_solving_tips: ConceptContent['problem_solving_tips']
  connections: ConceptContent['connections']
  visualizations: ConceptContent['visualizations']
  difficulty_level: string
  created_at: string
  updated_at: string
}

// 콘텐츠를 DB 레코드 형태로 변환하는 헬퍼 함수
function toDbRecord(content: ConceptContent): CurriculumContentRecord {
  return {
    id: content.id,
    unit_id: content.unit_id,
    title: content.title,
    summary: content.summary,
    core_concepts: content.core_concepts,
    advanced_topics: content.advanced_topics,
    common_mistakes: content.common_mistakes,
    problem_solving_tips: content.problem_solving_tips,
    connections: content.connections,
    visualizations: content.visualizations,
    difficulty_level: content.difficulty_level,
    created_at: content.created_at,
    updated_at: content.updated_at,
  }
}

// DB에 콘텐츠 저장 (upsert)
async function saveContentToDb(
  contents: ConceptContent | ConceptContent[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()
    const records = Array.isArray(contents)
      ? contents.map(toDbRecord)
      : [toDbRecord(contents)]

    const { error } = await (supabase as any)
      .from('curriculum_contents')
      .upsert(records, { onConflict: 'unit_id' })

    if (error) {
      console.error('DB 저장 오류:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'DB 저장 중 알 수 없는 오류'
    console.error('DB 저장 예외:', err)
    return { success: false, error: errorMessage }
  }
}

// GET: 단원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const grade = searchParams.get('grade') as GradeLevel | null
    const includeContent = searchParams.get('includeContent') === 'true'

    // 학년별 또는 전체 단원 조회 (동기 작업)
    const units = grade ? getUnitsByGrade(grade) : ALL_MATH_UNITS

    // 콘텐츠 포함 여부
    if (includeContent) {
      // Supabase 클라이언트 생성과 단원 ID 추출을 병렬로 준비
      const [supabase, unitIds] = await Promise.all([
        Promise.resolve(createServerSupabaseClient()),
        Promise.resolve(units.map(u => u.id)),
      ])

      const { data: contents, error } = await (supabase as any)
        .from('curriculum_contents')
        .select('*')
        .in('unit_id', unitIds)

      if (error) {
        console.error('콘텐츠 조회 오류:', error)
        // 에러가 발생해도 콘텐츠 없이 단원 목록은 반환
      }

      const contentsMap = new Map(
        ((contents as CurriculumContentRecord[] | null) || []).map(c => [c.unit_id, c])
      )

      const unitsWithContent = units.map(unit => ({
        ...unit,
        gradeLabel: GRADE_LABELS[unit.grade],
        hasContent: contentsMap.has(unit.id),
        content: contentsMap.get(unit.id) || null,
      }))

      return NextResponse.json({
        success: true,
        data: {
          units: unitsWithContent,
          total: units.length,
          withContent: unitsWithContent.filter(u => u.hasContent).length,
        },
      })
    }

    // 기본: 단원 목록만
    return NextResponse.json({
      success: true,
      data: {
        units: units.map(unit => ({
          ...unit,
          gradeLabel: GRADE_LABELS[unit.grade],
        })),
        total: units.length,
        grades: Object.entries(GRADE_LABELS).map(([key, label]) => ({
          value: key,
          label,
          count: getUnitsByGrade(key as GradeLevel).length,
        })),
      },
    })
  } catch (error) {
    console.error('단원 목록 조회 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '단원 목록을 불러오는 데 실패했습니다.'
      },
      { status: 500 }
    )
  }
}

// POST: 개념자료 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { unit_id, unit_ids, save_to_db = true } = body

    // 단일 생성
    if (unit_id) {
      const unit = getUnitById(unit_id)
      if (!unit) {
        return NextResponse.json(
          { success: false, error: '해당 단원을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      const content = await generateConceptContent(unit.id, unit.grade, unit.name)

      // DB 저장과 응답 데이터 준비를 병렬로 처리
      const [dbResult, responseUnit] = await Promise.all([
        save_to_db
          ? saveContentToDb(content)
          : Promise.resolve({ success: true, error: undefined as string | undefined }),
        Promise.resolve({
          ...unit,
          gradeLabel: GRADE_LABELS[unit.grade],
        }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          content,
          unit: responseUnit,
          dbSaved: dbResult.success,
          ...(dbResult.error ? { dbError: dbResult.error } : {}),
        },
      })
    }

    // 배치 생성
    if (unit_ids && Array.isArray(unit_ids)) {
      const units = unit_ids
        .map(id => getUnitById(id))
        .filter((u): u is NonNullable<typeof u> => u !== undefined)
        .map(u => ({ unitId: u.id, grade: u.grade, unitName: u.name }))

      if (units.length === 0) {
        return NextResponse.json(
          { success: false, error: '유효한 단원이 없습니다.' },
          { status: 400 }
        )
      }

      const { success: generatedContents, failed } = await generateBatchContents(units)

      // DB 저장 (성공한 콘텐츠가 있을 때만)
      let dbResult: { success: boolean; error?: string } = { success: true }
      if (save_to_db && generatedContents.length > 0) {
        dbResult = await saveContentToDb(generatedContents)
      }

      return NextResponse.json({
        success: true,
        data: {
          generated: generatedContents.length,
          failed: failed.length,
          contents: generatedContents,
          errors: failed,
          dbSaved: dbResult.success,
          ...(dbResult.error ? { dbError: dbResult.error } : {}),
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'unit_id 또는 unit_ids가 필요합니다.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('개념자료 생성 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '생성에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}

// DELETE: 단원 콘텐츠 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unitId')

    if (!unitId) {
      return NextResponse.json(
        { success: false, error: 'unitId가 필요합니다.' },
        { status: 400 }
      )
    }

    // 단원 존재 확인
    const unit = getUnitById(unitId)
    if (!unit) {
      return NextResponse.json(
        { success: false, error: '해당 단원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // DB에서 삭제
    const supabase = createServerSupabaseClient()
    const { error } = await (supabase as any)
      .from('curriculum_contents')
      .delete()
      .eq('unit_id', unitId)

    if (error) {
      console.error('콘텐츠 삭제 오류:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '콘텐츠가 삭제되었습니다.',
      data: {
        unitId,
        unitName: unit.name,
      },
    })
  } catch (error) {
    console.error('콘텐츠 삭제 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '삭제에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}
