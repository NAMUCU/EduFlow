/**
 * EduFlow 데이터베이스 타입 정의
 *
 * 이 파일은 Supabase 데이터베이스의 모든 테이블에 대한 TypeScript 타입을 정의합니다.
 * Supabase 클라이언트에서 이 타입을 사용하면 자동완성과 타입 검사가 가능해집니다.
 *
 * 참고: Supabase CLI를 사용하면 이 타입을 자동으로 생성할 수 있습니다.
 * npx supabase gen types typescript --project-id <project-id> > types/database.ts
 */

// ============================================
// ENUM 타입 정의
// ============================================

/** 사용자 역할 */
export type UserRole = 'owner' | 'teacher' | 'parent' | 'student'

/** 학원 요금제 */
export type AcademyPlan = 'free' | 'basic' | 'pro' | 'enterprise'

/** 문제 유형 */
export type ProblemType = 'multiple_choice' | 'short_answer' | 'true_false' | 'essay'

/** 문제 난이도 */
export type ProblemDifficulty = 'easy' | 'medium' | 'hard'

/** 과제 진행 상태 */
export type AssignmentStatus = 'not_started' | 'in_progress' | 'submitted' | 'graded'

/** 출석 상태 */
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave'

/** 상담 유형 */
export type ConsultationType = 'in_person' | 'phone' | 'video'

/** 상담 상태 */
export type ConsultationStatus = 'scheduled' | 'completed' | 'cancelled'

// ============================================
// 테이블 Row 타입 정의
// ============================================

/**
 * 사용자 (users)
 * 모든 사용자의 기본 정보를 저장합니다.
 */
export interface User {
  id: string                      // UUID, Primary Key
  email: string                   // 이메일 (로그인 ID)
  name: string                    // 이름
  role: UserRole                  // 역할
  phone: string | null            // 전화번호
  profile_image: string | null    // 프로필 이미지 URL
  created_at: string              // 생성 일시 (ISO 8601 형식)
  updated_at: string              // 수정 일시 (ISO 8601 형식)
}

/**
 * 학원 (academies)
 * 학원 정보를 저장합니다.
 */
export interface Academy {
  id: string                      // UUID, Primary Key
  name: string                    // 학원 이름
  owner_id: string                // 학원장 ID (users.id 참조)
  address: string | null          // 학원 주소
  phone: string | null            // 학원 전화번호
  plan: AcademyPlan               // 요금제
  logo_image: string | null       // 학원 로고 이미지 URL
  business_number: string | null  // 사업자 등록번호
  created_at: string              // 생성 일시
  updated_at: string              // 수정 일시
}

/**
 * 학생 (students)
 * 학생의 추가 정보를 저장합니다.
 */
export interface Student {
  id: string                      // UUID, Primary Key
  user_id: string                 // 사용자 ID (users.id 참조)
  academy_id: string              // 소속 학원 ID (academies.id 참조)
  grade: string | null            // 학년 (예: '중1', '고2')
  parent_id: string | null        // 학부모 ID (users.id 참조)
  school_name: string | null      // 학교 이름
  class_name: string | null       // 반 이름
  memo: string | null             // 메모
  created_at: string              // 생성 일시
  updated_at: string              // 수정 일시
}

/**
 * 선생님 (teachers)
 * 선생님의 추가 정보를 저장합니다.
 */
export interface Teacher {
  id: string                      // UUID, Primary Key
  user_id: string                 // 사용자 ID (users.id 참조)
  academy_id: string              // 소속 학원 ID (academies.id 참조)
  subjects: string[]              // 담당 과목 목록
  bio: string | null              // 자기소개
  created_at: string              // 생성 일시
  updated_at: string              // 수정 일시
}

/**
 * 객관식 문제의 보기
 */
export interface ProblemOption {
  id: string                      // 보기 ID (예: 'A', 'B', 'C', 'D')
  text: string                    // 보기 내용
  is_correct?: boolean            // 정답 여부 (선택적)
}

