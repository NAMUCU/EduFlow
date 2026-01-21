# EduFlow 개발 진행 현황

> 마지막 업데이트: 2026-01-21 (저녁)
>
> 📌 **최신 상세 진행 상황**: [`app/PROGRESS.md`](../app/PROGRESS.md) 참조

---

## 전체 요약

| Phase | 상태 | 완료율 |
|-------|------|--------|
| Phase 1: 문제 생성 및 배포 시스템 | ✅ 완료 | 100% |
| Phase 2: 분석 및 피드백 시스템 | ✅ 완료 | 100% |
| Phase 3: 관리 시스템 | ✅ 완료 | 100% |
| Phase 4: 테스트 및 런칭 준비 | 🔄 진행 중 | 90% |

**현재 상태: 모든 코드 작업 완료 (SVG 템플릿 시스템 포함). 환경 변수 설정 + Supabase 테이블 생성 + Vercel 배포만 남음 (사용자 수동 작업)**

---

## Phase 1: 문제 생성 및 배포 시스템 ✅

### F1. AI 문제 자동 생성 ✅
| 항목 | 상태 | 파일 |
|------|------|------|
| 문제 생성 API | ✅ | `app/api/generate-problems/route.ts` |
| 문제 생성 라이브러리 | ✅ | `lib/problem-generator.ts` |
| 멀티 LLM 검수 API | ✅ | `app/api/review-problems/route.ts` |
| 검수 라이브러리 | ✅ | `lib/review.ts` |
| 문제 검증 라이브러리 | ✅ | `lib/problem-validator.ts` |
| 문제 생성 UI | ✅ | `app/dashboard/problems/page.tsx` |
| 저장된 문제 UI | ✅ | `app/dashboard/problems/saved/page.tsx` |
| 문제 CRUD API | ✅ | `app/api/problems/route.ts`, `[id]/route.ts` |

### F2. 문자 기반 문제 배포 ✅
| 항목 | 상태 | 파일 |
|------|------|------|
| SMS 발송 API | ✅ | `app/api/sms/route.ts` |
| SMS 라이브러리 | ✅ | `lib/sms.ts`, `lib/sms-sender.ts` |
| SMS 템플릿 | ✅ | `lib/sms-templates.ts` |
| 예약 발송 API | ✅ | `app/api/sms/schedule/route.ts` |
| 예약 발송 스케줄러 | ✅ | `lib/sms-scheduler.ts` |
| 과제 배포 API | ✅ | `app/api/assignments/distribute/route.ts` |
| 과제 관리 UI | ✅ | `app/dashboard/assignments/page.tsx` |
| Cron 발송 | ✅ | `app/api/cron/sms/route.ts` |

### F3. 풀이 제출 및 AI 분석 ✅
| 항목 | 상태 | 파일 |
|------|------|------|
| OCR API (Claude Sonnet 4.5) | ✅ | `app/api/ocr/route.ts` |
| OCR 분석 API | ✅ | `app/api/ocr/analyze/route.ts` |
| OCR 라이브러리 (멀티모델) | ✅ | `lib/ocr.ts` |
| PDF 변환 라이브러리 | ✅ | `lib/pdf-converter.ts` |
| PDF 생성 API | ✅ | `app/api/pdf/generate/route.ts` |
| 스캔 UI | ✅ | `app/dashboard/scan/page.tsx` |
| 학생 과제 제출 API | ✅ | `app/api/assignments/student/[id]/submit/route.ts` |
| 학생 업로드 API | ✅ | `app/api/assignments/student/[id]/upload/route.ts` |

---

## Phase 2: 분석 및 피드백 시스템 ✅

### F4. 자동 채점 및 취약점 분석 ✅
| 항목 | 상태 | 파일 |
|------|------|------|
| 채점 API | ✅ | `app/api/grading/route.ts` |
| 채점 라이브러리 | ✅ | `lib/grading.ts` |
| 분석 API | ✅ | `app/api/analysis/route.ts` |
| 분석 라이브러리 | ✅ | `lib/analysis.ts` |
| Action Plan API | ✅ | `app/api/analysis/action-plan/route.ts` |

