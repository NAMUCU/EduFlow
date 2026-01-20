'use client';

/**
 * EduFlow 선생님용 보고서 관리 훅
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 보고서 목록 캐싱 및 중복 요청 방지
 * - async-parallel: 보고서+학생 데이터 병렬 로딩
 * - js-combine-iterations: 통계 데이터를 한 번의 순회로 계산
 *
 * @example
 * ```tsx
 * const {
 *   reports,
 *   students,
 *   stats,
 *   isLoading,
 *   error,
 *   refresh,
 *   generateReport,
 *   sendReport,
 * } = useReportsTeacher({
 *   status: 'pending',
 *   search: '김민준',
 * });
 * ```
 */

import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { useMemo, useCallback } from 'react';
import {
  Report,
  ReportListItem,
  ReportListResponse,
  ReportDetailResponse,
  ReportGenerateRequest,
  ReportGenerateResponse,
  ReportPeriodType,
  ReportStatus,
} from '@/types/report';

// ============================================
// 타입 정의
// ============================================

/** 보고서 필터 옵션 */
export interface TeacherReportFilter {
  status?: ReportStatus | '';
  search?: string;
  periodType?: ReportPeriodType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/** 학생 타입 */
export interface ReportStudent {
  id: string;
  name: string;
  grade: string;
  school: string;
  subjects: string[];
  className?: string;
}

/** API 응답 타입 */
interface StudentsResponse {
  success: boolean;
  data?: {
    students: ReportStudent[];
    total: number;
  };
  error?: string;
}

/** 보고서 통계 타입 */
export interface ReportStats {
  total: number;
  sent: number;
  improved: number;
  avgScore: number;
}

// ============================================
// Fetcher 함수
// ============================================

/**
 * API 요청 fetcher
 */
const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '데이터를 불러오는데 실패했습니다.');
  }
  return response.json();
};

/**
 * 보고서 생성 API
 */
async function generateReportFetcher(
  url: string,
  { arg }: { arg: ReportGenerateRequest }
): Promise<ReportGenerateResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '보고서 생성에 실패했습니다.');
  }
  return response.json();
}

/**
 * 보고서 발송 API
 */
async function sendReportFetcher(
  url: string,
  { arg }: { arg: { sendType: 'sms' | 'kakao' } }
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '보고서 발송에 실패했습니다.');
  }
  return response.json();
}

// ============================================
// URL 빌더
// ============================================

/**
 * 필터를 URL 쿼리 파라미터로 변환
 */
function buildReportsUrl(filter: TeacherReportFilter): string {
  const params = new URLSearchParams();

  if (filter.status) params.append('status', filter.status);
  if (filter.periodType) params.append('periodType', filter.periodType);
  if (filter.startDate) params.append('startDate', filter.startDate);
  if (filter.endDate) params.append('endDate', filter.endDate);
  if (filter.page) params.append('page', String(filter.page));
  if (filter.pageSize) params.append('pageSize', String(filter.pageSize));

  const queryString = params.toString();
  return `/api/reports${queryString ? `?${queryString}` : ''}`;
}

// ============================================
// 메인 훅
// ============================================

interface UseReportsTeacherOptions {
  filter?: TeacherReportFilter;
}

/**
 * useReportsTeacher 훅
 *
 * 선생님용 보고서 목록을 SWR로 관리합니다.
 * async-parallel: 보고서와 학생 데이터를 병렬로 로딩합니다.
 * client-swr-dedup: 중복 요청 방지 및 자동 재검증 기능을 제공합니다.
 */
