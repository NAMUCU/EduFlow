/**
 * 커리큘럼 개념자료 생성기 v2
 * - 텍스트 콘텐츠: Gemini 2.5 Pro
 * - 시각화: 템플릿 기반 (Desmos/GeoGebra 하드코딩)
 * - 삽화: DALL-E 3 (선택적)
 */

import {
  ConceptContent,
  CoreConcept,
  Visualization,
  GradeLevel,
  GRADE_LABELS
} from '@/types/curriculum'

// 타입 re-export
export type { ConceptContent, CoreConcept, Visualization }

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_MODEL = 'gemini-2.5-pro'

// ============================================
// 시각화 템플릿 (하드코딩)
// ============================================
const DESMOS_TEMPLATES: Record<string, {
  title: string
  description: string
  expressions: Array<{ id: string; latex: string; color: string; label?: string }>
}> = {
  // 일차함수
  '일차함수': {
    title: '일차함수의 그래프',
    description: 'y = ax + b 형태의 일차함수. 기울기(a)와 y절편(b)에 따른 그래프 변화.',
    expressions: [
      { id: '1', latex: 'y=x', color: '#2d70b3', label: 'y=x (기울기 1)' },
      { id: '2', latex: 'y=2x', color: '#c74440', label: 'y=2x (기울기 2)' },
      { id: '3', latex: 'y=x+2', color: '#388c46', label: 'y=x+2 (y절편 2)' },
      { id: '4', latex: 'y=-x+1', color: '#6042a6', label: 'y=-x+1 (기울기 -1)' },
    ]
  },
  // 이차함수
  '이차함수': {
    title: '이차함수의 그래프',
    description: 'y = ax² + bx + c 형태의 이차함수. 꼭짓점과 축의 방정식.',
    expressions: [
      { id: '1', latex: 'y=x^2', color: '#2d70b3', label: '기본 포물선' },
      { id: '2', latex: 'y=(x-2)^2+1', color: '#c74440', label: '평행이동' },
      { id: '3', latex: 'y=-x^2+4', color: '#388c46', label: '위로 볼록' },
      { id: '4', latex: 'y=2x^2', color: '#6042a6', label: '폭이 좁은' },
    ]
  },
  // 삼각함수
  '삼각함수': {
    title: '삼각함수의 그래프',
    description: 'sin, cos, tan 함수의 주기와 진폭.',
    expressions: [
      { id: '1', latex: 'y=\\sin(x)', color: '#2d70b3', label: 'sin(x)' },
      { id: '2', latex: 'y=\\cos(x)', color: '#c74440', label: 'cos(x)' },
      { id: '3', latex: 'y=2\\sin(x)', color: '#388c46', label: '진폭 2' },
      { id: '4', latex: 'y=\\sin(2x)', color: '#6042a6', label: '주기 π' },
    ]
  },
  // 지수함수
  '지수함수': {
    title: '지수함수의 그래프',
    description: 'y = aˣ 형태의 지수함수.',
    expressions: [
      { id: '1', latex: 'y=2^x', color: '#2d70b3', label: 'y=2^x' },
      { id: '2', latex: 'y=3^x', color: '#c74440', label: 'y=3^x' },
      { id: '3', latex: 'y=(1/2)^x', color: '#388c46', label: 'y=(1/2)^x' },
      { id: '4', latex: 'y=e^x', color: '#6042a6', label: 'y=e^x' },
    ]
  },
  // 로그함수
  '로그함수': {
    title: '로그함수의 그래프',
    description: 'y = logₐx 형태의 로그함수.',
    expressions: [
      { id: '1', latex: 'y=\\log_2(x)', color: '#2d70b3', label: 'log₂x' },
      { id: '2', latex: 'y=\\ln(x)', color: '#c74440', label: 'ln(x)' },
      { id: '3', latex: 'y=\\log_{10}(x)', color: '#388c46', label: 'log₁₀x' },
      { id: '4', latex: 'x=1', color: '#000000', label: '점근선' },
    ]
  },
  // 정비례/반비례
  '정비례와 반비례': {
    title: '정비례와 반비례 그래프',
    description: 'y = ax (정비례), y = a/x (반비례)',
    expressions: [
      { id: '1', latex: 'y=2x', color: '#2d70b3', label: '정비례 y=2x' },
      { id: '2', latex: 'y=-x', color: '#c74440', label: '정비례 y=-x' },
      { id: '3', latex: 'y=\\frac{4}{x}', color: '#388c46', label: '반비례 y=4/x' },
      { id: '4', latex: 'y=\\frac{-2}{x}', color: '#6042a6', label: '반비례 y=-2/x' },
    ]
  },
  // 미분
  '미분': {
    title: '도함수와 접선',
    description: '함수의 미분과 접선의 기울기.',
    expressions: [
      { id: '1', latex: 'f(x)=x^3-3x', color: '#2d70b3', label: 'f(x)' },
      { id: '2', latex: 'g(x)=3x^2-3', color: '#c74440', label: "f'(x) 도함수" },
      { id: '3', latex: 'y=0', color: '#388c46', label: '극값 위치' },
      { id: '4', latex: '(-1,2)', color: '#6042a6', label: '극대점' },
      { id: '5', latex: '(1,-2)', color: '#6042a6', label: '극소점' },
    ]
  },
  // 적분
  '적분': {
    title: '정적분과 넓이',
    description: '함수와 x축 사이의 넓이.',
    expressions: [
      { id: '1', latex: 'y=x^2', color: '#2d70b3', label: 'y=x²' },
      { id: '2', latex: '0 \\le y \\le x^2 \\{0 \\le x \\le 2\\}', color: '#c74440', label: '넓이 영역' },
      { id: '3', latex: 'x=0', color: '#388c46', label: '적분 시작' },
      { id: '4', latex: 'x=2', color: '#388c46', label: '적분 끝' },
    ]
  },
  // 수열
  '수열': {
    title: '등차/등비수열',
    description: '수열의 일반항과 합.',
    expressions: [
      { id: '1', latex: 'a_n=2n+1', color: '#2d70b3', label: '등차수열' },
      { id: '2', latex: 'b_n=2^n', color: '#c74440', label: '등비수열' },
      { id: '3', latex: '(1,3)', color: '#388c46' },
      { id: '4', latex: '(2,5)', color: '#388c46' },
      { id: '5', latex: '(3,7)', color: '#388c46' },
    ]
  },
  // 극한
  '극한': {
    title: '함수의 극한',
    description: '함수가 특정 값에 수렴하는 과정.',
    expressions: [
      { id: '1', latex: 'f(x)=\\frac{x^2-1}{x-1}', color: '#2d70b3', label: '(x²-1)/(x-1)' },
      { id: '2', latex: 'y=x+1', color: '#c74440', label: '극한값 y=x+1' },
      { id: '3', latex: '(1,2)', color: '#388c46', label: 'x→1일 때 2' },
    ]
  },
  // 부등식
  '부등식': {
    title: '부등식의 영역',
    description: '부등식을 만족하는 영역.',
    expressions: [
      { id: '1', latex: 'y>x', color: '#2d70b3', label: 'y>x 영역' },
      { id: '2', latex: 'y<-x+4', color: '#c74440', label: 'y<-x+4 영역' },
      { id: '3', latex: 'y=x', color: '#388c46', label: '경계선' },
    ]
  },
  // 방정식
  '방정식': {
    title: '방정식의 해',
    description: '방정식의 그래프와 해의 관계.',
    expressions: [
      { id: '1', latex: 'y=x^2-4', color: '#2d70b3', label: 'y=x²-4' },
      { id: '2', latex: 'y=0', color: '#c74440', label: 'x축' },
      { id: '3', latex: '(-2,0)', color: '#388c46', label: 'x=-2' },
      { id: '4', latex: '(2,0)', color: '#388c46', label: 'x=2' },
    ]
  },
  // 좌표평면과 그래프
  '좌표평면과 그래프': {
    title: '좌표평면의 이해',
    description: '점의 좌표와 사분면.',
    expressions: [
      { id: '1', latex: '(3,2)', color: '#2d70b3', label: '제1사분면' },
      { id: '2', latex: '(-2,3)', color: '#c74440', label: '제2사분면' },
      { id: '3', latex: '(-3,-2)', color: '#388c46', label: '제3사분면' },
      { id: '4', latex: '(2,-3)', color: '#6042a6', label: '제4사분면' },
    ]
  },
  // 이차곡선
  '이차곡선': {
    title: '이차곡선 (원, 타원, 쌍곡선, 포물선)',
    description: '이차곡선의 표준형.',
    expressions: [
      { id: '1', latex: 'x^2+y^2=4', color: '#2d70b3', label: '원' },
      { id: '2', latex: '\\frac{x^2}{9}+\\frac{y^2}{4}=1', color: '#c74440', label: '타원' },
      { id: '3', latex: '\\frac{x^2}{4}-\\frac{y^2}{1}=1', color: '#388c46', label: '쌍곡선' },
      { id: '4', latex: 'y^2=4x', color: '#6042a6', label: '포물선' },
    ]
  },
}

