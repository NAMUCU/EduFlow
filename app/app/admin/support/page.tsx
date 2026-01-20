'use client'

import { useState } from 'react'
import {
  HeadphonesIcon,
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Building2,
  ChevronRight,
  Send,
  Paperclip,
  X
} from 'lucide-react'

// 목업 데이터
const mockTickets = [
  {
    id: 'TKT-2025-001',
    subject: '문제 생성이 안됩니다',
    academy: '스마트 수학학원',
    user: '김영희',
    email: 'kim@smartmath.kr',
    status: 'open',
    priority: 'high',
    category: '기술 문의',
    createdAt: '2025-01-19 14:30',
    updatedAt: '2025-01-19 14:30',
    messages: [
      {
        id: 1,
        sender: 'user',
        name: '김영희',
        content: '안녕하세요, 오늘 오후부터 문제 생성 버튼을 눌러도 계속 로딩만 되고 문제가 생성되지 않습니다. 확인 부탁드립니다.',
        time: '14:30',
      },
    ],
  },
  {
    id: 'TKT-2025-002',
    subject: '요금제 변경 문의',
    academy: '영어마을학원',
    user: '이철수',
    email: 'lee@engvillage.kr',
    status: 'in_progress',
    priority: 'medium',
    category: '결제 문의',
    createdAt: '2025-01-18 10:15',
    updatedAt: '2025-01-19 09:00',
    messages: [
      {
        id: 1,
        sender: 'user',
        name: '이철수',
        content: 'Basic에서 Pro로 요금제를 변경하고 싶습니다. 변경하면 기존 데이터는 유지되나요?',
        time: '10:15',
      },
      {
        id: 2,
        sender: 'admin',
        name: '관리자',
        content: '안녕하세요, 요금제 변경 시 기존 데이터는 모두 유지됩니다. 변경 시점부터 Pro 요금이 적용되며, 이번 달은 일할 계산됩니다.',
        time: '11:30',
      },
      {
        id: 3,
        sender: 'user',
        name: '이철수',
        content: '감사합니다. 그럼 지금 바로 변경 가능한가요?',
        time: '09:00 (오늘)',
      },
    ],
  },
  {
    id: 'TKT-2025-003',
    subject: 'PDF 출력 오류',
    academy: '국어논술학원',
    user: '최수진',
    email: 'choi@koreanwriting.kr',
    status: 'resolved',
    priority: 'low',
    category: '기술 문의',
    createdAt: '2025-01-17 16:45',
    updatedAt: '2025-01-18 11:00',
    messages: [
      {
        id: 1,
        sender: 'user',
        name: '최수진',
        content: 'PDF로 문제를 출력하면 일부 수식이 깨져서 나옵니다.',
        time: '16:45',
      },
      {
        id: 2,
        sender: 'admin',
        name: '관리자',
        content: '안녕하세요, 해당 이슈 확인 후 수정 완료했습니다. 다시 시도해보시고 문제가 지속되면 말씀해주세요.',
        time: '11:00',
      },
    ],
  },
  {
    id: 'TKT-2025-004',
    subject: '학생 계정 일괄 등록 방법',
    academy: '명문학원',
    user: '강태호',
    email: 'kang@myungmoon.kr',
    status: 'open',
    priority: 'medium',
    category: '사용 문의',
    createdAt: '2025-01-19 11:20',
    updatedAt: '2025-01-19 11:20',
    messages: [
      {
        id: 1,
        sender: 'user',
        name: '강태호',
        content: '학생이 200명 정도 되는데 일괄로 등록하는 방법이 있나요? 엑셀 업로드 같은 기능이요.',
        time: '11:20',
      },
    ],
  },
]

const statusConfig: Record<string, { color: string, label: string, bgColor: string }> = {
  open: { color: 'text-red-600', bgColor: 'bg-red-100', label: '신규' },
  in_progress: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: '처리중' },
  resolved: { color: 'text-green-600', bgColor: 'bg-green-100', label: '해결됨' },
}

