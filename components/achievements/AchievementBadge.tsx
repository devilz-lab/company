'use client'

import { Trophy, Star, Award } from 'lucide-react'
import { motion } from 'framer-motion'

interface Achievement {
  id: string
  achievement_type: string
  title: string
  description: string
  unlocked_at: string
}

interface AchievementBadgeProps {
  achievement: Achievement
  isNew?: boolean
}

const achievementIcons: Record<string, any> = {
  first_conversation: Trophy,
  ten_conversations: Star,
  fifty_conversations: Award,
  hundred_conversations: Trophy,
  first_milestone: Star,
  five_milestones: Award,
  first_kink: Trophy,
  ten_kinks: Star,
  streak_7: Award,
  streak_30: Trophy,
  level_3: Star,
  level_6: Trophy,
  default: Award,
}

export function AchievementBadge({ achievement, isNew = false }: AchievementBadgeProps) {
  const Icon = achievementIcons[achievement.achievement_type] || achievementIcons.default

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-xl p-4 border-2 ${
        isNew
          ? 'bg-yellow-500/10 border-yellow-500/50'
          : 'bg-[#1a1a1a] border-[#2a2a2a]'
      }`}
    >
      {isNew && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-[#0a0a0a] text-xs font-bold px-2 py-1 rounded-full">
          NEW
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          isNew ? 'bg-yellow-500/20' : 'bg-[#2a2a2a]'
        }`}>
          <Icon className={`w-5 h-5 ${
            isNew ? 'text-yellow-400' : 'text-[#888]'
          }`} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-[#ededed] mb-1">{achievement.title}</h4>
          <p className="text-sm text-[#888]">{achievement.description}</p>
          <p className="text-xs text-[#666] mt-2">
            {new Date(achievement.unlocked_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

