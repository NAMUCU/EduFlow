-- Few-shot 샘플 이미지 테이블
CREATE TABLE IF NOT EXISTS fewshot_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,           -- 'triangle', 'quadrilateral', 'circle', 'graph', 'illustration'
  subcategory TEXT NOT NULL,        -- 'height', 'circumcenter', 'incenter', 'similarity' 등
  tags TEXT[] NOT NULL DEFAULT '{}', -- ['점선', '각도표시', '보조선', '높이선']
  name TEXT NOT NULL,               -- '삼각형-높이'
  description TEXT,                 -- 설명
  svg_code TEXT,                    -- SVG 코드 (도형용)
  image_url TEXT,                   -- 이미지 URL (삽화용)
  metadata JSONB DEFAULT '{}',      -- 추가 데이터 (좌표, 각도 등)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_fewshot_category ON fewshot_samples(category);
CREATE INDEX idx_fewshot_subcategory ON fewshot_samples(subcategory);
CREATE INDEX idx_fewshot_tags ON fewshot_samples USING GIN(tags);

-- 카테고리 ENUM 대신 CHECK
ALTER TABLE fewshot_samples ADD CONSTRAINT check_category
  CHECK (category IN ('triangle', 'quadrilateral', 'circle', 'graph', 'coordinate', 'illustration', 'other'));
