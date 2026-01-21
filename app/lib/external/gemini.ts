/**
 * Gemini API 클라이언트 - 문제 검수 + RAG
 */

const isConfigured = () => !!process.env.GEMINI_API_KEY
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

export interface ReviewResult { isValid: boolean; score: number; issues: Array<{ type: 'error' | 'warning' | 'suggestion'; message: string }> }
export interface RAGDocument { id: string; name: string; content: string; metadata?: Record<string, unknown> }
export interface RAGSearchResult { documents: Array<{ id: string; content: string; score: number; metadata?: Record<string, unknown> }> }

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const response = await fetch(`${API_BASE}/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    })
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function reviewProblem(input: { problem: { question: string; answer: string; solution: string }; criteria?: string[] }): Promise<{ data: ReviewResult | null; error?: string }> {
  if (!isConfigured()) return { data: { isValid: true, score: 88, issues: [{ type: 'suggestion', message: '설명을 더 자세히' }] } }
  try {
    const criteria = input.criteria || ['정답 정확성', '풀이 논리성', '교육과정 적합성']
    const text = await callGemini(`문제 검수:\n문제: ${input.problem.question}\n정답: ${input.problem.answer}\n풀이: ${input.problem.solution}\n\n검수기준: ${criteria.join(', ')}\n\nJSON으로 응답: { "isValid": boolean, "score": 0-100, "issues": [{ "type": "error|warning|suggestion", "message": "..." }] }`)
    const json = text.match(/\{[\s\S]*\}/)?.[0]
    return json ? { data: JSON.parse(json) } : { data: null, error: '파싱 실패' }
  } catch (e) { return { data: null, error: e instanceof Error ? e.message : '검수 실패' } }
}

// RAG (Gemini File Search API)
let fileSearchCorpus: string | null = null

export async function initRAGCorpus(corpusName: string): Promise<{ success: boolean; corpusId?: string; error?: string }> {
  if (!isConfigured()) { fileSearchCorpus = 'mock-corpus'; return { success: true, corpusId: 'mock-corpus' } }
  try {
    const response = await fetch(`${API_BASE}/corpora?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: corpusName })
    })
    const data = await response.json()
    fileSearchCorpus = data.name
    return { success: true, corpusId: data.name }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : '초기화 실패' } }
}

export async function uploadDocument(doc: RAGDocument): Promise<{ success: boolean; documentId?: string; error?: string }> {
  if (!isConfigured()) return { success: true, documentId: `mock-doc-${doc.id}` }
  if (!fileSearchCorpus) await initRAGCorpus('eduflow-corpus')
  try {
    const response = await fetch(`${API_BASE}/${fileSearchCorpus}/documents?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: doc.name, rawDocument: { content: doc.content, mimeType: 'text/plain' }, customMetadata: doc.metadata })
    })
    const data = await response.json()
    return { success: true, documentId: data.name }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : '업로드 실패' } }
}

export async function searchDocuments(query: string, limit = 5): Promise<{ data: RAGSearchResult; error?: string }> {
  if (!isConfigured()) return { data: { documents: [{ id: 'mock-1', content: '이차방정식 x²+2x+1=0의 해는...', score: 0.95 }, { id: 'mock-2', content: '근의 공식을 이용하면...', score: 0.85 }] } }
  if (!fileSearchCorpus) await initRAGCorpus('eduflow-corpus')
  try {
    const response = await fetch(`${API_BASE}/${fileSearchCorpus}:query?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, resultsCount: limit })
    })
    const data = await response.json()
    return { data: { documents: data.relevantChunks?.map((c: { chunk: { data: { stringValue: string } }; chunkRelevanceScore: number }) => ({ id: c.chunk.data.stringValue.substring(0, 20), content: c.chunk.data.stringValue, score: c.chunkRelevanceScore })) || [] } }
  } catch (e) { return { data: { documents: [] }, error: e instanceof Error ? e.message : '검색 실패' } }
}

export async function answerWithRAG(question: string): Promise<{ answer: string; sources: Array<{ content: string; score: number }>; error?: string }> {
  const searchResult = await searchDocuments(question, 3)
  if (searchResult.error) return { answer: '', sources: [], error: searchResult.error }
  const context = searchResult.data.documents.map(d => d.content).join('\n\n')
  if (!isConfigured()) return { answer: `${question}에 대한 답변입니다. 참고 문서를 기반으로 작성되었습니다.`, sources: searchResult.data.documents }
  try {
    const answer = await callGemini(`다음 문서를 참고하여 질문에 답하세요.\n\n문서:\n${context}\n\n질문: ${question}`)
    return { answer, sources: searchResult.data.documents }
  } catch (e) { return { answer: '', sources: [], error: e instanceof Error ? e.message : '답변 생성 실패' } }
}
