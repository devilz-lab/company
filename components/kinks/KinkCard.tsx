'use client'

import { useState } from 'react'
import { Heart, X, Edit2, Trash2, Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface Kink {
  id: string
  name: string
  category: string
  status: 'interested' | 'curious' | 'limit' | 'explored'
  notes: string | null
  exploration_count: number
  first_explored: string | null
  last_explored: string | null
}

interface KinkCardProps {
  kink: Kink
  onUpdate: (id: string, updates: Partial<Kink>) => void
  onDelete: (id: string) => void
}

const statusColors = {
  interested: 'bg-green-500/20 border-green-500/50 text-green-400',
  curious: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
  limit: 'bg-red-500/20 border-red-500/50 text-red-400',
  explored: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
}

const statusLabels = {
  interested: 'Interested',
  curious: 'Curious',
  limit: 'Limit',
  explored: 'Explored',
}

export function KinkCard({ kink, onUpdate, onDelete }: KinkCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(kink.notes || '')

  const handleStatusChange = async (newStatus: Kink['status']) => {
    await onUpdate(kink.id, { status: newStatus })
  }

  const handleSaveNotes = async () => {
    await onUpdate(kink.id, { notes: notes || null })
    setIsEditing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 border-2 ${statusColors[kink.status]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#ededed] mb-1">{kink.name}</h3>
          <p className="text-xs text-[#888] capitalize">{kink.category}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors"
          >
            <Edit2 className="w-4 h-4 text-[#ededed]" />
          </button>
          <button
            onClick={() => onDelete(kink.id)}
            className="p-2 rounded-lg bg-[#2a2a2a] hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Status buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(['interested', 'curious', 'limit', 'explored'] as const).map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              kink.status === status
                ? 'bg-[#2a2a2a] text-[#ededed]'
                : 'bg-[#1a1a1a] text-[#888] hover:bg-[#2a2a2a]'
            }`}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>

      {/* Notes */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a] resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveNotes}
              className="flex-1 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setNotes(kink.notes || '')
                setIsEditing(false)
              }}
              className="px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#888] text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        kink.notes && (
          <p className="text-sm text-[#888] mb-2">{kink.notes}</p>
        )
      )}

      {/* Stats */}
      {kink.exploration_count > 0 && (
        <div className="flex items-center gap-4 text-xs text-[#666] mt-2 pt-2 border-t border-[#2a2a2a]">
          <span>Explored {kink.exploration_count} time{kink.exploration_count !== 1 ? 's' : ''}</span>
          {kink.last_explored && (
            <span>Last: {new Date(kink.last_explored).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}

