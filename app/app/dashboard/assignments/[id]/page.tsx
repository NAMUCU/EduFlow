'use client';

/**
 * EduFlow 과제 상세 페이지
 *
 * Vercel Best Practices 적용:
 * - async-parallel: Promise.all로 과제 정보, 제출물, 채점 결과 병렬 fetching
 * - bundle-dynamic-imports: next/dynamic으로 채점 UI, 차트 컴포넌트 lazy loading
 * - client-swr-dedup: SWR로 클라이언트 캐싱
 * - rerender-memo: React.memo로 불필요한 리렌더 방지
 * - rendering-content-visibility: 제출물 리스트에 content-visibility 적용
 */

import { useState, useCallback, memo, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import {
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from 'lucide-react';
import {
  StudentAssignmentDetail,
  formatDateTime,
  getRemainingTime,
  getStatusColorClass,
} from '@/types/assignment';
import {
  ASSIGNMENT_STATUS_LABELS,
  AssignmentStatus,
} from '@/types/database';
import { useAssignmentDetailData } from '@/hooks/useAssignmentDetail';

// ============================================
// bundle-dynamic-imports: 채점 UI와 차트 컴포넌트 lazy loading
// 이 컴포넌트들은 초기 렌더링에 필요하지 않으므로 동적 임포트
// ============================================

// 채점 모달 컴포넌트 (사용 시에만 로드)
const GradingModal = dynamic(
  () => import('./grading-modal').then((m) => m.GradingModal).catch(() => {
    // 컴포넌트가 없을 경우 placeholder 반환
    const Placeholder = () => <div className="p-4 text-center">채점 UI 준비 중...</div>;
    Placeholder.displayName = 'GradingModalPlaceholder';
    return Placeholder;
  }),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">채점 UI 로딩 중...</p>
        </div>
      </div>
    ),
  }
);

// 통계 차트 컴포넌트 (사용 시에만 로드)
const StatisticsChart = dynamic(
  () => import('@/components/charts/StatisticsChart').then((m) => m.StatisticsChart).catch(() => {
    // 컴포넌트가 없을 경우 placeholder 반환
    const Placeholder = () => null;
    Placeholder.displayName = 'StatisticsChartPlaceholder';
    return Placeholder;
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
    ),
  }
);

// ============================================
// 타입 정의
// ============================================

interface PageProps {
  params: { id: string };
}

// ============================================
// rerender-memo: 메모이즈된 서브 컴포넌트들
// ============================================

/**
 * 정보 카드 컴포넌트 - memo로 불필요한 리렌더 방지
 */
const InfoCard = memo(function InfoCard({
  icon,
  iconBgColor,
  iconColor,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  label: string;
  value: string | number;
  subValue?: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {subValue}
        </div>
      </div>
    </div>
  );
});

/**
 * 진행 현황 통계 컴포넌트 - memo로 불필요한 리렌더 방지
 */
