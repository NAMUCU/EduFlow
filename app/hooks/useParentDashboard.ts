'use client'

/**
 * EduFlow 학부모 대시보드 통계 훅
 *
 * Vercel Best Practices 적용:
 * - async-parallel: Promise.all()로 독립적인 API 병렬 호출
 * - client-swr-dedup: SWR로 자동 요청 중복제거 및 캐싱
 *
 * @example
 * ```tsx
 * const { stats, childInfo, notices, isLoading, error, mutate } = useParentDashboard('parent-id')
 * ```
 */

import useSWR from 'swr'
import type {
  ParentStats,
  ParentStatsResponse,
  ChildInfo,
  PeriodType,
} from '@/types/stats'

// ============================================
// API Fetcher 함수들
// ============================================

/**
 * 기본 JSON fetcher
 */
const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('데이터를 불러오는 중 오류가 발생했습니다.')
  }
  return response.json()
}

/**
 * 학부모 통계 응답 fetcher
 */
const parentStatsFetcher = async (url: string): Promise<ParentStats> => {
  const response = await fetch(url)
  const data: ParentStatsResponse = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || '데이터를 불러오는 중 오류가 발생했습니다.')
  }

  return data.data
}

// ============================================
// 개별 API Fetcher 함수들 (async-parallel 패턴용)
// ============================================

/**
 * 자녀 정보 조회
 */
const fetchChildInfo = (parentId: string): Promise<{ data: ChildInfo }> =>
  fetch(`/api/parent/child?parentId=${parentId}`).then((r) => r.json())

/**
 * 주간 학습 현황 조회
 */
const fetchWeeklyProgress = (
  childId: string,
  period: PeriodType
): Promise<{
  data: ParentStats['weeklyProgress']
}> =>
  fetch(`/api/parent/progress?childId=${childId}&period=${period}`).then((r) =>
    r.json()
  )

/**
 * 최근 과제 현황 조회
 */
const fetchRecentAssignments = (
  childId: string
): Promise<{ data: ParentStats['recentAssignments'] }> =>
  fetch(`/api/parent/assignments?childId=${childId}&limit=4`).then((r) =>
    r.json()
  )

/**
 * 과목별 성적 조회
 */
const fetchSubjectPerformance = (
  childId: string
): Promise<{ data: ParentStats['subjectPerformance'] }> =>
  fetch(`/api/parent/performance?childId=${childId}`).then((r) => r.json())

/**
 * 출석 현황 조회
 */
const fetchAttendance = (
  childId: string
): Promise<{ data: ParentStats['attendanceRecent'] }> =>
  fetch(`/api/parent/attendance?childId=${childId}&limit=5`).then((r) =>
    r.json()
  )

/**
 * 학원 공지사항 조회
 */
const fetchNotices = (
  academyId: string
): Promise<{ data: ParentStats['notices'] }> =>
  fetch(`/api/notices?academyId=${academyId}&limit=3`).then((r) => r.json())

// ============================================
// 커스텀 훅 정의
// ============================================

/**
 * 학부모 대시보드 통합 통계 훅
 *
 * SWR을 사용하여 자동 캐싱 및 요청 중복제거를 수행합니다.
 * 여러 컴포넌트에서 동일한 키로 호출해도 한 번만 fetch됩니다.
 */
export function useParentDashboard(parentId: string, period: PeriodType = 'week') {
  const {
    data: stats,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<ParentStats>(
    parentId ? `/api/stats/parent?parentId=${parentId}&period=${period}` : null,
    parentStatsFetcher,
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
 * 학부모 대시보드 통계 병렬 로딩 훅
 *
 * async-parallel: Promise.all()을 사용하여 독립적인 API를 병렬로 호출합니다.
 * 개별 통계 API가 있는 경우 이 훅을 사용하여 성능을 최적화할 수 있습니다.
 *
 * 예시: 6개의 순차 호출 → 1개의 병렬 호출로 개선
 * - 순차: 100ms × 6 = 600ms
 * - 병렬: max(100ms × 6) ≈ 100ms
 */
export function useParentDashboardParallel(
  parentId: string,
  childId: string,
  academyId: string,
  period: PeriodType = 'week'
) {
  const { data, error, isLoading, mutate } = useSWR(
    parentId && childId
      ? ['parent-dashboard-parallel', parentId, childId, period]
      : null,
    async () => {
      // async-parallel: 독립적인 API 호출을 Promise.all로 병렬 실행
      const [
        childInfoRes,
        weeklyProgressRes,
        assignmentsRes,
        performanceRes,
        attendanceRes,
        noticesRes,
      ] = await Promise.all([
        fetchChildInfo(parentId),
        fetchWeeklyProgress(childId, period),
        fetchRecentAssignments(childId),
        fetchSubjectPerformance(childId),
        fetchAttendance(childId),
        fetchNotices(academyId),
      ])

      // 결과 합성
      return {
        childInfo: childInfoRes.data,
        weeklyProgress: weeklyProgressRes.data,
        recentAssignments: assignmentsRes.data,
        subjectPerformance: performanceRes.data,
        attendanceRecent: attendanceRes.data,
        notices: noticesRes.data,
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
 * 자녀 정보 조회 훅
 */
export function useChildInfo(parentId: string) {
  return useSWR(
    parentId ? `/api/parent/child?parentId=${parentId}` : null,
    fetcher<{ data: ChildInfo }>,
    { dedupingInterval: 5 * 60 * 1000 }
  )
}

/**
 * 자녀 과제 현황 훅
 */
export function useChildAssignments(childId: string) {
  return useSWR(
    childId ? `/api/parent/assignments?childId=${childId}` : null,
    fetcher<{ data: ParentStats['recentAssignments'] }>,
    { dedupingInterval: 2 * 60 * 1000 }
  )
}

/**
 * 자녀 출석 현황 훅
 */
export function useChildAttendance(childId: string) {
  return useSWR(
    childId ? `/api/parent/attendance?childId=${childId}` : null,
    fetcher<{ data: ParentStats['attendanceRecent'] }>,
    { dedupingInterval: 5 * 60 * 1000 }
  )
}

/**
 * 학원 공지사항 훅
 */
export function useAcademyNotices(academyId: string) {
  return useSWR(
    academyId ? `/api/notices?academyId=${academyId}&limit=5` : null,
    fetcher<{ data: ParentStats['notices'] }>,
    { dedupingInterval: 5 * 60 * 1000 }
  )
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 주간 학습 현황 차트 데이터 변환
 */
export function transformWeeklyChartData(weeklyProgress: ParentStats['weeklyProgress'] | undefined) {
  if (!weeklyProgress) return []

  return weeklyProgress.map((item) => ({
    label: item.day,
    value: item.hours,
  }))
}

/**
 * 과목별 성적 차트 데이터 변환
 */
export function transformSubjectChartData(
  subjectPerformance: ParentStats['subjectPerformance'] | undefined
) {
  if (!subjectPerformance) return []

  return subjectPerformance.map((item) => ({
    label: item.subject,
    value: item.currentScore,
    previousValue: item.previousScore,
    trend: item.trend,
  }))
}

export default useParentDashboard
