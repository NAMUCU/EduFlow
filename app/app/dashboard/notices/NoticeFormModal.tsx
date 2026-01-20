'use client'

import { useState, memo } from 'react'
import { X } from 'lucide-react'
import {
  AcademyNotice,
  NoticeCategory,
  NoticeTarget,
  NOTICE_CATEGORY_LABELS,
  NOTICE_TARGET_LABELS,
} from '@/types/academy-notice'
import { createNotice, updateNotice } from '@/hooks/useNotices'

// 공지사항 작성/수정 모달 컴포넌트 (별도 파일로 분리하여 dynamic import 지원)
export const NoticeFormModal = memo(function NoticeFormModal({
  notice,
  onClose,
  onSuccess,
}: {
  notice?: AcademyNotice
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!notice
  const [formData, setFormData] = useState({
    title: notice?.title || '',
    content: notice?.content || '',
    category: notice?.category || 'general',
    target: notice?.target || 'all',
    isPinned: notice?.isPinned || false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let result: { success: boolean; error?: string }

      if (isEdit && notice) {
        result = await updateNotice(notice.id, formData)
      } else {
        result = await createNotice({
          ...formData,
          authorId: 'admin-001',
          authorName: '박정훈 원장',
          academyId: 'academy-001',
        })
      }

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || '저장에 실패했습니다.')
      }
    } catch (err) {
      console.error('공지사항 저장 오류:', err)
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {isEdit ? '공지사항 수정' : '새 공지사항 작성'}
          </h3>
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

          {/* 제목 */}
          <div>
            <label className="label">제목 *</label>
            <input
              type="text"
              className="input"
              placeholder="공지사항 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* 카테고리 & 대상 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">카테고리 *</label>
              <select
                className="input"
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as NoticeCategory,
                  })
                }
              >
                {Object.entries(NOTICE_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">대상 *</label>
              <select
                className="input"
                value={formData.target}
                onChange={(e) =>
                  setFormData({ ...formData, target: e.target.value as NoticeTarget })
                }
              >
                {Object.entries(NOTICE_TARGET_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="label">내용 *</label>
            <textarea
              className="input resize-none"
              rows={10}
              placeholder="공지사항 내용을 입력하세요"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          {/* 상단 고정 */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPinned"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
            />
            <label htmlFor="isPinned" className="text-sm text-gray-700">
              상단에 고정 (중요 공지일 경우 선택)
            </label>
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
              {loading ? '저장 중...' : isEdit ? '수정 완료' : '공지 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})