/**
 * 문제 (problems)
 * AI로 생성되거나 직접 입력한 문제를 저장합니다.
 */
export interface Problem {
  id: string                      // UUID, Primary Key
  subject: string                 // 과목
  grade: string                   // 대상 학년
  unit: string | null             // 단원명
  question: string                // 문제 내용
  answer: string                  // 정답
  solution: string | null         // 풀이 (해설)
  difficulty: ProblemDifficulty   // 난이도
  type: ProblemType               // 문제 유형
  options: ProblemOption[] | null // 객관식 보기 (객관식일 경우)
  image_url: string | null        // 문제 이미지 URL
  tags: string[] | null           // 태그
  academy_id: string | null       // 학원 ID
  created_by: string | null       // 문제 생성자 ID
  is_public: boolean              // 공개 문제 여부
  ai_generated: boolean           // AI 생성 여부
  created_at: string              // 생성 일시
  updated_at: string              // 수정 일시
}

/**
 * 과제 (assignments)
 * 선생님이 학생들에게 부여하는 과제를 저장합니다.
 */
export interface Assignment {
  id: string                      // UUID, Primary Key
  title: string                   // 과제 제목
  description: string | null      // 과제 설명
  academy_id: string              // 학원 ID
  teacher_id: string              // 출제 선생님 ID (teachers.id 참조)
  problems: string[]              // 포함된 문제 ID 목록
  due_date: string | null         // 마감일 (ISO 8601 형식)
  time_limit: number | null       // 제한 시간 (분)
  is_active: boolean              // 활성화 여부
  created_at: string              // 생성 일시
  updated_at: string              // 수정 일시
}

/**
 * 학생 답안
 */
export interface StudentAnswer {
  problem_id: string              // 문제 ID
  answer: string                  // 학생의 답
  is_correct?: boolean            // 정답 여부
  score?: number                  // 획득 점수
}

/**
 * 학생 과제 (student_assignments)
 * 학생별 과제 진행 상황과 결과를 저장합니다.
 */
export interface StudentAssignment {
  id: string                      // UUID, Primary Key
  assignment_id: string           // 과제 ID (assignments.id 참조)
  student_id: string              // 학생 ID (students.id 참조)
  status: AssignmentStatus        // 진행 상태
  score: number | null            // 점수
  answers: StudentAnswer[] | null // 학생의 답안
  feedback: string | null         // 선생님 피드백
  started_at: string | null       // 시작 시간
  submitted_at: string | null     // 제출 시간
  graded_at: string | null        // 채점 시간
  created_at: string              // 생성 일시
  updated_at: string              // 수정 일시
}

/**
 * 성적 (grades)
 * 학생의 과목별, 단원별 성적을 저장합니다.
 */
export interface Grade {
  id: string                      // UUID, Primary Key
  student_id: string              // 학생 ID (students.id 참조)
  subject: string                 // 과목
  unit: string | null             // 단원
  score: number                   // 점수
  max_score: number               // 만점
  exam_type: string | null        // 시험 유형
  date: string                    // 시험 날짜 (YYYY-MM-DD)
  memo: string | null             // 메모
  created_at: string              // 생성 일시
  updated_at: string              // 수정 일시
}

/**
 * 출석 (attendance)
 * 학생의 출석 기록을 저장합니다.
 */
export interface Attendance {
  id: string                      // UUID, Primary Key
  student_id: string              // 학생 ID (students.id 참조)
  date: string                    // 날짜 (YYYY-MM-DD)
  status: AttendanceStatus        // 출석 상태
  check_in_time: string | null    // 등원 시간 (HH:MM:SS)
  check_out_time: string | null   // 하원 시간 (HH:MM:SS)
  note: string | null             // 비고
  created_at: string              // 생성 일시
  updated_at: string              // 수정 일시
}

/**
 * 상담 (consultations)
 * 학부모-선생님 상담 일정과 기록을 저장합니다.
 */
