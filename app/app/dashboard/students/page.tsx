'use client';

import { useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import StudentForm from '@/components/StudentForm';
import { useStudents, createStudent, deleteStudent } from '@/hooks/useStudents';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Phone,
  GraduationCap,
  ChevronDown,
  X,
  Eye,
  Edit,
  Trash2,
  FileText,
} from 'lucide-react';
import {
  StudentListItem,
  StudentFilter,
  CreateStudentInput,
  StudentStatus,
  GRADE_OPTIONS,
  CLASS_OPTIONS,
  SUBJECT_OPTIONS,
  STUDENT_STATUS_COLORS,
} from '@/types/student';

// ============================================
// 학생 상세 미리보기 모달 컴포넌트
// ============================================

interface StudentPreviewModalProps {
  student: StudentListItem;
  onClose: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
}

function StudentPreviewModal({ student, onClose, onViewDetail, onEdit }: StudentPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">학생 정보</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 기본 정보 */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-600">
              {student.name[0]}
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">{student.name}</h4>
              <p className="text-gray-500">{student.school} {student.grade}</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${STUDENT_STATUS_COLORS[student.status]}`}>
                {student.status}
              </span>
            </div>
          </div>

          {/* 요약 정보 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary-600">
                {student.recentScore || '-'}
              </div>
              <div className="text-sm text-gray-500">최근 성적</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                85%
              </div>
              <div className="text-sm text-gray-500">과제 완료율</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                95%
              </div>
              <div className="text-sm text-gray-500">출석률</div>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">반</span>
              <span className="font-medium text-gray-900">{student.className || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">수강 과목</span>
              <span className="font-medium text-gray-900">{student.subjects.join(', ')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">학생 연락처</span>
              <span className="font-medium text-gray-900">{student.phone || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">학부모</span>
              <span className="font-medium text-gray-900">{student.parentName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">학부모 연락처</span>
              <span className="font-medium text-gray-900">{student.parentPhone}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">등록일</span>
              <span className="font-medium text-gray-900">{student.enrolledAt}</span>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            수정
          </button>
          <button
            onClick={onViewDetail}
            className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            상세 보기
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 필터 패널 컴포넌트
// ============================================

interface FilterPanelProps {
  filter: StudentFilter;
  onChange: (filter: StudentFilter) => void;
  onClose: () => void;
  onReset: () => void;
}

function FilterPanel({ filter, onChange, onClose, onReset }: FilterPanelProps) {
  return (
    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-10 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">필터</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* 학년 필터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
          <select
            value={filter.grade || ''}
            onChange={(e) => onChange({ ...filter, grade: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">전체</option>
            {GRADE_OPTIONS.map((grade) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

        {/* 반 필터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">반</label>
          <select
            value={filter.className || ''}
            onChange={(e) => onChange({ ...filter, className: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">전체</option>
            {CLASS_OPTIONS.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* 상태 필터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
          <select
            value={filter.status || ''}
            onChange={(e) => onChange({ ...filter, status: (e.target.value || undefined) as StudentStatus | undefined })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">전체</option>
            <option value="우수">우수</option>
            <option value="정상">정상</option>
            <option value="주의">주의</option>
            <option value="신규">신규</option>
          </select>
        </div>

        {/* 과목 필터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">과목</label>
          <select
            value={filter.subject || ''}
            onChange={(e) => onChange({ ...filter, subject: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">전체</option>
            {SUBJECT_OPTIONS.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={onReset}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          초기화
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600"
        >
          적용
        </button>
      </div>
    </div>
  );
}

// ============================================
// 학생 카드/행 컴포넌트 (React.memo로 최적화)
// Vercel Best Practice: rerender-memo
// ============================================

interface StudentRowProps {
  student: StudentListItem;
  isDropdownActive: boolean;
  onRowClick: () => void;
  onDropdownToggle: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  // Vercel Best Practice: bundle-preload
  onPreloadDetail: () => void;
}

const StudentRow = memo(function StudentRow({
  student,
  isDropdownActive,
  onRowClick,
  onDropdownToggle,
  onViewDetail,
  onEdit,
  onDelete,
  onPreloadDetail,
}: StudentRowProps) {
  return (
    <tr
      // Vercel Best Practice: rendering-content-visibility
      className="student-row hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onRowClick}
      // Vercel Best Practice: bundle-preload - 호버/포커스 시 상세 페이지 프리로드
      onMouseEnter={onPreloadDetail}
      onFocus={onPreloadDetail}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
            {student.name[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900">{student.name}</p>
            <p className="text-sm text-gray-500">{student.subjects.join(', ')}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-gray-900">{student.school}</p>
            <p className="text-sm text-gray-500">{student.grade}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-gray-900">{student.className || '-'}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          {student.phone || '-'}
        </div>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="text-gray-900">{student.parentName}</p>
          <p className="text-sm text-gray-500">{student.parentPhone}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        {student.recentScore ? (
          <span className="text-lg font-bold text-gray-900">{student.recentScore}점</span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STUDENT_STATUS_COLORS[student.status]}`}>
          {student.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onDropdownToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {isDropdownActive && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={onViewDetail}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                상세 보기
              </button>
              <button
                onClick={onEdit}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                정보 수정
              </button>
              <button
                onClick={onDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

// ============================================
// 메인 페이지 컴포넌트
// ============================================

export default function StudentsPage() {
  const router = useRouter();

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<StudentFilter>({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 드롭다운 메뉴 상태
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Vercel Best Practice: client-swr-dedup
  // SWR을 사용한 학생 목록 관리 (자동 중복 제거, 캐싱, 재검증)
  const { students, totalCount, isLoading } = useStudents(filter, debouncedSearch);

  // 검색어 디바운스 처리
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    // 디바운스 처리
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Vercel Best Practice: bundle-preload
  // 학생 상세 페이지 프리로드 함수
  const preloadStudentDetail = useCallback((studentId: string) => {
    if (typeof window !== 'undefined') {
      // 상세 페이지 컴포넌트 프리로드
      void import('@/app/dashboard/students/[id]/page');
      // 해당 학생 데이터도 미리 fetch
      void fetch(`/api/students/${studentId}`);
    }
  }, []);

  // 학생 등록 핸들러
  const handleCreateStudent = async (data: CreateStudentInput | import('@/types/student').UpdateStudentInput) => {
    try {
      setIsSubmitting(true);
      const result = await createStudent(data as CreateStudentInput);

      if (result.success) {
        setShowAddModal(false);
      } else {
        alert(result.error || '학생 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('학생 등록 실패:', error);
      alert('학생 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 학생 삭제 핸들러
  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('정말 이 학생을 삭제하시겠습니까?')) return;

    try {
      const result = await deleteStudent(studentId);

      if (!result.success) {
        alert(result.error || '학생 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('학생 삭제 실패:', error);
      alert('학생 삭제에 실패했습니다.');
    }
  };

  // 필터 초기화
  const handleResetFilter = () => {
    setFilter({});
    setSearchTerm('');
    setDebouncedSearch('');
  };

  // 활성 필터 개수 계산
  const activeFilterCount = Object.values(filter).filter(Boolean).length;

  return (
    <div>
      <Header
        title="학생 관리"
        subtitle={`총 ${totalCount}명의 학생을 관리하고 있습니다`}
      />

      <div className="p-8">
        {/* 상단 액션 바 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="학생 이름, 학교, 학년 검색..."
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDebouncedSearch('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 필터 */}
            <div className="relative">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`btn-secondary flex items-center gap-2 ${activeFilterCount > 0 ? 'border-primary-500 text-primary-600' : ''}`}
              >
                <Filter className="w-4 h-4" />
                필터
                {activeFilterCount > 0 && (
                  <span className="bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showFilterPanel && (
                <FilterPanel
                  filter={filter}
                  onChange={setFilter}
                  onClose={() => setShowFilterPanel(false)}
                  onReset={handleResetFilter}
                />
              )}
            </div>
          </div>

          {/* 학생 추가 버튼 */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            학생 등록
          </button>
        </div>

        {/* 학생 목록 테이블 */}
        <div className="card p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <FileText className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">등록된 학생이 없습니다</p>
              <p className="text-sm">새 학생을 등록해주세요.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">학생</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">학교/학년</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">반</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">연락처</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">학부모</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">최근 성적</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">상태</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    isDropdownActive={activeDropdown === student.id}
                    onRowClick={() => {
                      setSelectedStudent(student);
                      setShowPreviewModal(true);
                    }}
                    onDropdownToggle={() => setActiveDropdown(activeDropdown === student.id ? null : student.id)}
                    onViewDetail={() => {
                      router.push(`/dashboard/students/${student.id}`);
                      setActiveDropdown(null);
                    }}
                    onEdit={() => {
                      setSelectedStudent(student);
                      setShowPreviewModal(true);
                      setActiveDropdown(null);
                    }}
                    onDelete={() => {
                      handleDeleteStudent(student.id);
                      setActiveDropdown(null);
                    }}
                    onPreloadDetail={() => preloadStudentDetail(student.id)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 학생 등록 모달 */}
      {showAddModal && (
        <StudentForm
          mode="create"
          onSubmit={handleCreateStudent}
          onClose={() => setShowAddModal(false)}
          isLoading={isSubmitting}
        />
      )}

      {/* 학생 미리보기 모달 */}
      {showPreviewModal && selectedStudent && (
        <StudentPreviewModal
          student={selectedStudent}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedStudent(null);
          }}
          onViewDetail={() => {
            router.push(`/dashboard/students/${selectedStudent.id}`);
          }}
          onEdit={() => {
            setShowPreviewModal(false);
            // 수정 모달로 전환하는 로직 필요시 추가
          }}
        />
      )}

      {/* 드롭다운 외부 클릭 감지 */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
}
