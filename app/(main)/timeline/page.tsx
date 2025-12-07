'use client'

import { Timeline } from '@/components/timeline/Timeline'

export default function TimelinePage() {
  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#ededed] mb-1">Relationship Timeline</h1>
        <p className="text-sm text-[#888]">Your journey together</p>
      </div>
      <Timeline />
    </div>
  )
}
