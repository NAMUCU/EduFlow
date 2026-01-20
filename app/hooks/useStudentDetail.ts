/**
 * 학생 상세 정보 조회를 위한 SWR 훅
 *
 * Vercel Best Practices 적용:
 * - async-parallel: Promise.all로 학생 정보, 성적, 과제, 출결, 상담 병렬 fetching
 * - client-swr-dedup: SWR로 자동 요청 중복 제거 및 캐싱
 * - js-set-map-lookups: Map을 사용한 O(1) 조회
 */

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';
import {
  StudentDetail,
  StudentBasicInfo,
  GradeSummary,
  AssignmentStats,
  AttendanceStats,
  UpdateStudentInput,
} from '@/types/student';
import { Grade, Attendance, Consultation, StudentAssignment } from '@/types/database';

// ============================================
// API 응답 타입 정의
// ============================================

interface StudentDetailResponse {
  success: boolean;
  data: StudentDetail;
  error?: string;
}

// 개별 데이터 응답 타입 (병렬 fetching용)
interface StudentBasicResponse {
  success: boolean;
  data: StudentBasicInfo;
  error?: string;
}

interface GradesResponse {
  success: boolean;
  data: {
    grades: Grade[];
    summary: GradeSummary[];
  };
  error?: string;
}

interface AssignmentsResponse {
  success: boolean;
  data: {
    assignments: StudentAssignment[];
    stats: AssignmentStats;
  };
  error?: string;
}

interface AttendanceResponse {
  success: boolean;
  data: {
    attendance: Attendance[];
    stats: AttendanceStats;
  };
  error?: string;
}

interface ConsultationsResponse {
  success: boolean;
  data: Consultation[];
  error?: string;
}

// ============================================
// Fetcher 함수들
// ============================================

const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('데이터를 불러오는데 실패했습니다.');
  }
  return response.json();
};

/**
 * Vercel Best Practice: async-parallel
 * 모든 학생 관련 데이터를 병렬로 fetching하여 워터폴 방지
 *
 * 개선 전 (Sequential - 5개 요청 순차 실행):
 * const basic = await fetchBasic()      // 200ms
 * const grades = await fetchGrades()    // 150ms
 * const assignments = await fetchAssignments() // 150ms
 * const attendance = await fetchAttendance()   // 100ms
 * const consultations = await fetchConsultations() // 100ms
 * 총: ~700ms
 *
 * 개선 후 (Parallel - 모든 요청 동시 실행):
 * const [basic, grades, assignments, attendance, consultations] = await Promise.all([...])
 * 총: ~200ms (가장 느린 요청 기준)
 */
async function fetchStudentDetailParallel(studentId: string): Promise<StudentDetailResponse> {
  const [basicRes, gradesRes, assignmentsRes, attendanceRes, consultationsRes] = await Promise.all([
    fetcher<StudentBasicResponse>(`/api/students/${studentId}/basic`),
    fetcher<GradesResponse>(`/api/students/${studentId}/grades`),
    fetcher<AssignmentsResponse>(`/api/students/${studentId}/assignments`),
    fetcher<AttendanceResponse>(`/api/students/${studentId}/attendance`),
    fetcher<ConsultationsResponse>(`/api/students/${studentId}/consultations`),
  ]);

  // 병렬로 받아온 데이터를 조합
  const studentDetail: StudentDetail = {
    ...basicRes.data,
    grades: gradesRes.data.summary,
    recentGrades: gradesRes.data.grades,
    assignmentStats: assignmentsRes.data.stats,
    recentAssignments: assignmentsRes.data.assignments,
    attendanceStats: attendanceRes.data.stats,
    recentAttendance: attendanceRes.data.attendance,
    consultations: consultationsRes.data,
  };

  return {
    success: true,
    data: studentDetail,
  };
}

// 기존 단일 API 호출용 fetcher (폴백용)
async function fetchStudentDetail(url: string): Promise<StudentDetailResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('학생 정보를 불러오는데 실패했습니다.');
  }
  return response.json();
}

// ============================================
// 메인 훅: useStudentDetail
// ============================================