const priorityConfig: Record<string, { color: string, label: string }> = {
  high: { color: 'text-red-600', label: '긴급' },
  medium: { color: 'text-yellow-600', label: '보통' },
  low: { color: 'text-gray-600', label: '낮음' },
}

export default function SupportPage() {
  const [tickets] = useState(mockTickets)
  const [selectedTicket, setSelectedTicket] = useState<typeof mockTickets[0] | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [replyMessage, setReplyMessage] = useState('')

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.academy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const openCount = tickets.filter(t => t.status === 'open').length
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">고객 지원</h1>
          <p className="text-gray-500">학원의 문의사항을 관리하고 응대합니다</p>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">신규 문의</p>
            <p className="text-2xl font-bold text-gray-900">{openCount}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">처리중</p>
            <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">이번 주 해결</p>
            <p className="text-2xl font-bold text-gray-900">12</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">평균 응답시간</p>
            <p className="text-2xl font-bold text-gray-900">2.5시간</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 문의 목록 */}
        <div className="col-span-1">
          {/* 검색/필터 */}
          <div className="card mb-4">
            <div className="relative mb-3">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="검색..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'open', 'in_progress', 'resolved'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex-1 py-2 text-xs rounded-lg transition-all ${
                    filterStatus === status
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? '전체' :
                   status === 'open' ? '신규' :
                   status === 'in_progress' ? '처리중' : '해결됨'}
                </button>
              ))}
            </div>
          </div>

          {/* 티켓 목록 */}
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const status = statusConfig[ticket.status]
              const priority = priorityConfig[ticket.priority]
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`card cursor-pointer transition-all ${
                    selectedTicket?.id === ticket.id
                      ? 'ring-2 ring-primary-500 bg-primary-50'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.bgColor} ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="text-xs text-gray-400">{ticket.createdAt.split(' ')[0]}</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">{ticket.subject}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 className="w-3 h-3" />
                    <span className="line-clamp-1">{ticket.academy}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{ticket.category}</span>
                    <span className={`text-xs ${priority.color}`}>{priority.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 문의 상세 */}
        <div className="col-span-2">
          {selectedTicket ? (
            <div className="card h-full flex flex-col">
              {/* 헤더 */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-400">{selectedTicket.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[selectedTicket.status].bgColor} ${statusConfig[selectedTicket.status].color}`}>
                      {statusConfig[selectedTicket.status].label}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h3>
                </div>
                <div className="flex gap-2">
                  {selectedTicket.status === 'open' && (
                    <button className="btn-secondary text-sm">처리 시작</button>
                  )}
                  {selectedTicket.status === 'in_progress' && (
                    <button className="btn-primary text-sm">해결 완료</button>
                  )}
                </div>
              </div>

              {/* 문의자 정보 */}
              <div className="py-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedTicket.user}</p>
                    <p className="text-sm text-gray-500">{selectedTicket.academy} · {selectedTicket.email}</p>
                  </div>
                </div>
              </div>

              {/* 메시지 영역 */}
              <div className="flex-1 overflow-auto py-4 space-y-4">
                {selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${
                      msg.sender === 'admin'
                        ? 'bg-primary-500 text-white rounded-2xl rounded-tr-md'
                        : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-md'
                    } px-4 py-3`}>
                      <p className={`text-xs mb-1 ${msg.sender === 'admin' ? 'text-primary-100' : 'text-gray-500'}`}>
                        {msg.name} · {msg.time}
                      </p>
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 답변 입력 */}
              {selectedTicket.status !== 'resolved' && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex gap-3">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Paperclip className="w-5 h-5 text-gray-400" />
                    </button>
                    <input
                      type="text"
                      placeholder="답변을 입력하세요..."
                      className="input flex-1"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                    />
                    <button className="btn-primary flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      전송
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>왼쪽에서 문의를 선택하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
