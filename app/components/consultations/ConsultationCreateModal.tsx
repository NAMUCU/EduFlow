'use client';

/**
 * 상담 예약 모달 컴포넌트
 *
 * bundle-dynamic-imports 패턴 적용: 모달은 필요할 때만 로드됩니다.
 */

import { memo, useCallback } from 'react';
import { X } from 'lucide-react';
import {
  CreateConsultationInput,
  generateTimeSlots,
} from '@/types/consultation';
import { ConsultationType } from '@/types/database';
import { StudentOption } from '@/hooks/useConsultations';

interface ConsultationCreateModalProps {
  students: StudentOption[];
  formData: CreateConsultationInput;
  onFormChange: (data: CreateConsultationInput) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSaving: boolean;
}

/**
 * 상담 예약 모달
 *
 * rerender-memo 패턴 적용: props가 변경되지 않으면 리렌더링하지 않습니다.
 */
const ConsultationCreateModal = memo(function ConsultationCreateModal({
  students,
  formData,
  onFormChange,
  onSubmit,
  onClose,
  isSaving,
}: ConsultationCreateModalProps) {
  // rerender-functional-setstate: 각 필드별 업데이트 핸들러
  const handleStudentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFormChange({ ...formData, studentId: e.target.value });
    },
    [formData, onFormChange]
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFormChange({ ...formData, date: e.target.value });
    },
    [formData, onFormChange]
  );

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFormChange({ ...formData, time: e.target.value });
    },
    [formData, onFormChange]
  );

  const handleDurationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFormChange({ ...formData, duration: parseInt(e.target.value) });
    },
    [formData, onFormChange]
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFormChange({ ...formData, type: e.target.value as ConsultationType });
    },
    [formData, onFormChange]
  );

  const handleTopicChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFormChange({ ...formData, topic: e.target.value });
    },
    [formData, onFormChange]
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onFormChange({ ...formData, notes: e.target.value });
    },
    [formData, onFormChange]
  );

  const isValid = formData.studentId && formData.topic;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">상담 예약</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 학생 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">학생 선택 *</label>
            <select
              value={formData.studentId}
              onChange={handleStudentChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">학생을 선택하세요</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.grade} - {student.school})
                </option>
              ))}
            </select>
          </div>

          {/* 날짜 & 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">날짜 *</label>
              <input
                type="date"
                value={formData.date}
                onChange={handleDateChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">시간 *</label>
              <select
                value={formData.time}
                onChange={handleTimeChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {generateTimeSlots().map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 소요 시간 & 유형 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">소요 시간</label>
              <select
                value={formData.duration}
                onChange={handleDurationChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={15}>15분</option>
                <option value={20}>20분</option>
                <option value={30}>30분</option>
                <option value={45}>45분</option>
                <option value={60}>1시간</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상담 유형 *</label>
              <select
                value={formData.type}
                onChange={handleTypeChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="in_person">대면</option>
                <option value="phone">전화</option>
                <option value="video">화상</option>
              </select>
            </div>
          </div>

          {/* 상담 주제 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상담 주제 *</label>
            <input
              type="text"
              value={formData.topic}
              onChange={handleTopicChange}
              placeholder="예: 진도 상담, 학습 태도 상담"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">메모 (선택)</label>
            <textarea
              value={formData.notes || ''}
              onChange={handleNotesChange}
              rows={3}
              placeholder="상담 전 메모할 내용"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
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
            {isSaving ? '저장 중...' : '예약하기'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ConsultationCreateModal;
