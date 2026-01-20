'use client';

import { useState, memo } from 'react';
import { X, Check, MessageSquare } from 'lucide-react';
import { StudentAssignmentDetail } from '@/types/assignment';

interface GradingModalProps {
  studentAssignment: StudentAssignmentDetail;
  onClose: () => void;
  onComplete: () => void;
}

export const GradingModal = memo(function GradingModal({
  studentAssignment,
  onClose,
  onComplete,
}: GradingModalProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: 채점 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onComplete();
    } catch (error) {
      console.error('채점 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">채점하기</h2>
            <p className="text-sm text-gray-500">
              {studentAssignment.student.user.name} 학생의 답안을 채점합니다
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* 답안 목록 */}
          <div className="space-y-4 mb-6">
            {studentAssignment.answers?.map((answer, index) => (
              <div key={answer.problem_id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    문제 {index + 1}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="점수"
                    value={scores[answer.problem_id] || ''}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [answer.problem_id]: Number(e.target.value),
                      }))
                    }
                    className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-right"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  <span className="text-gray-400">답안:</span> {answer.answer}
                </p>
              </div>
            ))}
          </div>

          {/* 피드백 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4" />
              피드백
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="학생에게 전달할 피드백을 입력하세요..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            채점 완료
          </button>
        </div>
      </div>
    </div>
  );
});
