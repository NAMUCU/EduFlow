'use client';

/**
 * 학생 상세 페이지
 *
 * Vercel React Best Practices 적용:
 * - async-parallel: Promise.all로 학생 정보, 과제, 성적 등 병렬 fetching (useStudentDetail 훅)
 * - bundle-dynamic-imports: next/dynamic으로 탭 컴포넌트 lazy loading
 * - client-swr-dedup: SWR로 클라이언트 캐싱 및 요청 중복 제거
 * - rerender-memo: React.memo로 불필요한 리렌더 방지
 * - bundle-preload: 탭 hover 시 prefetch
 */

import { useState, useCallback, memo, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import {
  ArrowLeft,
  Edit,
  Phone,
  School,
  Calendar,
  GraduationCap,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  MessageSquare,
  FileText,
  BarChart3,
  CalendarDays,
} from 'lucide-react';
import {
  StudentDetail,
  STUDENT_STATUS_COLORS,
} from '@/types/student';
import { useStudentDetail, preloadStudentData } from '@/hooks/useStudentDetail';

// ============================================
// 탭 타입 정의
// ============================================

type TabType = 'overview' | 'grades' | 'assignments' | 'attendance' | 'consultations';

const TAB_OPTIONS: { id: TabType; label: string; icon: React.ReactNode; dataType?: 'grades' | 'assignments' | 'attendance' | 'consultations' }[] = [
  { id: 'overview', label: '개요', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'grades', label: '성적', icon: <FileText className="w-4 h-4" />, dataType: 'grades' },
  { id: 'assignments', label: '과제', icon: <BookOpen className="w-4 h-4" />, dataType: 'assignments' },
  { id: 'attendance', label: '출결', icon: <CalendarDays className="w-4 h-4" />, dataType: 'attendance' },
  { id: 'consultations', label: '상담', icon: <MessageSquare className="w-4 h-4" />, dataType: 'consultations' },
];

// ============================================
// Vercel Best Practice: bundle-dynamic-imports
// 탭 컴포넌트들을 lazy loading하여 초기 번들 크기 감소
// ============================================

const OverviewTab = dynamic(() => import('./tabs/OverviewTab').then(m => m.OverviewTab), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false,
});

const GradesTab = dynamic(() => import('./tabs/GradesTab').then(m => m.GradesTab), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false,
});

const AssignmentsTab = dynamic(() => import('./tabs/AssignmentsTab').then(m => m.AssignmentsTab), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false,
});

const AttendanceTab = dynamic(() => import('./tabs/AttendanceTab').then(m => m.AttendanceTab), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false,
});

const ConsultationsTab = dynamic(() => import('./tabs/ConsultationsTab').then(m => m.ConsultationsTab), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false,
});

// 탭 로딩 스켈레톤
function TabLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-gray-200 rounded-xl" />
      <div className="h-48 bg-gray-200 rounded-xl" />
      <div className="h-32 bg-gray-200 rounded-xl" />
    </div>
  );
}

// ============================================
// Vercel Best Practice: rerender-memo
// 성적 추이 아이콘 컴포넌트 메모이제이션
// ============================================

interface TrendIconProps {
  trend: 'up' | 'down' | 'stable';
}

export const TrendIcon = memo(function TrendIcon({ trend }: TrendIconProps) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'down':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-gray-400" />;
  }
});

// ============================================
// Vercel Best Practice: rerender-memo
// 통계 카드 컴포넌트 메모이제이션
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

export const StatCard = memo(function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
});

// ============================================
// Vercel Best Practice: rerender-memo
// 학생 프로필 카드 메모이제이션
// ============================================

interface StudentProfileCardProps {
  student: StudentDetail;
}

