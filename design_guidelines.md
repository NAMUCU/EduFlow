# EduFlow Design Guidelines

## Design Approach
**System-Based**: Material Design principles adapted for Korean educational context. Clean, functional interface prioritizing usability for teachers and students with minimal learning curve.

## Core Design Principles
1. **교육적 명료성 (Educational Clarity)**: Information hierarchy optimized for quick scanning and task completion
2. **역할별 차별화 (Role Differentiation)**: Distinct visual treatment for teacher vs student interfaces
3. **데이터 우선 (Data First)**: Content and functionality take precedence over decorative elements

---

## Typography
**Primary Font**: Pretendard (via CDN)
- Headings: Pretendard 700 (Bold)
- Body: Pretendard 400 (Regular)
- Labels: Pretendard 500 (Medium)

**Type Scale**:
- H1: text-3xl md:text-4xl (페이지 제목)
- H2: text-2xl md:text-3xl (섹션 제목)
- H3: text-xl (카드 제목)
- Body: text-base (본문)
- Small: text-sm (메타 정보, 라벨)

---

## Layout System
**Spacing Units**: Tailwind units of **4, 6, 8, 12** for consistency
- Component padding: p-6 or p-8
- Section spacing: space-y-8
- Card gaps: gap-6
- Page margins: px-4 md:px-8

**Container Strategy**:
- Dashboard: max-w-7xl mx-auto
- Forms: max-w-2xl mx-auto
- Content cards: Full width within container

**Grid Patterns**:
- Desktop: grid-cols-3 (학생 카드, 과제 카드)
- Tablet: grid-cols-2
- Mobile: grid-cols-1

---

## Component Library

### Navigation
**Teacher Dashboard**: Top navigation bar with logo left, user profile right
- 주요 메뉴: 대시보드 | 학생 관리 | 문제 생성 | 과제 배포 | 제출 확인
- Mobile: Hamburger menu with drawer

**Student Dashboard**: Simplified top nav
- 대시보드 | 과제 목록

### Cards
**Standard Pattern**: White background, subtle border, rounded corners (rounded-lg)
- Header section with title + action button
- Content area with generous padding (p-6)
- Footer section for metadata (text-sm text-gray-500)

**Student Card** (Teacher view):
- Avatar placeholder or initial circle
- Name (text-lg font-medium)
- School + Grade (text-sm)
- Edit/Delete actions (top-right icons)

**Assignment Card** (Both views):
- Title + subject badge
- Problem count indicator
- Status badge (대기중/제출완료)
- Due date display
- Primary action button

### Forms
**Input Fields**: Consistent styling across all forms
- Label above (text-sm font-medium mb-2)
- Input with border, rounded-md, focus:ring-2
- Helper text below when needed (text-sm text-gray-600)

**Form Groups**:
- 문제 생성 폼: Vertical layout, full-width inputs
- 학생 등록 폼: Compact, 2-column on desktop (name/school, grade)

### Buttons
**Primary** (과제 배포, 문제 생성): Blue fill, white text, rounded-md, px-6 py-3
**Secondary** (취소, 뒤로): White fill, border, rounded-md, px-6 py-3
**Icon buttons**: Transparent with hover background (편집, 삭제)

### Data Display
**Tables** (제출 현황):
- Header row with text-sm font-medium
- Striped rows for readability
- Status badges in cells
- Action column (right-aligned)

**Stats Cards** (Dashboard):
- Large number (text-4xl font-bold)
- Label below (text-sm)
- Icon or illustration top-right
- Grid layout: grid-cols-2 md:grid-cols-4

### Upload Component
- Drag-and-drop zone with dashed border
- File preview after selection
- Upload progress indicator
- 업로드된 이미지 섬네일 표시

---

## Page-Specific Layouts

### Landing Page (/)
**Hero Section** (h-screen or min-h-[600px]):
- Centered content: Service name + tagline
- 2 CTA buttons: 강사 시작하기 | 학생 로그인
- Background: Subtle gradient or illustration
- NO large hero image (text-focused education platform)

**Feature Sections**: 3-column grid
- Icon + title + description
- Features: AI 문제 생성 | 과제 관리 | 학습 분석

### Teacher Dashboard
**Layout**: Stats row at top (4 cards), Recent activities below
- 등록 학생 수 | 활성 과제 | 제출 대기 | 이번 주 제출

### Problem Creation (/teacher/problems)
**Two-pane layout**:
- Left: Input form (과목, 단원, 난이도, 문제 수)
- Right: Generated problems preview (편집 가능한 카드 리스트)

### Assignment Distribution (/teacher/assignments)
**Multi-step process**:
1. 문제지 선택 (카드 선택 UI)
2. 학생 선택 (체크박스 리스트)
3. 확인 및 배포 (Summary + 배포 버튼)

### Student Assignment View (/student/assignments)
**List View**: 과제 카드 세로 나열
- 클릭 시 상세 페이지로 이동
- 문제 표시 + 이미지 업로드 컴포넌트

---

## Images
**No hero images** - This is a utility-focused educational platform.

**Functional Images Only**:
- 제출된 풀이 이미지 (student uploads)
- Empty state illustrations (빈 과제 목록 등)
- Icon set: Heroicons via CDN

**Image Placement**:
- Submission viewer: Full-width image display with zoom capability
- Empty states: Center-aligned, max-w-sm

---

## Accessibility
- Korean screen reader support
- Form labels properly associated with inputs
- Keyboard navigation for all interactive elements
- Focus indicators on all focusable elements
- ARIA labels for icon-only buttons

---

## Animations
**Minimal, purposeful only**:
- Card hover: subtle shadow increase (transition-shadow)
- Button click: scale-95 feedback
- Page transitions: fade-in only
- NO scroll animations or complex effects