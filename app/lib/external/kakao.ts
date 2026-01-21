/**
 * 카카오 알림톡 API 클라이언트
 */

const isConfigured = () => !!process.env.KAKAO_API_KEY && !!process.env.KAKAO_SENDER_KEY

export interface KakaoMessageInput {
  to: string | string[]
  templateId: string
  variables: Record<string, string>
  scheduledAt?: Date
}

export interface KakaoMessageResult {
  success: boolean
  messageId?: string
  error?: string
  sentCount?: number
}

export interface KakaoTemplate {
  id: string
  name: string
  content: string
  variables: string[]
  buttons?: Array<{
    type: 'WL' | 'AL' | 'DS' | 'BK' | 'MD'
    name: string
    urlMobile?: string
    urlPc?: string
  }>
}

// 알림톡 템플릿 정의
const templates: KakaoTemplate[] = [
  {
    id: 'assignment',
    name: '과제 알림',
    content: '[#{academyName}] #{studentName}님, 새로운 과제가 등록되었습니다.\n\n과제명: #{assignmentTitle}\n마감일: #{deadline}\n\n아래 버튼을 눌러 확인해주세요.',
    variables: ['academyName', 'studentName', 'assignmentTitle', 'deadline', 'link'],
    buttons: [{ type: 'WL', name: '과제 확인하기', urlMobile: '#{link}', urlPc: '#{link}' }]
  },
  {
    id: 'report',
    name: '보고서 알림',
    content: '[#{academyName}] #{studentName} 학생의 #{reportType} 보고서가 도착했습니다.\n\n기간: #{period}\n\n아래 버튼을 눌러 확인해주세요.',
    variables: ['academyName', 'studentName', 'reportType', 'period', 'link'],
    buttons: [{ type: 'WL', name: '보고서 보기', urlMobile: '#{link}', urlPc: '#{link}' }]
  },
  {
    id: 'attendance',
    name: '출석 알림',
    content: '[#{academyName}] #{studentName}님이 #{time}에 출석하였습니다.\n\n오늘도 열심히 공부해요!',
    variables: ['academyName', 'studentName', 'time']
  },
  {
    id: 'absence',
    name: '결석 알림',
    content: '[#{academyName}] #{studentName}님이 #{date} 수업에 결석하였습니다.\n\n사유가 있으시면 학원으로 연락 부탁드립니다.\n📞 #{academyPhone}',
    variables: ['academyName', 'studentName', 'date', 'academyPhone']
  },
  {
    id: 'reminder',
    name: '과제 리마인더',
    content: '[#{academyName}] #{studentName}님, 아직 제출하지 않은 과제가 있습니다.\n\n과제명: #{assignmentTitle}\n마감일: #{deadline}\n\n잊지 말고 제출해주세요!',
    variables: ['academyName', 'studentName', 'assignmentTitle', 'deadline', 'link'],
    buttons: [{ type: 'WL', name: '과제 제출하기', urlMobile: '#{link}', urlPc: '#{link}' }]
  },
  {
    id: 'schedule_change',
    name: '수업 일정 변경',
    content: '[#{academyName}] #{studentName}님, 수업 일정이 변경되었습니다.\n\n변경 전: #{beforeSchedule}\n변경 후: #{afterSchedule}\n\n확인 부탁드립니다.',
    variables: ['academyName', 'studentName', 'beforeSchedule', 'afterSchedule']
  }
]

export function getTemplates(): KakaoTemplate[] {
  return templates
}

export function getTemplate(id: string): KakaoTemplate | undefined {
  return templates.find(t => t.id === id)
}

export function applyTemplate(templateId: string, variables: Record<string, string>): string {
  const template = getTemplate(templateId)
  if (!template) return ''
  let content = template.content
  Object.entries(variables).forEach(([k, v]) => {
    content = content.replace(new RegExp(`#\\{${k}\\}`, 'g'), v)
  })
  return content
}

