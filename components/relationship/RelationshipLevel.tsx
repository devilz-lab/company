'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Star } from 'lucide-react'
import { RELATIONSHIP_LEVELS, RelationshipLevel } from '@/lib/relationship/levels'

interface RelationshipLevelData {
  currentLevel: number
  nextLevel: RelationshipLevel | null
  progress: number
  stats: {
    conversations: number
    days: number
    milestones: number
  }
}

export function RelationshipLevelDisplay() {
  const [levelData, setLevelData] = useState<RelationshipLevelData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLevelData()
  }, [])

  const loadLevelData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/relationship/level')
      if (!response.ok) throw new Error('Failed to load relationship level')
      const data = await response.json()
      setLevelData(data)
    } catch (error) {
      console.error('Error loading relationship level:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ededed]"></div>
      </div>
    )
  }

  if (!levelData) return null

  const currentLevelInfo = RELATIONSHIP_LEVELS.find(l => l.level === levelData.currentLevel)

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-lg bg-[#2a2a2a]">
          <Star className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#ededed]">
            Level {levelData.currentLevel}: {currentLevelInfo?.name}
          </h3>
          <p className="text-sm text-[#888]">{currentLevelInfo?.description}</p>
        </div>
      </div>

      {levelData.nextLevel && (
        <>
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-[#888]">Progress to Level {levelData.nextLevel.level}</span>
              <span className="text-[#ededed] font-medium">
                {Math.round(levelData.progress * 100)}%
              </span>
            </div>
            <div className="w-full bg-[#0f0f0f] rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#3a3a3a] to-[#4a4a4a] h-2 rounded-full transition-all duration-300"
                style={{ width: `${levelData.progress * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div>
              <p className="text-lg font-bold text-[#ededed]">
                {levelData.stats.conversations}
              </p>
              <p className="text-xs text-[#666]">
                / {levelData.nextLevel.requirements.conversations} convos
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#ededed]">
                {levelData.stats.days}
              </p>
              <p className="text-xs text-[#666]">
                / {levelData.nextLevel.requirements.days} days
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#ededed]">
                {levelData.stats.milestones}
              </p>
              <p className="text-xs text-[#666]">
                / {levelData.nextLevel.requirements.milestones} milestones
              </p>
            </div>
          </div>
        </>
      )}

      {!levelData.nextLevel && (
        <div className="text-center py-4">
          <p className="text-[#888]">You've reached the maximum level! 🎉</p>
        </div>
      )}
    </div>
  )
}

