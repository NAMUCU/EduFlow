/**
 * EduFlow 채점 컴포넌트 모듈
 *
 * 채점 결과 표시 관련 컴포넌트들을 내보냅니다.
 */

// 채점 결과 표시 컴포넌트
export { GradingResult, default as GradingResultDefault } from './GradingResult';
export type { ProblemGradingResult, SolutionStep } from './GradingResult';

// 채점 요약 컴포넌트
export { GradingSummary, default as GradingSummaryDefault } from './GradingSummary';
export type { GradingSummaryData } from './GradingSummary';
