'use client'

import { Persona } from '@/types/persona'
import { Check, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from './Avatar'

interface PersonaCardProps {
  persona: Persona
  isActive: boolean
  onActivate: (id: string) => void
  onEdit: (persona: Persona) => void
  onDelete: (id: string) => void
}

export function PersonaCard({ persona, isActive, onActivate, onEdit, onDelete }: PersonaCardProps) {
  const colorScheme = persona.color_scheme || {
    primary: '#2a2a2a',
    secondary: '#1a1a1a',
    accent: '#3a3a3a',
  }

  return (
    <div
      className={cn(
        'relative rounded-xl p-4 border-2 transition-all',
        isActive
          ? 'border-[#3a3a3a] bg-[#1a1a1a]'
          : 'border-[#2a2a2a] bg-[#0f0f0f] hover:border-[#2a2a2a]'
      )}
      style={{
        borderColor: isActive ? colorScheme.accent : undefined,
      }}
    >
      {isActive && (
        <div className="absolute top-2 right-2">
          <div className="bg-[#2a2a2a] rounded-full p-1">
            <Check className="w-4 h-4 text-[#ededed]" />
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <Avatar
            personaId={persona.id}
            avatarUrl={persona.avatar_url}
            name={persona.name}
            size="md"
            editable={false}
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#ededed] mb-1">{persona.name}</h3>
            <p className="text-sm text-[#888] capitalize">{persona.communication_style}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(persona)}
            className="p-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors"
          >
            <Edit2 className="w-4 h-4 text-[#ededed]" />
          </button>
          <button
            onClick={() => onDelete(persona.id)}
            className="p-2 rounded-lg bg-[#2a2a2a] hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(persona.personality_traits)
          .filter(([_, value]) => value === true)
          .slice(0, 4)
          .map(([trait]) => (
            <span
              key={trait}
              className="text-xs px-2 py-1 rounded-full bg-[#2a2a2a] text-[#888] capitalize"
            >
              {trait}
            </span>
          ))}
      </div>

      <button
        onClick={() => onActivate(persona.id)}
        className={cn(
          'w-full py-2 rounded-lg font-medium transition-colors',
          isActive
            ? 'bg-[#2a2a2a] text-[#ededed] cursor-default'
            : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#ededed] border border-[#2a2a2a]'
        )}
        disabled={isActive}
      >
        {isActive ? 'Active' : 'Activate'}
      </button>
    </div>
  )
}

