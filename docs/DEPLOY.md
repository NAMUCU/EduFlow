# EduFlow 배포 가이드

## 1. 사전 준비

### 1.1 필요한 계정
| 서비스 | 용도 | 가입 링크 |
|--------|------|----------|
| Vercel | 호스팅 | https://vercel.com |
| Supabase | DB/Auth/Storage | https://supabase.com |
| Anthropic | Claude API (문제 생성/OCR) | https://console.anthropic.com |
| Google AI | Gemini API (검수/RAG) | https://makersuite.google.com |
| OpenAI | ChatGPT API (검수) | https://platform.openai.com |
| Tally | 문자 발송 | https://www.tally.so |
| PDF.co | PDF 변환 | https://pdf.co |

### 1.2 API 키 발급
각 서비스에서 API 키를 발급받아 준비합니다.

---

## 2. Supabase 설정

### 2.1 프로젝트 생성
1. https://supabase.com 로그인
2. "New Project" 클릭
3. 프로젝트 이름, 비밀번호, 리전 설정 (ap-northeast-1 권장)

### 2.2 테이블 생성
1. SQL Editor 열기
2. `docs/supabase-schema.sql` 내용 복사/붙여넣기
3. "Run" 실행

### 2.3 RLS (Row Level Security) 설정
```sql
-- 예시: students 테이블 RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 같은 학원 소속만 조회 가능
CREATE POLICY "Academy members can view students"
ON students FOR SELECT
USING (academy_id IN (
  SELECT academy_id FROM profiles WHERE id = auth.uid()
));

-- 강사만 학생 추가 가능
CREATE POLICY "Teachers can insert students"
ON students FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teachers WHERE user_id = auth.uid()
  )
);
```

### 2.4 Storage 버킷 설정
1. Storage 메뉴 이동
2. "New Bucket" 클릭
3. 버킷 생성:
   - `submissions` - 학생 제출물 (이미지/PDF)
   - `documents` - RAG용 문서
   - `reports` - 생성된 보고서

### 2.5 환경 변수 복사
Project Settings > API에서:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. 로컬 개발 환경

### 3.1 환경 변수 설정
```bash
# .env.example을 복사
cp .env.example .env.local

# .env.local 파일 편집하여 실제 값 입력
```

### 3.2 의존성 설치 및 실행
```bash
npm install
npm run dev
```

### 3.3 테스트
```bash
# 빌드 테스트
npm run build

# 프로덕션 모드 테스트
npm start
```

---

## 4. Vercel 배포

### 4.1 GitHub 연결
1. https://vercel.com 로그인
2. "Import Project" 클릭
3. GitHub 저장소 선택

### 4.2 환경 변수 설정
Vercel 프로젝트 설정 > Environment Variables에서 모든 환경 변수 입력:

| 변수명 | 설명 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 키 |
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `GOOGLE_API_KEY` | Gemini API 키 |
| `OPENAI_API_KEY` | OpenAI API 키 |
| `TALLY_API_KEY` | Tally API 키 |
| `PDFCO_API_KEY` | PDF.co API 키 |
| `NEXT_PUBLIC_APP_URL` | 배포 URL |

### 4.3 빌드 설정
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 4.4 배포
"Deploy" 클릭하면 자동으로 배포됩니다.

---

## 5. 도메인 설정

### 5.1 Vercel 도메인
1. Project Settings > Domains
2. 원하는 도메인 입력
3. DNS 설정 안내에 따라 설정

### 5.2 Supabase URL 업데이트
도메인 변경 후 Supabase Authentication > URL Configuration에서:
- Site URL 업데이트
- Redirect URLs에 새 도메인 추가

---

## 6. 운영 체크리스트

### 6.1 보안
- [ ] 환경 변수가 `.gitignore`에 포함되어 있는지 확인
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 클라이언트에 노출되지 않는지 확인
- [ ] RLS 정책이 모든 테이블에 적용되어 있는지 확인

### 6.2 성능
- [ ] 이미지 최적화 (next/image 사용)
- [ ] API 응답 캐싱
- [ ] 번들 사이즈 확인

### 6.3 모니터링
- [ ] Vercel Analytics 활성화
- [ ] Supabase 대시보드 모니터링
- [ ] 에러 로깅 설정 (Sentry 등)

---

## 7. 문제 해결

### 7.1 빌드 실패
```bash
# 로컬에서 빌드 테스트
npm run build

# 타입 에러 확인
npx tsc --noEmit
```

### 7.2 환경 변수 문제
- `NEXT_PUBLIC_` 접두사: 클라이언트에서 사용 가능
- 접두사 없음: 서버에서만 사용 가능

### 7.3 Supabase 연결 문제
```typescript
// lib/supabase.ts에서 연결 확인
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

---

## 8. 업데이트 배포

### 8.1 자동 배포 (권장)
GitHub main 브랜치에 push하면 자동으로 배포됩니다.

### 8.2 수동 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

---

## 9. 롤백

### 9.1 Vercel 대시보드
Deployments 탭에서 이전 배포 선택 > "Promote to Production"

### 9.2 CLI
```bash
vercel rollback
```
