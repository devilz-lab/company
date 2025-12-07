'use client'

import { MemoryBrowser } from '@/components/memories/MemoryBrowser'

export default function MemoriesPage() {
  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#ededed] mb-1">Memories</h1>
        <p className="text-sm text-[#888]">View and manage what your companion remembers</p>
      </div>
      <MemoryBrowser />
    </div>
  )
}