export interface Consultation {
  id: string                      // UUID, Primary Key
  parent_id: string               // 학부모 ID (users.id 참조)
  teacher_id: string              // 선생님 ID (teachers.id 참조)
  student_id: string | null       // 해당 학생 ID (students.id 참조)
  type: ConsultationType          // 상담 유형
  date: string                    // 상담 일시 (ISO 8601 형식)
  duration: number                // 상담 시간 (분)
  topic: string | null            // 상담 주제
  notes: string | null            // 상담 내용/기록
  status: ConsultationStatus      // 상담 상태
  created_at: string              // 생성 일시
  updated_at: string              // 수정 일시
}

// ============================================
// 테이블 Insert/Update 타입 정의
// ============================================
// Insert: 새 데이터를 삽입할 때 사용 (id, created_at 등은 선택적)
// Update: 데이터를 수정할 때 사용 (모든 필드가 선택적)

/** 사용자 삽입용 타입 */
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/** 사용자 수정용 타입 */
export type UserUpdate = Partial<UserInsert>

/** 학원 삽입용 타입 */
export type AcademyInsert = Omit<Academy, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/** 학원 수정용 타입 */
export type AcademyUpdate = Partial<AcademyInsert>

/** 학생 삽입용 타입 */
export type StudentInsert = Omit<Student, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/** 학생 수정용 타입 */
export type StudentUpdate = Partial<StudentInsert>

/** 선생님 삽입용 타입 */
export type TeacherInsert = Omit<Teacher, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/** 선생님 수정용 타입 */
export type TeacherUpdate = Partial<TeacherInsert>

/** 문제 삽입용 타입 */
export type ProblemInsert = Omit<Problem, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/** 문제 수정용 타입 */
export type ProblemUpdate = Partial<ProblemInsert>

/** 과제 삽입용 타입 */
export type AssignmentInsert = Omit<Assignment, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/** 과제 수정용 타입 */
export type AssignmentUpdate = Partial<AssignmentInsert>

/** 학생 과제 삽입용 타입 */
export type StudentAssignmentInsert = Omit<StudentAssignment, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/** 학생 과제 수정용 타입 */
export type StudentAssignmentUpdate = Partial<StudentAssignmentInsert>

/** 성적 삽입용 타입 */
export type GradeInsert = Omit<Grade, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/** 성적 수정용 타입 */
export type GradeUpdate = Partial<GradeInsert>

/** 출석 삽입용 타입 */
export type AttendanceInsert = Omit<Attendance, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/** 출석 수정용 타입 */
export type AttendanceUpdate = Partial<AttendanceInsert>

/** 상담 삽입용 타입 */
export type ConsultationInsert = Omit<Consultation, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/** 상담 수정용 타입 */
export type ConsultationUpdate = Partial<ConsultationInsert>

// ============================================
// Supabase Database 타입 (자동 생성 형식)
// ============================================
// 이 형식은 Supabase 클라이언트의 제네릭 타입으로 사용됩니다.

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: UserInsert
        Update: UserUpdate
      }
      academies: {
        Row: Academy
        Insert: AcademyInsert
        Update: AcademyUpdate
      }
      students: {
        Row: Student
        Insert: StudentInsert
        Update: StudentUpdate
      }
      teachers: {
        Row: Teacher
        Insert: TeacherInsert
        Update: TeacherUpdate
      }
      problems: {
        Row: Problem
        Insert: ProblemInsert
        Update: ProblemUpdate
      }
      assignments: {
        Row: Assignment
        Insert: AssignmentInsert
        Update: AssignmentUpdate
      }
      student_assignments: {
        Row: StudentAssignment
        Insert: StudentAssignmentInsert
        Update: StudentAssignmentUpdate
      }
      grades: {
        Row: Grade
        Insert: GradeInsert
        Update: GradeUpdate
      }
      attendance: {
        Row: Attendance
        Insert: AttendanceInsert
        Update: AttendanceUpdate
      }
      consultations: {
        Row: Consultation
        Insert: ConsultationInsert
        Update: ConsultationUpdate
      }
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      rag_documents: {
        Row: RagDocument
        Insert: RagDocumentInsert
        Update: RagDocumentUpdate
      }
      document_chunks: {
        Row: DocumentChunk
        Insert: DocumentChunkInsert
        Update: DocumentChunkUpdate
      }
      fewshot_examples: {
        Row: FewshotExample
        Insert: FewshotExampleInsert
        Update: FewshotExampleUpdate
      }
    }
    Enums: {
      user_role: UserRole
      academy_plan: AcademyPlan
      problem_type: ProblemType
      problem_difficulty: ProblemDifficulty
      assignment_status: AssignmentStatus
      attendance_status: AttendanceStatus
      consultation_type: ConsultationType
      consultation_status: ConsultationStatus
      profile_role: ProfileRole
      rag_document_type: RagDocumentType
    }
  }
}

