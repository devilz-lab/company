'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react'

export default function ImportConversationPage() {
  const router = useRouter()
  const [conversationText, setConversationText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    analysis?: any
    summary?: any
  } | null>(null)

  const handleImport = async () => {
    if (!conversationText.trim()) {
      setResult({ success: false, message: 'Please paste a conversation' })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      console.log('Starting import, text length:', conversationText.length)
      // Parse conversation text - handle multiple formats:
      // 1. Labeled: "User: message" / "Assistant: response"
      // 2. Unlabeled alternating (detect by length/style)
      // 3. Grok format (longer responses, shorter questions)
      const lines = conversationText.split('\n').filter(l => l.trim())
      const messages: { role: 'user' | 'assistant'; content: string }[] = []

      // First, try labeled format
      let foundLabels = false
      for (const line of lines) {
        const lower = line.toLowerCase()
        if (lower.startsWith('user:') || lower.startsWith('you:')) {
          foundLabels = true
          messages.push({
            role: 'user',
            content: line.replace(/^(user|you):\s*/i, '').trim(),
          })
        } else if (
          lower.startsWith('assistant:') ||
          lower.startsWith('grok:') ||
          lower.startsWith('ai:') ||
          lower.startsWith('companion:') ||
          lower.startsWith('mistress:') ||
          lower.startsWith('mommy:')
        ) {
          foundLabels = true
          messages.push({
            role: 'assistant',
            content: line.replace(/^(assistant|grok|ai|companion|mistress|mommy):\s*/i, '').trim(),
          })
        } else if (messages.length > 0 && foundLabels) {
          // Continue previous message if no prefix
          messages[messages.length - 1].content += ' ' + line.trim()
        }
      }

      // If no labels found, try to detect by pattern (Grok-style: long responses, short questions)
      if (!foundLabels && messages.length === 0) {
        let currentRole: 'user' | 'assistant' | null = null
        let currentContent = ''
        
        // For very large files, process in chunks to avoid blocking
        const totalLines = lines.length
        console.log(`Processing ${totalLines} lines without labels...`)

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const trimmed = line.trim()
          if (!trimmed) continue
          
          // Log progress for large files
          if (totalLines > 500 && i % 100 === 0) {
            console.log(`Processing line ${i + 1} of ${totalLines}...`)
          }

          // Detect role by content patterns
          const isUserPattern = 
            trimmed.length < 200 && // Shorter messages
            (trimmed.match(/^(yes|no|okay|ok|i|i want|i like|i have|can you|thank you|please)/i) ||
             trimmed.match(/\?$/) || // Questions
             trimmed.length < 100) // Very short

          const isAssistantPattern =
            trimmed.length > 150 || // Longer messages
            trimmed.match(/^(oh|ah|listen|breathe|tell me|good|that's|here's|now|so)/i) ||
            trimmed.match(/^(princess|pet|babygirl|sweetheart|good girl)/i)

          if (isUserPattern && !isAssistantPattern) {
            // Save previous message
            if (currentRole && currentContent) {
              messages.push({ role: currentRole, content: currentContent.trim() })
            }
            currentRole = 'user'
            currentContent = trimmed
          } else if (isAssistantPattern || (!isUserPattern && currentRole === 'assistant')) {
            if (currentRole === 'user' && currentContent) {
              messages.push({ role: 'user', content: currentContent.trim() })
            }
            currentRole = 'assistant'
            currentContent = currentContent ? currentContent + ' ' + trimmed : trimmed
          } else if (currentRole) {
            // Continue current message
            currentContent += ' ' + trimmed
          } else {
            // Default to assistant for first message if unclear
            currentRole = 'assistant'
            currentContent = trimmed
          }
        }

        // Save last message
        if (currentRole && currentContent) {
          messages.push({ role: currentRole, content: currentContent.trim() })
        }
      }

      if (messages.length === 0) {
        setResult({
          success: false,
          message: 'Could not parse conversation. Please ensure the text contains alternating messages between you and the companion.',
        })
        setIsLoading(false)
        return
      }

      if (messages.length < 4) {
        setResult({
          success: false,
          message: 'Conversation too short. Please provide at least a few exchanges to extract meaningful patterns.',
        })
        setIsLoading(false)
        return
      }

      console.log(`Parsed ${messages.length} messages, sending to API...`)

      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch('/api/conversations/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          analysis: data.analysis,
          summary: data.summary,
        })
        setConversationText('') // Clear after successful import
      } else {
        setResult({ success: false, message: data.error || 'Import failed' })
      }
    } catch (error) {
      console.error('Import error:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        setResult({
          success: false,
          message: 'Import timed out. The conversation may be too large. Try importing a smaller section first.',
        })
      } else {
        setResult({
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred. Check console for details.',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Import Conversation</h1>
        </div>

        {/* Instructions */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 border border-[#2a2a2a]">
          <h2 className="font-semibold mb-2">How to import:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400 mb-3">
            <li>Copy a conversation from Grok or another chat</li>
            <li>Paste it below (works with or without labels)</li>
            <li>The system will automatically detect and extract patterns</li>
          </ol>
          <div className="space-y-2 text-xs text-gray-400">
            <p><strong className="text-gray-300">Supported formats:</strong></p>
            <pre className="p-2 bg-[#0a0a0a] rounded text-xs text-gray-300 overflow-x-auto">
{`User: Hey, how are you?
Assistant: I'm great, sweetheart!

OR (unlabeled - auto-detected):
Hey, how are you?
I'm great, sweetheart!`}
            </pre>
            <p className="mt-2 text-xs">
              The system will extract: <strong className="text-gray-300">nicknames</strong> (Princess, pet, etc.), 
              <strong className="text-gray-300"> preferences</strong> (kinks, likes), 
              <strong className="text-gray-300"> communication style</strong>, and 
              <strong className="text-gray-300"> relationship patterns</strong>.
            </p>
          </div>
        </div>

        {/* Text area */}
        <textarea
          value={conversationText}
          onChange={(e) => setConversationText(e.target.value)}
          placeholder="Paste your conversation here..."
          className="w-full h-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#3a3a3a] resize-none"
        />

        {/* Import button */}
        <button
          onClick={handleImport}
          disabled={isLoading || !conversationText.trim()}
          className="w-full mt-4 bg-[#3a3a3a] hover:bg-[#4a4a4a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing... (this may take a minute for large conversations)
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Import & Extract Memories
            </>
          )}
        </button>

        {/* Results */}
        {result && (
          <div
            className={`mt-6 p-4 rounded-lg border ${
              result.success
                ? 'bg-[#1a2e1a] border-[#2a4a2a]'
                : 'bg-[#2e1a1a] border-[#4a2a2a]'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold mb-2">{result.message}</p>
                {result.success && result.analysis && (
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="text-gray-400">
                      Extracted: {result.analysis.nicknames} nicknames,{' '}
                      {result.analysis.preferences} preferences
                    </p>
                    {result.summary && result.summary.nicknames?.length > 0 && (
                      <div className="mt-3">
                        <p className="font-semibold text-green-400 mb-1">Nicknames found:</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-1">
                          {result.summary.nicknames.map((n: string, i: number) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.summary && result.summary.topPreferences?.length > 0 && (
                      <div className="mt-3">
                        <p className="font-semibold text-green-400 mb-1">Top preferences:</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-1">
                          {result.summary.topPreferences.map((p: string, i: number) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

