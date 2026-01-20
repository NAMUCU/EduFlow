'use client';

/**
 * EduFlow 시험 관리 페이지
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: useExams 훅으로 시험 목록 캐싱
 * - rerender-memo: ExamCard 메모이제이션
 * - async-parallel: 시험+성적 데이터 병렬 로딩 (useExams 훅 내부)
 * - bundle-preload: 시험 상세 페이지 프리로드
 * - bundle-dynamic-imports: 성적 차트 lazy load
 */

import { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { useExams, preloadExamDetail } from '@/hooks/useExams';
import {
  Plus,
  Search,
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
  ClipboardList,
  Trophy,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  ExamListItem,
  ExamTab,
  EXAM_TAB_LABELS,
  EXAM_TYPE_LABELS,
  EXAM_STATUS_LABELS,
  getExamStatusColorClass,
  formatExamDateTime,
  getRemainingTimeToExam,
} from '@/types/exam';

// ============================================
// bundle-dynamic-imports: 성적 차트 lazy load
// 차트 컴포넌트는 초기 로딩에 필요하지 않으므로 동적 임포트
// ============================================
const ScoreDistributionChart = dynamic(
  () => import('@/components/charts/ScoreDistributionChart').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-400 text-sm">차트 로딩중...</span>
      </div>
    ),
  }
);

// 탭 목록
const TABS: ExamTab[] = ['scheduled', 'in_progress', 'completed'];

// ============================================
// rerender-memo: 통계 카드 메모이제이션
// ============================================
interface StatCardProps {
  icon: React.ReactNode;
  iconBgClass: string;
  label: string;
  value: string | number;
}

const StatCard = memo(function StatCard({
  icon,
  iconBgClass,
  label,
  value,
}: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 ${iconBgClass} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
});

// ============================================
// rerender-memo: 시험 카드 메모이제이션
// props가 변경되지 않으면 리렌더링 방지
// ============================================
interface ExamCardProps {
  exam: ExamListItem;
  openMenuId: string | null;
  onMenuToggle: (id: string | null) => void;
  onDelete: (id: string) => void;
}

