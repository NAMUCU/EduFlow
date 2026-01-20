import ParentSidebar from '@/components/ParentSidebar'

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <ParentSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
