'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Archive, ArchiveRestore, Trash2, Search, Filter, Tag, X } from 'lucide-react'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import { Avatar } from '@/components/personas/Avatar'
import { TagInput } from './TagInput'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  mode: string
  created_at: string
  updated_at: string
  is_archived: boolean
  tags: string[] | null
  personas: {
    id: string
    name: string
    avatar_url: string | null
  } | null
  message_count: number
  last_message: {
    content: string
    created_at: string
    role: string
  } | null
}

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingTags, setEditingTags] = useState<string | null>(null)

  useEffect(() => {
    loadConversations()
  }, [showArchived, selectedPersona])

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        archived: String(showArchived),
      })
      if (selectedPersona) {
        params.append('personaId', selectedPersona)
      }

      const response = await fetch(`/api/conversations?${params}`)
      if (!response.ok) throw new Error('Failed to load conversations')
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchive = async (id: string, archive: boolean) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: archive }),
      })
      if (!response.ok) throw new Error('Failed to archive conversation')
      await loadConversations()
    } catch (error) {
      console.error('Error archiving conversation:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete conversation')
      await loadConversations()
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const handleUpdateTags = async (id: string, tags: string[]) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      })
      if (!response.ok) throw new Error('Failed to update tags')
      await loadConversations()
      setEditingTags(null)
    } catch (error) {
      console.error('Error updating tags:', error)
    }
  }

  // Get all unique tags from conversations
  const allTags = Array.from(
    new Set(
      conversations.flatMap(conv => conv.tags || [])
    )
  ).sort()

  const tagColors = [
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'bg-green-500/20 text-green-400 border-green-500/30',
    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'bg-red-500/20 text-red-400 border-red-500/30',
    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  ]

  const getTagColor = (tag: string) => {
    const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return tagColors[index % tagColors.length]
  }

  const filteredConversations = conversations.filter((conv) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        conv.personas?.name.toLowerCase().includes(query) ||
        conv.last_message?.content.toLowerCase().includes(query) ||
        conv.mode.toLowerCase().includes(query) ||
        conv.tags?.some(tag => tag.toLowerCase().includes(query))
      )
      if (!matchesSearch) return false
    }

    // Tag filter
    if (selectedTags.length > 0) {
      const hasAllSelectedTags = selectedTags.every(tag => conv.tags?.includes(tag))
      if (!hasAllSelectedTags) return false
    }

    return true
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
            placeholder="Search conversations..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showArchived
                ? 'bg-[#2a2a2a] text-[#ededed]'
                : 'bg-[#1a1a1a] text-[#888] hover:bg-[#2a2a2a]'
            }`}
          >
            {showArchived ? (
              <>
                <ArchiveRestore className="w-4 h-4 inline mr-1" />
                Show Active
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 inline mr-1" />
                Show Archived
              </>
            )}
          </button>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-[#888]" />
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    )
                  }}
                  className={cn(
                    'px-2 py-1 rounded-md text-xs font-medium border transition-colors',
                    selectedTags.includes(tag)
                      ? getTagColor(tag) + ' opacity-100'
                      : 'bg-[#1a1a1a] text-[#888] border-[#2a2a2a] hover:border-[#3a3a3a]'
                  )}
                >
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-2 py-1 rounded-md text-xs text-[#888] hover:text-[#ededed]"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-[#888]" />
          <p className="text-[#888] mb-2">
            {showArchived ? 'No archived conversations' : 'No conversations yet'}
          </p>
          <p className="text-sm text-[#666]">
            {showArchived
              ? 'Archive conversations to see them here'
              : 'Start chatting to create your first conversation'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/chat?conversation=${conv.id}`}
              className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#3a3a3a] transition-colors"
            >
              <div className="flex items-start gap-3">
                {conv.personas && (
                  <Avatar
                    personaId={conv.personas.id}
                    avatarUrl={conv.personas.avatar_url}
                    name={conv.personas.name}
                    size="md"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-[#ededed] truncate">
                      {conv.personas?.name || 'Unknown Persona'}
                    </h3>
                    <span className="text-xs text-[#666] capitalize">{conv.mode}</span>
                  </div>
                  {conv.last_message && (
                    <p className="text-sm text-[#888] truncate mb-2">
                      {conv.last_message.content}
                    </p>
                  )}
                  
                  {/* Tags */}
                  {editingTags === conv.id ? (
                    <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                      <TagInput
                        tags={conv.tags || []}
                        onChange={(tags) => handleUpdateTags(conv.id, tags)}
                        suggestedTags={allTags}
                        placeholder="Add tags..."
                      />
                    </div>
                  ) : (
                    (conv.tags && conv.tags.length > 0) && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {conv.tags.map(tag => (
                          <span
                            key={tag}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
                              getTagColor(tag)
                            )}
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setEditingTags(conv.id)
                          }}
                          className="text-xs text-[#666] hover:text-[#888] px-1"
                        >
                          Edit
                        </button>
                      </div>
                    )
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-[#666]">
                      <span>{conv.message_count} messages</span>
                      <span>•</span>
                      <span>{formatRelativeTime(conv.updated_at)}</span>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleArchive(conv.id, !conv.is_archived)
                        }}
                        className="p-1 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                        title={conv.is_archived ? 'Unarchive' : 'Archive'}
                      >
                        {conv.is_archived ? (
                          <ArchiveRestore className="w-4 h-4 text-[#888]" />
                        ) : (
                          <Archive className="w-4 h-4 text-[#888]" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleDelete(conv.id)
                        }}
                        className="p-1 rounded-lg hover:bg-red-900/30 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

