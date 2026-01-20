'use client';

/**
 * OCR 결과 표시 컴포넌트
 *
 * Vercel React Best Practices 적용:
 * - rerender-memo: React.memo로 불필요한 리렌더링 방지
 * - rerender-functional-setstate: 함수형 setState로 안정적인 콜백 참조
 */

import React, { useState, useCallback, memo } from 'react';
import {
  FileText,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ExtractedProblem } from '@/lib/ocr';

// UI 텍스트 상수
const UI_TEXT = {
  title: '인식된 텍스트',
  editMode: '편집 모드',
  viewMode: '보기 모드',
  extractedProblems: '추출된 문제',
  problemCount: '개의 문제가 추출되었습니다.',
  noProblems: '추출된 문제가 없습니다.',
  editProblem: '문제 편집',
  saveProblem: '저장',
  cancelEdit: '취소',
  convertToProblems: '문제로 변환',
  copyText: '텍스트 복사',
  copied: '복사됨!',
  problemTypes: {
    객관식: '객관식',
    주관식: '주관식',
    서술형: '서술형',
  },
  choices: '보기',
  confidence: '인식 정확도',
  reExtract: '문제 다시 추출',
};

// 문제 유형 배지 색상
const PROBLEM_TYPE_COLORS = {
  객관식: 'bg-blue-100 text-blue-700',
  주관식: 'bg-green-100 text-green-700',
  서술형: 'bg-purple-100 text-purple-700',
};

interface OcrResultProps {
  text: string;
  confidence: number;
  problems: ExtractedProblem[];
  onTextChange?: (text: string) => void;
  onProblemsChange?: (problems: ExtractedProblem[]) => void;
  onConvertToProblems?: () => void;
  isLoading?: boolean;
}

// OcrResult 컴포넌트
function OcrResultComponent({
  text,
  confidence,
  problems,
  onTextChange,
  onProblemsChange,
  onConvertToProblems,
  isLoading = false,
}: OcrResultProps) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [editedProblem, setEditedProblem] = useState<ExtractedProblem | null>(null);
  const [expandedProblems, setExpandedProblems] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // 텍스트 편집 저장
  const handleSaveText = useCallback(() => {
    onTextChange?.(editedText);
    setIsEditingText(false);
  }, [editedText, onTextChange]);

  // 텍스트 편집 취소
  const handleCancelTextEdit = useCallback(() => {
    setEditedText(text);
    setIsEditingText(false);
  }, [text]);

  // 문제 편집 시작
  const handleStartEditProblem = useCallback((problem: ExtractedProblem) => {
    setEditingProblemId(problem.number);
    setEditedProblem({ ...problem });
  }, []);

  // 문제 편집 저장
  const handleSaveProblem = useCallback(() => {
    if (!editedProblem) return;

    const updatedProblems = problems.map((p) =>
      p.number === editedProblem.number ? editedProblem : p
    );
    onProblemsChange?.(updatedProblems);
    setEditingProblemId(null);
    setEditedProblem(null);
  }, [editedProblem, problems, onProblemsChange]);

  // 문제 편집 취소
  const handleCancelProblemEdit = useCallback(() => {
    setEditingProblemId(null);
    setEditedProblem(null);
  }, []);

  // 문제 확장/축소 토글 (rerender-functional-setstate 적용)
  const toggleProblemExpand = useCallback((problemNumber: string) => {
    setExpandedProblems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(problemNumber)) {
        newSet.delete(problemNumber);
      } else {
        newSet.add(problemNumber);
      }
      return newSet;
    });
  }, []);

  // 텍스트 복사 (rerender-functional-setstate 적용)
  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  }, [text]);

  // 인식 정확도 색상
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'text-green-600';
    if (conf >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* 인식된 텍스트 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{UI_TEXT.title}</h3>
              <p className={`text-sm ${getConfidenceColor(confidence)}`}>
                {UI_TEXT.confidence}: {Math.round(confidence * 100)}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">{UI_TEXT.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{UI_TEXT.copyText}</span>
                </>
              )}
            </button>

            {!isEditingText ? (
              <button
                onClick={() => setIsEditingText(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>{UI_TEXT.editMode}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveText}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{UI_TEXT.saveProblem}</span>
                </button>
                <button
                  onClick={handleCancelTextEdit}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>{UI_TEXT.cancelEdit}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          {isEditingText ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder="인식된 텍스트..."
            />
          ) : (
            <pre className="w-full h-64 p-4 bg-gray-50 rounded-lg overflow-auto whitespace-pre-wrap font-mono text-sm text-gray-700">
              {text}
            </pre>
          )}
        </div>

        {/* 문제로 변환 버튼 */}
        {onConvertToProblems && (
          <div className="px-4 pb-4">
            <button
              onClick={onConvertToProblems}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">
                {isLoading ? '추출 중...' : UI_TEXT.convertToProblems}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 추출된 문제 섹션 */}
      {problems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{UI_TEXT.extractedProblems}</h3>
                <p className="text-sm text-gray-500">
                  {problems.length}
                  {UI_TEXT.problemCount}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {problems.map((problem) => {
              const isEditing = editingProblemId === problem.number;
              const isExpanded = expandedProblems.has(problem.number);

              return (
                <div key={problem.number} className="p-4">
                  {/* 문제 헤더 */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                          {problem.number}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            PROBLEM_TYPE_COLORS[problem.type]
                          }`}
                        >
                          {UI_TEXT.problemTypes[problem.type]}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            value={editedProblem?.content || ''}
                            onChange={(e) =>
                              setEditedProblem((prev) =>
                                prev ? { ...prev, content: e.target.value } : null
                              )
                            }
                            className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
                          />

                          {editedProblem?.choices && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                {UI_TEXT.choices}
                              </label>
                              {editedProblem.choices.map((choice, index) => (
                                <input
                                  key={index}
                                  type="text"
                                  value={choice}
                                  onChange={(e) => {
                                    const newChoices = [...(editedProblem.choices || [])];
                                    newChoices[index] = e.target.value;
                                    setEditedProblem((prev) =>
                                      prev ? { ...prev, choices: newChoices } : null
                                    );
                                  }}
                                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                  placeholder={`보기 ${index + 1}`}
                                />
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSaveProblem}
                              className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              <span>{UI_TEXT.saveProblem}</span>
                            </button>
                            <button
                              onClick={handleCancelProblemEdit}
                              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>{UI_TEXT.cancelEdit}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p
                            className={`text-gray-700 ${
                              !isExpanded && problem.content.length > 150 ? 'line-clamp-3' : ''
                            }`}
                          >
                            {problem.content}
                          </p>

                          {problem.choices && problem.choices.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {problem.choices.map((choice, index) => (
                                <p key={index} className="text-sm text-gray-600">
                                  {['①', '②', '③', '④', '⑤'][index]} {choice}
                                </p>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEditProblem(problem)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title={UI_TEXT.editProblem}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {problem.content.length > 150 && (
                          <button
                            onClick={() => toggleProblemExpand(problem.number)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 문제가 없을 때 */}
      {problems.length === 0 && text && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-700">{UI_TEXT.noProblems}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// React.memo로 감싸서 props가 변경되지 않으면 리렌더링 방지
const OcrResult = memo(OcrResultComponent);
OcrResult.displayName = 'OcrResult';

export default OcrResult;
