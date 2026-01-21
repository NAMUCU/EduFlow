import { NextRequest, NextResponse } from 'next/server';

// 공지 타입
type NoticeType = 'system' | 'update' | 'maintenance' | 'event' | 'important';

// 공지 상태
type NoticeStatus = 'draft' | 'published' | 'scheduled' | 'expired';

// 공지 대상
type NoticeTarget = 'all' | 'academy_admin' | 'teacher' | 'student' | 'parent';

// 공지 인터페이스
interface Notice {
  id: string;
  title: string;
  content: string;
  type: NoticeType;
  status: NoticeStatus;
  target: NoticeTarget[];
  isPinned: boolean;
  viewCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  expiresAt: string | null;
}

// Mock 공지 데이터
const mockNotices: Notice[] = [
  {
    id: 'notice-001',
    title: '[긴급] 서버 점검 안내',
    content: '안녕하세요. EduFlow 운영팀입니다.\n\n2024년 1월 25일(목) 02:00 ~ 06:00 동안 서버 점검이 진행됩니다.\n\n점검 시간 동안 서비스 이용이 불가하오니, 양해 부탁드립니다.\n\n감사합니다.',
    type: 'maintenance',
    status: 'published',
    target: ['all'],
    isPinned: true,
    viewCount: 1523,
    createdBy: 'admin@eduflow.com',
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-20T09:00:00Z',
    publishedAt: '2024-01-20T09:00:00Z',
    scheduledAt: null,
    expiresAt: '2024-01-26T00:00:00Z',
  },
  {
    id: 'notice-002',
    title: 'EduFlow v2.5 업데이트 안내',
    content: '## 주요 업데이트 내용\n\n### 새로운 기능\n- AI 문제 생성 정확도 향상\n- 학생 성적 분석 리포트 추가\n- 카카오톡 알림 기능 개선\n\n### 버그 수정\n- 로그인 시 간헐적 오류 해결\n- PDF 출력 형식 개선\n- 모바일 UI 최적화\n\n자세한 내용은 공식 문서를 참고해 주세요.',
    type: 'update',
    status: 'published',
    target: ['academy_admin', 'teacher'],
    isPinned: true,
    viewCount: 892,
    createdBy: 'admin@eduflow.com',
    createdAt: '2024-01-18T14:30:00Z',
    updatedAt: '2024-01-19T10:00:00Z',
    publishedAt: '2024-01-19T10:00:00Z',
    scheduledAt: null,
    expiresAt: null,
  },
  {
    id: 'notice-003',
    title: '설 연휴 고객센터 운영 안내',
    content: '안녕하세요. EduFlow입니다.\n\n설 연휴 기간 고객센터 운영 안내드립니다.\n\n- 휴무 기간: 2월 9일(금) ~ 2월 12일(월)\n- 정상 운영: 2월 13일(화)부터\n\n긴급 문의는 이메일(support@eduflow.com)로 부탁드립니다.\n\n즐거운 명절 보내세요!',
    type: 'event',
    status: 'scheduled',
    target: ['all'],
    isPinned: false,
    viewCount: 0,
    createdBy: 'support@eduflow.com',
    createdAt: '2024-01-22T11:00:00Z',
    updatedAt: '2024-01-22T11:00:00Z',
    publishedAt: null,
    scheduledAt: '2024-02-01T09:00:00Z',
    expiresAt: '2024-02-13T00:00:00Z',
  },
  {
    id: 'notice-004',
    title: '개인정보처리방침 변경 안내',
    content: '안녕하세요. EduFlow입니다.\n\n개인정보처리방침이 아래와 같이 변경됨을 안내드립니다.\n\n## 주요 변경 사항\n\n1. 개인정보 수집 항목 변경\n2. 제3자 제공 관련 내용 추가\n3. 개인정보 보관 기간 명시\n\n변경된 방침은 2024년 2월 1일부터 시행됩니다.\n\n자세한 내용은 개인정보처리방침 페이지에서 확인하실 수 있습니다.',
    type: 'important',
    status: 'published',
    target: ['all'],
    isPinned: false,
    viewCount: 456,
    createdBy: 'admin@eduflow.com',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    publishedAt: '2024-01-15T10:00:00Z',
    scheduledAt: null,
    expiresAt: null,
  },
  {
    id: 'notice-005',
    title: '2024년 신규 요금제 안내',
    content: '## 2024년 새로운 요금제를 소개합니다!\n\n### Basic (월 49,000원)\n- 학생 50명까지\n- AI 문제 생성 100회/월\n- 기본 리포트\n\n### Standard (월 99,000원)\n- 학생 200명까지\n- AI 문제 생성 500회/월\n- 상세 분석 리포트\n- 카카오 알림\n\n### Premium (월 199,000원)\n- 학생 무제한\n- AI 문제 생성 무제한\n- 맞춤형 리포트\n- 전담 매니저 배정\n\n기존 고객님께는 1개월 무료 혜택을 드립니다!',
    type: 'system',
    status: 'published',
    target: ['academy_admin'],
    isPinned: false,
    viewCount: 1205,
    createdBy: 'sales@eduflow.com',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T15:00:00Z',
    publishedAt: '2024-01-10T09:00:00Z',
    scheduledAt: null,
    expiresAt: null,
  },
  {
    id: 'notice-006',
    title: '모바일 앱 출시 예정 안내',
    content: '안녕하세요. EduFlow입니다.\n\n많은 분들이 기다리셨던 모바일 앱이 곧 출시됩니다!\n\n### 출시 일정\n- iOS: 2024년 3월 예정\n- Android: 2024년 3월 예정\n\n### 주요 기능\n- 실시간 알림 수신\n- 간편 출결 관리\n- 성적 조회\n- 학부모 전용 모드\n\n사전 등록 이벤트도 진행 예정이니 많은 관심 부탁드립니다!',
    type: 'event',
    status: 'draft',
    target: ['all'],
    isPinned: false,
    viewCount: 0,
    createdBy: 'marketing@eduflow.com',
    createdAt: '2024-01-22T16:00:00Z',
    updatedAt: '2024-01-22T16:00:00Z',
    publishedAt: null,
    scheduledAt: null,
    expiresAt: null,
  },
];