const ProgressStatistics = memo(function ProgressStatistics({
  statistics,
}: {
  statistics: {
    not_started_count: number;
    in_progress_count: number;
    submitted_count: number;
    graded_count: number;
    average_score: number | null;
    highest_score: number | null;
    lowest_score: number | null;
  };
}) {
  return (
    <div className="card mb-6">
      <h3 className="font-bold text-gray-900 mb-4">진행 현황</h3>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <p className="text-2xl font-bold text-gray-500">
            {statistics.not_started_count}
          </p>
          <p className="text-sm text-gray-500">미시작</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <p className="text-2xl font-bold text-blue-600">
            {statistics.in_progress_count}
          </p>
          <p className="text-sm text-blue-600">진행 중</p>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-xl">
          <p className="text-2xl font-bold text-orange-600">
            {statistics.submitted_count}
          </p>
          <p className="text-sm text-orange-600">제출 완료</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-xl">
          <p className="text-2xl font-bold text-green-600">
            {statistics.graded_count}
          </p>
          <p className="text-sm text-green-600">채점 완료</p>
        </div>
      </div>

      {statistics.average_score !== null && (
        <div className="mt-4 pt-4 border-t flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">평균 점수</p>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.average_score}점
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">최고 점수</p>
            <p className="text-2xl font-bold text-green-600">
              {statistics.highest_score}점
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">최저 점수</p>
            <p className="text-2xl font-bold text-red-600">
              {statistics.lowest_score}점
            </p>
          </div>
        </div>
      )}

      {/* bundle-dynamic-imports: 차트는 동적 로딩 */}
      <div className="mt-4">
        <StatisticsChart
          data={[
            { label: '미시작', value: statistics.not_started_count, color: '#9CA3AF' },
            { label: '진행 중', value: statistics.in_progress_count, color: '#3B82F6' },
            { label: '제출 완료', value: statistics.submitted_count, color: '#F97316' },
            { label: '채점 완료', value: statistics.graded_count, color: '#22C55E' },
          ]}
        />
      </div>
    </div>
  );
});

/**
 * 탭 버튼 컴포넌트 - memo로 불필요한 리렌더 방지
 */
const TabButton = memo(function TabButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
        isActive
          ? 'border-primary-500 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
});

/**
 * 상태 필터 버튼 컴포넌트 - memo로 불필요한 리렌더 방지
 */
const StatusFilterButton = memo(function StatusFilterButton({
  status,
  label,
  count,
  isSelected,
  onClick,
}: {
  status: AssignmentStatus | 'all';
  label: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        isSelected
          ? 'bg-primary-100 text-primary-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
      <span className="ml-1">({count})</span>
    </button>
  );
});

/**
 * 학생별 과제 행 컴포넌트 - memo로 불필요한 리렌더 방지
 * rendering-content-visibility: CSS에서 content-visibility 적용됨
 */
