'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, MessageCircle, Brain, BookOpen, Loader2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

interface SearchResults {
  conversations: any[]
  messages: any[]
  memories: any[]
  journal: any[]
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      setShowResults(false)
      return
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (!response.ok) throw new Error('Search failed')
        const data = await response.json()
        setResults(data.results)
        setShowResults(true)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  const totalResults =
    (results?.conversations.length || 0) +
    (results?.messages.length || 0) +
    (results?.memories.length || 0) +
    (results?.journal.length || 0)

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Search conversations, messages, memories..."
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-10 pr-10 py-2 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a]"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults(null)
              setShowResults(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="w-4 h-4 text-[#888]" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {showResults && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-lg z-50 max-h-[500px] overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#888]" />
            </div>
          ) : totalResults === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#888]">No results found</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Conversations */}
              {results?.conversations && results.conversations.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[#888] mb-2 uppercase flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" />
                    Conversations ({results.conversations.length})
                  </h3>
                  <div className="space-y-2">
                    {results.conversations.map((conv) => (
                      <Link
                        key={conv.id}
                        href={`/chat?conversation=${conv.id}`}
                        className="block p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                        onClick={() => setShowResults(false)}
                      >
                        <p className="text-sm text-[#ededed] capitalize">{conv.mode}</p>
                        <p className="text-xs text-[#666]">{formatRelativeTime(conv.updated_at)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {results?.messages && results.messages.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[#888] mb-2 uppercase flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" />
                    Messages ({results.messages.length})
                  </h3>
                  <div className="space-y-2">
                    {results.messages.slice(0, 5).map((msg) => (
                      <Link
                        key={msg.id}
                        href={`/chat?conversation=${msg.conversation_id}`}
                        className="block p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                        onClick={() => setShowResults(false)}
                      >
                        <p className="text-sm text-[#ededed] line-clamp-2">{msg.content}</p>
                        <p className="text-xs text-[#666]">{formatRelativeTime(msg.created_at)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Memories */}
              {results?.memories && results.memories.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[#888] mb-2 uppercase flex items-center gap-2">
                    <Brain className="w-3 h-3" />
                    Memories ({results.memories.length})
                  </h3>
                  <div className="space-y-2">
                    {results.memories.slice(0, 5).map((mem) => (
                      <Link
                        key={mem.id}
                        href="/memories"
                        className="block p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                        onClick={() => setShowResults(false)}
                      >
                        <p className="text-sm text-[#ededed] line-clamp-2">{mem.content}</p>
                        <p className="text-xs text-[#666] capitalize">{mem.memory_type}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Journal */}
              {results?.journal && results.journal.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[#888] mb-2 uppercase flex items-center gap-2">
                    <BookOpen className="w-3 h-3" />
                    Journal ({results.journal.length})
                  </h3>
                  <div className="space-y-2">
                    {results.journal.slice(0, 5).map((entry) => (
                      <Link
                        key={entry.id}
                        href="/journal"
                        className="block p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                        onClick={() => setShowResults(false)}
                      >
                        <p className="text-sm font-medium text-[#ededed]">{entry.title || 'Untitled'}</p>
                        <p className="text-xs text-[#888] line-clamp-1">{entry.content}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