// 공지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 필터 파라미터
    const type = searchParams.get('type') as NoticeType | null;
    const status = searchParams.get('status') as NoticeStatus | null;
    const target = searchParams.get('target') as NoticeTarget | null;
    const search = searchParams.get('search');
    const isPinned = searchParams.get('isPinned');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let notices = [...mockNotices];

    // 필터 적용
    if (type) {
      notices = notices.filter(n => n.type === type);
    }

    if (status) {
      notices = notices.filter(n => n.status === status);
    }

    if (target) {
      notices = notices.filter(n => n.target.includes(target) || n.target.includes('all'));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      notices = notices.filter(
        n =>
          n.title.toLowerCase().includes(searchLower) ||
          n.content.toLowerCase().includes(searchLower)
      );
    }

    if (isPinned !== null) {
      notices = notices.filter(n => n.isPinned === (isPinned === 'true'));
    }

    // 정렬: 고정 먼저, 그 다음 최신순
    notices.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 페이지네이션
    const totalCount = notices.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedNotices = notices.slice(offset, offset + limit);

    // 통계
    const stats = {
      total: mockNotices.length,
      published: mockNotices.filter(n => n.status === 'published').length,
      draft: mockNotices.filter(n => n.status === 'draft').length,
      scheduled: mockNotices.filter(n => n.status === 'scheduled').length,
      expired: mockNotices.filter(n => n.status === 'expired').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        notices: paginatedNotices,
        stats,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('공지 목록 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '공지 목록을 조회하는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// 공지 작성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { title, content, type, target, isPinned, scheduledAt, expiresAt } = body;

    // 필수 필드 검증
    if (!title || !content || !type || !target) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 항목을 모두 입력해주세요. (제목, 내용, 유형, 대상)',
        },
        { status: 400 }
      );
    }

    // 새 공지 생성
    const now = new Date().toISOString();
    const newNotice: Notice = {
      id: `notice-${Date.now()}`,
      title,
      content,
      type,
      status: scheduledAt ? 'scheduled' : 'published',
      target: Array.isArray(target) ? target : [target],
      isPinned: isPinned || false,
      viewCount: 0,
      createdBy: 'admin@eduflow.com', // 실제로는 로그인한 사용자
      createdAt: now,
      updatedAt: now,
      publishedAt: scheduledAt ? null : now,
      scheduledAt: scheduledAt || null,
      expiresAt: expiresAt || null,
    };

    // Mock: 실제로는 DB에 저장
    mockNotices.unshift(newNotice);

    return NextResponse.json({
      success: true,
      data: newNotice,
      message: '공지가 성공적으로 등록되었습니다.',
    });
  } catch (error) {
    console.error('공지 작성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '공지를 등록하는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// 공지 수정
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const { id, title, content, type, status, target, isPinned, scheduledAt, expiresAt } = body;

    // ID 검증
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '수정할 공지 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // 공지 찾기
    const noticeIndex = mockNotices.findIndex(n => n.id === id);
    if (noticeIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 공지를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    const existingNotice = mockNotices[noticeIndex];
    const now = new Date().toISOString();

    // 공지 업데이트
    const updatedNotice: Notice = {
      ...existingNotice,
      title: title ?? existingNotice.title,
      content: content ?? existingNotice.content,
      type: type ?? existingNotice.type,
      status: status ?? existingNotice.status,
      target: target ? (Array.isArray(target) ? target : [target]) : existingNotice.target,
      isPinned: isPinned ?? existingNotice.isPinned,
      scheduledAt: scheduledAt !== undefined ? scheduledAt : existingNotice.scheduledAt,
      expiresAt: expiresAt !== undefined ? expiresAt : existingNotice.expiresAt,
      updatedAt: now,
      // 상태가 published로 변경되고 기존에 발행되지 않았다면 발행일 설정
      publishedAt:
        status === 'published' && !existingNotice.publishedAt
          ? now
          : existingNotice.publishedAt,
    };

    // Mock: 실제로는 DB에 업데이트
    mockNotices[noticeIndex] = updatedNotice;

    return NextResponse.json({
      success: true,
      data: updatedNotice,
      message: '공지가 성공적으로 수정되었습니다.',
    });
  } catch (error) {
    console.error('공지 수정 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '공지를 수정하는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// 공지 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // ID 검증
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '삭제할 공지 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // 공지 찾기
    const noticeIndex = mockNotices.findIndex(n => n.id === id);
    if (noticeIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 공지를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // Mock: 실제로는 DB에서 삭제
    const deletedNotice = mockNotices.splice(noticeIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: { id: deletedNotice.id },
      message: '공지가 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('공지 삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '공지를 삭제하는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
