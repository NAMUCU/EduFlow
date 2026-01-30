/**
 * pgvector RAG 통계 API
 * GET /api/rag/stats - 학원별 인덱싱 통계 조회
 *
 * 인증 필수
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAcademyChunkStats, getUnindexedDocuments } from '@/lib/rag-pgvector';
import { getApiUser, canAccessAcademy } from '@/lib/api-auth';

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
    const includeUnindexed = searchParams.get('includeUnindexed') === 'true';

    if (!academyId) {
      return NextResponse.json(
        { error: '학원 ID(academyId)가 필요합니다.', code: 'INVALID_ACADEMY_ID' },
        { status: 400 }
      );
    }

    // 2. 학원 접근 권한 체크
    if (!canAccessAcademy(user, academyId)) {
      return NextResponse.json(
        { error: '해당 학원에 대한 접근 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 기본 통계 조회
    const stats = await getAcademyChunkStats(academyId);

    // 인덱싱되지 않은 문서 목록 (옵션)
    let unindexedDocuments = null;
    if (includeUnindexed) {
      unindexedDocuments = await getUnindexedDocuments(academyId);
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        unindexedDocuments,
      },
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    return NextResponse.json(
      {
        error: '통계 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