function applyButtonVariables(
  buttons: KakaoTemplate['buttons'],
  variables: Record<string, string>
): KakaoTemplate['buttons'] {
  if (!buttons) return undefined
  return buttons.map(button => {
    const newButton = { ...button }
    if (newButton.urlMobile) {
      Object.entries(variables).forEach(([k, v]) => {
        newButton.urlMobile = newButton.urlMobile!.replace(new RegExp(`#\\{${k}\\}`, 'g'), v)
      })
    }
    if (newButton.urlPc) {
      Object.entries(variables).forEach(([k, v]) => {
        newButton.urlPc = newButton.urlPc!.replace(new RegExp(`#\\{${k}\\}`, 'g'), v)
      })
    }
    return newButton
  })
}

export async function sendKakaoMessage(input: KakaoMessageInput): Promise<KakaoMessageResult> {
  const template = getTemplate(input.templateId)
  if (!template) {
    return { success: false, error: `템플릿을 찾을 수 없습니다: ${input.templateId}` }
  }

  const content = applyTemplate(input.templateId, input.variables)
  const recipients = Array.isArray(input.to) ? input.to : [input.to]

  // Mock 모드 (API 키 미설정 시)
  if (!isConfigured()) {
    console.log('[Mock 카카오 알림톡]', {
      to: recipients,
      template: input.templateId,
      content: content.substring(0, 100) + '...'
    })
    return {
      success: true,
      messageId: `mock-kakao-${Date.now()}`,
      sentCount: recipients.length
    }
  }

  try {
    // 카카오 알림톡 API 호출
    const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `KakaoAK ${process.env.KAKAO_API_KEY}`
      },
      body: new URLSearchParams({
        template_id: input.templateId,
        sender_key: process.env.KAKAO_SENDER_KEY!,
        receiver_uuids: JSON.stringify(recipients.map(phone => formatPhoneNumber(phone))),
        template_args: JSON.stringify(input.variables),
        ...(input.scheduledAt && { scheduled_at: input.scheduledAt.toISOString() })
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      messageId: data.result_id || data.message_id || `kakao-${Date.now()}`,
      sentCount: recipients.length
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : '알림톡 발송 실패'
    }
  }
}

export async function sendBulkKakaoMessages(
  messages: Array<{ to: string; templateId: string; variables: Record<string, string> }>
): Promise<{ results: KakaoMessageResult[]; successCount: number; failCount: number }> {
  const results = await Promise.all(
    messages.map(m => sendKakaoMessage({ to: m.to, templateId: m.templateId, variables: m.variables }))
  )
  return {
    results,
    successCount: results.filter(r => r.success).length,
    failCount: results.filter(r => !r.success).length
  }
}

export async function scheduleKakaoMessage(
  input: KakaoMessageInput & { scheduledAt: Date }
): Promise<KakaoMessageResult> {
  return sendKakaoMessage(input)
}

// 전화번호 형식 변환 (하이픈 제거)
function formatPhoneNumber(phone: string): string {
  return phone.replace(/-/g, '').replace(/\s/g, '')
}

// 알림톡 발송 가능 여부 확인
export function isKakaoConfigured(): boolean {
  return isConfigured()
}

// 알림톡 발송 내역 조회 (Mock)
export async function getKakaoMessageHistory(filter: {
  from?: Date
  to?: Date
  status?: 'sent' | 'failed' | 'scheduled'
}): Promise<{
  data: Array<{
    id: string
    to: string
    templateId: string
    content: string
    status: string
    sentAt: string
  }>
}> {
  if (!isConfigured()) {
    return {
      data: [
        {
          id: 'mock-kakao-1',
          to: '010-1234-5678',
          templateId: 'assignment',
          content: '테스트 알림톡 메시지',
          status: 'sent',
          sentAt: new Date().toISOString()
        }
      ]
    }
  }

  // 실제 API 연동 시 구현
  try {
    const params = new URLSearchParams()
    if (filter.from) params.set('from', filter.from.toISOString())
    if (filter.to) params.set('to', filter.to.toISOString())
    if (filter.status) params.set('status', filter.status)

    // 카카오 비즈니스 API는 별도 발송 내역 API가 없어 로컬 DB에서 관리해야 함
    return { data: [] }
  } catch {
    return { data: [] }
  }
}
