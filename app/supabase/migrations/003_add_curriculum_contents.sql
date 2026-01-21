-- 커리큘럼 콘텐츠 테이블
-- 학년별 단원별 개념자료 저장

CREATE TABLE IF NOT EXISTS curriculum_contents (
  id TEXT PRIMARY KEY,
  unit_id TEXT UNIQUE NOT NULL,

  -- 텍스트 콘텐츠
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  core_concepts JSONB NOT NULL DEFAULT '[]',
  advanced_topics JSONB NOT NULL DEFAULT '[]',
  common_mistakes JSONB NOT NULL DEFAULT '[]',
  problem_solving_tips JSONB NOT NULL DEFAULT '[]',
  connections JSONB NOT NULL DEFAULT '[]',

  -- 시각화 자료 (Desmos/GeoGebra)
  visualizations JSONB NOT NULL DEFAULT '[]',

  -- 메타데이터
  difficulty_level TEXT NOT NULL DEFAULT 'advanced',
  subject TEXT NOT NULL DEFAULT 'math',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_curriculum_unit_id ON curriculum_contents(unit_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_subject ON curriculum_contents(subject);
CREATE INDEX IF NOT EXISTS idx_curriculum_difficulty ON curriculum_contents(difficulty_level);

-- RLS 정책
ALTER TABLE curriculum_contents ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 인증된 사용자
CREATE POLICY "curriculum_contents_select" ON curriculum_contents
  FOR SELECT TO authenticated USING (true);

-- 쓰기: 관리자/선생님만
CREATE POLICY "curriculum_contents_insert" ON curriculum_contents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'teacher', 'super_admin')
    )
  );

CREATE POLICY "curriculum_contents_update" ON curriculum_contents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'teacher', 'super_admin')
    )
  );

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_curriculum_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER curriculum_contents_updated_at
  BEFORE UPDATE ON curriculum_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_curriculum_updated_at();

-- 코멘트
COMMENT ON TABLE curriculum_contents IS '커리큘럼 개념자료 (숨마쿰라우데 스타일)';
COMMENT ON COLUMN curriculum_contents.unit_id IS '단원 ID (예: middle_1_unit_01)';
COMMENT ON COLUMN curriculum_contents.core_concepts IS '핵심 개념 배열 (JSON)';
COMMENT ON COLUMN curriculum_contents.visualizations IS '시각화 자료 배열 (Desmos/GeoGebra)';
