/**
 * OpenAI API 클라이언트 - 문제 검수 (ChatGPT)
 */

const isConfigured = () => !!process.env.OPENAI_API_KEY

export interface ReviewResult { isValid: boolean; score: number; issues: Array<{ type: 'error' | 'warning' | 'suggestion'; message: string }> }

async function callChatGPT(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, model = 'gpt-4o'): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 2048 })
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function reviewProblem(input: { problem: { question: string; answer: string; solution: string }; criteria?: string[] }): Promise<{ data: ReviewResult | null; error?: string }> {
  if (!isConfigured()) return { data: { isValid: true, score: 90, issues: [{ type: 'suggestion', message: '예시를 추가하면 좋겠습니다' }] } }
  try {
    const criteria = input.criteria || ['정답 정확성', '풀이 논리성', '교육과정 적합성']
    const text = await callChatGPT([
      { role: 'system', content: '당신은 한국 교육과정 전문가입니다. 문제를 검수하고 JSON으로 응답하세요.' },
      { role: 'user', content: `문제 검수:\n문제: ${input.problem.question}\n정답: ${input.problem.answer}\n풀이: ${input.problem.solution}\n\n검수기준: ${criteria.join(', ')}\n\nJSON: { "isValid": boolean, "score": 0-100, "issues": [{ "type": "error|warning|suggestion", "message": "..." }] }` }
    ])
    const json = text.match(/\{[\s\S]*\}/)?.[0]
    return json ? { data: JSON.parse(json) } : { data: null, error: '파싱 실패' }
  } catch (e) { return { data: null, error: e instanceof Error ? e.message : '검수 실패' } }
}

export async function generateFeedback(input: { problem: string; studentAnswer: string; correctAnswer: string }): Promise<{ feedback: string; error?: string }> {
  if (!isConfigured()) return { feedback: '잘 풀었어요! 다만 중간 과정을 더 자세히 쓰면 좋겠습니다.' }
  try {
    const text = await callChatGPT([
      { role: 'system', content: '학생에게 친절하고 격려하는 피드백을 제공하세요. 한국어로 답변하세요.' },
      { role: 'user', content: `문제: ${input.problem}\n학생 답: ${input.studentAnswer}\n정답: ${input.correctAnswer}\n\n학생에게 도움이 되는 피드백을 작성해주세요.` }
    ])
    return { feedback: text }
  } catch (e) { return { feedback: '', error: e instanceof Error ? e.message : '생성 실패' } }
}

export async function simplifyExplanation(text: string, targetGrade: string): Promise<{ simplified: string; error?: string }> {
  if (!isConfigured()) return { simplified: `${targetGrade} 수준으로 쉽게 설명하면: ${text.substring(0, 100)}...` }
  try {
    const result = await callChatGPT([
      { role: 'system', content: `당신은 ${targetGrade} 학생에게 설명하는 선생님입니다.` },
      { role: 'user', content: `다음 내용을 ${targetGrade} 학생이 이해할 수 있게 쉽게 설명해주세요:\n\n${text}` }
    ])
    return { simplified: result }
  } catch (e) { return { simplified: '', error: e instanceof Error ? e.message : '변환 실패' } }
}
