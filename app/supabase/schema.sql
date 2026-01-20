-- ============================================
-- EduFlow 데이터베이스 스키마
-- ============================================
-- 이 파일은 Supabase 데이터베이스의 전체 구조를 정의합니다.
-- Supabase 대시보드의 SQL Editor에서 실행하거나,
-- 마이그레이션 도구를 통해 적용할 수 있습니다.
-- ============================================

-- 기존 테이블이 있다면 삭제 (개발 환경에서만 사용)
-- 주의: 프로덕션에서는 이 부분을 주석 처리하세요!
-- DROP TABLE IF EXISTS consultations CASCADE;
-- DROP TABLE IF EXISTS attendance CASCADE;
-- DROP TABLE IF EXISTS grades CASCADE;
-- DROP TABLE IF EXISTS student_assignments CASCADE;
-- DROP TABLE IF EXISTS assignments CASCADE;
-- DROP TABLE IF EXISTS problems CASCADE;
-- DROP TABLE IF EXISTS teachers CASCADE;
-- DROP TABLE IF EXISTS students CASCADE;
-- DROP TABLE IF EXISTS academies CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- ENUM 타입 정의
-- ============================================

-- 사용자 역할: 학원장, 선생님, 학부모, 학생
CREATE TYPE user_role AS ENUM ('owner', 'teacher', 'parent', 'student');

-- 학원 요금제: 무료, 베이직, 프로, 엔터프라이즈
CREATE TYPE academy_plan AS ENUM ('free', 'basic', 'pro', 'enterprise');

-- 문제 유형: 객관식, 주관식, OX문제, 서술형
CREATE TYPE problem_type AS ENUM ('multiple_choice', 'short_answer', 'true_false', 'essay');

-- 문제 난이도: 쉬움, 보통, 어려움
CREATE TYPE problem_difficulty AS ENUM ('easy', 'medium', 'hard');

-- 과제 상태: 미제출, 진행중, 제출완료, 채점완료
CREATE TYPE assignment_status AS ENUM ('not_started', 'in_progress', 'submitted', 'graded');

-- 출석 상태: 출석, 결석, 지각, 조퇴
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'early_leave');

-- 상담 유형: 대면, 전화, 화상
CREATE TYPE consultation_type AS ENUM ('in_person', 'phone', 'video');

-- 상담 상태: 예약됨, 완료, 취소됨
CREATE TYPE consultation_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- ============================================
-- 1. 사용자 테이블 (users)
-- ============================================
-- 모든 사용자의 기본 정보를 저장합니다.
-- Supabase Auth와 연동됩니다.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,           -- 이메일 (로그인 ID로 사용)
    name VARCHAR(100) NOT NULL,                   -- 이름
    role user_role NOT NULL,                      -- 역할 (학원장/선생님/학부모/학생)
    phone VARCHAR(20),                            -- 전화번호
    profile_image TEXT,                           -- 프로필 이미지 URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이메일로 빠른 검색을 위한 인덱스
CREATE INDEX idx_users_email ON users(email);
-- 역할별 검색을 위한 인덱스
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- 2. 학원 테이블 (academies)
-- ============================================
-- 학원 정보를 저장합니다.
-- 하나의 학원에 여러 선생님과 학생이 소속될 수 있습니다.
CREATE TABLE academies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,                   -- 학원 이름
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 학원장 ID
    address TEXT,                                 -- 학원 주소
    phone VARCHAR(20),                            -- 학원 전화번호
    plan academy_plan DEFAULT 'free',             -- 요금제
    logo_image TEXT,                              -- 학원 로고 이미지 URL
    business_number VARCHAR(20),                  -- 사업자 등록번호
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학원장으로 빠른 검색을 위한 인덱스
CREATE INDEX idx_academies_owner ON academies(owner_id);

-- ============================================
-- 3. 학생 테이블 (students)
-- ============================================
-- 학생의 추가 정보를 저장합니다.
-- users 테이블과 1:1 관계입니다.
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,    -- 사용자 ID
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,  -- 소속 학원 ID
    grade VARCHAR(20),                            -- 학년 (예: '중1', '고2')
    parent_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- 학부모 ID
    school_name VARCHAR(100),                     -- 학교 이름
    class_name VARCHAR(50),                       -- 반 이름
    memo TEXT,                                    -- 메모 (특이사항 등)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 한 사용자는 한 학원에 한 번만 등록 가능
    UNIQUE(user_id, academy_id)
);

