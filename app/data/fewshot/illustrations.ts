/**
 * 삽화 템플릿 (DALL-E 프롬프트용)
 * - 실생활 문제용 이미지 생성 가이드
 */

import { FewshotSample } from '@/types/fewshot'

// 삽화는 SVG가 아닌 DALL-E 프롬프트로 생성
export interface IllustrationPrompt {
  category: 'illustration'
  subcategory: string
  name: string
  description: string
  dallePrompt: string
  style: string
  avoidKeywords: string[]
}

export const ILLUSTRATION_PROMPTS: IllustrationPrompt[] = [
  // 거리/속력/시간
  {
    category: 'illustration',
    subcategory: 'distance',
    name: '거리-자동차',
    description: '자동차 이동 문제',
    dallePrompt: 'A simple educational illustration showing a car traveling on a straight road with distance markers, clean minimalist style, Korean educational textbook style',
    style: 'minimalist, educational, clean lines',
    avoidKeywords: ['realistic', 'photo', 'complex background']
  },
  {
    category: 'illustration',
    subcategory: 'distance',
    name: '거리-기차',
    description: '기차 이동 문제',
    dallePrompt: 'A simple educational illustration of a train traveling between two stations with distance markers, clean minimalist style, Korean educational textbook style',
    style: 'minimalist, educational, clean lines',
    avoidKeywords: ['realistic', 'photo', 'complex background']
  },
  {
    category: 'illustration',
    subcategory: 'speed',
    name: '속력-달리기',
    description: '달리기 속력 문제',
    dallePrompt: 'A simple educational illustration of a person running on a track with a timer, clean minimalist style, Korean educational textbook style',
    style: 'minimalist, educational, simple human figure',
    avoidKeywords: ['realistic', 'detailed face', 'complex']
  },

  // 농도 문제
  {
    category: 'illustration',
    subcategory: 'concentration',
    name: '농도-소금물',
    description: '소금물 농도 문제',
    dallePrompt: 'A simple educational illustration of two beakers with different concentrations of salt water being mixed, clean minimalist style with percentage labels, Korean educational textbook style',
    style: 'minimalist, educational, laboratory style',
    avoidKeywords: ['realistic', 'photo', 'complex lab equipment']
  },
  {
    category: 'illustration',
    subcategory: 'concentration',
    name: '농도-설탕물',
    description: '설탕물 농도 문제',
    dallePrompt: 'A simple educational illustration of sugar being dissolved in water with concentration labels, clean minimalist style, Korean educational textbook style',
    style: 'minimalist, educational',
    avoidKeywords: ['realistic', 'photo']
  },

  // 비율 문제
  {
    category: 'illustration',
    subcategory: 'ratio',
    name: '비율-톱니바퀴',
    description: '톱니바퀴 비율 문제',
    dallePrompt: 'A simple educational illustration of two interlocking gears of different sizes showing gear ratio, clean minimalist style, Korean educational textbook style',
    style: 'minimalist, mechanical, clean',
    avoidKeywords: ['realistic', 'complex machinery']
  },
  {
    category: 'illustration',
    subcategory: 'ratio',
    name: '비율-저울',
    description: '저울 비율 문제',
    dallePrompt: 'A simple educational illustration of a balance scale with objects on both sides showing ratio, clean minimalist style, Korean educational textbook style',
    style: 'minimalist, educational',
    avoidKeywords: ['realistic', 'photo']
  },

  // 통계 문제
  {
    category: 'illustration',
    subcategory: 'statistics',
    name: '통계-설문조사',
    description: '설문조사 통계 문제',
    dallePrompt: 'A simple educational illustration of people participating in a survey with bar chart results, clean minimalist style, Korean educational textbook style',
    style: 'minimalist, educational, infographic style',
    avoidKeywords: ['realistic faces', 'photo', 'complex']
  },
  {
    category: 'illustration',
    subcategory: 'statistics',
    name: '통계-주사위',
    description: '주사위 확률 문제',
    dallePrompt: 'A simple educational illustration of dice showing probability concept, clean minimalist style with number labels, Korean educational textbook style',
    style: 'minimalist, educational',
    avoidKeywords: ['realistic', 'photo', 'casino']
  },

  // 경제 문제
  {
    category: 'illustration',
    subcategory: 'economy',
    name: '경제-할인',
    description: '할인율 계산 문제',
    dallePrompt: 'A simple educational illustration of a price tag showing original price and discounted price with percentage, clean minimalist style, Korean educational textbook style',
    style: 'minimalist, educational, shopping theme',
    avoidKeywords: ['realistic', 'brand logos', 'complex store']
  },
  {
    category: 'illustration',
    subcategory: 'economy',
    name: '경제-이자',
    description: '이자 계산 문제',
    dallePrompt: 'A simple educational illustration of money growing over time with interest rate symbol, clean minimalist style with percentage and won symbol, Korean educational textbook style',
    style: 'minimalist, educational, financial theme',
    avoidKeywords: ['realistic money', 'bank logos', 'complex']
  },

  // 측정 문제
  {
    category: 'illustration',
    subcategory: 'measurement',
    name: '측정-건물높이',
    description: '건물 높이 측정 문제',
    dallePrompt: 'A simple educational illustration showing a person measuring building height using shadow and angle, clean minimalist style with angle markers, Korean educational textbook style',
    style: 'minimalist, educational, geometric',
    avoidKeywords: ['realistic buildings', 'photo', 'complex cityscape']
  },
  {
    category: 'illustration',
    subcategory: 'measurement',
    name: '측정-나무높이',
    description: '나무 높이 측정 문제',
    dallePrompt: 'A simple educational illustration showing measuring tree height using similar triangles and shadow, clean minimalist style with measurement labels, Korean educational textbook style',
    style: 'minimalist, educational, nature theme',
    avoidKeywords: ['realistic trees', 'photo', 'complex forest']
  }
]

/**
 * 삽화 프롬프트 찾기
 */
export function findIllustrationPrompt(keywords: string[]): IllustrationPrompt | null {
  const keywordSet = new Set(keywords.map(k => k.toLowerCase()))

  for (const prompt of ILLUSTRATION_PROMPTS) {
    // 이름이나 설명에 키워드가 포함되어 있는지 확인
    const nameMatches = keywords.some(k =>
      prompt.name.toLowerCase().includes(k) ||
      prompt.description.toLowerCase().includes(k)
    )

    if (nameMatches) {
      return prompt
    }

    // 서브카테고리 매칭
    if (keywordSet.has(prompt.subcategory)) {
      return prompt
    }
  }

  return null
}

/**
 * 삽화 프롬프트를 DALL-E API 형식으로 변환
 */
export function toDALLERequest(prompt: IllustrationPrompt): {
  prompt: string
  size: string
  quality: string
  style: string
} {
  return {
    prompt: `${prompt.dallePrompt}. Style: ${prompt.style}. Avoid: ${prompt.avoidKeywords.join(', ')}`,
    size: '1024x1024',
    quality: 'standard',
    style: 'natural'
  }
}

// 빈 배열 export (타입 호환용)
export const ILLUSTRATION_TEMPLATES: Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'>[] = []
