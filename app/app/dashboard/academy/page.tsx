'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import { Building2, MapPin, Phone, Mail, Clock, Users, Edit3, Save, Plus, Trash2, X } from 'lucide-react'

// 시간 옵션 생성
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return [`${hour}:00`, `${hour}:30`]
}).flat()

// 목업 데이터
const mockAcademy = {
  name: '정훈수학학원',
  owner: '박정훈',
  phone: '031-123-4567',
  email: 'junghoon@academy.com',
  address: '경기도 성남시 분당구 정자동 123-45',
  openTime: '14:00',
  closeTime: '22:00',
  description: '중등 수학 전문 학원입니다. 기초부터 심화까지 체계적인 커리큘럼으로 지도합니다.',
  subjects: ['수학'],
  established: '2017-03-01',
}

interface Teacher {
  id: number
  name: string
  role: string
  subjects: string[]
  phone: string
  students: number
}

const mockTeachers: Teacher[] = [
  { id: 1, name: '박정훈', role: '원장', subjects: ['수학'], phone: '010-1234-5678', students: 25 },
  { id: 2, name: '김수진', role: '강사', subjects: ['수학'], phone: '010-2345-6789', students: 22 },
  { id: 3, name: '이민호', role: '강사', subjects: ['수학'], phone: '010-3456-7890', students: 18 },
]

const SUBJECT_OPTIONS = ['수학', '영어', '국어', '과학', '사회', '물리', '화학', '생물']
const ROLE_OPTIONS = ['원장', '강사', '조교']

export default function AcademyPage() {
  const [academy, setAcademy] = useState(mockAcademy)
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(mockAcademy)

  // 강사 추가 모달
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false)
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    role: '강사',
    subjects: [] as string[],
    phone: '',
  })

  const handleSave = () => {
    setAcademy(editData)
    setIsEditing(false)
  }

  const handleAddTeacher = () => {
    if (!newTeacher.name || !newTeacher.phone) {
      alert('이름과 연락처를 입력해주세요.')
      return
    }

    const teacher: Teacher = {
      id: Date.now(),
      name: newTeacher.name,
      role: newTeacher.role,
      subjects: newTeacher.subjects.length > 0 ? newTeacher.subjects : ['수학'],
      phone: newTeacher.phone,
      students: 0,
    }

    setTeachers([...teachers, teacher])
    setShowAddTeacherModal(false)
    setNewTeacher({ name: '', role: '강사', subjects: [], phone: '' })
  }

  const handleDeleteTeacher = (id: number) => {
    if (confirm('정말 이 강사를 삭제하시겠습니까?')) {
      setTeachers(teachers.filter(t => t.id !== id))
    }
  }

  const toggleSubject = (subject: string) => {
    setNewTeacher(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }

  return (
    <div>
      <Header
        title="학원 정보"
        subtitle="학원 기본 정보와 강사진을 관리합니다"
      />

      <div className="p-8">
        <div className="grid grid-cols-3 gap-6">
          {/* 학원 기본 정보 */}
          <div className="col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">기본 정보</h3>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="btn-secondary">
                      취소
                    </button>
                    <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      저장
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    수정
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">학원명</label>
                      <input
                        type="text"
                        className="input"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">대표자</label>
                      <input
                        type="text"
                        className="input"
                        value={editData.owner}
                        onChange={(e) => setEditData({ ...editData, owner: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">전화번호</label>
                      <input
                        type="tel"
                        className="input"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">이메일</label>
                      <input
                        type="email"
                        className="input"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">주소</label>
                    <input
                      type="text"
                      className="input"
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">운영 시간</label>
                    <div className="flex items-center gap-3">
                      <select
                        className="input w-32"
                        value={editData.openTime}
                        onChange={(e) => setEditData({ ...editData, openTime: e.target.value })}
                      >
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <span className="text-gray-500">~</span>
                      <select
                        className="input w-32"
                        value={editData.closeTime}
                        onChange={(e) => setEditData({ ...editData, closeTime: e.target.value })}
                      >
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">학원 소개</label>
                    <textarea
                      className="input min-h-[100px]"
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
                    <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">{academy.name}</h4>
                      <p className="text-gray-500">대표: {academy.owner}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">전화번호</p>
                        <p className="font-medium text-gray-900">{academy.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">이메일</p>
                        <p className="font-medium text-gray-900">{academy.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">주소</p>
                        <p className="font-medium text-gray-900">{academy.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">운영 시간</p>
                        <p className="font-medium text-gray-900">{academy.openTime} - {academy.closeTime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">학원 소개</p>
                    <p className="text-gray-700">{academy.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="space-y-6">
            <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 opacity-80" />
                <div>
                  <p className="text-sm opacity-80">전체 학생 수</p>
                  <p className="text-3xl font-bold">65명</p>
                </div>
              </div>
              <p className="text-sm opacity-80">지난 달 대비 +3명</p>
            </div>

            <div className="card">
              <h4 className="font-bold text-gray-900 mb-3">수강 과목</h4>
              <div className="flex flex-wrap gap-2">
                {academy.subjects.map((subject) => (
                  <span key={subject} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            <div className="card">
              <h4 className="font-bold text-gray-900 mb-3">개원일</h4>
              <p className="text-gray-600">{academy.established}</p>
              <p className="text-sm text-gray-400 mt-1">운영 8년차</p>
            </div>
          </div>
        </div>

        {/* 강사 목록 */}
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">강사진 ({teachers.length}명)</h3>
            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              강사 추가
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-lg font-bold text-primary-600">
                      {teacher.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{teacher.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        teacher.role === '원장' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {teacher.role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTeacher(teacher.id)}
                    className="p-1 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">담당 과목</span>
                    <span className="text-gray-900">{teacher.subjects.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">담당 학생</span>
                    <span className="text-gray-900">{teacher.students}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">연락처</span>
                    <span className="text-gray-900">{teacher.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 강사 추가 모달 */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">강사 추가</h3>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">이름 *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="강사 이름"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">직책</label>
                <select
                  className="input"
                  value={newTeacher.role}
                  onChange={(e) => setNewTeacher({ ...newTeacher, role: e.target.value })}
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">담당 과목</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_OPTIONS.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        newTeacher.subjects.includes(subject)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">연락처 *</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="010-0000-0000"
                  value={newTeacher.phone}
                  onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="btn-secondary flex-1"
              >
                취소
              </button>
              <button
                onClick={handleAddTeacher}
                className="btn-primary flex-1"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
