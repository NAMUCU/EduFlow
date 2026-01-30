/**
 * RAG 문서 업로드 API
 * POST /api/rag/upload
 *
 * PDF 업로드 → 텍스트 추출 → pgvector 인덱싱 (+ 선택적 Gemini File Search)
 *
 * 인증 필수 + Rate Limiting (시간당 20회)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { indexDocument } from '@/lib/rag-pgvector';
import {
  extractText,
  preprocessEducationalContent,
  extractMetadata,
} from '@/lib/pdf-extractor';
import { getApiUser, canAccessAcademy } from '@/lib/api-auth';
import { createRateLimiter } from '@/lib/rate-limiter';

// Rate Limiter 설정 (시간당 20회 - 업로드는 더 엄격하게)
const rateLimiter = createRateLimiter('upload');

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
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const academyId = formData.get('academyId') as string;
    const isPublic = formData.get('isPublic') === 'true'; // 공용 자료 여부
    const documentType = formData.get('type') as string || 'textbook';
    const subject = formData.get('subject') as string | null;
    const grade = formData.get('grade') as string | null;
    const unit = formData.get('unit') as string | null;
    const year = formData.get('year') as string | null;
    const indexMethod = formData.get('indexMethod') as string || 'pgvector'; // 'pgvector' | 'gemini' | 'both'

    // 필수 파라미터 검증
    if (!file) {
      return NextResponse.json(
        { error: '파일이 필요합니다.', code: 'INVALID_FILE' },
        { status: 400 }
      );
    }

    // 공용 자료 업로드는 super_admin만 가능
    if (isPublic) {
      if (user.role !== 'super_admin') {
        return NextResponse.json(
          { error: '공용 자료 업로드는 시스템 관리자만 가능합니다.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else {
      // 일반 자료는 academyId 필수
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
    }

    // 실제 사용할 academyId (공용이면 null)
    const effectiveAcademyId = isPublic ? null : academyId;

    // 파일 타입 검증
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'PDF, TXT, MD 파일만 지원합니다.', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '파일 크기는 20MB 이하여야 합니다.', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;

    // 1. Supabase Storage에 파일 업로드
    const storageFolder = isPublic ? 'public' : effectiveAcademyId;
    const storagePath = `${storageFolder}/${Date.now()}_${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`파일 업로드 실패: ${uploadError.message}`);
    }

    // 2. 텍스트 추출
    let extractedText: string;
    let extractionMethod: string;

    if (file.type === 'application/pdf' || filename.endsWith('.pdf')) {
      // PDF 파일
      const extraction = await extractText({
        buffer: fileBuffer,
        mimeType: 'application/pdf',
      });
      extractedText = extraction.text;
      extractionMethod = extraction.method;
    } else {
      // 텍스트 파일
      extractedText = fileBuffer.toString('utf-8');
      extractionMethod = 'direct';
    }

    // 3. 교육 콘텐츠 전처리
    const processedText = preprocessEducationalContent(extractedText);

    // 4. 메타데이터 자동 추출 (제공되지 않은 경우)
    const autoMetadata = extractMetadata(processedText);

    const finalMetadata = {
      subject: subject || autoMetadata.subject,
      grade: grade || autoMetadata.grade,
      unit: unit || autoMetadata.unit,
      year: year ? parseInt(year) : autoMetadata.year,
      source_filename: filename,
    };

    // 5. rag_documents 레코드 생성
    const { data: docRecord, error: docError } = await (supabase
      .from('rag_documents') as any)
      .insert({
        filename,
        type: documentType,
        subject: finalMetadata.subject,
        grade: finalMetadata.grade,
        unit: finalMetadata.unit,
        year: finalMetadata.year,
        academy_id: effectiveAcademyId, // 공용 자료면 null
        uploaded_by: user.id, // 인증된 사용자 ID 사용
        storage_path: storagePath,
        file_size: file.size,
        status: 'processing',
        is_public: isPublic, // 공용 자료 플래그
      })
      .select()
      .single();

    if (docError || !docRecord) {
      // 업로드된 파일 삭제
      await supabase.storage.from('documents').remove([storagePath]);
      throw new Error(`문서 레코드 생성 실패: ${docError?.message}`);
    }

    const documentId = docRecord.id;

    // 6. pgvector 인덱싱
    let pgvectorResult = null;
    if (indexMethod === 'pgvector' || indexMethod === 'both') {
      pgvectorResult = await indexDocument(
        documentId,
        processedText,
        effectiveAcademyId, // 공용 자료면 null
        finalMetadata
      );

      if (!pgvectorResult.success) {
        console.error('pgvector 인덱싱 실패:', pgvectorResult.error);
      }
    }

    // 7. Gemini File Search 인덱싱 (선택적)
    let geminiResult = null;
    if (indexMethod === 'gemini' || indexMethod === 'both') {
      try {
        // 기존 rag.ts의 uploadAndIndexDocument 호출
        const { uploadAndIndexDocument } = await import('@/lib/rag');

        await uploadAndIndexDocument(fileBuffer, filename, {
          filename,
          type: documentType as 'exam' | 'textbook' | 'mockexam' | 'workbook',
          subject: finalMetadata.subject || '',
          grade: finalMetadata.grade || '',
          unit: finalMetadata.unit ?? undefined,
          year: finalMetadata.year ?? undefined,
          academy_id: effectiveAcademyId || '', // 공용 자료면 빈 문자열
          uploaded_by: user.id,
          storage_path: storagePath,
        });

        geminiResult = { success: true };
      } catch (error) {
        console.error('Gemini File Search 인덱싱 실패:', error);
        geminiResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // 8. 문서 상태 업데이트
    await (supabase
      .from('rag_documents') as any)
      .update({
        status: 'ready',
      })
      .eq('id', documentId);

    return NextResponse.json({
      success: true,
      data: {
        documentId,
        filename,
        storagePath,
        metadata: finalMetadata,
        extraction: {
          method: extractionMethod,
          textLength: processedText.length,
        },
        indexing: {
          pgvector: pgvectorResult
            ? {
                success: pgvectorResult.success,
                chunkCount: pgvectorResult.chunkCount,
                totalTokens: pgvectorResult.totalTokens,
                processingTimeMs: pgvectorResult.processingTimeMs,
              }
            : null,
          gemini: geminiResult,
        },
      },
    });
  } catch (error) {
    console.error('문서 업로드 오류:', error);
    return NextResponse.json(
      {
        error: '문서 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
