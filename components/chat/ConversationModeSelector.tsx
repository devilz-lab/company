'use client'

import { ConversationMode } from '@/types/chat'
import { Zap, MessageSquare, Theater, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConversationModeSelectorProps {
  mode: ConversationMode
  onModeChange: (mode: ConversationMode) => void
}

const modes: Array<{
  value: ConversationMode
  label: string
  icon: any
  description: string
}> = [
  {
    value: 'quick',
    label: 'Quick',
    icon: Zap,
    description: 'Short, casual responses',
  },
  {
    value: 'deep',
    label: 'Deep',
    icon: MessageSquare,
    description: 'Detailed, thoughtful conversations',
  },
  {
    value: 'roleplay',
    label: 'Roleplay',
    icon: Theater,
    description: 'Immersive scenarios',
  },
  {
    value: 'advice',
    label: 'Advice',
    icon: Lightbulb,
    description: 'Guidance and support',
  },
]

export function ConversationModeSelector({ mode, onModeChange }: ConversationModeSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {modes.map((modeOption) => {
        const Icon = modeOption.icon
        const isActive = mode === modeOption.value

        return (
          <button
            key={modeOption.value}
            onClick={() => onModeChange(modeOption.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-[#2a2a2a] text-[#ededed] border border-[#3a3a3a]'
                : 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a] hover:bg-[#2a2a2a] hover:text-[#ededed]'
            )}
            title={modeOption.description}
          >
            <Icon className="w-4 h-4" />
            <span>{modeOption.label}</span>
          </button>
        )
      })}
    </div>
  )
}

