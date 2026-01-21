'use client';

import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  X,
  Send,
  User,
  Building2,
  Calendar,
  Tag,
  ChevronDown,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';

// 문의 유형
type InquiryType = 'technical' | 'payment' | 'feature' | 'bug' | 'other';

// 문의 상태
type InquiryStatus = 'pending' | 'in_progress' | 'completed';

// 문의 데이터 타입
interface Inquiry {
  id: string;
  title: string;
  content: string;
  academyName: string;
  academyId: string;
  type: InquiryType;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
  assignee: string | null;
  userName: string;
  userEmail: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  content: string;
  authorName: string;
  authorRole: 'admin' | 'user';
  createdAt: string;
}

// Mock 데이터
const mockInquiries: Inquiry[] = [
  {
    id: 'INQ-001',
    title: '문제 생성 시 오류가 발생합니다',
    content: '수학 문제를 생성하려고 하면 "API 오류"라는 메시지가 나타나고 문제가 생성되지 않습니다. 여러 번 시도해봤는데 계속 같은 오류가 발생합니다.',
    academyName: '스마트수학학원',
    academyId: 'ACM-001',
    type: 'technical',
    status: 'pending',
    createdAt: '2025-01-21T09:30:00',
    updatedAt: '2025-01-21T09:30:00',
    assignee: null,
    userName: '김원장',
    userEmail: 'kim@smartmath.com',
    replies: [],
  },
  {
    id: 'INQ-002',
    title: '결제 영수증 재발급 요청',
    content: '2025년 1월 정기결제 영수증을 재발급 받고 싶습니다. 세금계산서로 발급 가능할까요?',
    academyName: '영재교육원',
    academyId: 'ACM-002',
    type: 'payment',
    status: 'in_progress',
    createdAt: '2025-01-20T14:20:00',
    updatedAt: '2025-01-21T08:00:00',
    assignee: '박지원',
    userName: '이영재',
    userEmail: 'lee@youngjae.edu',
    replies: [
      {
        id: 'REP-001',
        content: '안녕하세요. 영수증 재발급 요청 확인했습니다. 세금계산서 발급을 위해 사업자등록번호를 알려주시면 처리해 드리겠습니다.',
        authorName: '박지원',
        authorRole: 'admin',
        createdAt: '2025-01-21T08:00:00',
      },
    ],
  },
  {
    id: 'INQ-003',
    title: '학생 출결 알림 기능 추가 요청',
    content: '학생이 출석/결석할 때 학부모에게 자동으로 알림이 가는 기능이 있으면 좋겠습니다. 현재는 수동으로 연락해야 해서 불편합니다.',
    academyName: '청담영어학원',
    academyId: 'ACM-003',
    type: 'feature',
    status: 'completed',
    createdAt: '2025-01-18T11:00:00',
    updatedAt: '2025-01-20T16:30:00',
    assignee: '최민수',
    userName: '박청담',
    userEmail: 'park@cheongdam.com',
    replies: [
      {
        id: 'REP-002',
        content: '좋은 의견 감사합니다. 해당 기능은 다음 업데이트(v2.5)에 포함될 예정입니다.',
        authorName: '최민수',
        authorRole: 'admin',
        createdAt: '2025-01-19T09:00:00',
      },
      {
        id: 'REP-003',
        content: '감사합니다! 언제쯤 업데이트 되나요?',
        authorName: '박청담',
        authorRole: 'user',
        createdAt: '2025-01-19T10:30:00',
      },
      {
        id: 'REP-004',
        content: '2월 중순 예정입니다. 업데이트 시 공지사항으로 안내드리겠습니다.',
        authorName: '최민수',
        authorRole: 'admin',
        createdAt: '2025-01-20T16:30:00',
      },
    ],
  },
  {
    id: 'INQ-004',
    title: '로그인이 안 됩니다',
    content: '비밀번호를 올바르게 입력해도 로그인이 되지 않습니다. 비밀번호 재설정도 이메일이 오지 않습니다.',
    academyName: '수학의정석학원',
    academyId: 'ACM-004',
    type: 'bug',
    status: 'in_progress',
    createdAt: '2025-01-21T07:15:00',
    updatedAt: '2025-01-21T10:00:00',
    assignee: '박지원',
    userName: '정수학',
    userEmail: 'jung@mathbook.com',
    replies: [
      {
        id: 'REP-005',
        content: '안녕하세요. 해당 계정을 확인 중입니다. 잠시만 기다려 주세요.',
        authorName: '박지원',
        authorRole: 'admin',
        createdAt: '2025-01-21T10:00:00',
      },
    ],
  },
  {
    id: 'INQ-005',
    title: '요금제 변경 문의',
    content: 'Basic에서 Pro로 업그레이드하고 싶습니다. 중간에 변경하면 요금은 어떻게 계산되나요?',
    academyName: '톡톡영어',
    academyId: 'ACM-005',
    type: 'payment',
    status: 'pending',
    createdAt: '2025-01-21T08:45:00',
    updatedAt: '2025-01-21T08:45:00',
    assignee: null,
    userName: '김톡톡',
    userEmail: 'talk@talkenglish.com',
    replies: [],
  },
  {
    id: 'INQ-006',
    title: 'PDF 업로드 시 글자가 깨집니다',
    content: '문제 PDF를 업로드하면 한글이 깨져서 나옵니다. 다른 PDF는 잘 되는데 특정 파일만 그렇습니다.',
    academyName: '명문학원',
    academyId: 'ACM-006',
    type: 'technical',
    status: 'pending',
    createdAt: '2025-01-20T16:00:00',
    updatedAt: '2025-01-20T16:00:00',
    assignee: null,
    userName: '윤명문',
    userEmail: 'yoon@myungmoon.com',
    replies: [],
  },
  {
    id: 'INQ-007',
    title: '대시보드에 통계 추가 요청',
    content: '월별 학생 성적 추이를 한눈에 볼 수 있는 그래프가 대시보드에 있으면 좋겠습니다.',
    academyName: '드림스쿨',
    academyId: 'ACM-007',
    type: 'feature',
    status: 'completed',
    createdAt: '2025-01-15T13:00:00',
    updatedAt: '2025-01-17T11:00:00',
    assignee: '최민수',
    userName: '한드림',
    userEmail: 'han@dreamschool.com',
    replies: [
      {
        id: 'REP-006',
        content: '좋은 아이디어입니다. 개발팀에 전달하여 검토하겠습니다.',
        authorName: '최민수',
        authorRole: 'admin',
        createdAt: '2025-01-16T09:00:00',
      },
      {
        id: 'REP-007',
        content: '검토 결과, 다음 분기 로드맵에 포함되었습니다. 감사합니다.',
        authorName: '최민수',
        authorRole: 'admin',
        createdAt: '2025-01-17T11:00:00',
      },
    ],
  },
  {
    id: 'INQ-008',
    title: '기타 문의입니다',
    content: '협력사 제안 관련해서 연락드렸습니다. 담당자 연결 부탁드립니다.',
    academyName: '에듀테크솔루션',
    academyId: 'ACM-008',
    type: 'other',
    status: 'completed',
    createdAt: '2025-01-19T10:00:00',
    updatedAt: '2025-01-19T15:00:00',
    assignee: '박지원',
    userName: '송에듀',
    userEmail: 'song@edutech.co.kr',
    replies: [
      {
        id: 'REP-008',
        content: '안녕하세요. 제휴 담당자 이메일(partner@eduflow.com)로 연락 주시면 안내드리겠습니다.',
        authorName: '박지원',
        authorRole: 'admin',
        createdAt: '2025-01-19T15:00:00',
      },
    ],
  },
];

