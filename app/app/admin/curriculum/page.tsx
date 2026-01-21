'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import dynamic from 'next/dynamic'
import 'katex/dist/katex.min.css'
import {
  BookOpen,
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Calculator,
  Compass,
  Trash2,
  AlertTriangle,
  Lock,
  Plus,
  Save,
  X,
  Upload,
} from 'lucide-react'

// Dynamic imports for heavy components
const DesmosEmbed = dynamic(() => import('@/components/visualizations/DesmosEmbed'), {
  loading: () => <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse" />,
  ssr: false,
})

const GeoGebraEmbed = dynamic(() => import('@/components/visualizations/GeoGebraEmbed'), {
  loading: () => <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse" />,
  ssr: false,
})

// KaTeX for math rendering
import { InlineMath, BlockMath } from 'react-katex'

interface Unit {
  id: string
  grade: string
  gradeLabel: string
  order: number
  name: string
  subject: string
  hasContent?: boolean
  content?: ConceptContent | null
}

interface DesmosExpression {
  id?: string
  latex: string
  color?: string
  label?: string
}

interface Visualization {
  id?: string
  type: 'desmos' | 'geogebra'
  title: string
  description: string
  desmos_expressions?: DesmosExpression[]
  geogebra_commands?: string[]
}

interface ConceptContent {
  id: string
  title: string
  summary: string
  core_concepts: Array<{
    title: string
    definition: string
    formula?: string
    explanation: string
    examples: Array<{
      problem: string
      solution: string
      key_insight: string
    }>
  }>
  advanced_topics?: Array<{
    title: string
    content: string
    olympiad_connection?: string
  }>
  common_mistakes?: string[]
  problem_solving_tips?: string[]
  connections?: string[]
  visualizations: Visualization[]
  created_at: string
}

interface GradeInfo {
  value: string
  label: string
  count: number
}

