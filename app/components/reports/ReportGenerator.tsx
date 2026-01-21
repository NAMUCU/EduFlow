'use client'

/**
 * 보고서 생성 폼 컴포넌트
 *
 * AI 보고서 생성을 위한 폼 컴포넌트입니다.
 * - 학생 선택 (단일/다중)
 * - 기간 선택 (주간/월간)
 * - 보고서 유형 선택 (학부모용/강사용)
 * - 생성 진행률 표시
 */

import { useState, useCallback, useMemo } from 'react'
import {
  Users,
  Calendar,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  X,
  Loader2,
  User,
  GraduationCap,
  AlertCircle,
} from 'lucide-react'
import {
  ReportPeriodType,
  ReportTargetType,
  REPORT_PERIOD_LABELS,
  REPORT_TARGET_LABELS,
  AutoReportGenerateRequest,
} from '@/types/report'
import { ReportStudent } from '@/hooks/useReportsTeacher'

// UI 텍스트 상수
const UI_TEXT = {
  title: 'AI 보고서 생성',
  subtitle: 'AI가 학생 데이터를 분석하여 맞춤형 보고서를 생성합니다',
  selectStudents: '학생 선택',
  selectStudentsPlaceholder: '학생을 검색하세요...',
  allStudents: '전체 학생',
  selectedCount: '명 선택됨',
  selectPeriod: '보고서 기간',
  selectPeriodType: '기간 유형',
  startDate: '시작일',
  endDate: '종료일',
  weekly: '주간',
  monthly: '월간',
  selectTargetType: '보고서 유형',
  parentReport: '학부모용',
  parentReportDesc: '대화거리, 칭찬 포인트, 격려 메시지 중심',
  teacherReport: '강사용',
  teacherReportDesc: '성적 분석, 취약점 분석, 수업 준비 사항',
  generateButton: 'AI 보고서 생성',
  generatingButton: '생성 중...',
  cancel: '취소',
  progressTitle: '보고서 생성 진행 중',
  progressStudent: '학생 보고서 생성 중',
  progressComplete: '생성 완료',
  errorNoStudent: '학생을 선택해주세요',
  errorNoDate: '기간을 선택해주세요',
  errorNoType: '보고서 유형을 선택해주세요',
  selectAll: '전체 선택',
  deselectAll: '선택 해제',
}

interface ReportGeneratorProps {
  /** 선택 가능한 학생 목록 */
  students: ReportStudent[]
  /** 보고서 생성 요청 콜백 */
  onGenerate: (request: AutoReportGenerateRequest) => Promise<void>
  /** 생성 완료 콜백 */
  onComplete?: (result: {
    success: boolean
    totalStudents: number
    successCount: number
    failCount: number
  }) => void
  /** 취소 콜백 */
  onCancel?: () => void
  /** 로딩 상태 */
  isGenerating?: boolean
  /** 생성 진행률 (0-100) */
  progress?: number
  /** 현재 처리 중인 학생 이름 */
  currentStudent?: string
  /** 클래스명 */
  className?: string
}

