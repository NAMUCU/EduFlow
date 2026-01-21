-- ============================================
-- 학원 설정 테이블 추가 마이그레이션
-- ============================================
-- 이 마이그레이션은 학원별 설정을 저장하는 테이블을 추가합니다.
-- API 키, AI 모델 설정 등 학원별 커스텀 설정을 관리합니다.
-- ============================================

-- ============================================
-- 학원 설정 테이블 (academy_settings)
-- ============================================
-- 학원별 API 키와 모델 설정을 저장합니다.
-- api_keys는 암호화된 형태로 저장됩니다.

CREATE TABLE IF NOT EXISTS academy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,

    -- 암호화된 API 키들 (JSONB)
    -- 예: { "openai": "encrypted_key", "gemini": "encrypted_key", "claude": "encrypted_key" }
    api_keys JSONB DEFAULT '{}'::jsonb,

    -- AI 모델 설정 (JSONB)
    -- 예: {
    --   "problem_generation": { "provider": "gemini", "model": "gemini-2.0-flash" },
    --   "problem_review": { "providers": ["gemini", "openai", "claude"], "models": {...} },
    --   "temperature": 0.7,
    --   "max_tokens": 4096
    -- }
    model_settings JSONB DEFAULT '{
        "problem_generation": {
            "provider": "gemini",
            "model": "gemini-2.0-flash"
        },
        "problem_review": {
            "providers": ["gemini"],
            "models": {
                "gemini": "gemini-2.0-flash",
                "openai": "gpt-4o",
                "claude": "claude-sonnet-4-20250514"
            }
        },
        "temperature": 0.7,
        "max_tokens": 4096
    }'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 학원당 하나의 설정만 존재
    CONSTRAINT unique_academy_settings UNIQUE (academy_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_academy_settings_academy ON academy_settings(academy_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_academy_settings_updated_at
    BEFORE UPDATE ON academy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

ALTER TABLE academy_settings ENABLE ROW LEVEL SECURITY;

-- 학원장만 설정을 볼 수 있음 (API 키 보안)
CREATE POLICY "학원장만 설정을 볼 수 있음"
    ON academy_settings FOR SELECT
    USING (
        academy_id IN (
            SELECT id FROM academies WHERE owner_id = auth.uid()
        )
    );

-- 학원장만 설정을 생성할 수 있음
CREATE POLICY "학원장만 설정을 생성할 수 있음"
    ON academy_settings FOR INSERT
    WITH CHECK (
        academy_id IN (
            SELECT id FROM academies WHERE owner_id = auth.uid()
        )
    );

-- 학원장만 설정을 수정할 수 있음
CREATE POLICY "학원장만 설정을 수정할 수 있음"
    ON academy_settings FOR UPDATE
    USING (
        academy_id IN (
            SELECT id FROM academies WHERE owner_id = auth.uid()
        )
    );

-- 학원장만 설정을 삭제할 수 있음
CREATE POLICY "학원장만 설정을 삭제할 수 있음"
    ON academy_settings FOR DELETE
    USING (
        academy_id IN (
            SELECT id FROM academies WHERE owner_id = auth.uid()
        )
    );

-- ============================================
-- 선생님용 읽기 전용 정책 (모델 설정만)
-- ============================================
-- 선생님은 API 키를 볼 수 없고, 모델 설정만 조회 가능
-- 이를 위해 별도의 뷰를 생성합니다.

CREATE OR REPLACE VIEW academy_model_settings AS
SELECT
    id,
    academy_id,
    model_settings,
    created_at,
    updated_at
FROM academy_settings;

-- 뷰에 대한 RLS는 기본 테이블의 RLS를 따르므로
-- 선생님용 별도 함수를 생성합니다.

CREATE OR REPLACE FUNCTION get_academy_model_settings(p_academy_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings JSONB;
    v_user_id UUID;
BEGIN
    -- 현재 사용자 ID 가져오기
    v_user_id := auth.uid();

    -- 사용자가 해당 학원의 선생님이거나 학원장인지 확인
    IF NOT EXISTS (
        SELECT 1 FROM teachers WHERE user_id = v_user_id AND academy_id = p_academy_id
        UNION
        SELECT 1 FROM academies WHERE id = p_academy_id AND owner_id = v_user_id
    ) THEN
        RAISE EXCEPTION '접근 권한이 없습니다.';
    END IF;

    -- 모델 설정만 반환 (API 키 제외)
    SELECT model_settings INTO v_settings
    FROM academy_settings
    WHERE academy_id = p_academy_id;

    RETURN COALESCE(v_settings, '{}'::jsonb);
END;
$$;

-- ============================================
-- 학원 생성 시 자동으로 기본 설정 생성하는 트리거
-- ============================================

CREATE OR REPLACE FUNCTION create_default_academy_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO academy_settings (academy_id)
    VALUES (NEW.id)
    ON CONFLICT (academy_id) DO NOTHING;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_academy_settings
    AFTER INSERT ON academies
    FOR EACH ROW EXECUTE FUNCTION create_default_academy_settings();

-- ============================================
-- 주석
-- ============================================

COMMENT ON TABLE academy_settings IS '학원별 설정 (API 키, AI 모델 설정 등)';
COMMENT ON COLUMN academy_settings.academy_id IS '학원 ID (academies 테이블 참조)';
COMMENT ON COLUMN academy_settings.api_keys IS '암호화된 API 키들 (JSONB) - OpenAI, Gemini, Claude 등';
COMMENT ON COLUMN academy_settings.model_settings IS 'AI 모델 설정 (JSONB) - 문제 생성/검수용 모델, 파라미터 등';
COMMENT ON FUNCTION get_academy_model_settings(UUID) IS '선생님이 모델 설정만 조회할 수 있는 함수 (API 키 제외)';

-- ============================================
-- 완료!
-- ============================================
