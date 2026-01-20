import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EduFlow - 학원 관리 플랫폼',
  description: 'AI 기반 학원 운영 자동화 + 맞춤형 학습 플랫폼',
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
