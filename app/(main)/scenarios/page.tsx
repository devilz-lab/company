'use client'

import { ScenarioBuilder } from '@/components/scenarios/ScenarioBuilder'

export default function ScenariosPage() {
  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#ededed] mb-1">Scenarios</h1>
        <p className="text-sm text-[#888]">Create and manage roleplay scenarios</p>
      </div>
      <ScenarioBuilder />
    </div>
  )
}

