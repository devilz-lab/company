import { createClient } from '@/lib/supabase/client'

/**
 * Extracts kink mentions from conversation messages
 */
export function extractKinksFromMessage(message: string): Array<{
  name: string
  category: string
  status: 'interested' | 'curious' | 'limit' | 'explored'
}> {
  const kinks: Array<{ name: string; category: string; status: 'interested' | 'curious' | 'limit' | 'explored' }> = []
  const lowerMessage = message.toLowerCase()

  // Common kink patterns
  const kinkPatterns = [
    // Interested patterns
    { pattern: /\b(i like|i love|i enjoy|i'm into|interested in|want to try)\s+([^.!?]+)/gi, status: 'interested' as const },
    { pattern: /\b(into|enjoy|love)\s+([^.!?]+)/gi, status: 'interested' as const },
    
    // Curious patterns
    { pattern: /\b(curious about|wondering about|thinking about|maybe|perhaps)\s+([^.!?]+)/gi, status: 'curious' as const },
    { pattern: /\b(what about|tell me about|explore)\s+([^.!?]+)/gi, status: 'curious' as const },
    
    // Limit patterns
    { pattern: /\b(not into|don't like|hate|dislike|limit|hard limit|not interested|not my thing)\s+([^.!?]+)/gi, status: 'limit' as const },
    { pattern: /\b(no|never|won't|can't|refuse)\s+([^.!?]+)/gi, status: 'limit' as const },
    
    // Explored patterns
    { pattern: /\b(tried|experienced|done|explored|did)\s+([^.!?]+)/gi, status: 'explored' as const },
  ]

  // Common kink categories and keywords
  const categoryKeywords: Record<string, string[]> = {
    'BDSM': ['bdsm', 'dom', 'sub', 'dominant', 'submissive', 'bondage', 'discipline', 'sadism', 'masochism', 'whip', 'rope', 'collar', 'leash'],
    'Roleplay': ['roleplay', 'role play', 'daddy', 'mommy', 'teacher', 'student', 'boss', 'secretary', 'nurse', 'doctor', 'fantasy'],
    'Sensation': ['sensation', 'wax', 'ice', 'feather', 'touch', 'sensory', 'blindfold', 'restraint'],
    'Power Exchange': ['power', 'control', 'master', 'slave', 'owner', 'pet', 'brat', 'switch'],
    'Fetish': ['fetish', 'foot', 'shoe', 'latex', 'leather', 'rubber', 'uniform', 'lingerie'],
    'Taboo': ['taboo', 'age', 'incest', 'non-con', 'forced'],
  }

  // Extract kinks from patterns
  for (const { pattern, status } of kinkPatterns) {
    const matches = [...message.matchAll(pattern)]
    for (const match of matches) {
      if (match[2]) {
        const kinkName = match[2].trim()
        // Determine category based on keywords
        let category = 'Other'
        for (const [cat, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(keyword => lowerMessage.includes(keyword))) {
            category = cat
            break
          }
        }
        
        // Clean up the kink name (remove common words)
        const cleanedName = kinkName
          .replace(/\b(the|a|an|is|are|was|were|be|been|being)\b/gi, '')
          .trim()
          .split(/[.!?,;]/)[0]
          .trim()

        if (cleanedName.length > 2 && cleanedName.length < 50) {
          kinks.push({
            name: cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1),
            category,
            status,
          })
        }
      }
    }
  }

  // Remove duplicates
  const uniqueKinks = Array.from(
    new Map(kinks.map(k => [k.name.toLowerCase(), k])).values()
  )

  return uniqueKinks
}

/**
 * Saves extracted kinks to database
 */
export async function saveExtractedKinks(
  kinks: Array<{ name: string; category: string; status: 'interested' | 'curious' | 'limit' | 'explored' }>,
  userId: string
): Promise<void> {
  if (kinks.length === 0) return

  const supabase = createClient()

  for (const kink of kinks) {
    // Check if kink exists
    const { data: existing } = await supabase
      .from('kinks')
      .select('id, status, exploration_count')
      .eq('user_id', userId)
      .eq('name', kink.name)
      .maybeSingle()

    if (existing) {
      // Update existing kink
      const updates: any = {
        category: kink.category,
      }

      // Only update status if it's more "advanced" (curious -> interested -> explored)
      if (kink.status === 'explored' || (kink.status === 'interested' && existing.status === 'curious')) {
        updates.status = kink.status
        if (kink.status === 'explored') {
          updates.exploration_count = (existing.exploration_count || 0) + 1
          updates.last_explored = new Date().toISOString()
          if (!existing.exploration_count || existing.exploration_count === 0) {
            updates.first_explored = new Date().toISOString()
          }
        }
      }

      await supabase
        .from('kinks')
        .update(updates)
        .eq('id', existing.id)
    } else {
      // Create new kink
      await supabase
        .from('kinks')
        .insert({
          user_id: userId,
          name: kink.name,
          category: kink.category,
          status: kink.status,
          exploration_count: kink.status === 'explored' ? 1 : 0,
          first_explored: kink.status === 'explored' ? new Date().toISOString() : null,
          last_explored: kink.status === 'explored' ? new Date().toISOString() : null,
        })
    }
  }
}

/**
 * Generates kink exploration prompts for the companion to ask
 */
export async function generateKinkPrompts(userId: string): Promise<string[]> {
  const supabase = createClient()

  // Get user's current kinks
  const { data: kinks } = await supabase
    .from('kinks')
    .select('name, status, category')
    .eq('user_id', userId)

  const prompts: string[] = []

  // If user has few kinks, suggest exploring
  if (!kinks || kinks.length < 5) {
    prompts.push("I'd love to learn more about what interests you. What are some things you've been curious about exploring?")
    prompts.push("Tell me about your interests - what turns you on or makes you curious?")
    prompts.push("What fantasies or kinks have you been thinking about lately?")
  }

  // If user has curious kinks, ask about them
  const curiousKinks = kinks?.filter(k => k.status === 'curious') || []
  if (curiousKinks.length > 0) {
    const randomKink = curiousKinks[Math.floor(Math.random() * curiousKinks.length)]
    prompts.push(`You mentioned being curious about ${randomKink.name}. Would you like to explore that more?`)
    prompts.push(`I remember you were curious about ${randomKink.name}. Have you thought more about it?`)
  }

  // Suggest related kinks based on existing interests
  const interestedKinks = kinks?.filter(k => k.status === 'interested' || k.status === 'explored') || []
  if (interestedKinks.length > 0) {
    const category = interestedKinks[0]?.category
    prompts.push(`Since you're into ${category}, are there other aspects of that you'd like to explore?`)
    prompts.push(`You seem interested in ${category}. What draws you to that?`)
  }

  // Ask about limits
  const limitKinks = kinks?.filter(k => k.status === 'limit') || []
  if (limitKinks.length === 0) {
    prompts.push("Are there any hard limits or things you're not interested in exploring?")
    prompts.push("What boundaries are important for you to maintain?")
  }

  // Ask about exploration
  const exploredKinks = kinks?.filter(k => k.status === 'explored') || []
  if (exploredKinks.length > 0) {
    prompts.push(`You've explored ${exploredKinks.length} thing${exploredKinks.length > 1 ? 's' : ''}. What did you enjoy most?`)
  }

  // General exploration prompts
  prompts.push("What's something new you'd like to try or learn about?")
  prompts.push("Is there a fantasy or scenario you've been wanting to explore?")
  prompts.push("Tell me about your deepest desires - what really excites you?")

  return prompts
}

