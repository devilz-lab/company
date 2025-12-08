'use client'

import { useState } from 'react'
import { Heart, Flame, ThumbsUp, Smile, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmojiPicker } from './EmojiPicker'

interface MessageReactionsProps {
  messageId: string
  reactions: Record<string, number> | null // Changed to number for counts
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

// Check if reaction is an emoji (not an icon key)
const isEmoji = (reaction: string) => {
  return !Object.keys(reactionIcons).includes(reaction)
}

export function MessageReactions({ messageId, reactions, onReaction }: MessageReactionsProps) {
  const handleReaction = (reaction: string) => {
    onReaction(messageId, reaction)
  }

  // Separate icon reactions and emoji reactions
  // Reactions are now always numbers (counts)
  const iconReactions: Array<[string, number]> = reactions
    ? Object.entries(reactions)
        .filter(([reaction]) => !isEmoji(reaction))
        .filter(([, count]) => typeof count === 'number' && count > 0)
        .map(([reaction, count]) => [reaction, count as number])
    : []
  const emojiReactions: Array<[string, number]> = reactions
    ? Object.entries(reactions)
        .filter(([reaction]) => isEmoji(reaction))
        .filter(([, count]) => typeof count === 'number' && count > 0)
        .map(([reaction, count]) => [reaction, count as number])
    : []

  return (
    <div className="relative flex items-center gap-1 flex-wrap">
      {/* Icon reactions */}
      {iconReactions.map(([reaction, count]) => {
        const Icon = reactionIcons[reaction as keyof typeof reactionIcons]
        if (!Icon) return null
        
        return (
          <button
            key={reaction}
            onClick={() => handleReaction(reaction)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full transition-colors hover:bg-[#2a2a2a]',
              reactionColors[reaction as keyof typeof reactionColors] || 'text-[#888]'
            )}
            title={`${reaction} (${count})`}
          >
            <Icon className="w-4 h-4" />
            {count > 1 && <span className="text-xs">{count}</span>}
          </button>
        )
      })}

      {/* Emoji reactions */}
      {emojiReactions.map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          className="flex items-center gap-1 px-2 py-1 rounded-full transition-colors hover:bg-[#2a2a2a] text-base"
          title={`${emoji} (${count})`}
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-xs text-[#888]">{count}</span>}
        </button>
      ))}

      {/* Add reaction button with emoji picker */}
      <EmojiPicker
        onEmojiSelect={(emoji) => handleReaction(emoji)}
        trigger={
          <button
            className="p-1 rounded-full text-[#666] hover:text-[#888] hover:bg-[#2a2a2a] transition-colors"
            title="Add reaction"
          >
            <Smile className="w-4 h-4" />
          </button>
        }
      />

    </div>
  )
}

