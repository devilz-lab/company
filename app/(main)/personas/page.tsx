'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, Users } from 'lucide-react'
import { Persona } from '@/types/persona'
import { PersonaCard } from '@/components/personas/PersonaCard'
import { PersonaCreator } from '@/components/personas/PersonaCreator'
import { PersonaCreate } from '@/types/persona'

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreator, setShowCreator] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)

  useEffect(() => {
    loadPersonas()
  }, [])

  const loadPersonas = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/personas')
      if (!response.ok) throw new Error('Failed to load personas')
      const data = await response.json()
      setPersonas(data.personas || [])
    } catch (error) {
      console.error('Error loading personas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivate = async (id: string) => {
    try {
      const response = await fetch(`/api/personas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      })
      if (!response.ok) throw new Error('Failed to activate persona')
      await loadPersonas()
    } catch (error) {
      console.error('Error activating persona:', error)
    }
  }

  const handleCreate = async (personaData: PersonaCreate) => {
    try {
      if (editingPersona) {
        // Update existing persona
        const response = await fetch(`/api/personas/${editingPersona.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(personaData),
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error Response:', response.status, errorText)
          let errorMessage = 'Failed to update persona'
          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.error || errorMessage
          } catch {
            errorMessage = errorText || errorMessage
          }
          alert(`Error: ${errorMessage}\n\nCheck browser console for details.`)
          throw new Error(errorMessage)
        }
        
        const data = await response.json()
        console.log('Persona updated successfully:', data)
        await loadPersonas()
        setEditingPersona(null)
      } else {
        // Create new persona
        console.log('Creating persona with data:', personaData)
        const response = await fetch('/api/personas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(personaData),
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error Response:', response.status, errorText)
          let errorMessage = 'Failed to create persona'
          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.error || errorMessage
          } catch {
            errorMessage = errorText || errorMessage
          }
          alert(`Error: ${errorMessage}\n\nCheck browser console for details.`)
          throw new Error(errorMessage)
        }
        
        const data = await response.json()
        console.log('Persona created successfully:', data)
        await loadPersonas()
      }
    } catch (error) {
      console.error('Error saving persona:', error)
      if (!(error instanceof Error && error.message.includes('Error:'))) {
        alert(`Error saving persona: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck browser console for details.`)
      }
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) return

    try {
      const response = await fetch(`/api/personas/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete persona')
      await loadPersonas()
    } catch (error) {
      console.error('Error deleting persona:', error)
      alert('Failed to delete persona')
    }
  }

  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona)
    setShowCreator(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#888]" />
      </div>
    )
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#ededed] mb-1">Personas</h1>
          <p className="text-sm text-[#888]">
            Switch between different companion personalities
          </p>
        </div>
        <button
          onClick={() => setShowCreator(true)}
          className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-xl p-3 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {personas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-[#888]" />
          </div>
          <h2 className="text-xl font-semibold text-[#ededed] mb-2">Create Your First Persona</h2>
          <p className="text-sm text-[#888] mb-6 max-w-md">
            Personas are different companion personalities. Create one to get started!
          </p>
          <button
            onClick={() => setShowCreator(true)}
            className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-xl px-6 py-3 transition-colors font-medium"
          >
            Create Persona
          </button>
          <div className="mt-6 text-xs text-[#666] space-y-1">
            <p>💡 You can create multiple personas for different moods</p>
            <p>💡 Each persona has unique traits and communication styles</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {personas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              isActive={persona.is_active}
              onActivate={handleActivate}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreator && (
        <PersonaCreator
          onClose={() => {
            setShowCreator(false)
            setEditingPersona(null)
          }}
          onSave={handleCreate}
          editingPersona={editingPersona}
        />
      )}
    </div>
  )
}
