/**
 * 커리큘럼 관련 타입 정의
 */

// 학년 타입
export type GradeLevel =
  | 'middle_1' | 'middle_2' | 'middle_3'
  | 'high_common1' | 'high_common2'
  | 'high_calculus1' | 'high_calculus2'
  | 'high_probability' | 'high_geometry'

// 학년 표시명
export const GRADE_LABELS: Record<GradeLevel, string> = {
  middle_1: '중학교 1학년',
  middle_2: '중학교 2학년',
  middle_3: '중학교 3학년',
  high_common1: '고등학교 공통수학1',
  high_common2: '고등학교 공통수학2',
  high_calculus1: '고등학교 미적분Ⅰ',
  high_calculus2: '고등학교 미적분Ⅱ',
  high_probability: '고등학교 확률과 통계',
  high_geometry: '고등학교 기하',
}

// 단원 정보
export interface Unit {
  id: string
  grade: GradeLevel
  order: number
  name: string
  subject: 'math' // 추후 다른 과목 추가 가능
}

// 시각화 타입
export type VisualizationType = 'desmos' | 'geogebra'

// Desmos 수식
export interface DesmosExpression {
  id: string
  latex: string // LaTeX 수식
  color?: string // 색상
  hidden?: boolean
  label?: string
}

// 시각화 자료
export interface Visualization {
  id: string
  type: VisualizationType
  title: string // 시각화 제목
  description: string // 설명
  // Desmos용
  desmos_expressions?: DesmosExpression[] // Desmos 수식 배열
  // GeoGebra용
  geogebra_commands?: string[] // GeoGebra 명령어 배열
  geogebra_material_id?: string // 기존 GeoGebra 자료 ID (선택)
}

// 개념 자료 (생성된 콘텐츠)
export interface ConceptContent {
  id: string
  unit_id: string

  // 텍스트 콘텐츠 (숨마쿰라우데 스타일)
  title: string
  summary: string // 핵심 요약
  core_concepts: CoreConcept[] // 핵심 개념들
  advanced_topics: AdvancedTopic[] // 심화 내용
  common_mistakes: string[] // 자주 하는 실수
  problem_solving_tips: string[] // 문제 풀이 팁
  connections: string[] // 다른 단원과의 연결

  // 시각화 자료
  visualizations: Visualization[] // Desmos/GeoGebra 시각화 배열

  // 메타데이터
  difficulty_level: 'advanced' | 'olympiad' // 최상위권용
  created_at: string
  updated_at: string
}

// 핵심 개념
export interface CoreConcept {
  title: string
  definition: string
  formula?: string // LaTeX 수식
  explanation: string
  examples: Example[]
}

// 예시
export interface Example {
  problem: string
  solution: string
  key_insight: string // 핵심 통찰
}

// 심화 주제
export interface AdvancedTopic {
  title: string
  content: string
  olympiad_connection?: string // 올림피아드/경시대회 연결
}

// 커리큘럼 생성 요청
export interface CurriculumGenerateRequest {
  unit_id: string
  grade: GradeLevel
  unit_name: string
  regenerate?: boolean // 재생성 여부
}

// 커리큘럼 생성 응답
export interface CurriculumGenerateResponse {
  success: boolean
  content?: ConceptContent
  error?: string
}
