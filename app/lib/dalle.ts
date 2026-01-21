/**
 * DALL-E 3 이미지 생성 서비스
 * 수학 문제용 삽화 생성
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export interface IllustrationResult {
  url: string
  revised_prompt?: string
}

export interface IllustrationError {
  error: string
  code?: string
}

/**
 * DALL-E 3로 교육용 삽화 생성
 */
export async function generateIllustration(
  description: string,
  options?: {
    size?: '1024x1024' | '1024x1792' | '1792x1024'
    quality?: 'standard' | 'hd'
    style?: 'natural' | 'vivid'
  }
): Promise<IllustrationResult | IllustrationError> {
  if (!OPENAI_API_KEY) {
    return { error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }
  }

  const { size = '1024x1024', quality = 'standard', style = 'natural' } = options || {}

  // 교육용 스타일 프롬프트 추가
  const enhancedPrompt = `교육용 수학 문제 삽화입니다.
스타일: 깔끔한 2D 벡터 일러스트레이션, 단순하고 명확한 선, 교과서 스타일
배경: 흰색 또는 연한 색
내용: ${description}
주의: 텍스트나 숫자를 포함하지 마세요. 오직 시각적 요소만 그려주세요.`

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size,
        quality,
        style,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        error: errorData.error?.message || `HTTP ${response.status}`,
        code: errorData.error?.code,
      }
    }

    const data = await response.json()
    return {
      url: data.data[0].url,
      revised_prompt: data.data[0].revised_prompt,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '이미지 생성 실패',
    }
  }
}

/**
 * 수학 문제 유형별 삽화 프롬프트 템플릿
 */
export const ILLUSTRATION_TEMPLATES = {
  // 실생활 응용 문제
  water_tank: (details?: string) =>
    `물탱크에 물이 채워지는 모습, 수도꼭지에서 물이 나옴, 물높이 표시 ${details || ''}`,

  projectile: (details?: string) =>
    `공을 던지는 사람, 포물선 궤적 점선으로 표시, 운동장 배경 ${details || ''}`,

  roller_coaster: (details?: string) =>
    `롤러코스터 트랙, 부드러운 곡선, 높낮이 변화 ${details || ''}`,

  building: (details?: string) =>
    `건물 측면도, 높이 측정 표시, 그림자 ${details || ''}`,

  bridge: (details?: string) =>
    `아치형 다리 또는 현수교, 강 위에 놓인 모습 ${details || ''}`,

  clock: (details?: string) =>
    `아날로그 시계, 시침과 분침, 숫자 없음 ${details || ''}`,

  ladder: (details?: string) =>
    `벽에 기대어 있는 사다리, 직각삼각형 형태 ${details || ''}`,

  shadow: (details?: string) =>
    `햇빛에 의한 그림자, 물체와 그림자의 관계 ${details || ''}`,

  // 도형 관련
  box: (details?: string) =>
    `3D 직육면체 상자, 전개도 옆에 표시 ${details || ''}`,

  cone: (details?: string) =>
    `원뿔 모양 아이스크림 콘 또는 고깔모자 ${details || ''}`,

  cylinder: (details?: string) =>
    `원기둥 모양 음료캔 또는 파이프 ${details || ''}`,

  // 통계/확률
  dice: (details?: string) =>
    `주사위 여러 개, 다양한 면이 보이도록 ${details || ''}`,

  cards: (details?: string) =>
    `트럼프 카드 몇 장, 뒷면과 앞면 ${details || ''}`,

  spinner: (details?: string) =>
    `회전판, 여러 색상 구역으로 나뉨 ${details || ''}`,

  survey: (details?: string) =>
    `설문조사하는 사람들, 손에 종이 들고 있음 ${details || ''}`,
}

/**
 * 템플릿으로 삽화 생성
 */
export async function generateFromTemplate(
  template: keyof typeof ILLUSTRATION_TEMPLATES,
  details?: string,
  options?: Parameters<typeof generateIllustration>[1]
): Promise<IllustrationResult | IllustrationError> {
  const prompt = ILLUSTRATION_TEMPLATES[template](details)
  return generateIllustration(prompt, options)
}

/**
 * 이미지 URL이 유효한지 확인
 */
export function isIllustrationResult(
  result: IllustrationResult | IllustrationError
): result is IllustrationResult {
  return 'url' in result && typeof result.url === 'string'
}
