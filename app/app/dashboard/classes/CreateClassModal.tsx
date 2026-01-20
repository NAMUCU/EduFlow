'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { DayOfWeek, DAY_OF_WEEK_SHORT_LABELS } from '@/types/class'
import { createClass } from '@/hooks/useClasses'

interface CreateClassModalProps {
  onClose: () => void
  onSuccess: () => void
}

/**
 * 반 생성 모달 컴포넌트
 * Vercel Best Practice: bundle-dynamic-imports
 * - 이 컴포넌트는 동적으로 임포트되어 초기 번들 크기를 줄입니다
 */
export function CreateClassModal({ onClose, onSuccess }: CreateClassModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '수학',
    grade: '중1',
    teacher_id: 'teacher-001',
    description: '',
    max_students: '',
    room: '',
    color: '#3B82F6',
    schedule: [{ day: 'monday' as DayOfWeek, startTime: '16:00', endTime: '18:00' }],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await createClass({
        ...formData,
        academy_id: 'academy-001',
        max_students: formData.max_students ? parseInt(formData.max_students) : null,
      })

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || '반 생성에 실패했습니다.')
      }
    } catch (err) {
      console.error('반 생성 오류:', err)
      setError('반 생성 중 오류가 발생했습니다.')
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
          <h3 className="text-xl font-bold text-gray-900">새 반 생성</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 반 이름 */}
          <div>
            <label className="label">반 이름 *</label>
            <input
              type="text"
              className="input"
              placeholder="예: 중1 수학 기초반"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
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
                placeholder="예: A강의실"
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
              rows={3}
              placeholder="반에 대한 설명을 입력하세요"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? '생성 중...' : '반 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateClassModal
