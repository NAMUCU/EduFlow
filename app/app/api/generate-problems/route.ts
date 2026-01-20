import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// 추가 요청사항 옵션 라벨
const requestOptionLabels: Record<string, string> = {
  focus_concept: '특정 개념 집중',
  avoid_concept: '특정 개념 제외',
  problem_style: '문제 스타일',
  difficulty_detail: '난이도 세부 요청',
  mistake_prevention: '실수 방지 유형',
  real_life: '실생활 연계',
  step_by_step: '단계별 풀이',
  custom: '기타 요청',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode = 'unit', additionalRequests = [] } = body

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    let prompt: string

    // 추가 요청사항 문자열 생성
    const additionalRequestsText = additionalRequests.length > 0
      ? `\n## 추가 요청사항 (반드시 반영해주세요)\n${additionalRequests.map((req: any) =>
          `- ${requestOptionLabels[req.option] || req.option}: ${req.value}`
        ).join('\n')}`
      : ''

    if (mode === 'mockexam') {
      // 모의고사 모드
      const { subject, grade, count, units, difficultyMix, typeMix } = body

      prompt = `
당신은 ${grade} ${subject} 전문 교사입니다. 모의고사용 문제를 ${count}개 생성해주세요.

## 조건
- 과목: ${subject}
- 학년: ${grade}
- 문제 수: ${count}개
- 출제 범위 단원: ${units.join(', ')}
${difficultyMix ? '- 난이도: 하/중/상 골고루 섞어서 출제' : '- 난이도: 중'}
${typeMix ? '- 문제 유형: 객관식/단답형/계산형/서술형 다양하게' : '- 문제 유형: 객관식 위주'}
${additionalRequestsText}

## 출력 형식 (JSON 배열)
반드시 아래 형식의 JSON 배열만 출력하세요. 다른 텍스트는 포함하지 마세요.

[
  {
    "question": "문제 내용",
    "answer": "정답",
    "solution": "풀이 과정 (단계별로 설명)",
    "difficulty": "하/중/상 중 하나",
    "type": "객관식/단답형/계산형/서술형 중 하나",
    "unit": "해당 문제가 속한 단원명"
  }
]

## 중요 사항
- 각 문제마다 반드시 "unit" 필드에 해당 단원명을 정확히 기재해주세요
- 출제 범위 내의 단원들에서 골고루 출제해주세요
- 문제는 ${grade} 수준에 맞게 출제
- 풀이는 학생이 이해하기 쉽게 단계별로 작성
${difficultyMix ? '- 난이도 하/중/상을 적절히 배분 (예: 하 30%, 중 40%, 상 30%)' : ''}
- JSON 형식만 출력 (마크다운 코드블록 없이)
`
    } else {
      // 단원별 생성 모드
      const { subject, grade, unit, difficulty, type, count, school, curriculum } = body

      // 커리큘럼 정보 문자열 생성
      let curriculumText = ''
      if (curriculum) {
        curriculumText = `
## 단원 커리큘럼 정보 (이 내용을 기반으로 문제 출제)
${curriculum.concepts ? `- 핵심 개념: ${curriculum.concepts.join(', ')}` : ''}
${curriculum.objectives ? `- 학습 목표: ${curriculum.objectives.join(' / ')}` : ''}
${curriculum.terms ? `- 주요 용어: ${curriculum.terms.join(', ')}` : ''}
${curriculum.problemTypes ? `- 권장 문제 유형: ${curriculum.problemTypes.join(', ')}` : ''}
`
      }

      prompt = `
당신은 ${grade} ${subject} 전문 교사입니다. 다음 조건에 맞는 문제를 ${count}개 생성해주세요.

## 조건
- 과목: ${subject}
- 학년: ${grade}
- 단원: ${unit}
- 난이도: ${difficulty} (하/중/상 중 ${difficulty})
- 문제 유형: ${type}
${school ? `- 학교: ${school} (이 학교 기출 경향 반영)` : ''}
${curriculumText}
${additionalRequestsText}

## 출력 형식 (JSON 배열)
반드시 아래 형식의 JSON 배열만 출력하세요. 다른 텍스트는 포함하지 마세요.

[
  {
    "question": "문제 내용",
    "answer": "정답",
    "solution": "풀이 과정 (단계별로 설명)",
    "difficulty": "${difficulty}",
    "type": "${type}"
  }
]

## 주의사항
- 문제는 ${grade} 수준에 맞게 출제
- 풀이는 학생이 이해하기 쉽게 단계별로 작성
- 난이도 "${difficulty}"에 맞는 적절한 복잡도
- ${type} 유형에 맞는 문제 형식
- 커리큘럼의 핵심 개념과 학습 목표를 반영하여 출제
- JSON 형식만 출력 (마크다운 코드블록 없이)
`
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // JSON 파싱 시도
    let problems
    try {
      // 마크다운 코드블록 제거
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      problems = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('JSON 파싱 실패:', text)
      return NextResponse.json(
        { error: 'AI 응답 파싱 실패', raw: text },
        { status: 500 }
      )
    }

    // ID 추가
    const problemsWithId = problems.map((p: any, index: number) => ({
      id: index + 1,
      ...p
    }))

    return NextResponse.json({ problems: problemsWithId })

  } catch (error: any) {
    console.error('Gemini API 에러:', error)
    return NextResponse.json(
      { error: error.message || '문제 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
