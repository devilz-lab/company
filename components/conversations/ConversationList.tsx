'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Archive, ArchiveRestore, Trash2, Search, Filter } from 'lucide-react'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import { Avatar } from '@/components/personas/Avatar'
import Link from 'next/link'

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

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      conv.personas?.name.toLowerCase().includes(query) ||
      conv.last_message?.content.toLowerCase().includes(query) ||
      conv.mode.toLowerCase().includes(query)
    )
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

        <div className="flex gap-2">
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

