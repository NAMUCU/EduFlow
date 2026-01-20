'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Users,
  Clock,
  Calendar,
  BookOpen,
  Plus,
  X,
  Phone,
  Mail,
  UserPlus,
  UserMinus,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import {
  ClassDetail,
  ClassDetailResponse,
  ClassStudent,
  formatScheduleToString,
  CLASS_STATUS_LABELS,
  DAY_OF_WEEK_SHORT_LABELS,
  DayOfWeek,
  UpdateClass,
} from '@/types/class'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ClassDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = use(params)

  const [classData, setClassData] = useState<ClassDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showRemoveStudentModal, setShowRemoveStudentModal] = useState(false)
  const [selectedStudentForRemove, setSelectedStudentForRemove] = useState<ClassStudent | null>(null)

  // 반 상세 정보 불러오기
  const fetchClassDetail = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/classes/${id}`)
      const data: ClassDetailResponse = await response.json()

      if (data.success && data.data) {
        setClassData(data.data)
      } else {
        setError(data.error || '반 정보를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      console.error('반 상세 조회 오류:', err)
      setError('반 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchClassDetail()
  }, [fetchClassDetail])

  // 반 삭제
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        router.push('/dashboard/classes')
      } else {
        setError(data.error || '반 삭제에 실패했습니다.')
      }
    } catch (err) {
      console.error('반 삭제 오류:', err)
      setError('반 삭제 중 오류가 발생했습니다.')
    }
  }

  // 학생 제거
  const handleRemoveStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/classes/${id}/students`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: [studentId] }),
      })
      const data = await response.json()

      if (data.success) {
        fetchClassDetail()
        setShowRemoveStudentModal(false)
        setSelectedStudentForRemove(null)
      } else {
        setError(data.error || '학생 제거에 실패했습니다.')
      }
    } catch (err) {
      console.error('학생 제거 오류:', err)
      setError('학생 제거 중 오류가 발생했습니다.')
    }
  }

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'inactive':
        return 'bg-yellow-100 text-yellow-700'
      case 'archived':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="반 상세" />
        <div className="p-8 flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (error || !classData) {
    return (
      <div>
        <Header title="반 상세" />
        <div className="p-8">
          <div className="card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || '반을 찾을 수 없습니다.'}</p>
            <Link
              href="/dashboard/classes"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              반 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header
        title={classData.name}
        subtitle={`${classData.grade} | ${classData.subject} | ${classData.teacher_name} 선생님`}
      />

      <div className="p-8">
        {/* 뒤로가기 & 액션 버튼 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard/classes"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>반 목록</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              수정
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
          </div>
        </div>

        {/* 반 정보 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 기본 정보 */}
          <div className="lg:col-span-2 card p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">반 정보</h2>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-sm text-gray-500 mb-1">상태</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    classData.status
                  )}`}
                >
                  {CLASS_STATUS_LABELS[classData.status]}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">강의실</p>
                <p className="font-medium text-gray-900">{classData.room || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">수업 일정</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">
                    {formatScheduleToString(classData.schedule)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">수용 인원</p>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">
                    {classData.student_ids.length}명
                    {classData.max_students && ` / ${classData.max_students}명`}
                  </p>
                </div>
              </div>
            </div>

            {classData.description && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">설명</p>
                <p className="text-gray-700">{classData.description}</p>
              </div>
            )}

            {classData.memo && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">메모</p>
                <p className="text-gray-700">{classData.memo}</p>
              </div>
            )}
          </div>

          {/* 과제 현황 */}
          <div className="card p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">과제 현황</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">전체 과제</span>
                <span className="font-bold text-gray-900">
                  {classData.assignment_summary.total}개
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">진행중</span>
                <span className="font-bold text-blue-600">
                  {classData.assignment_summary.active}개
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">완료</span>
                <span className="font-bold text-green-600">
                  {classData.assignment_summary.completed}개
                </span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">평균 완료율</span>
                  <span className="font-bold text-gray-900">
                    {classData.assignment_summary.average_completion_rate}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{
                      width: `${classData.assignment_summary.average_completion_rate}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <Link
              href={`/dashboard/assignments?class_id=${id}`}
              className="mt-6 w-full btn-secondary flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              과제 보기
            </Link>
          </div>
        </div>

        {/* 학생 목록 */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-gray-900">
              학생 목록 ({classData.students.length}명)
            </h2>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              학생 추가
            </button>
          </div>

          {classData.students.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>등록된 학생이 없습니다.</p>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                첫 번째 학생 추가하기
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      학생
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      학년
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      학교
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      연락처
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">

                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classData.students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
                            {student.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            {student.email && (
                              <p className="text-sm text-gray-500">{student.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">{student.grade || '-'}</td>
                      <td className="px-4 py-4 text-gray-700">{student.school_name || '-'}</td>
                      <td className="px-4 py-4">
                        {student.phone ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {student.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedStudentForRemove(student)
                            setShowRemoveStudentModal(true)
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="반에서 제거"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 수정 모달 */}
      {showEditModal && (
        <EditClassModal
          classData={classData}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchClassDetail()
          }}
        />
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">반 삭제</h3>
              <p className="text-gray-600">
                정말 <span className="font-semibold">{classData.name}</span> 반을 삭제하시겠습니까?
              </p>
              <p className="text-sm text-red-500 mt-2">이 작업은 되돌릴 수 없습니다.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 btn-secondary"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 학생 추가 모달 */}
      {showAddStudentModal && (
        <AddStudentModal
          classId={id}
          existingStudentIds={classData.student_ids}
          onClose={() => setShowAddStudentModal(false)}
          onSuccess={() => {
            setShowAddStudentModal(false)
            fetchClassDetail()
          }}
        />
      )}

      {/* 학생 제거 확인 모달 */}
      {showRemoveStudentModal && selectedStudentForRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserMinus className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">학생 제거</h3>
              <p className="text-gray-600">
                <span className="font-semibold">{selectedStudentForRemove.name}</span> 학생을
                이 반에서 제거하시겠습니까?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemoveStudentModal(false)
                  setSelectedStudentForRemove(null)
                }}
                className="flex-1 btn-secondary"
              >
                취소
              </button>
              <button
                onClick={() => handleRemoveStudent(selectedStudentForRemove.id)}
                className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                제거
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 반 수정 모달
function EditClassModal({
  classData,
  onClose,
  onSuccess,
}: {
  classData: ClassDetail
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: classData.name,
    subject: classData.subject,
    grade: classData.grade,
    teacher_id: classData.teacher_id,
    description: classData.description || '',
    max_students: classData.max_students?.toString() || '',
    room: classData.room || '',
    color: classData.color || '#3B82F6',
    status: classData.status,
    memo: classData.memo || '',
    schedule: classData.schedule,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const updateData: UpdateClass = {
        name: formData.name,
        subject: formData.subject,
        grade: formData.grade,
        teacher_id: formData.teacher_id,
        description: formData.description || null,
        max_students: formData.max_students ? parseInt(formData.max_students) : null,
        room: formData.room || null,
        color: formData.color,
        status: formData.status as 'active' | 'inactive' | 'archived',
        memo: formData.memo || null,
        schedule: formData.schedule,
      }

      const response = await fetch(`/api/classes/${classData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || '반 수정에 실패했습니다.')
      }
    } catch (err) {
      console.error('반 수정 오류:', err)
      setError('반 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const addSchedule = () => {
    setFormData({
      ...formData,
      schedule: [
        ...formData.schedule,
        { day: 'monday' as DayOfWeek, startTime: '16:00', endTime: '18:00' },
      ],
    })
  }

  const removeSchedule = (index: number) => {
    if (formData.schedule.length > 1) {
      setFormData({
        ...formData,
        schedule: formData.schedule.filter((_, i) => i !== index),
      })
    }
  }

  const updateSchedule = (index: number, field: string, value: string) => {
    const newSchedule = [...formData.schedule]
    newSchedule[index] = { ...newSchedule[index], [field]: value }
    setFormData({ ...formData, schedule: newSchedule })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">반 정보 수정</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          {/* 반 이름 */}
          <div>
            <label className="label">반 이름 *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* 상태 */}
          <div>
            <label className="label">상태 *</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'archived' })}
            >
              <option value="active">운영중</option>
              <option value="inactive">휴강</option>
              <option value="archived">종료</option>
            </select>
          </div>

          {/* 과목 & 학년 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">과목 *</label>
              <select
                className="input"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              >
                <option value="수학">수학</option>
                <option value="영어">영어</option>
                <option value="국어">국어</option>
                <option value="과학">과학</option>
                <option value="사회">사회</option>
              </select>
            </div>
            <div>
              <label className="label">대상 학년 *</label>
              <select
                className="input"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              >
                <option value="중1">중1</option>
                <option value="중2">중2</option>
                <option value="중3">중3</option>
                <option value="고1">고1</option>
                <option value="고2">고2</option>
                <option value="고3">고3</option>
              </select>
            </div>
          </div>

          {/* 담당 선생님 */}
          <div>
            <label className="label">담당 선생님 *</label>
            <select
              className="input"
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
            >
              <option value="teacher-001">박정훈 선생님</option>
              <option value="teacher-002">김영희 선생님</option>
            </select>
          </div>

          {/* 수업 일정 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">수업 일정 *</label>
              <button
                type="button"
                onClick={addSchedule}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + 일정 추가
              </button>
            </div>
            <div className="space-y-3">
              {formData.schedule.map((sch, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select
                    className="input flex-1"
                    value={sch.day}
                    onChange={(e) => updateSchedule(index, 'day', e.target.value)}
                  >
                    {Object.entries(DAY_OF_WEEK_SHORT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}요일
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    className="input w-32"
                    value={sch.startTime}
                    onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                  />
                  <span className="text-gray-500">~</span>
                  <input
                    type="time"
                    className="input w-32"
                    value={sch.endTime}
                    onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                  />
                  {formData.schedule.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSchedule(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 최대 인원 & 강의실 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">최대 수용 인원</label>
              <input
                type="number"
                className="input"
                placeholder="비워두면 제한 없음"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                min="1"
              />
            </div>
            <div>
              <label className="label">강의실</label>
              <input
                type="text"
                className="input"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              />
            </div>
          </div>

          {/* 반 색상 */}
          <div>
            <label className="label">반 색상</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
              <span className="text-sm text-gray-500">
                목록에서 반을 구분하는 색상입니다
              </span>
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="label">반 설명</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* 메모 */}
          <div>
            <label className="label">메모</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              취소
            </button>
            <button type="submit" className="flex-1 btn-primary" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 학생 추가 모달
function AddStudentModal({
  classId,
  existingStudentIds,
  onClose,
  onSuccess,
}: {
  classId: string
  existingStudentIds: string[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [availableStudents, setAvailableStudents] = useState<
    { id: string; name: string; grade: string; school_name: string }[]
  >([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 학생 목록 불러오기 (실제로는 API에서 가져와야 함)
    // 여기서는 classes.json의 students 데이터를 사용
    fetch('/api/classes')
      .then((res) => res.json())
      .then(() => {
        // Mock: classes.json에서 학생 목록을 직접 가져올 수 없으므로
        // 여기서는 하드코딩된 데이터 사용
        const allStudents = [
          { id: 'student-001', name: '김민준', grade: '중1', school_name: '서울중학교' },
          { id: 'student-002', name: '이서연', grade: '중1', school_name: '서울중학교' },
          { id: 'student-003', name: '박준혁', grade: '중1', school_name: '강남중학교' },
          { id: 'student-004', name: '최수아', grade: '중1', school_name: '강남중학교' },
          { id: 'student-005', name: '정지우', grade: '중2', school_name: '서울중학교' },
          { id: 'student-006', name: '한소희', grade: '중2', school_name: '강남중학교' },
        ]
        const available = allStudents.filter((s) => !existingStudentIds.includes(s.id))
        setAvailableStudents(available)
        setLoading(false)
      })
      .catch((err) => {
        console.error('학생 목록 조회 오류:', err)
        setError('학생 목록을 불러오는데 실패했습니다.')
        setLoading(false)
      })
  }, [existingStudentIds])

  const toggleStudent = (studentId: string) => {
    if (selectedIds.includes(studentId)) {
      setSelectedIds(selectedIds.filter((id) => id !== studentId))
    } else {
      setSelectedIds([...selectedIds, studentId])
    }
  }

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      setError('추가할 학생을 선택해주세요.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/classes/${classId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: selectedIds }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || '학생 추가에 실패했습니다.')
      }
    } catch (err) {
      console.error('학생 추가 오류:', err)
      setError('학생 추가 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">학생 추가</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : availableStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>추가할 수 있는 학생이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableStudents.map((student) => (
                <label
                  key={student.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedIds.includes(student.id)
                      ? 'bg-primary-50 border border-primary-200'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
                    {student.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">
                      {student.grade} | {student.school_name}
                    </p>
                  </div>
                  {selectedIds.includes(student.id) && (
                    <CheckCircle className="w-5 h-5 text-primary-600" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary" disabled={submitting}>
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 btn-primary"
            disabled={submitting || selectedIds.length === 0}
          >
            {submitting ? '추가 중...' : `${selectedIds.length}명 추가`}
          </button>
        </div>
      </div>
    </div>
  )
}
