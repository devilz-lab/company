'use client'

import { useEffect, useState } from 'react'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { Heart, Star, Calendar, MessageCircle, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface Milestone {
  id: string
  type: string
  title: string
  description: string | null
  date: string
  importance: number
  persona_id: string | null
  metadata: Record<string, any> | null
}

const milestoneIcons: Record<string, any> = {
  first_conversation: MessageCircle,
  special_moment: Heart,
  achievement: Star,
  milestone: Sparkles,
  default: Calendar,
}

const milestoneColors: Record<string, string> = {
  first_conversation: 'bg-blue-500/20 border-blue-500/50',
  special_moment: 'bg-pink-500/20 border-pink-500/50',
  achievement: 'bg-yellow-500/20 border-yellow-500/50',
  milestone: 'bg-purple-500/20 border-purple-500/50',
  default: 'bg-gray-500/20 border-gray-500/50',
}

export function Timeline() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMilestones()
  }, [])

  const loadMilestones = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/milestones')
      if (!response.ok) throw new Error('Failed to load milestones')
      const data = await response.json()
      setMilestones(data.milestones || [])
    } catch (error) {
      console.error('Error loading milestones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
      </div>
    )
  }

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-[#888]" />
        </div>
        <h2 className="text-xl font-semibold text-[#ededed] mb-2">No milestones yet</h2>
        <p className="text-sm text-[#888] mb-6 max-w-md">
          Your relationship journey will appear here as you chat and create special moments.
        </p>
        <div className="text-xs text-[#666] space-y-1">
          <p>💡 Milestones are created automatically from your conversations</p>
          <p>💡 Special moments and achievements will be tracked here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#2a2a2a]"></div>

      <div className="space-y-8">
        {milestones.map((milestone, index) => {
          const Icon = milestoneIcons[milestone.type] || milestoneIcons.default
          const colorClass = milestoneColors[milestone.type] || milestoneColors.default

          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-4"
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-5 h-5 text-[#ededed]" />
                </div>
              </div>

              {/* Milestone card */}
              <div className="flex-1 pb-8">
                <div className={`rounded-xl p-4 border ${colorClass}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-[#ededed]">{milestone.title}</h3>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: milestone.importance }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-[#888] mb-3">{milestone.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[#666]">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(milestone.date)}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(milestone.date)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

