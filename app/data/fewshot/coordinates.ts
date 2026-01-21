/**
 * 좌표평면 SVG 템플릿
 */

import { FewshotSample } from '@/types/fewshot'

export const COORDINATE_TEMPLATES: Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    category: 'coordinate',
    subcategory: 'point',
    tags: ['axis', 'grid'],
    name: '좌표평면-점',
    description: '좌표평면 위의 점',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow1" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  <line x1="20" y1="100" x2="180" y2="100" stroke="#333" stroke-width="1.5" marker-end="url(#arrow1)"/>
  <line x1="100" y1="180" x2="100" y2="20" stroke="#333" stroke-width="1.5" marker-end="url(#arrow1)"/>
  <circle cx="140" cy="60" r="4" fill="#2d70b3"/>
  <line x1="140" y1="60" x2="140" y2="100" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="140" y1="60" x2="100" y2="60" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="185" y="105" font-size="12">x</text>
  <text x="105" y="18" font-size="12">y</text>
  <text x="92" y="115" font-size="10">O</text>
  <text x="145" y="55" font-size="11" fill="#2d70b3">P(a, b)</text>
  <text x="140" y="115" font-size="10">a</text>
  <text x="85" y="63" font-size="10">b</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'coordinate',
    subcategory: 'line',
    tags: ['axis'],
    name: '좌표평면-직선',
    description: '두 점을 지나는 직선',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  <line x1="20" y1="100" x2="180" y2="100" stroke="#333" stroke-width="1.5" marker-end="url(#arrow2)"/>
  <line x1="100" y1="180" x2="100" y2="20" stroke="#333" stroke-width="1.5" marker-end="url(#arrow2)"/>
  <line x1="30" y1="160" x2="170" y2="40" stroke="#2d70b3" stroke-width="2"/>
  <circle cx="60" cy="130" r="4" fill="#c74440"/>
  <circle cx="140" cy="70" r="4" fill="#c74440"/>
  <text x="185" y="105" font-size="12">x</text>
  <text x="105" y="18" font-size="12">y</text>
  <text x="92" y="115" font-size="10">O</text>
  <text x="50" y="145" font-size="11" fill="#c74440">A</text>
  <text x="145" y="65" font-size="11" fill="#c74440">B</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'coordinate',
    subcategory: 'distance',
    tags: ['axis', 'length_label'],
    name: '좌표평면-거리',
    description: '두 점 사이의 거리',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow3" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  <line x1="20" y1="100" x2="180" y2="100" stroke="#333" stroke-width="1.5" marker-end="url(#arrow3)"/>
  <line x1="100" y1="180" x2="100" y2="20" stroke="#333" stroke-width="1.5" marker-end="url(#arrow3)"/>
  <line x1="50" y1="140" x2="150" y2="60" stroke="#2d70b3" stroke-width="2"/>
  <circle cx="50" cy="140" r="4" fill="#c74440"/>
  <circle cx="150" cy="60" r="4" fill="#c74440"/>
  <line x1="50" y1="140" x2="150" y2="140" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="150" y1="140" x2="150" y2="60" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="185" y="105" font-size="12">x</text>
  <text x="105" y="18" font-size="12">y</text>
  <text x="92" y="115" font-size="10">O</text>
  <text x="40" y="155" font-size="11" fill="#c74440">A(x₁,y₁)</text>
  <text x="155" y="55" font-size="11" fill="#c74440">B(x₂,y₂)</text>
  <text x="90" y="95" font-size="10" fill="#2d70b3">d</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'coordinate',
    subcategory: 'midpoint',
    tags: ['axis', 'dotted_line'],
    name: '좌표평면-중점',
    description: '선분의 중점',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow4" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  <line x1="20" y1="100" x2="180" y2="100" stroke="#333" stroke-width="1.5" marker-end="url(#arrow4)"/>
  <line x1="100" y1="180" x2="100" y2="20" stroke="#333" stroke-width="1.5" marker-end="url(#arrow4)"/>
  <line x1="50" y1="140" x2="150" y2="60" stroke="#333" stroke-width="2"/>
  <circle cx="50" cy="140" r="4" fill="#c74440"/>
  <circle cx="150" cy="60" r="4" fill="#c74440"/>
  <circle cx="100" cy="100" r="4" fill="#388c46"/>
  <text x="185" y="105" font-size="12">x</text>
  <text x="105" y="18" font-size="12">y</text>
  <text x="40" y="155" font-size="11" fill="#c74440">A</text>
  <text x="155" y="55" font-size="11" fill="#c74440">B</text>
  <text x="105" y="95" font-size="11" fill="#388c46">M</text>
</svg>`,
    metadata: {}
  },
  {
    category: 'coordinate',
    subcategory: 'region',
    tags: ['axis', 'shading'],
    name: '좌표평면-영역',
    description: '부등식의 영역',
    svg_code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow5" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  <polygon points="100,100 180,100 180,20 100,20" fill="#2d70b3" fill-opacity="0.2"/>
  <line x1="20" y1="100" x2="180" y2="100" stroke="#333" stroke-width="1.5" marker-end="url(#arrow5)"/>
  <line x1="100" y1="180" x2="100" y2="20" stroke="#333" stroke-width="1.5" marker-end="url(#arrow5)"/>
  <line x1="30" y1="160" x2="170" y2="40" stroke="#2d70b3" stroke-width="2"/>
  <text x="185" y="105" font-size="12">x</text>
  <text x="105" y="18" font-size="12">y</text>
  <text x="92" y="115" font-size="10">O</text>
  <text x="140" y="60" font-size="11" fill="#2d70b3">y > ax+b</text>
</svg>`,
    metadata: {}
  }
]
