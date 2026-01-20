'use client';

/**
 * 상담 기록 모달 컴포넌트
 *
 * bundle-dynamic-imports 패턴 적용: 모달은 필요할 때만 로드됩니다.
 */

import { memo, useCallback } from 'react';
import { X } from 'lucide-react';
import { ConsultationDetail } from '@/types/consultation';
import { ConsultationStatus } from '@/types/database';

interface ConsultationRecordData {
  notes: string;
  status: ConsultationStatus;
}

interface ConsultationRecordModalProps {
  consultation: ConsultationDetail;
  recordData: ConsultationRecordData;
  onRecordChange: (data: ConsultationRecordData) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSaving: boolean;
}

/**
 * 상담 기록 모달
 *
 * rerender-memo 패턴 적용: props가 변경되지 않으면 리렌더링하지 않습니다.
 */
const ConsultationRecordModal = memo(function ConsultationRecordModal({
  consultation,
  recordData,
  onRecordChange,
  onSubmit,
  onClose,
  isSaving,
}: ConsultationRecordModalProps) {
  // rerender-functional-setstate: 필드별 업데이트 핸들러
  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onRecordChange({ ...recordData, notes: e.target.value });
    },
    [recordData, onRecordChange]
  );

  const handleStatusChange = useCallback(
    (status: ConsultationStatus) => {
      onRecordChange({ ...recordData, status });
    },
    [recordData, onRecordChange]
  );

  const isValid = recordData.notes.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">상담 기록 작성</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 상담 정보 요약 */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-sm text-gray-500">
              {consultation.student.name} ({consultation.student.grade})
            </p>
            <p className="font-medium text-gray-900 mt-1">{consultation.topic}</p>
          </div>

          {/* 상담 기록 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상담 내용 *</label>
            <textarea
              value={recordData.notes}
              onChange={handleNotesChange}
              rows={6}
              placeholder="상담 내용을 기록하세요..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* 상태 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상담 상태</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="completed"
                  checked={recordData.status === 'completed'}
                  onChange={() => handleStatusChange('completed')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">완료</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="scheduled"
                  checked={recordData.status === 'scheduled'}
                  onChange={() => handleStatusChange('scheduled')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">예약 유지</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={isSaving || !isValid}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ConsultationRecordModal;
