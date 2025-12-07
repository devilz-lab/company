'use client'

import { useState, useEffect } from 'react'
import { Trophy, Loader2 } from 'lucide-react'
import { AchievementBadge } from '@/components/achievements/AchievementBadge'

interface Achievement {
  id: string
  achievement_type: string
  title: string
  description: string
  unlocked_at: string
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/achievements')
      if (!response.ok) throw new Error('Failed to load achievements')
      const data = await response.json()
      setAchievements(data.achievements || [])
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#888]" />
      </div>
    )
  }

  // Separate new achievements (unlocked in last 24 hours)
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const newAchievements = achievements.filter(a => 
    new Date(a.unlocked_at) >= oneDayAgo
  )
  const oldAchievements = achievements.filter(a => 
    new Date(a.unlocked_at) < oneDayAgo
  )

  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h1 className="text-2xl font-bold text-[#ededed]">Achievements</h1>
        </div>
        <p className="text-sm text-[#888]">Your accomplishments</p>
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-[#888]" />
          <p className="text-[#888] mb-2">No achievements yet</p>
          <p className="text-sm text-[#666]">Keep chatting to unlock achievements!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {newAchievements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#ededed] mb-3">Recently Unlocked</h2>
              <div className="space-y-3">
                {newAchievements.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} isNew />
                ))}
              </div>
            </div>
          )}

          {oldAchievements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#ededed] mb-3">All Achievements</h2>
              <div className="space-y-3">
                {oldAchievements.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

