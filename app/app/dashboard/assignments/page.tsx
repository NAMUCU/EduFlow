'use client';

import { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  FileText,
  Clock,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// bundle-dynamic-imports 규칙: 모달은 조건부 렌더링이므로 dynamic import
const AssignmentCreator = dynamic(
  () => import('@/components/AssignmentCreator'),
  { ssr: false }
);

import {
  AssignmentListItem,
  AssignmentTab,
  ASSIGNMENT_TAB_LABELS,
  AssignmentFormState,
  getRemainingTime,
  formatDateTime,
} from '@/types/assignment';
import { Problem, Student, User } from '@/types/database';

// client-swr-dedup 규칙: SWR 훅으로 과제 목록 캐싱
import { useAssignmentsTeacher } from '@/hooks/useAssignmentsTeacher';

// 탭 목록
const TABS: AssignmentTab[] = ['in_progress', 'scheduled', 'completed'];

// 샘플 문제 데이터 (API에서 가져올 예정)
const MOCK_PROBLEMS: Problem[] = [
  {
    id: 'math-m1-unit1-001',
    subject: '수학',
    grade: '중1',
    unit: '정수와 유리수',
    question: '다음 중 음수를 모두 고르시오.\n\n-5, 0, +3, -2.5, +7, -1/2',
    answer: '-5, -2.5, -1/2',
    solution: '음수는 0보다 작은 수입니다.',
    difficulty: 'easy',
    type: 'short_answer',
    options: null,
    image_url: null,
    tags: ['음수', '정수'],
    academy_id: 'academy-001',
    created_by: 'teacher-001',
    is_public: true,
    ai_generated: false,
    created_at: '2025-01-15T09:00:00Z',
    updated_at: '2025-01-15T09:00:00Z',
  },
  {
    id: 'math-m1-unit1-002',
    subject: '수학',
    grade: '중1',
    unit: '정수와 유리수',
    question: '(-3) + (-7) - (-5)를 계산하시오.',
    answer: '-5',
    solution: '정수의 덧셈과 뺄셈 규칙을 적용합니다.',
    difficulty: 'medium',
    type: 'short_answer',
    options: null,
    image_url: null,
    tags: ['정수', '계산'],
    academy_id: 'academy-001',
    created_by: 'teacher-001',
    is_public: true,
    ai_generated: false,
    created_at: '2025-01-15T09:00:00Z',
    updated_at: '2025-01-15T09:00:00Z',
  },
  {
    id: 'math-m1-unit1-003',
    subject: '수학',
    grade: '중1',
    unit: '정수와 유리수',
    question: '어떤 잠수함이 해수면에서 출발하여 120m를 잠수한 후, 다시 45m를 상승했습니다.',
    answer: '-75m',
    solution: '해수면을 기준(0)으로 하여 아래를 음수로 표현합니다.',
    difficulty: 'medium',
    type: 'short_answer',
    options: null,
    image_url: null,
    tags: ['실생활', '정수'],
    academy_id: 'academy-001',
    created_by: 'teacher-001',
    is_public: true,
    ai_generated: false,
    created_at: '2025-01-15T09:00:00Z',
    updated_at: '2025-01-15T09:00:00Z',
  },
];

// 샘플 학생 데이터
const MOCK_STUDENTS: (Student & { user: User })[] = [
  {
    id: 'student-001',
    user_id: 'user-s001',
    academy_id: 'academy-001',
    grade: '중1',
    parent_id: null,
    school_name: '서울중학교',
    class_name: 'A반',
    memo: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    user: {
      id: 'user-s001',
      email: 'minjun@example.com',
      name: '김민준',
      role: 'student',
      phone: null,
      profile_image: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  },
  {
    id: 'student-002',
    user_id: 'user-s002',
    academy_id: 'academy-001',
    grade: '중1',
    parent_id: null,
    school_name: '서울중학교',
    class_name: 'A반',
    memo: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    user: {
      id: 'user-s002',
      email: 'seoyeon@example.com',
      name: '이서연',
      role: 'student',
      phone: null,
      profile_image: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  },
  {
    id: 'student-003',
    user_id: 'user-s003',
    academy_id: 'academy-001',
    grade: '중1',
    parent_id: null,
    school_name: '강남중학교',
    class_name: 'A반',
    memo: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    user: {
      id: 'user-s003',
      email: 'junhyuk@example.com',
      name: '박준혁',
      role: 'student',
      phone: null,
      profile_image: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  },
  {
    id: 'student-004',
    user_id: 'user-s004',
    academy_id: 'academy-001',
    grade: '중1',
    parent_id: null,
    school_name: '강남중학교',
    class_name: 'B반',
    memo: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    user: {
      id: 'user-s004',
      email: 'sua@example.com',
      name: '최수아',
      role: 'student',
      phone: null,
      profile_image: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  },
];

// 샘플 반 데이터
const MOCK_CLASSES = [
  { id: 'class-001', name: '중1 A반', student_ids: ['student-001', 'student-002', 'student-003'] },
  { id: 'class-002', name: '중1 B반', student_ids: ['student-004'] },
];

// ============================================
// rerender-memo 규칙: 과제 카드 컴포넌트 메모이제이션
// ============================================

interface AssignmentCardProps {
  assignment: AssignmentListItem;
  openMenuId: string | null;
  onMenuToggle: (id: string | null) => void;
  onDelete: (id: string) => void;
  onPreload: (id: string) => void;
}

const AssignmentCard = memo(function AssignmentCard({
  assignment,
  openMenuId,
  onMenuToggle,
  onDelete,
  onPreload,
}: AssignmentCardProps) {
  const isMenuOpen = openMenuId === assignment.id;

  // bundle-preload 규칙: hover 시 상세 페이지 프리로드
  const handleMouseEnter = () => {
    onPreload(assignment.id);
  };

  return (
    <div
      className="p-4 hover:bg-gray-50 transition-colors"
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/assignments/${assignment.id}`}
              className="text-lg font-medium text-gray-900 hover:text-primary-600"
            >
              {assignment.title}
            </Link>
            {/* rendering-conditional-render 규칙: 삼항 연산자 사용 */}
            {assignment.status === 'completed' ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                <CheckCircle className="w-3 h-3" />
                완료
              </span>
            ) : null}
          </div>

          {/* rendering-conditional-render 규칙: description 체크 */}
          {assignment.description ? (
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
              {assignment.description}
            </p>
          ) : null}

          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {assignment.problem_count}문제
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {assignment.completed_count}/{assignment.student_count}명 완료
            </span>
            {/* rendering-conditional-render 규칙: due_date 체크 */}
            {assignment.due_date ? (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDateTime(assignment.due_date)}
              </span>
            ) : null}
            {/* rendering-conditional-render 규칙: 조건부 렌더링 */}
            {assignment.status === 'in_progress' && assignment.due_date ? (
              <span
                className={`flex items-center gap-1 ${
                  getRemainingTime(assignment.due_date).includes('시간') ||
                  getRemainingTime(assignment.due_date).includes('분')
                    ? 'text-orange-600'
                    : ''
                }`}
              >
                <Clock className="w-4 h-4" />
                {getRemainingTime(assignment.due_date)}
              </span>
            ) : null}
          </div>

          {/* 진행률 바 */}
          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  assignment.student_count > 0 &&
                  assignment.completed_count === assignment.student_count
                    ? 'bg-green-500'
                    : 'bg-primary-500'
                }`}
                style={{
                  width: `${
                    assignment.student_count > 0
                      ? (assignment.completed_count / assignment.student_count) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Link
            href={`/dashboard/assignments/${assignment.id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onMouseEnter={handleMouseEnter}
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          {/* 더보기 메뉴 */}
          <div className="relative">
            <button
              onClick={() => onMenuToggle(isMenuOpen ? null : assignment.id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>

            {/* rendering-conditional-render 규칙: 메뉴 표시 */}
            {isMenuOpen ? (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => onMenuToggle(null)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <Link
                    href={`/dashboard/assignments/${assignment.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => onMenuToggle(null)}
                  >
                    <Eye className="w-4 h-4" />
                    상세 보기
                  </Link>
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                    onClick={() => onMenuToggle(null)}
                  >
                    <Edit className="w-4 h-4" />
                    수정
                  </button>
                  <button
                    onClick={() => onDelete(assignment.id)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 메인 페이지 컴포넌트
// ============================================

export default function AssignmentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AssignmentTab>('in_progress');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // client-swr-dedup + async-parallel 규칙: SWR 훅으로 데이터 병렬 로딩
  const {
    assignments,
    allAssignments,
    tabCounts,
    averageCompletionRate,
    isLoading,
    isValidating,
    error,
    refresh,
    mutateFiltered,
    mutateAll,
  } = useAssignmentsTeacher({
    filter: {
      status: activeTab,
      search: searchQuery,
    },
  });

  // bundle-preload 규칙: 과제 상세 페이지 프리로드
  const handlePreloadAssignment = useCallback((assignmentId: string) => {
    if (typeof window !== 'undefined') {
      // Next.js 상세 페이지 프리로드
      router.prefetch(`/dashboard/assignments/${assignmentId}`);
    }
  }, [router]);

  // 과제 생성
  const handleCreateAssignment = async (formData: AssignmentFormState['data']) => {
    const dueDateTime = formData.dueDate
      ? `${formData.dueDate}T${formData.dueTime}:00Z`
      : null;

    const response = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        problems: formData.selectedProblems.map((p) => p.id),
        student_ids: formData.selectedStudents.map((s) => s.id),
        due_date: dueDateTime,
        time_limit: formData.timeLimit,
        academy_id: 'academy-001',
        teacher_id: 'teacher-001',
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    // async-parallel 규칙: 목록 병렬 새로고침
    await Promise.all([mutateFiltered(), mutateAll()]);
  };

  // 과제 삭제
  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('이 과제를 삭제하시겠습니까? 학생들의 제출 내역도 함께 삭제됩니다.')) {
      return;
    }

    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // async-parallel 규칙: 목록 병렬 새로고침
        await Promise.all([mutateFiltered(), mutateAll()]);
      } else {
        alert(data.error || '과제 삭제에 실패했습니다.');
      }
    } catch {
      alert('과제 삭제에 실패했습니다.');
    }

    setOpenMenuId(null);
  };

  // 메뉴 토글
  const handleMenuToggle = useCallback((id: string | null) => {
    setOpenMenuId(id);
  }, []);

  return (
    <div>
      <Header
        title="과제 관리"
        subtitle="학생들에게 과제를 배정하고 진행 상황을 확인합니다"
      />

      <div className="p-8">
        {/* 상단 통계 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 과제</p>
              <p className="text-2xl font-bold text-gray-900">{allAssignments.length}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">진행중</p>
              <p className="text-2xl font-bold text-gray-900">
                {tabCounts.in_progress}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">완료</p>
              <p className="text-2xl font-bold text-gray-900">
                {tabCounts.completed}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">평균 제출률</p>
              <p className="text-2xl font-bold text-gray-900">{averageCompletionRate}%</p>
            </div>
          </div>
        </div>

        {/* 탭 & 검색 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="p-4 border-b flex items-center justify-between">
            {/* 탭 */}
            <div className="flex gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {ASSIGNMENT_TAB_LABELS[tab]}
                  <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs">
                    {tabCounts[tab]}
                  </span>
                </button>
              ))}
            </div>

            {/* 검색 & 필터 & 새 과제 버튼 */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="과제 검색..."
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                />
              </div>
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={refresh}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${isValidating ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsCreatorOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>새 과제 배포</span>
              </button>
            </div>
          </div>

          {/* 과제 목록 - rendering-conditional-render 규칙: 삼항 연산자 사용 */}
          <div className="divide-y">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500">과제를 불러오는 중...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <p className="text-red-500">{error}</p>
                <button
                  onClick={refresh}
                  className="mt-4 px-4 py-2 text-sm text-primary-600 hover:underline"
                >
                  다시 시도
                </button>
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">
                  {activeTab === 'in_progress'
                    ? '진행 중인 과제가 없습니다.'
                    : activeTab === 'scheduled'
                    ? '예정된 과제가 없습니다.'
                    : '완료된 과제가 없습니다.'}
                </p>
                <button
                  onClick={() => setIsCreatorOpen(true)}
                  className="text-primary-600 hover:underline text-sm"
                >
                  새 과제 만들기
                </button>
              </div>
            ) : (
              // rerender-memo 규칙: 메모이제이션된 카드 컴포넌트 사용
              assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  openMenuId={openMenuId}
                  onMenuToggle={handleMenuToggle}
                  onDelete={handleDeleteAssignment}
                  onPreload={handlePreloadAssignment}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 과제 생성 모달 */}
      <AssignmentCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onSubmit={handleCreateAssignment}
        availableProblems={MOCK_PROBLEMS}
        availableStudents={MOCK_STUDENTS}
        availableClasses={MOCK_CLASSES}
      />
    </div>
  );
}