const StudentAssignmentRow = memo(function StudentAssignmentRow({
  studentAssignment,
  isExpanded,
  onToggle,
  onGrade,
}: {
  studentAssignment: StudentAssignmentDetail;
  isExpanded: boolean;
  onToggle: () => void;
  onGrade?: (studentAssignment: StudentAssignmentDetail) => void;
}) {
  const sa = studentAssignment;

  return (
    // rendering-content-visibility: student-assignment-row 클래스에 content-visibility 적용
    <div className="student-assignment-row">
      <div
        onClick={onToggle}
        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-medium">
                {sa.student.user.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{sa.student.user.name}</p>
              <p className="text-sm text-gray-500">
                {sa.student.grade} | {sa.student.school_name} {sa.student.class_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* 진행률 */}
            <div className="text-right">
              <p className="text-sm text-gray-500">진행률</p>
              <p className="font-medium text-gray-900">{sa.progress_percentage}%</p>
            </div>

            {/* 점수 */}
            <div className="text-right w-16">
              <p className="text-sm text-gray-500">점수</p>
              <p className="font-medium text-gray-900">
                {sa.score !== null ? `${sa.score}점` : '-'}
              </p>
            </div>

            {/* 상태 */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColorClass(sa.status)}`}>
              {ASSIGNMENT_STATUS_LABELS[sa.status]}
            </div>

            {/* 확장 아이콘 */}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* 확장된 상세 정보 */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="ml-14 p-4 bg-gray-50 rounded-xl">
            {/* 시간 정보 */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-500">시작 시간</p>
                <p className="font-medium">
                  {sa.started_at ? formatDateTime(sa.started_at) : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">제출 시간</p>
                <p className="font-medium">
                  {sa.submitted_at ? formatDateTime(sa.submitted_at) : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">채점 시간</p>
                <p className="font-medium">
                  {sa.graded_at ? formatDateTime(sa.graded_at) : '-'}
                </p>
              </div>
            </div>

            {/* 답안 정보 */}
            {sa.answers && sa.answers.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  답안 ({sa.correct_count}/{sa.total_count} 정답)
                </p>
                <div className="space-y-2">
                  {sa.answers.map((answer, index) => (
                    <div
                      key={answer.problem_id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs">
                        {index + 1}
                      </span>
                      <span className="flex-1 truncate">{answer.answer}</span>
                      {answer.is_correct === true && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                      {answer.is_correct === false && (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      {answer.is_correct === null && (
                        <span className="text-xs text-gray-400">미채점</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 피드백 */}
            {sa.feedback && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  피드백
                </p>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                  {sa.feedback}
                </p>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-2 mt-4 pt-4 border-t">
              {sa.status === 'submitted' && onGrade && (
                <button
                  onClick={() => onGrade(sa)}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  채점하기
                </button>
              )}
              <button className="btn-secondary text-sm flex items-center gap-1">
                <Eye className="w-4 h-4" />
                답안 상세 보기
              </button>
              <button className="btn-secondary text-sm flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                피드백 작성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * 문제 목록 아이템 컴포넌트 - memo로 불필요한 리렌더 방지
 */
const ProblemItem = memo(function ProblemItem({
  problem,
  index,
}: {
  problem: {
    id: string;
    question: string;
    points: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  index: number;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-gray-600">{index + 1}</span>
        </div>
        <div className="flex-1">
          <p className="text-gray-900 whitespace-pre-wrap">{problem.question}</p>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              배점: <span className="font-medium">{Math.round(problem.points)}점</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                problem.difficulty === 'easy'
                  ? 'bg-green-100 text-green-700'
                  : problem.difficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {problem.difficulty === 'easy'
                ? '쉬움'
                : problem.difficulty === 'medium'
                ? '보통'
                : '어려움'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 메인 페이지 컴포넌트
// ============================================

export default function AssignmentDetailPage({ params }: PageProps) {
  const { id } = params;

  // client-swr-dedup: SWR 훅으로 데이터 캐싱 및 중복 요청 방지
  // async-parallel: useAssignmentDetailData 내부에서 Promise.all로 병렬 fetching
  const {
    assignment,
    submissions,
    isLoading,
    error,
    refreshAll,
  } = useAssignmentDetailData(id);

  const [activeTab, setActiveTab] = useState<'students' | 'problems'>('students');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AssignmentStatus | 'all'>('all');
  const [gradingTarget, setGradingTarget] = useState<StudentAssignmentDetail | null>(null);

  // 학생별 과제 필터링 - useMemo로 최적화
  const filteredStudentAssignments = useMemo(() => {
    const studentAssignments = submissions.length > 0
      ? submissions
      : (assignment?.student_assignments || []);

    if (selectedStatus === 'all') return studentAssignments;
    return studentAssignments.filter((sa) => sa.status === selectedStatus);
  }, [submissions, assignment?.student_assignments, selectedStatus]);

  // 상태별 개수 계산 - useMemo로 최적화
  const statusCounts = useMemo(() => {
    const studentAssignments = submissions.length > 0
      ? submissions
      : (assignment?.student_assignments || []);

    return {
      all: studentAssignments.length,
      not_started: studentAssignments.filter((sa) => sa.status === 'not_started').length,
      in_progress: studentAssignments.filter((sa) => sa.status === 'in_progress').length,
      submitted: studentAssignments.filter((sa) => sa.status === 'submitted').length,
      graded: studentAssignments.filter((sa) => sa.status === 'graded').length,
    };
  }, [submissions, assignment?.student_assignments]);

  // 콜백 함수들 - useCallback으로 최적화
  const handleToggleStudent = useCallback((studentId: string) => {
    setExpandedStudentId((prev) => (prev === studentId ? null : studentId));
  }, []);

  const handleStatusFilter = useCallback((status: AssignmentStatus | 'all') => {
    setSelectedStatus(status);
  }, []);

  const handleGrade = useCallback((studentAssignment: StudentAssignmentDetail) => {
    setGradingTarget(studentAssignment);
  }, []);

  const handleCloseGrading = useCallback(() => {
    setGradingTarget(null);
  }, []);

  const handleGradingComplete = useCallback(() => {
    setGradingTarget(null);
    refreshAll();
  }, [refreshAll]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">과제 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error || '과제를 찾을 수 없습니다.'}</p>
          <Link href="/dashboard/assignments" className="text-primary-600 hover:underline">
            과제 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={assignment.title}
        subtitle={assignment.description || '과제 상세 정보'}
      />

      <div className="p-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard/assignments"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            과제 목록으로
          </Link>

          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Edit className="w-4 h-4" />
              수정
            </button>
            <button className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
          </div>
        </div>

        {/* 과제 정보 카드 - rerender-memo: 메모이즈된 컴포넌트 사용 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <InfoCard
            icon={<FileText className="w-5 h-5" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            label="문제 수"
            value={`${assignment.problems_detail.length}개`}
          />
          <InfoCard
            icon={<Users className="w-5 h-5" />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            label="배정 학생"
            value={`${assignment.statistics.total_students}명`}
          />
          <InfoCard
            icon={<BarChart3 className="w-5 h-5" />}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            label="완료율"
            value={`${assignment.statistics.completion_rate}%`}
          />
          <InfoCard
            icon={<Calendar className="w-5 h-5" />}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            label="마감일"
            value={assignment.due_date ? formatDateTime(assignment.due_date) : '없음'}
            subValue={
              assignment.due_date && assignment.is_active ? (
                <p className="text-xs text-orange-600">
                  {getRemainingTime(assignment.due_date)}
                </p>
              ) : undefined
            }
          />
        </div>

        {/* 통계 상세 - rerender-memo: 메모이즈된 컴포넌트 사용 */}
        <ProgressStatistics statistics={assignment.statistics} />

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="border-b">
            <div className="flex">
              <TabButton
                isActive={activeTab === 'students'}
                onClick={() => setActiveTab('students')}
              >
                학생별 현황
              </TabButton>
              <TabButton
                isActive={activeTab === 'problems'}
                onClick={() => setActiveTab('problems')}
              >
                문제 목록
              </TabButton>
            </div>
          </div>

          {/* 학생별 현황 탭 */}
          {activeTab === 'students' && (
            <div>
              {/* 필터 */}
              <div className="p-4 border-b flex items-center gap-2">
                <span className="text-sm text-gray-500">상태:</span>
                {(['all', 'not_started', 'in_progress', 'submitted', 'graded'] as const).map(
                  (status) => (
                    <StatusFilterButton
                      key={status}
                      status={status}
                      label={status === 'all' ? '전체' : ASSIGNMENT_STATUS_LABELS[status]}
                      count={statusCounts[status]}
                      isSelected={selectedStatus === status}
                      onClick={() => handleStatusFilter(status)}
                    />
                  )
                )}
              </div>

              {/* 학생 목록 - rendering-content-visibility 적용 */}
              <div className="divide-y">
                {filteredStudentAssignments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    해당 상태의 학생이 없습니다.
                  </div>
                ) : (
                  filteredStudentAssignments.map((sa) => (
                    <StudentAssignmentRow
                      key={sa.id}
                      studentAssignment={sa}
                      isExpanded={expandedStudentId === sa.id}
                      onToggle={() => handleToggleStudent(sa.id)}
                      onGrade={handleGrade}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* 문제 목록 탭 */}
          {activeTab === 'problems' && (
            <div className="divide-y">
              {assignment.problems_detail.map((problem, index) => (
                <ProblemItem key={problem.id} problem={problem} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* bundle-dynamic-imports: 채점 모달은 동적 로딩 */}
      {gradingTarget && (
        <GradingModal
          studentAssignment={gradingTarget}
          onClose={handleCloseGrading}
          onComplete={handleGradingComplete}
        />
      )}
    </div>
  );
}
