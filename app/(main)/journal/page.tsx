'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Plus, Loader2 } from 'lucide-react'
import { JournalEditor } from '@/components/journal/JournalEditor'
import { JournalEntryCard } from '@/components/journal/JournalEntry'

interface JournalEntry {
  id: string
  title: string | null
  content: string
  mood: string | null
  tags: string[] | null
  created_at: string
  companion_reflection: string | null
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/journal')
      if (!response.ok) throw new Error('Failed to load journal entries')
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Error loading journal entries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (entryData: { title: string; content: string; mood: string; tags: string[] }) => {
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      })
      if (!response.ok) throw new Error('Failed to save entry')
      await loadEntries()
      setShowEditor(false)
    } catch (error) {
      console.error('Error saving journal entry:', error)
      alert('Failed to save entry')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#888]" />
      </div>
    )
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#ededed] mb-1">Journal</h1>
          <p className="text-sm text-[#888]">Your private thoughts and reflections</p>
        </div>
        {!showEditor && (
          <button
            onClick={() => setShowEditor(true)}
            className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-xl p-3 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {showEditor ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-[#ededed]" />
            <h2 className="text-lg font-semibold text-[#ededed]">New Entry</h2>
          </div>
          <JournalEditor
            onSave={handleSave}
            onCancel={() => setShowEditor(false)}
          />
        </div>
      ) : (
        <>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-[#888]" />
              <p className="text-[#888] mb-2">No journal entries yet</p>
              <button
                onClick={() => setShowEditor(true)}
                className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-xl px-6 py-3 transition-colors"
              >
                Write Your First Entry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <JournalEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

