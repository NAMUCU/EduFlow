import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EduFlow - AI 기반 학원 운영 자동화 플랫폼',
  description: '선생님의 기존 워크플로우 안에서 조용히 작동하며, 지역/학교별 맥락을 반영하고, 실천 가이드를 제공하는 AI 학습 플랫폼',
  keywords: ['AI', '학원', '교육', '문제 생성', '학습 관리', '에듀테크'],
  authors: [{ name: 'EduFlow Team' }],
  openGraph: {
    title: 'EduFlow - AI 기반 학원 운영 자동화 플랫폼',
    description: 'AI가 선생님을 대체하지 않습니다. 더 돋보이게 만듭니다.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