// ============================================
// 한국어 라벨 상수 (UI 표시용)
// ============================================

/** 사용자 역할 한국어 라벨 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  owner: '학원장',
  teacher: '선생님',
  parent: '학부모',
  student: '학생',
}

/** 학원 요금제 한국어 라벨 */
export const ACADEMY_PLAN_LABELS: Record<AcademyPlan, string> = {
  free: '무료',
  basic: '베이직',
  pro: '프로',
  enterprise: '엔터프라이즈',
}

/** 문제 유형 한국어 라벨 */
export const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  multiple_choice: '객관식',
  short_answer: '주관식',
  true_false: 'O/X',
  essay: '서술형',
}

/** 문제 난이도 한국어 라벨 */
export const PROBLEM_DIFFICULTY_LABELS: Record<ProblemDifficulty, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
}

/** 과제 상태 한국어 라벨 */
export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  not_started: '미시작',
  in_progress: '진행 중',
  submitted: '제출 완료',
  graded: '채점 완료',
}

/** 출석 상태 한국어 라벨 */
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: '출석',
  absent: '결석',
  late: '지각',
  early_leave: '조퇴',
}

/** 상담 유형 한국어 라벨 */
export const CONSULTATION_TYPE_LABELS: Record<ConsultationType, string> = {
  in_person: '대면',
  phone: '전화',
  video: '화상',
}

/** 상담 상태 한국어 라벨 */
export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  scheduled: '예약됨',
  completed: '완료',
  cancelled: '취소됨',
}

// ============================================
// 추가 타입 정의 (profiles, rag_documents)
// ============================================

/** 사용자 프로필 역할 (Supabase Auth 연동용) */
export type ProfileRole = 'super_admin' | 'admin' | 'teacher' | 'parent' | 'student'

/**
 * 사용자 프로필 (profiles)
 * Supabase Auth와 연동되는 사용자 확장 정보
 */
export interface Profile {
  id: string                      // UUID, Primary Key (auth.users.id와 동일)
  email: string                   // 이메일
  name: string                    // 이름
  role: ProfileRole               // 역할
  academy_id: string | null       // 소속 학원 ID
  phone: string | null            // 전화번호
  avatar_url: string | null       // 프로필 이미지 URL
  created_at: string              // 생성 일시
  updated_at: string              // 수정 일시
}

/** 프로필 삽입용 타입 */
export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'> & {
  created_at?: string
  updated_at?: string
}

/** 프로필 수정용 타입 */
export type ProfileUpdate = Partial<ProfileInsert>

/** RAG 문서 유형 */
export type RagDocumentType = 'exam' | 'textbook' | 'mockexam' | 'workbook'

/**
 * RAG 문서 (rag_documents)
 * 기출문제/교과서 검색용 문서 메타데이터
 */
