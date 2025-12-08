import { createClient } from '@/lib/supabase/server'
import { Memory } from '@/types/memory'

/**
 * Updates or verifies memories based on conversation
 */
export async function updateMemoryFromConversation(
  memoryId: string,
  newContent: string,
  userId: string
): Promise<void> {
  const supabase = await createClient()
  
  // Get current access count first
  const { data: current } = await supabase
    .from('memories')
    .select('access_count')
    .eq('id', memoryId)
    .eq('user_id', userId)
    .single()
  
  await supabase
    .from('memories')
    .update({
      content: newContent,
      last_accessed: new Date().toISOString(),
      access_count: (current?.access_count || 0) + 1,
      strength: 1.0, // Reset strength when updated
    })
    .eq('id', memoryId)
    .eq('user_id', userId)
}

/**
 * Marks a memory as potentially outdated
 */
export async function markMemoryForVerification(
  memoryId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from('memories')
    .update({
      strength: 0.5, // Reduce strength to indicate it needs verification
      last_accessed: new Date().toISOString(),
    })
    .eq('id', memoryId)
    .eq('user_id', userId)
}

/**
 * Gets memories that might need verification (old or rarely accessed)
 */
export async function getMemoriesNeedingVerification(
  userId: string,
  personaId: string | null = null,
  limit: number = 5
): Promise<Memory[]> {
  const supabase = await createClient()
  
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .or(`persona_id.is.null,persona_id.eq.${personaId}`)
    .or(`last_accessed.is.null,last_accessed.lt.${thirtyDaysAgo.toISOString()}`)
    .order('last_accessed', { ascending: true, nullsFirst: true })
    .limit(limit)
  
  return (data as Memory[]) || []
}

/**
 * Analyzes conversation to detect if memories need updating
 */
export function detectMemoryUpdates(
  conversation: { role: string; content: string }[],
  existingMemories: Memory[]
): Array<{ memoryId: string; newContent: string; reason: string }> {
  const updates: Array<{ memoryId: string; newContent: string; reason: string }> = []
  const userMessages = conversation.filter(m => m.role === 'user')
  
  userMessages.forEach(msg => {
    const content = msg.content.toLowerCase()
    
    // Check for contradictions or updates to existing memories
    existingMemories.forEach(mem => {
      const memContent = mem.content.toLowerCase()
      
      // If user says something contradicts a memory
      if (memContent.includes('likes') && content.match(/\b(i don't like|i hate|i dislike|i'm not into)\b/i)) {
        const contradiction = msg.content.match(/\b(i don't like|i hate|i dislike|i'm not into)\s+(.+?)(?:\.|$|,)/i)
        if (contradiction && memContent.includes(contradiction[2].toLowerCase())) {
          updates.push({
            memoryId: mem.id,
            newContent: `User no longer likes: ${contradiction[2]}. Updated based on conversation.`,
            reason: 'contradiction'
          })
        }
      }
      
      // If user corrects a memory
      if (content.match(/\b(that's not right|that's wrong|actually|correction|i meant|i said)\b/i)) {
        updates.push({
          memoryId: mem.id,
          newContent: mem.content + ' (Needs verification - user corrected this)',
          reason: 'correction'
        })
      }
    })
  })
  
  return updates
}

