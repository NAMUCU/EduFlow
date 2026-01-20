'use client';

/**
 * useReports 훅
 *
 * 보고서 목록 및 상세 정보를 관리하는 커스텀 훅입니다.
 * SWR을 사용하여 보고서 데이터를 캐싱하고 자동으로 요청을 중복 제거합니다.
 *
 * Vercel Best Practices:
 * - client-swr-dedup: SWR로 자동 요청 중복 제거
 * - server-parallel-fetching: 여러 자녀 보고서 병렬 조회
 */

import useSWR from 'swr';
import {
  Report,
  ReportListItem,
  ReportListResponse,
  ReportDetailResponse,
  ReportPeriodType,
  ReportStatus,
} from '@/types/report';

// 보고서 필터 타입
export interface ReportFilter {
  studentId?: string;
  periodType?: ReportPeriodType;
  status?: ReportStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// SWR fetcher 함수
const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('데이터를 불러오는데 실패했습니다.');
  }
  return res.json();
};

// URL 쿼리 파라미터 생성
const buildQueryString = (filter: ReportFilter): string => {
  const params = new URLSearchParams();

  if (filter.studentId) params.append('studentId', filter.studentId);
  if (filter.periodType) params.append('periodType', filter.periodType);
  if (filter.status) params.append('status', filter.status);
  if (filter.startDate) params.append('startDate', filter.startDate);
  if (filter.endDate) params.append('endDate', filter.endDate);
  if (filter.page) params.append('page', String(filter.page));
  if (filter.pageSize) params.append('pageSize', String(filter.pageSize));

  return params.toString();
};

/**
 * useReports 훅
 *
 * 보고서 목록을 조회합니다.
 * SWR을 사용하여 캐싱 및 자동 갱신을 처리합니다.
 */
export function useReports(filter: ReportFilter = {}) {
  const queryString = buildQueryString(filter);
  const url = `/api/reports${queryString ? `?${queryString}` : ''}`;

  // SWR로 보고서 목록 조회 (client-swr-dedup 적용)
  const { data, error, isLoading, mutate } = useSWR<ReportListResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30초간 중복 요청 방지
    }
  );

  // 보고서 목록 새로고침
  const refreshReports = () => {
    mutate();
  };

  return {
    reports: data?.data?.reports ?? [],
    total: data?.data?.total ?? 0,
    page: data?.data?.page ?? 1,
    pageSize: data?.data?.pageSize ?? 20,
    isLoading,
    isError: !!error,
    error: error?.message,
    refreshReports,
  };
}

/**
 * useReport 훅
 *
 * 특정 보고서의 상세 정보를 조회합니다.
 */
export function useReport(reportId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ReportDetailResponse>(
    reportId ? `/api/reports/${reportId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  // 보고서 새로고침
  const refreshReport = () => {
    mutate();
  };

  return {
    report: data?.data,
    isLoading,
    isError: !!error,
    error: error?.message,
    refreshReport,
  };
}

/**
 * useChildrenReports 훅
 *
 * 여러 자녀의 보고서를 병렬로 조회합니다.
 * server-parallel-fetching 패턴 적용
 */
export function useChildrenReports(childIds: string[]) {
  // 각 자녀별로 SWR 훅을 개별적으로 호출하지 않고,
  // 하나의 API로 여러 자녀 보고서를 한 번에 조회
  const idsQuery = childIds.join(',');
  const url = childIds.length > 0 ? `/api/reports?studentIds=${idsQuery}` : null;

  const { data, error, isLoading, mutate } = useSWR<ReportListResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  // 자녀별로 보고서 그룹화
  const reportsByChild = (data?.data?.reports ?? []).reduce(
    (acc, report) => {
      const studentId = report.studentId;
      if (!acc[studentId]) {
        acc[studentId] = [];
      }
      acc[studentId].push(report);
      return acc;
    },
    {} as Record<string, ReportListItem[]>
  );

  return {
    reportsByChild,
    allReports: data?.data?.reports ?? [],
    isLoading,
    isError: !!error,
    error: error?.message,
    refreshReports: mutate,
  };
}

/**
 * PDF 다운로드 함수
 *
 * 보고서를 PDF로 다운로드합니다.
 */
export async function downloadReportPdf(reportId: string): Promise<void> {
  try {
    const response = await fetch(`/api/reports/${reportId}/pdf`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('PDF 생성에 실패했습니다.');
    }

    const data = await response.json();

    if (data.success && data.data?.pdfUrl) {
      // PDF URL로 다운로드
      const link = document.createElement('a');
      link.href = data.data.pdfUrl;
      link.download = `report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      throw new Error(data.error || 'PDF URL을 받지 못했습니다.');
    }
  } catch (error) {
    console.error('PDF 다운로드 오류:', error);
    throw error;
  }
}

/**
 * 보고서 PDF 생성 (Mock 구현)
 *
 * 실제 환경에서는 서버에서 PDF를 생성합니다.
 * 여기서는 클라이언트에서 간단한 다운로드를 시뮬레이션합니다.
 */
export async function generateReportPdf(report: Report): Promise<Blob> {
  // Mock: 실제로는 서버에서 PDF 생성
  // PDF.co API 또는 puppeteer 등을 사용하여 PDF 생성
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 간단한 텍스트 기반 PDF 대체 (Mock)
  const content = `
학습 보고서
====================

학생: ${report.student.name}
기간: ${report.period.label}
학교: ${report.student.school}
학년: ${report.student.grade}

종합 점수: ${report.gradeAnalysis.overallScore}점
이전 점수: ${report.gradeAnalysis.previousOverallScore}점

선생님 코멘트:
${report.teacherComment || report.aiAnalysis.teacherCommentDraft}

학부모님께 드리는 말씀:
${report.aiAnalysis.parentMessage}
  `;

  return new Blob([content], { type: 'text/plain' });
}

export default useReports;