export interface RagDocument {
  id: string                        // UUID, Primary Key
  filename: string                  // 원본 파일명
  type: RagDocumentType             // 문서 유형
  subject: string                   // 과목
  grade: string                     // 학년
  unit: string | null               // 단원
  publisher: string | null          // 출판사/출처
  year: number | null               // 출제년도
  month: number | null              // 출제월
  academy_id: string                // 학원 ID
  uploaded_by: string               // 업로드한 사용자 ID
  storage_path: string              // Supabase Storage 경로
  file_search_store_id: string | null    // Gemini File Search Store ID
  gemini_file_id: string | null     // Gemini File ID
  file_size: number | null          // 파일 크기 (bytes)
  page_count: number | null         // 페이지 수
  status: string                    // 상태 (processing, ready, error)
  error_message: string | null      // 에러 메시지
  // pgvector 관련 필드
  pgvector_indexed: boolean         // pgvector 인덱싱 여부
  pgvector_indexed_at: string | null // pgvector 인덱싱 일시
  chunk_count: number | null        // 청크 수
  created_at: string                // 생성 일시
  updated_at: string                // 수정 일시
}

/** RAG 문서 삽입용 타입 */
export type RagDocumentInsert = Omit<RagDocument, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

/** RAG 문서 수정용 타입 */
export type RagDocumentUpdate = Partial<RagDocumentInsert>

/**
 * 문서 청크 (document_chunks)
 * pgvector RAG용 문서 청크와 임베딩
 */
export interface DocumentChunk {
  id: string                        // UUID, Primary Key
  document_id: string               // 문서 ID (rag_documents.id 참조)
  academy_id: string                // 학원 ID
  content: string                   // 청크 내용
  chunk_index: number               // 청크 인덱스
  embedding: string | null          // 벡터 임베딩 (pgvector 문자열)
  metadata: DocumentChunkMetadata | null // 메타데이터
  token_count: number | null        // 토큰 수
  created_at: string                // 생성 일시
}

/** 문서 청크 메타데이터 */
export interface DocumentChunkMetadata {
  page_number?: number
  section?: string
  problem_number?: string
  tags?: string[]
  source_filename?: string
  subject?: string
  grade?: string
  unit?: string
  chunk_index?: number
  total_chunks?: number
}

/** 문서 청크 삽입용 타입 */
export type DocumentChunkInsert = Omit<DocumentChunk, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

/** 문서 청크 수정용 타입 */
export type DocumentChunkUpdate = Partial<DocumentChunkInsert>

/**
 * Few-shot 예시 (fewshot_examples)
 * AI 문제 생성 시 참고할 예시 문제
 */
export interface FewshotExample {
  id: string                        // UUID, Primary Key
  subject: string                   // 과목 (수학, 영어, 과학 등)
  grade: string                     // 학년 (중1, 중2, 고1 등)
  unit: string                      // 단원명
  difficulty: ProblemDifficulty     // 난이도
  question: string                  // 문제 내용 (LaTeX 지원)
  answer: string                    // 정답
  solution: string | null           // 풀이 과정
  tags: string[]                    // 태그 목록
  usage_count: number               // 사용 횟수
  is_active: boolean                // 활성화 여부
  academy_id: string | null         // 학원 ID (null = 공용)
  created_by: string | null         // 생성자 ID
  created_at: string                // 생성 일시
  updated_at: string                // 수정 일시
}

/** Few-shot 예시 삽입용 타입 */
export type FewshotExampleInsert = Omit<FewshotExample, 'id' | 'usage_count' | 'created_at' | 'updated_at'> & {
  id?: string
  usage_count?: number
  created_at?: string
  updated_at?: string
}

/** Few-shot 예시 수정용 타입 */
export type FewshotExampleUpdate = Partial<FewshotExampleInsert>

/** 프로필 역할 한국어 라벨 */
export const PROFILE_ROLE_LABELS: Record<ProfileRole, string> = {
  super_admin: '최고 관리자',
  admin: '관리자',
  teacher: '선생님',
  parent: '학부모',
  student: '학생',
}

/** RAG 문서 유형 한국어 라벨 */
export const RAG_DOCUMENT_TYPE_LABELS: Record<RagDocumentType, string> = {
  exam: '기출문제',
  textbook: '교과서',
  mockexam: '모의고사',
  workbook: '문제집',
}