const GEOGEBRA_TEMPLATES: Record<string, {
  title: string
  description: string
  commands: string[]
}> = {
  // 삼각형
  '삼각형': {
    title: '삼각형의 기본',
    description: '삼각형의 꼭짓점, 변, 내각.',
    commands: [
      'A = (0, 0)',
      'B = (4, 0)',
      'C = (2, 3)',
      'poly1 = Polygon(A, B, C)',
      'Segment(A, B)',
      'Segment(B, C)',
      'Segment(C, A)',
      'Angle(B, A, C)',
      'Angle(A, B, C)',
      'Angle(B, C, A)',
    ]
  },
  // 삼각형의 성질
  '삼각형의 성질': {
    title: '삼각형의 무게중심, 외심, 내심',
    description: '삼각형의 중요한 점들.',
    commands: [
      'A = (0, 0)',
      'B = (6, 0)',
      'C = (2, 4)',
      'poly1 = Polygon(A, B, C)',
      'G = Centroid(poly1)',
      'SetCaption(G, "무게중심")',
      'O = Circumcenter(A, B, C)',
      'SetCaption(O, "외심")',
      'I = Incenter(A, B, C)',
      'SetCaption(I, "내심")',
    ]
  },
  // 사각형
  '사각형': {
    title: '사각형의 종류',
    description: '평행사변형, 직사각형, 정사각형, 마름모.',
    commands: [
      'A = (0, 0)',
      'B = (4, 0)',
      'C = (5, 3)',
      'D = (1, 3)',
      'poly1 = Polygon(A, B, C, D)',
      'Segment(A, C)',
      'Segment(B, D)',
      'M = Intersect(Line(A, C), Line(B, D))',
      'SetCaption(M, "대각선 교점")',
    ]
  },
  // 사각형의 성질
  '사각형의 성질': {
    title: '평행사변형의 성질',
    description: '대각선이 서로를 이등분.',
    commands: [
      'A = (0, 0)',
      'B = (4, 0)',
      'C = (6, 3)',
      'D = (2, 3)',
      'poly1 = Polygon(A, B, C, D)',
      'd1 = Segment(A, C)',
      'd2 = Segment(B, D)',
      'M = Midpoint(A, C)',
      'N = Midpoint(B, D)',
      'SetCaption(M, "AC 중점")',
      'SetCaption(N, "BD 중점")',
    ]
  },
  // 원
  '원': {
    title: '원의 성질',
    description: '원의 중심, 반지름, 현, 접선.',
    commands: [
      'O = (0, 0)',
      'c = Circle(O, 3)',
      'A = Point(c)',
      'B = Point(c)',
      'chord = Segment(A, B)',
      'M = Midpoint(A, B)',
      'perpLine = PerpendicularLine(M, chord)',
      'SetCaption(O, "중심")',
    ]
  },
  // 피타고라스
  '피타고라스': {
    title: '피타고라스 정리',
    description: 'a² + b² = c² (직각삼각형)',
    commands: [
      'A = (0, 0)',
      'B = (4, 0)',
      'C = (4, 3)',
      'poly1 = Polygon(A, B, C)',
      'sq1 = Polygon(A, B, B + (0, -4), A + (0, -4))',
      'sq2 = Polygon(B, C, C + (3, 0), B + (3, 0))',
      'a = Distance(A, B)',
      'b = Distance(B, C)',
      'c = Distance(A, C)',
      'Text("a² + b² = c²", (2, -2))',
    ]
  },
  // 삼각비
  '삼각비': {
    title: '삼각비 (sin, cos, tan)',
    description: '직각삼각형에서의 삼각비.',
    commands: [
      'A = (0, 0)',
      'B = (4, 0)',
      'C = (4, 3)',
      'poly1 = Polygon(A, B, C)',
      'angle_A = Angle(B, A, C)',
      'SetCaption(angle_A, "θ")',
      'Text("sin θ = 3/5", (5, 2))',
      'Text("cos θ = 4/5", (5, 1))',
      'Text("tan θ = 3/4", (5, 0))',
    ]
  },
  // 도형의 닮음
  '도형의 닮음': {
    title: '닮은 도형',
    description: '닮음비와 넓이비.',
    commands: [
      'A = (0, 0)',
      'B = (2, 0)',
      'C = (1, 1.5)',
      'poly1 = Polygon(A, B, C)',
      'D = (4, 0)',
      'E = (8, 0)',
      'F = (6, 3)',
      'poly2 = Polygon(D, E, F)',
      'Text("닮음비 1:2", (3, -0.5))',
      'Text("넓이비 1:4", (5, -0.5))',
    ]
  },
  // 작도와 합동
  '작도와 합동': {
    title: '삼각형의 합동 조건',
    description: 'SSS, SAS, ASA 합동.',
    commands: [
      'A = (0, 0)',
      'B = (3, 0)',
      'C = (1.5, 2)',
      'poly1 = Polygon(A, B, C)',
      'D = (5, 0)',
      'E = (8, 0)',
      'F = (6.5, 2)',
      'poly2 = Polygon(D, E, F)',
      'Text("SSS 합동", (4, -0.5))',
    ]
  },
  // 평면도형의 성질
  '평면도형의 성질': {
    title: '다각형의 내각과 외각',
    description: '다각형의 내각의 합.',
    commands: [
      'A = (0, 0)',
      'B = (3, 0)',
      'C = (4, 2)',
      'D = (2, 3)',
      'E = (-1, 2)',
      'poly1 = Polygon(A, B, C, D, E)',
      'Text("내각의 합 = (n-2)×180°", (1, -1))',
      'Text("5각형: 540°", (1, -1.5))',
    ]
  },
  // 입체도형의 성질
  '입체도형의 성질': {
    title: '입체도형 (전개도)',
    description: '정육면체의 전개도.',
    commands: [
      'A = (0, 0)',
      'B = (2, 0)',
      'C = (2, 2)',
      'D = (0, 2)',
      'poly1 = Polygon(A, B, C, D)',
      'E = (2, 0)',
      'F = (4, 0)',
      'G = (4, 2)',
      'H = (2, 2)',
      'poly2 = Polygon(E, F, G, H)',
      'Text("정육면체 전개도", (2, -0.5))',
    ]
  },
  // 벡터
  '벡터': {
    title: '벡터의 덧셈',
    description: '벡터의 합과 차.',
    commands: [
      'A = (0, 0)',
      'B = (3, 1)',
      'C = (1, 2)',
      'v1 = Vector(A, B)',
      'v2 = Vector(A, C)',
      'D = B + C - A',
      'v3 = Vector(A, D)',
      'SetCaption(v1, "a")',
      'SetCaption(v2, "b")',
      'SetCaption(v3, "a+b")',
    ]
  },
  // 기본 도형
  '기본 도형': {
    title: '점, 선, 면',
    description: '기본 도형 요소.',
    commands: [
      'A = (0, 0)',
      'B = (4, 0)',
      'C = (2, 3)',
      'line1 = Line(A, B)',
      'seg1 = Segment(A, C)',
      'ray1 = Ray(B, C)',
      'SetCaption(A, "점 A")',
      'SetCaption(line1, "직선")',
      'SetCaption(seg1, "선분")',
    ]
  },
  // 공간도형
  '공간도형': {
    title: '공간좌표',
    description: '3차원 좌표계.',
    commands: [
      'A = (0, 0, 0)',
      'B = (3, 0, 0)',
      'C = (0, 3, 0)',
      'D = (0, 0, 3)',
      'Segment(A, B)',
      'Segment(A, C)',
      'Segment(A, D)',
      'SetCaption(B, "x")',
      'SetCaption(C, "y")',
      'SetCaption(D, "z")',
    ]
  },
}

