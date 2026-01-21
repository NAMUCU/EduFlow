/**
 * 외부 서비스 통합 export
 */

// Claude API (문제 생성 + OCR + 풀이 분석 + Vision)
export {
  generateProblems,
  recognizeImage,
  reviewProblem as reviewProblemClaude,
  analyzeSolution,
  type GeneratedProblem,
  type OCRResult,
  type ReviewResult as ClaudeReviewResult,
  type SolutionResult
} from './claude'

// Tally (문자 발송)
export {
  sendSMS,
  sendBulkSMS,
  scheduleSMS,
  getSMSHistory,
  getTemplates,
  getTemplate,
  applyTemplate,
  type SMSInput,
  type SMSResult,
  type SMSTemplate
} from './tally'

// PDF.co (PDF 변환/생성)
export {
  generatePDF,
  convertPDFToImage,
  convertImageToPDF,
  mergePDFs,
  extractText,
  generateProblemSheetPDF,
  type PDFGenerateInput,
  type PDFConvertInput,
  type PDFMergeInput,
  type PDFResult
} from './pdf-co'

// Gemini (문제 검수 + RAG)
export {
  reviewProblem as reviewProblemGemini,
  initRAGCorpus,
  uploadDocument,
  searchDocuments,
  answerWithRAG,
  type ReviewResult as GeminiReviewResult,
  type RAGDocument,
  type RAGSearchResult
} from './gemini'

// OpenAI ChatGPT (문제 검수)
export {
  reviewProblem as reviewProblemOpenAI,
  generateFeedback,
  simplifyExplanation,
  type ReviewResult as OpenAIReviewResult
} from './openai'

// 멀티 LLM 검수 통합
export {
  reviewWithProvider,
  reviewWithMultipleProviders,
  quickReview,
  fullReview,
  type ReviewProvider,
  type ReviewInput,
  type ReviewResult,
  type AggregatedReviewResult
} from './review'

// 카카오 알림톡
export {
  sendKakaoMessage,
  sendBulkKakaoMessages,
  scheduleKakaoMessage,
  getKakaoMessageHistory,
  getTemplates as getKakaoTemplates,
  getTemplate as getKakaoTemplate,
  applyTemplate as applyKakaoTemplate,
  isKakaoConfigured,
  type KakaoMessageInput,
  type KakaoMessageResult,
  type KakaoTemplate
} from './kakao'
