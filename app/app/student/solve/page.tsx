'use client';

/**
 * 학생 문제 풀이 페이지
 *
 * 개선된 기능:
 * - 풀이 사진 촬영/업로드
 * - 이미지 미리보기
 * - 제출 전 확인 (미리보기 모달)
 * - 문제 유형별 답안 입력 UI
 */

import { useState, useCallback, useEffect, memo } from 'react';
import dynamic from 'next/dynamic';
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Filter,
  Play,
  Pause,
  Send,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Camera,
  Loader2,
  Trophy,
  RefreshCw,
  X,
  Eye,
  FileText,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { useAssignments, StudentAssignmentItem } from '@/hooks/useAssignments';
import useSubmission, { ProblemInfo } from '@/hooks/useSubmission';
import { useAuth } from '@/hooks/useAuth';

// Lazy load 컴포넌트
const SolutionUploader = dynamic(() => import('@/components/student/SolutionUploader'), {
  loading: () => (
    <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-xl">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
  ssr: false,
});

const AnswerInput = dynamic(() => import('@/components/student/AnswerInput'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-xl h-32" />,
  ssr: false,
});

// UI 텍스트 상수
const UI_TEXT = {
  pageTitle: '문제 풀기',
  pageSubtitle: '배정된 과제를 확인하고 문제를 풀어보세요',
  assignedProblems: '배정된 과제',
  allSubjects: '전체',
  inProgress: '진행 중',
  notStarted: '시작 전',
  submitted: '제출 완료',
  graded: '채점 완료',
  completed: '완료',
  problemCount: '문제',
  startSolving: '풀기 시작',
  continueSolving: '이어서 풀기',
  reviewProblems: '결과 보기',
  deadline: '마감',
  progress: '진행률',
  timeRemaining: '남은 시간',
  problem: '문제',
  previousProblem: '이전',
  nextProblem: '다음',
  submitAnswer: '제출하기',
  submitAll: '과제 제출',
  showHint: '힌트 보기',
  multipleChoice: '객관식',
  shortAnswer: '단답형',
  essay: '서술형',
  selectAnswer: '답을 선택해주세요',
  enterAnswer: '답을 입력해주세요',
  timer: '경과 시간',
  uploadHandwriting: '손글씨 업로드',
  ocrProcessing: 'OCR 인식 중...',
  loading: '로딩 중...',
  noAssignments: '배정된 과제가 없습니다.',
  score: '점수',
  correct: '정답',
  incorrect: '오답',
  pending: '채점 대기',
  previewSubmission: '제출 미리보기',
  confirmSubmit: '제출 확인',
  answeredCount: '답변한 문제',
  unansweredCount: '미답변 문제',
  cancel: '취소',
  submit: '제출하기',
  backToList: '목록으로',
};

// 상태 설정
const statusConfig = {
  graded: {
    label: UI_TEXT.graded,
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: Trophy,
  },
  submitted: {
    label: UI_TEXT.submitted,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    icon: CheckCircle,
  },
  in_progress: {
    label: UI_TEXT.inProgress,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: Clock,
  },
  not_started: {
    label: UI_TEXT.notStarted,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200',
    icon: AlertCircle,
  },
};

// 과목별 색상
const subjectColors: { [key: string]: string } = {
  수학: 'bg-blue-100 text-blue-700',
  영어: 'bg-purple-100 text-purple-700',
  국어: 'bg-green-100 text-green-700',
  과학: 'bg-orange-100 text-orange-700',
  사회: 'bg-pink-100 text-pink-700',
  기타: 'bg-gray-100 text-gray-700',
};

// 문제 카드 컴포넌트 (개선된 버전)
const ProblemCard = memo(function ProblemCard({
  problem,
  currentAnswer,
  onAnswer,
  onImageUpload,
  showHint,
  isGraded,
  isCorrect,
  correctAnswer,
}: {
  problem: ProblemInfo;
  currentAnswer?: { answer: string; imageUrl?: string };
  onAnswer: (answer: string, imageUrl?: string) => void;
  onImageUpload?: (base64: string) => Promise<{ success: boolean; url?: string; ocrText?: string; error?: string }>;
  showHint: boolean;
  isGraded?: boolean;
  isCorrect?: boolean | null;
  correctAnswer?: string;
}) {
  const getTypeLabel = () => {
    switch (problem.type) {
      case 'multiple_choice':
        return UI_TEXT.multipleChoice;
      case 'short_answer':
        return UI_TEXT.shortAnswer;
      case 'essay':
        return UI_TEXT.essay;
      default:
        return '기타';
    }
  };

  const getTypeColor = () => {
    switch (problem.type) {
      case 'multiple_choice':
        return 'bg-blue-50 text-blue-600';
      case 'short_answer':
        return 'bg-green-50 text-green-600';
      case 'essay':
        return 'bg-purple-50 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      {/* 문제 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-xl font-bold">
          {problem.number}
        </span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getTypeColor()}`}>
          {getTypeLabel()}
        </span>
        <span className="text-xs font-medium px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full">
          {problem.points}점
        </span>
        {isGraded && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ml-auto ${
              isCorrect
                ? 'bg-green-100 text-green-700'
                : isCorrect === false
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {isCorrect ? UI_TEXT.correct : isCorrect === false ? UI_TEXT.incorrect : UI_TEXT.pending}
          </span>
        )}
      </div>

      {/* 문제 내용 */}
      <div className="mb-6">
        <p className="text-lg text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">
          {problem.question}
        </p>
      </div>

      {/* 문제 이미지 */}
      {problem.image_url && (
        <div className="mb-6 bg-gray-50 rounded-xl p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={problem.image_url}
            alt="문제 이미지"
            className="max-w-full max-h-[400px] mx-auto rounded-lg border border-gray-200"
          />
        </div>
      )}

      {/* 답안 입력 영역 */}
      <div className="mb-4">
        <AnswerInput
          type={problem.type}
          choices={problem.options}
          currentAnswer={currentAnswer ? { answer: currentAnswer.answer, imageUrl: currentAnswer.imageUrl } : undefined}
          onAnswer={onAnswer}
          onImageUpload={onImageUpload}
          disabled={isGraded}
          isGraded={isGraded}
          isCorrect={isCorrect}
          correctAnswer={correctAnswer}
        />
      </div>

      {/* 힌트 */}
      {showHint && problem.hint && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 mb-1">힌트</p>
              <p className="text-yellow-700 text-sm">{problem.hint}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// 제출 미리보기 모달
const SubmitPreviewModal = memo(function SubmitPreviewModal({
  problems,
  answers,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  problems: ProblemInfo[];
  answers: Map<string, { answer: string; imageUrl?: string }>;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const answeredProblems = problems.filter(
    (p) => answers.has(p.id) && answers.get(p.id)?.answer?.trim()
  );
  const unansweredProblems = problems.filter(
    (p) => !answers.has(p.id) || !answers.get(p.id)?.answer?.trim()
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" />
              {UI_TEXT.previewSubmission}
            </h3>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 요약 정보 */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{UI_TEXT.answeredCount}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {answeredProblems.length}/{problems.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{UI_TEXT.unansweredCount}</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {unansweredProblems.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 답안 미리보기 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {problems.map((problem) => {
              const answer = answers.get(problem.id);
              const hasAnswer = answer?.answer?.trim();

              return (
                <div
                  key={problem.id}
                  className={`p-4 rounded-xl border-2 ${
                    hasAnswer ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        hasAnswer
                          ? 'bg-green-500 text-white'
                          : 'bg-orange-500 text-white'
                      }`}
                    >
                      {problem.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {problem.question}
                      </p>
                      {hasAnswer ? (
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-700 break-words">
                              {problem.type === 'multiple_choice'
                                ? `${answer?.answer}번 선택`
                                : (answer?.answer?.length ?? 0) > 100
                                ? `${answer?.answer?.substring(0, 100)}...`
                                : answer?.answer}
                            </p>
                            {answer?.imageUrl && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                                <ImageIcon className="w-3 h-3" />
                                <span>이미지 첨부됨</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-orange-600 font-medium">
                          답안이 입력되지 않았습니다
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {unansweredProblems.length > 0 && (
            <p className="text-sm text-orange-600 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              미답변 문제가 {unansweredProblems.length}개 있습니다. 제출하시겠습니까?
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {UI_TEXT.cancel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>제출 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>{UI_TEXT.submit}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// 과제 카드 컴포넌트
const AssignmentCard = memo(function AssignmentCard({
  assignment,
  onSelect,
}: {
  assignment: StudentAssignmentItem;
  onSelect: () => void;
}) {
  const status = statusConfig[assignment.status] || statusConfig.not_started;
  const StatusIcon = status.icon;
  const progress =
    assignment.problem_count > 0
      ? (assignment.completed_count / assignment.problem_count) * 100
      : 0;

  // 마감일까지 남은 시간
  const getRemainingTime = () => {
    if (!assignment.due_date) return null;
    const now = new Date();
    const due = new Date(assignment.due_date);
    const diff = due.getTime() - now.getTime();

    if (diff < 0) return '마감됨';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}일 ${hours}시간 남음`;
    if (hours > 0) return `${hours}시간 남음`;
    return '곧 마감';
  };

  const remainingTime = getRemainingTime();

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-2 ${status.borderColor} p-5 hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div
            className={`w-12 h-12 ${status.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}
          >
            <StatusIcon className={`w-6 h-6 ${status.textColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  subjectColors[assignment.subject] || subjectColors['기타']
                }`}
              >
                {assignment.subject}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${status.bgColor} ${status.textColor}`}
              >
                {status.label}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                난이도: {assignment.difficulty}
              </span>
            </div>
            <h3 className="font-bold text-gray-800 mt-2 truncate">{assignment.title}</h3>
            {assignment.chapter && (
              <p className="text-sm text-gray-500 mt-1">{assignment.chapter}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {assignment.completed_count}/{assignment.problem_count} {UI_TEXT.problemCount}
              </span>
              {assignment.due_date && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {remainingTime}
                </span>
              )}
            </div>
            {/* 점수 표시 (채점 완료인 경우) */}
            {assignment.status === 'graded' && assignment.score !== null && (
              <div className="mt-2 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">
                  {UI_TEXT.score}: {assignment.score}/{assignment.max_score}점
                </span>
              </div>
            )}
            {/* 진행 바 */}
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    assignment.status === 'graded' || assignment.status === 'submitted'
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onSelect}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all flex-shrink-0 ${
            assignment.status === 'graded' || assignment.status === 'submitted'
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : assignment.status === 'in_progress'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {assignment.status === 'graded' || assignment.status === 'submitted' ? (
            <>
              {UI_TEXT.reviewProblems}
              <ChevronRight className="w-4 h-4" />
            </>
          ) : assignment.status === 'in_progress' ? (
            <>
              {UI_TEXT.continueSolving}
              <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            <>
              {UI_TEXT.startSolving}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
});

// 메인 컴포넌트
export default function SolvePage() {
  // Auth 훅
  const { user, isLoading: authLoading } = useAuth();

  // Mock 학생 ID (실제로는 user에서 가져옴)
  const studentId = user?.id || 'student-001';

  // 상태
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignmentItem | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [isPaused, setIsPaused] = useState(false);
  const [showSolutionUploader, setShowSolutionUploader] = useState(false);
  const [showSubmitPreview, setShowSubmitPreview] = useState(false);

  // client-swr-dedup: 과제 목록 SWR로 관리
  const {
    assignments,
    statusCounts,
    isLoading: assignmentsLoading,
    error: assignmentsError,
    refresh: refreshAssignments,
  } = useAssignments({
    studentId,
    filter: {
      status:
        filter === 'all'
          ? undefined
          : (filter as 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'completed'),
    },
  });

  // Mock 문제 데이터 (실제로는 API에서 가져옴)
  const [problems] = useState<ProblemInfo[]>([
    {
      id: 'saved-009',
      number: 1,
      question: '다음 중 x = 3일 때 참이 되는 방정식은?',
      type: 'multiple_choice',
      options: [
        { id: 1, text: '2x + 1 = 5' },
        { id: 2, text: '3x - 2 = 7' },
        { id: 3, text: 'x + 4 = 6' },
        { id: 4, text: '5x - 10 = 5' },
        { id: 5, text: '2x + 3 = 10' },
      ],
      points: 30,
      hint: '각 보기에 x = 3을 대입하여 등식이 성립하는지 확인하세요.',
    },
    {
      id: 'saved-001',
      number: 2,
      question: '다음 중 음수를 모두 고르시오.\n\n-5, 0, +3, -2.5, +7, -1/2',
      type: 'short_answer',
      points: 30,
      hint: '음수는 0보다 작은 수입니다.',
    },
    {
      id: 'saved-008',
      number: 3,
      question:
        '사과 3개와 배 2개의 가격이 4,100원이고, 사과 2개와 배 3개의 가격이 4,400원이다. 사과 1개와 배 1개의 가격을 각각 구하시오.',
      type: 'essay',
      points: 40,
      hint: '연립방정식을 세워 풀어보세요.',
    },
  ]);

  // 제출 관리 훅
  const submission = useSubmission({
    studentAssignmentId: selectedAssignment?.id || '',
    problems,
    autoSave: true,
  });

  // 답안 맵 (미리보기용)
  const [answerMap, setAnswerMap] = useState<Map<string, { answer: string; imageUrl?: string }>>(
    new Map()
  );

  // 답안 업데이트 시 맵도 업데이트
  useEffect(() => {
    const newMap = new Map<string, { answer: string; imageUrl?: string }>();
    submission.answers.forEach((a) => {
      newMap.set(a.problem_id, { answer: a.answer, imageUrl: a.image_url });
    });
    setAnswerMap(newMap);
  }, [submission.answers]);

  // 타이머 효과
  useEffect(() => {
    if (!selectedAssignment || isPaused) return;

    const timer = setInterval(() => {
      submission.setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedAssignment, isPaused, submission]);

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 과제 시작
  const handleStartAssignment = useCallback(
    async (assignment: StudentAssignmentItem) => {
      // 시작 전이면 API 호출
      if (assignment.status === 'not_started') {
        try {
          await fetch(`/api/assignments/student/${assignment.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'start' }),
          });
        } catch (error) {
          console.error('과제 시작 오류:', error);
        }
      }
      setSelectedAssignment(assignment);
    },
    []
  );

  // 답안 입력 핸들러
  const handleAnswer = useCallback(
    (problemId: string, answer: string, imageUrl?: string) => {
      submission.updateAnswer(problemId, answer, imageUrl);
    },
    [submission]
  );

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback(
    async (base64: string) => {
      if (!submission.currentProblem) {
        return { success: false, error: '현재 문제를 찾을 수 없습니다.' };
      }

      const result = await submission.uploadHandwritingImage(
        submission.currentProblem.id,
        base64,
        true
      );

      return {
        success: result.success,
        url: result.url,
        ocrText: result.ocrText,
        error: result.error,
      };
    },
    [submission]
  );

  // 과제 제출
  const handleSubmit = useCallback(async () => {
    setShowSubmitPreview(false);
    const result = await submission.submitAssignment();

    if (result.success) {
      alert(
        result.needsManualGrading
          ? '과제가 제출되었습니다! 서술형 문제는 선생님의 채점을 기다려주세요.'
          : `축하합니다! 점수: ${result.score}/${result.maxScore}점`
      );
      setSelectedAssignment(null);
      refreshAssignments();
    } else {
      alert(`제출 오류: ${result.error}`);
    }
  }, [submission, refreshAssignments]);

  // 로딩 상태
  if (authLoading || assignmentsLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">{UI_TEXT.loading}</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (assignmentsError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{assignmentsError}</span>
          <button
            onClick={() => refreshAssignments()}
            className="ml-auto text-sm font-medium hover:underline"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 문제 풀이 인터페이스
  if (selectedAssignment && submission.currentProblem) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        {/* 상단 헤더 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedAssignment(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{UI_TEXT.backToList}</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span className="font-medium">
                  {UI_TEXT.timer}: {formatTime(submission.elapsedTime)}
                </span>
              </div>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`p-2 rounded-lg transition-colors ${
                  isPaused ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  subjectColors[selectedAssignment.subject] || subjectColors['기타']
                }`}
              >
                {selectedAssignment.subject}
              </span>
              {selectedAssignment.chapter && (
                <span className="text-sm text-gray-500">{selectedAssignment.chapter}</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-800 mt-1">{selectedAssignment.title}</h2>
          </div>
          {/* 진행 바 */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>
                {UI_TEXT.problem} {submission.currentIndex + 1} / {problems.length}
              </span>
              <span>{submission.progress.percentage}% 완료</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${submission.progress.percentage}%` }}
              />
            </div>
          </div>
          {/* 문제 네비게이션 */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {problems.map((p, idx) => {
              const answer = submission.getAnswer(p.id);
              const hasAnswer = answer && answer.answer && answer.answer.trim().length > 0;

              return (
                <button
                  key={p.id}
                  onClick={() => submission.goToProblem(idx)}
                  className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                    idx === submission.currentIndex
                      ? 'bg-blue-600 text-white'
                      : hasAnswer
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.number}
                </button>
              );
            })}
          </div>
        </div>

        {/* 문제 카드 */}
        <ProblemCard
          problem={submission.currentProblem}
          currentAnswer={
            submission.currentAnswer
              ? { answer: submission.currentAnswer.answer, imageUrl: submission.currentAnswer.image_url }
              : undefined
          }
          onAnswer={(answer, imageUrl) =>
            handleAnswer(submission.currentProblem.id, answer, imageUrl)
          }
          onImageUpload={handleImageUpload}
          showHint={showHint}
        />

        {/* 손글씨 업로드 영역 */}
        {showSolutionUploader && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                {UI_TEXT.uploadHandwriting}
              </h3>
              <button
                onClick={() => setShowSolutionUploader(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <SolutionUploader
              onImageSelected={() => {}}
              onUpload={handleImageUpload}
              onCancel={() => setShowSolutionUploader(false)}
            />
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHint(!showHint)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                showHint
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-yellow-600 hover:bg-yellow-50'
              }`}
            >
              <Lightbulb className="w-5 h-5" />
              {UI_TEXT.showHint}
            </button>
            {submission.currentProblem?.type === 'essay' && (
              <button
                onClick={() => setShowSolutionUploader(!showSolutionUploader)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  showSolutionUploader
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Camera className="w-5 h-5" />
                {UI_TEXT.uploadHandwriting}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={submission.goToPrevious}
              disabled={submission.currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              {UI_TEXT.previousProblem}
            </button>

            {submission.currentIndex === problems.length - 1 ? (
              <button
                onClick={() => setShowSubmitPreview(true)}
                disabled={submission.unansweredProblems.length === problems.length}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {UI_TEXT.submitAll}
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={submission.goToNext}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {UI_TEXT.nextProblem}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 제출 미리보기 모달 */}
        {showSubmitPreview && (
          <SubmitPreviewModal
            problems={problems}
            answers={answerMap}
            onConfirm={handleSubmit}
            onCancel={() => setShowSubmitPreview(false)}
            isSubmitting={submission.isSubmitting}
          />
        )}
      </div>
    );
  }

  // 과제 목록
  return (
    <div className="p-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-blue-600" />
          {UI_TEXT.pageTitle}
        </h1>
        <p className="text-gray-500 mt-1">{UI_TEXT.pageSubtitle}</p>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-5 h-5 text-gray-400" />
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {UI_TEXT.allSubjects} ({statusCounts.all})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === 'in_progress'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {UI_TEXT.inProgress} ({statusCounts.in_progress})
        </button>
        <button
          onClick={() => setFilter('not_started')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === 'not_started'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {UI_TEXT.notStarted} ({statusCounts.not_started})
        </button>
        <button
          onClick={() => setFilter('submitted')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === 'submitted'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {UI_TEXT.submitted} ({statusCounts.submitted})
        </button>
        <button
          onClick={() => setFilter('graded')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === 'graded'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {UI_TEXT.graded} ({statusCounts.graded})
        </button>
        <button
          onClick={() => refreshAssignments()}
          className="ml-auto p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          title="새로고침"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* 과제 목록 */}
      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            onSelect={() => handleStartAssignment(assignment)}
          />
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">{UI_TEXT.noAssignments}</p>
        </div>
      )}
    </div>
  );
}
