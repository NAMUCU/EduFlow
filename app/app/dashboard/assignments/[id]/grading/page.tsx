'use client';

/**
 * EduFlow 과제별 채점 결과 페이지
 *
 * 기능:
 * - 과제 전체 채점 현황 요약
 * - 학생별 결과 목록
 * - 학생 상세 결과 모달
 * - 점수 분포 차트
 * - 필터 및 정렬
 *
 * Vercel Best Practices 적용:
 * - bundle-dynamic-imports: 모달 및 차트 컴포넌트 lazy loading
 * - rerender-memo: 메모이제이션으로 불필요한 리렌더 방지
 */

import { useState, useCallback, useMemo, memo, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import {
  ArrowLeft,
  Users,
  Award,
  TrendingUp,
  Clock,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Download,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';
import { ProblemGradingResult } from '@/components/grading/GradingResult';
import { GradingSummaryData } from '@/components/grading/GradingSummary';
import { Problem, PROBLEM_DIFFICULTY_LABELS } from '@/types/database';

// ============================================
// Lazy loading 컴포넌트
// ============================================

const GradingSummary = dynamic(
  () => import('@/components/grading/GradingSummary').then((m) => m.GradingSummary),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    ),
  }
);

const GradingResult = dynamic(
  () => import('@/components/grading/GradingResult').then((m) => m.GradingResult),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
    ),
  }
);

// ============================================
// 타입 정의
// ============================================

interface PageProps {
  params: Promise<{ id: string }>;
}

/** 학생별 채점 결과 */
interface StudentGradingResult {
  id: string;
  studentId: string;
  studentName: string;
  studentGrade: string;
  school: string;
  score: number;
  maxScore: number;
  status: 'submitted' | 'graded';
  submittedAt: string;
  gradedAt?: string;
  correctCount: number;
  totalCount: number;
  results: ProblemGradingResult[];
  feedback?: string;
}

/** 과제 채점 개요 */
interface AssignmentGradingOverview {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  totalStudents: number;
  gradedStudents: number;
  averageScore: number;
  maxScore: number;
  highestScore: number;
  lowestScore: number;
  problems: Problem[];
}

// ============================================
// Mock 데이터 (실제로는 API에서 가져옴)
// ============================================

