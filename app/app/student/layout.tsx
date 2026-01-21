import StudentSidebar from '@/components/StudentSidebar'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StudentSidebar />
      <main className="ml-64 min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        {children}
      </main>
    </>
  )
}