// 상태 라벨
const STATUS_LABELS: Record<InquiryStatus, string> = {
  pending: '미답변',
  in_progress: '처리중',
  completed: '완료',
};

// 상태 스타일
const STATUS_STYLES: Record<InquiryStatus, string> = {
  pending: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

// 유형 라벨
const TYPE_LABELS: Record<InquiryType, string> = {
  technical: '기술문의',
  payment: '결제문의',
  feature: '기능요청',
  bug: '버그신고',
  other: '기타',
};

// 유형 스타일
const TYPE_STYLES: Record<InquiryType, string> = {
  technical: 'bg-blue-100 text-blue-700',
  payment: 'bg-purple-100 text-purple-700',
  feature: 'bg-cyan-100 text-cyan-700',
  bug: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
};

// 담당자 목록
const ASSIGNEES = ['박지원', '최민수', '김영희', '이철수'];

export default function AdminSupportPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>(mockInquiries);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<InquiryType | 'all'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // 통계 계산
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      todayCount: inquiries.filter((i) => i.createdAt.startsWith(today)).length,
      pendingCount: inquiries.filter((i) => i.status === 'pending').length,
      inProgressCount: inquiries.filter((i) => i.status === 'in_progress').length,
      completedCount: inquiries.filter((i) => i.status === 'completed').length,
    };
  }, [inquiries]);

  // 필터링된 문의 목록
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      const matchesSearch =
        searchQuery === '' ||
        inquiry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.academyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
      const matchesType = typeFilter === 'all' || inquiry.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [inquiries, searchQuery, statusFilter, typeFilter]);

  // 답변 등록
  const handleSubmitReply = () => {
    if (!selectedInquiry || !replyContent.trim()) return;

    const newReply: Reply = {
      id: `REP-${Date.now()}`,
      content: replyContent,
      authorName: '관리자',
      authorRole: 'admin',
      createdAt: new Date().toISOString(),
    };

    const updatedInquiry: Inquiry = {
      ...selectedInquiry,
      replies: [...selectedInquiry.replies, newReply],
      status: selectedInquiry.status === 'pending' ? 'in_progress' : selectedInquiry.status,
      updatedAt: new Date().toISOString(),
      assignee: selectedInquiry.assignee || '관리자',
    };

    setInquiries((prev) =>
      prev.map((i) => (i.id === selectedInquiry.id ? updatedInquiry : i))
    );
    setSelectedInquiry(updatedInquiry);
    setReplyContent('');
  };

  // 상태 변경
  const handleStatusChange = (inquiryId: string, newStatus: InquiryStatus) => {
    setInquiries((prev) =>
      prev.map((i) =>
        i.id === inquiryId
          ? { ...i, status: newStatus, updatedAt: new Date().toISOString() }
          : i
      )
    );
    if (selectedInquiry?.id === inquiryId) {
      setSelectedInquiry((prev) =>
        prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null
      );
    }
  };

  // 담당자 변경
  const handleAssigneeChange = (inquiryId: string, assignee: string) => {
    setInquiries((prev) =>
      prev.map((i) =>
        i.id === inquiryId
          ? { ...i, assignee, updatedAt: new Date().toISOString() }
          : i
      )
    );
    if (selectedInquiry?.id === inquiryId) {
      setSelectedInquiry((prev) =>
        prev ? { ...prev, assignee, updatedAt: new Date().toISOString() } : null
      );
    }
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">고객지원</h1>
            <p className="text-sm text-gray-500 mt-1">고객 문의를 관리하고 답변합니다</p>
          </div>
          <button
            onClick={() => setInquiries([...mockInquiries])}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">오늘 문의</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">미답변</p>
                <p className="text-2xl font-bold text-red-600">{stats.pendingCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">처리 중</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgressCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">완료</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl border shadow-sm mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-4">
            {/* 검색 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="문의 검색 (제목, 학원명, 문의번호)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* 필터 */}
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  필터
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg border shadow-lg z-10 p-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상태
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) =>
                          setStatusFilter(e.target.value as InquiryStatus | 'all')
                        }
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="all">전체</option>
                        <option value="pending">미답변</option>
                        <option value="in_progress">처리중</option>
                        <option value="completed">완료</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        유형
                      </label>
                      <select
                        value={typeFilter}
                        onChange={(e) =>
                          setTypeFilter(e.target.value as InquiryType | 'all')
                        }
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="all">전체</option>
                        <option value="technical">기술문의</option>
                        <option value="payment">결제문의</option>
                        <option value="feature">기능요청</option>
                        <option value="bug">버그신고</option>
                        <option value="other">기타</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setTypeFilter('all');
                      }}
                      className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
                    >
                      필터 초기화
                    </button>
                  </div>
                )}
              </div>

              {/* 상태 필터 버튼 */}
              <div className="hidden sm:flex gap-1">
                {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? '전체' : STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 문의 목록 테이블 */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    문의번호
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    제목
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    학원명
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    유형
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    상태
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    등록일
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    담당자
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      조건에 맞는 문의가 없습니다
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inquiry) => (
                    <tr
                      key={inquiry.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedInquiry(inquiry)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-600">{inquiry.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {inquiry.title}
                          </span>
                          {inquiry.replies.length > 0 && (
                            <span className="text-xs text-gray-400">
                              ({inquiry.replies.length})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{inquiry.academyName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            TYPE_STYLES[inquiry.type]
                          }`}
                        >
                          {TYPE_LABELS[inquiry.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            STATUS_STYLES[inquiry.status]
                          }`}
                        >
                          {STATUS_LABELS[inquiry.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {formatDate(inquiry.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {inquiry.assignee || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInquiry(inquiry);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 (간단한 표시) */}
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              총 {filteredInquiries.length}건의 문의
            </span>
          </div>
        </div>
      </div>

      {/* 문의 상세 모달 */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* 모달 헤더 */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-500">
                    {selectedInquiry.id}
                  </span>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      STATUS_STYLES[selectedInquiry.status]
                    }`}
                  >
                    {STATUS_LABELS[selectedInquiry.status]}
                  </span>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      TYPE_STYLES[selectedInquiry.type]
                    }`}
                  >
                    {TYPE_LABELS[selectedInquiry.type]}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-1">
                  {selectedInquiry.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 문의 정보 */}
            <div className="px-6 py-4 border-b bg-gray-50/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{selectedInquiry.academyName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{selectedInquiry.userName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {formatDate(selectedInquiry.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{selectedInquiry.userEmail}</span>
                </div>
              </div>
            </div>

            {/* 상태/담당자 변경 */}
            <div className="px-6 py-3 border-b flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">상태:</label>
                <select
                  value={selectedInquiry.status}
                  onChange={(e) =>
                    handleStatusChange(selectedInquiry.id, e.target.value as InquiryStatus)
                  }
                  className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="pending">미답변</option>
                  <option value="in_progress">처리중</option>
                  <option value="completed">완료</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">담당자:</label>
                <select
                  value={selectedInquiry.assignee || ''}
                  onChange={(e) => handleAssigneeChange(selectedInquiry.id, e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">선택안함</option>
                  {ASSIGNEES.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 대화 내용 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 원본 문의 */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedInquiry.userName}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDate(selectedInquiry.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap pl-10">
                  {selectedInquiry.content}
                </p>
              </div>

              {/* 답변 목록 */}
              {selectedInquiry.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`rounded-xl p-4 ${
                    reply.authorRole === 'admin' ? 'bg-green-50 ml-8' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        reply.authorRole === 'admin' ? 'bg-green-200' : 'bg-blue-200'
                      }`}
                    >
                      <User
                        className={`w-4 h-4 ${
                          reply.authorRole === 'admin' ? 'text-green-700' : 'text-blue-700'
                        }`}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {reply.authorName}
                      </span>
                      {reply.authorRole === 'admin' && (
                        <span className="text-xs bg-green-200 text-green-700 px-1.5 py-0.5 rounded ml-2">
                          관리자
                        </span>
                      )}
                      <span className="text-xs text-gray-500 ml-2">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap pl-10">{reply.content}</p>
                </div>
              ))}
            </div>

            {/* 답변 입력 */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex gap-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="답변을 입력하세요..."
                  rows={3}
                  className="flex-1 border rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 self-end"
                >
                  <Send className="w-4 h-4" />
                  답변 등록
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 필터 드롭다운 외부 클릭 감지 */}
      {showFilterDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowFilterDropdown(false)}
        />
      )}
    </div>
  );
}
