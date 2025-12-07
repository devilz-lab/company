'use client'

import { useState } from 'react'
import { Heart, Flame, ThumbsUp, Smile, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageReactionsProps {
  messageId: string
  reactions: Record<string, boolean> | null
  onReaction: (messageId: string, reaction: string) => void
}

const reactionIcons = {
  heart: Heart,
  fire: Flame,
  thumbsup: ThumbsUp,
  smile: Smile,
  star: Star,
}

const reactionColors = {
  heart: 'text-red-400 hover:text-red-300',
  fire: 'text-orange-400 hover:text-orange-300',
  thumbsup: 'text-blue-400 hover:text-blue-300',
  smile: 'text-yellow-400 hover:text-yellow-300',
  star: 'text-purple-400 hover:text-purple-300',
}

export function MessageReactions({ messageId, reactions, onReaction }: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false)

  const handleReaction = (reaction: string) => {
    onReaction(messageId, reaction)
    setShowPicker(false)
  }

  return (
    <div className="relative flex items-center gap-1">
      {/* Existing reactions */}
      {reactions && Object.entries(reactions).map(([reaction, active]) => {
        if (!active) return null
        const Icon = reactionIcons[reaction as keyof typeof reactionIcons]
        if (!Icon) return null
        
        return (
          <button
            key={reaction}
            onClick={() => handleReaction(reaction)}
            className={cn(
              'p-1 rounded-full transition-colors',
              reactionColors[reaction as keyof typeof reactionColors] || 'text-[#888]'
            )}
            title={reaction}
          >
            <Icon className="w-4 h-4" />
          </button>
        )
      })}

      {/* Add reaction button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="p-1 rounded-full text-[#666] hover:text-[#888] hover:bg-[#2a2a2a] transition-colors"
        title="Add reaction"
      >
        <Smile className="w-4 h-4" />
      </button>

      {/* Reaction picker */}
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2 flex gap-1 shadow-lg z-10">
          {Object.entries(reactionIcons).map(([reaction, Icon]) => (
            <button
              key={reaction}
              onClick={() => handleReaction(reaction)}
              className={cn(
                'p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors',
                reactionColors[reaction as keyof typeof reactionColors] || 'text-[#888]'
              )}
              title={reaction}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

