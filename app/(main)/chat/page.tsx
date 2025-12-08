'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Palette, MessageCircle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
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
  reactions?: Record<string, boolean> | null
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationMode, setConversationMode] = useState<ConversationMode>('quick')
  const [conversationTheme, setConversationTheme] = useState<Theme>('default')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: conversationId,
          mode: conversationMode,
        }),
      })

      // Update conversation ID if a new one was created
      if (!conversationId && response.ok) {
        // The API will return the conversation ID in headers or we can extract from response
        // For now, we'll reload the conversation list to get the new ID
        const convResponse = await fetch('/api/conversations?archived=false&limit=1')
        if (convResponse.ok) {
          const convData = await convResponse.json()
          const newConv = convData.conversations?.[0]
          if (newConv) {
            setConversationId(newConv.id)
            // Update URL without reload
            window.history.replaceState({}, '', `/chat?conversation=${newConv.id}`)
          }
        }
      } else if (conversationId && response.ok) {
        // Reload messages after sending to get the saved assistant message with proper ID
        // This ensures we have the correct message IDs for reactions
        setTimeout(async () => {
          try {
            const convResponse = await fetch(`/api/conversations/${conversationId}`)
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
        }, 500)
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
      console.error('Error details:', errorMessage)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage}. Please check your OpenRouter API key and try again.`,
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
      {/* Mode Selector */}
      <div className="px-4 pt-4 pb-2 border-b border-[#2a2a2a] space-y-3">
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

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 group ${
                message.role === 'user'
                  ? 'bg-[#2a2a2a] text-[#ededed]'
                  : 'bg-[#1a1a1a] text-[#ededed] border border-[#2a2a2a]'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-[#666]">
                  {formatRelativeTime(message.created_at)}
                </p>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2">
                    <VoicePlayer text={message.content} />
                    <MessageReactions
                      messageId={message.id}
                      reactions={message.reactions || null}
                      onReaction={async (msgId, reaction) => {
                        // Toggle reaction
                        const currentReactions = messages.find(m => m.id === msgId)?.reactions || {}
                        const newReactions = {
                          ...currentReactions,
                          [reaction]: !currentReactions[reaction],
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
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#888]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[#2a2a2a] bg-[#0a0a0a] p-4 safe-area-inset-bottom"
      >
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            className={`p-2 rounded-lg transition-colors ${
              showThemeSelector
                ? 'bg-[#2a2a2a] text-[#ededed]'
                : 'text-[#888] hover:bg-[#1a1a1a]'
            }`}
            title="Toggle theme selector"
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-end gap-2">
          <VoiceInput
            onTranscript={(text) => {
              setInput(text)
              inputRef.current?.focus()
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
      </form>
    </div>
  )
}

