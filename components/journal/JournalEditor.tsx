'use client'

import { useState } from 'react'
import { Save, X } from 'lucide-react'

interface JournalEditorProps {
  onSave: (entry: { title: string; content: string; mood: string; tags: string[] }) => void
  onCancel: () => void
}

const moods = ['😊 Happy', '😢 Sad', '😍 Excited', '😰 Anxious', '😴 Tired', '🔥 Horny', '😌 Calm', '😡 Angry', '🤔 Thoughtful']

export function JournalEditor({ onSave, onCancel }: JournalEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSaving(true)
    try {
      await onSave({ title, content, mood, tags })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#ededed] mb-2">
          Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title..."
          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#ededed] mb-2">
          Content *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts..."
          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a] resize-none min-h-[200px]"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#ededed] mb-2">
          Mood
        </label>
        <div className="flex flex-wrap gap-2">
          {moods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m === mood ? '' : m)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                mood === m
                  ? 'bg-[#2a2a2a] text-[#ededed] border border-[#3a3a3a]'
                  : 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a] hover:bg-[#2a2a2a]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#ededed] mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
            placeholder="Add tag..."
            className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a]"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#2a2a2a] text-[#ededed] rounded-lg text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-lg bg-[#1a1a1a] text-[#ededed] border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!content.trim() || isSaving}
          className="flex-1 py-3 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </form>
  )
}

