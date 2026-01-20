import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">EduFlow</h1>
          <p className="text-gray-500 mt-2">학원 관리의 새로운 기준</p>
        </div>

        {/* 컨텐츠 */}
        {children}
      </div>
    </div>
  )
}
