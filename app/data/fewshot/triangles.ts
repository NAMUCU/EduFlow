/**
 * 삼각형 SVG 템플릿
 */

import { FewshotSample } from '@/types/fewshot'

export const TRIANGLE_TEMPLATES: Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    category: 'triangle',
    subcategory: 'basic',
    tags: ['angle_mark'],
    name: '기본 삼각형',
    description: '세 꼭짓점 A, B, C를 가진 기본 삼각형',
    svg_code: `<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
  <polygon points="100,20 20,160 180,160" fill="none" stroke="#333" stroke-width="2"/>
  <text x="100" y="12" text-anchor="middle" font-size="14">A</text>
  <text x="12" y="175" text-anchor="middle" font-size="14">B</text>
  <text x="188" y="175" text-anchor="middle" font-size="14">C</text>
</svg>`,
    metadata: {
      points: [
        { x: 100, y: 20, label: 'A' },
        { x: 20, y: 160, label: 'B' },
        { x: 180, y: 160, label: 'C' }
      ]
    }
  },
  {
    category: 'triangle',
    subcategory: 'height',
    tags: ['dotted_line', 'right_angle', 'height_line'],
    name: '삼각형-높이',
    description: '꼭짓점 A에서 밑변 BC에 내린 수선(높이)',
    svg_code: `<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
  <polygon points="100,20 20,160 180,160" fill="none" stroke="#333" stroke-width="2"/>
  <line x1="100" y1="20" x2="100" y2="160" stroke="#333" stroke-width="1.5" stroke-dasharray="5,5"/>
  <rect x="100" y="150" width="10" height="10" fill="none" stroke="#333" stroke-width="1"/>
  <text x="100" y="12" text-anchor="middle" font-size="14">A</text>
  <text x="12" y="175" text-anchor="middle" font-size="14">B</text>
  <text x="188" y="175" text-anchor="middle" font-size="14">C</text>
  <text x="108" y="175" text-anchor="start" font-size="14">H</text>
  <text x="85" y="95" text-anchor="end" font-size="12" fill="#666">h</text>
</svg>`,
    metadata: {
      points: [
        { x: 100, y: 20, label: 'A' },
        { x: 20, y: 160, label: 'B' },
        { x: 180, y: 160, label: 'C' },
        { x: 100, y: 160, label: 'H' }
      ]
    }
  },
  {
    category: 'triangle',
    subcategory: 'circumcenter',
    tags: ['dotted_line', 'auxiliary_line'],
    name: '삼각형-외심',
    description: '외심과 외접원',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="70" fill="none" stroke="#2d70b3" stroke-width="1.5"/>
  <polygon points="100,30 41,145 159,145" fill="none" stroke="#333" stroke-width="2"/>
  <circle cx="100" cy="100" r="4" fill="#c74440"/>
  <line x1="100" y1="30" x2="100" y2="100" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="41" y1="145" x2="100" y2="100" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="159" y1="145" x2="100" y2="100" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="100" y="22" text-anchor="middle" font-size="14">A</text>
  <text x="33" y="160" text-anchor="middle" font-size="14">B</text>
  <text x="167" y="160" text-anchor="middle" font-size="14">C</text>
  <text x="108" y="95" text-anchor="start" font-size="14" fill="#c74440">O</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'triangle',
    subcategory: 'incenter',
    tags: ['dotted_line', 'auxiliary_line'],
    name: '삼각형-내심',
    description: '내심과 내접원',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <polygon points="100,30 30,170 170,170" fill="none" stroke="#333" stroke-width="2"/>
  <circle cx="100" cy="123" r="35" fill="none" stroke="#388c46" stroke-width="1.5"/>
  <circle cx="100" cy="123" r="4" fill="#388c46"/>
  <line x1="100" y1="30" x2="100" y2="123" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="30" y1="170" x2="100" y2="123" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="170" y1="170" x2="100" y2="123" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="100" y="22" text-anchor="middle" font-size="14">A</text>
  <text x="22" y="180" text-anchor="middle" font-size="14">B</text>
  <text x="178" y="180" text-anchor="middle" font-size="14">C</text>
  <text x="108" y="118" text-anchor="start" font-size="14" fill="#388c46">I</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'triangle',
    subcategory: 'centroid',
    tags: ['dotted_line', 'auxiliary_line'],
    name: '삼각형-무게중심',
    description: '무게중심과 중선',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <polygon points="100,30 30,170 170,170" fill="none" stroke="#333" stroke-width="2"/>
  <line x1="100" y1="30" x2="100" y2="170" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="30" y1="170" x2="135" y2="100" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="170" y1="170" x2="65" y2="100" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <circle cx="100" cy="123" r="4" fill="#6042a6"/>
  <text x="100" y="22" text-anchor="middle" font-size="14">A</text>
  <text x="22" y="180" text-anchor="middle" font-size="14">B</text>
  <text x="178" y="180" text-anchor="middle" font-size="14">C</text>
  <text x="108" y="118" text-anchor="start" font-size="14" fill="#6042a6">G</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'triangle',
    subcategory: 'pythagorean',
    tags: ['right_angle', 'length_label'],
    name: '직각삼각형-피타고라스',
    description: '피타고라스 정리를 위한 직각삼각형',
    svg_code: `<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
  <polygon points="20,160 180,160 180,40" fill="none" stroke="#333" stroke-width="2"/>
  <rect x="170" y="150" width="10" height="10" fill="none" stroke="#333" stroke-width="1"/>
  <text x="12" y="175" text-anchor="middle" font-size="14">A</text>
  <text x="188" y="175" text-anchor="middle" font-size="14">B</text>
  <text x="188" y="35" text-anchor="middle" font-size="14">C</text>
  <text x="100" y="175" text-anchor="middle" font-size="12" fill="#2d70b3">a</text>
  <text x="190" y="100" text-anchor="start" font-size="12" fill="#c74440">b</text>
  <text x="90" y="95" text-anchor="end" font-size="12" fill="#388c46">c</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'triangle',
    subcategory: 'trigonometry',
    tags: ['right_angle', 'angle_mark', 'length_label'],
    name: '직각삼각형-삼각비',
    description: '삼각비(sin, cos, tan)를 위한 직각삼각형',
    svg_code: `<svg viewBox="0 0 220 180" xmlns="http://www.w3.org/2000/svg">
  <polygon points="20,160 180,160 180,40" fill="none" stroke="#333" stroke-width="2"/>
  <rect x="170" y="150" width="10" height="10" fill="none" stroke="#333" stroke-width="1"/>
  <path d="M 40,160 A 20,20 0 0,0 35,145" fill="none" stroke="#2d70b3" stroke-width="1.5"/>
  <text x="50" y="150" font-size="12" fill="#2d70b3">θ</text>
  <text x="12" y="175" text-anchor="middle" font-size="14">A</text>
  <text x="188" y="175" text-anchor="middle" font-size="14">B</text>
  <text x="188" y="35" text-anchor="middle" font-size="14">C</text>
  <text x="100" y="175" text-anchor="middle" font-size="11" fill="#666">밑변</text>
  <text x="195" y="100" text-anchor="start" font-size="11" fill="#666">높이</text>
  <text x="85" y="95" text-anchor="end" font-size="11" fill="#666">빗변</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'triangle',
    subcategory: 'similarity',
    tags: ['equal_mark', 'angle_mark'],
    name: '닮은 삼각형',
    description: '닮음비가 있는 두 삼각형',
    svg_code: `<svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
  <polygon points="30,140 90,140 60,60" fill="none" stroke="#333" stroke-width="2"/>
  <polygon points="130,140 250,140 190,20" fill="none" stroke="#2d70b3" stroke-width="2"/>
  <text x="60" y="50" text-anchor="middle" font-size="12">A</text>
  <text x="22" y="152" text-anchor="middle" font-size="12">B</text>
  <text x="98" y="152" text-anchor="middle" font-size="12">C</text>
  <text x="190" y="12" text-anchor="middle" font-size="12">A'</text>
  <text x="122" y="152" text-anchor="middle" font-size="12">B'</text>
  <text x="258" y="152" text-anchor="middle" font-size="12">C'</text>
  <text x="140" y="100" font-size="11" fill="#666">닮음비 1:2</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'triangle',
    subcategory: 'congruence',
    tags: ['equal_mark'],
    name: '합동 삼각형',
    description: '합동인 두 삼각형 (SSS, SAS, ASA)',
    svg_code: `<svg viewBox="0 0 260 140" xmlns="http://www.w3.org/2000/svg">
  <polygon points="20,120 100,120 60,30" fill="none" stroke="#333" stroke-width="2"/>
  <polygon points="140,120 220,120 180,30" fill="none" stroke="#2d70b3" stroke-width="2"/>
  <line x1="55" y1="75" x2="65" y2="75" stroke="#c74440" stroke-width="2"/>
  <line x1="175" y1="75" x2="185" y2="75" stroke="#c74440" stroke-width="2"/>
  <line x1="38" y1="95" x2="42" y2="85" stroke="#388c46" stroke-width="2"/>
  <line x1="158" y1="95" x2="162" y2="85" stroke="#388c46" stroke-width="2"/>
  <text x="60" y="22" text-anchor="middle" font-size="12">A</text>
  <text x="12" y="132" text-anchor="middle" font-size="12">B</text>
  <text x="108" y="132" text-anchor="middle" font-size="12">C</text>
  <text x="180" y="22" text-anchor="middle" font-size="12">A'</text>
  <text x="132" y="132" text-anchor="middle" font-size="12">B'</text>
  <text x="228" y="132" text-anchor="middle" font-size="12">C'</text>
</svg>`,
    metadata: {}
  }
]
