'use client'

import { StatsDashboard } from '@/components/stats/StatsDashboard'
import { RelationshipLevelDisplay } from '@/components/relationship/RelationshipLevel'
import { MoodIndicator } from '@/components/mood/MoodIndicator'
import { CustomizableDashboard } from '@/components/dashboard/CustomizableDashboard'
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics'

export default function StatsPage() {
  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#ededed] mb-1">Dashboard</h1>
        <p className="text-sm text-[#888]">Your interaction insights</p>
      </div>
      <div className="space-y-6">
        <MoodIndicator />
        <RelationshipLevelDisplay />
        <CustomizableDashboard />
        <StatsDashboard />
        <div>
          <h2 className="text-xl font-bold text-[#ededed] mb-4">Advanced Analytics</h2>
          <AdvancedAnalytics />
        </div>
      </div>
    </div>
  )
}
