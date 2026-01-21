'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  GraduationCap,
  FileQuestion,
  Activity,
  History,
  MessageSquare,
  Mail,
  Edit,
  Trash2,
  Send,
  Plus,
  MoreVertical,
  AlertCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react'

// 목업 학원 상세 데이터
const mockAcademyDetail = {
  id: 1,
  name: '스마트 수학학원',
  owner: '김영희',
  phone: '010-1234-5678',
  email: 'kim@smartmath.kr',
  address: '서울특별시 강남구 테헤란로 123, 스마트빌딩 5층',
  joinDate: '2024-08-15',
  businessNumber: '123-45-67890',
  // 구독/결제 정보
  subscription: {
    plan: 'Pro',
    status: 'active',
    price: 99000,
    billingCycle: 'monthly',
    nextBillingDate: '2025-02-15',
    paymentMethod: '카카오페이',
    lastPaymentDate: '2025-01-15',
    lastPaymentAmount: 99000,
  },
  // 통계
  stats: {
    students: 45,
    teachers: 5,
    problemsGenerated: 3240,
    monthlyActivity: 892,
    avgDailyUsage: 29,
    activeRate: 87,
  },
  // 최근 활동 로그
  activityLog: [
    { id: 1, type: 'problem', description: '문제 생성 50문항', user: '박지영 선생님', timestamp: '2025-01-19 14:32' },
    { id: 2, type: 'student', description: '신규 학생 등록 (이민준)', user: '김영희 원장', timestamp: '2025-01-19 11:20' },
    { id: 3, type: 'login', description: '관리자 로그인', user: '김영희 원장', timestamp: '2025-01-19 09:05' },
    { id: 4, type: 'payment', description: '월 구독료 결제 완료', user: '시스템', timestamp: '2025-01-15 00:00' },
    { id: 5, type: 'problem', description: '문제 생성 30문항', user: '최수현 선생님', timestamp: '2025-01-14 16:45' },
    { id: 6, type: 'student', description: '학생 정보 수정 (김하늘)', user: '박지영 선생님', timestamp: '2025-01-14 10:22' },
    { id: 7, type: 'export', description: '문제지 PDF 다운로드', user: '김영희 원장', timestamp: '2025-01-13 15:10' },
    { id: 8, type: 'login', description: '관리자 로그인', user: '김영희 원장', timestamp: '2025-01-13 09:00' },
  ],
  // 소속 강사
  teachers: [
    { id: 1, name: '박지영', email: 'park@smartmath.kr', phone: '010-1111-2222', role: '수학', students: 12, status: 'active', lastActive: '2025-01-19' },
    { id: 2, name: '최수현', email: 'choi@smartmath.kr', phone: '010-2222-3333', role: '수학', students: 10, status: 'active', lastActive: '2025-01-18' },
    { id: 3, name: '이준호', email: 'lee@smartmath.kr', phone: '010-3333-4444', role: '수학', students: 8, status: 'active', lastActive: '2025-01-17' },
    { id: 4, name: '정다은', email: 'jung@smartmath.kr', phone: '010-4444-5555', role: '수학', students: 9, status: 'inactive', lastActive: '2025-01-10' },
    { id: 5, name: '한민수', email: 'han@smartmath.kr', phone: '010-5555-6666', role: '수학', students: 6, status: 'active', lastActive: '2025-01-19' },
  ],
  // 메모/노트
  notes: [
    { id: 1, content: '결제 관련 문의 - 카드 변경 요청. 다음 달부터 삼성카드로 변경 예정.', author: '관리자A', createdAt: '2025-01-18 14:30' },
    { id: 2, content: '기능 개선 요청: 문제 유형별 통계 기능 추가 희망. 개발팀에 전달 완료.', author: '관리자B', createdAt: '2025-01-15 10:20' },
    { id: 3, content: '신규 가입 후 온보딩 완료. 서비스 만족도 높음.', author: '관리자A', createdAt: '2024-08-16 11:00' },
  ],
}

const planColors: Record<string, string> = {
  'Basic': 'bg-gray-100 text-gray-600',
  'Pro': 'bg-blue-100 text-blue-700',
  'Enterprise': 'bg-purple-100 text-purple-700',
}

const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  'active': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  'pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  'suspended': { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
}

const statusLabels: Record<string, string> = {
  'active': '활성',
  'pending': '승인대기',
  'suspended': '정지',
}

const activityTypeIcons: Record<string, { icon: typeof FileQuestion; color: string }> = {
  'problem': { icon: FileQuestion, color: 'text-blue-500 bg-blue-50' },
  'student': { icon: Users, color: 'text-green-500 bg-green-50' },
  'login': { icon: User, color: 'text-gray-500 bg-gray-50' },
  'payment': { icon: CreditCard, color: 'text-purple-500 bg-purple-50' },
  'export': { icon: Activity, color: 'text-orange-500 bg-orange-50' },
}

