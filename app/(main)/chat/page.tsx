'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Palette, MessageCircle, Plus, X, RotateCw, AlertCircle, Copy, Check, Edit2, Trash2, Mic, Keyboard } from 'lucide-react'
import { formatRelativeTime, formatFullTimestamp, getDateLabel, isSameDay } from '@/lib/utils'
import { ConversationModeSelector } from '@/components/chat/ConversationModeSelector'
import { MessageReactions } from '@/components/chat/MessageReactions'
import { ConversationThemeSelector, Theme } from '@/components/chat/ConversationTheme'
import { VoicePlayer } from '@/components/chat/VoicePlayer'
import { VoiceInput } from '@/components/chat/VoiceInput'
import { ConversationMode } from '@/types/chat'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  reactions?: Record<string, number | boolean> | null
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationMode, setConversationMode] = useState<ConversationMode>('quick')
  const [lastError, setLastError] = useState<string | null>(null)
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const [conversationTheme, setConversationTheme] = useState<Theme>('default')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<string>('')
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [personas, setPersonas] = useState<any[]>([])
  const [showPersonaSelector, setShowPersonaSelector] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [inputMode, setInputMode] = useState<'type' | 'transcribe'>('type')
  const [interimTranscript, setInterimTranscript] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load personas
  useEffect(() => {
    const loadPersonas = async () => {
      try {
        const response = await fetch('/api/personas')
        if (response.ok) {
          const data = await response.json()
          setPersonas(data.personas || [])
          // Set active persona as default
          const activePersona = data.personas?.find((p: any) => p.is_active)
          if (activePersona) {
            setSelectedPersonaId(activePersona.id)
          }
        }
      } catch (error) {
        console.error('Error loading personas:', error)
      }
    }
    loadPersonas()
  }, [])

  // Load conversation from URL or continue last conversation
  useEffect(() => {
    const loadConversation = async () => {
      // Check URL for conversation ID
      const urlParams = new URLSearchParams(window.location.search)
      const convIdFromUrl = urlParams.get('conversation')

      if (convIdFromUrl) {
        // Load specific conversation
        try {
          const response = await fetch(`/api/conversations/${convIdFromUrl}`)
          if (response.ok) {
            const data = await response.json()
            setConversationId(convIdFromUrl)
            setMessages(
              data.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                created_at: m.created_at,
                reactions: m.reactions,
              }))
            )
            return
          }
        } catch (error) {
          console.error('Error loading conversation:', error)
        }
      }

      // Otherwise, try to load last conversation
      try {
        const response = await fetch('/api/conversations?archived=false&limit=1')
        if (response.ok) {
          const data = await response.json()
          const lastConv = data.conversations?.[0]
          if (lastConv) {
            const convResponse = await fetch(`/api/conversations/${lastConv.id}`)
            if (convResponse.ok) {
              const convData = await convResponse.json()
              setConversationId(lastConv.id)
              setMessages(
                convData.messages.map((m: any) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  created_at: m.created_at,
                  reactions: m.reactions,
                }))
              )
            }
          }
        }
      } catch (error) {
        console.error('Error loading last conversation:', error)
      }
    }

    loadConversation()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-save draft to localStorage
  useEffect(() => {
    if (input.trim()) {
      const draftKey = `chat-draft-${conversationId || 'new'}`
      localStorage.setItem(draftKey, input)
    }
  }, [input, conversationId])

  // Load draft on mount or conversation change
  useEffect(() => {
    const draftKey = `chat-draft-${conversationId || 'new'}`
    const savedDraft = localStorage.getItem(draftKey)
    if (savedDraft && !input.trim()) {
      setInput(savedDraft)
    }
  }, [conversationId])

  // Clear draft after successful send
  const clearDraft = () => {
    const draftKey = `chat-draft-${conversationId || 'new'}`
    localStorage.removeItem(draftKey)
  }

  const sendMessage = async (messageContent: string, regenerateMessageId?: string) => {
    if (!messageContent.trim() || isLoading) return

    // If regenerating, remove the old assistant message
    if (regenerateMessageId) {
      setMessages(prev => prev.filter(m => m.id !== regenerateMessageId))
      setRegeneratingMessageId(regenerateMessageId)
    } else {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: messageContent.trim(),
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])
    }

    setInput('')
    setIsLoading(true)
    setLastError(null)

    try {
      // Get NSFW intensity from localStorage
      const nsfwIntensity = parseInt(localStorage.getItem('nsfwIntensity') || '5')

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent.trim(),
          conversationId: conversationId,
          personaId: selectedPersonaId,
          mode: conversationMode,
          regenerate: !!regenerateMessageId,
          lastMessageId: regenerateMessageId,
          nsfwIntensity,
        }),
      })

      // Get conversation ID from response headers
      const convIdFromHeader = response.headers.get('X-Conversation-Id')
      if (convIdFromHeader && !conversationId) {
        setConversationId(convIdFromHeader)
        window.history.replaceState({}, '', `/chat?conversation=${convIdFromHeader}`)
      }

      // Reload messages after streaming completes to get saved messages with proper IDs
      // This ensures we have the correct message IDs for reactions and history
      const finalConvId = convIdFromHeader || conversationId
      if (finalConvId && response.ok) {
        // Wait a bit longer for the message to be saved
        setTimeout(async () => {
          try {
            const convResponse = await fetch(`/api/conversations/${finalConvId}`)
            if (convResponse.ok) {
              const convData = await convResponse.json()
              setMessages(
                convData.messages.map((m: any) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  created_at: m.created_at,
                  reactions: m.reactions || null,
                }))
              )
            }
          } catch (error) {
            console.error('Error reloading messages:', error)
          }
        }, 1000) // Increased delay to ensure message is saved
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${errorText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(Boolean)

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  assistantMessage += parsed.content
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    const lastMsg = newMessages[newMessages.length - 1]
                    if (lastMsg?.role === 'assistant') {
                      lastMsg.content = assistantMessage
                    } else {
                      newMessages.push({
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: assistantMessage,
                        created_at: new Date().toISOString(),
                        reactions: null,
                      })
                    }
                    return newMessages
                  })
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLastError(errorMessage)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error. Please try again.`,
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
      setRegeneratingMessageId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMessage(input)
  }

  const handleRegenerate = async (messageId: string) => {
    // Find the user message before this assistant message
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1]
      if (userMessage.role === 'user') {
        await sendMessage(userMessage.content, messageId)
      }
    }
  }

  const handleRetry = () => {
    if (lastError && messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
      if (lastUserMessage) {
        sendMessage(lastUserMessage.content)
      }
    }
  }

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleEditMessage = (message: Message) => {
    if (message.role !== 'user') return
    setEditingMessageId(message.id)
    setEditingContent(message.content)
  }

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingContent.trim()) return

    try {
      // Update message in database
      const response = await fetch(`/api/messages/${editingMessageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingContent.trim() }),
      })

      if (response.ok) {
        // Update local state
        setMessages(prev =>
          prev.map(m =>
            m.id === editingMessageId ? { ...m, content: editingContent.trim() } : m
          )
        )
        setEditingMessageId(null)
        setEditingContent('')
      }
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId))
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  // Group messages by date for date separators
  const groupedMessages = (() => {
    const groups: Array<{ date: string; messages: Message[] }> = []
    let currentGroup: { date: string; messages: Message[] } | null = null

    messages.forEach((message, index) => {
      const messageDate = message.created_at
      const prevMessage = index > 0 ? messages[index - 1] : null

      // Check if we need a new date group
      if (!prevMessage || !isSameDay(prevMessage.created_at, messageDate)) {
        currentGroup = {
          date: messageDate,
          messages: [message],
        }
        groups.push(currentGroup)
      } else {
        currentGroup!.messages.push(message)
      }
    })

    return groups
  })()

  const startNewChat = () => {
    setShowPersonaSelector(true)
  }

  const confirmNewChat = (personaId: string | null) => {
    setMessages([])
    setConversationId(null)
    setSelectedPersonaId(personaId)
    setInput('')
    setShowPersonaSelector(false)
    // Clear URL parameter
    window.history.replaceState({}, '', '/chat')
  }

  const handleEndChat = async () => {
    if (!conversationId) return
    
    if (!confirm('End this conversation? This will archive it and extract final memories.')) {
      return
    }

    try {
      // Archive the conversation
      const archiveResponse = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: true }),
      })

      if (!archiveResponse.ok) {
        throw new Error('Failed to archive conversation')
      }

      // Trigger final memory extraction
      const extractResponse = await fetch('/api/memories/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })

      if (!extractResponse.ok) {
        console.warn('Memory extraction failed, but conversation archived')
      }

      // Clear current chat
      setMessages([])
      setConversationId(null)
      setInput('')
      window.history.replaceState({}, '', '/chat')
      
      alert('Conversation ended and archived. Memories have been extracted.')
    } catch (error) {
      console.error('Error ending chat:', error)
      alert('Failed to end conversation. Please try again.')
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
      {/* Header with New Chat button */}
      <div className="px-4 pt-4 pb-2 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-[#ededed]">Chat</h1>
            {selectedPersonaId && (
              <span className="text-xs text-[#888]">
                with {personas.find(p => p.id === selectedPersonaId)?.name || 'Companion'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {conversationId && (
              <button
                onClick={handleEndChat}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#3a1a1a] hover:bg-[#4a2a2a] text-[#ff8888] rounded-lg text-sm font-medium transition-colors"
                title="End and archive this conversation"
              >
                <X className="w-4 h-4" />
                <span>End Chat</span>
              </button>
            )}
            <button
              onClick={startNewChat}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-lg text-sm font-medium transition-colors"
              title="Start a new conversation"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>
        </div>
        
        {/* Persona Selector Modal */}
        {showPersonaSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPersonaSelector(false)}>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-semibold text-[#ededed] mb-4">Start New Chat</h2>
              <p className="text-sm text-[#888] mb-4">
                Select a persona for this conversation. Each persona will have separate memories and conversation history.
              </p>
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                <button
                  onClick={() => confirmNewChat(null)}
                  className="w-full text-left px-4 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors"
                >
                  <div className="font-medium text-[#ededed]">Default (No Persona)</div>
                  <div className="text-xs text-[#888] mt-1">Uses shared memories</div>
                </button>
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => confirmNewChat(persona.id)}
                    className="w-full text-left px-4 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors"
                  >
                    <div className="font-medium text-[#ededed]">{persona.name}</div>
                    <div className="text-xs text-[#888] mt-1">{persona.communication_style}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPersonaSelector(false)}
                className="w-full px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <ConversationModeSelector
          mode={conversationMode}
          onModeChange={setConversationMode}
        />
        {showThemeSelector && (
          <ConversationThemeSelector
            currentTheme={conversationTheme}
            onThemeChange={setConversationTheme}
          />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4 max-w-md">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-[#888]" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-[#ededed] mb-2">Start a conversation</h2>
              <p className="text-sm text-[#888] mb-4">
                Your companion is ready to chat. Try saying "hi" or ask about something you're curious about.
              </p>
              <div className="text-xs text-[#666] space-y-1">
                <p>💡 Tip: Switch conversation modes for different experiences</p>
                <p>💡 Tip: Your companion will remember what you tell them</p>
              </div>
            </div>
          </div>
        )}

        {groupedMessages.map((group, groupIndex) => (
          <div key={`group-${group.date}`}>
            {/* Date Separator */}
            {groupIndex > 0 && (
              <div className="flex items-center justify-center my-4">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-[#2a2a2a] flex-1"></div>
                  <span className="text-xs text-[#666] px-2">{getDateLabel(group.date)}</span>
                  <div className="h-px bg-[#2a2a2a] flex-1"></div>
                </div>
              </div>
            )}

            {/* Messages in this group */}
            {group.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 group relative ${
                    message.role === 'user'
                      ? 'bg-[#2a2a2a] text-[#ededed]'
                      : 'bg-[#1a1a1a] text-[#ededed] border border-[#2a2a2a]'
                  }`}
                >
                  {editingMessageId === message.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full bg-[#0f0f0f] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#ededed] resize-none focus:outline-none focus:border-[#4a4a4a]"
                        rows={3}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleSaveEdit()
                          } else if (e.key === 'Escape') {
                            setEditingMessageId(null)
                            setEditingContent('')
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#ededed] rounded-lg text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null)
                            setEditingContent('')
                          }}
                          className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#888] rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p 
                          className="text-xs text-[#666] cursor-help"
                          title={formatFullTimestamp(message.created_at)}
                        >
                          {formatRelativeTime(message.created_at)}
                        </p>
                        
                        {/* Message Actions (shown on hover) */}
                        {hoveredMessageId === message.id && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className="p-1 rounded hover:bg-[#2a2a2a] transition-colors"
                              title="Copy message"
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-[#888]" />
                              )}
                            </button>
                            {message.role === 'user' && (
                              <>
                                <button
                                  onClick={() => handleEditMessage(message)}
                                  className="p-1 rounded hover:bg-[#2a2a2a] transition-colors"
                                  title="Edit message"
                                >
                                  <Edit2 className="w-3 h-3 text-[#888]" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="p-1 rounded hover:bg-red-900/30 transition-colors"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3 h-3 text-red-400" />
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRegenerate(message.id)}
                              disabled={isLoading || regeneratingMessageId === message.id}
                              className="p-1 rounded-full text-[#666] hover:text-[#888] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Regenerate response"
                            >
                              <RotateCw className={`w-4 h-4 ${regeneratingMessageId === message.id ? 'animate-spin' : ''}`} />
                            </button>
                            <VoicePlayer text={message.content} />
                            <MessageReactions
                              messageId={message.id}
                              reactions={message.reactions || null}
                              onReaction={async (msgId, reaction) => {
                                // Toggle reaction with count
                                const currentReactions = messages.find(m => m.id === msgId)?.reactions || {}
                                const currentCount = (typeof currentReactions[reaction] === 'number' 
                                  ? currentReactions[reaction] 
                                  : (currentReactions[reaction] ? 1 : 0)) as number
                                
                                // If already reacted, increment count; otherwise set to 1
                                const newReactions = {
                                  ...currentReactions,
                                  [reaction]: currentCount > 0 ? currentCount + 1 : 1,
                                }
                                
                                setMessages(prev =>
                                  prev.map(m =>
                                    m.id === msgId ? { ...m, reactions: newReactions } : m
                                  )
                                )

                                // Save to database
                                try {
                                  await fetch(`/api/messages/${msgId}/reactions`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ reactions: newReactions }),
                                  })
                                } catch (error) {
                                  console.error('Error saving reaction:', error)
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#888]" />
            </div>
          </div>
        )}

        {/* Error message with retry */}
        {lastError && !isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#2e1a1a] border border-[#4a2a2a] rounded-2xl px-4 py-3 max-w-[80%]">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-400 font-medium">Error occurred</p>
              </div>
              <p className="text-xs text-[#888] mb-2">{lastError}</p>
              <button
                onClick={handleRetry}
                className="text-xs text-[#ededed] hover:text-white underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[#2a2a2a] bg-[#0a0a0a] pb-safe-area-inset-bottom"
      >
        {/* Input Mode Toggle - Mobile optimized */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputMode('type')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                inputMode === 'type'
                  ? 'bg-[#2a2a2a] text-[#ededed]'
                  : 'text-[#666] hover:text-[#888]'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span className="hidden sm:inline">Type</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('transcribe')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                inputMode === 'transcribe'
                  ? 'bg-[#2a2a2a] text-[#ededed]'
                  : 'text-[#666] hover:text-[#888]'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Transcribe</span>
            </button>
          </div>
          {/* Theme selector - Hidden on mobile, visible on desktop */}
          <button
            type="button"
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            className={`hidden md:flex p-2 rounded-lg transition-colors ${
              showThemeSelector
                ? 'bg-[#2a2a2a] text-[#ededed]'
                : 'text-[#888] hover:bg-[#1a1a1a]'
            }`}
            title="Toggle theme selector"
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>

        {/* Live transcription display */}
        {interimTranscript && (
          <div className="px-4 pb-2">
            <div className="bg-[#1a2a1a] border border-[#2a4a2a] rounded-lg px-3 py-2">
              <p className="text-sm text-[#88ff88] italic">{interimTranscript}</p>
            </div>
          </div>
        )}

        {/* Input Area */}
        {inputMode === 'transcribe' ? (
          // Transcribe Mode - Large mic button
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3">
              <VoiceInput
                onTranscript={(text) => {
                  setInput(text)
                  setInterimTranscript('')
                  // Auto-send after transcription
                  setTimeout(() => {
                    if (text.trim() && !isLoading) {
                      const form = document.querySelector('form')
                      if (form) {
                        const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
                        form.dispatchEvent(submitEvent)
                      }
                    }
                  }, 300)
                }}
                onInterimTranscript={(text) => {
                  setInterimTranscript(text)
                }}
                disabled={isLoading}
                large={true}
              />
              {input && (
                <>
                  <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 min-h-[44px] flex items-center">
                    <p className="text-[#ededed] text-sm flex-1">{input}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setInput('')
                        setInterimTranscript('')
                      }}
                      className="ml-2 p-1 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                    >
                      <X className="w-4 h-4 text-[#666]" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-xl p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          // Type Mode - Traditional textarea
          <div className="px-4 pb-4">
            <div className="flex items-end gap-2">
              <VoiceInput
                onTranscript={(text) => {
                  setInput(text)
                  inputRef.current?.focus()
                }}
                onInterimTranscript={(text) => {
                  setInterimTranscript(text)
                }}
                disabled={isLoading}
              />
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-[#ededed] placeholder-[#666] resize-none focus:outline-none focus:border-[#3a3a3a] min-h-[44px] max-h-[120px]"
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-xl p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

