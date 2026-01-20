'use client';

/**
 * 상담 상세 모달 컴포넌트
 *
 * bundle-dynamic-imports 패턴 적용: 모달은 필요할 때만 로드됩니다.
 */

import { memo } from 'react';
import { X } from 'lucide-react';
import {
  ConsultationDetail,
  CONSULTATION_TYPE_COLORS,
  CONSULTATION_STATUS_COLORS,
  formatDuration,
} from '@/types/consultation';
import {
  ConsultationType,
  CONSULTATION_TYPE_LABELS,
  CONSULTATION_STATUS_LABELS,
} from '@/types/database';
import { Users, Phone, Video } from 'lucide-react';

// 상담 유형 아이콘
const TYPE_ICONS: Record<ConsultationType, React.ReactNode> = {
  in_person: <Users className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
};

interface ConsultationDetailModalProps {
  consultation: ConsultationDetail;
  onClose: () => void;
  onCancel: (id: string) => void;
  onRecord: () => void;
}

/**
 * 상담 상세 모달
 *
 * rerender-memo 패턴 적용: props가 변경되지 않으면 리렌더링하지 않습니다.
 */
const ConsultationDetailModal = memo(function ConsultationDetailModal({
  consultation,
  onClose,
  onCancel,
  onRecord,
}: ConsultationDetailModalProps) {
  const handleCancel = () => {
    if (confirm('상담을 취소하시겠습니까?')) {
      onCancel(consultation.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">상담 상세</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 상태 배지 */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${CONSULTATION_STATUS_COLORS[consultation.status]}`}
            >
              {CONSULTATION_STATUS_LABELS[consultation.status]}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${CONSULTATION_TYPE_COLORS[consultation.type]}`}
            >
              {TYPE_ICONS[consultation.type]}
              {CONSULTATION_TYPE_LABELS[consultation.type]}
            </span>
          </div>

          {/* 일시 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">일시</h3>
            <p className="text-lg text-gray-900">
              {new Date(consultation.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}{' '}
              {consultation.time}
            </p>
            <p className="text-sm text-gray-500">{formatDuration(consultation.duration)}</p>
          </div>

          {/* 학생 정보 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">학생</h3>
            <p className="text-lg text-gray-900">{consultation.student.name}</p>
            <p className="text-sm text-gray-500">
              {consultation.student.grade} - {consultation.student.school}
            </p>
          </div>

          {/* 학부모 정보 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">학부모</h3>
            <p className="text-lg text-gray-900">{consultation.parent.name}</p>
            <p className="text-sm text-gray-500">{consultation.parent.phone}</p>
          </div>

          {/* 상담 주제 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">상담 주제</h3>
            <p className="text-gray-900">{consultation.topic}</p>
          </div>

          {/* 상담 기록 */}
          {consultation.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">상담 기록</h3>
              <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">
                {consultation.notes}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-between">
          {consultation.status === 'scheduled' && (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                상담 취소
              </button>
              <button
                onClick={onRecord}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                기록 작성
              </button>
            </>
          )}
          {(consultation.status === 'completed' || consultation.status === 'cancelled') && (
            <button
              onClick={onClose}
              className="ml-auto px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default ConsultationDetailModal;