// ============================================
// Gemini API 호출
// ============================================
async function callGemini(prompt: string, systemInstruction: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GOOGLE_API_KEY가 설정되지 않았습니다.')
  }

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 16384,
          topP: 0.95,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Gemini API 오류: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// JSON 파싱 헬퍼 (마크다운 코드블록 + LaTeX 이스케이프 처리)
function parseJSON<T>(text: string): T | null {
  try {
    // 1. 마크다운 코드블록 제거 (```json ... ``` 또는 ``` ... ```)
    let cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    // 2. 첫 번째 { 부터 마지막 } 까지 추출
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      console.error('JSON 파싱 실패 - 중괄호를 찾을 수 없음:', text.substring(0, 200))
      return null
    }

    let jsonStr = cleaned.substring(firstBrace, lastBrace + 1)

    // 3. LaTeX 이스케이프 문자 처리 (\\를 \\\\로, \n \t 등은 유지)
    // JSON 문자열 내부의 잘못된 이스케이프 시퀀스 수정
    jsonStr = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')

    return JSON.parse(jsonStr)
  } catch (e) {
    console.error('JSON 파싱 실패:', text.substring(0, 200))
    console.error('파싱 에러:', e)
    return null
  }
}

// ============================================
// 템플릿 기반 시각화 선택
// ============================================
function getVisualizationFromTemplate(unitName: string): Visualization[] {
  const visualizations: Visualization[] = []

  // Desmos 템플릿 매칭
  for (const [keyword, template] of Object.entries(DESMOS_TEMPLATES)) {
    if (unitName.includes(keyword)) {
      visualizations.push({
        id: `viz_desmos_${Date.now()}`,
        type: 'desmos',
        title: template.title,
        description: template.description,
        desmos_expressions: template.expressions,
      })
      break // 첫 매칭만 사용
    }
  }

  // GeoGebra 템플릿 매칭
  for (const [keyword, template] of Object.entries(GEOGEBRA_TEMPLATES)) {
    if (unitName.includes(keyword)) {
      visualizations.push({
        id: `viz_geogebra_${Date.now() + 1}`,
        type: 'geogebra',
        title: template.title,
        description: template.description,
        geogebra_commands: template.commands,
      })
      break // 첫 매칭만 사용
    }
  }

  return visualizations
}

