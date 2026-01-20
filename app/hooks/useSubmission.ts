'use client';

/**
 * EduFlow 과제 제출 관리 훅
 *
 * 학생의 답안 제출, 이미지 업로드, OCR 처리를 관리합니다.
 *
 * @example
 * ```tsx
 * const {
 *   answers,
 *   updateAnswer,
 *   submitAssignment,
 *   uploadHandwritingImage,
 *   isSubmitting,
 * } = useSubmission(assignmentId);
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import useSWRMutation from 'swr/mutation';

// ============================================
// 타입 정의
// ============================================

/** 답안 타입 */
export interface Answer {
  problem_id: string;
  answer: string;
  answered_at: string | null;
  image_url?: string;  // 손글씨 이미지 URL
  ocr_text?: string;   // OCR 인식 텍스트
}

/** 문제 타입 */
export interface ProblemInfo {
  id: string;
  number: number;
  type: 'multiple_choice' | 'short_answer' | 'essay';
  question: string;
  options?: { id: number; text: string }[];
  points: number;
  hint?: string;
  image_url?: string;
}

/** 제출 결과 */
export interface SubmissionResult {
  success: boolean;
  score?: number;
  maxScore?: number;
  correctCount?: number;
  totalCount?: number;
  needsManualGrading?: boolean;
  results?: {
    problem_id: string;
    is_correct: boolean | null;
    score: number;
    feedback?: string;
  }[];
  error?: string;
}

/** OCR 결과 */
export interface OcrResult {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

/** 이미지 업로드 결과 */
export interface UploadResult {
  success: boolean;
  url?: string;
  ocrResult?: OcrResult;
  error?: string;
}

// ============================================
// API 함수
// ============================================

/**
 * 답안 저장 API (자동 저장용)
 */
async function saveAnswerApi(
  url: string,
  { arg }: { arg: { problem_id: string; answer: string; image_url?: string } }
): Promise<{ success: boolean }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    throw new Error('답안 저장에 실패했습니다.');
  }

  return response.json();
}

/**
 * 과제 제출 API
 */
async function submitAssignmentApi(
  url: string,
  { arg }: { arg: { answers: Answer[] } }
): Promise<SubmissionResult> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '과제 제출에 실패했습니다.');
  }

  return response.json();
}

/**
 * 이미지 업로드 및 OCR API
 */
async function uploadImageApi(
  url: string,
  { arg }: { arg: { image: string; processOcr?: boolean } }
): Promise<UploadResult> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '이미지 업로드에 실패했습니다.');
  }

  return response.json();
}

// ============================================
// 훅 정의
// ============================================

interface UseSubmissionOptions {
  studentAssignmentId: string;
  problems: ProblemInfo[];
  initialAnswers?: Answer[];
  autoSave?: boolean;
  autoSaveInterval?: number;
}

/**
 * useSubmission 훅
 *
 * 학생의 과제 제출 상태를 관리합니다.
 */
