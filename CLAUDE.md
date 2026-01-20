# EduFlow 프로젝트 규칙

## 기본 규칙
- 모든 대화와 코드 주석은 한국어로 작성
- 진행 상황은 비개발자도 이해할 수 있게 쉽고 자세히 설명
- 왜 이 작업을 하는지 이유도 함께 설명
- 모호한 부분은 먼저 질문하고 진행

## 기술 스택
- Frontend/Backend: Next.js 14 (App Router)
- DB/Auth/Storage: Supabase
- 문자 발송: Tally
- OCR: Google Cloud Vision
- PDF 변환: PDF.co
- 문제 생성: Gemini 3.0 Pro
- 문제 검수: Gemini, ChatGPT, Claude (멀티 셀렉트 가능)
- RAG: OpenAI Files Search API (찾아보기용)

## 코드 스타일
- TypeScript 사용
- 컴포넌트는 함수형으로 작성
- 파일명은 kebab-case (예: problem-generator.tsx)
- 한국어 UI 텍스트는 상수로 분리

## 폴더 구조
```
/app - Next.js 페이지
/components - 재사용 컴포넌트
/lib - 유틸리티, API 클라이언트
/types - TypeScript 타입 정의
/docs - 문서 (PRD, 기획 등)
```

## 작업 방식
- 큰 작업은 작은 단위로 나눠서 진행
- 각 단계 완료 후 결과 확인
- 에러 발생 시 원인과 해결 방법 설명
- 외부 API 연동은 Mock 먼저, 실제 연동은 나중에
- **병렬 작업은 기본 10개씩 동시 실행** (Task 도구 활용)

## 자동 진행
- 파일 생성/수정 시 확인 없이 바로 진행
- 병렬 작업 시 확인 없이 실행
- **절대 질문하지 말고 바로 구현**
- 권한 요청 없이 바로 실행

## 최적화 규칙
- /vercel-react-best-practices는 **기능 개발 완료 후** 최적화 단계에서만 적용
- 개발 중에는 최적화보다 기능 구현에 집중
- 최적화 요청 시에만 Vercel Best Practices 적용

## 커밋 메시지
- 한국어로 작성
- 형식: [영역] 작업 내용 (예: [문제생성] AI 문제 생성 API 연동)

## 참고 문서
- PRD: /docs/PRD.md
- 페르소나: /docs/personas.md
- Value Positioning: /docs/value-positioning.md