const mockProblems: Problem[] = [
  {
    id: 'p1',
    subject: '수학',
    grade: '중2',
    unit: '일차함수',
    question: '일차함수 y = 2x + 3의 기울기와 y절편을 구하시오.',
    answer: '기울기: 2, y절편: 3',
    solution: 'y = ax + b에서 a는 기울기, b는 y절편입니다. 따라서 기울기는 2, y절편은 3입니다.',
    difficulty: 'easy',
    type: 'short_answer',
    options: null,
    image_url: null,
    tags: ['일차함수', '기울기'],
    academy_id: null,
    created_by: null,
    is_public: true,
    ai_generated: false,
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
  {
    id: 'p2',
    subject: '수학',
    grade: '중2',
    unit: '일차함수',
    question: '두 점 (1, 3)과 (4, 9)를 지나는 직선의 방정식을 구하시오.',
    answer: 'y = 2x + 1',
    solution: '기울기 = (9-3)/(4-1) = 2\n점 (1, 3)을 대입: 3 = 2(1) + b, b = 1\n따라서 y = 2x + 1',
    difficulty: 'medium',
    type: 'short_answer',
    options: null,
    image_url: null,
    tags: ['일차함수', '직선의 방정식'],
    academy_id: null,
    created_by: null,
    is_public: true,
    ai_generated: false,
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
  {
    id: 'p3',
    subject: '수학',
    grade: '중2',
    unit: '일차함수',
    question: '다음 중 일차함수가 아닌 것은?\n(A) y = 3x + 2\n(B) y = x^2\n(C) y = -x + 5\n(D) y = 2x',
    answer: 'B',
    solution: 'y = x^2는 x의 이차식이므로 일차함수가 아닙니다.',
    difficulty: 'easy',
    type: 'multiple_choice',
    options: [
      { id: 'A', text: 'y = 3x + 2' },
      { id: 'B', text: 'y = x^2' },
      { id: 'C', text: 'y = -x + 5' },
      { id: 'D', text: 'y = 2x' },
    ],
    image_url: null,
    tags: ['일차함수'],
    academy_id: null,
    created_by: null,
    is_public: true,
    ai_generated: false,
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
  {
    id: 'p4',
    subject: '수학',
    grade: '중2',
    unit: '연립방정식',
    question: '연립방정식 x + y = 5, x - y = 1을 풀어 x, y의 값을 구하시오.',
    answer: 'x = 3, y = 2',
    solution: '두 식을 더하면 2x = 6, x = 3\nx = 3을 첫 번째 식에 대입하면 3 + y = 5, y = 2',
    difficulty: 'medium',
    type: 'short_answer',
    options: null,
    image_url: null,
    tags: ['연립방정식', '대입법'],
    academy_id: null,
    created_by: null,
    is_public: true,
    ai_generated: false,
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
  {
    id: 'p5',
    subject: '수학',
    grade: '중2',
    unit: '부등식',
    question: '부등식 2x - 3 > 5를 풀어 해를 구하시오.',
    answer: 'x > 4',
    solution: '2x - 3 > 5\n2x > 8\nx > 4',
    difficulty: 'hard',
    type: 'short_answer',
    options: null,
    image_url: null,
    tags: ['부등식'],
    academy_id: null,
    created_by: null,
    is_public: true,
    ai_generated: false,
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
];

const mockStudentResults: StudentGradingResult[] = [
  {
    id: 'sa1',
    studentId: 's1',
    studentName: '김민준',
    studentGrade: '중2',
    school: '한국중학교',
    score: 90,
    maxScore: 100,
    status: 'graded',
    submittedAt: '2024-01-20T14:30:00Z',
    gradedAt: '2024-01-20T15:00:00Z',
    correctCount: 4,
    totalCount: 5,
    feedback: '전체적으로 잘 풀었습니다. 부등식 문제에서 부호 처리에 좀 더 주의하세요.',
    results: [
      { problemId: 'p1', problem: mockProblems[0], studentAnswer: '기울기: 2, y절편: 3', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p2', problem: mockProblems[1], studentAnswer: 'y = 2x + 1', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p3', problem: mockProblems[2], studentAnswer: 'B', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p4', problem: mockProblems[3], studentAnswer: 'x = 3, y = 2', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p5', problem: mockProblems[4], studentAnswer: 'x > 3', isCorrect: false, score: 10, maxScore: 20, feedback: '계산 과정은 맞았으나 최종 답에서 실수가 있었습니다.' },
    ],
  },
  {
    id: 'sa2',
    studentId: 's2',
    studentName: '이서연',
    studentGrade: '중2',
    school: '한국중학교',
    score: 100,
    maxScore: 100,
    status: 'graded',
    submittedAt: '2024-01-20T13:45:00Z',
    gradedAt: '2024-01-20T14:30:00Z',
    correctCount: 5,
    totalCount: 5,
    feedback: '모든 문제를 완벽하게 풀었습니다! 수고했어요.',
    results: [
      { problemId: 'p1', problem: mockProblems[0], studentAnswer: '기울기: 2, y절편: 3', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p2', problem: mockProblems[1], studentAnswer: 'y = 2x + 1', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p3', problem: mockProblems[2], studentAnswer: 'B', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p4', problem: mockProblems[3], studentAnswer: 'x = 3, y = 2', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p5', problem: mockProblems[4], studentAnswer: 'x > 4', isCorrect: true, score: 20, maxScore: 20 },
    ],
  },
  {
    id: 'sa3',
    studentId: 's3',
    studentName: '박지훈',
    studentGrade: '중2',
    school: '한국중학교',
    score: 60,
    maxScore: 100,
    status: 'graded',
    submittedAt: '2024-01-20T15:00:00Z',
    gradedAt: '2024-01-20T16:00:00Z',
    correctCount: 3,
    totalCount: 5,
    feedback: '일차함수의 개념을 좀 더 복습하세요. 특히 직선의 방정식 구하기를 연습해보세요.',
    results: [
      { problemId: 'p1', problem: mockProblems[0], studentAnswer: '기울기: 2, y절편: 3', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p2', problem: mockProblems[1], studentAnswer: 'y = 2x + 3', isCorrect: false, score: 0, maxScore: 20, feedback: 'y절편 계산이 잘못되었습니다.' },
      { problemId: 'p3', problem: mockProblems[2], studentAnswer: 'B', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p4', problem: mockProblems[3], studentAnswer: 'x = 2, y = 3', isCorrect: false, score: 0, maxScore: 20, feedback: '대입법 또는 가감법을 다시 확인해보세요.' },
      { problemId: 'p5', problem: mockProblems[4], studentAnswer: 'x > 4', isCorrect: true, score: 20, maxScore: 20 },
    ],
  },
  {
    id: 'sa4',
    studentId: 's4',
    studentName: '최수아',
    studentGrade: '중2',
    school: '서울중학교',
    score: 80,
    maxScore: 100,
    status: 'graded',
    submittedAt: '2024-01-20T14:00:00Z',
    gradedAt: '2024-01-20T15:30:00Z',
    correctCount: 4,
    totalCount: 5,
    results: [
      { problemId: 'p1', problem: mockProblems[0], studentAnswer: '기울기: 2, y절편: 3', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p2', problem: mockProblems[1], studentAnswer: 'y = 2x + 1', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p3', problem: mockProblems[2], studentAnswer: 'A', isCorrect: false, score: 0, maxScore: 20 },
      { problemId: 'p4', problem: mockProblems[3], studentAnswer: 'x = 3, y = 2', isCorrect: true, score: 20, maxScore: 20 },
      { problemId: 'p5', problem: mockProblems[4], studentAnswer: 'x > 4', isCorrect: true, score: 20, maxScore: 20 },
    ],
  },
  {
    id: 'sa5',
    studentId: 's5',
    studentName: '정예준',
    studentGrade: '중2',
    school: '서울중학교',
    score: 0,
    maxScore: 100,
    status: 'submitted',
    submittedAt: '2024-01-20T16:00:00Z',
    correctCount: 0,
    totalCount: 5,
    results: [
      { problemId: 'p1', problem: mockProblems[0], studentAnswer: '기울기: 2, y절편: 3', isCorrect: null, score: 0, maxScore: 20 },
      { problemId: 'p2', problem: mockProblems[1], studentAnswer: 'y = 2x + 1', isCorrect: null, score: 0, maxScore: 20 },
      { problemId: 'p3', problem: mockProblems[2], studentAnswer: 'B', isCorrect: null, score: 0, maxScore: 20 },
      { problemId: 'p4', problem: mockProblems[3], studentAnswer: 'x = 3, y = 2', isCorrect: null, score: 0, maxScore: 20 },
      { problemId: 'p5', problem: mockProblems[4], studentAnswer: 'x > 4', isCorrect: null, score: 0, maxScore: 20 },
    ],
  },
];

const mockOverview: AssignmentGradingOverview = {
  assignmentId: 'a1',
  title: '일차함수 단원평가',
  description: '일차함수의 개념과 응용을 평가합니다.',
  dueDate: '2024-01-25',
  totalStudents: 5,
  gradedStudents: 4,
  averageScore: 82.5,
  maxScore: 100,
  highestScore: 100,
  lowestScore: 60,
  problems: mockProblems,
};

// ============================================
// 보조 컴포넌트
// ============================================

/** 통계 카드 */
const StatCard = memo(function StatCard({
  icon,
  label,
  value,
  subValue,
  iconBgColor,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  iconBgColor: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
        </div>
      </div>
    </div>
  );
});

/** 점수 분포 막대 */
const ScoreDistribution = memo(function ScoreDistribution({
  students,
}: {
  students: StudentGradingResult[];
}) {
  const distribution = useMemo(() => {
    const ranges = [
      { label: '0-20', min: 0, max: 20, count: 0 },
      { label: '21-40', min: 21, max: 40, count: 0 },
      { label: '41-60', min: 41, max: 60, count: 0 },
      { label: '61-80', min: 61, max: 80, count: 0 },
      { label: '81-100', min: 81, max: 100, count: 0 },
    ];

    students.forEach((student) => {
      if (student.status === 'graded') {
        const range = ranges.find(
          (r) => student.score >= r.min && student.score <= r.max
        );
        if (range) range.count++;
      }
    });

    const maxCount = Math.max(...ranges.map((r) => r.count), 1);

    return ranges.map((r) => ({
      ...r,
      percentage: (r.count / maxCount) * 100,
    }));
  }, [students]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">점수 분포</h3>
      <div className="space-y-3">
        {distribution.map((range) => (
          <div key={range.label} className="flex items-center gap-3">
            <span className="w-16 text-sm text-gray-600">{range.label}점</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${range.percentage}%` }}
              />
            </div>
            <span className="w-8 text-sm font-medium text-gray-900 text-right">
              {range.count}명
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

/** 학생 결과 행 */
const StudentResultRow = memo(function StudentResultRow({
  student,
  onViewDetail,
}: {
  student: StudentGradingResult;
  onViewDetail: () => void;
}) {
  const scorePercentage = student.maxScore > 0 ? Math.round((student.score / student.maxScore) * 100) : 0;

  return (
    <div
      onClick={onViewDetail}
      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 프로필 */}
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-medium">{student.studentName[0]}</span>
          </div>

          {/* 학생 정보 */}
          <div>
            <p className="font-medium text-gray-900">{student.studentName}</p>
            <p className="text-sm text-gray-500">
              {student.studentGrade} | {student.school}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* 정답 수 */}
          <div className="text-right">
            <p className="text-sm text-gray-500">정답</p>
            <p className="font-medium text-gray-900">
              {student.correctCount}/{student.totalCount}
            </p>
          </div>

          {/* 점수 */}
          <div className="text-right w-24">
            <p className="text-sm text-gray-500">점수</p>
            <p className={`font-bold ${
              scorePercentage >= 80 ? 'text-green-600' :
              scorePercentage >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {student.status === 'graded' ? `${student.score}점` : '-'}
            </p>
          </div>

          {/* 상태 */}
          <div className={`w-24 px-3 py-1 rounded-full text-xs font-medium text-center ${
            student.status === 'graded'
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {student.status === 'graded' ? '채점 완료' : '채점 대기'}
          </div>

          <Eye className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
});

/** 상세 결과 모달 */
const DetailModal = memo(function DetailModal({
  student,
  onClose,
}: {
  student: StudentGradingResult;
  onClose: () => void;
}) {
  const summaryData: GradingSummaryData = {
    studentName: student.studentName,
    studentGrade: student.studentGrade,
    assignmentTitle: mockOverview.title,
    assignmentDate: student.submittedAt.split('T')[0],
    totalScore: student.score,
    maxScore: student.maxScore,
    results: student.results,
    startedAt: new Date(new Date(student.submittedAt).getTime() - 30 * 60000).toISOString(),
    submittedAt: student.submittedAt,
    timeLimit: 60,
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 bg-white border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">채점 결과 상세</h2>
            <p className="text-sm text-gray-500">
              {student.studentName} 학생의 {mockOverview.title} 결과입니다
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              PDF 내보내기
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* 요약 */}
          <GradingSummary data={summaryData} showChart showAnalysis />

          {/* 전체 피드백 */}
          {student.feedback && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">선생님 총평</h3>
              </div>
              <p className="text-gray-600">{student.feedback}</p>
            </div>
          )}

          {/* 문제별 결과 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">문제별 채점 결과</h3>
            <GradingResult results={student.results} showSolution showFeedback />
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 메인 페이지 컴포넌트
// ============================================

export default function AssignmentGradingPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'graded' | 'submitted'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'submittedAt'>('submittedAt');
  const [selectedStudent, setSelectedStudent] = useState<StudentGradingResult | null>(null);

  // 필터링된 학생 목록
  const filteredStudents = useMemo(() => {
    let result = [...mockStudentResults];

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.studentName.toLowerCase().includes(query) ||
          s.school.toLowerCase().includes(query)
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    // 정렬
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.studentName.localeCompare(b.studentName);
        case 'score':
          return b.score - a.score;
        case 'submittedAt':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, statusFilter, sortBy]);

  // 콜백 함수들
  const handleViewDetail = useCallback((student: StudentGradingResult) => {
    setSelectedStudent(student);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedStudent(null);
  }, []);

  return (
    <div>
      <Header
        title="채점 결과"
        subtitle={mockOverview.title}
      />

      <div className="p-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/dashboard/assignments/${id}`}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            과제 상세로 돌아가기
          </Link>

          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            전체 결과 내보내기
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="전체 학생"
            value={`${mockOverview.gradedStudents}/${mockOverview.totalStudents}`}
            subValue="채점 완료"
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={<Award className="w-6 h-6" />}
            label="평균 점수"
            value={`${mockOverview.averageScore}점`}
            subValue={`만점 ${mockOverview.maxScore}점`}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="최고 점수"
            value={`${mockOverview.highestScore}점`}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatCard
            icon={<AlertCircle className="w-6 h-6" />}
            label="최저 점수"
            value={`${mockOverview.lowestScore}점`}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
          />
        </div>

        {/* 점수 분포 */}
        <div className="mb-6">
          <ScoreDistribution students={mockStudentResults} />
        </div>

        {/* 학생 목록 */}
        <div className="bg-white rounded-2xl border border-gray-200">
          {/* 필터 및 검색 */}
          <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <h3 className="font-semibold text-gray-900">학생별 결과</h3>

            <div className="flex flex-wrap gap-3">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="학생 이름 검색..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
                />
              </div>

              {/* 상태 필터 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setStatusFilter('graded')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    statusFilter === 'graded'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  채점 완료
                </button>
                <button
                  onClick={() => setStatusFilter('submitted')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    statusFilter === 'submitted'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  채점 대기
                </button>
              </div>

              {/* 정렬 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="submittedAt">제출 시간순</option>
                <option value="name">이름순</option>
                <option value="score">점수순</option>
              </select>
            </div>
          </div>

          {/* 학생 목록 */}
          <div>
            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">검색 결과가 없습니다.</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <StudentResultRow
                  key={student.id}
                  student={student}
                  onViewDetail={() => handleViewDetail(student)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedStudent && (
        <DetailModal
          student={selectedStudent}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}
