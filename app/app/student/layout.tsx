import StudentSidebar from '@/components/StudentSidebar'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <StudentSidebar />
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
