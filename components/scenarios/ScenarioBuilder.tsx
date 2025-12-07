'use client'

import { useState, useEffect } from 'react'
import { Plus, Star, Play, Edit2, Trash2, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface Scenario {
  id: string
  title: string
  description: string | null
  template_data: Record<string, any> | null
  is_favorite: boolean
  usage_count: number
  persona_id: string | null
}

export function ScenarioBuilder() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null)
  const [formData, setFormData] = useState({ title: '', description: '', template_data: '' })

  useEffect(() => {
    loadScenarios()
  }, [])

  const loadScenarios = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/scenarios')
      if (!response.ok) throw new Error('Failed to load scenarios')
      const data = await response.json()
      setScenarios(data.scenarios || [])
    } catch (error) {
      console.error('Error loading scenarios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim()) return

    try {
      const url = editingScenario
        ? `/api/scenarios/${editingScenario.id}`
        : '/api/scenarios'
      
      const method = editingScenario ? 'PATCH' : 'POST'
      
      let templateData = null
      if (formData.template_data.trim()) {
        try {
          templateData = JSON.parse(formData.template_data)
        } catch {
          // Invalid JSON, ignore
        }
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          template_data: templateData,
        }),
      })

      if (!response.ok) throw new Error('Failed to save scenario')
      await loadScenarios()
      setShowEditor(false)
      setEditingScenario(null)
      setFormData({ title: '', description: '', template_data: '' })
    } catch (error) {
      console.error('Error saving scenario:', error)
      alert('Failed to save scenario')
    }
  }

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const response = await fetch(`/api/scenarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !currentFavorite }),
      })
      if (!response.ok) throw new Error('Failed to update scenario')
      await loadScenarios()
    } catch (error) {
      console.error('Error updating scenario:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return

    try {
      const response = await fetch(`/api/scenarios/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete scenario')
      await loadScenarios()
    } catch (error) {
      console.error('Error deleting scenario:', error)
    }
  }

  const handleUse = async (scenario: Scenario) => {
    // Increment usage count
    await fetch(`/api/scenarios/${scenario.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usage_count: (scenario.usage_count || 0) + 1 }),
    })

    // Navigate to chat with scenario context
    // This would be handled by the chat page
    window.location.href = `/chat?scenario=${scenario.id}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ededed]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showEditor && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#ededed]">
              {editingScenario ? 'Edit Scenario' : 'New Scenario'}
            </h3>
            <button
              onClick={() => {
                setShowEditor(false)
                setEditingScenario(null)
                setFormData({ title: '', description: '', template_data: '' })
              }}
              className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
            >
              <X className="w-5 h-5 text-[#888]" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#ededed] mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Scenario title..."
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#ededed] mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the scenario..."
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a] resize-none min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#ededed] mb-2">
                Template Data (JSON, optional)
              </label>
              <textarea
                value={formData.template_data}
                onChange={(e) => setFormData({ ...formData, template_data: e.target.value })}
                placeholder='{"setting": "bedroom", "mood": "romantic"}'
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a] resize-none min-h-[80px] font-mono text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditor(false)
                  setEditingScenario(null)
                  setFormData({ title: '', description: '', template_data: '' })
                }}
                className="flex-1 py-3 rounded-lg bg-[#1a1a1a] text-[#ededed] border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {!showEditor && (
        <button
          onClick={() => setShowEditor(true)}
          className="w-full py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Scenario
        </button>
      )}

      {scenarios.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#888] mb-2">No scenarios yet</p>
          <p className="text-sm text-[#666]">Create scenarios for quick roleplay starts</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {scenarios.map((scenario) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-[#ededed]">{scenario.title}</h3>
                    {scenario.is_favorite && (
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  {scenario.description && (
                    <p className="text-sm text-[#888] mb-2">{scenario.description}</p>
                  )}
                  <p className="text-xs text-[#666]">
                    Used {scenario.usage_count || 0} time{scenario.usage_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleFavorite(scenario.id, scenario.is_favorite)}
                    className={`p-2 rounded-lg transition-colors ${
                      scenario.is_favorite
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-[#2a2a2a] text-[#888] hover:bg-[#3a3a3a]'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingScenario(scenario)
                      setFormData({
                        title: scenario.title,
                        description: scenario.description || '',
                        template_data: scenario.template_data ? JSON.stringify(scenario.template_data, null, 2) : '',
                      })
                      setShowEditor(true)
                    }}
                    className="p-2 rounded-lg bg-[#2a2a2a] text-[#888] hover:bg-[#3a3a3a] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(scenario.id)}
                    className="p-2 rounded-lg bg-[#2a2a2a] text-red-400 hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleUse(scenario)}
                className="w-full py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Use Scenario
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