export function useSubmission(options: UseSubmissionOptions) {
  const {
    studentAssignmentId,
    problems,
    initialAnswers = [],
    autoSave = true,
    autoSaveInterval = 30000, // 30초
  } = options;

  // 답안 상태 관리
  const [answers, setAnswers] = useState<Map<string, Answer>>(() => {
    const map = new Map<string, Answer>();
    initialAnswers.forEach((a) => map.set(a.problem_id, a));
    return map;
  });

  // 현재 문제 인덱스
  const [currentIndex, setCurrentIndex] = useState(0);

  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmissionResult | null>(null);

  // 타이머 상태
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // SWR Mutation 훅
  const { trigger: saveAnswer } = useSWRMutation(
    `/api/assignments/student/${studentAssignmentId}/answers`,
    saveAnswerApi
  );

  const { trigger: submitTrigger } = useSWRMutation(
    `/api/assignments/student/${studentAssignmentId}/submit`,
    submitAssignmentApi
  );

  const { trigger: uploadImage, isMutating: isUploading } = useSWRMutation(
    `/api/assignments/student/${studentAssignmentId}/upload`,
    uploadImageApi
  );

  // 현재 문제
  const currentProblem = useMemo(
    () => problems[currentIndex],
    [problems, currentIndex]
  );

  // 현재 답안
  const currentAnswer = useMemo(
    () => answers.get(currentProblem?.id || ''),
    [answers, currentProblem]
  );

  // 진행률 계산
  const progress = useMemo(() => {
    const answeredCount = Array.from(answers.values()).filter(
      (a) => a.answer && a.answer.trim().length > 0
    ).length;
    return {
      answered: answeredCount,
      total: problems.length,
      percentage: problems.length > 0 ? Math.round((answeredCount / problems.length) * 100) : 0,
    };
  }, [answers, problems.length]);

  // 답안 업데이트
  const updateAnswer = useCallback(
    async (problemId: string, answer: string, imageUrl?: string) => {
      const newAnswer: Answer = {
        problem_id: problemId,
        answer,
        answered_at: new Date().toISOString(),
        image_url: imageUrl,
      };

      setAnswers((prev) => {
        const newMap = new Map(prev);
        newMap.set(problemId, newAnswer);
        return newMap;
      });

      // 자동 저장
      if (autoSave) {
        try {
          await saveAnswer({
            problem_id: problemId,
            answer,
            image_url: imageUrl,
          });
        } catch (error) {
          console.error('답안 자동 저장 실패:', error);
        }
      }
    },
    [autoSave, saveAnswer]
  );

  // 객관식 답안 선택
  const selectChoice = useCallback(
    (problemId: string, choiceId: number) => {
      updateAnswer(problemId, choiceId.toString());
    },
    [updateAnswer]
  );

  // 단답형/서술형 답안 입력
  const inputAnswer = useCallback(
    (problemId: string, text: string) => {
      updateAnswer(problemId, text);
    },
    [updateAnswer]
  );

  // 손글씨 이미지 업로드 (OCR 연동)
  const uploadHandwritingImage = useCallback(
    async (problemId: string, imageBase64: string, processOcr: boolean = true) => {
      try {
        const result = await uploadImage({
          image: imageBase64,
          processOcr,
        });

        if (result?.success && result.url) {
          // OCR 결과가 있으면 답안으로 설정
          const answer = result.ocrResult?.text || '';
          await updateAnswer(problemId, answer, result.url);

          return {
            success: true,
            url: result.url,
            ocrText: result.ocrResult?.text,
            confidence: result.ocrResult?.confidence,
          };
        }

        return { success: false, error: result?.error || '업로드 실패' };
      } catch (error) {
        console.error('이미지 업로드 오류:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '업로드 오류',
        };
      }
    },
    [uploadImage, updateAnswer]
  );

  // 이전 문제로 이동
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // 다음 문제로 이동
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(problems.length - 1, prev + 1));
  }, [problems.length]);

  // 특정 문제로 이동
  const goToProblem = useCallback(
    (index: number) => {
      if (index >= 0 && index < problems.length) {
        setCurrentIndex(index);
      }
    },
    [problems.length]
  );

  // 과제 제출
  const submitAssignment = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const answerArray = Array.from(answers.values());
      const result = await submitTrigger({ answers: answerArray });
      setSubmitResult(result);
      return result;
    } catch (error) {
      const errorResult: SubmissionResult = {
        success: false,
        error: error instanceof Error ? error.message : '제출 오류',
      };
      setSubmitResult(errorResult);
      return errorResult;
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, submitTrigger]);

  // 타이머 제어
  const pauseTimer = useCallback(() => setIsPaused(true), []);
  const resumeTimer = useCallback(() => setIsPaused(false), []);
  const resetTimer = useCallback(() => {
    setElapsedTime(0);
    setIsPaused(false);
  }, []);

  // 답안 초기화
  const resetAnswers = useCallback(() => {
    setAnswers(new Map());
    setCurrentIndex(0);
    setSubmitResult(null);
  }, []);

  // 모든 답안을 배열로 반환
  const getAllAnswers = useCallback(() => {
    return Array.from(answers.values());
  }, [answers]);

  // 특정 문제의 답안 가져오기
  const getAnswer = useCallback(
    (problemId: string) => {
      return answers.get(problemId);
    },
    [answers]
  );

  // 미답변 문제 목록
  const unansweredProblems = useMemo(() => {
    return problems.filter(
      (p) => !answers.has(p.id) || !answers.get(p.id)?.answer?.trim()
    );
  }, [problems, answers]);

  return {
    // 상태
    answers: getAllAnswers(),
    currentProblem,
    currentAnswer,
    currentIndex,
    progress,
    isSubmitting,
    isUploading,
    submitResult,
    elapsedTime,
    isPaused,
    unansweredProblems,

    // 답안 관리
    updateAnswer,
    selectChoice,
    inputAnswer,
    getAnswer,
    resetAnswers,

    // 이미지/OCR
    uploadHandwritingImage,

    // 네비게이션
    goToPrevious,
    goToNext,
    goToProblem,

    // 제출
    submitAssignment,

    // 타이머
    pauseTimer,
    resumeTimer,
    resetTimer,
    setElapsedTime,
  };
}

// 기본 export
export default useSubmission;