const StudentProfileCard = memo(function StudentProfileCard({ student }: StudentProfileCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* 프로필 이미지 */}
        <div className="w-24 h-24 bg-primary-100 rounded-2xl flex items-center justify-center text-4xl font-bold text-primary-600">
          {student.name[0]}
        </div>

        {/* 기본 정보 */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STUDENT_STATUS_COLORS[student.status]}`}>
              {student.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <School className="w-4 h-4" />
              {student.school}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <GraduationCap className="w-4 h-4" />
              {student.grade} {student.className && `/ ${student.className}`}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              {student.phone || '-'}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              {student.enrolledAt} 등록
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <div className="flex gap-2">
              {student.subjects.map((subject) => (
                <span key={subject} className="px-2 py-1 bg-primary-50 text-primary-600 text-sm rounded-lg">
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 학부모 정보 */}
        <div className="bg-gray-50 rounded-xl p-4 md:w-64">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">학부모 정보</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">이름</span>
              <span className="font-medium text-gray-900">{student.parent.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">연락처</span>
              <span className="font-medium text-gray-900">{student.parent.phone}</span>
            </div>
            {student.parent.email && (
              <div className="flex justify-between">
                <span className="text-gray-500">이메일</span>
                <span className="font-medium text-gray-900 truncate max-w-32">{student.parent.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// Vercel Best Practice: bundle-preload
// 탭 버튼 컴포넌트 (hover 시 prefetch)
// ============================================

interface TabButtonProps {
  tab: typeof TAB_OPTIONS[number];
  isActive: boolean;
  onClick: () => void;
  studentId: string;
}

const TabButton = memo(function TabButton({ tab, isActive, onClick, studentId }: TabButtonProps) {
  /**
   * Vercel Best Practice: bundle-preload
   * 탭에 마우스를 올리면 해당 탭의 컴포넌트 코드와 데이터를 미리 로드
   */
  const handlePreload = useCallback(() => {
    if (typeof window === 'undefined') return;

    // 1. 탭 컴포넌트 코드 preload (dynamic import)
    switch (tab.id) {
      case 'overview':
        void import('./tabs/OverviewTab');
        break;
      case 'grades':
        void import('./tabs/GradesTab');
        break;
      case 'assignments':
        void import('./tabs/AssignmentsTab');
        break;
      case 'attendance':
        void import('./tabs/AttendanceTab');
        break;
      case 'consultations':
        void import('./tabs/ConsultationsTab');
        break;
    }

    // 2. 데이터도 함께 preload (SWR)
    if (tab.dataType && studentId) {
      preloadStudentData(studentId, tab.dataType);
    }
  }, [tab.id, tab.dataType, studentId]);

  return (
    <button
      onClick={onClick}
      onMouseEnter={handlePreload}
      onFocus={handlePreload}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary-500 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {tab.icon}
      {tab.label}
    </button>
  );
});

// ============================================
// Vercel Best Practice: rerender-memo
// 탭 네비게이션 컴포넌트 메모이제이션
// ============================================

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  studentId: string;
}

const TabNavigation = memo(function TabNavigation({ activeTab, onTabChange, studentId }: TabNavigationProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-1 mb-6">
      <div className="flex gap-1">
        {TAB_OPTIONS.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            studentId={studentId}
          />
        ))}
      </div>
    </div>
  );
});

// ============================================
// Vercel Best Practice: rerender-memo
// 탭 콘텐츠 렌더러 메모이제이션
// ============================================

interface TabContentProps {
  activeTab: TabType;
  student: StudentDetail;
}

const TabContent = memo(function TabContent({ activeTab, student }: TabContentProps) {
  switch (activeTab) {
    case 'overview':
      return <OverviewTab student={student} />;
    case 'grades':
      return <GradesTab student={student} />;
    case 'assignments':
      return <AssignmentsTab student={student} />;
    case 'attendance':
      return <AttendanceTab student={student} />;
    case 'consultations':
      return <ConsultationsTab student={student} />;
    default:
      return null;
  }
});

// ============================================
// 로딩 스켈레톤
// ============================================

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    </div>
  );
}

// ============================================
// 에러 화면
// ============================================

interface ErrorScreenProps {
  error: string;
  onBack: () => void;
}

function ErrorScreen({ error, onBack }: ErrorScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
      <AlertCircle className="w-16 h-16 mb-4 text-gray-300" />
      <p className="text-lg font-medium">{error}</p>
      <button onClick={onBack} className="mt-4 btn-primary">
        학생 목록으로 돌아가기
      </button>
    </div>
  );
}

// ============================================
// 메인 페이지 컴포넌트
// ============================================

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  /**
   * Vercel Best Practice: client-swr-dedup
   * SWR을 통한 데이터 fetching, 캐싱, 자동 중복 제거
   *
   * Vercel Best Practice: async-parallel
   * useParallelFetching: true 옵션으로 병렬 fetching 활성화
   */
  const { student, isLoading, error } = useStudentDetail(resolvedParams.id, {
    useParallelFetching: false, // 서버에서 조합된 단일 API 사용 (기본)
    // useParallelFetching: true, // 개별 API 병렬 호출 사용
  });

  /**
   * Vercel Best Practice: rerender-functional-setstate
   * 탭 변경 콜백을 안정적으로 유지
   */
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleBack = useCallback(() => {
    router.push('/dashboard/students');
  }, [router]);

  // 로딩 상태
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // 에러 상태
  if (error || !student) {
    return (
      <ErrorScreen
        error={error || '학생을 찾을 수 없습니다.'}
        onBack={handleBack}
      />
    );
  }

  return (
    <div>
      <Header
        title="학생 상세"
        subtitle={`${student.name} 학생의 상세 정보입니다`}
      />

      <div className="p-8">
        {/* 상단 네비게이션 및 액션 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            학생 목록으로
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Edit className="w-4 h-4" />
            정보 수정
          </button>
        </div>

        {/* 학생 프로필 카드 */}
        <StudentProfileCard student={student} />

        {/* 탭 네비게이션 */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          studentId={resolvedParams.id}
        />

        {/* 탭 내용 */}
        <TabContent activeTab={activeTab} student={student} />
      </div>
    </div>
  );
}
