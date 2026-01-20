'use client';

/**
 * 상담 카드 컴포넌트
 *
 * rerender-memo 패턴 적용: 개별 상담 카드를 메모이제이션합니다.
 */

import { memo } from 'react';
import { Users, Phone, Video } from 'lucide-react';
import {
  ConsultationListItem,
  CONSULTATION_TYPE_COLORS,
  CONSULTATION_STATUS_COLORS,
  formatDuration,
} from '@/types/consultation';
import {
  ConsultationType,
  CONSULTATION_TYPE_LABELS,
  CONSULTATION_STATUS_LABELS,
} from '@/types/database';

// 상담 유형 아이콘
const TYPE_ICONS: Record<ConsultationType, React.ReactNode> = {
  in_person: <Users className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
};

interface ConsultationCardProps {
  consultation: ConsultationListItem;
  onClick: (id: string) => void;
}

/**
 * 상담 카드 (사이드바용)
 *
 * rerender-memo 패턴 적용: consultation과 onClick이 변경되지 않으면 리렌더링하지 않습니다.
 */
export const ConsultationCard = memo(function ConsultationCard({
  consultation,
  onClick,
}: ConsultationCardProps) {
  const handleClick = () => {
    onClick(consultation.id);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{consultation.time}</span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${CONSULTATION_TYPE_COLORS[consultation.type]}`}
        >
          {TYPE_ICONS[consultation.type]}
          {CONSULTATION_TYPE_LABELS[consultation.type]}
        </span>
      </div>
      <div className="text-sm text-gray-900">{consultation.studentName}</div>
      <div className="text-sm text-gray-500">{consultation.topic}</div>
      <div className="flex items-center gap-2 mt-2">
        <span className={`px-2 py-0.5 rounded-full text-xs ${CONSULTATION_STATUS_COLORS[consultation.status]}`}>
          {CONSULTATION_STATUS_LABELS[consultation.status]}
        </span>
        <span className="text-xs text-gray-400">{formatDuration(consultation.duration)}</span>
      </div>
    </button>
  );
});

/**
 * 상담 카드 (예정 목록용)
 *
 * rerender-memo 패턴 적용: consultation과 onClick이 변경되지 않으면 리렌더링하지 않습니다.
 */
export const UpcomingConsultationCard = memo(function UpcomingConsultationCard({
  consultation,
  onClick,
}: ConsultationCardProps) {
  const handleClick = () => {
    onClick(consultation.id);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${CONSULTATION_TYPE_COLORS[consultation.type]}`}>
          {TYPE_ICONS[consultation.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{consultation.studentName}</div>
          <div className="text-xs text-gray-500">
            {new Date(consultation.date).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}{' '}
            {consultation.time}
          </div>
        </div>
      </div>
    </button>
  );
});

export default ConsultationCard;
