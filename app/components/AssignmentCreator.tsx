'use client';

import { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  Calendar,
  Clock,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  AssignmentCreationStep,
  ASSIGNMENT_CREATION_STEP_LABELS,
  AssignmentFormState,
  INITIAL_ASSIGNMENT_FORM_STATE,
  GradingType,
  GRADING_TYPE_LABELS,
} from '@/types/assignment';
import { Problem, Student, User, PROBLEM_DIFFICULTY_LABELS } from '@/types/database';

// 단계별 순서
const STEPS: AssignmentCreationStep[] = [
  'basic_info',
  'select_problems',
  'select_students',
  'set_deadline',
  'confirm',
];

interface AssignmentCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssignmentFormState['data']) => Promise<void>;
  availableProblems: Problem[];
  availableStudents: (Student & { user: User })[];
  availableClasses: { id: string; name: string; student_ids: string[] }[];
}

export default function AssignmentCreator({
  isOpen,
  onClose,
  onSubmit,
  availableProblems,
  availableStudents,
  availableClasses,
}: AssignmentCreatorProps) {
  const [formState, setFormState] = useState<AssignmentFormState>(INITIAL_ASSIGNMENT_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchProblem, setSearchProblem] = useState('');
  const [searchStudent, setSearchStudent] = useState('');

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setFormState(INITIAL_ASSIGNMENT_FORM_STATE);
      setSearchProblem('');
      setSearchStudent('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStepIndex = STEPS.indexOf(formState.step);

  // 다음 단계로 이동
  const goToNextStep = () => {
    const errors = validateCurrentStep();
    if (Object.keys(errors).length > 0) {
      setFormState((prev) => ({ ...prev, errors }));
      return;
    }

    setFormState((prev) => ({
      ...prev,
      errors: {},
      step: STEPS[currentStepIndex + 1],
    }));
  };

  // 이전 단계로 이동
  const goToPrevStep = () => {
    setFormState((prev) => ({
      ...prev,
      errors: {},
      step: STEPS[currentStepIndex - 1],
    }));
  };

  // 현재 단계 검증
  const validateCurrentStep = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const { data } = formState;

    switch (formState.step) {
      case 'basic_info':
        if (!data.title.trim()) {
          errors.title = '과제 제목을 입력해주세요.';
        }
        break;
      case 'select_problems':
        if (data.selectedProblems.length === 0) {
          errors.problems = '최소 1개 이상의 문제를 선택해주세요.';
        }
        break;
      case 'select_students':
        if (data.selectedStudents.length === 0) {
          errors.students = '최소 1명 이상의 학생을 선택해주세요.';
        }
        break;
    }

    return errors;
  };

  // 폼 데이터 업데이트
  const updateFormData = <K extends keyof AssignmentFormState['data']>(
    key: K,
    value: AssignmentFormState['data'][K]
  ) => {
    setFormState((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
      errors: { ...prev.errors, [key]: undefined },
    }));
  };

  // 문제 선택/해제
  const toggleProblem = (problem: Problem) => {
    const isSelected = formState.data.selectedProblems.some((p) => p.id === problem.id);
    if (isSelected) {
      updateFormData(
        'selectedProblems',
        formState.data.selectedProblems.filter((p) => p.id !== problem.id)
      );
    } else {
      updateFormData('selectedProblems', [...formState.data.selectedProblems, problem]);
    }
  };

  // 학생 선택/해제
  const toggleStudent = (student: Student & { user: User }) => {
    const isSelected = formState.data.selectedStudents.some((s) => s.id === student.id);
    if (isSelected) {
      updateFormData(
        'selectedStudents',
        formState.data.selectedStudents.filter((s) => s.id !== student.id)
      );
    } else {
      updateFormData('selectedStudents', [...formState.data.selectedStudents, student]);
    }
  };

  // 반 전체 선택
  const selectClass = (classInfo: { id: string; name: string; student_ids: string[] }) => {
    const classStudents = availableStudents.filter((s) =>
      classInfo.student_ids.includes(s.id)
    );
    const newSelectedStudents = [...formState.data.selectedStudents];

    classStudents.forEach((student) => {
      if (!newSelectedStudents.some((s) => s.id === student.id)) {
        newSelectedStudents.push(student);
      }
    });

    updateFormData('selectedStudents', newSelectedStudents);
  };

  // 제출 처리
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formState.data);
      onClose();
    } catch (error) {
      console.error('과제 생성 오류:', error);
      setFormState((prev) => ({
        ...prev,
        errors: { submit: '과제 생성에 실패했습니다. 다시 시도해주세요.' },
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 필터링된 문제 목록
  const filteredProblems = availableProblems.filter((problem) =>
    problem.question.toLowerCase().includes(searchProblem.toLowerCase())
  );

  // 필터링된 학생 목록
  const filteredStudents = availableStudents.filter((student) =>
    student.user.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    (student.grade && student.grade.includes(searchStudent))
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">새 과제 만들기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 진행 단계 표시 */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <span
                      className={`ml-2 text-sm ${
                        isCurrent ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {ASSIGNMENT_CREATION_STEP_LABELS[step]}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 본문 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 기본 정보 단계 */}
          {formState.step === 'basic_info' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  과제 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.data.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="예: 중1 정수와 유리수 연습 문제"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    formState.errors.title ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {formState.errors.title && (
                  <p className="mt-1 text-sm text-red-500">{formState.errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  과제 설명
                </label>
                <textarea
                  value={formState.data.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="학생들에게 전달할 안내 사항을 입력하세요."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  채점 방식
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {(Object.keys(GRADING_TYPE_LABELS) as GradingType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => updateFormData('gradingType', type)}
                      className={`p-4 border rounded-xl text-center transition-all ${
                        formState.data.gradingType === type
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">{GRADING_TYPE_LABELS[type]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 문제 선택 단계 */}
          {formState.step === 'select_problems' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchProblem}
                    onChange={(e) => setSearchProblem(e.target.value)}
                    placeholder="문제 검색..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{formState.data.selectedProblems.length}개 선택됨</span>
                </div>
              </div>

              {formState.errors.problems && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formState.errors.problems}</span>
                </div>
              )}

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {filteredProblems.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      검색 결과가 없습니다.
                    </div>
                  ) : (
                    filteredProblems.map((problem) => {
                      const isSelected = formState.data.selectedProblems.some(
                        (p) => p.id === problem.id
                      );
                      return (
                        <div
                          key={problem.id}
                          onClick={() => toggleProblem(problem)}
                          className={`p-4 border-b last:border-b-0 cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                                isSelected
                                  ? 'bg-primary-500 border-primary-500 text-white'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3" /> : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 line-clamp-2">
                                {problem.question}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    problem.difficulty === 'easy'
                                      ? 'bg-green-100 text-green-700'
                                      : problem.difficulty === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {PROBLEM_DIFFICULTY_LABELS[problem.difficulty]}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {problem.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 학생 선택 단계 */}
          {formState.step === 'select_students' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="학생 이름 또는 학년으로 검색..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{formState.data.selectedStudents.length}명 선택됨</span>
                </div>
              </div>

              {formState.errors.students && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formState.errors.students}</span>
                </div>
              )}

              {/* 반 전체 선택 버튼 */}
              <div className="flex flex-wrap gap-2">
                {availableClasses.map((classInfo) => (
                  <button
                    key={classInfo.id}
                    onClick={() => selectClass(classInfo)}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    {classInfo.name} 전체 선택
                  </button>
                ))}
                <button
                  onClick={() => updateFormData('selectedStudents', [])}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-500"
                >
                  선택 초기화
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      검색 결과가 없습니다.
                    </div>
                  ) : (
                    filteredStudents.map((student) => {
                      const isSelected = formState.data.selectedStudents.some(
                        (s) => s.id === student.id
                      );
                      return (
                        <div
                          key={student.id}
                          onClick={() => toggleStudent(student)}
                          className={`p-4 border-b last:border-b-0 cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${
                                isSelected
                                  ? 'bg-primary-500 border-primary-500 text-white'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3" /> : null}
                            </div>
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-700 font-medium">
                                {student.user.name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {student.user.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {student.grade} | {student.school_name} {student.class_name}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 마감일 설정 단계 */}
          {formState.step === 'set_deadline' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    마감일
                  </label>
                  <input
                    type="date"
                    value={formState.data.dueDate}
                    onChange={(e) => updateFormData('dueDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    마감 시간
                  </label>
                  <input
                    type="time"
                    value={formState.data.dueTime}
                    onChange={(e) => updateFormData('dueTime', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제한 시간 (분)
                </label>
                <input
                  type="number"
                  value={formState.data.timeLimit || ''}
                  onChange={(e) =>
                    updateFormData(
                      'timeLimit',
                      e.target.value ? parseInt(e.target.value, 10) : null
                    )
                  }
                  placeholder="제한 없음"
                  min={1}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  비워두면 제한 시간 없이 진행됩니다.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.data.shuffleProblems}
                    onChange={(e) => updateFormData('shuffleProblems', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">문제 순서 섞기</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.data.showAnswersAfterSubmit}
                    onChange={(e) =>
                      updateFormData('showAnswersAfterSubmit', e.target.checked)
                    }
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">제출 후 정답 공개</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.data.allowRetry}
                    onChange={(e) => updateFormData('allowRetry', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">재시도 허용</span>
                </label>
              </div>
            </div>
          )}

          {/* 확인 단계 */}
          {formState.step === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">과제 설정이 완료되었습니다</p>
                  <p className="text-sm text-green-700 mt-1">
                    아래 내용을 확인하고 과제를 생성하세요.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-3">기본 정보</h3>
                  <dl className="space-y-2">
                    <div className="flex">
                      <dt className="w-24 text-sm text-gray-500">제목</dt>
                      <dd className="flex-1 text-sm text-gray-900">
                        {formState.data.title}
                      </dd>
                    </div>
                    {formState.data.description && (
                      <div className="flex">
                        <dt className="w-24 text-sm text-gray-500">설명</dt>
                        <dd className="flex-1 text-sm text-gray-900">
                          {formState.data.description}
                        </dd>
                      </div>
                    )}
                    <div className="flex">
                      <dt className="w-24 text-sm text-gray-500">채점 방식</dt>
                      <dd className="flex-1 text-sm text-gray-900">
                        {GRADING_TYPE_LABELS[formState.data.gradingType]}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    선택된 문제 ({formState.data.selectedProblems.length}개)
                  </h3>
                  <ul className="space-y-2">
                    {formState.data.selectedProblems.slice(0, 3).map((problem, index) => (
                      <li key={problem.id} className="text-sm text-gray-600">
                        {index + 1}. {problem.question.slice(0, 50)}...
                      </li>
                    ))}
                    {formState.data.selectedProblems.length > 3 && (
                      <li className="text-sm text-gray-400">
                        외 {formState.data.selectedProblems.length - 3}개 문제
                      </li>
                    )}
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    배정 학생 ({formState.data.selectedStudents.length}명)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formState.data.selectedStudents.map((student) => (
                      <span
                        key={student.id}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                      >
                        {student.user.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-3">마감일 및 옵션</h3>
                  <dl className="space-y-2">
                    <div className="flex">
                      <dt className="w-24 text-sm text-gray-500">마감일</dt>
                      <dd className="flex-1 text-sm text-gray-900">
                        {formState.data.dueDate
                          ? `${formState.data.dueDate} ${formState.data.dueTime}`
                          : '설정하지 않음'}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="w-24 text-sm text-gray-500">제한 시간</dt>
                      <dd className="flex-1 text-sm text-gray-900">
                        {formState.data.timeLimit
                          ? `${formState.data.timeLimit}분`
                          : '제한 없음'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {formState.errors.submit && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formState.errors.submit}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 (버튼) */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={currentStepIndex === 0 ? onClose : goToPrevStep}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStepIndex === 0 ? '취소' : '이전'}
          </button>

          {currentStepIndex < STEPS.length - 1 ? (
            <button
              onClick={goToNextStep}
              className="px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 flex items-center gap-2"
            >
              다음
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  과제 생성
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
