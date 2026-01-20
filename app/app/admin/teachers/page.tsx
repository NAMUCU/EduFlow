'use client'

import { useState, useCallback, memo, useDeferredValue } from 'react'
import dynamic from 'next/dynamic'
import {
  Users,
  Search,
  Plus,
  Filter,
  ChevronDown,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserCog,
  GraduationCap,
} from 'lucide-react'
import { useTeachers, deleteTeacher } from '@/hooks/useTeachers'
import {
  TeacherListItem,
  TeacherFilter,
  TeacherStatus,
  TeacherRole,
  TEACHER_STATUS_LABELS,
  TEACHER_ROLE_LABELS,
  TEACHER_STATUS_COLORS,
  TEACHER_ROLE_COLORS,
  formatSubjectsToString,
  formatClassesToString,
  formatTeacherPhone,
} from '@/types/teacher'

// Vercel Best Practice: bundle-dynamic-imports
// 모달 컴포넌트 lazy loading
const TeacherModal = dynamic(() => import('./teacher-modal'), {
  loading: () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    </div>
  ),
})

// UI 텍스트 상수
const UI_TEXT = {
  pageTitle: '강사 관리',
  pageSubtitle: '학원 소속 강사를 관리하세요',
  addTeacher: '강사 추가',
  searchPlaceholder: '이름, 이메일, 연락처로 검색...',
  filterAll: '전체',
  filterStatus: '상태',
  filterRole: '역할',
  filterSubject: '과목',
  columnName: '이름',
  columnEmail: '이메일',
  columnPhone: '연락처',
  columnSubjects: '담당 과목',
  columnClasses: '담당 반',
  columnStatus: '상태',
  columnRole: '역할',
  columnActions: '관리',
  noTeachers: '등록된 강사가 없습니다.',
  noSearchResults: '검색 결과가 없습니다.',
  loading: '강사 목록을 불러오는 중...',
  error: '강사 목록을 불러오는 중 오류가 발생했습니다.',
  retry: '다시 시도',
  deleteConfirm: '정말 이 강사를 삭제하시겠습니까?',
  deleteSuccess: '강사가 삭제되었습니다.',
  deleteError: '강사 삭제에 실패했습니다.',
  totalTeachers: '전체 강사',
  activeTeachers: '활동중',
  refresh: '새로고침',
}

// 과목 목록
const SUBJECT_OPTIONS = ['수학', '영어', '국어', '과학', '사회']