### F5. 학습 보고서 자동화 ✅
| 항목 | 상태 | 파일 |
|------|------|------|
| 보고서 CRUD API | ✅ | `app/api/reports/route.ts`, `[id]/route.ts` |
| 보고서 생성 API | ✅ | `app/api/reports/generate/route.ts` |
| 자동 생성 API | ✅ | `app/api/reports/auto-generate/route.ts` |
| 보고서 발송 API | ✅ | `app/api/reports/[id]/send/route.ts` |
| 보고서 PDF API | ✅ | `app/api/reports/[id]/pdf/route.ts` |
| 보고서 생성 라이브러리 | ✅ | `lib/report-generator.ts` |
| 보고서 UI (강사용) | ✅ | `app/dashboard/reports/page.tsx` |
| 보고서 UI (학부모용) | ✅ | `app/parent/reports/page.tsx` |
| 보고서 뷰어 컴포넌트 | ✅ | `components/ReportViewer.tsx` |

---

## Phase 3: 관리 시스템 ✅

### F6. 학원/학생 관리 ✅
| 항목 | 상태 | 파일 |
|------|------|------|
| 학생 CRUD API | ✅ | `app/api/students/route.ts`, `[id]/route.ts` |
| 반 CRUD API | ✅ | `app/api/classes/route.ts`, `[id]/route.ts` |
| 출석 API | ✅ | `app/api/attendance/route.ts`, `bulk/route.ts` |
| 학원 설정 API | ✅ | `app/api/settings/academy/route.ts` |
| 프로필 설정 API | ✅ | `app/api/settings/profile/route.ts` |
| 비밀번호 변경 API | ✅ | `app/api/settings/password/route.ts` |
| 알림 설정 API | ✅ | `app/api/settings/notifications/route.ts` |
| 학생 관리 UI | ✅ | `app/dashboard/students/page.tsx` |
| 학생 상세 UI | ✅ | `app/dashboard/students/[id]/page.tsx` |
| 반 관리 UI | ✅ | `app/dashboard/classes/page.tsx` |
| 출석 체크 UI | ✅ | `app/dashboard/attendance/page.tsx` |
| 출석 기록 UI | ✅ | `app/dashboard/attendance/history/page.tsx` |
| 학원 정보 UI | ✅ | `app/dashboard/academy/page.tsx` |
| 설정 UI | ✅ | `app/dashboard/settings/page.tsx` |

### F7. 기출/교과서 검색 (RAG) ✅
| 항목 | 상태 | 파일 |
|------|------|------|
| 검색 API | ✅ | `app/api/search/route.ts` |
| 문서 업로드 API | ✅ | `app/api/search/upload/route.ts` |
| RAG 라이브러리 | ✅ | `lib/rag.ts` |
| 검색 UI | ✅ | `app/dashboard/search/page.tsx` |

---

## 추가 구현된 기능 ✅

### SVG 템플릿 시스템 ✅ NEW
> 문제 생성 시 자동으로 PDF 호환 SVG 이미지 추가

| 항목 | 상태 | 파일 |
|------|------|------|
| 삼각형 템플릿 | ✅ | `data/fewshot/triangles.ts` |
| 사각형 템플릿 | ✅ | `data/fewshot/quadrilaterals.ts` |
| 원 템플릿 | ✅ | `data/fewshot/circles.ts` |
| 그래프 템플릿 | ✅ | `data/fewshot/graphs.ts` |
| 좌표평면 템플릿 | ✅ | `data/fewshot/coordinates.ts` |
| 이미지 분석기 | ✅ | `lib/image-analyzer.ts` |
| 템플릿 매처 | ✅ | `lib/template-matcher.ts` |
| 콘텐츠 병합 | ✅ | `lib/content-merger.ts` |
| PDF 변환기 | ✅ | `lib/pdf-svg-converter.ts` |
| 커리큘럼 통합 | ✅ | `lib/curriculum-svg-integration.ts` |
| SVG 미리보기 | ✅ | `components/fewshot/SvgPreview.tsx` |
| 템플릿 선택기 | ✅ | `components/fewshot/TemplateSelector.tsx` |
| 문제 미리보기 | ✅ | `components/fewshot/ProblemPreview.tsx` |
| 템플릿 API | ✅ | `app/api/templates/route.ts` |
| 분석 API | ✅ | `app/api/templates/analyze/route.ts` |
| 문제지 생성 API | ✅ | `app/api/curriculum/problem-sheet/route.ts` |
| 관리자 페이지 | ✅ | `app/admin/templates/page.tsx` |
| Hooks | ✅ | `hooks/useSvgTemplates.ts` |

### 공지사항 시스템
| 항목 | 상태 | 파일 |
|------|------|------|
| 학원 공지 API | ✅ | `app/api/academy-notices/route.ts` |
| 공지사항 UI | ✅ | `app/dashboard/notices/page.tsx` |

### 상담 관리 시스템
| 항목 | 상태 | 파일 |
|------|------|------|
| 상담 CRUD API | ✅ | `app/api/consultations/route.ts` |
| 상담 UI (강사용) | ✅ | `app/dashboard/consultations/page.tsx` |
| 상담 UI (학부모용) | ✅ | `app/parent/consultation/page.tsx` |