export default function AcademyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const academyId = params.id

  const [academy] = useState(mockAcademyDetail)
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState(mockAcademyDetail.notes)

  const handleAddNote = () => {
    if (!newNote.trim()) return

    const note = {
      id: notes.length + 1,
      content: newNote,
      author: '관리자',
      createdAt: new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(/\./g, '-').replace(' ', ' '),
    }

    setNotes([note, ...notes])
    setNewNote('')
  }

  const StatusIcon = statusColors[academy.subscription.status].icon

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{academy.name}</h1>
            <span className={`text-xs px-3 py-1 rounded-full ${planColors[academy.subscription.plan]}`}>
              {academy.subscription.plan}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${statusColors[academy.subscription.status].bg} ${statusColors[academy.subscription.status].text}`}>
              <StatusIcon className="w-3 h-3" />
              {statusLabels[academy.subscription.status]}
            </span>
          </div>
          <p className="text-gray-500 mt-1">ID: {academyId}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Mail className="w-4 h-4" />
            메일 발송
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Edit className="w-4 h-4" />
            정보 수정
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 왼쪽 컬럼 */}
        <div className="col-span-2 space-y-6">
          {/* 학원 기본 정보 */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">학원 기본 정보</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">학원명</p>
                  <p className="font-medium text-gray-900">{academy.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">대표자</p>
                  <p className="font-medium text-gray-900">{academy.owner}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">연락처</p>
                  <p className="font-medium text-gray-900">{academy.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">이메일</p>
                  <p className="font-medium text-gray-900">{academy.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl col-span-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">주소</p>
                  <p className="font-medium text-gray-900">{academy.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">가입일</p>
                  <p className="font-medium text-gray-900">{academy.joinDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <FileQuestion className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">사업자등록번호</p>
                  <p className="font-medium text-gray-900">{academy.businessNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 구독/결제 정보 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">구독/결제 정보</h2>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                결제 내역 전체 보기
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-100">
                <p className="text-sm text-gray-500 mb-1">현재 플랜</p>
                <div className="flex items-center gap-2">
                  <span className={`text-sm px-3 py-1 rounded-full ${planColors[academy.subscription.plan]}`}>
                    {academy.subscription.plan}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900 mt-2">
                  {academy.subscription.price.toLocaleString()}원
                  <span className="text-sm font-normal text-gray-500">/월</span>
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">결제 상태</p>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-green-700">정상 결제</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  최근: {academy.subscription.lastPaymentDate}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">다음 결제일</p>
                <p className="text-lg font-bold text-gray-900 mt-2">
                  {academy.subscription.nextBillingDate}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  결제수단: {academy.subscription.paymentMethod}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm">플랜 변경</button>
              <button className="btn-secondary text-sm">결제 수단 변경</button>
              <button className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50">
                구독 취소
              </button>
            </div>
          </div>

          {/* 통계 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">사용 통계</h2>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-700">{academy.stats.students}</p>
                <p className="text-sm text-blue-600">학생 수</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <GraduationCap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-700">{academy.stats.teachers}</p>
                <p className="text-sm text-green-600">강사 수</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl text-center">
                <FileQuestion className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-700">{academy.stats.problemsGenerated.toLocaleString()}</p>
                <p className="text-sm text-purple-600">생성된 문제 수</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl text-center">
                <Activity className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-orange-700">{academy.stats.monthlyActivity}</p>
                <p className="text-sm text-orange-600">이번 달 활동량</p>
              </div>
              <div className="p-4 bg-cyan-50 rounded-xl text-center">
                <Calendar className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-cyan-700">{academy.stats.avgDailyUsage}</p>
                <p className="text-sm text-cyan-600">일 평균 사용량</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-xl text-center">
                <TrendingUp className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-pink-700">{academy.stats.activeRate}%</p>
                <p className="text-sm text-pink-600">활성 사용률</p>
              </div>
            </div>
          </div>

          {/* 소속 강사 목록 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">소속 강사 목록</h2>
                <span className="text-sm text-gray-500">({academy.teachers.length}명)</span>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                전체 보기
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">강사명</th>
                    <th className="pb-3 font-medium">이메일</th>
                    <th className="pb-3 font-medium">연락처</th>
                    <th className="pb-3 font-medium">담당 과목</th>
                    <th className="pb-3 font-medium">담당 학생</th>
                    <th className="pb-3 font-medium">상태</th>
                    <th className="pb-3 font-medium">최근 접속</th>
                  </tr>
                </thead>
                <tbody>
                  {academy.teachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {teacher.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{teacher.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{teacher.email}</td>
                      <td className="py-3 text-sm text-gray-600">{teacher.phone}</td>
                      <td className="py-3 text-sm text-gray-600">{teacher.role}</td>
                      <td className="py-3 text-sm text-gray-600">{teacher.students}명</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          teacher.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {teacher.status === 'active' ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-500">{teacher.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 오른쪽 컬럼 */}
        <div className="space-y-6">
          {/* 최근 활동 로그 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">최근 활동 로그</h2>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                전체 보기
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {academy.activityLog.map((log) => {
                const { icon: Icon, color } = activityTypeIcons[log.type] || activityTypeIcons['login']
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{log.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{log.user}</span>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="text-xs text-gray-400">{log.timestamp}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 메모/노트 */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">메모/노트</h2>
              <span className="text-sm text-gray-500">(고객 응대용)</span>
            </div>

            {/* 새 메모 입력 */}
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="새 메모를 입력하세요..."
                className="input min-h-[80px] resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  메모 추가
                </button>
              </div>
            </div>

            {/* 메모 목록 */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-yellow-100">
                    <span className="text-xs text-gray-500">{note.author}</span>
                    <span className="text-xs text-gray-400">{note.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>
            <div className="space-y-2">
              <button className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                <Mail className="w-4 h-4" />
                이메일 발송
              </button>
              <button className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                전화 연결
              </button>
              <button className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4" />
                데이터 동기화
              </button>
              <button className="w-full btn-secondary flex items-center justify-center gap-2 text-sm text-red-600 border-red-200 hover:bg-red-50">
                <AlertCircle className="w-4 h-4" />
                서비스 정지
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
