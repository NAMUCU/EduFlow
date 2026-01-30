/**
 * pgvector RAG 검색 API
 * POST /api/rag/search
 *
 * 인증 필수 + Rate Limiting (분당 30회)
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchDocuments } from '@/lib/rag-pgvector';
import { getApiUser, canAccessAcademy, type ApiUser } from '@/lib/api-auth';
import { createRateLimiter } from '@/lib/rate-limiter';
import type { VectorSearchRequest, SearchFilters } from '@/types/pgvector-rag';

// Rate Limiter 설정 (분당 30회)
const rateLimiter = createRateLimiter('search');

export async function POST(request: NextRequest) {
  // 1. Rate Limiting 체크
  const rateLimitResponse = rateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // 2. 인증 체크
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const {
      query,
      academyId,
      topK = 10,
      threshold = 0.7,
      filters = {},
      useHybrid = false,
      vectorWeight = 0.7,
    } = body as VectorSearchRequest;

    // 필수 파라미터 검증
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '검색어(query)가 필요합니다.', code: 'INVALID_QUERY' },
        { status: 400 }
      );
    }

    if (!academyId || typeof academyId !== 'string') {
      return NextResponse.json(
        { error: '학원 ID(academyId)가 필요합니다.', code: 'INVALID_ACADEMY_ID' },
        { status: 400 }
      );
    }

    // 3. 학원 접근 권한 체크
    if (!canAccessAcademy(user, academyId)) {
      return NextResponse.json(
        { error: '해당 학원에 대한 접근 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 검색 실행
    const response = await searchDocuments({
      query,
      academyId,
      topK: Math.min(topK, 50), // 최대 50개 제한
      threshold: Math.max(0, Math.min(1, threshold)),
      filters: filters as SearchFilters,
      useHybrid,
      vectorWeight,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('RAG 검색 오류:', error);
    return NextResponse.json(
      {
        error: '검색 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