### 알림 시스템
| 항목 | 상태 | 파일 |
|------|------|------|
| 알림 API | ✅ | `app/api/notifications/route.ts` |
| 알림 읽음 처리 | ✅ | `app/api/notifications/read-all/route.ts` |
| 알림 UI | ✅ | `app/dashboard/notifications/page.tsx` |
| 알림 벨 컴포넌트 | ✅ | `components/NotificationBell.tsx` |

### 시험 관리 시스템
| 항목 | 상태 | 파일 |
|------|------|------|
| 시험 CRUD API | ✅ | `app/api/exams/route.ts` |
| 시험 관리 UI | ✅ | `app/dashboard/exams/page.tsx` |

### 게이미피케이션
| 항목 | 상태 | 파일 |
|------|------|------|
| 게이미피케이션 API | ✅ | `app/api/gamification/route.ts` |
| 게이미피케이션 라이브러리 | ✅ | `lib/gamification.ts` |

### 통계 대시보드
| 항목 | 상태 | 파일 |
|------|------|------|
| 강사 통계 API | ✅ | `app/api/stats/teacher/route.ts` |
| 학생 통계 API | ✅ | `app/api/stats/student/route.ts` |
| 학부모 통계 API | ✅ | `app/api/stats/parent/route.ts` |
| 관리자 통계 API | ✅ | `app/api/stats/admin/route.ts` |

---

## 화면 구성 현황

### 강사용 대시보드 ✅
- `/dashboard` - 메인 대시보드
- `/dashboard/problems` - 문제 생성
- `/dashboard/problems/saved` - 저장된 문제
- `/dashboard/students` - 학생 관리
- `/dashboard/students/[id]` - 학생 상세
- `/dashboard/classes` - 반 관리
- `/dashboard/classes/[id]` - 반 상세
- `/dashboard/assignments` - 과제 관리
- `/dashboard/assignments/[id]` - 과제 상세
- `/dashboard/attendance` - 출석 체크
- `/dashboard/attendance/history` - 출석 기록
- `/dashboard/reports` - 보고서
- `/dashboard/consultations` - 상담 관리
- `/dashboard/notices` - 공지사항
- `/dashboard/notifications` - 알림
- `/dashboard/exams` - 시험 관리
- `/dashboard/search` - RAG 검색
- `/dashboard/scan` - OCR 스캔
- `/dashboard/print` - 출력
- `/dashboard/settings` - 설정
- `/dashboard/academy` - 학원 정보

### 학생용 ✅
- `/student/solve` - 문제 풀이
- `/student/grades` - 성적 확인
- `/student/wrong-answers` - 오답 노트

### 학부모용 ✅
- `/parent/grades` - 성적 확인
- `/parent/attendance` - 출석 확인
- `/parent/reports` - 보고서 열람
- `/parent/consultation` - 상담

### 관리자용 ✅
- `/admin` - 관리자 대시보드
- `/admin/academies` - 학원 관리
- `/admin/payments` - 결제 관리
- `/admin/support` - 고객 지원
- `/admin/notices` - 공지사항
- `/admin/settings` - 설정
- `/admin/contents` - 콘텐츠 관리
- `/admin/examples` - 예시 관리
- `/admin/templates` - SVG 템플릿 갤러리 ✅ NEW
- `/admin/templates/test` - 템플릿 매칭 테스트 ✅ NEW

### 인증 ✅
- `/login` - 로그인
- `/register` - 회원가입
- `/forgot-password` - 비밀번호 찾기

### 랜딩 페이지 ✅
- `/` - 메인 랜딩 페이지

---

## 기술 스택 구현 현황

