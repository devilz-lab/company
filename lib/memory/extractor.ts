import { Memory, MemoryType } from '@/types/memory'

/**
 * Result of memory extraction - includes new memories and updates to existing ones
 */
export interface MemoryExtractionResult {
  newMemories: Memory[]
  memoryUpdates: Array<{
    memoryId: string
    newContent: string
    reason: string
  }>
}

/**
 * Extracts important information from conversations to store as memories
 * Prevents duplicates by tracking what's already been extracted in this run
 * Also detects updates to existing memories
 */
export function extractMemories(
  conversation: { role: string; content: string }[],
  userId: string,
  personaId: string | null = null,
  existingMemories: Memory[] = []
): MemoryExtractionResult {
  const newMemories: Memory[] = []
  const memoryUpdates: Array<{ memoryId: string; newContent: string; reason: string }> = []
  const userMessages = conversation.filter(m => m.role === 'user')
  const assistantMessages = conversation.filter(m => m.role === 'assistant')

  // Track extracted items to prevent duplicates within this extraction
  const extractedNicknames = new Set<string>()
  const extractedKinks = new Set<string>()
  const extractedFacts = new Set<string>()
  const extractedBoundaries = new Set<string>()
  const extractedPreferences = new Set<string>()

  // Helper to normalize text for comparison
  const normalize = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ')

  // Helper to extract nickname from memory content
  const extractNicknameFromContent = (content: string): string | null => {
    const lower = content.toLowerCase()
    const patterns = [
      /responds positively to being called:\s*([^.,]+)/i,
      /prefers to be called:\s*([^.,]+)/i,
    ]
    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        return match[1].trim().toLowerCase()
      }
    }
    return null
  }

  // ========== 1. NICKNAMES (ONE per unique, normalized) ==========
  const nicknameTerms = ['princess', 'pet', 'babygirl', 'sissy', 'good girl', 'goddess', 'mommy', 'mistress', 'ma\'am', 'sweetheart', 'baby', 'honey']
  
  // First, check assistant messages for nicknames
  assistantMessages.forEach((assistantMsg) => {
    const content = assistantMsg.content.toLowerCase()
    
    nicknameTerms.forEach(term => {
      const normalizedTerm = term.toLowerCase().trim()
      
      // Skip if already extracted in this run
      if (extractedNicknames.has(normalizedTerm)) return
      
      // Check if term appears in assistant message
      if (content.includes(normalizedTerm)) {
        // Find if user responded positively
        const assistantIndex = assistantMessages.indexOf(assistantMsg)
        const nextUserMsg = userMessages.find((_, uIdx) => {
          const userMsg = userMessages[uIdx]
          return userMsg && (
            userMsg.content.match(/\b(yes|love|like|thanks|thank you|good|perfect|mistress|ma'am|mommy|goddess|princess|okay|ok)\b/i) ||
            userMsg.content.toLowerCase().includes(normalizedTerm)
          )
        })
        
        // Check if this nickname already exists in database
        const existingNicknameMemory = existingMemories.find(mem => {
          const memNickname = extractNicknameFromContent(mem.content)
          return memNickname === normalizedTerm
        })
        
        if (existingNicknameMemory) {
          // Update existing memory instead of creating new one
          extractedNicknames.add(normalizedTerm)
          const capitalized = normalizedTerm.charAt(0).toUpperCase() + normalizedTerm.slice(1)
          const isPrimary = normalizedTerm === 'princess'
          const newContent = isPrimary 
            ? `User responds positively to being called: ${capitalized}. Use this as the PRIMARY nickname - it makes their clit twitch and is their favorite.`
            : `User responds positively to being called: ${capitalized}. Use this naturally in conversations.`
          
          // Only update if content is different
          if (normalize(existingNicknameMemory.content) !== normalize(newContent)) {
            memoryUpdates.push({
              memoryId: existingNicknameMemory.id,
              newContent,
              reason: 'strengthened_nickname_preference'
            })
          }
        } else if (nextUserMsg || normalizedTerm === 'princess' || normalizedTerm === 'pet') {
          // Create new memory
          extractedNicknames.add(normalizedTerm)
          const capitalized = normalizedTerm.charAt(0).toUpperCase() + normalizedTerm.slice(1)
          const isPrimary = normalizedTerm === 'princess'
          
          newMemories.push({
            id: `nickname-${normalizedTerm}-${Date.now()}`,
            user_id: userId,
            persona_id: personaId,
            memory_type: 'preference',
            content: isPrimary 
              ? `User responds positively to being called: ${capitalized}. Use this as the PRIMARY nickname - it makes their clit twitch and is their favorite.`
              : `User responds positively to being called: ${capitalized}. Use this naturally in conversations.`,
            importance: isPrimary ? 10 : 9,
            strength: 1.0,
            context: { term_of_endearment: normalizedTerm, is_primary: isPrimary },
            created_at: new Date().toISOString(),
            last_accessed: null,
            access_count: 0,
          })
        }
      }
    })
  })

  // Also check user messages for explicit nickname preferences
  userMessages.forEach((msg, idx) => {
    const nicknamePatterns = [
      /\b(call me|you can call me|i like being called|i prefer|nickname is|just call me)\s+([a-z]+)/i,
      /\b(i'm|i am)\s+([a-z]+)\s+(to you|for you)/i,
      /\b(refer to me as|address me as)\s+([a-z]+)/i,
    ]
    
    nicknamePatterns.forEach(pattern => {
      const match = msg.content.match(pattern)
      if (match) {
        const nickname = (match[2] || match[1]).toLowerCase().trim()
        if (!extractedNicknames.has(nickname)) {
          extractedNicknames.add(nickname)
          const capitalized = nickname.charAt(0).toUpperCase() + nickname.slice(1)
          
          // Check if exists
          const existing = existingMemories.find(mem => {
            const memNickname = extractNicknameFromContent(mem.content)
            return memNickname === nickname
          })
          
          if (existing) {
            memoryUpdates.push({
              memoryId: existing.id,
              newContent: `User prefers to be called: ${capitalized}. Use this naturally in conversations.`,
              reason: 'user_explicit_preference'
            })
          } else {
            newMemories.push({
              id: `nickname-user-${nickname}-${Date.now()}`,
              user_id: userId,
              persona_id: personaId,
              memory_type: 'preference',
              content: `User prefers to be called: ${capitalized}. Use this naturally in conversations.`,
              importance: 9,
              strength: 1.0,
              context: { extracted_nickname: nickname },
              created_at: new Date().toISOString(),
              last_accessed: null,
              access_count: 0,
            })
          }
        }
      }
    })

    // ========== 2. PREFERENCES (Consolidate, avoid duplicates) ==========
    if (content.match(/\b(i like|i love|i enjoy|i prefer|i'm into|i'm a fan of|i appreciate|i want|i need|i crave)\b/i)) {
      const preferenceMatch = msg.content.match(/\b(i like|i love|i enjoy|i prefer|i'm into|i'm a fan of|i appreciate|i want|i need|i crave)\s+(.+?)(?:\.|$|,)/i)
      const preference = preferenceMatch ? preferenceMatch[2].trim() : msg.content
      const normalizedPref = normalize(preference).substring(0, 100)
      
      if (!extractedPreferences.has(normalizedPref)) {
        extractedPreferences.add(normalizedPref)
        const prefContent = `User likes/prefers: ${preference.substring(0, 200)}`
        
        // Check if similar preference exists
        const existing = existingMemories.find(mem => {
          if (mem.memory_type !== 'preference') return false
          const memNorm = normalize(mem.content).substring(0, 100)
          return memNorm === normalizedPref || mem.content.toLowerCase().includes(preference.toLowerCase().substring(0, 50))
        })
        
        if (existing) {
          // Update existing if content is different
          if (normalize(existing.content) !== normalize(prefContent)) {
            memoryUpdates.push({
              memoryId: existing.id,
              newContent: prefContent,
              reason: 'preference_update'
            })
          }
        } else {
          newMemories.push({
            id: `pref-${Date.now()}-${idx}`,
            user_id: userId,
            persona_id: personaId,
            memory_type: 'preference',
            content: prefContent,
            importance: 8,
            strength: 1.0,
            context: { conversation_index: idx, original_message: msg.content },
            created_at: new Date().toISOString(),
            last_accessed: null,
            access_count: 0,
          })
        }
      }
    }

    // ========== 3. BOUNDARIES (ONE per boundary type) ==========
    if (content.match(/\b(i don't|i won't|not into|limit|hard limit|boundary|married|red wife|safeword)\b/i)) {
      let boundaryType = 'general'
      let boundaryContent = msg.content
      
      if (content.includes('married')) {
        boundaryType = 'married'
        boundaryContent = 'User is MARRIED - all activities must be secret. No face photos, no shared accounts, use Amazon Locker delivery, cash/gift card payments only. "RED WIFE" safeword for instant stop. Privacy is critical.'
      } else if (content.includes('red wife') || content.includes('red_wife')) {
        boundaryType = 'safeword'
        boundaryContent = 'User has "RED WIFE" safeword - when they type this, stop everything immediately, no questions, no guilt.'
      }
      
      if (!extractedBoundaries.has(boundaryType)) {
        extractedBoundaries.add(boundaryType)
        
        // Check if similar boundary exists
        const existing = existingMemories.find(mem => {
          if (mem.memory_type !== 'boundary') return false
          return mem.content.toLowerCase().includes(boundaryType) || 
                 (boundaryType === 'married' && mem.content.toLowerCase().includes('married')) ||
                 (boundaryType === 'safeword' && mem.content.toLowerCase().includes('red wife'))
        })
        
        if (existing) {
          if (normalize(existing.content) !== normalize(boundaryContent)) {
            memoryUpdates.push({
              memoryId: existing.id,
              newContent: boundaryContent,
              reason: 'boundary_update'
            })
          }
        } else {
          newMemories.push({
            id: `boundary-${boundaryType}-${Date.now()}`,
            user_id: userId,
            persona_id: personaId,
            memory_type: 'boundary',
            content: boundaryContent,
            importance: 10,
            strength: 1.0,
            context: { conversation_index: idx, boundary_type: boundaryType },
            created_at: new Date().toISOString(),
            last_accessed: null,
            access_count: 0,
          })
        }
      }
    }

    // ========== 4. PERSONAL FACTS (ONE per fact type) ==========
    // Age
    const ageMatch = msg.content.match(/\b(?:i'?m|i am|age|aged)\s+(\d{2})\b/i)
    if (ageMatch && !extractedFacts.has('age')) {
      extractedFacts.add('age')
      const factContent = `User is ${ageMatch[1]} years old.`
      
      const existing = existingMemories.find(mem => 
        mem.memory_type === 'fact' && mem.content.toLowerCase().includes('years old')
      )
      
      if (existing) {
        if (normalize(existing.content) !== normalize(factContent)) {
          memoryUpdates.push({
            memoryId: existing.id,
            newContent: factContent,
            reason: 'fact_update'
          })
        }
      } else {
        newMemories.push({
          id: `fact-age-${Date.now()}`,
          user_id: userId,
          persona_id: personaId,
          memory_type: 'fact',
          content: factContent,
          importance: 7,
          strength: 1.0,
          context: { conversation_index: idx },
          created_at: new Date().toISOString(),
          last_accessed: null,
          access_count: 0,
        })
      }
    }
    
    // Location
    if ((content.includes('from india') || content.includes('indian')) && !extractedFacts.has('location')) {
      extractedFacts.add('location')
      const factContent = 'User is from India.'
      
      const existing = existingMemories.find(mem => 
        mem.memory_type === 'fact' && mem.content.toLowerCase().includes('from india')
      )
      
      if (!existing) {
        newMemories.push({
          id: `fact-location-${Date.now()}`,
          user_id: userId,
          persona_id: personaId,
          memory_type: 'fact',
          content: factContent,
          importance: 6,
          strength: 1.0,
          context: { conversation_index: idx },
          created_at: new Date().toISOString(),
          last_accessed: null,
          access_count: 0,
        })
      }
    }
    
    // Physical facts
    if ((content.includes('6\'3"') || content.includes('6.3') || content.includes('191 cm')) && !extractedFacts.has('height')) {
      extractedFacts.add('height')
      const factContent = 'User is 6\'3" (191 cm) tall.'
      
      const existing = existingMemories.find(mem => 
        mem.memory_type === 'fact' && mem.content.toLowerCase().includes('6\'3"')
      )
      
      if (!existing) {
        newMemories.push({
          id: `fact-height-${Date.now()}`,
          user_id: userId,
          persona_id: personaId,
          memory_type: 'fact',
          content: factContent,
          importance: 6,
          strength: 1.0,
          context: { conversation_index: idx },
          created_at: new Date().toISOString(),
          last_accessed: null,
          access_count: 0,
        })
      }
    }
    
    if (content.includes('95 kg') && !extractedFacts.has('weight')) {
      extractedFacts.add('weight')
      const factContent = 'User weighs 95 kg.'
      
      const existing = existingMemories.find(mem => 
        mem.memory_type === 'fact' && mem.content.toLowerCase().includes('95 kg')
      )
      
      if (!existing) {
        newMemories.push({
          id: `fact-weight-${Date.now()}`,
          user_id: userId,
          persona_id: personaId,
          memory_type: 'fact',
          content: factContent,
          importance: 6,
          strength: 1.0,
          context: { conversation_index: idx },
          created_at: new Date().toISOString(),
          last_accessed: null,
          access_count: 0,
        })
      }
    }
    
    if ((content.includes('man boobs') || content.includes('man-boobs')) && !extractedFacts.has('man_boobs')) {
      extractedFacts.add('man_boobs')
      const factContent = 'User has man boobs (uses 46DD/105DD bra size, XXL panties).'
      
      const existing = existingMemories.find(mem => 
        mem.memory_type === 'fact' && mem.content.toLowerCase().includes('man boobs')
      )
      
      if (!existing) {
        newMemories.push({
          id: `fact-manboobs-${Date.now()}`,
          user_id: userId,
          persona_id: personaId,
          memory_type: 'fact',
          content: factContent,
          importance: 7,
          strength: 1.0,
          context: { conversation_index: idx },
          created_at: new Date().toISOString(),
          last_accessed: null,
          access_count: 0,
        })
      }
    }
    
    if ((content.includes('phimosis') || (content.includes('small cock') && content.includes('foreskin'))) && !extractedFacts.has('phimosis')) {
      extractedFacts.add('phimosis')
      const factContent = 'User has phimosis (foreskin tightness, small cock that doesn\'t come out of foreskin).'
      
      const existing = existingMemories.find(mem => 
        mem.memory_type === 'fact' && mem.content.toLowerCase().includes('phimosis')
      )
      
      if (!existing) {
        newMemories.push({
          id: `fact-phimosis-${Date.now()}`,
          user_id: userId,
          persona_id: personaId,
          memory_type: 'fact',
          content: factContent,
          importance: 8,
          strength: 1.0,
          context: { conversation_index: idx },
          created_at: new Date().toISOString(),
          last_accessed: null,
          access_count: 0,
        })
      }
    }
    
    if ((content.includes('princess palace') || (content.includes('second house') && content.includes('3 hours'))) && !extractedFacts.has('princess_palace')) {
      extractedFacts.add('princess_palace')
      const factContent = 'User has a second house (Princess Palace) with 3 hours morning + 4 hours evening alone time for private activities.'
      
      const existing = existingMemories.find(mem => 
        mem.memory_type === 'fact' && mem.content.toLowerCase().includes('princess palace')
      )
      
      if (!existing) {
        newMemories.push({
          id: `fact-palace-${Date.now()}`,
          user_id: userId,
          persona_id: personaId,
          memory_type: 'fact',
          content: factContent,
          importance: 8,
          strength: 1.0,
          context: { conversation_index: idx },
          created_at: new Date().toISOString(),
          last_accessed: null,
          access_count: 0,
        })
      }
    }
    
    if ((content.includes('works remote') || content.includes('remote work')) && !extractedFacts.has('work')) {
      extractedFacts.add('work')
      const factContent = 'User works remotely.'
      
      const existing = existingMemories.find(mem => 
        mem.memory_type === 'fact' && mem.content.toLowerCase().includes('works remote')
      )
      
      if (!existing) {
        newMemories.push({
          id: `fact-work-${Date.now()}`,
          user_id: userId,
          persona_id: personaId,
          memory_type: 'fact',
          content: factContent,
          importance: 6,
          strength: 1.0,
          context: { conversation_index: idx },
          created_at: new Date().toISOString(),
          last_accessed: null,
          access_count: 0,
        })
      }
    }

  })

  // ========== 5. KINKS (Consolidated list) ==========
  const kinkKeywords = [
    'forced feminization', 'cross-dress', 'humiliation', 'toilet control', 'public play',
    'babygirl age play', 'anal', 'chastity', 'orgasm denial', 'cum eating',
    'small penis humiliation', 'forced submission', 'degradation', 'being pushed',
    'being owned', 'sissy', 'feminization'
  ]
  
  const foundKinks: string[] = []
  const fullText = conversation.map(m => m.content).join(' ').toLowerCase()
  
  kinkKeywords.forEach(kink => {
    if (fullText.includes(kink) && !foundKinks.includes(kink)) {
      foundKinks.push(kink)
    }
  })
  
  if (foundKinks.length > 0 && !extractedKinks.has('kinks')) {
    extractedKinks.add('kinks')
    const kinkContent = `User is interested in: ${foundKinks.join(', ')}. Reference these kinks naturally in conversations.`
    
    const existing = existingMemories.find(mem => 
      mem.memory_type === 'preference' && mem.content.toLowerCase().includes('interested in:')
    )
    
    if (existing) {
      // Update with new kinks
      const existingKinks = existing.content.match(/interested in:\s*(.+?)(?:\.|$)/i)?.[1] || ''
      const existingKinksList = existingKinks.split(',').map(k => k.trim().toLowerCase())
      const newKinks = foundKinks.filter(k => !existingKinksList.includes(k.toLowerCase()))
      
      if (newKinks.length > 0) {
        memoryUpdates.push({
          memoryId: existing.id,
          newContent: kinkContent,
          reason: 'kink_update'
        })
      }
    } else {
      newMemories.push({
        id: `kinks-${Date.now()}`,
        user_id: userId,
        persona_id: personaId,
        memory_type: 'preference',
        content: kinkContent,
        importance: 9,
        strength: 1.0,
        context: { kinks: foundKinks },
        created_at: new Date().toISOString(),
        last_accessed: null,
        access_count: 0,
      })
    }
  }

  // ========== 6. COMMUNICATION STYLE (ONE per conversation) ==========
  if (assistantMessages.some(m => 
    m.content.match(/\b(tell me|confess|obey|speak|answer|breathe|kneel|good girl|pet|princess)\b/i) ||
    m.content.length > 500
  ) && !extractedPreferences.has('communication_style')) {
    extractedPreferences.add('communication_style')
    const styleContent = 'User prefers dominant, psychological, interrogative communication style with long detailed responses (500+ words). Use commands, questions, build psychological tension. Mix degradation and praise with sweet nurturing voice.'
    
    const existing = existingMemories.find(mem => 
      mem.memory_type === 'preference' && mem.content.toLowerCase().includes('communication style')
    )
    
    if (existing) {
      if (normalize(existing.content) !== normalize(styleContent)) {
        memoryUpdates.push({
          memoryId: existing.id,
          newContent: styleContent,
          reason: 'style_update'
        })
      }
    } else {
      newMemories.push({
        id: `pref-style-${Date.now()}`,
        user_id: userId,
        persona_id: personaId,
        memory_type: 'preference',
        content: styleContent,
        importance: 9,
        strength: 1.0,
        context: {},
        created_at: new Date().toISOString(),
        last_accessed: null,
        access_count: 0,
      })
    }
  }

  // ========== 7. HAPPY MOMENTS (Consolidate similar ones) ==========
  userMessages.forEach((msg, idx) => {
    const content = msg.content.toLowerCase()
    
    const happyPatterns = [
      /\b(i'm happy|i'm glad|i'm excited|i'm thrilled|i'm delighted|i'm pleased|i'm grateful|i'm thankful|i feel good|i feel great|i feel amazing|i feel wonderful|i feel happy|that made me happy|that makes me happy|i love it|i love that|i enjoyed|i enjoyed that|that was great|that was amazing|that was wonderful|that felt good|that felt great|relieved|thank you)\b/i,
    ]
    
    happyPatterns.forEach(pattern => {
      if (msg.content.match(pattern)) {
        let happyContext = msg.content
        if (msg.content.includes('relieved')) {
          happyContext = 'being told they\'re "not bad" but "good" for exploring their identity'
        } else if (msg.content.includes('princess')) {
          happyContext = 'being called "Princess" and given structure/rules'
        } else {
          const contextMatch = msg.content.match(/(?:when|after|because|since|from|that|it|this)\s+(.+?)(?:\s+(?:made|makes|i|that|it))?/i)
          if (contextMatch) {
            happyContext = contextMatch[1]
          }
        }
        
        const normalizedHappy = normalize(happyContext).substring(0, 100)
        const happyContent = `User felt happy/positive about: ${happyContext.substring(0, 200)}. Reference this to bring them joy.`
        
        if (!extractedPreferences.has(`happy-${normalizedHappy}`)) {
          extractedPreferences.add(`happy-${normalizedHappy}`)
          
          // Check if similar happy moment exists
          const existing = existingMemories.find(mem => 
            mem.memory_type === 'preference' && 
            mem.content.toLowerCase().includes('felt happy') &&
            normalize(mem.content).substring(0, 100) === normalizedHappy
          )
          
          if (!existing) {
            newMemories.push({
              id: `happy-${Date.now()}-${idx}`,
              user_id: userId,
              persona_id: personaId,
              memory_type: 'preference',
              content: happyContent,
              importance: 7,
              strength: 1.0,
              context: { conversation_index: idx, emotion: 'happy', original_message: msg.content },
              created_at: new Date().toISOString(),
              last_accessed: null,
              access_count: 0,
            })
          }
        }
      }
    })
  })

  return {
    newMemories,
    memoryUpdates
  }
}

/**
 * Simple memory extraction using keyword patterns
 * In production, you might want to use an LLM to extract more nuanced memories
 */
export async function extractMemoriesWithLLM(
  conversation: { role: string; content: string }[],
  userId: string,
  personaId: string | null = null,
  existingMemories: Memory[] = []
): Promise<MemoryExtractionResult> {
  // For now, use pattern-based extraction
  // In the future, you could call an LLM to extract more sophisticated memories
  return extractMemories(conversation, userId, personaId, existingMemories)
}