-- 학원별 학생 검색을 위한 인덱스
CREATE INDEX idx_students_academy ON students(academy_id);
-- 학부모별 학생 검색을 위한 인덱스
CREATE INDEX idx_students_parent ON students(parent_id);

-- ============================================
-- 4. 선생님 테이블 (teachers)
-- ============================================
-- 선생님의 추가 정보를 저장합니다.
-- users 테이블과 1:1 관계입니다.
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,    -- 사용자 ID
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,  -- 소속 학원 ID
    subjects TEXT[],                              -- 담당 과목 목록 (배열)
    bio TEXT,                                     -- 자기소개
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 한 사용자는 한 학원에 한 번만 등록 가능
    UNIQUE(user_id, academy_id)
);

-- 학원별 선생님 검색을 위한 인덱스
CREATE INDEX idx_teachers_academy ON teachers(academy_id);

-- ============================================
-- 5. 문제 테이블 (problems)
-- ============================================
-- AI로 생성되거나 직접 입력한 문제를 저장합니다.
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(50) NOT NULL,                 -- 과목 (수학, 영어, 국어 등)
    grade VARCHAR(20) NOT NULL,                   -- 대상 학년
    unit VARCHAR(100),                            -- 단원명
    question TEXT NOT NULL,                       -- 문제 내용
    answer TEXT NOT NULL,                         -- 정답
    solution TEXT,                                -- 풀이 (해설)
    difficulty problem_difficulty DEFAULT 'medium',  -- 난이도
    type problem_type DEFAULT 'short_answer',     -- 문제 유형
    options JSONB,                                -- 객관식 보기 (JSONB로 유연하게 저장)
    image_url TEXT,                               -- 문제 이미지 URL (있을 경우)
    tags TEXT[],                                  -- 태그 (검색용)
    academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,  -- 학원 ID (학원별 문제)
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,  -- 문제 생성자
    is_public BOOLEAN DEFAULT FALSE,              -- 공개 문제 여부
    ai_generated BOOLEAN DEFAULT FALSE,           -- AI 생성 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 과목, 학년, 난이도로 빠른 검색을 위한 인덱스
CREATE INDEX idx_problems_subject ON problems(subject);
CREATE INDEX idx_problems_grade ON problems(grade);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_academy ON problems(academy_id);
-- 전문 검색을 위한 인덱스 (문제 내용 검색)
CREATE INDEX idx_problems_question_search ON problems USING gin(to_tsvector('korean', question));

-- ============================================
-- 6. 과제 테이블 (assignments)
-- ============================================
-- 선생님이 학생들에게 부여하는 과제를 저장합니다.
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,                  -- 과제 제목
    description TEXT,                             -- 과제 설명
    academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,  -- 학원 ID
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,   -- 출제 선생님 ID
    problems UUID[] NOT NULL,                     -- 포함된 문제 ID 목록
    due_date TIMESTAMP WITH TIME ZONE,            -- 마감일
    time_limit INTEGER,                           -- 제한 시간 (분 단위, NULL이면 제한 없음)
    is_active BOOLEAN DEFAULT TRUE,               -- 활성화 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학원별, 선생님별 과제 검색을 위한 인덱스
CREATE INDEX idx_assignments_academy ON assignments(academy_id);
CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- ============================================
-- 7. 학생 과제 테이블 (student_assignments)
-- ============================================
-- 학생별 과제 진행 상황과 결과를 저장합니다.
CREATE TABLE student_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,  -- 과제 ID
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,        -- 학생 ID
    status assignment_status DEFAULT 'not_started',  -- 진행 상태
    score DECIMAL(5, 2),                          -- 점수 (100점 만점)
    answers JSONB,                                -- 학생의 답안 (JSONB로 저장)
    feedback TEXT,                                -- 선생님 피드백
    started_at TIMESTAMP WITH TIME ZONE,          -- 시작 시간
    submitted_at TIMESTAMP WITH TIME ZONE,        -- 제출 시간
    graded_at TIMESTAMP WITH TIME ZONE,           -- 채점 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 한 학생은 한 과제에 한 번만 배정됨
    UNIQUE(assignment_id, student_id)
);

-- 학생별, 과제별 검색을 위한 인덱스
CREATE INDEX idx_student_assignments_student ON student_assignments(student_id);
CREATE INDEX idx_student_assignments_assignment ON student_assignments(assignment_id);
CREATE INDEX idx_student_assignments_status ON student_assignments(status);

