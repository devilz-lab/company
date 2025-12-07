'use client'

import { useState, useEffect } from 'react'
import { Brain, Search, Filter, Star, Trash2, Edit2, X } from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/utils'

interface Memory {
  id: string
  memory_type: string
  content: string
  importance: number
  strength: number
  created_at: string
  last_accessed: string | null
  access_count: number
  persona_id: string | null
}

export function MemoryBrowser() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editImportance, setEditImportance] = useState(5)

  useEffect(() => {
    loadMemories()
  }, [])

  const loadMemories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/memories?limit=100')
      if (!response.ok) throw new Error('Failed to load memories')
      const data = await response.json()
      setMemories(data.memories || [])
    } catch (error) {
      console.error('Error loading memories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return

    try {
      const response = await fetch(`/api/memories/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete memory')
      await loadMemories()
    } catch (error) {
      console.error('Error deleting memory:', error)
    }
  }

  const handleUpdate = async () => {
    if (!editingMemory) return

    try {
      const response = await fetch(`/api/memories/${editingMemory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent,
          importance: editImportance,
        }),
      })
      if (!response.ok) throw new Error('Failed to update memory')
      await loadMemories()
      setEditingMemory(null)
    } catch (error) {
      console.error('Error updating memory:', error)
    }
  }

  const memoryTypes = ['fact', 'preference', 'boundary', 'milestone', 'joke', 'pattern', 'emotional_state', 'scenario']

  const filteredMemories = memories.filter((mem) => {
    const matchesSearch = mem.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !filterType || mem.memory_type === filterType
    return matchesSearch && matchesType
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterType(null)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              !filterType
                ? 'bg-[#2a2a2a] text-[#ededed]'
                : 'bg-[#1a1a1a] text-[#888] hover:bg-[#2a2a2a]'
            }`}
          >
            All Types
          </button>
          {memoryTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors capitalize ${
                filterType === type
                  ? 'bg-[#2a2a2a] text-[#ededed]'
                  : 'bg-[#1a1a1a] text-[#888] hover:bg-[#2a2a2a]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingMemory && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#ededed]">Edit Memory</h3>
              <button
                onClick={() => setEditingMemory(null)}
                className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                <X className="w-5 h-5 text-[#888]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#ededed] mb-2">Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#ededed] focus:outline-none focus:border-[#3a3a3a] resize-none min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#ededed] mb-2">
                  Importance: {editImportance}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={editImportance}
                  onChange={(e) => setEditImportance(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditingMemory(null)}
                  className="flex-1 py-2 rounded-lg bg-[#1a1a1a] text-[#ededed] border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Memories List */}
      {filteredMemories.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 mx-auto mb-4 text-[#888]" />
          <p className="text-[#888] mb-2">No memories found</p>
          <p className="text-sm text-[#666]">
            {searchQuery || filterType ? 'Try adjusting your search' : 'Memories will appear here as you chat'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMemories.map((memory) => (
            <div
              key={memory.id}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-[#2a2a2a] text-[#888] capitalize">
                      {memory.memory_type}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: memory.importance }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-[#ededed] mb-2">{memory.content}</p>
                  <div className="flex items-center gap-4 text-xs text-[#666]">
                    <span>Strength: {(memory.strength * 100).toFixed(0)}%</span>
                    <span>•</span>
                    <span>Accessed: {memory.access_count} times</span>
                    <span>•</span>
                    <span>{formatRelativeTime(memory.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingMemory(memory)
                      setEditContent(memory.content)
                      setEditImportance(memory.importance)
                    }}
                    className="p-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-[#888]" />
                  </button>
                  <button
                    onClick={() => handleDelete(memory.id)}
                    className="p-2 rounded-lg bg-[#2a2a2a] hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

