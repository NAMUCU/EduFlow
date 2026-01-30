/**
 * pgvector RAG 생성 API
 * POST /api/rag/generate - RAG 기반 응답 생성
 *
 * 인증 필수 + Rate Limiting (분당 10회)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateWithRAG, streamWithRAG } from '@/lib/rag-pgvector';
import { getApiUser, canAccessAcademy } from '@/lib/api-auth';
import { createRateLimiter } from '@/lib/rate-limiter';
import type { RAGGenerateRequest } from '@/types/pgvector-rag';

// Rate Limiter 설정 (분당 10회 - 생성은 더 엄격하게)
const rateLimiter = createRateLimiter('generate');

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
      searchConfig = {},
      generateModel = 'gemini',
      stream = false,
      systemPrompt,
    } = body as RAGGenerateRequest;

    // 필수 파라미터 검증
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '질문(query)이 필요합니다.', code: 'INVALID_QUERY' },
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

    // 스트리밍 응답
    if (stream) {
      const encoder = new TextEncoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const generator = streamWithRAG({
              query,
              academyId,
              searchConfig,
              generateModel,
              systemPrompt,
            });

            for await (const chunk of generator) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
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

    // 일반 응답
    const response = await generateWithRAG({
      query,
      academyId,
      searchConfig,
      generateModel,
      systemPrompt,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('RAG 생성 오류:', error);
    return NextResponse.json(
      {
        error: 'RAG 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