// Vercel Best Practice: rerender-memo
// 테이블 행 컴포넌트 메모이제이션
const TeacherRow = memo(function TeacherRow({
  teacher,
  onEdit,
  onDelete,
}: {
  teacher: TeacherListItem
  onEdit: (teacher: TeacherListItem) => void
  onDelete: (teacher: TeacherListItem) => void
}) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-bold">
              {teacher.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{teacher.name}</p>
            <p className="text-xs text-gray-500">
              가입일: {new Date(teacher.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{teacher.email}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{formatTeacherPhone(teacher.phone)}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex flex-wrap gap-1">
          {teacher.subjects.slice(0, 3).map((subject) => (
            <span
              key={subject}
              className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
            >
              {subject}
            </span>
          ))}
          {teacher.subjects.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{teacher.subjects.length - 3}
            </span>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex flex-wrap gap-1">
          {teacher.classes.length > 0 ? (
            <>
              {teacher.classes.slice(0, 2).map((cls) => (
                <span
                  key={cls.id}
                  className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full"
                >
                  {cls.name}
                </span>
              ))}
              {teacher.classes.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{teacher.classes.length - 2}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-400">미지정</span>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={`px-2 py-1 text-xs rounded-full ${TEACHER_STATUS_COLORS[teacher.status]}`}>
          {TEACHER_STATUS_LABELS[teacher.status]}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className={`px-2 py-1 text-xs rounded-full ${TEACHER_ROLE_COLORS[teacher.role]}`}>
          {TEACHER_ROLE_LABELS[teacher.role]}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(teacher)}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="수정"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(teacher)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
})

// 통계 카드 컴포넌트
function StatCard({
  icon,
  label,
  value,
  bgColor,
  iconColor,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  bgColor: string
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function TeachersPage() {
  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TeacherStatus | ''>('')
  const [roleFilter, setRoleFilter] = useState<TeacherRole | ''>('')
  const [subjectFilter, setSubjectFilter] = useState('')

  // Vercel Best Practice: 검색어 디바운싱 (React 18)
  const deferredSearchTerm = useDeferredValue(searchTerm)

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<TeacherListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TeacherListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 필터 구성
  const filter: TeacherFilter = {
    ...(deferredSearchTerm && { search: deferredSearchTerm }),
    ...(statusFilter && { status: statusFilter }),
    ...(roleFilter && { role: roleFilter }),
    ...(subjectFilter && { subject: subjectFilter }),
  }

  // SWR 훅 사용
  const {
    teachers,
    totalCount,
    isLoading,
    error,
    stats,
    refresh,
  } = useTeachers(Object.keys(filter).length > 0 ? filter : undefined)

  // 강사 추가 핸들러
  const handleAddTeacher = useCallback(() => {
    setEditingTeacher(null)
    setIsModalOpen(true)
  }, [])

  // 강사 수정 핸들러
  const handleEditTeacher = useCallback((teacher: TeacherListItem) => {
    setEditingTeacher(teacher)
    setIsModalOpen(true)
  }, [])

  // 강사 삭제 확인 핸들러
  const handleDeleteConfirm = useCallback((teacher: TeacherListItem) => {
    setDeleteTarget(teacher)
  }, [])

  // 강사 삭제 실행 핸들러
  const handleDeleteExecute = useCallback(async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const result = await deleteTeacher(deleteTarget.id)
      if (result.success) {
        setDeleteTarget(null)
      } else {
        alert(result.error || UI_TEXT.deleteError)
      }
    } catch {
      alert(UI_TEXT.deleteError)
    } finally {
      setIsDeleting(false)
    }
  }, [deleteTarget])

  // 모달 닫기 핸들러
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingTeacher(null)
  }, [])

  // 필터 초기화 핸들러
  const handleResetFilters = useCallback(() => {
    setSearchTerm('')
    setStatusFilter('')
    setRoleFilter('')
    setSubjectFilter('')
  }, [])

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.pageTitle}</h1>
          <p className="text-gray-500">{UI_TEXT.pageSubtitle}</p>
        </div>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-gray-500">{UI_TEXT.loading}</p>
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.pageTitle}</h1>
          <p className="text-gray-500">{UI_TEXT.pageSubtitle}</p>
        </div>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-red-500">{UI_TEXT.error}</p>
            <button onClick={refresh} className="btn-primary">
              {UI_TEXT.retry}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const hasFilters = searchTerm || statusFilter || roleFilter || subjectFilter

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.pageTitle}</h1>
          <p className="text-gray-500">{UI_TEXT.pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {UI_TEXT.refresh}
          </button>
          <button
            onClick={handleAddTeacher}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {UI_TEXT.addTeacher}
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label={UI_TEXT.totalTeachers}
          value={stats.totalTeachers}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<UserCog className="w-5 h-5" />}
          label={UI_TEXT.activeTeachers}
          value={stats.activeTeachers}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          icon={<GraduationCap className="w-5 h-5" />}
          label={TEACHER_ROLE_LABELS.teacher}
          value={stats.teacherCount}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={<UserCog className="w-5 h-5" />}
          label={TEACHER_ROLE_LABELS.admin}
          value={stats.adminCount}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* 검색 및 필터 바 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-4">
          {/* 검색 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={UI_TEXT.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* 상태 필터 */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TeacherStatus | '')}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="">{UI_TEXT.filterStatus}: {UI_TEXT.filterAll}</option>
              {Object.entries(TEACHER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* 역할 필터 */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as TeacherRole | '')}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="">{UI_TEXT.filterRole}: {UI_TEXT.filterAll}</option>
              {Object.entries(TEACHER_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* 과목 필터 */}
          <div className="relative">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="">{UI_TEXT.filterSubject}: {UI_TEXT.filterAll}</option>
              {SUBJECT_OPTIONS.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* 필터 초기화 */}
          {hasFilters && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 강사 목록 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Vercel Best Practice: rendering-content-visibility */}
        <div className="overflow-x-auto" style={{ contentVisibility: 'auto' }}>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{UI_TEXT.columnName}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{UI_TEXT.columnEmail}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{UI_TEXT.columnPhone}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{UI_TEXT.columnSubjects}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{UI_TEXT.columnClasses}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{UI_TEXT.columnStatus}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{UI_TEXT.columnRole}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{UI_TEXT.columnActions}</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <TeacherRow
                    key={teacher.id}
                    teacher={teacher}
                    onEdit={handleEditTeacher}
                    onDelete={handleDeleteConfirm}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    {hasFilters ? UI_TEXT.noSearchResults : UI_TEXT.noTeachers}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 (추후 구현) */}
        {totalCount > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              총 {totalCount}명의 강사
            </p>
          </div>
        )}
      </div>

      {/* 강사 추가/수정 모달 */}
      {isModalOpen && (
        <TeacherModal
          teacher={editingTeacher}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal()
            refresh()
          }}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">강사 삭제</h3>
            </div>
            <p className="text-gray-600 mb-6">
              <strong>{deleteTarget.name}</strong> 강사를 삭제하시겠습니까?
              <br />
              <span className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                onClick={handleDeleteExecute}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
