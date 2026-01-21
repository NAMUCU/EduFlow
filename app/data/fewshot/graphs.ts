/**
 * 그래프 SVG 템플릿
 */

import { FewshotSample } from '@/types/fewshot'

export const GRAPH_TEMPLATES: Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    category: 'graph',
    subcategory: 'linear',
    tags: ['axis', 'grid'],
    name: '일차함수 그래프',
    description: 'y = ax + b 형태의 직선 그래프',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  <line x1="20" y1="100" x2="180" y2="100" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead)"/>
  <line x1="100" y1="180" x2="100" y2="20" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead)"/>
  <line x1="30" y1="160" x2="170" y2="40" stroke="#2d70b3" stroke-width="2"/>
  <circle cx="100" cy="100" r="3" fill="#c74440"/>
  <text x="185" y="105" font-size="12">x</text>
  <text x="105" y="18" font-size="12">y</text>
  <text x="92" y="115" font-size="10">O</text>
  <text x="150" y="55" font-size="11" fill="#2d70b3">y=ax+b</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'graph',
    subcategory: 'quadratic',
    tags: ['axis', 'grid'],
    name: '이차함수 그래프',
    description: 'y = ax² + bx + c 형태의 포물선',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  <line x1="20" y1="150" x2="180" y2="150" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead2)"/>
  <line x1="100" y1="180" x2="100" y2="20" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead2)"/>
  <path d="M 30,30 Q 100,170 170,30" fill="none" stroke="#2d70b3" stroke-width="2"/>
  <circle cx="100" cy="150" r="3" fill="#333"/>
  <line x1="100" y1="150" x2="100" y2="155" stroke="#c74440" stroke-width="1.5" stroke-dasharray="3,3"/>
  <circle cx="100" cy="155" r="3" fill="#c74440"/>
  <text x="185" y="155" font-size="12">x</text>
  <text x="105" y="18" font-size="12">y</text>
  <text x="92" y="165" font-size="10">O</text>
  <text x="105" y="165" font-size="10" fill="#c74440">꼭짓점</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'graph',
    subcategory: 'cubic',
    tags: ['axis'],
    name: '삼차함수 그래프',
    description: 'y = ax³ + bx² + cx + d 형태',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrowhead3" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  <line x1="20" y1="100" x2="180" y2="100" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead3)"/>
  <line x1="100" y1="180" x2="100" y2="20" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead3)"/>
  <path d="M 30,150 C 60,180 80,20 100,100 S 140,180 170,50" fill="none" stroke="#2d70b3" stroke-width="2"/>
  <circle cx="100" cy="100" r="3" fill="#333"/>
  <text x="185" y="105" font-size="12">x</text>
  <text x="105" y="18" font-size="12">y</text>
  <text x="92" y="115" font-size="10">O</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'graph',
    subcategory: 'trigonometric',
    tags: ['axis', 'grid'],
    name: '삼각함수 그래프',
    description: 'y = sin(x), cos(x) 등',
    svg_code: `<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrowhead4" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  <line x1="10" y1="70" x2="230" y2="70" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead4)"/>
  <line x1="20" y1="130" x2="20" y2="10" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead4)"/>
  <path d="M 20,70 Q 50,20 80,70 T 140,70 T 200,70" fill="none" stroke="#2d70b3" stroke-width="2"/>
  <line x1="80" y1="68" x2="80" y2="72" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="68" x2="140" y2="72" stroke="#333" stroke-width="1"/>
  <line x1="200" y1="68" x2="200" y2="72" stroke="#333" stroke-width="1"/>
  <text x="80" y="85" text-anchor="middle" font-size="10">π</text>
  <text x="140" y="85" text-anchor="middle" font-size="10">2π</text>
  <text x="200" y="85" text-anchor="middle" font-size="10">3π</text>
  <text x="8" y="25" font-size="10">1</text>
  <text x="5" y="120" font-size="10">-1</text>
  <text x="160" y="45" font-size="11" fill="#2d70b3">y=sin(x)</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'graph',
    subcategory: 'exponential',
    tags: ['axis'],
    name: '지수함수 그래프',
    description: 'y = aˣ 형태',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrowhead5" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  <line x1="20" y1="150" x2="180" y2="150" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead5)"/>
  <line x1="50" y1="180" x2="50" y2="20" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead5)"/>
  <path d="M 20,148 Q 80,145 100,120 T 170,25" fill="none" stroke="#2d70b3" stroke-width="2"/>
  <line x1="20" y1="150" x2="180" y2="150" stroke="#888" stroke-width="0.5" stroke-dasharray="2,2"/>
  <circle cx="50" cy="120" r="3" fill="#c74440"/>
  <text x="185" y="155" font-size="12">x</text>
  <text x="55" y="18" font-size="12">y</text>
  <text x="42" y="165" font-size="10">O</text>
  <text x="55" y="115" font-size="10" fill="#c74440">(0,1)</text>
  <text x="140" y="50" font-size="11" fill="#2d70b3">y=aˣ</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'graph',
    subcategory: 'logarithmic',
    tags: ['axis'],
    name: '로그함수 그래프',
    description: 'y = logₐx 형태',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrowhead6" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  <line x1="20" y1="100" x2="180" y2="100" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead6)"/>
  <line x1="50" y1="180" x2="50" y2="20" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead6)"/>
  <path d="M 52,175 Q 55,140 70,100 T 170,35" fill="none" stroke="#2d70b3" stroke-width="2"/>
  <line x1="50" y1="20" x2="50" y2="180" stroke="#c74440" stroke-width="1" stroke-dasharray="3,3"/>
  <circle cx="70" cy="100" r="3" fill="#388c46"/>
  <text x="185" y="105" font-size="12">x</text>
  <text x="55" y="18" font-size="12">y</text>
  <text x="42" y="115" font-size="10">O</text>
  <text x="75" y="95" font-size="10" fill="#388c46">(1,0)</text>
  <text x="120" y="55" font-size="11" fill="#2d70b3">y=logₐx</text>
  <text x="35" y="50" font-size="9" fill="#c74440">점근선</text>
</svg>`,
    metadata: {}
  }
]
