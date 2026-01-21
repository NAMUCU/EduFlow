/**
 * Few-shot 샘플 타입 정의
 */

export type FewshotCategory =
  | 'triangle'
  | 'quadrilateral'
  | 'circle'
  | 'graph'
  | 'coordinate'
  | 'illustration'
  | 'other'

export type TriangleSubcategory =
  | 'basic'           // 기본 삼각형
  | 'height'          // 높이 표시
  | 'circumcenter'    // 외심
  | 'incenter'        // 내심
  | 'centroid'        // 무게중심
  | 'orthocenter'     // 수심
  | 'similarity'      // 닮음
  | 'congruence'      // 합동
  | 'pythagorean'     // 피타고라스
  | 'trigonometry'    // 삼각비

export type QuadrilateralSubcategory =
  | 'basic'           // 기본 사각형
  | 'parallelogram'   // 평행사변형
  | 'rectangle'       // 직사각형
  | 'square'          // 정사각형
  | 'rhombus'         // 마름모
  | 'trapezoid'       // 사다리꼴
  | 'diagonal'        // 대각선

export type CircleSubcategory =
  | 'basic'           // 기본 원
  | 'chord'           // 현
  | 'tangent'         // 접선
  | 'inscribed'       // 내접
  | 'circumscribed'   // 외접
  | 'arc'             // 호
  | 'sector'          // 부채꼴

export type GraphSubcategory =
  | 'linear'          // 일차함수
  | 'quadratic'       // 이차함수
  | 'cubic'           // 삼차함수
  | 'trigonometric'   // 삼각함수
  | 'exponential'     // 지수함수
  | 'logarithmic'     // 로그함수

export type CoordinateSubcategory =
  | 'point'           // 점
  | 'line'            // 직선
  | 'distance'        // 거리
  | 'midpoint'        // 중점
  | 'region'          // 영역

export type FewshotSubcategory =
  | TriangleSubcategory
  | QuadrilateralSubcategory
  | CircleSubcategory
  | GraphSubcategory
  | CoordinateSubcategory
  | string

export type FewshotTag =
  | 'dotted_line'     // 점선
  | 'angle_mark'      // 각도 표시
  | 'auxiliary_line'  // 보조선
  | 'height_line'     // 높이선
  | 'length_label'    // 길이 라벨
  | 'right_angle'     // 직각 표시
  | 'parallel_mark'   // 평행 표시
  | 'equal_mark'      // 같음 표시
  | 'arrow'           // 화살표
  | 'shading'         // 음영
  | 'grid'            // 격자
  | 'axis'            // 축

export interface FewshotSample {
  id: string
  category: FewshotCategory
  subcategory: FewshotSubcategory
  tags: FewshotTag[]
  name: string
  description?: string
  svg_code?: string
  image_url?: string
  metadata?: {
    points?: Array<{ x: number; y: number; label?: string }>
    angles?: Array<{ value: number; label?: string }>
    lengths?: Array<{ value: number; label?: string }>
    [key: string]: unknown
  }
  created_at?: string
  updated_at?: string
}

export interface ImageRequirement {
  needed: boolean
  category?: FewshotCategory
  subcategory?: FewshotSubcategory
  tags?: FewshotTag[]
  description?: string
}

export interface MergedContent {
  text: string
  images: Array<{
    position: number  // 텍스트 내 위치 (문단 번호)
    svg?: string
    url?: string
    caption?: string
  }>
}
