'use client'

/**
 * EduFlow 대시보드 통계 훅
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 자동 요청 중복제거 및 캐싱
 * - async-parallel: Promise.all()로 독립적인 API 병렬 호출
 *
 * @example
 * ```tsx
 * const { stats, isLoading, error, mutate } = useDashboardStats('academy-id')
 * ```
 */

import useSWR from 'swr'
import type { TeacherStats, TeacherStatsResponse, PeriodType } from '@/types/stats'

// SWR fetcher 함수
const fetcher = async (url: string): Promise<TeacherStats> => {
  const response = await fetch(url)
  const data: TeacherStatsResponse = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || '데이터를 불러오는 중 오류가 발생했습니다.')
  }

  return data.data
}

// 개별 통계 API fetcher들 (async-parallel 패턴을 위한 준비)
const fetchStudentStats = (academyId: string) =>
  fetch(`/api/stats/students?academyId=${academyId}`).then((r) => r.json())

const fetchAssignmentStats = (academyId: string) =>
  fetch(`/api/stats/assignments?academyId=${academyId}`).then((r) => r.json())

const fetchProblemStats = (academyId: string, period: PeriodType) =>
  fetch(`/api/stats/problems?academyId=${academyId}&period=${period}`).then((r) => r.json())

const fetchGradeStats = (academyId: string) =>
  fetch(`/api/stats/grades?academyId=${academyId}`).then((r) => r.json())

/**
 * 대시보드 통합 통계 훅
 *
 * SWR을 사용하여 자동 캐싱 및 요청 중복제거를 수행합니다.
 * 여러 컴포넌트에서 동일한 키로 호출해도 한 번만 fetch됩니다.
 */
export function useDashboardStats(academyId: string, period: PeriodType = 'week') {
  const {
    data: stats,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<TeacherStats>(
    academyId ? `/api/stats/teacher?academyId=${academyId}&period=${period}` : null,
    fetcher,
    {
      // 5분간 캐시 유지
      dedupingInterval: 5 * 60 * 1000,
      // 포커스 시 재검증
      revalidateOnFocus: true,
      // 연결 복구 시 재검증
      revalidateOnReconnect: true,
      // 실패 시 3번까지 재시도
      errorRetryCount: 3,
      // 오류 재시도 간격 (지수 백오프)
      errorRetryInterval: 1000,
    }
  )

  return {
    stats,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}

/**
 * 대시보드 통계 병렬 로딩 훅
 *
 * async-parallel: Promise.all()을 사용하여 독립적인 API를 병렬로 호출합니다.
 * 개별 통계 API가 있는 경우 이 훅을 사용하여 성능을 최적화할 수 있습니다.
 *
 * 예시: 4개의 순차 호출 → 1개의 병렬 호출로 개선
 * - 순차: 100ms + 100ms + 100ms + 100ms = 400ms
 * - 병렬: max(100ms, 100ms, 100ms, 100ms) = ~100ms
 */
export function useDashboardStatsParallel(academyId: string, period: PeriodType = 'week') {
  const { data, error, isLoading, mutate } = useSWR(
    academyId ? ['dashboard-stats-parallel', academyId, period] : null,
    async () => {
      // async-parallel: 독립적인 API 호출을 Promise.all로 병렬 실행
      const [studentStats, assignmentStats, problemStats, gradeStats] = await Promise.all([
        fetchStudentStats(academyId),
        fetchAssignmentStats(academyId),
        fetchProblemStats(academyId, period),
        fetchGradeStats(academyId),
      ])

      // 결과 합성
      return {
        studentStats,
        assignmentStats,
        problemStats,
        gradeStats,
      }
    },
    {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: true,
    }
  )

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}

/**
 * 학생 현황 통계 훅
 */
export function useStudentStats(academyId: string) {
  return useSWR(
    academyId ? `/api/stats/students?academyId=${academyId}` : null,
    fetcher,
    { dedupingInterval: 5 * 60 * 1000 }
  )
}

/**
 * 과제 현황 통계 훅
 */
export function useAssignmentStats(academyId: string) {
  return useSWR(
    academyId ? `/api/stats/assignments?academyId=${academyId}` : null,
    fetcher,
    { dedupingInterval: 5 * 60 * 1000 }
  )
}

/**
 * 차트 데이터 변환 유틸리티
 */
export function transformChartData(stats: TeacherStats | undefined) {
  if (!stats) return { gradeDistributionData: [], weeklyTrendData: [] }

  return {
    gradeDistributionData: stats.gradeDistribution.map((item) => ({
      label: item.range,
      value: item.count,
    })),
    weeklyTrendData: stats.weeklyProblemsTrend.map((item) => ({
      label: item.label,
      value: item.value,
    })),
  }
}

export default useDashboardStats
