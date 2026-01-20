'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Send,
  Users,
  MessageSquare,
  Search,
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  User,
  Phone,
} from 'lucide-react'
import {
  SmsRecipient,
  SmsTemplate,
  SmsRecipientType,
  SMS_RECIPIENT_TYPE_LABELS,
} from '@/types/sms'
import {
  ALL_TEMPLATES,
  TEMPLATE_GROUPS,
  applyTemplate,
  getMessageInfo,
  generateTemplatePreview,
  extractVariablesFromTemplate,
} from '@/lib/sms-templates'

// ============================================
// UI 텍스트 상수
// ============================================

const UI_TEXT = {
  title: 'SMS 문자 발송',
  recipientTitle: '수신자 선택',
  recipientSearch: '이름 또는 전화번호로 검색',
  recipientSelected: '명 선택됨',
  recipientStudent: '학생',
  recipientParent: '학부모',
  recipientAll: '전체',
  recipientNone: '수신자를 선택해주세요',
  templateTitle: '템플릿 선택',
  templateNone: '템플릿을 선택하거나 직접 작성하세요',
  templatePreview: '미리보기',
  messageTitle: '메시지 작성',
  messagePlaceholder: '메시지 내용을 입력하세요...',
  variableTitle: '변수 입력',
  variablePlaceholder: '값을 입력하세요',
  sendButton: '문자 발송',
  sendingButton: '발송 중...',
  previewTitle: '발송 미리보기',
  characterCount: '자',
  messageType: '메시지 타입',
  remaining: '남은 글자',
  sendSuccess: '문자가 성공적으로 발송되었습니다.',
  sendPartialSuccess: '일부 문자 발송에 실패했습니다.',
  sendFailed: '문자 발송에 실패했습니다.',
  errorNoRecipient: '수신자를 선택해주세요.',
  errorNoMessage: '메시지 내용을 입력해주세요.',
  errorMissingVariables: '필수 변수를 모두 입력해주세요.',
  selectAll: '전체 선택',
  deselectAll: '선택 해제',
  mockModeWarning: '테스트 모드: 실제 문자가 발송되지 않습니다.',
}

// ============================================
// 컴포넌트 Props 타입
// ============================================

interface SmsSenderProps {
  /** 선택 가능한 수신자 목록 */
  recipients: SmsRecipient[]
  /** 발송 완료 콜백 */
  onSendComplete?: (result: {
    success: boolean
    successCount: number
    failedCount: number
  }) => void
  /** 기본 선택된 수신자 ID 목록 */
  defaultSelectedIds?: string[]
  /** Mock 모드 여부 */
  isMockMode?: boolean
  /** 클래스명 */
  className?: string
}

// ============================================
// SMS 발송 컴포넌트
// ============================================

