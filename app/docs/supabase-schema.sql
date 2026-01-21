-- ===========================================
-- EduFlow Supabase 데이터베이스 스키마
-- ===========================================
-- 이 SQL을 Supabase SQL Editor에서 실행하면 전체 스키마가 생성됩니다.
-- 실행 순서: ENUM → Tables → Indexes → RLS → Triggers

-- ===========================================
-- 1. ENUM 타입 정의
-- ===========================================

-- 사용자 역할
CREATE TYPE user_role AS ENUM ('owner', 'teacher', 'parent', 'student');

-- 프로필 역할 (Supabase Auth 연동)
CREATE TYPE profile_role AS ENUM ('super_admin', 'admin', 'teacher', 'parent', 'student');

-- 학원 요금제
CREATE TYPE academy_plan AS ENUM ('free', 'basic', 'pro', 'enterprise');

-- 문제 유형
CREATE TYPE problem_type AS ENUM ('multiple_choice', 'short_answer', 'true_false', 'essay');

-- 문제 난이도
CREATE TYPE problem_difficulty AS ENUM ('easy', 'medium', 'hard');

-- 과제 진행 상태
CREATE TYPE assignment_status AS ENUM ('not_started', 'in_progress', 'submitted', 'graded');

-- 출석 상태
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'early_leave');

-- 상담 유형
CREATE TYPE consultation_type AS ENUM ('in_person', 'phone', 'video');

-- 상담 상태
CREATE TYPE consultation_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- RAG 문서 유형
CREATE TYPE rag_document_type AS ENUM ('exam', 'textbook', 'mockexam', 'workbook');


-- ===========================================
-- 2. 테이블 생성
-- ===========================================

-- 사용자 프로필 (Supabase Auth 연동)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role profile_role NOT NULL DEFAULT 'student',
  academy_id UUID,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 학원
CREATE TABLE academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  address TEXT,
  phone TEXT,
  plan academy_plan NOT NULL DEFAULT 'free',
  logo_image TEXT,
  business_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- profiles에 academy_id FK 추가 (academies 테이블 생성 후)
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_academy
FOREIGN KEY (academy_id) REFERENCES academies(id) ON DELETE SET NULL;

-- 사용자 (레거시 호환용, profiles와 병행 사용 가능)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  phone TEXT,
  profile_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 학생
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  grade TEXT,
  parent_id UUID REFERENCES profiles(id),
  school_name TEXT,
  class_name TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 선생님
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  subjects TEXT[] DEFAULT '{}',
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 반/클래스
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id),
  subject TEXT,
  grade TEXT,
  description TEXT,
  schedule JSONB DEFAULT '{}',
  max_students INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 학생-반 연결 (N:N 관계)
CREATE TABLE class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- 문제
CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_number TEXT,                    -- 문제 보유번호 (빠른 검색용)
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  unit TEXT,
  sub_unit TEXT,                          -- 세부 단원
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  solution TEXT,
  difficulty problem_difficulty NOT NULL DEFAULT 'medium',
  type problem_type NOT NULL DEFAULT 'multiple_choice',
  options JSONB,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  source TEXT,                            -- 출처 (2024 수능, 교과서 등)
  source_year INTEGER,                    -- 출처 연도
  correct_rate DECIMAL(5,2),              -- 정답률 (0.00 ~ 100.00)
  is_few_shot_sample BOOLEAN DEFAULT false, -- Few-shot 학습용 샘플
  academy_id UUID REFERENCES academies(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id),
  is_public BOOLEAN NOT NULL DEFAULT false,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 문제 세트 유형
CREATE TYPE problem_set_type AS ENUM ('assignment', 'lesson', 'exam', 'custom');

-- 문제 세트 (과제/수업/시험별 문제 묶음)
CREATE TABLE problem_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                     -- 세트 이름 (예: "2/15 중3 수학 과제")
  type problem_set_type NOT NULL DEFAULT 'custom',
  description TEXT,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  class_id UUID REFERENCES classes(id),   -- 연결된 반 (선택)
  assignment_id UUID REFERENCES assignments(id), -- 연결된 과제 (선택)
  use_date DATE,                          -- 사용 날짜 (수업/시험 날짜)
  is_template BOOLEAN DEFAULT false,      -- 재사용 템플릿 여부
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 문제 세트 항목 (세트 내 문제들)
CREATE TABLE problem_set_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_set_id UUID NOT NULL REFERENCES problem_sets(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0, -- 문제 순서
  points INTEGER DEFAULT 10,              -- 배점
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(problem_set_id, problem_id)
);

-- 과제
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  problems UUID[] DEFAULT '{}',
  due_date TIMESTAMPTZ,
  time_limit INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 학생 과제 (과제 제출/채점)
CREATE TABLE student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status assignment_status NOT NULL DEFAULT 'not_started',
  score INTEGER,
  answers JSONB,
  feedback TEXT,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- 성적
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  unit TEXT,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL DEFAULT 100,
  exam_type TEXT,
  date DATE NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 출석
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'present',
  check_in_time TIME,
  check_out_time TIME,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- 상담
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  student_id UUID REFERENCES students(id),
  type consultation_type NOT NULL DEFAULT 'in_person',
  date TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  topic TEXT,
  notes TEXT,
  status consultation_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 공지사항
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RAG 문서 (기출문제/교과서 검색용)
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  type rag_document_type NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  unit TEXT,
  publisher TEXT,
  year INTEGER,
  month INTEGER,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  storage_path TEXT NOT NULL,
  file_search_store_id TEXT,
  gemini_file_id TEXT,
  file_size INTEGER,
  page_count INTEGER,
  status TEXT NOT NULL DEFAULT 'processing',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 문자 발송 기록
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'assignment',
  status TEXT NOT NULL DEFAULT 'pending',
  external_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 알림톡 발송 기록
