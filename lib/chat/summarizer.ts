import { chatWithOpenRouter } from '@/lib/openrouter/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Summarizes a conversation history to reduce token usage
 * Keeps the most recent messages and summarizes older ones
 */
export async function summarizeConversation(
  messages: Message[],
  keepRecent: number = 20
): Promise<Message[]> {
  if (messages.length <= keepRecent) {
    return messages // No need to summarize
  }

  // Split into recent (keep) and old (summarize)
  const recentMessages = messages.slice(-keepRecent)
  const oldMessages = messages.slice(0, -keepRecent)

  // Create summary prompt
  const summaryPrompt = `Summarize this conversation history, preserving:
- Key topics discussed
- Important preferences, boundaries, or facts mentioned
- Emotional moments or significant exchanges
- Any nicknames, terms of endearment, or communication styles established
- Relationship dynamics or patterns

Keep it concise but comprehensive. Focus on what's needed for future context.

Conversation to summarize:
${oldMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')}`

  try {
    const summaryResponse = await chatWithOpenRouter(
      [
        { role: 'system', content: 'You are a conversation summarizer. Create concise summaries that preserve important context for future conversations.' },
        { role: 'user', content: summaryPrompt }
      ],
      'mistralai/mistral-large',
      false
    )

    if (typeof summaryResponse === 'object' && 'choices' in summaryResponse) {
      const summary = summaryResponse.choices[0]?.message?.content || ''
      
      // Return summary as a system message, then recent messages
      return [
        { role: 'assistant' as const, content: `[Previous conversation summary: ${summary}]` },
        ...recentMessages
      ]
    }
  } catch (error) {
    console.error('Error summarizing conversation:', error)
    // Fallback: just keep recent messages without summary
    return recentMessages
  }

  // Fallback if summarization fails
  return recentMessages
}

