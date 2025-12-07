import { createClient } from '@/lib/supabase/client'
import { Memory } from '@/types/memory'

/**
 * Retrieves relevant memories for a conversation context
 */
export async function retrieveMemories(
  userId: string,
  personaId: string | null = null,
  context?: string,
  limit: number = 10
): Promise<Memory[]> {
  const supabase = createClient()

  // Build query
  let query = supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('strength', { ascending: false })
    .order('importance', { ascending: false })
    .limit(limit)

  // Filter by persona if specified
  if (personaId) {
    query = query.or(`persona_id.is.null,persona_id.eq.${personaId}`)
  } else {
    query = query.is('persona_id', null) // Only shared memories
  }

  const { data, error } = await query

  if (error) {
    console.error('Error retrieving memories:', error)
    return []
  }

  return (data as Memory[]) || []
}

/**
 * Updates memory strength and access count when a memory is used
 */
export async function accessMemory(memoryId: string): Promise<void> {
  const supabase = createClient()

  // Get current memory first
  const { data: memory } = await supabase
    .from('memories')
    .select('access_count, strength')
    .eq('id', memoryId)
    .single()

  if (memory) {
    // Increase strength slightly (decay prevention)
    // Update last_accessed and increment access_count
    await supabase
      .from('memories')
      .update({
        last_accessed: new Date().toISOString(),
        access_count: (memory.access_count || 0) + 1,
        strength: Math.min((memory.strength || 1.0) + 0.1, 1.0), // Cap at 1.0
      })
      .eq('id', memoryId)
  }
}

/**
 * Decays memory strength over time (should be run periodically)
 * Note: This requires a database function to be created
 */
export async function decayMemories(userId: string): Promise<void> {
  const supabase = createClient()

  // Get all memories for user
  const { data: memories } = await supabase
    .from('memories')
    .select('id, importance, strength, last_accessed, created_at')
    .eq('user_id', userId)

  if (!memories) return

  const now = new Date()
  const updates = memories.map((mem) => {
    const daysSinceAccess = mem.last_accessed
      ? Math.floor((now.getTime() - new Date(mem.last_accessed).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    // Decay based on importance and time since access
    const decayRate = 0.01 * (1 - mem.importance / 10) // Higher importance = slower decay
    const newStrength = Math.max(0, (mem.strength || 1.0) - (decayRate * Math.max(0, daysSinceAccess - 30)))

    return {
      id: mem.id,
      strength: newStrength,
    }
  })

  // Batch update
  for (const update of updates) {
    await supabase
      .from('memories')
      .update({ strength: update.strength })
      .eq('id', update.id)
  }
}

/**
 * Formats memories for inclusion in LLM context
 */
export function formatMemoriesForContext(memories: Memory[]): string {
  if (memories.length === 0) return ''

  const grouped = memories.reduce((acc, mem) => {
    if (!acc[mem.memory_type]) {
      acc[mem.memory_type] = []
    }
    acc[mem.memory_type].push(mem)
    return acc
  }, {} as Record<string, Memory[]>)

  const sections = Object.entries(grouped).map(([type, mems]) => {
    return `${type.charAt(0).toUpperCase() + type.slice(1)}:\n${mems.map(m => `- ${m.content}`).join('\n')}`
  })

  return sections.join('\n\n')
}

