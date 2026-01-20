/**
 * EduFlow 학원 내부 공지사항 타입 정의
 *
 * 학원에서 학생, 학부모, 선생님에게 전달하는 공지사항을 관리합니다.
 * 카테고리별 분류, 중요 공지 상단 고정, 대상자 지정 기능을 지원합니다.
 */

// 공지사항 카테고리
export type NoticeCategory =
  | 'general'      // 일반 공지
  | 'schedule'     // 시간표/일정
  | 'event'        // 행사/이벤트
  | 'exam'         // 시험/평가
  | 'holiday'      // 휴원/휴강
  | 'fee'          // 수강료/결제
  | 'urgent';      // 긴급 공지

// 공지사항 대상
export type NoticeTarget =
  | 'all'          // 전체
  | 'students'     // 학생만
  | 'parents'      // 학부모만
  | 'teachers';    // 선생님만

// 공지사항 상태
export type NoticeStatus =
  | 'draft'        // 임시저장
  | 'published'    // 게시됨
  | 'archived';    // 보관됨

// 공지사항 인터페이스
export interface AcademyNotice {
  id: string;                     // 고유 ID
  title: string;                  // 공지 제목
  content: string;                // 공지 내용
  category: NoticeCategory;       // 카테고리
  target: NoticeTarget;           // 대상
  status: NoticeStatus;           // 상태
  isPinned: boolean;              // 상단 고정 여부
  authorId: string;               // 작성자 ID
  authorName: string;             // 작성자 이름
  academyId: string;              // 학원 ID
  attachments?: NoticeAttachment[]; // 첨부파일 (선택)
  viewCount: number;              // 조회수
  createdAt: string;              // 생성일
  updatedAt: string;              // 수정일
  publishedAt?: string;           // 게시일 (선택)
}

// 첨부파일 인터페이스
export interface NoticeAttachment {
  id: string;                     // 고유 ID
  fileName: string;               // 파일명
  fileUrl: string;                // 파일 URL
  fileSize: number;               // 파일 크기 (bytes)
  fileType: string;               // 파일 타입 (MIME)
}

// 공지사항 생성 요청 타입
export interface CreateNoticeRequest {
  title: string;
  content: string;
  category: NoticeCategory;
  target: NoticeTarget;
  status?: NoticeStatus;
  isPinned?: boolean;
  authorId: string;
  authorName: string;
  academyId: string;
  attachments?: NoticeAttachment[];
}

// 공지사항 수정 요청 타입
export interface UpdateNoticeRequest {
  title?: string;
  content?: string;
  category?: NoticeCategory;
  target?: NoticeTarget;
  status?: NoticeStatus;
  isPinned?: boolean;
  attachments?: NoticeAttachment[];
}

// 공지사항 필터 타입
export interface NoticeFilter {
  category?: NoticeCategory;      // 카테고리 필터
  target?: NoticeTarget;          // 대상 필터
  status?: NoticeStatus;          // 상태 필터
  isPinned?: boolean;             // 고정 여부 필터
  search?: string;                // 검색어
  startDate?: string;             // 시작 날짜
  endDate?: string;               // 종료 날짜
}

// 공지사항 목록 응답 타입
export interface NoticeListResponse {
  notices: AcademyNotice[];       // 공지 목록
  total: number;                  // 전체 개수
  pinnedCount: number;            // 고정된 공지 개수
  page: number;                   // 현재 페이지
  pageSize: number;               // 페이지 크기
}

// 공지사항 카테고리별 한글 라벨
export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  general: '일반',
  schedule: '시간표/일정',
  event: '행사/이벤트',
  exam: '시험/평가',
  holiday: '휴원/휴강',
  fee: '수강료/결제',
  urgent: '긴급',
};

// 공지사항 대상별 한글 라벨
export const NOTICE_TARGET_LABELS: Record<NoticeTarget, string> = {
  all: '전체',
  students: '학생',
  parents: '학부모',
  teachers: '선생님',
};

// 공지사항 상태별 한글 라벨
export const NOTICE_STATUS_LABELS: Record<NoticeStatus, string> = {
  draft: '임시저장',
  published: '게시됨',
  archived: '보관됨',
};

// 공지사항 카테고리별 색상 (Tailwind CSS 클래스)
export const NOTICE_CATEGORY_COLORS: Record<NoticeCategory, string> = {
  general: 'bg-gray-100 text-gray-800',
  schedule: 'bg-blue-100 text-blue-800',
  event: 'bg-purple-100 text-purple-800',
  exam: 'bg-yellow-100 text-yellow-800',
  holiday: 'bg-green-100 text-green-800',
  fee: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};
