-- ============================================
-- RAG 문서 테이블 추가 마이그레이션
-- ============================================
-- 이 마이그레이션은 RAG 기능을 위한 문서 저장 테이블을 추가합니다.
-- OpenAI Vector Store와 연동하여 기출문제/교과서 검색에 사용됩니다.
-- ============================================

-- ============================================
-- ENUM 타입 정의
-- ============================================

-- 문서 유형: 기출문제, 교과서, 모의고사, 문제집
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE document_type AS ENUM ('exam', 'textbook', 'mockexam', 'workbook');
    END IF;
END$$;

-- ============================================
-- 학원 테이블에 vector_store_id 컬럼 추가
-- ============================================

ALTER TABLE academies
ADD COLUMN IF NOT EXISTS vector_store_id VARCHAR(255);

COMMENT ON COLUMN academies.vector_store_id IS 'OpenAI Vector Store ID (RAG 검색용)';

-- ============================================
-- RAG 문서 테이블 (rag_documents)
-- ============================================
-- PDF 파일의 메타데이터와 OpenAI 연동 정보를 저장합니다.

CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(500) NOT NULL,                  -- 원본 파일명
    type document_type NOT NULL,                      -- 문서 유형
    subject VARCHAR(50) NOT NULL,                     -- 과목
    grade VARCHAR(20) NOT NULL,                       -- 학년
    unit VARCHAR(200),                                -- 단원 (선택)
    publisher VARCHAR(100),                           -- 출판사/출처 (선택)
    year INTEGER,                                     -- 출제년도 (기출/모의고사의 경우)
    month INTEGER,                                    -- 월 (모의고사의 경우)
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,  -- 학원 ID
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,    -- 업로드한 사용자 ID
    storage_path TEXT NOT NULL,                       -- Supabase Storage 경로
    vector_store_id VARCHAR(255),                     -- OpenAI Vector Store ID
    openai_file_id VARCHAR(255),                      -- OpenAI File ID
    file_size INTEGER,                                -- 파일 크기 (bytes)
    page_count INTEGER,                               -- 페이지 수
    status VARCHAR(50) DEFAULT 'processing',          -- 상태 (processing, ready, error)
    error_message TEXT,                               -- 에러 메시지 (있을 경우)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_rag_documents_academy ON rag_documents(academy_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_type ON rag_documents(type);
CREATE INDEX IF NOT EXISTS idx_rag_documents_subject ON rag_documents(subject);
CREATE INDEX IF NOT EXISTS idx_rag_documents_grade ON rag_documents(grade);
CREATE INDEX IF NOT EXISTS idx_rag_documents_openai_file ON rag_documents(openai_file_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_created ON rag_documents(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_rag_documents_updated_at
    BEFORE UPDATE ON rag_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;

-- 같은 학원의 사용자는 문서를 볼 수 있음
CREATE POLICY "학원 사용자는 문서를 볼 수 있음"
    ON rag_documents FOR SELECT
    USING (
        academy_id IN (
            SELECT academy_id FROM students WHERE user_id = auth.uid()
            UNION
            SELECT academy_id FROM teachers WHERE user_id = auth.uid()
            UNION
            SELECT id FROM academies WHERE owner_id = auth.uid()
        )
    );

-- 선생님과 학원장만 문서를 업로드할 수 있음
CREATE POLICY "선생님과 학원장은 문서를 업로드할 수 있음"
    ON rag_documents FOR INSERT
    WITH CHECK (
        academy_id IN (
            SELECT academy_id FROM teachers WHERE user_id = auth.uid()
            UNION
            SELECT id FROM academies WHERE owner_id = auth.uid()
        )
    );

-- 선생님과 학원장만 문서를 수정할 수 있음
CREATE POLICY "선생님과 학원장은 문서를 수정할 수 있음"
    ON rag_documents FOR UPDATE
    USING (
        academy_id IN (
            SELECT academy_id FROM teachers WHERE user_id = auth.uid()
            UNION
            SELECT id FROM academies WHERE owner_id = auth.uid()
        )
    );

-- 선생님과 학원장만 문서를 삭제할 수 있음
CREATE POLICY "선생님과 학원장은 문서를 삭제할 수 있음"
    ON rag_documents FOR DELETE
    USING (
        academy_id IN (
            SELECT academy_id FROM teachers WHERE user_id = auth.uid()
            UNION
            SELECT id FROM academies WHERE owner_id = auth.uid()
        )
    );

-- ============================================
-- 주석
-- ============================================

COMMENT ON TABLE rag_documents IS 'RAG 검색용 문서 메타데이터 (기출문제, 교과서, 모의고사 등)';
COMMENT ON COLUMN rag_documents.filename IS '원본 파일명';
COMMENT ON COLUMN rag_documents.type IS '문서 유형 (exam: 기출문제, textbook: 교과서, mockexam: 모의고사, workbook: 문제집)';
COMMENT ON COLUMN rag_documents.subject IS '과목 (수학, 영어, 국어 등)';
COMMENT ON COLUMN rag_documents.grade IS '학년 (중1, 고2 등)';
COMMENT ON COLUMN rag_documents.unit IS '단원명 (선택)';
COMMENT ON COLUMN rag_documents.publisher IS '출판사 또는 출처 (EBS, 비상교육 등)';
COMMENT ON COLUMN rag_documents.year IS '출제년도 (기출문제나 모의고사의 경우)';
COMMENT ON COLUMN rag_documents.month IS '출제월 (모의고사의 경우, 3월/6월/9월/11월 등)';
COMMENT ON COLUMN rag_documents.storage_path IS 'Supabase Storage 내 파일 경로';
COMMENT ON COLUMN rag_documents.vector_store_id IS 'OpenAI Vector Store ID';
COMMENT ON COLUMN rag_documents.openai_file_id IS 'OpenAI에 업로드된 파일 ID';
COMMENT ON COLUMN rag_documents.status IS '처리 상태 (processing: 처리중, ready: 준비완료, error: 오류)';

-- ============================================
-- 완료!
-- ============================================
