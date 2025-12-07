import { Memory, MemoryType } from '@/types/memory'

/**
 * Extracts important information from conversations to store as memories
 */
export function extractMemories(
  conversation: { role: string; content: string }[],
  userId: string,
  personaId: string | null = null
): Memory[] {
  const memories: Memory[] = []
  const userMessages = conversation.filter(m => m.role === 'user')
  const assistantMessages = conversation.filter(m => m.role === 'assistant')

  // Extract preferences mentioned by user
  userMessages.forEach((msg, idx) => {
    const content = msg.content.toLowerCase()

    // Preference patterns
    if (content.match(/\b(i like|i love|i enjoy|i prefer|i'm into)\b/i)) {
      memories.push({
        id: `pref-${Date.now()}-${idx}`,
        user_id: userId,
        persona_id: personaId,
        memory_type: 'preference',
        content: msg.content,
        importance: 7,
        strength: 1.0,
        context: { conversation_index: idx },
        created_at: new Date().toISOString(),
        last_accessed: null,
        access_count: 0,
      })
    }

    // Boundary patterns
    if (content.match(/\b(i don't|i won't|not into|limit|hard limit|boundary)\b/i)) {
      memories.push({
        id: `boundary-${Date.now()}-${idx}`,
        user_id: userId,
        persona_id: personaId,
        memory_type: 'boundary',
        content: msg.content,
        importance: 10, // Boundaries are very important
        strength: 1.0,
        context: { conversation_index: idx },
        created_at: new Date().toISOString(),
        last_accessed: null,
        access_count: 0,
      })
    }

    // Personal facts
    if (content.match(/\b(my name is|i'm|i am|i work|i live)\b/i)) {
      memories.push({
        id: `fact-${Date.now()}-${idx}`,
        user_id: userId,
        persona_id: personaId,
        memory_type: 'fact',
        content: msg.content,
        importance: 8,
        strength: 1.0,
        context: { conversation_index: idx },
        created_at: new Date().toISOString(),
        last_accessed: null,
        access_count: 0,
      })
    }
  })

  // Extract jokes or playful moments
  if (conversation.some(m => m.content.match(/\b(lol|haha|funny|joke)\b/i))) {
    memories.push({
      id: `joke-${Date.now()}`,
      user_id: userId,
      persona_id: personaId,
      memory_type: 'joke',
      content: conversation.find(m => m.content.match(/\b(lol|haha|funny|joke)\b/i))?.content || '',
      importance: 5,
      strength: 1.0,
      context: {},
      created_at: new Date().toISOString(),
      last_accessed: null,
      access_count: 0,
    })
  }

  return memories
}

/**
 * Simple memory extraction using keyword patterns
 * In production, you might want to use an LLM to extract more nuanced memories
 */
export async function extractMemoriesWithLLM(
  conversation: { role: string; content: string }[],
  userId: string,
  personaId: string | null = null
): Promise<Memory[]> {
  // For now, use pattern-based extraction
  // In the future, you could call an LLM to extract more sophisticated memories
  return extractMemories(conversation, userId, personaId)
}

