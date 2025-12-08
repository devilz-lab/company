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

    // Nickname patterns - capture what the user likes to be called
    const nicknamePatterns = [
      /\b(call me|you can call me|i like being called|i prefer|nickname is|just call me)\s+([a-z]+)/i,
      /\b(i'm|i am)\s+([a-z]+)\s+(to you|for you)/i,
      /\b(refer to me as|address me as)\s+([a-z]+)/i,
    ]
    
    nicknamePatterns.forEach(pattern => {
      const match = msg.content.match(pattern)
      if (match) {
        const nickname = match[2] || match[1]
        memories.push({
          id: `nickname-${Date.now()}-${idx}`,
          user_id: userId,
          persona_id: personaId,
          memory_type: 'preference',
          content: `User prefers to be called: ${nickname}. Use this naturally in conversations.`,
          importance: 9, // Very important - personal identity
          strength: 1.0,
          context: { conversation_index: idx, extracted_nickname: nickname },
          created_at: new Date().toISOString(),
          last_accessed: null,
          access_count: 0,
        })
      }
    })

    // Preference patterns - what user likes/enjoys
    if (content.match(/\b(i like|i love|i enjoy|i prefer|i'm into|i'm a fan of|i appreciate)\b/i)) {
      // Extract the actual preference
      const preferenceMatch = msg.content.match(/\b(i like|i love|i enjoy|i prefer|i'm into|i'm a fan of|i appreciate)\s+(.+?)(?:\.|$|,)/i)
      const preference = preferenceMatch ? preferenceMatch[2].trim() : msg.content
      
      memories.push({
        id: `pref-${Date.now()}-${idx}`,
        user_id: userId,
        persona_id: personaId,
        memory_type: 'preference',
        content: `User likes/prefers: ${preference}`,
        importance: 8,
        strength: 1.0,
        context: { conversation_index: idx, original_message: msg.content },
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
    if (content.match(/\b(my name is|i'm|i am|i work|i live|i'm from)\b/i)) {
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

    // Relationship patterns - how companion addresses user
    // Extract from assistant messages what terms they use that user responds to
    assistantMessages.forEach((assistantMsg, aIdx) => {
      const assContent = assistantMsg.content.toLowerCase()
      
      // Extract terms of endearment/nicknames the companion uses
      const endearmentPatterns = [
        /\b(princess|pet|babygirl|sissy|sweetheart|baby|honey|darling|love|dear|babe|sugar|good girl|my little|my sweet)\b/gi,
      ]
      
      endearmentPatterns.forEach(pattern => {
        const matches = assistantMsg.content.matchAll(pattern)
        for (const match of matches) {
          const term = match[1] || match[0]
          // Check if user responded positively to this message
          const nextUserMsg = userMessages.find((_, uIdx) => uIdx > idx)
          const respondedPositively = nextUserMsg?.content.match(/\b(yes|love|like|thanks|thank you|good|perfect|mistress|ma'am|mommy|goddess)\b/i)
          
          if (respondedPositively || term.toLowerCase().includes('princess') || term.toLowerCase().includes('pet')) {
            memories.push({
              id: `endearment-${Date.now()}-${idx}-${aIdx}-${term}`,
              user_id: userId,
              persona_id: personaId,
              memory_type: 'preference',
              content: `User responds positively to being called: ${term}. Use this naturally in conversations.`,
              importance: 9, // Nicknames are very important
              strength: 1.0,
              context: { conversation_index: idx, term_of_endearment: term },
              created_at: new Date().toISOString(),
              last_accessed: null,
              access_count: 0,
            })
          }
        }
      })
    })

    // Extract communication style preferences from assistant messages
    // Look for dominant, psychological, interrogative patterns
    if (assistantMessages.some(m => 
      m.content.match(/\b(tell me|confess|obey|speak|answer|breathe|kneel|good girl|pet|princess)\b/i) ||
      m.content.length > 500 // Long, detailed responses
    )) {
      memories.push({
        id: `style-${Date.now()}`,
        user_id: userId,
        persona_id: personaId,
        memory_type: 'preference',
        content: 'User prefers dominant, psychological, interrogative communication style with detailed responses. Use commands, questions, and build psychological tension.',
        importance: 8,
        strength: 1.0,
        context: {},
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

  // Extract positive emotions and happy moments
  userMessages.forEach((msg, idx) => {
    const content = msg.content.toLowerCase()
    
    // Happy/positive emotion patterns
    const happyPatterns = [
      /\b(i'm happy|i'm glad|i'm excited|i'm thrilled|i'm delighted|i'm pleased|i'm grateful|i'm thankful|i feel good|i feel great|i feel amazing|i feel wonderful|i feel happy|that made me happy|that makes me happy|i love it|i love that|i enjoyed|i enjoyed that|that was great|that was amazing|that was wonderful|that felt good|that felt great)\b/i,
      /\b(happy|glad|excited|thrilled|delighted|pleased|grateful|thankful|joy|joyful|bliss|blissful|content|contented|satisfied|fulfilled)\b/i,
    ]
    
    happyPatterns.forEach(pattern => {
      if (msg.content.match(pattern)) {
        // Extract what made them happy
        const happyMatch = msg.content.match(/(?:that|it|this|which|what)(?:\s+(?:made|makes|made me|makes me))?\s+(?:me\s+)?(?:feel\s+)?(?:happy|good|great|amazing|wonderful|excited|thrilled|glad|delighted|pleased|grateful|thankful)/i)
        const contextMatch = msg.content.match(/(?:when|after|because|since|from)\s+(.+?)(?:\s+(?:made|makes|i|that|it))?/i)
        
        let happyContext = msg.content
        if (contextMatch) {
          happyContext = contextMatch[1]
        } else if (happyMatch) {
          // Try to get the sentence before the happy expression
          const sentences = msg.content.split(/[.!?]/)
          const happySentence = sentences.find(s => s.match(pattern))
          if (happySentence) {
            happyContext = happySentence.trim()
          }
        }
        
        memories.push({
          id: `happy-${Date.now()}-${idx}`,
          user_id: userId,
          persona_id: personaId,
          memory_type: 'preference',
          content: `User felt happy/positive about: ${happyContext.substring(0, 200)}. Reference this to bring them joy.`,
          importance: 7,
          strength: 1.0,
          context: { conversation_index: idx, emotion: 'happy', original_message: msg.content },
          created_at: new Date().toISOString(),
          last_accessed: null,
          access_count: 0,
        })
      }
    })
  })

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

