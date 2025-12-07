'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Users, Heart, Sparkles, TrendingUp, Calendar } from 'lucide-react'
import { DashboardWidget } from './DashboardWidget'
import { RelationshipLevelDisplay } from '@/components/relationship/RelationshipLevel'

interface Widget {
  id: string
  type: string
  title: string
  enabled: boolean
}

const availableWidgets = [
  { id: 'relationship', type: 'relationship', title: 'Relationship Level', icon: Heart },
  { id: 'quick-stats', type: 'quick-stats', title: 'Quick Stats', icon: TrendingUp },
  { id: 'recent-activity', type: 'recent-activity', title: 'Recent Activity', icon: Calendar },
]

export function CustomizableDashboard() {
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadWidgets()
  }, [])

  const loadWidgets = async () => {
    // Load from user preferences or use defaults
    const defaultWidgets: Widget[] = [
      { id: 'relationship', type: 'relationship', title: 'Relationship Level', enabled: true },
      { id: 'quick-stats', type: 'quick-stats', title: 'Quick Stats', enabled: true },
    ]
    setWidgets(defaultWidgets)
    setIsLoading(false)
  }

  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id))
  }

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'relationship':
        return <RelationshipLevelDisplay />
      case 'quick-stats':
        return <QuickStatsWidget />
      case 'recent-activity':
        return <RecentActivityWidget />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {widgets.map((widget) => (
        <DashboardWidget
          key={widget.id}
          id={widget.id}
          title={widget.title}
          onRemove={handleRemoveWidget}
        >
          {renderWidget(widget)}
        </DashboardWidget>
      ))}
    </div>
  )
}

function QuickStatsWidget() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error)
  }, [])

  if (!stats) return <div className="text-[#888] text-sm">Loading...</div>

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <p className="text-2xl font-bold text-[#ededed]">{stats.totalConversations || 0}</p>
        <p className="text-xs text-[#666]">Conversations</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-[#ededed]">{stats.totalMessages || 0}</p>
        <p className="text-xs text-[#666]">Messages</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-[#ededed]">{stats.totalKinks || 0}</p>
        <p className="text-xs text-[#666]">Kinks</p>
      </div>
    </div>
  )
}

function RecentActivityWidget() {
  return (
    <div className="text-[#888] text-sm">
      Recent activity will appear here
    </div>
  )
}

