'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Persona, PersonaCreate } from '@/types/persona'
import { Avatar } from './Avatar'

interface PersonaCreatorProps {
  onClose: () => void
  onSave: (persona: PersonaCreate) => Promise<void>
  editingPersona?: Persona | null
}

const communicationStyles = ['casual', 'formal', 'intimate', 'playful', 'dominant', 'submissive'] as const
const personalityTraits = [
  'dominant',
  'submissive',
  'switch',
  'assertive',
  'caring',
  'playful',
  'gentle',
  'rough',
  'romantic',
  'kinky',
] as const

export function PersonaCreator({ onClose, onSave, editingPersona }: PersonaCreatorProps) {
  const [name, setName] = useState(editingPersona?.name || '')
  const [communicationStyle, setCommunicationStyle] = useState<PersonaCreate['communication_style']>(
    editingPersona?.communication_style || 'casual'
  )
  const [selectedTraits, setSelectedTraits] = useState<string[]>(
    editingPersona?.personality_traits ? Object.keys(editingPersona.personality_traits).filter(
      key => editingPersona.personality_traits[key] === true
    ) : []
  )
  const [avatarUrl, setAvatarUrl] = useState<string | null>(editingPersona?.avatar_url || null)
  const [isSaving, setIsSaving] = useState(false)

  const toggleTrait = (trait: string) => {
    setSelectedTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSaving(true)
    try {
      const personality_traits = selectedTraits.reduce((acc, trait) => {
        acc[trait] = true
        return acc
      }, {} as Record<string, boolean>)

      await onSave({
        name: name.trim(),
        communication_style: communicationStyle,
        personality_traits,
        avatar_url: avatarUrl,
      })
      onClose()
    } catch (error) {
      console.error('Error creating persona:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#ededed]">
            {editingPersona ? 'Edit Persona' : 'Create Persona'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="w-5 h-5 text-[#ededed]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#ededed] mb-2">
              Avatar
            </label>
            <div className="flex items-center gap-4">
              <Avatar
                personaId="new"
                avatarUrl={avatarUrl}
                name={name || 'New Persona'}
                size="lg"
                editable={true}
                onUpdate={setAvatarUrl}
              />
              <p className="text-xs text-[#666]">Click to upload an avatar</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#ededed] mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter persona name"
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#ededed] mb-2">
              Communication Style
            </label>
            <select
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value as PersonaCreate['communication_style'])}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#ededed] focus:outline-none focus:border-[#3a3a3a]"
            >
              {communicationStyles.map((style) => (
                <option key={style} value={style} className="bg-[#1a1a1a]">
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#ededed] mb-2">
              Personality Traits
            </label>
            <div className="flex flex-wrap gap-2">
              {personalityTraits.map((trait) => (
                <button
                  key={trait}
                  type="button"
                  onClick={() => toggleTrait(trait)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTraits.includes(trait)
                      ? 'bg-[#2a2a2a] text-[#ededed] border border-[#3a3a3a]'
                      : 'bg-[#0f0f0f] text-[#888] border border-[#2a2a2a] hover:border-[#3a3a3a]'
                  }`}
                >
                  {trait.charAt(0).toUpperCase() + trait.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg bg-[#0f0f0f] text-[#ededed] border border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className="flex-1 py-3 rounded-lg bg-[#2a2a2a] text-[#ededed] hover:bg-[#3a3a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (editingPersona ? 'Saving...' : 'Creating...') : (editingPersona ? 'Save Changes' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

