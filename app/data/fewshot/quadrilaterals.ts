/**
 * 사각형 SVG 템플릿
 */

import { FewshotSample } from '@/types/fewshot'

export const QUADRILATERAL_TEMPLATES: Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    category: 'quadrilateral',
    subcategory: 'basic',
    tags: [],
    name: '기본 사각형',
    description: '일반 사각형',
    svg_code: `<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <polygon points="30,130 50,30 170,40 160,140" fill="none" stroke="#333" stroke-width="2"/>
  <text x="22" y="142" text-anchor="middle" font-size="14">A</text>
  <text x="45" y="22" text-anchor="middle" font-size="14">B</text>
  <text x="178" y="35" text-anchor="middle" font-size="14">C</text>
  <text x="168" y="152" text-anchor="middle" font-size="14">D</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'quadrilateral',
    subcategory: 'parallelogram',
    tags: ['parallel_mark', 'equal_mark'],
    name: '평행사변형',
    description: '대변이 평행한 사각형',
    svg_code: `<svg viewBox="0 0 220 140" xmlns="http://www.w3.org/2000/svg">
  <polygon points="40,120 80,30 180,30 140,120" fill="none" stroke="#333" stroke-width="2"/>
  <line x1="55" y1="75" x2="65" y2="75" stroke="#c74440" stroke-width="2"/>
  <line x1="155" y1="75" x2="165" y2="75" stroke="#c74440" stroke-width="2"/>
  <line x1="125" y1="30" x2="135" y2="30" stroke="#2d70b3" stroke-width="2"/>
  <line x1="85" y1="120" x2="95" y2="120" stroke="#2d70b3" stroke-width="2"/>
  <text x="32" y="132" text-anchor="middle" font-size="14">A</text>
  <text x="75" y="22" text-anchor="middle" font-size="14">B</text>
  <text x="188" y="35" text-anchor="middle" font-size="14">C</text>
  <text x="148" y="132" text-anchor="middle" font-size="14">D</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'quadrilateral',
    subcategory: 'rectangle',
    tags: ['right_angle', 'equal_mark'],
    name: '직사각형',
    description: '네 각이 직각인 사각형',
    svg_code: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="30" width="140" height="80" fill="none" stroke="#333" stroke-width="2"/>
  <rect x="30" y="100" width="10" height="10" fill="none" stroke="#333" stroke-width="1"/>
  <rect x="160" y="100" width="10" height="10" fill="none" stroke="#333" stroke-width="1"/>
  <rect x="30" y="30" width="10" height="10" fill="none" stroke="#333" stroke-width="1"/>
  <rect x="160" y="30" width="10" height="10" fill="none" stroke="#333" stroke-width="1"/>
  <text x="22" y="122" text-anchor="middle" font-size="14">A</text>
  <text x="22" y="35" text-anchor="middle" font-size="14">B</text>
  <text x="178" y="35" text-anchor="middle" font-size="14">C</text>
  <text x="178" y="122" text-anchor="middle" font-size="14">D</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'quadrilateral',
    subcategory: 'square',
    tags: ['right_angle', 'equal_mark'],
    name: '정사각형',
    description: '네 변과 네 각이 모두 같은 사각형',
    svg_code: `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="30" width="100" height="100" fill="none" stroke="#333" stroke-width="2"/>
  <rect x="30" y="120" width="10" height="10" fill="none" stroke="#333" stroke-width="1"/>
  <line x1="75" y1="30" x2="85" y2="30" stroke="#c74440" stroke-width="2"/>
  <line x1="75" y1="130" x2="85" y2="130" stroke="#c74440" stroke-width="2"/>
  <line x1="30" y1="75" x2="30" y2="85" stroke="#c74440" stroke-width="2"/>
  <line x1="130" y1="75" x2="130" y2="85" stroke="#c74440" stroke-width="2"/>
  <text x="22" y="142" text-anchor="middle" font-size="14">A</text>
  <text x="22" y="28" text-anchor="middle" font-size="14">B</text>
  <text x="138" y="28" text-anchor="middle" font-size="14">C</text>
  <text x="138" y="142" text-anchor="middle" font-size="14">D</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'quadrilateral',
    subcategory: 'rhombus',
    tags: ['equal_mark'],
    name: '마름모',
    description: '네 변의 길이가 같은 사각형',
    svg_code: `<svg viewBox="0 0 180 160" xmlns="http://www.w3.org/2000/svg">
  <polygon points="90,20 160,80 90,140 20,80" fill="none" stroke="#333" stroke-width="2"/>
  <line x1="50" y1="48" x2="58" y2="52" stroke="#c74440" stroke-width="2"/>
  <line x1="122" y1="48" x2="130" y2="52" stroke="#c74440" stroke-width="2"/>
  <line x1="50" y1="108" x2="58" y2="112" stroke="#c74440" stroke-width="2"/>
  <line x1="122" y1="108" x2="130" y2="112" stroke="#c74440" stroke-width="2"/>
  <text x="90" y="12" text-anchor="middle" font-size="14">A</text>
  <text x="168" y="85" text-anchor="middle" font-size="14">B</text>
  <text x="90" y="155" text-anchor="middle" font-size="14">C</text>
  <text x="12" y="85" text-anchor="middle" font-size="14">D</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'quadrilateral',
    subcategory: 'trapezoid',
    tags: ['parallel_mark'],
    name: '사다리꼴',
    description: '한 쌍의 대변이 평행한 사각형',
    svg_code: `<svg viewBox="0 0 220 140" xmlns="http://www.w3.org/2000/svg">
  <polygon points="30,120 60,30 160,30 190,120" fill="none" stroke="#333" stroke-width="2"/>
  <line x1="105" y1="30" x2="115" y2="30" stroke="#2d70b3" stroke-width="2"/>
  <line x1="105" y1="120" x2="115" y2="120" stroke="#2d70b3" stroke-width="2"/>
  <text x="22" y="132" text-anchor="middle" font-size="14">A</text>
  <text x="55" y="22" text-anchor="middle" font-size="14">B</text>
  <text x="168" y="22" text-anchor="middle" font-size="14">C</text>
  <text x="198" y="132" text-anchor="middle" font-size="14">D</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'quadrilateral',
    subcategory: 'diagonal',
    tags: ['dotted_line', 'auxiliary_line'],
    name: '사각형-대각선',
    description: '대각선이 표시된 사각형',
    svg_code: `<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <polygon points="30,130 50,30 170,40 150,140" fill="none" stroke="#333" stroke-width="2"/>
  <line x1="30" y1="130" x2="170" y2="40" stroke="#2d70b3" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="50" y1="30" x2="150" y2="140" stroke="#c74440" stroke-width="1.5" stroke-dasharray="5,5"/>
  <circle cx="100" cy="85" r="3" fill="#388c46"/>
  <text x="22" y="142" text-anchor="middle" font-size="14">A</text>
  <text x="45" y="22" text-anchor="middle" font-size="14">B</text>
  <text x="178" y="35" text-anchor="middle" font-size="14">C</text>
  <text x="158" y="152" text-anchor="middle" font-size="14">D</text>
  <text x="108" y="80" text-anchor="start" font-size="12" fill="#388c46">O</text>
</svg>`,
    metadata: {}
  }
]
