import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractMemories } from '@/lib/memory/extractor'
import { getUserId } from '@/lib/auth/get-user'
import { Memory } from '@/types/memory'

/**
 * Import and analyze example conversations to extract patterns
 * POST /api/conversations/import
 * Body: { messages: Array<{role: 'user'|'assistant', content: string}>, personaId?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, personaId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 })
    }

    console.log(`Importing conversation with ${messages.length} messages`)

    const supabase = await createClient()
    const userId = await getUserId()

    // Get existing memories to pass to extractor
    const { data: existingMemoriesData } = await supabase
      .from('memories')
      .select('id, content, memory_type, persona_id, user_id, importance, strength, context, created_at, last_accessed, access_count')
      .eq('user_id', userId)
    
    const existingMemories = (existingMemoriesData || []) as Memory[]

    // Extract memories from the imported conversation
    console.log('Extracting memories...')
    const extractionResult = extractMemories(messages, userId, personaId || null, existingMemories)
    console.log(`Extracted ${extractionResult.newMemories.length} new memories, ${extractionResult.memoryUpdates.length} updates`)

    const { updateMemoryFromConversation } = await import('@/lib/memory/updater')

    // Apply memory updates
    if (extractionResult.memoryUpdates.length > 0) {
      console.log('Applying memory updates...')
      for (const update of extractionResult.memoryUpdates) {
        try {
          await updateMemoryFromConversation(update.memoryId, update.newContent, userId)
        } catch (err) {
          console.error('Error updating memory:', err)
        }
      }
    }

    // Save new memories in batches to avoid timeout
    const savedMemories: any[] = []
    let hasError = false
    
    if (extractionResult.newMemories.length > 0) {
      console.log('Saving new memories to database...')
      const batchSize = 50
      
      for (let i = 0; i < extractionResult.newMemories.length; i += batchSize) {
        const batch = extractionResult.newMemories.slice(i, i + batchSize)
        console.log(`Saving batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(extractionResult.newMemories.length / batchSize)}...`)
        
        const { data, error: insertError } = await supabase
          .from('memories')
          .insert(
            batch.map(m => ({
              user_id: m.user_id,
              persona_id: m.persona_id,
              memory_type: m.memory_type,
              content: m.content,
              importance: m.importance,
              strength: m.strength,
              context: m.context,
            }))
          )
          .select()
        
        if (insertError) {
          console.error(`Error saving batch ${Math.floor(i / batchSize) + 1}:`, insertError)
          hasError = true
        } else if (data) {
          savedMemories.push(...data)
        }
      }
    }
    
    if (hasError && savedMemories.length === 0 && extractionResult.newMemories.length > 0) {
      console.error('Failed to save any memories')
      return new Response(
        JSON.stringify({ error: 'Failed to save memories. Check console for details.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Successfully saved ${savedMemories.length} new memories, updated ${extractionResult.memoryUpdates.length} existing`)

    // Analyze patterns
    const allMemories = [...extractionResult.newMemories]
    const nicknameMemories = allMemories.filter(m => 
      m.content.toLowerCase().includes('prefers to be called') ||
      m.content.toLowerCase().includes('responds positively to being called')
    )
    
    const preferenceMemories = allMemories.filter(m => 
      m.memory_type === 'preference' && 
      !m.content.toLowerCase().includes('prefers to be called') &&
      !m.content.toLowerCase().includes('responds positively')
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: `Extracted ${extractionResult.newMemories.length} new memories and updated ${extractionResult.memoryUpdates.length} existing from conversation`,
        memories: savedMemories,
        updates: extractionResult.memoryUpdates.length,
        analysis: {
          nicknames: nicknameMemories.length,
          preferences: preferenceMemories.length,
          other: allMemories.length - nicknameMemories.length - preferenceMemories.length,
        },
        summary: {
          nicknames: nicknameMemories.map(m => m.content),
          topPreferences: preferenceMemories.slice(0, 5).map(m => m.content),
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error importing conversation:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to import conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

