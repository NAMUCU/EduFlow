import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64">
        {children}
      </main>
    </div>
  )
}
