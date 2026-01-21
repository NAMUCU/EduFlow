/**
 * Tally API 클라이언트 - 문자 발송
 */

const isConfigured = () => !!process.env.TALLY_API_KEY && !!process.env.TALLY_SENDER_NUMBER

export interface SMSInput { to: string | string[]; message: string; scheduledAt?: Date }
export interface SMSResult { success: boolean; messageId?: string; error?: string; sentCount?: number }
export interface SMSTemplate { id: string; name: string; content: string; variables: string[] }

const templates: SMSTemplate[] = [
  { id: 'assignment', name: '과제 알림', content: '[{academyName}] {studentName}님, 새 과제가 도착했습니다.\n{link}', variables: ['academyName', 'studentName', 'link'] },
  { id: 'report', name: '보고서 알림', content: '[{academyName}] {studentName} 학습 보고서가 도착했습니다.\n{link}', variables: ['academyName', 'studentName', 'link'] },
  { id: 'attendance', name: '출석 알림', content: '[{academyName}] {studentName}님이 {time}에 출석했습니다.', variables: ['academyName', 'studentName', 'time'] },
  { id: 'reminder', name: '리마인더', content: '[{academyName}] {studentName}님, 아직 제출하지 않은 과제가 있습니다.\n마감: {deadline}', variables: ['academyName', 'studentName', 'deadline'] }
]

export function getTemplates(): SMSTemplate[] { return templates }
export function getTemplate(id: string): SMSTemplate | undefined { return templates.find(t => t.id === id) }

export function applyTemplate(templateId: string, variables: Record<string, string>): string {
  const template = getTemplate(templateId)
  if (!template) return ''
  let content = template.content
  Object.entries(variables).forEach(([k, v]) => { content = content.replace(new RegExp(`\\{${k}\\}`, 'g'), v) })
  return content
}

export async function sendSMS(input: SMSInput): Promise<SMSResult> {
  if (!isConfigured()) {
    console.log('[Mock SMS]', input.to, input.message.substring(0, 50))
    return { success: true, messageId: `mock-${Date.now()}`, sentCount: Array.isArray(input.to) ? input.to.length : 1 }
  }
  try {
    const recipients = Array.isArray(input.to) ? input.to : [input.to]
    const response = await fetch('https://api.tally.so/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.TALLY_API_KEY}` },
      body: JSON.stringify({ from: process.env.TALLY_SENDER_NUMBER, to: recipients, message: input.message, scheduledAt: input.scheduledAt?.toISOString() })
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return { success: true, messageId: data.messageId, sentCount: recipients.length }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : '발송 실패' } }
}

export async function sendBulkSMS(messages: Array<{ to: string; message: string }>): Promise<{ results: SMSResult[]; successCount: number; failCount: number }> {
  const results = await Promise.all(messages.map(m => sendSMS(m)))
  return { results, successCount: results.filter(r => r.success).length, failCount: results.filter(r => !r.success).length }
}

export async function scheduleSMS(input: SMSInput & { scheduledAt: Date }): Promise<SMSResult> {
  return sendSMS(input)
}

export async function getSMSHistory(filter: { from?: Date; to?: Date; status?: 'sent' | 'failed' | 'scheduled' }): Promise<{ data: Array<{ id: string; to: string; message: string; status: string; sentAt: string }> }> {
  if (!isConfigured()) return { data: [{ id: 'mock-1', to: '010-1234-5678', message: '테스트 메시지', status: 'sent', sentAt: new Date().toISOString() }] }
  try {
    const params = new URLSearchParams()
    if (filter.from) params.set('from', filter.from.toISOString())
    if (filter.to) params.set('to', filter.to.toISOString())
    if (filter.status) params.set('status', filter.status)
    const response = await fetch(`https://api.tally.so/sms/history?${params}`, { headers: { 'Authorization': `Bearer ${process.env.TALLY_API_KEY}` } })
    return await response.json()
  } catch { return { data: [] } }
}