// ============================================
// 시스템 프롬프트
// ============================================
const CONCEPT_SYSTEM_PROMPT = `당신은 대한민국 최고의 수학 교육 전문가입니다.
'숨마쿰라우데' 시리즈처럼 최상위권 학생(상위 1~5%)을 위한 심층적인 개념 자료를 작성합니다.

작성 원칙:
1. 단순 암기가 아닌 '왜 그런지' 본질적 이해 추구
2. 개념 간의 연결고리와 수학적 구조 강조
3. 올림피아드/경시대회 수준의 심화 내용 포함
4. 자주 하는 실수와 함정 명시
5. 문제 풀이의 핵심 통찰(Key Insight) 제시
6. LaTeX 수식 사용 (예: $x^2 + 2x + 1 = 0$)

응답은 반드시 JSON 형식으로 제공하세요.`

// ============================================
// 개념 자료 생성 (메인 함수)
// ============================================
export async function generateConceptContent(
  unitId: string,
  grade: GradeLevel,
  unitName: string
): Promise<ConceptContent> {
  // 1. 텍스트 개념자료 생성 (Gemini)
  const prompt = `
[단원 정보]
- 학년: ${GRADE_LABELS[grade]}
- 단원명: ${unitName}

위 단원에 대해 최상위권 학생을 위한 심층 개념 자료를 작성해주세요.

다음 JSON 형식으로 응답하세요:
\`\`\`json
{
  "title": "단원 제목 (예: 이차방정식의 완전정복)",
  "summary": "3-5문장의 핵심 요약. 이 단원에서 가장 중요한 것이 무엇인지.",
  "core_concepts": [
    {
      "title": "핵심 개념 제목",
      "definition": "정의 (수학적으로 엄밀하게)",
      "formula": "주요 공식 (LaTeX)",
      "explanation": "왜 이 개념이 중요한지, 어떻게 이해해야 하는지 상세 설명",
      "examples": [
        {
          "problem": "예시 문제",
          "solution": "풀이 과정",
          "key_insight": "이 문제의 핵심 통찰"
        }
      ]
    }
  ],
  "advanced_topics": [
    {
      "title": "심화 주제",
      "content": "심화 내용 설명",
      "olympiad_connection": "올림피아드/경시대회와의 연결점"
    }
  ],
  "common_mistakes": [
    "자주 하는 실수 1",
    "자주 하는 실수 2"
  ],
  "problem_solving_tips": [
    "문제 풀이 팁 1",
    "문제 풀이 팁 2"
  ],
  "connections": [
    "이전 단원과의 연결: ...",
    "이후 단원과의 연결: ...",
    "다른 과목과의 연결: ..."
  ]
}
\`\`\`

핵심 개념은 3-5개, 심화 주제는 2-3개, 실수와 팁은 각각 3-5개씩 작성하세요.
`

  const response = await callGemini(prompt, CONCEPT_SYSTEM_PROMPT)
  const parsed = parseJSON<{
    title: string
    summary: string
    core_concepts: CoreConcept[]
    advanced_topics: Array<{ title: string; content: string; olympiad_connection?: string }>
    common_mistakes: string[]
    problem_solving_tips: string[]
    connections: string[]
  }>(response)

  if (!parsed) {
    throw new Error('개념 자료 생성 실패: JSON 파싱 오류')
  }

  // 2. 템플릿 기반 시각화 선택 (하드코딩)
  const visualizations = getVisualizationFromTemplate(unitName)

  const now = new Date().toISOString()

  return {
    id: `content_${unitId}_${Date.now()}`,
    unit_id: unitId,
    title: parsed.title,
    summary: parsed.summary,
    core_concepts: parsed.core_concepts,
    advanced_topics: parsed.advanced_topics,
    common_mistakes: parsed.common_mistakes,
    problem_solving_tips: parsed.problem_solving_tips,
    connections: parsed.connections,
    visualizations,
    difficulty_level: 'advanced',
    created_at: now,
    updated_at: now,
  }
}