-- ============================================
-- 8. 성적 테이블 (grades)
-- ============================================
-- 학생의 과목별, 단원별 성적을 저장합니다.
-- 과제 외의 시험 성적 등을 기록할 때 사용합니다.
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,  -- 학생 ID
    subject VARCHAR(50) NOT NULL,                 -- 과목
    unit VARCHAR(100),                            -- 단원 (없으면 전체)
    score DECIMAL(5, 2) NOT NULL,                 -- 점수
    max_score DECIMAL(5, 2) DEFAULT 100,          -- 만점 (기본 100점)
    exam_type VARCHAR(50),                        -- 시험 유형 (중간고사, 기말고사, 모의고사 등)
    date DATE NOT NULL,                           -- 시험 날짜
    memo TEXT,                                    -- 메모
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학생별 성적 검색을 위한 인덱스
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_subject ON grades(subject);
CREATE INDEX idx_grades_date ON grades(date);

-- ============================================
-- 9. 출석 테이블 (attendance)
-- ============================================
-- 학생의 출석 기록을 저장합니다.
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,  -- 학생 ID
    date DATE NOT NULL,                           -- 날짜
    status attendance_status DEFAULT 'present',   -- 출석 상태
    check_in_time TIME,                           -- 등원 시간
    check_out_time TIME,                          -- 하원 시간
    note TEXT,                                    -- 비고
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 한 학생은 하루에 하나의 출석 기록만 가짐
    UNIQUE(student_id, date)
);

-- 학생별, 날짜별 출석 검색을 위한 인덱스
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- ============================================
-- 10. 상담 테이블 (consultations)
-- ============================================
-- 학부모-선생님 상담 일정과 기록을 저장합니다.
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,    -- 학부모 ID
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,  -- 선생님 ID
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,        -- 해당 학생 ID
    type consultation_type DEFAULT 'in_person',   -- 상담 유형
    date TIMESTAMP WITH TIME ZONE NOT NULL,       -- 상담 일시
    duration INTEGER DEFAULT 30,                  -- 상담 시간 (분)
    topic VARCHAR(200),                           -- 상담 주제
    notes TEXT,                                   -- 상담 내용/기록
    status consultation_status DEFAULT 'scheduled',  -- 상담 상태
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학부모별, 선생님별 상담 검색을 위한 인덱스
CREATE INDEX idx_consultations_parent ON consultations(parent_id);
CREATE INDEX idx_consultations_teacher ON consultations(teacher_id);
CREATE INDEX idx_consultations_date ON consultations(date);
CREATE INDEX idx_consultations_status ON consultations(status);

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================
-- RLS를 활성화하면 사용자가 자신과 관련된 데이터만 접근할 수 있습니다.
-- 아래는 예시이며, 실제 정책은 비즈니스 요구사항에 맞게 조정해야 합니다.

-- 모든 테이블에 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 사용자 테이블 RLS 정책
-- ============================================

-- 인증된 사용자는 자신의 정보를 볼 수 있음
CREATE POLICY "사용자는 자신의 정보를 볼 수 있음"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- 인증된 사용자는 자신의 정보를 수정할 수 있음
CREATE POLICY "사용자는 자신의 정보를 수정할 수 있음"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- 학원 테이블 RLS 정책
-- ============================================

-- 학원장은 자신의 학원을 볼 수 있음
CREATE POLICY "학원장은 자신의 학원을 볼 수 있음"
    ON academies FOR SELECT
    USING (owner_id = auth.uid());

-- 학원장은 자신의 학원을 수정할 수 있음
CREATE POLICY "학원장은 자신의 학원을 수정할 수 있음"
    ON academies FOR UPDATE
    USING (owner_id = auth.uid());

-- 학원장은 새 학원을 생성할 수 있음
CREATE POLICY "학원장은 새 학원을 생성할 수 있음"
    ON academies FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- ============================================
-- 트리거: updated_at 자동 업데이트
-- ============================================

-- updated_at 컬럼을 자동으로 업데이트하는 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academies_updated_at
    BEFORE UPDATE ON academies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at
    BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_assignments_updated_at
    BEFORE UPDATE ON student_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
    BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 완료!
-- ============================================
-- 이 스키마를 적용한 후:
-- 1. Supabase 대시보드에서 테이블이 제대로 생성되었는지 확인하세요.
-- 2. RLS 정책을 비즈니스 요구사항에 맞게 추가/수정하세요.
-- 3. 필요한 경우 추가 인덱스를 생성하세요.