export function useReportsTeacher(options: UseReportsTeacherOptions = {}) {
  const { filter = {} } = options;
  const { mutate: globalMutate } = useSWRConfig();

  // 보고서 목록 API URL
  const reportsUrl = useMemo(() => buildReportsUrl(filter), [filter]);

  // 학생 목록 API URL
  const studentsUrl = '/api/students?page_size=100';

  // ============================================
  // SWR 데이터 페칭 (async-parallel 규칙)
  // SWR이 자동으로 병렬 요청 처리
  // ============================================

  // 보고서 목록
  const {
    data: reportsData,
    error: reportsError,
    isLoading: isReportsLoading,
    isValidating: isReportsValidating,
    mutate: mutateReports,
  } = useSWR<ReportListResponse>(
    reportsUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 2000, // 2초 내 중복 요청 방지
      keepPreviousData: true, // 필터 변경 시 깜빡임 방지
      errorRetryCount: 3,
    }
  );

  // 학생 목록 (병렬로 로딩됨)
  const {
    data: studentsData,
    error: studentsError,
    isLoading: isStudentsLoading,
  } = useSWR<StudentsResponse>(
    studentsUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 학생 목록은 10초 캐싱
      keepPreviousData: true,
    }
  );

  // ============================================
  // Mutations (useSWRMutation 사용)
  // ============================================

  // 보고서 생성 mutation
  const {
    trigger: triggerGenerate,
    isMutating: isGenerating,
    error: generateError,
  } = useSWRMutation('/api/reports/generate', generateReportFetcher);

  // ============================================
  // 통계 계산 (js-combine-iterations 규칙)
  // 한 번의 순회로 모든 통계 계산
  // ============================================

  const stats = useMemo<ReportStats>(() => {
    const reports = reportsData?.data?.reports ?? [];

    if (reports.length === 0) {
      return { total: 0, sent: 0, improved: 0, avgScore: 0 };
    }

    let sent = 0;
    let improved = 0;
    let totalScore = 0;

    // js-combine-iterations: 한 번의 순회로 모든 통계 계산
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      if (report.status === 'sent') sent++;
      if (report.scoreTrend === 'up') improved++;
      totalScore += report.overallScore;
    }

    return {
      total: reports.length,
      sent,
      improved,
      avgScore: Math.round(totalScore / reports.length),
    };
  }, [reportsData?.data?.reports]);

  // ============================================
  // 검색 필터링 (클라이언트 사이드)
  // ============================================

  const filteredReports = useMemo(() => {
    const reports = reportsData?.data?.reports ?? [];
    if (!filter.search) return reports;

    const searchLower = filter.search.toLowerCase();
    return reports.filter((report) =>
      report.studentName.toLowerCase().includes(searchLower)
    );
  }, [reportsData?.data?.reports, filter.search]);

  // ============================================
  // 학생 Map 인덱스 (js-set-map-lookups 규칙)
  // O(1) 조회를 위한 Map 생성
  // ============================================

  const studentMap = useMemo(() => {
    const students = studentsData?.data?.students ?? [];
    return new Map(students.map((s) => [s.id, s]));
  }, [studentsData?.data?.students]);

  // ============================================
  // 액션 함수들
  // ============================================

  /**
   * 보고서 생성
   */
  const generateReport = useCallback(
    async (request: ReportGenerateRequest) => {
      const result = await triggerGenerate(request);

      if (result?.success && result.data) {
        // 새 보고서를 목록에 추가 (optimistic update)
        await mutateReports();
      }

      return result;
    },
    [triggerGenerate, mutateReports]
  );

  /**
   * 보고서 발송
   */
  const sendReport = useCallback(
    async (reportId: string, sendType: 'sms' | 'kakao' = 'sms') => {
      const response = await fetch(`/api/reports/${reportId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendType }),
      });

      const result = await response.json();

      if (result.success) {
        // 보고서 목록 새로고침
        await mutateReports();
      }

      return result;
    },
    [mutateReports]
  );

  /**
   * 보고서 상세 조회
   */
  const getReportDetail = useCallback(
    async (reportId: string): Promise<Report | null> => {
      try {
        const response = await fetch(`/api/reports/${reportId}`);
        const data: ReportDetailResponse = await response.json();

        if (data.success && data.data) {
          return data.data;
        }
        return null;
      } catch (error) {
        console.error('보고서 상세 조회 오류:', error);
        return null;
      }
    },
    []
  );

  /**
   * PDF 다운로드
   */
  const downloadPdf = useCallback(async (reportId: string) => {
    // 실제 구현에서는 서버에서 PDF 생성
    alert(`보고서 ${reportId}의 PDF 다운로드 기능은 추후 구현 예정입니다.`);
  }, []);

  /**
   * 새로고침 (async-parallel 규칙)
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      mutateReports(),
      globalMutate(studentsUrl),
    ]);
  }, [mutateReports, globalMutate, studentsUrl]);

  // ============================================
  // 반환값
  // ============================================

  const isLoading = isReportsLoading || isStudentsLoading;
  const isValidating = isReportsValidating;
  const error =
    reportsError?.message || studentsError?.message || generateError?.message;

  return {
    // 보고서 데이터
    reports: filteredReports,
    allReports: reportsData?.data?.reports ?? [],
    total: reportsData?.data?.total ?? 0,
    page: reportsData?.data?.page ?? 1,
    pageSize: reportsData?.data?.pageSize ?? 20,

    // 학생 데이터
    students: studentsData?.data?.students ?? [],
    studentMap,

    // 통계
    stats,

    // 상태
    isLoading,
    isValidating,
    isGenerating,
    error,

    // 액션
    generateReport,
    sendReport,
    getReportDetail,
    downloadPdf,
    refresh,
    mutateReports,
  };
}

// ============================================
// 개별 보고서 훅
// ============================================

/**
 * useReportDetail 훅
 *
 * 특정 보고서의 상세 정보를 조회합니다.
 */
export function useReportDetail(reportId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ReportDetailResponse>(
    reportId ? `/api/reports/${reportId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    report: data?.data ?? null,
    isLoading,
    isError: !!error,
    error: error?.message,
    refresh: mutate,
  };
}

// 기본 export
export default useReportsTeacher;