const ExamCard = memo(function ExamCard({
  exam,
  openMenuId,
  onMenuToggle,
  onDelete,
}: ExamCardProps) {
  const colorClass = getExamStatusColorClass(exam.status);
  const isMenuOpen = openMenuId === exam.id;

  // 상태 배지 렌더링
  const StatusBadge = (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${colorClass}`}>
      {exam.status === 'completed' && <CheckCircle className="w-3 h-3" />}
      {exam.status === 'in_progress' && <Clock className="w-3 h-3" />}
      {exam.status === 'scheduled' && <Calendar className="w-3 h-3" />}
      {exam.status === 'cancelled' && <AlertCircle className="w-3 h-3" />}
      {EXAM_STATUS_LABELS[exam.status]}
    </span>
  );

  // 진행률 계산
  const progressPercent =
    exam.student_count > 0
      ? (exam.completed_count / exam.student_count) * 100
      : 0;

  const isComplete =
    exam.student_count > 0 && exam.completed_count === exam.student_count;

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            {/* bundle-preload: hover/focus 시 상세 페이지 프리로드 */}
            <Link
              href={`/dashboard/exams/${exam.id}`}
              className="text-lg font-medium text-gray-900 hover:text-primary-600"
              onMouseEnter={() => preloadExamDetail(exam.id)}
              onFocus={() => preloadExamDetail(exam.id)}
            >
              {exam.title}
            </Link>
            {StatusBadge}
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
              {EXAM_TYPE_LABELS[exam.exam_type]}
            </span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
              {exam.subject}
            </span>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs">
              {exam.grade}
            </span>
          </div>

          {exam.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
              {exam.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {exam.problem_count}문제
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              {exam.total_points}점 만점
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {exam.completed_count}/{exam.student_count}명 완료
            </span>
            {exam.time_limit && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {exam.time_limit}분 제한
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatExamDateTime(exam.start_date)}
            </span>
            {exam.status === 'scheduled' && (
              <span className="flex items-center gap-1 text-blue-600">
                <Clock className="w-4 h-4" />
                {getRemainingTimeToExam(exam.start_date)}
              </span>
            )}
            {exam.average_score !== null && (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <Trophy className="w-4 h-4" />
                평균 {exam.average_score}점
              </span>
            )}
          </div>

          {/* 진행률 바 */}
          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isComplete ? 'bg-green-500' : 'bg-primary-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {/* bundle-preload: 화살표 버튼에도 프리로드 적용 */}
          <Link
            href={`/dashboard/exams/${exam.id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onMouseEnter={() => preloadExamDetail(exam.id)}
            onFocus={() => preloadExamDetail(exam.id)}
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          {/* 더보기 메뉴 */}
          <div className="relative">
            <button
              onClick={() => onMenuToggle(isMenuOpen ? null : exam.id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => onMenuToggle(null)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <Link
                    href={`/dashboard/exams/${exam.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => onMenuToggle(null)}
                    onMouseEnter={() => preloadExamDetail(exam.id)}
                  >
                    <Eye className="w-4 h-4" />
                    상세 보기
                  </Link>
                  {exam.status === 'scheduled' && (
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                      onClick={() => {
                        onMenuToggle(null);
                        alert('수정 기능은 준비 중입니다.');
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      수정
                    </button>
                  )}
                  {exam.status !== 'in_progress' && (
                    <button
                      onClick={() => onDelete(exam.id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 메인 페이지 컴포넌트
// ============================================
export default function ExamsPage() {
  // 필터 상태
  const [activeTab, setActiveTab] = useState<ExamTab>('scheduled');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // client-swr-dedup + async-parallel: useExams 훅 사용
  const {
    exams,
    allExams,
    tabCounts,
    statistics,
    isLoading,
    isValidating,
    error,
    refresh,
  } = useExams({
    filter: {
      status: activeTab,
      subject: selectedSubject || undefined,
      grade: selectedGrade || undefined,
      search: searchQuery || undefined,
    },
  });

  // 시험 삭제 핸들러
  const handleDeleteExam = useCallback(
    async (id: string) => {
      if (!confirm('이 시험을 삭제하시겠습니까? 학생들의 응시 내역도 함께 삭제됩니다.')) {
        return;
      }

      try {
        const response = await fetch(`/api/exams/${id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          refresh();
        } else {
          alert(data.error || '시험 삭제에 실패했습니다.');
        }
      } catch {
        alert('시험 삭제에 실패했습니다.');
      }

      setOpenMenuId(null);
    },
    [refresh]
  );

  // 메뉴 토글 핸들러
  const handleMenuToggle = useCallback((id: string | null) => {
    setOpenMenuId(id);
  }, []);

  // 평균 점수 계산
  const averageScore = statistics.average_score;

  // 전체 응시자 수
  const totalStudents = statistics.total_students;

  return (
    <div>
      <Header
        title="시험 관리"
        subtitle="시험을 생성하고 학생들의 성적을 확인합니다"
      />

      <div className="p-8">
        {/* 상단 통계 - rerender-memo 적용 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<ClipboardList className="w-6 h-6 text-blue-600" />}
            iconBgClass="bg-blue-100"
            label="전체 시험"
            value={allExams.length}
          />
          <StatCard
            icon={<Target className="w-6 h-6 text-yellow-600" />}
            iconBgClass="bg-yellow-100"
            label="예정/진행중"
            value={tabCounts.scheduled + tabCounts.in_progress}
          />
          <StatCard
            icon={<Trophy className="w-6 h-6 text-green-600" />}
            iconBgClass="bg-green-100"
            label="평균 점수"
            value={averageScore !== null ? `${averageScore}점` : '-'}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            iconBgClass="bg-purple-100"
            label="총 응시자"
            value={`${totalStudents}명`}
          />
        </div>

        {/* 탭 & 검색 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
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
                  {EXAM_TAB_LABELS[tab]}
                  <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs">
                    {tabCounts[tab]}
                  </span>
                </button>
              ))}
            </div>

            {/* 검색 & 필터 & 새 시험 버튼 */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="시험 검색..."
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
                />
              </div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">과목 전체</option>
                <option value="수학">수학</option>
                <option value="영어">영어</option>
                <option value="국어">국어</option>
                <option value="과학">과학</option>
              </select>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">학년 전체</option>
                <option value="중1">중1</option>
                <option value="중2">중2</option>
                <option value="중3">중3</option>
                <option value="고1">고1</option>
                <option value="고2">고2</option>
                <option value="고3">고3</option>
              </select>
              <button
                onClick={refresh}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                disabled={isValidating}
              >
                <RefreshCw
                  className={`w-4 h-4 text-gray-500 ${isValidating ? 'animate-spin' : ''}`}
                />
              </button>
              <button
                onClick={() => alert('시험 생성 기능은 준비 중입니다.')}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>새 시험</span>
              </button>
            </div>
          </div>

          {/* 시험 목록 */}
          <div className="divide-y">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500">시험을 불러오는 중...</p>
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
            ) : exams.length === 0 ? (
              <div className="p-8 text-center">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">
                  {activeTab === 'scheduled'
                    ? '예정된 시험이 없습니다.'
                    : activeTab === 'in_progress'
                    ? '진행 중인 시험이 없습니다.'
                    : '완료된 시험이 없습니다.'}
                </p>
                <button
                  onClick={() => alert('시험 생성 기능은 준비 중입니다.')}
                  className="text-primary-600 hover:underline text-sm"
                >
                  새 시험 만들기
                </button>
              </div>
            ) : (
              // rerender-memo: ExamCard 컴포넌트로 분리하여 메모이제이션
              exams.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  openMenuId={openMenuId}
                  onMenuToggle={handleMenuToggle}
                  onDelete={handleDeleteExam}
                />
              ))
            )}
          </div>
        </div>

        {/* bundle-dynamic-imports: 완료된 시험 탭에서만 차트 표시 (lazy load) */}
        {activeTab === 'completed' && allExams.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">점수 분포</h3>
            <ScoreDistributionChart exams={allExams.filter((e) => e.status === 'completed')} />
          </div>
        )}
      </div>
    </div>
  );
}
