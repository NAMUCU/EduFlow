/**
 * 통합 RAG API (투 트랙: pgvector / Gemini File Search)
 * POST /api/rag/unified
 *
 * 기존 Gemini File Search와 새로운 pgvector를 모두 지원
 * method 파라미터로 선택 가능
 *
 * 인증 필수 + Rate Limiting (분당 30회)
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchDocuments as pgvectorSearch, generateWithRAG } from '@/lib/rag-pgvector';
import { searchDocuments as geminiSearch, streamRagChat } from '@/lib/rag';
import { getApiUser, canAccessAcademy } from '@/lib/api-auth';
import { createRateLimiter } from '@/lib/rate-limiter';
import type { VectorSearchRequest, SearchFilters } from '@/types/pgvector-rag';
import type { SearchRequest } from '@/types/rag';

// Rate Limiter 설정 (분당 30회)
const rateLimiter = createRateLimiter('search');

type RAGMethod = 'pgvector' | 'gemini' | 'auto';

interface UnifiedRAGRequest {
  /** RAG 방식 선택 */
  method: RAGMethod;
  /** 검색 쿼리 */
  query: string;
  /** 학원 ID */
  academyId: string;
  /** 작업 유형 */
  action: 'search' | 'generate' | 'chat';
  /** 검색 옵션 */
  searchOptions?: {
    topK?: number;
    threshold?: number;
    filters?: SearchFilters;
    useHybrid?: boolean;
  };
  /** 생성 옵션 */
  generateOptions?: {
    model?: 'gemini' | 'openai' | 'claude';
    systemPrompt?: string;
    stream?: boolean;
  };
}

/**
 * 자동 방식 선택 로직
 * - 문서가 pgvector로 인덱싱되어 있으면 pgvector 사용
 * - 그렇지 않으면 Gemini File Search 사용
 */
async function selectMethod(academyId: string): Promise<'pgvector' | 'gemini'> {
  // TODO: 실제로는 DB에서 pgvector 인덱싱 여부 확인
  // 지금은 기본적으로 pgvector 우선
  return 'pgvector';
}

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
    const body = await request.json() as UnifiedRAGRequest;

    const {
      method = 'auto',
      query,
      academyId,
      action = 'search',
      searchOptions = {},
      generateOptions = {},
    } = body;

    // 필수 파라미터 검증
    if (!query) {
      return NextResponse.json(
        { error: '검색어(query)가 필요합니다.', code: 'INVALID_QUERY' },
        { status: 400 }
      );
    }

    if (!academyId) {
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

    // 방식 결정
    const selectedMethod = method === 'auto'
      ? await selectMethod(academyId)
      : method;

    // 검색 실행
    if (action === 'search') {
      if (selectedMethod === 'pgvector') {
        // pgvector 검색
        const result = await pgvectorSearch({
          query,
          academyId,
          topK: searchOptions.topK || 10,
          threshold: searchOptions.threshold || 0.7,
          filters: searchOptions.filters,
          useHybrid: searchOptions.useHybrid,
        });

        return NextResponse.json({
          success: true,
          method: 'pgvector',
          data: result,
        });
      } else {
        // Gemini File Search
        const result = await geminiSearch(
          {
            query,
            filters: searchOptions.filters,
            limit: searchOptions.topK || 10,
          } as SearchRequest,
          academyId
        );

        return NextResponse.json({
          success: true,
          method: 'gemini',
          data: result,
        });
      }
    }

    // RAG 생성
    if (action === 'generate') {
      if (selectedMethod === 'pgvector') {
        const result = await generateWithRAG({
          query,
          academyId,
          searchConfig: {
            topK: searchOptions.topK || 5,
            threshold: searchOptions.threshold || 0.7,
            filters: searchOptions.filters,
            useHybrid: searchOptions.useHybrid,
          },
          generateModel: generateOptions.model || 'gemini',
          systemPrompt: generateOptions.systemPrompt,
        });

        return NextResponse.json({
          success: true,
          method: 'pgvector',
          data: result,
        });
      } else {
        // Gemini File Search + 생성 (기존 로직 활용)
        // streamRagChat은 스트리밍이므로 여기서는 전체 수집
        const chunks: string[] = [];
        const generator = streamRagChat(query, academyId);

        for await (const chunk of generator) {
          if (typeof chunk === 'string') {
            chunks.push(chunk);
          }
        }

        return NextResponse.json({
          success: true,
          method: 'gemini',
          data: {
            answer: chunks.join(''),
            sources: [], // Gemini 방식에서는 별도 추출 필요
          },
        });
      }
    }

    // 스트리밍 채팅
    if (action === 'chat' && generateOptions.stream) {
      const encoder = new TextEncoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            if (selectedMethod === 'pgvector') {
              const { streamWithRAG } = await import('@/lib/rag-pgvector');
              const generator = streamWithRAG({
                query,
                academyId,
                searchConfig: {
                  topK: searchOptions.topK || 5,
                  filters: searchOptions.filters,
                },
                generateModel: generateOptions.model || 'gemini',
                systemPrompt: generateOptions.systemPrompt,
              });

              for await (const chunk of generator) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: chunk, method: 'pgvector' })}\n\n`)
                );
              }
            } else {
              const generator = streamRagChat(query, academyId);

              for await (const chunk of generator) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: chunk, method: 'gemini' })}\n\n`)
                );
              }
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    return NextResponse.json(
      { error: '지원하지 않는 action입니다. (search, generate, chat)', code: 'INVALID_ACTION' },
      { status: 400 }
    );
  } catch (error) {
    console.error('통합 RAG 오류:', error);
    return NextResponse.json(
      {
        error: 'RAG 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