export default function SmsSender({
  recipients,
  onSendComplete,
  defaultSelectedIds = [],
  isMockMode = false,
  className = '',
}: SmsSenderProps) {
  // ============================================
  // 상태 관리
  // ============================================

  // 수신자 관련 상태
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(
    new Set(defaultSelectedIds)
  )
  const [recipientFilter, setRecipientFilter] = useState<SmsRecipientType | 'all'>('all')
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('')
  const [isRecipientExpanded, setIsRecipientExpanded] = useState(true)

  // 템플릿 관련 상태
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null)
  const [isTemplateExpanded, setIsTemplateExpanded] = useState(true)

  // 메시지 관련 상태
  const [message, setMessage] = useState('')
  const [variables, setVariables] = useState<Record<string, string>>({})

  // 발송 관련 상태
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{
    type: 'success' | 'partial' | 'error'
    message: string
    successCount?: number
    failedCount?: number
  } | null>(null)

  // ============================================
  // 계산된 값
  // ============================================

  // 필터링된 수신자 목록
  const filteredRecipients = useMemo(() => {
    return recipients.filter((recipient) => {
      // 타입 필터
      if (recipientFilter !== 'all' && recipient.type !== recipientFilter) {
        return false
      }

      // 검색어 필터
      if (recipientSearchQuery) {
        const query = recipientSearchQuery.toLowerCase()
        return (
          recipient.name.toLowerCase().includes(query) ||
          recipient.phone.includes(query) ||
          (recipient.studentName && recipient.studentName.toLowerCase().includes(query))
        )
      }

      return true
    })
  }, [recipients, recipientFilter, recipientSearchQuery])

  // 선택된 수신자 목록
  const selectedRecipients = useMemo(() => {
    return recipients.filter((r) => selectedRecipientIds.has(r.id))
  }, [recipients, selectedRecipientIds])

  // 메시지 정보
  const messageInfo = useMemo(() => {
    return getMessageInfo(message)
  }, [message])

  // 필요한 변수 목록
  const requiredVariables = useMemo(() => {
    if (!selectedTemplate) return []
    return extractVariablesFromTemplate(selectedTemplate.content)
  }, [selectedTemplate])

  // 발송 가능 여부
  const canSend = useMemo(() => {
    if (selectedRecipientIds.size === 0) return false
    if (!message.trim()) return false
    if (requiredVariables.length > 0) {
      const missingVars = requiredVariables.filter(
        (v) => !variables[v] || variables[v].trim() === ''
      )
      // studentName, recipientName은 자동으로 채워지므로 제외
      const actualMissing = missingVars.filter(
        (v) => v !== 'studentName' && v !== 'recipientName'
      )
      if (actualMissing.length > 0) return false
    }
    return true
  }, [selectedRecipientIds.size, message, requiredVariables, variables])

  // ============================================
  // 이벤트 핸들러
  // ============================================

  // 수신자 선택/해제
  const handleRecipientToggle = useCallback((recipientId: string) => {
    setSelectedRecipientIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(recipientId)) {
        newSet.delete(recipientId)
      } else {
        newSet.add(recipientId)
      }
      return newSet
    })
  }, [])

  // 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    const allFiltered = new Set(filteredRecipients.map((r) => r.id))
    const isAllSelected = filteredRecipients.every((r) => selectedRecipientIds.has(r.id))

    if (isAllSelected) {
      // 전체 해제
      setSelectedRecipientIds((prev) => {
        const newSet = new Set(prev)
        allFiltered.forEach((id) => newSet.delete(id))
        return newSet
      })
    } else {
      // 전체 선택
      setSelectedRecipientIds((prev) => {
        const newSet = new Set(prev)
        allFiltered.forEach((id) => newSet.add(id))
        return newSet
      })
    }
  }, [filteredRecipients, selectedRecipientIds])

  // 템플릿 선택
  const handleTemplateSelect = useCallback((template: SmsTemplate) => {
    setSelectedTemplate(template)
    setMessage(template.content)
    setVariables({})
    setSendResult(null)
  }, [])

  // 변수 값 변경
  const handleVariableChange = useCallback(
    (key: string, value: string) => {
      const newVariables = { ...variables, [key]: value }
      setVariables(newVariables)

      // 메시지 업데이트
      if (selectedTemplate) {
        setMessage(applyTemplate(selectedTemplate.content, newVariables))
      }
    },
    [variables, selectedTemplate]
  )

  // 메시지 직접 수정
  const handleMessageChange = useCallback((newMessage: string) => {
    setMessage(newMessage)
    setSelectedTemplate(null) // 직접 수정시 템플릿 선택 해제
    setSendResult(null)
  }, [])

  // SMS 발송
  const handleSend = useCallback(async () => {
    if (!canSend) return

    setIsSending(true)
    setSendResult(null)

    try {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: selectedRecipients,
          message,
          templateId: selectedTemplate?.id,
          variables,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const bulkResult = data.bulkResult
        if (bulkResult) {
          if (bulkResult.failedCount === 0) {
            setSendResult({
              type: 'success',
              message: UI_TEXT.sendSuccess,
              successCount: bulkResult.successCount,
              failedCount: 0,
            })
          } else if (bulkResult.successCount > 0) {
            setSendResult({
              type: 'partial',
              message: UI_TEXT.sendPartialSuccess,
              successCount: bulkResult.successCount,
              failedCount: bulkResult.failedCount,
            })
          } else {
            setSendResult({
              type: 'error',
              message: UI_TEXT.sendFailed,
              successCount: 0,
              failedCount: bulkResult.failedCount,
            })
          }

          onSendComplete?.({
            success: bulkResult.successCount > 0,
            successCount: bulkResult.successCount,
            failedCount: bulkResult.failedCount,
          })
        } else if (data.result) {
          setSendResult({
            type: data.result.success ? 'success' : 'error',
            message: data.result.success ? UI_TEXT.sendSuccess : UI_TEXT.sendFailed,
            successCount: data.result.success ? 1 : 0,
            failedCount: data.result.success ? 0 : 1,
          })

          onSendComplete?.({
            success: data.result.success,
            successCount: data.result.success ? 1 : 0,
            failedCount: data.result.success ? 0 : 1,
          })
        }
      } else {
        setSendResult({
          type: 'error',
          message: data.error || UI_TEXT.sendFailed,
        })

        onSendComplete?.({
          success: false,
          successCount: 0,
          failedCount: selectedRecipients.length,
        })
      }
    } catch (error) {
      console.error('SMS 발송 오류:', error)
      setSendResult({
        type: 'error',
        message: error instanceof Error ? error.message : UI_TEXT.sendFailed,
      })

      onSendComplete?.({
        success: false,
        successCount: 0,
        failedCount: selectedRecipients.length,
      })
    } finally {
      setIsSending(false)
    }
  }, [canSend, selectedRecipients, message, selectedTemplate, variables, onSendComplete])

  // ============================================
  // 렌더링
  // ============================================

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary-500" />
          {UI_TEXT.title}
        </h2>
        {isMockMode && (
          <div className="mt-2 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{UI_TEXT.mockModeWarning}</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* 수신자 선택 섹션 */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsRecipientExpanded(!isRecipientExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">{UI_TEXT.recipientTitle}</span>
              <span className="text-sm text-primary-500 font-medium">
                {selectedRecipientIds.size}
                {UI_TEXT.recipientSelected}
              </span>
            </div>
            {isRecipientExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {isRecipientExpanded && (
            <div className="p-4 space-y-4">
              {/* 필터 및 검색 */}
              <div className="flex flex-wrap gap-4">
                {/* 타입 필터 */}
                <div className="flex gap-2">
                  {(['all', 'student', 'parent'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setRecipientFilter(type)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        recipientFilter === type
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'all'
                        ? UI_TEXT.recipientAll
                        : SMS_RECIPIENT_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>

                {/* 검색 */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={recipientSearchQuery}
                      onChange={(e) => setRecipientSearchQuery(e.target.value)}
                      placeholder={UI_TEXT.recipientSearch}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* 전체 선택/해제 */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                >
                  {filteredRecipients.every((r) => selectedRecipientIds.has(r.id))
                    ? UI_TEXT.deselectAll
                    : UI_TEXT.selectAll}
                </button>
                <span className="text-sm text-gray-500">
                  {filteredRecipients.length}명 중 {selectedRecipientIds.size}명 선택
                </span>
              </div>

              {/* 수신자 목록 */}
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {filteredRecipients.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {UI_TEXT.recipientNone}
                  </div>
                ) : (
                  filteredRecipients.map((recipient) => (
                    <label
                      key={recipient.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedRecipientIds.has(recipient.id) ? 'bg-primary-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipientIds.has(recipient.id)}
                        onChange={() => handleRecipientToggle(recipient.id)}
                        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{recipient.name}</span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              recipient.type === 'student'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {SMS_RECIPIENT_TYPE_LABELS[recipient.type]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Phone className="w-3 h-3 text-gray-300" />
                          <span className="text-sm text-gray-500">{recipient.phone}</span>
                          {recipient.studentName && (
                            <span className="text-xs text-gray-400">
                              ({recipient.studentName} 학부모)
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 템플릿 선택 섹션 */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsTemplateExpanded(!isTemplateExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">{UI_TEXT.templateTitle}</span>
              {selectedTemplate && (
                <span className="text-sm text-primary-500 font-medium">
                  {selectedTemplate.name}
                </span>
              )}
            </div>
            {isTemplateExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {isTemplateExpanded && (
            <div className="p-4 space-y-4">
              {TEMPLATE_GROUPS.map((group) => (
                <div key={group.category}>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{group.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* 템플릿 미리보기 */}
              {selectedTemplate && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {UI_TEXT.templatePreview}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {generateTemplatePreview(selectedTemplate)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 변수 입력 섹션 (템플릿 선택 시) */}
        {selectedTemplate && requiredVariables.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              {UI_TEXT.variableTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {requiredVariables
                .filter((v) => v !== 'studentName' && v !== 'recipientName')
                .map((variableKey) => {
                  const variableInfo = selectedTemplate.variables.find(
                    (v) => v.key === variableKey
                  )
                  return (
                    <div key={variableKey}>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        {variableInfo?.label || variableKey}
                      </label>
                      <input
                        type="text"
                        value={variables[variableKey] || ''}
                        onChange={(e) => handleVariableChange(variableKey, e.target.value)}
                        placeholder={variableInfo?.example || UI_TEXT.variablePlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      {variableInfo?.description && (
                        <p className="text-xs text-gray-400 mt-1">{variableInfo.description}</p>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* 메시지 작성 섹션 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {UI_TEXT.messageTitle}
          </label>
          <textarea
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            placeholder={UI_TEXT.messagePlaceholder}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
          <div className="flex justify-between items-center mt-2 text-xs">
            <div className="flex gap-4 text-gray-500">
              <span>
                {messageInfo.length}
                {UI_TEXT.characterCount} ({messageInfo.byteLength} bytes)
              </span>
              <span>
                {UI_TEXT.messageType}:{' '}
                <span
                  className={`font-medium ${
                    messageInfo.type === 'LMS' ? 'text-amber-600' : 'text-green-600'
                  }`}
                >
                  {messageInfo.type}
                </span>
              </span>
            </div>
            <span
              className={`${
                messageInfo.remaining < 0 ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              {UI_TEXT.remaining}: {messageInfo.remaining} bytes
            </span>
          </div>
        </div>

        {/* 발송 결과 메시지 */}
        {sendResult && (
          <div
            className={`flex items-start gap-3 p-4 rounded-lg ${
              sendResult.type === 'success'
                ? 'bg-green-50 text-green-700'
                : sendResult.type === 'partial'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {sendResult.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">{sendResult.message}</p>
              {(sendResult.successCount !== undefined ||
                sendResult.failedCount !== undefined) && (
                <p className="text-sm mt-1">
                  성공: {sendResult.successCount || 0}건, 실패: {sendResult.failedCount || 0}건
                </p>
              )}
            </div>
          </div>
        )}

        {/* 발송 버튼 */}
        <button
          onClick={handleSend}
          disabled={!canSend || isSending}
          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            canSend && !isSending
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSending ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              {UI_TEXT.sendingButton}
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {UI_TEXT.sendButton}
            </>
          )}
        </button>

        {/* 발송 불가 사유 표시 */}
        {!canSend && !isSending && (
          <p className="text-center text-sm text-gray-500">
            {selectedRecipientIds.size === 0
              ? UI_TEXT.errorNoRecipient
              : !message.trim()
              ? UI_TEXT.errorNoMessage
              : UI_TEXT.errorMissingVariables}
          </p>
        )}
      </div>
    </div>
  )
}
