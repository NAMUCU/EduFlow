/**
 * 수학 교육과정 단원 데이터
 * 중학교 1학년 ~ 고등학교 기하
 */

import { Unit, GradeLevel } from '@/types/curriculum'

// 단원 ID 생성 헬퍼
const createUnitId = (grade: GradeLevel, order: number): string =>
  `${grade}_unit_${String(order).padStart(2, '0')}`

// 중학교 1학년
export const MIDDLE_1_UNITS: Unit[] = [
  { id: createUnitId('middle_1', 1), grade: 'middle_1', order: 1, name: '소인수분해', subject: 'math' },
  { id: createUnitId('middle_1', 2), grade: 'middle_1', order: 2, name: '정수와 유리수', subject: 'math' },
  { id: createUnitId('middle_1', 3), grade: 'middle_1', order: 3, name: '문자와 식', subject: 'math' },
  { id: createUnitId('middle_1', 4), grade: 'middle_1', order: 4, name: '일차방정식', subject: 'math' },
  { id: createUnitId('middle_1', 5), grade: 'middle_1', order: 5, name: '좌표평면과 그래프', subject: 'math' },
  { id: createUnitId('middle_1', 6), grade: 'middle_1', order: 6, name: '정비례와 반비례', subject: 'math' },
  { id: createUnitId('middle_1', 7), grade: 'middle_1', order: 7, name: '기본 도형', subject: 'math' },
  { id: createUnitId('middle_1', 8), grade: 'middle_1', order: 8, name: '작도와 합동', subject: 'math' },
  { id: createUnitId('middle_1', 9), grade: 'middle_1', order: 9, name: '평면도형의 성질', subject: 'math' },
  { id: createUnitId('middle_1', 10), grade: 'middle_1', order: 10, name: '입체도형의 성질', subject: 'math' },
  { id: createUnitId('middle_1', 11), grade: 'middle_1', order: 11, name: '자료의 정리와 해석', subject: 'math' },
]

// 중학교 2학년
export const MIDDLE_2_UNITS: Unit[] = [
  { id: createUnitId('middle_2', 1), grade: 'middle_2', order: 1, name: '유리수와 순환소수', subject: 'math' },
  { id: createUnitId('middle_2', 2), grade: 'middle_2', order: 2, name: '식의 계산', subject: 'math' },
  { id: createUnitId('middle_2', 3), grade: 'middle_2', order: 3, name: '일차부등식', subject: 'math' },
  { id: createUnitId('middle_2', 4), grade: 'middle_2', order: 4, name: '연립일차방정식', subject: 'math' },
  { id: createUnitId('middle_2', 5), grade: 'middle_2', order: 5, name: '일차함수', subject: 'math' },
  { id: createUnitId('middle_2', 6), grade: 'middle_2', order: 6, name: '삼각형의 성질', subject: 'math' },
  { id: createUnitId('middle_2', 7), grade: 'middle_2', order: 7, name: '사각형의 성질', subject: 'math' },
  { id: createUnitId('middle_2', 8), grade: 'middle_2', order: 8, name: '도형의 닮음', subject: 'math' },
  { id: createUnitId('middle_2', 9), grade: 'middle_2', order: 9, name: '확률', subject: 'math' },
]

// 중학교 3학년
export const MIDDLE_3_UNITS: Unit[] = [
  { id: createUnitId('middle_3', 1), grade: 'middle_3', order: 1, name: '제곱근과 실수', subject: 'math' },
  { id: createUnitId('middle_3', 2), grade: 'middle_3', order: 2, name: '다항식의 곱셈과 인수분해', subject: 'math' },
  { id: createUnitId('middle_3', 3), grade: 'middle_3', order: 3, name: '이차방정식', subject: 'math' },
  { id: createUnitId('middle_3', 4), grade: 'middle_3', order: 4, name: '이차함수', subject: 'math' },
  { id: createUnitId('middle_3', 5), grade: 'middle_3', order: 5, name: '피타고라스 정리', subject: 'math' },
  { id: createUnitId('middle_3', 6), grade: 'middle_3', order: 6, name: '삼각비', subject: 'math' },
  { id: createUnitId('middle_3', 7), grade: 'middle_3', order: 7, name: '원의 성질', subject: 'math' },
  { id: createUnitId('middle_3', 8), grade: 'middle_3', order: 8, name: '통계', subject: 'math' },
]

// 고등학교 공통수학1
export const HIGH_COMMON1_UNITS: Unit[] = [
  { id: createUnitId('high_common1', 1), grade: 'high_common1', order: 1, name: '다항식의 연산', subject: 'math' },
  { id: createUnitId('high_common1', 2), grade: 'high_common1', order: 2, name: '나머지정리와 인수분해', subject: 'math' },
  { id: createUnitId('high_common1', 3), grade: 'high_common1', order: 3, name: '복소수', subject: 'math' },
  { id: createUnitId('high_common1', 4), grade: 'high_common1', order: 4, name: '이차방정식', subject: 'math' },
  { id: createUnitId('high_common1', 5), grade: 'high_common1', order: 5, name: '이차함수와 이차부등식', subject: 'math' },
  { id: createUnitId('high_common1', 6), grade: 'high_common1', order: 6, name: '직선의 방정식', subject: 'math' },
  { id: createUnitId('high_common1', 7), grade: 'high_common1', order: 7, name: '원의 방정식', subject: 'math' },
  { id: createUnitId('high_common1', 8), grade: 'high_common1', order: 8, name: '도형의 이동', subject: 'math' },
]

