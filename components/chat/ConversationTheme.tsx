'use client'

import { Palette, Moon, Sun, Heart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Theme = 'default' | 'romantic' | 'dark' | 'vibrant' | 'minimal'

interface ThemeOption {
  value: Theme
  label: string
  icon: any
  description: string
  colors: {
    background: string
    border: string
    text: string
  }
}

const themes: ThemeOption[] = [
  {
    value: 'default',
    label: 'Default',
    icon: Moon,
    description: 'Standard dark theme',
    colors: {
      background: 'bg-[#0a0a0a]',
      border: 'border-[#2a2a2a]',
      text: 'text-[#ededed]',
    },
  },
  {
    value: 'romantic',
    label: 'Romantic',
    icon: Heart,
    description: 'Warm, intimate tones',
    colors: {
      background: 'bg-[#1a0a0a]',
      border: 'border-[#3a1a1a]',
      text: 'text-[#ffeded]',
    },
  },
  {
    value: 'vibrant',
    label: 'Vibrant',
    icon: Sparkles,
    description: 'Colorful and energetic',
    colors: {
      background: 'bg-[#0a0a1a]',
      border: 'border-[#2a2a3a]',
      text: 'text-[#ededff]',
    },
  },
  {
    value: 'minimal',
    label: 'Minimal',
    icon: Sun,
    description: 'Clean and simple',
    colors: {
      background: 'bg-[#0f0f0f]',
      border: 'border-[#1a1a1a]',
      text: 'text-[#ffffff]',
    },
  },
]

interface ConversationThemeProps {
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
}

export function ConversationThemeSelector({ currentTheme, onThemeChange }: ConversationThemeProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-[#888]" />
        <span className="text-sm font-medium text-[#ededed]">Theme</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {themes.map((theme) => {
          const Icon = theme.icon
          const isActive = currentTheme === theme.value

          return (
            <button
              key={theme.value}
              onClick={() => onThemeChange(theme.value)}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-left',
                isActive
                  ? 'border-[#3a3a3a] bg-[#2a2a2a]'
                  : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('w-4 h-4', isActive ? 'text-[#ededed]' : 'text-[#888]')} />
                <span className={cn('text-sm font-medium', isActive ? 'text-[#ededed]' : 'text-[#888]')}>
                  {theme.label}
                </span>
              </div>
              <p className="text-xs text-[#666]">{theme.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