// ============================================
// 배치 생성
// ============================================
export async function generateBatchContents(
  units: Array<{ unitId: string; grade: GradeLevel; unitName: string }>,
  onProgress?: (current: number, total: number, unitName: string) => void
): Promise<{ success: ConceptContent[]; failed: Array<{ unitId: string; error: string }> }> {
  const success: ConceptContent[] = []
  const failed: Array<{ unitId: string; error: string }> = []

  for (let i = 0; i < units.length; i++) {
    const unit = units[i]
    onProgress?.(i + 1, units.length, unit.unitName)

    try {
      const content = await generateConceptContent(unit.unitId, unit.grade, unit.unitName)
      success.push(content)
      // Rate limit 방지
      await new Promise(resolve => setTimeout(resolve, 1500))
    } catch (error) {
      failed.push({
        unitId: unit.unitId,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      })
    }
  }

  return { success, failed }
}

// ============================================
// DALL-E 삽화 생성 (선택적)
// ============================================
export async function generateProblemIllustration(
  description: string
): Promise<{ url: string | null; error?: string }> {
  if (!OPENAI_API_KEY) {
    return { url: null, error: 'OPENAI_API_KEY가 없습니다.' }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `교육용 수학 문제 삽화, 깔끔한 벡터 스타일, 흰 배경: ${description}`,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { url: null, error: JSON.stringify(error) }
    }

    const data = await response.json()
    return { url: data.data?.[0]?.url || null }
  } catch (error) {
    return { url: null, error: error instanceof Error ? error.message : '삽화 생성 실패' }
  }
}
