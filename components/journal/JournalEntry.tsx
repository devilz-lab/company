'use client'

import { formatDate } from '@/lib/utils'
import { Heart } from 'lucide-react'

interface JournalEntry {
  id: string
  title: string | null
  content: string
  mood: string | null
  tags: string[] | null
  created_at: string
  companion_reflection: string | null
}

interface JournalEntryProps {
  entry: JournalEntry
}

export function JournalEntryCard({ entry }: JournalEntryProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {entry.title && (
            <h3 className="text-lg font-semibold text-[#ededed] mb-1">{entry.title}</h3>
          )}
          <p className="text-xs text-[#666]">{formatDate(entry.created_at)}</p>
        </div>
        {entry.mood && (
          <span className="text-2xl">{entry.mood}</span>
        )}
      </div>

      <p className="text-sm text-[#ededed] whitespace-pre-wrap">{entry.content}</p>

      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-[#2a2a2a] text-[#888] rounded-lg text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {entry.companion_reflection && (
        <div className="pt-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-[#ededed]">Companion's Reflection</span>
          </div>
          <p className="text-sm text-[#888] italic">{entry.companion_reflection}</p>
        </div>
      )}
    </div>
  )
}