export default function ReportGenerator({
  students,
  onGenerate,
  onComplete,
  onCancel,
  isGenerating = false,
  progress = 0,
  currentStudent,
  className = '',
}: ReportGeneratorProps) {
  // 학생 선택 상태
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const [isStudentSectionExpanded, setIsStudentSectionExpanded] = useState(true)

  // 기간 선택 상태
  const [periodType, setPeriodType] = useState<ReportPeriodType>('weekly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 보고서 유형 선택 상태
  const [selectedTargetTypes, setSelectedTargetTypes] = useState<Set<ReportTargetType>>(
    new Set(['parent'])
  )

  // 에러 상태
  const [error, setError] = useState<string | null>(null)

  // 필터링된 학생 목록
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery) return students
    const query = studentSearchQuery.toLowerCase()
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.grade.toLowerCase().includes(query) ||
        student.school.toLowerCase().includes(query)
    )
  }, [students, studentSearchQuery])

  // 선택된 학생 목록
  const selectedStudents = useMemo(() => {
    return students.filter((s) => selectedStudentIds.has(s.id))
  }, [students, selectedStudentIds])

  // 폼 유효성 검사
  const isValid = useMemo(() => {
    if (selectedStudentIds.size === 0) return false
    if (!startDate || !endDate) return false
    if (selectedTargetTypes.size === 0) return false
    return true
  }, [selectedStudentIds.size, startDate, endDate, selectedTargetTypes.size])

  // 학생 선택/해제
  const handleStudentToggle = useCallback((studentId: string) => {
    setSelectedStudentIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
    setError(null)
  }, [])

  // 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    const allFilteredIds = new Set(filteredStudents.map((s) => s.id))
    const isAllSelected = filteredStudents.every((s) => selectedStudentIds.has(s.id))

    if (isAllSelected) {
      setSelectedStudentIds((prev) => {
        const newSet = new Set(prev)
        allFilteredIds.forEach((id) => newSet.delete(id))
        return newSet
      })
    } else {
      setSelectedStudentIds((prev) => {
        const newSet = new Set(prev)
        allFilteredIds.forEach((id) => newSet.add(id))
        return newSet
      })
    }
  }, [filteredStudents, selectedStudentIds])

  // 보고서 유형 토글
  const handleTargetTypeToggle = useCallback((type: ReportTargetType) => {
    setSelectedTargetTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        if (newSet.size > 1) {
          newSet.delete(type)
        }
      } else {
        newSet.add(type)
      }
      return newSet
    })
    setError(null)
  }, [])

  // 기본 기간 설정 (오늘 기준)
  const setDefaultPeriod = useCallback((type: ReportPeriodType) => {
    const today = new Date()
    const end = new Date(today)
    const start = new Date(today)

    if (type === 'weekly') {
      // 이번 주 월요일부터 일요일
      const dayOfWeek = today.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      start.setDate(today.getDate() + mondayOffset)
      end.setDate(start.getDate() + 6)
    } else {
      // 이번 달 1일부터 말일
      start.setDate(1)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
    }

    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }, [])

  // 기간 유형 변경
  const handlePeriodTypeChange = useCallback(
    (type: ReportPeriodType) => {
      setPeriodType(type)
      setDefaultPeriod(type)
    },
    [setDefaultPeriod]
  )

  // 보고서 생성
  const handleGenerate = useCallback(async () => {
    setError(null)

    if (selectedStudentIds.size === 0) {
      setError(UI_TEXT.errorNoStudent)
      return
    }
    if (!startDate || !endDate) {
      setError(UI_TEXT.errorNoDate)
      return
    }
    if (selectedTargetTypes.size === 0) {
      setError(UI_TEXT.errorNoType)
      return
    }

    const request: AutoReportGenerateRequest = {
      studentIds: Array.from(selectedStudentIds),
      periodType,
      startDate,
      endDate,
      targetTypes: Array.from(selectedTargetTypes),
      academyId: 'default', // 실제로는 컨텍스트에서 가져옴
    }

    await onGenerate(request)
  }, [selectedStudentIds, startDate, endDate, selectedTargetTypes, periodType, onGenerate])

  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden ${className}`}>
      {/* 헤더 */}
      <div className="p-6 bg-gradient-to-r from-primary-50 to-purple-50 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{UI_TEXT.title}</h2>
            <p className="text-sm text-gray-600">{UI_TEXT.subtitle}</p>
          </div>
        </div>
      </div>

      {/* 생성 진행 중 UI */}
      {isGenerating && (
        <div className="p-6 border-b bg-blue-50">
          <div className="flex items-center gap-4 mb-4">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{UI_TEXT.progressTitle}</p>
              {currentStudent && (
                <p className="text-sm text-gray-600">
                  {UI_TEXT.progressStudent}: {currentStudent}
                </p>
              )}
            </div>
            <span className="text-lg font-bold text-primary-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {selectedStudentIds.size}명 학생 중 {Math.round((progress / 100) * selectedStudentIds.size)}명 완료
          </p>
        </div>
      )}

      {/* 폼 내용 */}
      <div className="p-6 space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 학생 선택 섹션 */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setIsStudentSectionExpanded(!isStudentSectionExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            disabled={isGenerating}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">{UI_TEXT.selectStudents}</span>
              <span className="text-sm text-primary-500 font-medium">
                {selectedStudentIds.size}
                {UI_TEXT.selectedCount}
              </span>
            </div>
            {isStudentSectionExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {isStudentSectionExpanded && (
            <div className="p-4 space-y-4">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder={UI_TEXT.selectStudentsPlaceholder}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isGenerating}
                />
              </div>

              {/* 전체 선택 */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                  disabled={isGenerating}
                >
                  {filteredStudents.every((s) => selectedStudentIds.has(s.id))
                    ? UI_TEXT.deselectAll
                    : UI_TEXT.selectAll}
                </button>
                <span className="text-sm text-gray-500">
                  {filteredStudents.length}명 중 {selectedStudentIds.size}명 선택
                </span>
              </div>

              {/* 학생 목록 */}
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    검색 결과가 없습니다
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <label
                      key={student.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedStudentIds.has(student.id) ? 'bg-primary-50' : ''
                      } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.has(student.id)}
                        onChange={() => handleStudentToggle(student.id)}
                        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                        disabled={isGenerating}
                      />
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600">
                          {student.name[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">
                          <GraduationCap className="w-3 h-3 inline mr-1" />
                          {student.grade} | {student.school}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 기간 선택 섹션 */}
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">{UI_TEXT.selectPeriod}</span>
          </div>

          {/* 기간 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              {UI_TEXT.selectPeriodType}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePeriodTypeChange('weekly')}
                disabled={isGenerating}
                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  periodType === 'weekly'
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {UI_TEXT.weekly}
              </button>
              <button
                type="button"
                onClick={() => handlePeriodTypeChange('monthly')}
                disabled={isGenerating}
                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  periodType === 'monthly'
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {UI_TEXT.monthly}
              </button>
            </div>
          </div>

          {/* 날짜 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {UI_TEXT.startDate}
              </label>
              <input
                type="date"
                className="input w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {UI_TEXT.endDate}
              </label>
              <input
                type="date"
                className="input w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>

        {/* 보고서 유형 선택 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">{UI_TEXT.selectTargetType}</span>
          </div>

          <div className="space-y-3">
            {/* 학부모용 */}
            <label
              className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                selectedTargetTypes.has('parent')
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedTargetTypes.has('parent')}
                onChange={() => handleTargetTypeToggle('parent')}
                className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                disabled={isGenerating}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-900">{UI_TEXT.parentReport}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{UI_TEXT.parentReportDesc}</p>
              </div>
            </label>

            {/* 강사용 */}
            <label
              className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                selectedTargetTypes.has('teacher')
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedTargetTypes.has('teacher')}
                onChange={() => handleTargetTypeToggle('teacher')}
                className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                disabled={isGenerating}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">{UI_TEXT.teacherReport}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{UI_TEXT.teacherReportDesc}</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 하단 액션 */}
      <div className="p-6 bg-gray-50 border-t flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isGenerating}
            className="btn-secondary flex-1"
          >
            {UI_TEXT.cancel}
          </button>
        )}
        <button
          onClick={handleGenerate}
          disabled={!isValid || isGenerating}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {UI_TEXT.generatingButton}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {UI_TEXT.generateButton}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