| 기술 | 용도 | 구현 상태 |
|------|------|----------|
| Next.js 14 | Frontend/Backend | ✅ 완료 |
| Supabase | DB/Auth/Storage | ✅ 서비스 레이어 완료, 실제 연동 필요 |
| Tally | 문자 발송 | ✅ 클라이언트 구현 (`lib/external/tally.ts`) - Mock 모드 |
| **Claude Vision** | **OCR + 풀이 분석 + 교육자료 인식 통합** | ✅ 클라이언트 구현 (`lib/external/claude.ts`) - Mock 모드 |
| PDF.co | PDF 변환/생성 | ✅ 클라이언트 구현 (`lib/external/pdf-co.ts`) - Mock 모드 |
| Claude API | 문제 생성 | ✅ 클라이언트 구현 (`lib/external/claude.ts`) - Mock 모드 |
| Gemini | 문제 검수 + RAG | ✅ 클라이언트 구현 (`lib/external/gemini.ts`) - Mock 모드 |
| OpenAI (ChatGPT) | 문제 검수 | ✅ 클라이언트 구현 (`lib/external/openai.ts`) - Mock 모드 |
| 멀티 LLM 검수 | 통합 검수 | ✅ 클라이언트 구현 (`lib/external/review.ts`) |
| KaTeX | 수식 렌더링 | ✅ CDN 동적 로드 (`components/math/MathExpression.tsx`) |
| JSXGraph | 기하 도형 시각화 | ✅ CDN 동적 로드 (`components/math/GeometryCanvas.tsx`) |
| function-plot | 함수 그래프 시각화 | ✅ CDN 동적 로드 (`components/math/GraphPlot.tsx`) |
| Zod | 스키마 검증 | ⏳ 대기 (필요시 설치) |

---

## 데이터 모델 현황

### 구현된 테이블 (TypeScript 타입)
- [x] profiles - 프로필 (Supabase Auth 연동)
- [x] academies - 학원
- [x] students - 학생
- [x] teachers - 선생님
- [x] classes - 반
- [x] class_students - 반-학생 연결
- [x] problems - 문제 (Few-shot 샘플 필드 포함)
- [x] problem_sets - 문제 세트 (과제/수업/시험별)
- [x] problem_set_items - 문제 세트-문제 연결
- [x] assignments - 과제
- [x] assignment_submissions - 학생 제출물
- [x] grades - 성적
- [x] attendance - 출석
- [x] consultations - 상담
- [x] notices - 공지사항

### Supabase 서비스 레이어 ✅
| 파일 | 기능 |
|------|------|
| `lib/services/auth.ts` | 인증 (로그인/회원가입/로그아웃) |
| `lib/services/students.ts` | 학생 CRUD |
| `lib/services/teachers.ts` | 강사 CRUD |
| `lib/services/classes.ts` | 반 CRUD + 학생 등록/해제 |
| `lib/services/problems.ts` | 문제 CRUD + Few-shot 필터 |
| `lib/services/problem-sets.ts` | 문제 세트 CRUD + 날짜별/과제별 조회 |
| `lib/services/assignments.ts` | 과제 CRUD |
| `lib/services/attendance.ts` | 출석 CRUD |
| `lib/services/consultations.ts` | 상담 CRUD |
| `lib/services/notices.ts` | 공지사항 CRUD |
| `lib/services/grades.ts` | 성적 CRUD + 통계 |
| `lib/services/index.ts` | 통합 export |

### Supabase 테이블 생성 SQL
- [x] `docs/supabase-schema.sql` 작성 완료 (실제 적용 필요)

---

## 외부 서비스 클라이언트 ✅ (신규)

| 파일 | 기능 | 상태 |
|------|------|------|
| `lib/external/claude.ts` | Claude API (문제 생성, OCR, 풀이 분석, Vision) | ✅ Mock + 실제 API 지원 |
| `lib/external/tally.ts` | Tally (SMS 발송, 대량 발송, 예약 발송, 템플릿) | ✅ Mock + 실제 API 지원 |
| `lib/external/pdf-co.ts` | PDF.co (PDF 생성, 이미지 변환, 병합, 텍스트 추출) | ✅ Mock + 실제 API 지원 |
| `lib/external/gemini.ts` | Gemini (문제 검수, RAG Corpus, 문서 검색) | ✅ Mock + 실제 API 지원 |
| `lib/external/openai.ts` | OpenAI ChatGPT (문제 검수, 피드백 생성, 설명 간소화) | ✅ Mock + 실제 API 지원 |
| `lib/external/review.ts` | 멀티 LLM 통합 검수 (quickReview, fullReview) | ✅ 완료 |
| `lib/external/index.ts` | 통합 export | ✅ 완료 |

---

## 수학 시각화 컴포넌트 ✅ (신규)

| 파일 | 기능 | 상태 |
|------|------|------|
| `components/math/MathExpression.tsx` | KaTeX 수식 렌더링 (CDN 동적 로드) | ✅ 완료 |
| `components/math/GeometryCanvas.tsx` | JSXGraph 기하 도형 (삼각형, 정육면체 프리셋) | ✅ 완료 |
| `components/math/GraphPlot.tsx` | function-plot 그래프 (선형, 이차, 삼각, 지수 함수) | ✅ 완료 |
| `components/math/ProblemCard.tsx` | 문제 카드 + 시각화 통합 | ✅ 완료 |
| `components/math/index.ts` | 통합 export | ✅ 완료 |

