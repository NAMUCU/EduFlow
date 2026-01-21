import { NextRequest, NextResponse } from 'next/server';

// 문의 상태 타입
type InquiryStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

// 문의 유형 타입
type InquiryType = 'bug' | 'feature' | 'billing' | 'account' | 'general';

// 문의 인터페이스
interface SupportInquiry {
  id: string;
  academy_id: string;
  academy_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  type: InquiryType;
  status: InquiryStatus;
  subject: string;
  content: string;
  replies: SupportReply[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

// 답변 인터페이스
interface SupportReply {
  id: string;
  inquiry_id: string;
  admin_id: string;
  admin_name: string;
  content: string;
  created_at: string;
}

// Mock 데이터
const mockInquiries: SupportInquiry[] = [
  {
    id: 'inq_001',
    academy_id: 'acad_001',
    academy_name: '스마트수학학원',
    user_id: 'user_001',
    user_name: '김원장',
    user_email: 'kim@smartmath.com',
    type: 'bug',
    status: 'pending',
    subject: '문제 생성 시 오류 발생',
    content: '수학 문제 생성 시 "서버 오류"라는 메시지가 나타납니다. 어제부터 계속 발생하고 있습니다.',
    replies: [],
    created_at: '2026-01-20T10:30:00Z',
    updated_at: '2026-01-20T10:30:00Z',
    resolved_at: null,
  },
  {
    id: 'inq_002',
    academy_id: 'acad_002',
    academy_name: '영재학원',
    user_id: 'user_002',
    user_name: '이선생',
    user_email: 'lee@youngjae.com',
    type: 'feature',
    status: 'in_progress',
    subject: '학부모 알림 기능 추가 요청',
    content: '학생의 출석 현황을 학부모에게 자동으로 알림 보내는 기능이 있으면 좋겠습니다.',
    replies: [
      {
        id: 'reply_001',
        inquiry_id: 'inq_002',
        admin_id: 'admin_001',
        admin_name: '관리자',
        content: '좋은 제안 감사합니다. 개발팀에 전달하여 검토 중입니다.',
        created_at: '2026-01-19T14:00:00Z',
      },
    ],
    created_at: '2026-01-18T09:15:00Z',
    updated_at: '2026-01-19T14:00:00Z',
    resolved_at: null,
  },
  {
    id: 'inq_003',
    academy_id: 'acad_003',
    academy_name: '미래학원',
    user_id: 'user_003',
    user_name: '박원장',
    user_email: 'park@mirae.com',
    type: 'billing',
    status: 'resolved',
    subject: '결제 영수증 재발급 요청',
    content: '지난달 결제 영수증을 분실했습니다. 재발급 가능한가요?',
    replies: [
      {
        id: 'reply_002',
        inquiry_id: 'inq_003',
        admin_id: 'admin_001',
        admin_name: '관리자',
        content: '영수증을 등록하신 이메일로 재발급해 드렸습니다. 확인 부탁드립니다.',
        created_at: '2026-01-17T11:30:00Z',
      },
    ],
    created_at: '2026-01-17T10:00:00Z',
    updated_at: '2026-01-17T11:30:00Z',
    resolved_at: '2026-01-17T11:30:00Z',
  },
  {
    id: 'inq_004',
    academy_id: 'acad_001',
    academy_name: '스마트수학학원',
    user_id: 'user_004',
    user_name: '최강사',
    user_email: 'choi@smartmath.com',
    type: 'account',
    status: 'pending',
    subject: '강사 계정 권한 문의',
    content: '강사 계정으로 학생 성적 입력이 안됩니다. 권한 설정이 필요한가요?',
    replies: [],
    created_at: '2026-01-21T08:45:00Z',
    updated_at: '2026-01-21T08:45:00Z',
    resolved_at: null,
  },
  {
    id: 'inq_005',
    academy_id: 'acad_004',
    academy_name: '성공학원',
    user_id: 'user_005',
    user_name: '정원장',
    user_email: 'jung@success.com',
    type: 'general',
    status: 'closed',
    subject: '서비스 이용 방법 문의',
    content: '처음 사용하는데 기본적인 사용법을 알고 싶습니다.',
    replies: [
      {
        id: 'reply_003',
        inquiry_id: 'inq_005',
        admin_id: 'admin_002',
        admin_name: '고객지원팀',
        content: '안녕하세요! 사용 가이드 문서를 이메일로 발송해 드렸습니다. 추가 문의사항 있으시면 언제든 연락주세요.',
        created_at: '2026-01-15T16:20:00Z',
      },
    ],
    created_at: '2026-01-15T14:30:00Z',
    updated_at: '2026-01-15T16:20:00Z',
    resolved_at: '2026-01-15T16:20:00Z',
  },
];

// GET: 문의 목록 조회 (상태, 유형 필터)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as InquiryStatus | null;
    const type = searchParams.get('type') as InquiryType | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredInquiries = [...mockInquiries];

    // 상태 필터
    if (status) {
      filteredInquiries = filteredInquiries.filter((inq) => inq.status === status);
    }

    // 유형 필터
    if (type) {
      filteredInquiries = filteredInquiries.filter((inq) => inq.type === type);
    }

    // 최신순 정렬
    filteredInquiries.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 페이지네이션
    const total = filteredInquiries.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInquiries = filteredInquiries.slice(startIndex, endIndex);

    // 상태별 카운트
    const statusCounts = {
      pending: mockInquiries.filter((inq) => inq.status === 'pending').length,
      in_progress: mockInquiries.filter((inq) => inq.status === 'in_progress').length,
      resolved: mockInquiries.filter((inq) => inq.status === 'resolved').length,
      closed: mockInquiries.filter((inq) => inq.status === 'closed').length,
    };

    // 유형별 카운트
    const typeCounts = {
      bug: mockInquiries.filter((inq) => inq.type === 'bug').length,
      feature: mockInquiries.filter((inq) => inq.type === 'feature').length,
      billing: mockInquiries.filter((inq) => inq.type === 'billing').length,
      account: mockInquiries.filter((inq) => inq.type === 'account').length,
      general: mockInquiries.filter((inq) => inq.type === 'general').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        inquiries: paginatedInquiries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          statusCounts,
          typeCounts,
        },
      },
    });
  } catch (error) {
    console.error('문의 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '문의 목록을 불러오는 데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 문의 답변
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inquiry_id, content, admin_id, admin_name } = body;

    // 필수 필드 검증
    if (!inquiry_id || !content) {
      return NextResponse.json(
        { success: false, error: '문의 ID와 답변 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 문의 존재 확인
    const inquiry = mockInquiries.find((inq) => inq.id === inquiry_id);
    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: '해당 문의를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 새 답변 생성
    const newReply: SupportReply = {
      id: `reply_${Date.now()}`,
      inquiry_id,
      admin_id: admin_id || 'admin_001',
      admin_name: admin_name || '관리자',
      content,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        reply: newReply,
        message: '답변이 등록되었습니다.',
      },
    });
  } catch (error) {
    console.error('문의 답변 등록 오류:', error);
    return NextResponse.json(
      { success: false, error: '답변 등록에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 문의 상태 변경
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { inquiry_id, status, note } = body;

    // 필수 필드 검증
    if (!inquiry_id || !status) {
      return NextResponse.json(
        { success: false, error: '문의 ID와 상태는 필수입니다.' },
        { status: 400 }
      );
    }

    // 유효한 상태 확인
    const validStatuses: InquiryStatus[] = ['pending', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    // 문의 존재 확인
    const inquiry = mockInquiries.find((inq) => inq.id === inquiry_id);
    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: '해당 문의를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 상태 변경 (Mock - 실제로는 DB 업데이트)
    const updatedInquiry = {
      ...inquiry,
      status,
      updated_at: new Date().toISOString(),
      resolved_at: status === 'resolved' ? new Date().toISOString() : inquiry.resolved_at,
    };

    // 상태별 메시지
    const statusMessages: Record<InquiryStatus, string> = {
      pending: '대기 상태로 변경되었습니다.',
      in_progress: '처리 중 상태로 변경되었습니다.',
      resolved: '해결 완료 상태로 변경되었습니다.',
      closed: '종료 상태로 변경되었습니다.',
    };

    return NextResponse.json({
      success: true,
      data: {
        inquiry: updatedInquiry,
        message: statusMessages[status as InquiryStatus],
        note: note || null,
      },
    });
  } catch (error) {
    console.error('문의 상태 변경 오류:', error);
    return NextResponse.json(
      { success: false, error: '상태 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
