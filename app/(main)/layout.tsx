import { BottomNav } from '@/components/shared/BottomNav'
import { SearchBar } from '@/components/search/SearchBar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] pb-24">
      <div className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-[#2a2a2a] p-4">
        <SearchBar />
      </div>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