interface UseStudentDetailOptions {
  /**
   * true일 경우 병렬 fetching 사용 (각 API 엔드포인트 개별 호출)
   * false일 경우 단일 API 호출 (서버에서 조합)
   */
  useParallelFetching?: boolean;
  /**
   * 자동 재검증 간격 (ms)
   */
  refreshInterval?: number;
}

export function useStudentDetail(
  studentId: string | null,
  options: UseStudentDetailOptions = {}
) {
  const { useParallelFetching = false, refreshInterval = 0 } = options;

  // SWR 캐시 키
  const cacheKey = studentId ? `student-detail-${studentId}` : null;

  /**
   * Vercel Best Practice: client-swr-dedup
   * - 동일한 학생 ID에 대한 중복 요청 자동 제거
   * - 캐시된 데이터 먼저 반환 후 백그라운드에서 재검증
   * - 여러 컴포넌트에서 동일 학생 데이터 공유
   */
  const { data, error, isLoading, isValidating, mutate: mutateDetail } = useSWR<StudentDetailResponse>(
    cacheKey,
    async () => {
      if (!studentId) throw new Error('Student ID is required');

      if (useParallelFetching) {
        // 병렬 fetching (개별 API 호출)
        return fetchStudentDetailParallel(studentId);
      } else {
        // 단일 API 호출 (기존 방식)
        return fetchStudentDetail(`/api/students/${studentId}`);
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000, // 2초 내 동일 요청 중복 제거
      refreshInterval,
      errorRetryCount: 3,
    }
  );

  // ============================================
  // 파생 데이터 (Memoized)
  // ============================================

  /**
   * Vercel Best Practice: js-set-map-lookups
   * 과목별 성적을 O(1)로 조회하기 위한 Map 인덱스
   */
  const gradesBySubject = useMemo(() => {
    if (!data?.data?.grades) return new Map<string, GradeSummary>();
    return new Map(data.data.grades.map(grade => [grade.subject, grade]));
  }, [data?.data?.grades]);

  /**
   * 상담 기록을 상태별로 그룹화
   */
  const consultationsByStatus = useMemo(() => {
    if (!data?.data?.consultations) return new Map<string, Consultation[]>();

    const grouped = new Map<string, Consultation[]>();
    data.data.consultations.forEach(consultation => {
      const existing = grouped.get(consultation.status) || [];
      grouped.set(consultation.status, [...existing, consultation]);
    });
    return grouped;
  }, [data?.data?.consultations]);

  /**
   * 최근 출결 기록을 날짜별로 인덱싱
   */
  const attendanceByDate = useMemo(() => {
    if (!data?.data?.recentAttendance) return new Map<string, Attendance>();
    return new Map(data.data.recentAttendance.map(att => [att.date, att]));
  }, [data?.data?.recentAttendance]);

  // ============================================
  // 유틸리티 함수들
  // ============================================

  /**
   * 특정 과목의 성적 조회 (O(1))
   */
  const getGradeBySubject = useCallback((subject: string): GradeSummary | undefined => {
    return gradesBySubject.get(subject);
  }, [gradesBySubject]);

  /**
   * 특정 상태의 상담 목록 조회 (O(1))
   */
  const getConsultationsByStatus = useCallback((status: string): Consultation[] => {
    return consultationsByStatus.get(status) || [];
  }, [consultationsByStatus]);

  /**
   * 특정 날짜의 출결 조회 (O(1))
   */
  const getAttendanceByDate = useCallback((date: string): Attendance | undefined => {
    return attendanceByDate.get(date);
  }, [attendanceByDate]);

  /**
   * 예정된 상담 목록
   */
  const scheduledConsultations = useMemo(() => {
    return getConsultationsByStatus('scheduled');
  }, [getConsultationsByStatus]);

  /**
   * 완료된 상담 수
   */
  const completedConsultationsCount = useMemo(() => {
    return getConsultationsByStatus('completed').length;
  }, [getConsultationsByStatus]);

  // ============================================
  // Mutation 함수들
  // ============================================

  /**
   * 학생 정보 업데이트
   */
  const updateStudent = useCallback(async (updateData: UpdateStudentInput) => {
    if (!studentId) return { success: false, error: 'Student ID is required' };

    const response = await fetch(`/api/students/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();

    if (result.success) {
      // SWR 캐시 갱신
      await mutateDetail();
      // 학생 목록 캐시도 무효화
      await mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/students'));
    }

    return result;
  }, [studentId, mutateDetail]);

  /**
   * 캐시 수동 갱신
   */
  const refresh = useCallback(() => {
    return mutateDetail();
  }, [mutateDetail]);

  return {
    // 메인 데이터
    student: data?.data || null,

    // 개별 데이터 접근
    grades: data?.data?.grades || [],
    recentGrades: data?.data?.recentGrades || [],
    assignmentStats: data?.data?.assignmentStats,
    recentAssignments: data?.data?.recentAssignments || [],
    attendanceStats: data?.data?.attendanceStats,
    recentAttendance: data?.data?.recentAttendance || [],
    consultations: data?.data?.consultations || [],

    // 상태
    isLoading,
    isValidating,
    error: error?.message || data?.error || null,

    // 인덱스 Map
    gradesBySubject,
    consultationsByStatus,
    attendanceByDate,

    // 유틸리티 함수
    getGradeBySubject,
    getConsultationsByStatus,
    getAttendanceByDate,

    // 파생 데이터
    scheduledConsultations,
    completedConsultationsCount,

    // Mutation
    updateStudent,
    refresh,
  };
}

// ============================================
// 개별 데이터 조회 훅들 (더 세밀한 제어가 필요할 때)
// ============================================

/**
 * 학생 성적만 조회
 */
export function useStudentGrades(studentId: string | null) {
  const { data, error, isLoading } = useSWR<GradesResponse>(
    studentId ? `/api/students/${studentId}/grades` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  );

  return {
    grades: data?.data?.summary || [],
    recentGrades: data?.data?.grades || [],
    isLoading,
    error: error?.message || data?.error,
  };
}

/**
 * 학생 과제만 조회
 */
export function useStudentAssignments(studentId: string | null) {
  const { data, error, isLoading } = useSWR<AssignmentsResponse>(
    studentId ? `/api/students/${studentId}/assignments` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  );

  return {
    assignments: data?.data?.assignments || [],
    stats: data?.data?.stats,
    isLoading,
    error: error?.message || data?.error,
  };
}

/**
 * 학생 출결만 조회
 */
export function useStudentAttendance(studentId: string | null) {
  const { data, error, isLoading } = useSWR<AttendanceResponse>(
    studentId ? `/api/students/${studentId}/attendance` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  );

  return {
    attendance: data?.data?.attendance || [],
    stats: data?.data?.stats,
    isLoading,
    error: error?.message || data?.error,
  };
}

/**
 * 학생 상담만 조회
 */
export function useStudentConsultations(studentId: string | null) {
  const { data, error, isLoading } = useSWR<ConsultationsResponse>(
    studentId ? `/api/students/${studentId}/consultations` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  );

  return {
    consultations: data?.data || [],
    isLoading,
    error: error?.message || data?.error,
  };
}

// ============================================
// Preload 함수 (탭 hover 시 prefetch용)
// ============================================

/**
 * Vercel Best Practice: bundle-preload
 * 탭 hover 시 해당 탭의 데이터를 미리 로드
 */
export function preloadStudentData(studentId: string, dataType: 'grades' | 'assignments' | 'attendance' | 'consultations') {
  if (typeof window === 'undefined') return;

  const url = `/api/students/${studentId}/${dataType}`;

  // SWR의 preload 기능 활용
  mutate(url, fetcher(url), { revalidate: false });
}

/**
 * 모든 학생 데이터 prefetch
 */
export function preloadAllStudentData(studentId: string) {
  if (typeof window === 'undefined') return;

  // 모든 데이터를 병렬로 prefetch
  Promise.all([
    preloadStudentData(studentId, 'grades'),
    preloadStudentData(studentId, 'assignments'),
    preloadStudentData(studentId, 'attendance'),
    preloadStudentData(studentId, 'consultations'),
  ]);
}
