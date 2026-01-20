'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Send,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Video,
  User,
  Plus,
  ChevronRight
} from 'lucide-react'

// 상담 유형
type ConsultationType = 'phone' | 'video' | 'visit'
type ConsultationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

// 목업 데이터
const consultationHistory = [
  {
    id: 1,
    date: '2025-01-15',
    time: '18:30',
    type: 'phone' as ConsultationType,
    topic: '1월 학습 진도 상담',
    status: 'completed' as ConsultationStatus,
    summary: '민준이의 이차방정식 단원 학습 상황에 대해 논의했습니다. 전반적으로 잘 따라오고 있으며, 도형 단원 보완 학습 계획을 세웠습니다.',
  },
  {
    id: 2,
    date: '2025-01-22',
    time: '19:00',
    type: 'video' as ConsultationType,
    topic: '기하 단원 보충 학습 방안',
    status: 'confirmed' as ConsultationStatus,
    summary: null,
  },
  {
    id: 3,
    date: '2024-12-20',
    time: '18:00',
    type: 'visit' as ConsultationType,
    topic: '겨울방학 학습 계획 상담',
    status: 'completed' as ConsultationStatus,
    summary: '겨울방학 동안의 집중 학습 계획을 수립했습니다. 기초 개념 복습과 심화 문제 풀이 병행 계획.',
  },
]

const availableTimes = [
  { date: '2025-01-24 (금)', times: ['18:00', '18:30', '19:00', '19:30'] },
  { date: '2025-01-27 (월)', times: ['18:00', '18:30', '19:00'] },
  { date: '2025-01-28 (화)', times: ['18:00', '19:00', '19:30'] },
]

const topicSuggestions = [
  '학습 진도 상담',
  '성적 향상 방안',
  '진로/입시 상담',
  '학습 태도/습관',
  '특정 단원 보충',
  '기타',
]

export default function ParentConsultationPage() {
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedType, setSelectedType] = useState<ConsultationType>('phone')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [additionalNote, setAdditionalNote] = useState('')

  const getTypeIcon = (type: ConsultationType) => {
    switch (type) {
      case 'phone':
        return <Phone className="w-5 h-5" />
      case 'video':
        return <Video className="w-5 h-5" />
      case 'visit':
        return <User className="w-5 h-5" />
    }
  }

  const getTypeLabel = (type: ConsultationType) => {
    switch (type) {
      case 'phone':
        return '전화 상담'
      case 'video':
        return '화상 상담'
      case 'visit':
        return '방문 상담'
    }
  }

  const getStatusBadge = (status: ConsultationStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            승인 대기
          </span>
        )
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            예약 확정
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            상담 완료
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            취소됨
          </span>
        )
    }
  }

  const handleSubmit = () => {
    // 실제로는 API 호출
    alert('상담 요청이 접수되었습니다. 선생님 확인 후 연락드리겠습니다.')
    setShowRequestForm(false)
    setSelectedDate('')
    setSelectedTime('')
    setSelectedTopic('')
    setAdditionalNote('')
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">상담 요청</h1>
            <p className="text-gray-500 mt-1">선생님께 상담을 요청하고 기록을 확인하세요</p>
          </div>
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            상담 요청하기
          </button>
        </div>
      </header>

      <div className="p-8">
        {/* 선생님 정보 카드 */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur">
                박
              </div>
              <div>
                <h2 className="text-xl font-bold">박정훈 선생님</h2>
                <p className="text-indigo-200">정훈수학학원 | 수학 담당</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-indigo-200 text-sm mb-1">상담 가능 시간</p>
              <p className="font-medium">월~금 18:00 ~ 20:00</p>
            </div>
          </div>
        </div>

        {showRequestForm ? (
          /* 상담 요청 폼 */
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">새 상담 요청</h3>

            {/* 상담 유형 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">상담 유형</label>
              <div className="grid grid-cols-3 gap-4">
                {(['phone', 'video', 'visit'] as ConsultationType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedType === type
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedType === type ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getTypeIcon(type)}
                    </div>
                    <span className={`font-medium ${
                      selectedType === type ? 'text-indigo-700' : 'text-gray-700'
                    }`}>
                      {getTypeLabel(type)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 날짜/시간 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">희망 일시</label>
              <div className="space-y-4">
                {availableTimes.map((slot, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl">
                    <p className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      {slot.date}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {slot.times.map((time) => (
                        <button
                          key={time}
                          onClick={() => {
                            setSelectedDate(slot.date)
                            setSelectedTime(time)
                          }}
                          className={`px-4 py-2 rounded-lg border transition-all ${
                            selectedDate === slot.date && selectedTime === time
                              ? 'border-indigo-500 bg-indigo-500 text-white'
                              : 'border-gray-200 bg-white hover:border-indigo-300'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 상담 주제 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">상담 주제</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {topicSuggestions.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      selectedTopic === topic
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* 추가 메모 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">추가 메모 (선택)</label>
              <textarea
                value={additionalNote}
                onChange={(e) => setAdditionalNote(e.target.value)}
                placeholder="상담 시 논의하고 싶은 내용을 자유롭게 작성해 주세요"
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-32"
              />
            </div>

            {/* 버튼 */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowRequestForm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedDate || !selectedTime || !selectedTopic}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                상담 요청하기
              </button>
            </div>
          </div>
        ) : (
          /* 예약된 상담 */
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">예약된 상담</h3>
            {consultationHistory.filter(c => c.status === 'confirmed').length > 0 ? (
              <div className="space-y-4">
                {consultationHistory
                  .filter(c => c.status === 'confirmed')
                  .map((consultation) => (
                    <div key={consultation.id} className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                            {getTypeIcon(consultation.type)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{consultation.topic}</p>
                            <p className="text-sm text-gray-600">{getTypeLabel(consultation.type)}</p>
                          </div>
                        </div>
                        {getStatusBadge(consultation.status)}
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {consultation.date}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {consultation.time}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">예약된 상담이 없습니다</p>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  상담 요청하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 상담 기록 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">상담 기록</h3>
          <div className="space-y-4">
            {consultationHistory.map((consultation) => (
              <div
                key={consultation.id}
                className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      consultation.status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : consultation.status === 'confirmed'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getTypeIcon(consultation.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{consultation.topic}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {consultation.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {consultation.time}
                        </span>
                        <span>{getTypeLabel(consultation.type)}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(consultation.status)}
                </div>
                {consultation.summary && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{consultation.summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