// LaTeX 텍스트를 파싱하여 수식 렌더링
function MathText({ text }: { text: string }) {
  if (!text) return null

  // $..$ 패턴 찾아서 InlineMath로 렌더링
  const parts = text.split(/(\$[^$]+\$)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const latex = part.slice(1, -1)
          try {
            return <InlineMath key={i} math={latex} />
          } catch {
            return <code key={i} className="bg-gray-100 px-1 rounded">{latex}</code>
          }
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// 블록 수식 렌더링
function MathBlock({ latex }: { latex: string }) {
  if (!latex) return null

  // $ 제거
  const clean = latex.replace(/^\$+|\$+$/g, '').trim()

  try {
    return (
      <div className="my-3 p-3 bg-blue-50 rounded-lg overflow-x-auto">
        <BlockMath math={clean} />
      </div>
    )
  } catch {
    return (
      <pre className="my-3 p-3 bg-gray-100 rounded-lg overflow-x-auto text-sm">
        {latex}
      </pre>
    )
  }
}

// 단원 행 컴포넌트 (rerender-memo: memoization으로 불필요한 리렌더링 방지)
interface UnitRowProps {
  unit: Unit
  isSelected: boolean
  isGenerating: boolean
  onToggleSelect: (id: string) => void
  onGenerate: (id: string) => void
  onPreview: (unit: Unit) => void
  onDelete: (unit: Unit) => void
}

const UnitRow = memo(function UnitRow({
  unit,
  isSelected,
  isGenerating,
  onToggleSelect,
  onGenerate,
  onPreview,
  onDelete,
}: UnitRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(unit.id)}
          disabled={unit.hasContent}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <span className="text-sm text-gray-500">{unit.order}.</span>
        <span className="text-gray-900">{unit.name}</span>
        {unit.hasContent ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-300" />
        )}
      </div>

      <div className="flex items-center gap-2">
        {unit.hasContent ? (
          <>
            <button
              onClick={() => onPreview(unit)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              <Eye className="w-4 h-4" />
              보기
            </button>
            <button
              onClick={() => onDelete(unit)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
          </>
        ) : (
          <button
            onClick={() => onGenerate(unit.id)}
            disabled={isGenerating}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            AI 생성
          </button>
        )}
      </div>
    </div>
  )
})

export default function CurriculumPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [grades, setGrades] = useState<GradeInfo[]>([])
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set())
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState<Set<string>>(new Set())
  const [previewUnit, setPreviewUnit] = useState<Unit | null>(null)
  const [activeTab, setActiveTab] = useState<'concepts' | 'visualizations' | 'advanced' | 'tips'>('concepts')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, withContent: 0 })

  // 삭제 관련 상태
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const ADMIN_PASSWORD = 'admin1234' // 실제 구현시 환경변수나 API로 검증

  // 파일 업로드 모달 상태
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ name: string; status: string }>>([])

  // Store 상태
  const [storeInfo, setStoreInfo] = useState<{ name: string; fileCount: number } | null>(null)

  // 데이터 로드
  const loadUnits = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ includeContent: 'true' })
      if (selectedGrade !== 'all') {
        params.append('grade', selectedGrade)
      }

      const res = await fetch(`/api/curriculum/generate?${params}`)
      const data = await res.json()

      if (data.success) {
        setUnits(data.data.units)
        setStats({
          total: data.data.total,
          withContent: data.data.withContent || 0,
        })
        if (data.data.grades) {
          setGrades(data.data.grades)
        }
      }
    } catch (error) {
      console.error('로드 오류:', error)
    }
    setLoading(false)
  }, [selectedGrade])

  // 초기 데이터 로드 (병렬 실행 - async-parallel)
  useEffect(() => {
    Promise.all([loadUnits(), loadStoreInfo()])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 학년 변경 시 단원 재로드
  useEffect(() => {
    if (selectedGrade !== 'all') {
      loadUnits()
    }
  }, [selectedGrade, loadUnits])

  // 단일 생성
  const generateSingle = useCallback(async (unitId: string) => {
    setGenerating(prev => new Set(prev).add(unitId))
    try {
      const res = await fetch('/api/curriculum/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_id: unitId }),
      })
      const data = await res.json()

      if (data.success) {
        setUnits(prev =>
          prev.map(u =>
            u.id === unitId
              ? { ...u, hasContent: true, content: data.data.content }
              : u
          )
        )
        setStats(prev => ({
          ...prev,
          withContent: prev.withContent + 1,
        }))
      }
    } catch (error) {
      console.error('생성 오류:', error)
    }
    setGenerating(prev => {
      const next = new Set(prev)
      next.delete(unitId)
      return next
    })
  }, [])

  // Store 정보 로드
  const loadStoreInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/curriculum/store')
      const data = await res.json()
      if (data.success && data.store) {
        setStoreInfo(data.store)
        setUploadedDocs(data.files || [])
      }
    } catch (error) {
      console.error('Store 정보 로드 실패:', error)
    }
  }, [])

  // 파일 업로드 처리 (병렬 업로드 - async-parallel)
  const handleFileUpload = useCallback(async () => {
    if (uploadFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(`${uploadFiles.length}개 파일 업로드 중...`)

    try {
      // 병렬 업로드 (동시에 최대 3개)
      const results = await Promise.all(
        uploadFiles.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('type', 'curriculum')

          try {
            const res = await fetch('/api/curriculum/store/upload', {
              method: 'POST',
              body: formData,
            })
            const data = await res.json()
            return { name: file.name, status: data.success ? 'success' : 'failed' }
          } catch {
            return { name: file.name, status: 'failed' }
          }
        })
      )

      setUploadedDocs(prev => [...prev, ...results])
      setUploadProgress('완료!')
      setUploadFiles([])
      await loadStoreInfo()
    } catch (error) {
      console.error('업로드 오류:', error)
      setUploadProgress('업로드 실패')
    }

    setIsUploading(false)
  }, [uploadFiles, loadStoreInfo])

  // 단원 콘텐츠 삭제
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return

    // 비밀번호 확인
    if (deletePassword !== ADMIN_PASSWORD) {
      setDeleteError('비밀번호가 올바르지 않습니다.')
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      const res = await fetch(`/api/curriculum/generate?unitId=${deleteTarget.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        // 로컬 상태 업데이트
        setUnits(prev =>
          prev.map(u =>
            u.id === deleteTarget.id
              ? { ...u, hasContent: false, content: null }
              : u
          )
        )
        setStats(prev => ({
          ...prev,
          withContent: Math.max(0, prev.withContent - 1),
        }))
        setDeleteTarget(null)
        setDeletePassword('')
      } else {
        setDeleteError(data.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      setDeleteError('삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }, [deleteTarget, deletePassword])

  // 배치 생성
  const generateBatch = useCallback(async () => {
    if (selectedUnits.size === 0) return

    const unitIds = Array.from(selectedUnits)
    unitIds.forEach(id => setGenerating(prev => new Set(prev).add(id)))

    try {
      const res = await fetch('/api/curriculum/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_ids: unitIds }),
      })
      const data = await res.json()

      if (data.success) {
        await loadUnits()
        setSelectedUnits(new Set())
      }
    } catch (error) {
      console.error('배치 생성 오류:', error)
    }

    setGenerating(new Set())
  }, [selectedUnits, loadUnits])

  // 학년 토글
  const toggleGrade = useCallback((grade: string) => {
    setExpandedGrades(prev => {
      const next = new Set(prev)
      if (next.has(grade)) {
        next.delete(grade)
      } else {
        next.add(grade)
      }
      return next
    })
  }, [])

  // 단원 선택 토글
  const toggleUnit = useCallback((unitId: string) => {
    setSelectedUnits(prev => {
      const next = new Set(prev)
      if (next.has(unitId)) {
        next.delete(unitId)
      } else {
        next.add(unitId)
      }
      return next
    })
  }, [])

  // 학년별 그룹화 (메모이제이션)
  const unitsByGrade = useMemo(() =>
    units.reduce(
      (acc, unit) => {
        if (!acc[unit.grade]) {
          acc[unit.grade] = {
            label: unit.gradeLabel,
            units: [],
          }
        }
        acc[unit.grade].units.push(unit)
        return acc
      },
      {} as Record<string, { label: string; units: Unit[] }>
    ),
    [units]
  )

  const content = previewUnit?.content

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="text-blue-600" />
            커리큘럼 관리
          </h1>
          <p className="text-gray-600 mt-2">
            수학 교육과정 개념자료 생성 및 관리 (Gemini 2.5 Pro 기반)
          </p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          문서 업로드
        </button>
      </div>

      {/* Store 정보 */}
      {storeInfo ? (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-900">커리큘럼 RAG Store</div>
                <div className="text-sm text-green-700">{storeInfo.fileCount}개 문서 저장됨</div>
              </div>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="text-sm text-green-700 hover:text-green-800"
            >
              문서 관리 →
            </button>
          </div>
        </div>
      ) : null}

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-sm text-gray-500">전체 단원</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}개</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-sm text-gray-500">생성 완료</div>
          <div className="text-2xl font-bold text-green-600">{stats.withContent}개</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-sm text-gray-500">미생성</div>
          <div className="text-2xl font-bold text-orange-600">
            {stats.total - stats.withContent}개
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-sm text-gray-500">진행률</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.total > 0 ? Math.round((stats.withContent / stats.total) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* 필터 & 액션 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">전체 학년</option>
              {grades.map(g => (
                <option key={g.value} value={g.value}>
                  {g.label} ({g.count}개)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedUnits.size > 0 && (
            <button
              onClick={generateBatch}
              disabled={generating.size > 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating.size > 0 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              선택 항목 생성 ({selectedUnits.size}개)
            </button>
          )}
          <button
            onClick={loadUnits}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>
      </div>

      {/* 단원 목록 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border">
          {Object.entries(unitsByGrade).map(([grade, { label, units: gradeUnits }]) => (
            <div key={grade} className="border-b last:border-b-0">
              {/* 학년 헤더 */}
              <button
                onClick={() => toggleGrade(grade)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {expandedGrades.has(grade) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-semibold text-gray-900">{label}</span>
                  <span className="text-sm text-gray-500">
                    ({gradeUnits.filter(u => u.hasContent).length}/{gradeUnits.length} 완료)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${(gradeUnits.filter(u => u.hasContent).length / gradeUnits.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </button>

              {/* 단원 목록 */}
              {expandedGrades.has(grade) && (
                <div className="px-4 pb-4">
                  <div className="space-y-2 ml-8">
                    {gradeUnits.map(unit => (
                      <UnitRow
                        key={unit.id}
                        unit={unit}
                        isSelected={selectedUnits.has(unit.id)}
                        isGenerating={generating.has(unit.id)}
                        onToggleSelect={toggleUnit}
                        onGenerate={generateSingle}
                        onPreview={(u) => {
                          setPreviewUnit(u)
                          setActiveTab('concepts')
                        }}
                        onDelete={(u) => {
                          setDeleteTarget(u)
                          setDeletePassword('')
                          setDeleteError('')
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 미리보기 모달 */}
      {previewUnit && content && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* 모달 헤더 */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {content.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {previewUnit.gradeLabel} &gt; {previewUnit.name}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewUnit(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* 탭 네비게이션 */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setActiveTab('concepts')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'concepts'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  핵심 개념
                </button>
                <button
                  onClick={() => setActiveTab('visualizations')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                    activeTab === 'visualizations'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  시각화
                </button>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'advanced'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  심화 주제
                </button>
                <button
                  onClick={() => setActiveTab('tips')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'tips'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  학습 팁
                </button>
              </div>
            </div>

            {/* 모달 컨텐츠 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 요약 (항상 표시) */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">핵심 요약</h3>
                <p className="text-blue-800 leading-relaxed">
                  <MathText text={content.summary} />
                </p>
              </div>

              {/* 핵심 개념 탭 */}
              {activeTab === 'concepts' && (
                <div className="space-y-6">
                  {content.core_concepts.map((concept, i) => (
                    <div key={i} className="border rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <h4 className="font-semibold text-gray-900">
                          {i + 1}. {concept.title}
                        </h4>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">정의</span>
                          <p className="text-gray-800 mt-1">
                            <MathText text={concept.definition} />
                          </p>
                        </div>

                        {concept.formula && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">공식</span>
                            <MathBlock latex={concept.formula} />
                          </div>
                        )}

                        <div>
                          <span className="text-sm font-medium text-gray-500">설명</span>
                          <p className="text-gray-700 mt-1 leading-relaxed">
                            <MathText text={concept.explanation} />
                          </p>
                        </div>

                        {concept.examples && concept.examples.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">예제</span>
                            <div className="mt-2 space-y-3">
                              {concept.examples.map((example, j) => (
                                <div key={j} className="bg-yellow-50 rounded-lg p-4">
                                  <div className="font-medium text-gray-800 mb-2">
                                    <MathText text={example.problem} />
                                  </div>
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                    <MathText text={example.solution} />
                                  </div>
                                  {example.key_insight && (
                                    <div className="mt-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded">
                                      <strong>핵심 인사이트:</strong> <MathText text={example.key_insight} />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 시각화 탭 */}
              {activeTab === 'visualizations' && (
                <div className="space-y-6">
                  {content.visualizations && content.visualizations.length > 0 ? (
                    content.visualizations.map((viz, i) => (
                      <div key={i} className="border rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-2">
                          {viz.type === 'desmos' ? (
                            <Calculator className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Compass className="w-5 h-5 text-green-600" />
                          )}
                          <h4 className="font-semibold text-gray-900">{viz.title}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            viz.type === 'desmos'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {viz.type === 'desmos' ? 'Desmos' : 'GeoGebra'}
                          </span>
                        </div>
                        <div className="p-4">
                          <p className="text-gray-600 mb-4">{viz.description}</p>

                          {viz.type === 'desmos' && viz.desmos_expressions && (
                            <DesmosEmbed
                              expressions={viz.desmos_expressions.map((expr, j) => ({
                                id: expr.id || `expr-${j}`,
                                latex: expr.latex,
                                color: expr.color,
                                label: expr.label,
                              }))}
                              height={400}
                              className="border-0"
                            />
                          )}

                          {viz.type === 'geogebra' && viz.geogebra_commands && (
                            <GeoGebraEmbed
                              commands={viz.geogebra_commands}
                              height={400}
                              className="border-0"
                            />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      이 단원에는 시각화 자료가 없습니다.
                    </div>
                  )}
                </div>
              )}

              {/* 심화 주제 탭 */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  {content.advanced_topics && content.advanced_topics.length > 0 ? (
                    content.advanced_topics.map((topic, i) => (
                      <div key={i} className="border rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{topic.title}</h4>
                        <p className="text-gray-700 leading-relaxed">
                          <MathText text={topic.content} />
                        </p>
                        {topic.olympiad_connection && (
                          <div className="mt-3 bg-purple-50 p-3 rounded-lg">
                            <span className="text-sm font-medium text-purple-700">경시대회 연결</span>
                            <p className="text-sm text-purple-800 mt-1">
                              <MathText text={topic.olympiad_connection} />
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      심화 주제가 없습니다.
                    </div>
                  )}

                  {/* 단원 연결 */}
                  {content.connections && content.connections.length > 0 && (
                    <div className="border rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">단원 연결</h4>
                      <ul className="space-y-2">
                        {content.connections.map((conn, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700">
                            <span className="text-blue-500 mt-1">•</span>
                            <MathText text={conn} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 학습 팁 탭 */}
              {activeTab === 'tips' && (
                <div className="space-y-6">
                  {/* 문제 풀이 팁 */}
                  {content.problem_solving_tips && content.problem_solving_tips.length > 0 && (
                    <div className="border rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        문제 풀이 팁
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside">
                        {content.problem_solving_tips.map((tip, i) => (
                          <li key={i} className="text-gray-700">
                            <MathText text={tip} />
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* 흔한 실수 */}
                  {content.common_mistakes && content.common_mistakes.length > 0 && (
                    <div className="border border-red-200 rounded-xl p-4 bg-red-50">
                      <h4 className="font-semibold text-red-900 mb-3">흔한 실수</h4>
                      <ul className="space-y-2">
                        {content.common_mistakes.map((mistake, i) => (
                          <li key={i} className="flex items-start gap-2 text-red-800">
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <MathText text={mistake} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  const json = JSON.stringify(content, null, 2)
                  navigator.clipboard.writeText(json)
                  alert('JSON 복사됨!')
                }}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                JSON 복사
              </button>
              <button
                onClick={() => setPreviewUnit(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">커리큘럼 삭제</h3>
                  <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{deleteTarget.gradeLabel}</span>의
                  <span className="font-medium text-gray-900"> {deleteTarget.name}</span> 단원의 생성된 콘텐츠를 삭제하시겠습니까?
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  삭제 후에도 단원은 유지되며, 콘텐츠를 다시 생성할 수 있습니다.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline-block mr-1" />
                  관리자 비밀번호를 입력하세요
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value)
                    setDeleteError('')
                  }}
                  placeholder="비밀번호 입력"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleDelete()
                    }
                  }}
                />
                {deleteError && (
                  <p className="text-sm text-red-600 mt-2">{deleteError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteTarget(null)
                    setDeletePassword('')
                    setDeleteError('')
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={isDeleting}
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!deletePassword || isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 파일 업로드 모달 */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">커리큘럼 문서 업로드</h2>
                <p className="text-sm text-gray-500 mt-1">
                  PDF, 엑셀, 텍스트 파일을 업로드하면 RAG 검색에 사용됩니다
                </p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 업로드 영역 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 드래그앤드롭 영역 */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const files = Array.from(e.dataTransfer.files)
                  setUploadFiles(prev => [...prev, ...files])
                }}
              >
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.xlsx,.xls,.txt,.md,.csv,.docx"
                  className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files || [])
                    setUploadFiles(prev => [...prev, ...files])
                  }}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-gray-900 font-medium mb-1">
                    파일을 드래그하거나 클릭하여 선택
                  </div>
                  <div className="text-sm text-gray-500">
                    PDF, 엑셀, 텍스트 파일 지원 (최대 50MB)
                  </div>
                </label>
              </div>

              {/* 선택된 파일 목록 */}
              {uploadFiles.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    선택된 파일 ({uploadFiles.length}개)
                  </div>
                  <div className="space-y-2">
                    {uploadFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => setUploadFiles(prev => prev.filter((_, j) => j !== i))}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 업로드 진행 상황 */}
              {uploadProgress && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                    <span className="text-sm text-blue-800">{uploadProgress}</span>
                  </div>
                </div>
              )}

              {/* 업로드된 문서 목록 */}
              {uploadedDocs.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    저장된 문서 ({uploadedDocs.length}개)
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {uploadedDocs.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-900">{doc.name}</span>
                        </div>
                        <span className="text-xs text-green-600">저장됨</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setUploadModalOpen(false)
                  setUploadFiles([])
                  setUploadProgress('')
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                닫기
              </button>
              <button
                onClick={handleFileUpload}
                disabled={isUploading || uploadFiles.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                업로드 ({uploadFiles.length}개)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
