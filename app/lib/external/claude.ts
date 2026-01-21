/**
 * Claude API 클라이언트 - 문제 생성 + OCR + 풀이 분석 + Vision
 */
import Anthropic from '@anthropic-ai/sdk'

const isConfigured = () => !!process.env.ANTHROPIC_API_KEY
let client: Anthropic | null = null
const getClient = () => client || (client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }))

export interface GeneratedProblem { question: string; options?: string[]; answer: string; solution: string; difficulty: string; type: string; visualization?: { type: 'none' | 'geometry' | 'graph'; data?: Record<string, unknown> } }
export interface OCRResult { text: string; latex?: string; structure?: { question?: string; options?: string[]; answer?: string }; confidence: number }
export interface ReviewResult { isValid: boolean; score: number; issues: Array<{ type: 'error' | 'warning' | 'suggestion'; message: string }>; correctedProblem?: GeneratedProblem }
export interface SolutionResult { isCorrect: boolean; score: number; steps: Array<{ step: number; content: string; isCorrect: boolean }>; feedback: string; weakPoints: string[]; recommendations: string[] }

const mockProblems: GeneratedProblem[] = [
  { question: '$x^2 - 5x + 6 = 0$의 두 근의 합', answer: '5', solution: '근과 계수의 관계', difficulty: 'medium', type: 'equation' },
  { question: '삼각형 ABC (AB=5, BC=7, AC=8) 넓이', answer: '$10\\sqrt{3}$', solution: '헤론의 공식', difficulty: 'hard', type: 'geometry' }
]

export async function generateProblems(input: { subject: string; grade: string; unit: string; difficulty: string; type: string; count: number; fewShot?: string }): Promise<{ data: GeneratedProblem[]; error?: string }> {
  if (!isConfigured()) return { data: mockProblems.slice(0, input.count) }
  try {
    const r = await getClient().messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: '한국 교육과정 문제 생성. JSON: { "problems": [...] }', messages: [{ role: 'user', content: `${input.count}개: ${input.subject} ${input.grade} ${input.unit} ${input.difficulty} ${input.type}${input.fewShot ? `\n예시:\n${input.fewShot}` : ''}` }] })
    const t = r.content[0].type === 'text' ? r.content[0].text : '', j = t.match(/\{[\s\S]*\}/)?.[0]
    return j ? { data: JSON.parse(j).problems } : { data: [], error: '파싱실패' }
  } catch (e) { return { data: [], error: e instanceof Error ? e.message : '실패' } }
}

export async function recognizeImage(input: { imageBase64: string; imageType: string; extractType: string }): Promise<{ data: OCRResult | null; error?: string }> {
  if (!isConfigured()) return { data: { text: 'x² - 5x + 6 = 0', latex: 'x^2 - 5x + 6 = 0', structure: { question: '$x^2-5x+6=0$을 풀어라' }, confidence: 0.95 } }
  try {
    const r = await getClient().messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: input.imageType as 'image/jpeg', data: input.imageBase64 } }, { type: 'text', text: '텍스트추출+수식LaTeX변환. JSON:{text,latex,structure,confidence}' }] }] })
    const t = r.content[0].type === 'text' ? r.content[0].text : '', j = t.match(/\{[\s\S]*\}/)?.[0]
    return j ? { data: JSON.parse(j) } : { data: { text: t, confidence: 0.8 } }
  } catch (e) { return { data: null, error: e instanceof Error ? e.message : '실패' } }
}

export async function reviewProblem(input: { problem: { question: string; answer: string; solution: string }; criteria?: string[] }): Promise<{ data: ReviewResult | null; error?: string }> {
  if (!isConfigured()) return { data: { isValid: true, score: 92, issues: [{ type: 'suggestion', message: '중간과정 추가 권장' }] } }
  try {
    const r = await getClient().messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 2048, messages: [{ role: 'user', content: `검수: ${input.problem.question}\n정답:${input.problem.answer}\n풀이:${input.problem.solution}\nJSON:{isValid,score,issues}` }] })
    const t = r.content[0].type === 'text' ? r.content[0].text : '', j = t.match(/\{[\s\S]*\}/)?.[0]
    return j ? { data: JSON.parse(j) } : { data: null, error: '파싱실패' }
  } catch (e) { return { data: null, error: e instanceof Error ? e.message : '실패' } }
}

export async function analyzeSolution(input: { problem: { question: string; answer: string }; solution: string; imageBase64?: string }): Promise<{ data: SolutionResult | null; error?: string }> {
  if (!isConfigured()) return { data: { isCorrect: true, score: 85, steps: [{ step: 1, content: '인수분해', isCorrect: true }], feedback: '잘했어요', weakPoints: [], recommendations: ['심화도전'] } }
  try {
    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = input.imageBase64 ? [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: input.imageBase64 } }, { type: 'text', text: `문제:${input.problem.question} 정답:${input.problem.answer} 분석해줘 JSON` }] : `문제:${input.problem.question} 정답:${input.problem.answer} 풀이:${input.solution} JSON:{isCorrect,score,steps,feedback,weakPoints,recommendations}`
    const r = await getClient().messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 2048, messages: [{ role: 'user', content }] })
    const t = r.content[0].type === 'text' ? r.content[0].text : '', j = t.match(/\{[\s\S]*\}/)?.[0]
    return j ? { data: JSON.parse(j) } : { data: null, error: '파싱실패' }
  } catch (e) { return { data: null, error: e instanceof Error ? e.message : '실패' } }
}
