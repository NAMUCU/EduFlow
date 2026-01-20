/**
 * EduFlow 알림 관련 타입 정의
 *
 * 알림 시스템에서 사용되는 모든 타입을 정의합니다.
 * 과제, 성적, 출결, 공지, 시스템 알림을 지원합니다.
 */

// 알림 유형
export type NotificationType =
  | 'assignment'  // 과제 관련 (과제 생성, 제출 기한 등)
  | 'grade'       // 성적 관련 (성적 등록, 피드백 등)
  | 'attendance'  // 출결 관련 (출석, 결석, 지각 등)
  | 'notice'      // 공지 관련 (학원 공지, 수업 공지 등)
  | 'system';     // 시스템 관련 (계정, 업데이트 등)

// 알림 우선순위
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// 알림 인터페이스
export interface Notification {
  id: string;                     // 고유 ID
  type: NotificationType;         // 알림 유형
  title: string;                  // 알림 제목
  message: string;                // 알림 내용
  userId: string;                 // 수신자 ID
  senderId?: string;              // 발신자 ID (선택)
  senderName?: string;            // 발신자 이름 (선택)
  isRead: boolean;                // 읽음 여부
  priority: NotificationPriority; // 우선순위
  link?: string;                  // 관련 페이지 링크 (선택)
  metadata?: NotificationMetadata; // 추가 정보 (선택)
  createdAt: string;              // 생성일
  readAt?: string;                // 읽은 시간 (선택)
}

// 알림 메타데이터 (유형별 추가 정보)
export interface NotificationMetadata {
  // 과제 관련
  assignmentId?: string;
  assignmentTitle?: string;
  dueDate?: string;

  // 성적 관련
  subject?: string;
  score?: number;
  maxScore?: number;

  // 출결 관련
  attendanceDate?: string;
  attendanceStatus?: 'present' | 'absent' | 'late' | 'excused';

  // 공지 관련
  noticeId?: string;
  noticeCategory?: string;

  // 시스템 관련
  systemAction?: string;
}

// 알림 생성 요청 타입
export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  senderId?: string;
  senderName?: string;
  priority?: NotificationPriority;
  link?: string;
  metadata?: NotificationMetadata;
}

// 알림 목록 필터 타입
export interface NotificationFilter {
  type?: NotificationType;        // 알림 유형 필터
  isRead?: boolean;               // 읽음 상태 필터
  priority?: NotificationPriority; // 우선순위 필터
  startDate?: string;             // 시작 날짜
  endDate?: string;               // 종료 날짜
}

// 알림 목록 응답 타입
export interface NotificationListResponse {
  notifications: Notification[];  // 알림 목록
  total: number;                  // 전체 개수
  unreadCount: number;            // 안읽은 개수
  page: number;                   // 현재 페이지
  pageSize: number;               // 페이지 크기
}

// 알림 통계 타입
export interface NotificationStats {
  total: number;                  // 전체 알림 수
  unread: number;                 // 안읽은 알림 수
  byType: Record<NotificationType, number>;  // 유형별 개수
}

// 알림 유형별 한글 라벨
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  assignment: '과제',
  grade: '성적',
  attendance: '출결',
  notice: '공지',
  system: '시스템',
};

// 알림 우선순위별 한글 라벨
export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  urgent: '긴급',
};
