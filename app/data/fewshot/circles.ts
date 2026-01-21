/**
 * 원 SVG 템플릿
 */

import { FewshotSample } from '@/types/fewshot'

export const CIRCLE_TEMPLATES: Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    category: 'circle',
    subcategory: 'basic',
    tags: [],
    name: '기본 원',
    description: '중심 O, 반지름 r인 원',
    svg_code: `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
  <circle cx="80" cy="80" r="60" fill="none" stroke="#333" stroke-width="2"/>
  <circle cx="80" cy="80" r="3" fill="#333"/>
  <line x1="80" y1="80" x2="140" y2="80" stroke="#2d70b3" stroke-width="1.5"/>
  <text x="80" y="72" text-anchor="middle" font-size="14">O</text>
  <text x="110" y="72" text-anchor="middle" font-size="12" fill="#2d70b3">r</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'circle',
    subcategory: 'chord',
    tags: ['dotted_line', 'auxiliary_line'],
    name: '원-현',
    description: '원의 현과 중심에서 현까지의 거리',
    svg_code: `<svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <circle cx="90" cy="90" r="70" fill="none" stroke="#333" stroke-width="2"/>
  <circle cx="90" cy="90" r="3" fill="#333"/>
  <line x1="35" y1="55" x2="145" y2="125" stroke="#2d70b3" stroke-width="2"/>
  <line x1="90" y1="90" x2="90" y2="90" stroke="#333" stroke-width="1"/>
  <line x1="90" y1="90" x2="67" y2="113" stroke="#c74440" stroke-width="1.5" stroke-dasharray="4,4"/>
  <circle cx="67" cy="113" r="2" fill="#c74440"/>
  <rect x="70" y="106" width="8" height="8" fill="none" stroke="#333" stroke-width="1" transform="rotate(45, 74, 110)"/>
  <text x="90" y="82" text-anchor="middle" font-size="14">O</text>
  <text x="27" y="50" text-anchor="middle" font-size="14">A</text>
  <text x="153" y="130" text-anchor="middle" font-size="14">B</text>
  <text x="60" y="125" text-anchor="middle" font-size="12">M</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'circle',
    subcategory: 'tangent',
    tags: ['right_angle', 'auxiliary_line'],
    name: '원-접선',
    description: '원의 접선과 접점',
    svg_code: `<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
  <circle cx="80" cy="90" r="60" fill="none" stroke="#333" stroke-width="2"/>
  <circle cx="80" cy="90" r="3" fill="#333"/>
  <line x1="140" y1="30" x2="140" y2="150" stroke="#2d70b3" stroke-width="2"/>
  <line x1="80" y1="90" x2="140" y2="90" stroke="#c74440" stroke-width="1.5" stroke-dasharray="4,4"/>
  <circle cx="140" cy="90" r="3" fill="#388c46"/>
  <rect x="130" y="90" width="10" height="10" fill="none" stroke="#333" stroke-width="1"/>
  <text x="80" y="82" text-anchor="middle" font-size="14">O</text>
  <text x="148" y="95" text-anchor="start" font-size="14" fill="#388c46">T</text>
  <text x="155" y="50" text-anchor="start" font-size="12" fill="#2d70b3">접선</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'circle',
    subcategory: 'inscribed',
    tags: ['auxiliary_line'],
    name: '원-내접다각형',
    description: '원에 내접하는 삼각형',
    svg_code: `<svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <circle cx="90" cy="90" r="70" fill="none" stroke="#333" stroke-width="2"/>
  <polygon points="90,20 28,125 152,125" fill="none" stroke="#2d70b3" stroke-width="2"/>
  <circle cx="90" cy="90" r="3" fill="#333"/>
  <text x="90" y="82" text-anchor="middle" font-size="12">O</text>
  <text x="90" y="12" text-anchor="middle" font-size="14">A</text>
  <text x="20" y="138" text-anchor="middle" font-size="14">B</text>
  <text x="160" y="138" text-anchor="middle" font-size="14">C</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'circle',
    subcategory: 'circumscribed',
    tags: ['auxiliary_line'],
    name: '원-외접다각형',
    description: '원에 외접하는 삼각형',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="110" r="50" fill="none" stroke="#333" stroke-width="2"/>
  <polygon points="100,20 20,180 180,180" fill="none" stroke="#2d70b3" stroke-width="2"/>
  <circle cx="100" cy="110" r="3" fill="#333"/>
  <text x="100" y="102" text-anchor="middle" font-size="12">I</text>
  <text x="100" y="12" text-anchor="middle" font-size="14">A</text>
  <text x="12" y="192" text-anchor="middle" font-size="14">B</text>
  <text x="188" y="192" text-anchor="middle" font-size="14">C</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'circle',
    subcategory: 'arc',
    tags: ['angle_mark'],
    name: '원-호',
    description: '호와 중심각',
    svg_code: `<svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <circle cx="90" cy="90" r="70" fill="none" stroke="#ddd" stroke-width="1"/>
  <path d="M 160,90 A 70,70 0 0,1 90,160" fill="none" stroke="#2d70b3" stroke-width="3"/>
  <circle cx="90" cy="90" r="3" fill="#333"/>
  <line x1="90" y1="90" x2="160" y2="90" stroke="#333" stroke-width="1.5"/>
  <line x1="90" y1="90" x2="90" y2="160" stroke="#333" stroke-width="1.5"/>
  <path d="M 110,90 A 20,20 0 0,1 90,110" fill="none" stroke="#c74440" stroke-width="1.5"/>
  <text x="90" y="82" text-anchor="middle" font-size="12">O</text>
  <text x="168" y="95" text-anchor="start" font-size="14">A</text>
  <text x="90" y="175" text-anchor="middle" font-size="14">B</text>
  <text x="105" y="105" text-anchor="start" font-size="11" fill="#c74440">θ</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'circle',
    subcategory: 'sector',
    tags: ['shading', 'angle_mark'],
    name: '원-부채꼴',
    description: '부채꼴 영역',
    svg_code: `<svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <path d="M 90,90 L 160,90 A 70,70 0 0,1 90,160 Z" fill="#2d70b3" fill-opacity="0.2" stroke="#2d70b3" stroke-width="2"/>
  <circle cx="90" cy="90" r="70" fill="none" stroke="#ddd" stroke-width="1"/>
  <circle cx="90" cy="90" r="3" fill="#333"/>
  <path d="M 110,90 A 20,20 0 0,1 90,110" fill="none" stroke="#c74440" stroke-width="1.5"/>
  <text x="90" y="82" text-anchor="middle" font-size="12">O</text>
  <text x="168" y="95" text-anchor="start" font-size="14">A</text>
  <text x="90" y="175" text-anchor="middle" font-size="14">B</text>
  <text x="115" y="125" text-anchor="middle" font-size="11" fill="#2d70b3">S</text>
</svg>`,
    metadata: {}
  }
]