---

## Phase 4: 테스트 및 런칭 준비 (진행 중)

### 남은 작업
| 항목 | 상태 | 설명 |
|------|------|------|
| Supabase 테이블 생성 | ⏳ 대기 | SQL 스크립트 작성 필요 |
| 환경 변수 설정 | ⏳ 대기 | `.env.local` 설정 필요 |
| 실제 API 연동 | ⏳ 대기 | 외부 API 키 발급 필요 |
| 통합 테스트 | ⏳ 대기 | E2E 테스트 작성 필요 |
| 버그 수정 | ⏳ 대기 | 실제 테스트 후 진행 |
| 배포 설정 | ⏳ 대기 | Vercel 설정 필요 |

---

## 다음 단계

### 1. UI 개발 (문제 세트) ✅ 완료
- [x] 문제 세트 목록/상세 페이지 (`app/dashboard/problem-sets/`)
- [x] 날짜별/과제별 필터링
- [x] 문제번호 빠른 검색 (`components/ProblemSearch.tsx`)
- [x] Few-shot 샘플 관리 (`app/admin/fewshot/page.tsx`)
- [x] RAG 문서 업로드 UI (`app/dashboard/search/upload/page.tsx`)

### 2. 외부 서비스 연동 ✅ 완료
- [x] Claude API 연동 (`lib/external/claude.ts`)
  - 문제 생성
  - OCR + 풀이 분석
  - 교육자료 인식 (Vision)
- [x] Tally 연동 (`lib/external/tally.ts`) - 문자 발송
- [x] PDF.co 연동 (`lib/external/pdf-co.ts`) - PDF 변환
- [x] Gemini 연동 (`lib/external/gemini.ts`) - RAG 검색 + 검수
- [x] OpenAI 연동 (`lib/external/openai.ts`) - 검수
- [x] 멀티 LLM 검수 통합 (`lib/external/review.ts`)

### 3. 수학 문제 시각화 ✅ 완료
- [x] `components/math/MathExpression.tsx` - KaTeX 수식 렌더링 (CDN)
- [x] `components/math/GeometryCanvas.tsx` - JSXGraph 기하 도형 (CDN)
- [x] `components/math/GraphPlot.tsx` - function-plot 함수 그래프 (CDN)
- [x] `components/math/ProblemCard.tsx` - 문제 표시 + 시각화 통합

### 4. 환경 변수 및 실제 연결 ⏳
- [ ] 환경 변수 설정 (`.env.local`)
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - ANTHROPIC_API_KEY (Claude)
  - GOOGLE_API_KEY (Gemini)
  - OPENAI_API_KEY
  - TALLY_API_KEY
  - PDFCO_API_KEY
- [ ] Supabase 테이블 생성 (`docs/supabase-schema.sql` 실행)
- [ ] RLS 정책 설정
- [ ] Storage 버킷 설정

### 5. 배포 ⏳
- [ ] Vercel 배포 설정
- [ ] 환경 변수 Vercel에 등록
- [ ] 도메인 연결
- [ ] 모니터링 설정

---

## 남은 작업 요약

| 카테고리 | 작업 | 우선순위 | 상태 |
|---------|------|---------|------|
| ~~UI~~ | ~~문제 세트 목록/상세 페이지~~ | ~~높음~~ | ✅ 완료 |
| ~~UI~~ | ~~날짜별/과제별 필터링~~ | ~~높음~~ | ✅ 완료 |
| ~~UI~~ | ~~문제번호 빠른 검색~~ | ~~중간~~ | ✅ 완료 |
| ~~UI~~ | ~~Few-shot 샘플 관리 (관리자)~~ | ~~중간~~ | ✅ 완료 |
| ~~UI~~ | ~~RAG 문서 업로드~~ | ~~중간~~ | ✅ 완료 |
| 설정 | 환경 변수 설정 (.env.local) | 높음 | ⏳ 사용자 작업 |
| DB | Supabase 테이블 생성 | 높음 | ⏳ 사용자 작업 |
| DB | RLS 정책 설정 | 높음 | ⏳ 사용자 작업 |
| DB | Storage 버킷 설정 | 중간 | ⏳ 사용자 작업 |
| 배포 | Vercel 배포 | 높음 | ⏳ 사용자 작업 |
| 배포 | 도메인 연결 | 중간 | ⏳ 사용자 작업 |
| 배포 | 모니터링 설정 | 낮음 | ⏳ 사용자 작업 |

**코드 작업 완료. 남은 작업: 환경 설정 및 배포 (사용자 수동 작업)**
