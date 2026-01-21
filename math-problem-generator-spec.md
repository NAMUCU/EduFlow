# 수학 문제 자동생성 시스템 기술 스택

## 프로젝트 개요

학원 선생님들에게 학생용 수학 문제를 자동 생성하여 전달하는 시스템. 퓨샷 문제 데이터(수능, 모의고사 등)와 과목별/학년별/단원별 커리큘럼을 기반으로 문제를 생성한다.

> **업데이트 (2026-01-21)**: Claude Vision으로 OCR/교육자료 인식 통합. Google Cloud Vision 제거.

## 기술 스택 (Next.js 기반)

### 필수 패키지 설치

```bash
npm install jsxgraph function-plot katex react-katex @anthropic-ai/sdk @react-pdf/renderer zod
```

### 패키지별 역할

| 패키지 | 역할 | 비고 |
|--------|------|------|
| `jsxgraph` | 기하 도형 시각화 | 점, 선, 원, 각도, 삼각형, 사각형, 공간도형(2D 투영) 전부 처리 |
| `function-plot` | 함수 그래프 시각화 | 일차함수, 이차함수, 삼각함수, 지수/로그함수 등 |
| `katex` + `react-katex` | 수식 렌더링 | LaTeX 문법으로 수식 표시 |
| `@anthropic-ai/sdk` | 문제 텍스트 생성 | Claude API 연동 |
| `@react-pdf/renderer` | 문제지 PDF 출력 | 선생님에게 전달할 최종 문서 생성 |
| `zod` | 데이터 스키마 검증 | 문제 데이터 구조 타입 안전성 확보 |

## 시각화 도구 상세

### 1. JSXGraph (기하 도형)

수학 교육용으로 설계된 라이브러리. 다음을 모두 처리한다:

- 점, 선분, 직선, 반직선
- 원, 호, 부채꼴
- 삼각형, 사각형, 다각형
- 각도 표시, 수직/평행 표시
- 점의 자취, 도형의 이동/회전/대칭
- 공간도형 (정육면체, 삼각기둥 등) - 2D 평면에 투영하여 표현, 뒤쪽 모서리는 점선 처리

사용 예시:

```javascript
import JXG from 'jsxgraph';

const board = JXG.JSXGraph.initBoard('box', {
  boundingbox: [-5, 5, 5, -5],
  axis: true
});

// 삼각형 ABC
const A = board.create('point', [0, 0], { name: 'A' });
const B = board.create('point', [4, 0], { name: 'B' });
const C = board.create('point', [2, 3], { name: 'C' });
board.create('polygon', [A, B, C]);

// BC의 중점 D
const D = board.create('midpoint', [B, C], { name: 'D' });
board.create('segment', [A, D], { strokeColor: 'blue' });
```

### 2. Function Plot (함수 그래프)

함수 그래프 전용 라이브러리. 수식 파싱 내장, 점근선/불연속점 자동 처리.

사용 예시:

```javascript
import functionPlot from 'function-plot';

functionPlot({
  target: '#graph',
  data: [
    { fn: 'x^2 - 2x + 1' },           // 이차함수
    { fn: 'sin(x)', color: 'red' },   // 삼각함수
    { fn: '2^x', color: 'blue' }      // 지수함수
  ],
  grid: true
});
```

### 3. KaTeX (수식 렌더링)

LaTeX 문법으로 수학 수식을 브라우저에 렌더링.

사용 예시:

```jsx
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// 인라인 수식
<InlineMath math="x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}" />

// 블록 수식
<BlockMath math="\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}" />
```

## 문제 생성 흐름

```
[퓨샷 문제 DB] + [커리큘럼 데이터]
        ↓
    Claude API (문제 텍스트 + 도형 조건 생성)
        ↓
    조건 파싱 (점 좌표, 함수식, 도형 속성)
        ↓
    JSXGraph / Function Plot (시각화 렌더링)
        ↓
    KaTeX (수식 렌더링)
        ↓
    React-PDF (문제지 PDF 생성)
        ↓
    선생님에게 전달
```

## 교육자료 인식 흐름 (Claude Vision 통합)

```
[이미지 입력] (문제지 사진, 교과서, 기출 스캔)
        ↓
    Claude Vision API (멀티모달)
        ↓
    텍스트 추출 + 수식 인식 (LaTeX 변환)
        ↓
    도형/그래프 분석 + 의미 파악
        ↓
    구조화된 문제 데이터 출력
        ↓
    Few-shot DB 저장 or 문제 생성에 활용
```

