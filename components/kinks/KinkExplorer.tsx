'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Sparkles } from 'lucide-react'
import { KinkCard } from './KinkCard'

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

const categories = [
  'BDSM',
  'Roleplay',
  'Sensation',
  'Power Exchange',
  'Fetish',
  'Taboo',
  'Other',
]

export function KinkExplorer() {
  const [kinks, setKinks] = useState<Kink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKink, setNewKink] = useState({ name: '', category: '', status: 'curious' as const })

  useEffect(() => {
    loadKinks()
  }, [])

  const loadKinks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/kinks')
      if (!response.ok) throw new Error('Failed to load kinks')
      const data = await response.json()
      setKinks(data.kinks || [])
    } catch (error) {
      console.error('Error loading kinks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddKink = async () => {
    if (!newKink.name || !newKink.category) return

    try {
      const response = await fetch('/api/kinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKink),
      })
      if (!response.ok) throw new Error('Failed to add kink')
      await loadKinks()
      setNewKink({ name: '', category: '', status: 'curious' })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding kink:', error)
    }
  }

  const handleUpdateKink = async (id: string, updates: Partial<Kink>) => {
    try {
      const response = await fetch(`/api/kinks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update kink')
      await loadKinks()
    } catch (error) {
      console.error('Error updating kink:', error)
    }
  }

  const handleDeleteKink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this kink?')) return

    try {
      const response = await fetch(`/api/kinks/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete kink')
      await loadKinks()
    } catch (error) {
      console.error('Error deleting kink:', error)
    }
  }

  const filteredKinks = kinks.filter((kink) => {
    const matchesSearch = kink.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || kink.category === selectedCategory
    const matchesStatus = !selectedStatus || kink.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const groupedKinks = filteredKinks.reduce((acc, kink) => {
    if (!acc[kink.category]) {
      acc[kink.category] = []
    }
    acc[kink.category].push(kink)
    return acc
  }, {} as Record<string, Kink[]>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search kinks..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              !selectedCategory
                ? 'bg-[#2a2a2a] text-[#ededed]'
                : 'bg-[#1a1a1a] text-[#888] hover:bg-[#2a2a2a]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#2a2a2a] text-[#ededed]'
                  : 'bg-[#1a1a1a] text-[#888] hover:bg-[#2a2a2a]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedStatus(null)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              !selectedStatus
                ? 'bg-[#2a2a2a] text-[#ededed]'
                : 'bg-[#1a1a1a] text-[#888] hover:bg-[#2a2a2a]'
            }`}
          >
            All Status
          </button>
          {['interested', 'curious', 'limit', 'explored'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors capitalize ${
                selectedStatus === status
                  ? 'bg-[#2a2a2a] text-[#ededed]'
                  : 'bg-[#1a1a1a] text-[#888] hover:bg-[#2a2a2a]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Add kink form */}
      {showAddForm && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={newKink.name}
            onChange={(e) => setNewKink({ ...newKink, name: e.target.value })}
            placeholder="Kink name"
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a]"
          />
          <select
            value={newKink.category}
            onChange={(e) => setNewKink({ ...newKink, category: e.target.value })}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-[#ededed] focus:outline-none focus:border-[#3a3a3a]"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAddKink}
              className="flex-1 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] font-medium transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#888] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Kink
        </button>
      )}

      {/* Kinks grouped by category */}
      {Object.keys(groupedKinks).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-[#888]" />
          </div>
          <h2 className="text-xl font-semibold text-[#ededed] mb-2">
            {searchQuery || selectedCategory || selectedStatus ? 'No kinks found' : 'Start Exploring'}
          </h2>
          <p className="text-sm text-[#888] mb-6 max-w-md">
            {searchQuery || selectedCategory || selectedStatus
              ? 'Try adjusting your search or filters'
              : 'Add your interests, curiosities, and limits. Your companion will learn about them as you chat!'}
          </p>
          {!searchQuery && !selectedCategory && !selectedStatus && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-xl px-6 py-3 transition-colors font-medium"
            >
              Add Your First Kink
            </button>
          )}
          <div className="mt-6 text-xs text-[#666] space-y-1">
            <p>💡 Kinks are automatically detected from your conversations</p>
            <p>💡 Track what you're interested in, curious about, or want to avoid</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedKinks).map(([category, categoryKinks]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-[#ededed] mb-3 capitalize">{category}</h3>
              <div className="grid gap-4">
                {categoryKinks.map((kink) => (
                  <KinkCard
                    key={kink.id}
                    kink={kink}
                    onUpdate={handleUpdateKink}
                    onDelete={handleDeleteKink}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

