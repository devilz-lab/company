'use client'

import { KinkExplorer } from '@/components/kinks/KinkExplorer'
import { Sparkles } from 'lucide-react'

export default function KinksPage() {
  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#ededed] mb-1">Kink Explorer</h1>
        <p className="text-sm text-[#888]">Discover and track your interests</p>
      </div>
      <KinkExplorer />
    </div>
  )
}

