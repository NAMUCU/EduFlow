-- pgvector RAG 시스템 마이그레이션
-- 기존 Gemini File Search API와 병행 운영

-- 1. pgvector extension 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 문서 청크 테이블 (임베딩 저장)
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES rag_documents(id) ON DELETE CASCADE,
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,

  -- 청크 내용
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,

  -- 임베딩 벡터 (OpenAI text-embedding-3-small: 1536 dimensions)
  embedding vector(1536),

  -- 메타데이터
  metadata JSONB DEFAULT '{}',
  token_count INTEGER,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 인덱스용
  UNIQUE(document_id, chunk_index)
);

-- 3. 벡터 검색 인덱스 (IVFFlat - 빠른 검색)
-- 10만 청크 이하: lists = 100, 그 이상: sqrt(row_count)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. 일반 인덱스
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS document_chunks_academy_id_idx ON document_chunks(academy_id);
CREATE INDEX IF NOT EXISTS document_chunks_metadata_idx ON document_chunks USING gin(metadata);

-- 5. RLS 정책 (학원별 데이터 격리)
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- 학원 소속 사용자만 해당 학원 청크 조회 가능
CREATE POLICY "Academy members can view their chunks" ON document_chunks
  FOR SELECT
  USING (
    academy_id IN (
      SELECT academy_id FROM users WHERE id = auth.uid()
    )
  );

-- 학원 관리자만 청크 생성 가능
CREATE POLICY "Academy admins can insert chunks" ON document_chunks
  FOR INSERT
  WITH CHECK (
    academy_id IN (
      SELECT academy_id FROM users
      WHERE id = auth.uid()
      AND role IN ('academy_admin', 'teacher', 'super_admin')
    )
  );

-- 학원 관리자만 청크 삭제 가능
CREATE POLICY "Academy admins can delete chunks" ON document_chunks
  FOR DELETE
  USING (
    academy_id IN (
      SELECT academy_id FROM users
      WHERE id = auth.uid()
      AND role IN ('academy_admin', 'super_admin')
    )
  );

-- 6. 벡터 유사도 검색 함수
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  match_academy_id UUID,
  match_count INT DEFAULT 10,
  match_threshold FLOAT DEFAULT 0.7,
  filter_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  chunk_index INTEGER,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    dc.academy_id = match_academy_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (filter_metadata = '{}' OR dc.metadata @> filter_metadata)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 7. 하이브리드 검색 함수 (키워드 + 벡터)
CREATE OR REPLACE FUNCTION hybrid_search_chunks(
  query_embedding vector(1536),
  query_text TEXT,
  match_academy_id UUID,
  match_count INT DEFAULT 10,
  vector_weight FLOAT DEFAULT 0.7,
  keyword_weight FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  chunk_index INTEGER,
  metadata JSONB,
  vector_score FLOAT,
  keyword_score FLOAT,
  combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      dc.id,
      dc.document_id,
      dc.content,
      dc.chunk_index,
      dc.metadata,
      1 - (dc.embedding <=> query_embedding) AS v_score
    FROM document_chunks dc
    WHERE dc.academy_id = match_academy_id
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  keyword_results AS (
    SELECT
      dc.id,
      ts_rank(to_tsvector('korean', dc.content), plainto_tsquery('korean', query_text)) AS k_score
    FROM document_chunks dc
    WHERE
      dc.academy_id = match_academy_id
      AND to_tsvector('korean', dc.content) @@ plainto_tsquery('korean', query_text)
  )
  SELECT
    vr.id,
    vr.document_id,
    vr.content,
    vr.chunk_index,
    vr.metadata,
    vr.v_score AS vector_score,
    COALESCE(kr.k_score, 0) AS keyword_score,
    (vr.v_score * vector_weight + COALESCE(kr.k_score, 0) * keyword_weight) AS combined_score
  FROM vector_results vr
  LEFT JOIN keyword_results kr ON vr.id = kr.id
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- 8. 문서별 청크 통계 뷰
CREATE OR REPLACE VIEW document_chunk_stats AS
SELECT
  d.id AS document_id,
  d.filename,
  d.type,
  d.subject,
  d.grade,
  d.academy_id,
  COUNT(c.id) AS chunk_count,
  SUM(c.token_count) AS total_tokens,
  MAX(c.created_at) AS last_indexed_at
FROM rag_documents d
LEFT JOIN document_chunks c ON d.id = c.document_id
GROUP BY d.id, d.filename, d.type, d.subject, d.grade, d.academy_id;

-- 9. rag_documents 테이블에 pgvector 상태 컬럼 추가
ALTER TABLE rag_documents
ADD COLUMN IF NOT EXISTS pgvector_indexed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pgvector_indexed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;

COMMENT ON TABLE document_chunks IS 'pgvector 기반 RAG 청크 저장소. Gemini File Search와 병행 운영.';
COMMENT ON COLUMN document_chunks.embedding IS 'OpenAI text-embedding-3-small 임베딩 (1536 dimensions)';