### Claude Vision 장점
- **OCR + 분석 통합**: 이미지에서 텍스트 추출과 동시에 문제 맥락 이해
- **수식 자동 변환**: 수학 수식을 LaTeX로 바로 변환
- **도형 의미 파악**: 단순 좌표가 아닌 도형의 수학적 의미 분석
- **파이프라인 단순화**: Google Vision + 후처리 대신 Claude 하나로 처리

## 문제 데이터 스키마 (Zod)

```typescript
import { z } from 'zod';

const ProblemSchema = z.object({
  id: z.string(),
  subject: z.literal('math'),
  grade: z.enum(['elementary', 'middle1', 'middle2', 'middle3', 'high1', 'high2', 'high3']),
  unit: z.string(),                    // 단원명
  difficulty: z.enum(['easy', 'medium', 'hard']),
  type: z.enum(['calculation', 'equation', 'function', 'geometry', 'probability']),
  
  content: z.object({
    question: z.string(),              // 문제 본문 (LaTeX 포함 가능)
    options: z.array(z.string()).optional(),  // 객관식 보기
    answer: z.string(),                // 정답
    solution: z.string(),              // 해설
  }),
  
  visualization: z.object({
    type: z.enum(['none', 'geometry', 'graph', 'chart']),
    data: z.any().optional(),          // JSXGraph 또는 Function Plot 설정
  }),
  
  metadata: z.object({
    source: z.string().optional(),     // 출처 (수능, 모의고사 등)
    year: z.number().optional(),
    passRate: z.number().optional(),   // 정답률
  }),
});
```

## 폴더 구조

```
/app
  /api
    /generate-problem     # Claude API 호출
    /export-pdf           # PDF 생성
/components
  /math
    GeometryCanvas.tsx    # JSXGraph 래퍼
    GraphPlot.tsx         # Function Plot 래퍼
    MathExpression.tsx    # KaTeX 래퍼
    ProblemCard.tsx       # 문제 표시 컴포넌트
/lib
  problemGenerator.ts     # 문제 생성 로직
  pdfExporter.ts          # PDF 변환 로직
  validators.ts           # Zod 스키마
/types
  problem.ts              # 타입 정의
/data
  curriculum.json         # 단원별 커리큘럼
  fewshot-problems.json   # 퓨샷 예시 문제
```

## 공간도형 처리 방식

수능/교과서 스타일의 공간도형(정육면체 등)은 3D 렌더링이 아닌 2D 평면 투영 방식으로 처리한다.

```javascript
// 정육면체 예시 (2D 투영)
const board = JXG.JSXGraph.initBoard('box', { boundingbox: [-2, 6, 8, -2] });

// 앞면 (실선)
const A = board.create('point', [0, 0], { name: 'A' });
const B = board.create('point', [4, 0], { name: 'B' });
const C = board.create('point', [4, 4], { name: 'C' });
const D = board.create('point', [0, 4], { name: 'D' });
board.create('polygon', [A, B, C, D], { fillColor: 'transparent' });

// 뒷면 (오프셋)
const E = board.create('point', [1.5, 1.5], { name: 'E' });
const F = board.create('point', [5.5, 1.5], { name: 'F' });
const G = board.create('point', [5.5, 5.5], { name: 'G' });
const H = board.create('point', [1.5, 5.5], { name: 'H' });

// 뒤쪽 모서리 (점선)
board.create('segment', [E, F], { dash: 2 });
board.create('segment', [E, H], { dash: 2 });
board.create('segment', [E, A], { dash: 2 });

// 앞쪽 연결선 (실선)
board.create('segment', [B, F]);
board.create('segment', [C, G]);
board.create('segment', [D, H]);
board.create('segment', [F, G]);
board.create('segment', [G, H]);
```

## 추가 고려사항

1. **이미지 캐싱**: 생성된 도형/그래프 이미지는 서버에 캐싱하여 재사용
2. **반응형**: 모바일에서도 도형이 깨지지 않도록 SVG 출력 권장
3. **접근성**: 시각 장애 학생을 위한 alt text 자동 생성 고려
4. **버전 관리**: 문제 수정 이력 관리 (선생님 피드백 반영)
