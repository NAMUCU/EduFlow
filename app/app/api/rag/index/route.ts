/**
 * pgvector RAG 인덱싱 API
 * POST /api/rag/index - 문서 인덱싱
 * DELETE /api/rag/index - 인덱스 삭제
 *
 * 인증 필수 + Rate Limiting (분당 10회)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { indexDocument, deleteDocumentChunks } from '@/lib/rag-pgvector';
import { getApiUser, canAccessAcademy } from '@/lib/api-auth';
import { createRateLimiter } from '@/lib/rate-limiter';
import type { ChunkMetadata, ChunkingConfig, EmbeddingConfig } from '@/types/pgvector-rag';

// Rate Limiter 설정 (분당 10회)
const rateLimiter = createRateLimiter('generate');

// Lazy Supabase 클라이언트 초기화
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

/**
 * 문서 인덱싱 (청크 분할 + 임베딩 생성 + 저장)
 */
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
      documentId,
      content,
      academyId,
      metadata = {},
      config = {},
    } = body as {
      documentId: string;
      content?: string;
      academyId: string;
      metadata?: Partial<ChunkMetadata>;
      config?: {
        chunking?: Partial<ChunkingConfig>;
        embedding?: Partial<EmbeddingConfig>;
      };
    };

    // 필수 파라미터 검증
    if (!documentId) {
      return NextResponse.json(
        { error: '문서 ID(documentId)가 필요합니다.', code: 'INVALID_DOCUMENT_ID' },
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

    const supabase = getSupabase();

    // content가 없으면 DB에서 조회 시도
    let textContent = content;

    if (!textContent) {
      // rag_documents에서 storage_path 조회 후 파일 읽기
      const { data: doc, error: docError } = await (supabase
        .from('rag_documents') as any)
        .select('storage_path, filename')
        .eq('id', documentId)
        .single();

      if (docError || !doc) {
        return NextResponse.json(
          { error: '문서를 찾을 수 없습니다.', code: 'DOCUMENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Storage에서 파일 다운로드
      if (doc.storage_path) {
        const { data: fileData, error: fileError } = await supabase.storage
          .from('documents')
          .download(doc.storage_path);

        if (fileError || !fileData) {
          return NextResponse.json(
            { error: '파일을 다운로드할 수 없습니다.', code: 'FILE_DOWNLOAD_FAILED' },
            { status: 500 }
          );
        }

        // PDF인 경우 텍스트 추출 필요 (여기서는 텍스트 파일만 처리)
        textContent = await fileData.text();

        // 메타데이터에 파일명 추가
        if (!metadata.source_filename) {
          metadata.source_filename = doc.filename;
        }
      }
    }

    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json(
        { error: '인덱싱할 콘텐츠가 없습니다.', code: 'NO_CONTENT' },
        { status: 400 }
      );
    }

    // 인덱싱 실행
    const result = await indexDocument(
      documentId,
      textContent,
      academyId,
      metadata,
      config
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '인덱싱 실패', code: 'INDEXING_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        documentId: result.documentId,
        chunkCount: result.chunkCount,
        totalTokens: result.totalTokens,
        processingTimeMs: result.processingTimeMs,
      },
    });
  } catch (error) {
    console.error('인덱싱 오류:', error);
    return NextResponse.json(
      {
        error: '인덱싱 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 문서 인덱스 삭제
 */
export async function DELETE(request: NextRequest) {
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
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: '문서 ID(documentId)가 필요합니다.', code: 'INVALID_DOCUMENT_ID' },
        { status: 400 }
      );
    }

    // TODO: 문서 소유권 체크 (학원 접근 권한)

    await deleteDocumentChunks(documentId);

    return NextResponse.json({
      success: true,
      message: '인덱스가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('인덱스 삭제 오류:', error);
    return NextResponse.json(
      {
        error: '인덱스 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