// 고등학교 공통수학2
export const HIGH_COMMON2_UNITS: Unit[] = [
  { id: createUnitId('high_common2', 1), grade: 'high_common2', order: 1, name: '집합', subject: 'math' },
  { id: createUnitId('high_common2', 2), grade: 'high_common2', order: 2, name: '명제', subject: 'math' },
  { id: createUnitId('high_common2', 3), grade: 'high_common2', order: 3, name: '함수', subject: 'math' },
  { id: createUnitId('high_common2', 4), grade: 'high_common2', order: 4, name: '유리함수와 무리함수', subject: 'math' },
  { id: createUnitId('high_common2', 5), grade: 'high_common2', order: 5, name: '경우의 수', subject: 'math' },
  { id: createUnitId('high_common2', 6), grade: 'high_common2', order: 6, name: '순열과 조합', subject: 'math' },
]

// 고등학교 미적분Ⅰ
export const HIGH_CALCULUS1_UNITS: Unit[] = [
  { id: createUnitId('high_calculus1', 1), grade: 'high_calculus1', order: 1, name: '수열', subject: 'math' },
  { id: createUnitId('high_calculus1', 2), grade: 'high_calculus1', order: 2, name: '수열의 극한', subject: 'math' },
  { id: createUnitId('high_calculus1', 3), grade: 'high_calculus1', order: 3, name: '급수', subject: 'math' },
  { id: createUnitId('high_calculus1', 4), grade: 'high_calculus1', order: 4, name: '함수의 극한과 연속', subject: 'math' },
  { id: createUnitId('high_calculus1', 5), grade: 'high_calculus1', order: 5, name: '미분계수와 도함수', subject: 'math' },
  { id: createUnitId('high_calculus1', 6), grade: 'high_calculus1', order: 6, name: '다항함수의 미분법', subject: 'math' },
  { id: createUnitId('high_calculus1', 7), grade: 'high_calculus1', order: 7, name: '다항함수의 적분법', subject: 'math' },
]

// 고등학교 미적분Ⅱ
export const HIGH_CALCULUS2_UNITS: Unit[] = [
  { id: createUnitId('high_calculus2', 1), grade: 'high_calculus2', order: 1, name: '삼각함수', subject: 'math' },
  { id: createUnitId('high_calculus2', 2), grade: 'high_calculus2', order: 2, name: '삼각함수의 미분', subject: 'math' },
  { id: createUnitId('high_calculus2', 3), grade: 'high_calculus2', order: 3, name: '여러 가지 함수의 미분법', subject: 'math' },
  { id: createUnitId('high_calculus2', 4), grade: 'high_calculus2', order: 4, name: '여러 가지 적분법', subject: 'math' },
  { id: createUnitId('high_calculus2', 5), grade: 'high_calculus2', order: 5, name: '정적분의 활용', subject: 'math' },
]

// 고등학교 확률과 통계
export const HIGH_PROBABILITY_UNITS: Unit[] = [
  { id: createUnitId('high_probability', 1), grade: 'high_probability', order: 1, name: '순열과 조합 심화', subject: 'math' },
  { id: createUnitId('high_probability', 2), grade: 'high_probability', order: 2, name: '이항정리', subject: 'math' },
  { id: createUnitId('high_probability', 3), grade: 'high_probability', order: 3, name: '확률의 뜻과 활용', subject: 'math' },
  { id: createUnitId('high_probability', 4), grade: 'high_probability', order: 4, name: '조건부확률', subject: 'math' },
  { id: createUnitId('high_probability', 5), grade: 'high_probability', order: 5, name: '확률분포', subject: 'math' },
  { id: createUnitId('high_probability', 6), grade: 'high_probability', order: 6, name: '통계적 추정', subject: 'math' },
]

// 고등학교 기하
export const HIGH_GEOMETRY_UNITS: Unit[] = [
  { id: createUnitId('high_geometry', 1), grade: 'high_geometry', order: 1, name: '이차곡선', subject: 'math' },
  { id: createUnitId('high_geometry', 2), grade: 'high_geometry', order: 2, name: '평면벡터', subject: 'math' },
  { id: createUnitId('high_geometry', 3), grade: 'high_geometry', order: 3, name: '공간도형과 공간좌표', subject: 'math' },
  { id: createUnitId('high_geometry', 4), grade: 'high_geometry', order: 4, name: '공간벡터', subject: 'math' },
]

// 전체 단원 목록
export const ALL_MATH_UNITS: Unit[] = [
  ...MIDDLE_1_UNITS,
  ...MIDDLE_2_UNITS,
  ...MIDDLE_3_UNITS,
  ...HIGH_COMMON1_UNITS,
  ...HIGH_COMMON2_UNITS,
  ...HIGH_CALCULUS1_UNITS,
  ...HIGH_CALCULUS2_UNITS,
  ...HIGH_PROBABILITY_UNITS,
  ...HIGH_GEOMETRY_UNITS,
]

// 학년별 단원 조회
export const UNITS_BY_GRADE: Record<GradeLevel, Unit[]> = {
  middle_1: MIDDLE_1_UNITS,
  middle_2: MIDDLE_2_UNITS,
  middle_3: MIDDLE_3_UNITS,
  high_common1: HIGH_COMMON1_UNITS,
  high_common2: HIGH_COMMON2_UNITS,
  high_calculus1: HIGH_CALCULUS1_UNITS,
  high_calculus2: HIGH_CALCULUS2_UNITS,
  high_probability: HIGH_PROBABILITY_UNITS,
  high_geometry: HIGH_GEOMETRY_UNITS,
}

// 단원 ID로 조회
export function getUnitById(unitId: string): Unit | undefined {
  return ALL_MATH_UNITS.find(unit => unit.id === unitId)
}

// 학년별 단원 조회
export function getUnitsByGrade(grade: GradeLevel): Unit[] {
  return UNITS_BY_GRADE[grade] || []
}

// 단원 총 개수
export const TOTAL_UNIT_COUNT = ALL_MATH_UNITS.length // 64개
