/**
 * RAG 지식 관리 API
 * GET /api/rag/knowledge - 저장된 지식 목록 조회
 * GET /api/rag/knowledge?checkDuplicate=true&filename=xxx - 중복 체크
 *
 * 인증 필수
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getApiUser, canAccessAcademy } from '@/lib/api-auth';

// Lazy Supabase 클라이언트
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export async function GET(request: NextRequest) {
  // 1. 인증 체크
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId');
    const includePublic = searchParams.get('includePublic') === 'true';
    const checkDuplicate = searchParams.get('checkDuplicate') === 'true';
    const filename = searchParams.get('filename');
    const subject = searchParams.get('subject');
    const grade = searchParams.get('grade');
    const type = searchParams.get('type');

    const supabase = getSupabase();

    // 중복 체크 모드
    if (checkDuplicate && filename) {
      const { data: existing, error } = await (supabase
        .from('rag_documents') as any)
        .select('id, filename, subject, grade, academy_id')
        .or(`filename.eq.${filename},academy_id.is.null${academyId ? `,academy_id.eq.${academyId}` : ''}`)
        .eq('filename', filename);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        isDuplicate: existing && existing.length > 0,
        existingDocuments: existing || [],
      });
    }

    // 지식 목록 조회
    let query = (supabase.from('rag_documents') as any)
      .select(`
        id,
        filename,
        type,
        subject,
        grade,
        unit,
        year,
        academy_id,
        status,
        file_size,
        pgvector_indexed,
        chunk_count,
        created_at,
        pgvector_indexed_at
      `)
      .order('created_at', { ascending: false });

    // 학원 필터 (공용 자료 포함 옵션)
    if (academyId) {
      if (includePublic) {
        query = query.or(`academy_id.eq.${academyId},academy_id.is.null`);
      } else {
        query = query.eq('academy_id', academyId);
      }
    } else if (user.role === 'super_admin') {
      // Super Admin은 모든 자료 조회 가능
    } else {
      // 공용 자료만
      query = query.is('academy_id', null);
    }

    // 추가 필터
    if (subject) {
      query = query.eq('subject', subject);
    }
    if (grade) {
      query = query.eq('grade', grade);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data: documents, error: docError } = await query;

    if (docError) {
      throw docError;
    }

    // 통계 계산
    const stats = {
      totalDocuments: documents?.length || 0,
      indexedDocuments: documents?.filter((d: any) => d.pgvector_indexed).length || 0,
      totalChunks: documents?.reduce((sum: number, d: any) => sum + (d.chunk_count || 0), 0) || 0,
      bySubject: {} as Record<string, number>,
      byGrade: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      publicCount: documents?.filter((d: any) => !d.academy_id).length || 0,
    };

    documents?.forEach((doc: any) => {
      if (doc.subject) {
        stats.bySubject[doc.subject] = (stats.bySubject[doc.subject] || 0) + 1;
      }
      if (doc.grade) {
        stats.byGrade[doc.grade] = (stats.byGrade[doc.grade] || 0) + 1;
      }
      if (doc.type) {
        stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        documents: documents || [],
        stats,
      },
    });
  } catch (error) {
    console.error('지식 목록 조회 오류:', error);
    return NextResponse.json(
      {
        error: '지식 목록 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
