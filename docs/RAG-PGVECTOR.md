# pgvector RAG 시스템 가이드

EduFlow의 새로운 벡터 검색 기반 RAG 시스템입니다. 기존 Gemini File Search API와 병행 운영됩니다.

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                         문서 업로드                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PDF 텍스트 추출                              │
│   ┌─────────────┐    ┌─────────────┐                            │
│   │  PDF.co     │ or │ Gemini      │                            │
│   │  (텍스트PDF) │    │ Vision      │                            │
│   │             │    │ (스캔PDF)   │                            │
│   └─────────────┘    └─────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      청크 분할 + 전처리                           │
│   • 문제 단위 분할 (교육 콘텐츠)                                   │
│   • 문단 단위 분할                                                │
│   • 512 토큰 제한 + 50 토큰 오버랩                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     임베딩 생성 (OpenAI)                          │
│   • text-embedding-3-small (1536 dimensions)                    │
│   • 배치 처리 (100개씩)                                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase pgvector 저장                         │
│   • document_chunks 테이블                                       │
│   • IVFFlat 인덱스 (cosine similarity)                           │
│   • RLS로 학원별 데이터 격리                                       │
└─────────────────────────────────────────────────────────────────┘
```

## 투 트랙 운영

| 방식 | 장점 | 단점 | 사용 시나리오 |
|------|------|------|---------------|
| **pgvector** | 관리 용이, 비용 효율, 커스터마이징 | 자체 인프라 관리 | 기본 권장 |
| **Gemini File Search** | Google 관리형, 대용량 처리 | 관리 어려움, 비용 | 대규모 문서 |

## API 엔드포인트

### 1. 문서 업로드 + 인덱싱
```bash
POST /api/rag/upload
Content-Type: multipart/form-data

# 파라미터
- file: PDF/TXT 파일 (필수)
- academyId: 학원 ID (필수)
- userId: 업로드 사용자 ID
- type: 문서 유형 (exam/textbook/mockexam/workbook)
- subject: 과목
- grade: 학년
- unit: 단원
- year: 연도
- indexMethod: 'pgvector' | 'gemini' | 'both' (기본: pgvector)
```

### 2. 벡터 검색
```bash
POST /api/rag/search

{
  "query": "이차방정식의 근의 공식",
  "academyId": "academy-uuid",
  "topK": 10,
  "threshold": 0.7,
  "filters": {
    "subject": "수학",
    "grade": "고1"
  },
  "useHybrid": true  // 키워드 + 벡터 하이브리드 검색
}
```

### 3. RAG 생성 (검색 + 응답 생성)
```bash
POST /api/rag/generate

{
  "query": "이차방정식 문제 3개 만들어줘",
  "academyId": "academy-uuid",
  "searchConfig": {
    "topK": 5,
    "filters": { "subject": "수학" }
  },
  "generateModel": "gemini",  // gemini | openai
  "stream": false
}
```

### 4. 통합 API (투 트랙 선택)
```bash
POST /api/rag/unified

{
  "method": "auto",  // 'pgvector' | 'gemini' | 'auto'
  "query": "검색어",
  "academyId": "academy-uuid",
  "action": "search",  // 'search' | 'generate' | 'chat'
  "searchOptions": { ... },
  "generateOptions": { "stream": true }
}
```

### 5. 인덱싱 관리
```bash
# 개별 문서 인덱싱
POST /api/rag/index
{
  "documentId": "doc-uuid",
  "academyId": "academy-uuid",
  "content": "문서 텍스트 (선택, 없으면 DB에서 조회)"
}

# 인덱스 삭제
DELETE /api/rag/index?documentId=doc-uuid
```

### 6. 통계 조회
```bash
GET /api/rag/stats?academyId=academy-uuid&includeUnindexed=true
```

## 데이터베이스 스키마

### document_chunks 테이블
```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES rag_documents(id),
  academy_id UUID REFERENCES academies(id),
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(1536),  -- OpenAI embedding
  metadata JSONB,
  token_count INTEGER,
  created_at TIMESTAMP
);

-- 벡터 검색 인덱스
CREATE INDEX document_chunks_embedding_idx
ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

### 검색 함수
```sql
-- 순수 벡터 검색
SELECT * FROM search_document_chunks(
  query_embedding := '[0.1, 0.2, ...]'::vector,
  match_academy_id := 'academy-uuid',
  match_count := 10,
  match_threshold := 0.7
);

-- 하이브리드 검색 (벡터 + 키워드)
SELECT * FROM hybrid_search_chunks(
  query_embedding := '[...]'::vector,
  query_text := '검색어',
  match_academy_id := 'academy-uuid',
  vector_weight := 0.7,
  keyword_weight := 0.3
);
```

## 사용 예시

### JavaScript/TypeScript
```typescript
import {
  indexDocument,
  searchDocuments,
  generateWithRAG,
  streamWithRAG,
} from '@/lib/rag-pgvector';

// 1. 문서 인덱싱
const result = await indexDocument(
  'doc-uuid',
  '문서 전체 텍스트...',
  'academy-uuid',
  { subject: '수학', grade: '고1' }
);
console.log(`${result.chunkCount}개 청크 생성`);

// 2. 검색
const searchResult = await searchDocuments({
  query: '이차방정식',
  academyId: 'academy-uuid',
  topK: 5,
  useHybrid: true,
});

// 3. RAG 생성
const answer = await generateWithRAG({
  query: '이차방정식의 근의 공식을 설명해줘',
  academyId: 'academy-uuid',
});
console.log(answer.answer);
console.log('출처:', answer.sources);

// 4. 스트리밍
for await (const chunk of streamWithRAG({ query, academyId })) {
  process.stdout.write(chunk);
}
```

### React 컴포넌트
```tsx
'use client';

import { useState } from 'react';

export function RAGChat({ academyId }: { academyId: string }) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setAnswer('');

    const response = await fetch('/api/rag/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        academyId,
        generateOptions: { stream: true },
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const { text } = JSON.parse(data);
            setAnswer(prev => prev + text);
          } catch {}
        }
      }
    }

    setLoading(false);
  };

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="질문을 입력하세요..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? '검색 중...' : '검색'}
      </button>
      <div>{answer}</div>
    </div>
  );
}
```

## 환경 변수

```env
# 필수
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...  # 임베딩용
GOOGLE_API_KEY=...     # Gemini 생성용

# 선택 (PDF 추출)
PDFCO_API_KEY=...
```

## 마이그레이션 실행

```bash
# Supabase CLI
supabase db push

# 또는 SQL Editor에서 직접 실행
# app/supabase/migrations/002_add_pgvector_rag.sql
```

## 성능 최적화 팁

1. **청크 크기**: 512 토큰이 기본값. 문서 유형에 따라 조정
2. **임베딩 배치**: 100개씩 배치 처리로 API 호출 최소화
3. **인덱스 튜닝**: 데이터 10만 건 이상 시 IVFFlat lists 값 조정
4. **캐싱**: 자주 사용되는 쿼리는 LRU 캐시 적용

## 문제 해결

### "vector 타입을 찾을 수 없음"
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### "인덱스 생성 실패"
데이터가 충분히 있어야 IVFFlat 인덱스 생성 가능. 최소 100개 이상 권장.

### "임베딩 생성 실패"
- OpenAI API 키 확인
- 텍스트 길이 제한 (8191 토큰) 확인