CREATE TABLE kakao_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  template_code TEXT NOT NULL,
  template_params JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  external_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ===========================================
-- 3. 인덱스 생성 (성능 최적화)
-- ===========================================

-- profiles
CREATE INDEX idx_profiles_academy ON profiles(academy_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- students
CREATE INDEX idx_students_academy ON students(academy_id);
CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_parent ON students(parent_id);

-- teachers
CREATE INDEX idx_teachers_academy ON teachers(academy_id);
CREATE INDEX idx_teachers_user ON teachers(user_id);

-- classes
CREATE INDEX idx_classes_academy ON classes(academy_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);

-- problems
CREATE INDEX idx_problems_academy ON problems(academy_id);
CREATE INDEX idx_problems_subject ON problems(subject);
CREATE INDEX idx_problems_grade ON problems(grade);
CREATE INDEX idx_problems_type ON problems(type);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_created_by ON problems(created_by);

-- assignments
CREATE INDEX idx_assignments_academy ON assignments(academy_id);
CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- student_assignments
CREATE INDEX idx_student_assignments_student ON student_assignments(student_id);
CREATE INDEX idx_student_assignments_status ON student_assignments(status);

-- attendance
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);

-- consultations
CREATE INDEX idx_consultations_parent ON consultations(parent_id);
CREATE INDEX idx_consultations_teacher ON consultations(teacher_id);
CREATE INDEX idx_consultations_date ON consultations(date);

-- notices
CREATE INDEX idx_notices_academy ON notices(academy_id);
CREATE INDEX idx_notices_published ON notices(is_published, published_at DESC);

-- rag_documents
CREATE INDEX idx_rag_documents_academy ON rag_documents(academy_id);
CREATE INDEX idx_rag_documents_type ON rag_documents(type);
CREATE INDEX idx_rag_documents_subject ON rag_documents(subject);

-- sms_logs & kakao_logs
CREATE INDEX idx_sms_logs_academy ON sms_logs(academy_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_kakao_logs_academy ON kakao_logs(academy_id);
CREATE INDEX idx_kakao_logs_status ON kakao_logs(status);


-- ===========================================
-- 4. Row Level Security (RLS) 정책
-- ===========================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kakao_logs ENABLE ROW LEVEL SECURITY;

-- profiles: 자기 자신만 조회/수정 가능, 같은 학원 사람은 조회 가능
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in same academy" ON profiles
  FOR SELECT USING (
    academy_id IN (
      SELECT academy_id FROM profiles WHERE id = auth.uid()
    )
  );

-- academies: 소속 학원만 조회, owner만 수정
CREATE POLICY "Users can view their academy" ON academies
  FOR SELECT USING (
    id IN (SELECT academy_id FROM profiles WHERE id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Owner can update academy" ON academies
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owner can insert academy" ON academies
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- students, teachers, classes 등: 같은 학원 소속만 접근
CREATE POLICY "Academy members can view students" ON students
  FOR SELECT USING (
    academy_id IN (SELECT academy_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Teachers can manage students" ON students
  FOR ALL USING (
    academy_id IN (
      SELECT academy_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'teacher')
    )
  );

-- problems: 공개 문제는 모두 조회 가능, 학원 문제는 학원 소속만
CREATE POLICY "Anyone can view public problems" ON problems
  FOR SELECT USING (is_public = true);

CREATE POLICY "Academy members can view academy problems" ON problems
  FOR SELECT USING (
    academy_id IN (SELECT academy_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Teachers can create problems" ON problems
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'teacher')
    )
  );

-- notices: 학원 소속만 조회, admin/teacher만 작성
CREATE POLICY "Academy members can view notices" ON notices
  FOR SELECT USING (
    academy_id IN (SELECT academy_id FROM profiles WHERE id = auth.uid())
    AND is_published = true
  );

CREATE POLICY "Teachers can manage notices" ON notices
  FOR ALL USING (
    academy_id IN (
      SELECT academy_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'teacher')
    )
  );


-- ===========================================
-- 5. 트리거 (updated_at 자동 갱신)
-- ===========================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
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

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
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

CREATE TRIGGER update_notices_updated_at
  BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rag_documents_updated_at
  BEFORE UPDATE ON rag_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ===========================================
-- 6. Auth 트리거 (회원가입 시 자동 profile 생성)
-- ===========================================

-- 회원가입 시 profiles 테이블에 자동 삽입
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::profile_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ===========================================
-- 7. Storage 버킷 생성 (Supabase Dashboard에서 실행)
-- ===========================================
-- 아래 내용은 SQL Editor가 아닌 Storage 설정에서 생성해야 합니다:
--
-- 1. profile-images: 프로필 이미지
--    - Public: Yes
--    - Allowed MIME: image/*
--    - Max file size: 2MB
--
-- 2. academy-logos: 학원 로고
--    - Public: Yes
--    - Allowed MIME: image/*
--    - Max file size: 5MB
--
-- 3. problem-images: 문제 이미지
--    - Public: No (RLS 적용)
--    - Allowed MIME: image/*
--    - Max file size: 10MB
--
-- 4. assignments: 과제 관련 파일
--    - Public: No (RLS 적용)
--    - Allowed MIME: *
--    - Max file size: 50MB
--
-- 5. rag-documents: RAG용 문서
--    - Public: No (RLS 적용)
--    - Allowed MIME: application/pdf, image/*
--    - Max file size: 100MB


-- ===========================================
-- 완료!
-- ===========================================
-- 스키마 생성이 완료되었습니다.
--
-- 다음 단계:
-- 1. Supabase Dashboard > Storage에서 버킷 생성
-- 2. .env.local에 Supabase URL과 키 설정
-- 3. 앱 실행하여 연동 테스트
