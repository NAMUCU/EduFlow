'use client'

/**
 * EduFlow 학생 대시보드 통계 훅
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 자동 요청 중복제거 및 캐싱
 * - async-parallel: Promise.all()로 독립적인 API 병렬 호출
 *
 * @example
 * ```tsx
 * const { stats, isLoading, error, mutate } = useStudentDashboard('student-id')
 * ```
 */

import useSWR from 'swr'
import type { StudentStats, StudentStatsResponse, PeriodType } from '@/types/stats'

// SWR fetcher 함수
const fetcher = async (url: string): Promise<StudentStats> => {
  const response = await fetch(url)
  const data: StudentStatsResponse = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || '데이터를 불러오는 중 오류가 발생했습니다.')
  }

  return data.data
}

// 개별 통계 API fetcher들 (async-parallel 패턴을 위한 준비)
const fetchAssignments = (studentId: string) =>
  fetch(`/api/stats/student/assignments?studentId=${studentId}`).then((r) => r.json())

const fetchGrades = (studentId: string) =>
  fetch(`/api/stats/student/grades?studentId=${studentId}`).then((r) => r.json())

const fetchWeeklyStudy = (studentId: string) =>
  fetch(`/api/stats/student/weekly?studentId=${studentId}`).then((r) => r.json())

const fetchWeakUnits = (studentId: string) =>
  fetch(`/api/stats/student/weak-units?studentId=${studentId}`).then((r) => r.json())

const fetchNotifications = (studentId: string) =>
  fetch(`/api/notifications?userId=${studentId}`).then((r) => r.json())

/**
 * 학생 대시보드 통합 통계 훅
 *
 * SWR을 사용하여 자동 캐싱 및 요청 중복제거를 수행합니다.
 * 여러 컴포넌트에서 동일한 키로 호출해도 한 번만 fetch됩니다.
 */
export function useStudentDashboard(studentId: string | null, period: PeriodType = 'week') {
  const {
    data: stats,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<StudentStats>(
    studentId ? `/api/stats/student?studentId=${studentId}&period=${period}` : null,
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
 * 학생 대시보드 통계 병렬 로딩 훅
 *
 * async-parallel: Promise.all()을 사용하여 독립적인 API를 병렬로 호출합니다.
 * 개별 통계 API가 있는 경우 이 훅을 사용하여 성능을 최적화할 수 있습니다.
 *
 * 예시: 5개의 순차 호출 → 1개의 병렬 호출로 개선
 * - 순차: 100ms + 100ms + 100ms + 100ms + 100ms = 500ms
 * - 병렬: max(100ms, 100ms, 100ms, 100ms, 100ms) = ~100ms
 */
export function useStudentDashboardParallel(studentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    studentId ? ['student-dashboard-parallel', studentId] : null,
    async () => {
      // async-parallel: 독립적인 API 호출을 Promise.all로 병렬 실행
      const [assignments, grades, weeklyStudy, weakUnits, notifications] = await Promise.all([
        fetchAssignments(studentId!),
        fetchGrades(studentId!),
        fetchWeeklyStudy(studentId!),
        fetchWeakUnits(studentId!),
        fetchNotifications(studentId!),
      ])

      // 결과 합성
      return {
        assignments,
        grades,
        weeklyStudy,
        weakUnits,
        notifications,
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
 * 오늘의 과제 훅
 */
export function useTodayAssignments(studentId: string | null) {
  return useSWR(
    studentId ? `/api/stats/student/assignments?studentId=${studentId}` : null,
    fetcher,
    { dedupingInterval: 5 * 60 * 1000 }
  )
}

/**
 * 최근 성적 훅
 */
export function useRecentGrades(studentId: string | null) {
  return useSWR(
    studentId ? `/api/stats/student/grades?studentId=${studentId}` : null,
    fetcher,
    { dedupingInterval: 5 * 60 * 1000 }
  )
}

/**
 * 주간 학습 현황 훅
 */
export function useWeeklyStudy(studentId: string | null) {
  return useSWR(
    studentId ? `/api/stats/student/weekly?studentId=${studentId}` : null,
    fetcher,
    { dedupingInterval: 5 * 60 * 1000 }
  )
}

/**
 * 취약 단원 훅
 */
export function useWeakUnits(studentId: string | null) {
  return useSWR(
    studentId ? `/api/stats/student/weak-units?studentId=${studentId}` : null,
    fetcher,
    { dedupingInterval: 5 * 60 * 1000 }
  )
}

/**
 * 차트 데이터 변환 유틸리티
 */
export function transformStudentChartData(stats: StudentStats | undefined) {
  if (!stats) {
    return {
      weeklyChartData: [],
      subjectScoreData: [],
    }
  }

  return {
    weeklyChartData: stats.weeklyStudyData.map((item) => ({
      label: item.day,
      value: item.problemsSolved,
    })),
    subjectScoreData: stats.subjectScoreTrend.map((subject) => ({
      subject: subject.subject,
      data: subject.data.map((point) => ({
        label: point.label,
        value: point.value,
      })),
    })),
  }
}

export default useStudentDashboard
