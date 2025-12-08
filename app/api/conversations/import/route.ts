import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractMemories } from '@/lib/memory/extractor'

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
    const userId = '00000000-0000-0000-0000-000000000001' // TODO: Get from auth

    // Extract memories from the imported conversation
    console.log('Extracting memories...')
    const extractedMemories = extractMemories(messages, userId, personaId || null)
    console.log(`Extracted ${extractedMemories.length} memories`)

    if (extractedMemories.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No memories extracted from conversation',
          memories: []
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Save extracted memories in batches to avoid timeout
    console.log('Saving memories to database...')
    const batchSize = 50
    const savedMemories: any[] = []
    let hasError = false
    
    for (let i = 0; i < extractedMemories.length; i += batchSize) {
      const batch = extractedMemories.slice(i, i + batchSize)
      console.log(`Saving batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(extractedMemories.length / batchSize)}...`)
      
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
        // Continue with other batches even if one fails
      } else if (data) {
        savedMemories.push(...data)
      }
    }
    
    if (hasError && savedMemories.length === 0) {
      console.error('Failed to save any memories')
      return new Response(
        JSON.stringify({ error: 'Failed to save memories. Check console for details.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Successfully saved ${savedMemories.length} of ${extractedMemories.length} memories`)

    // Analyze patterns
    const nicknameMemories = extractedMemories.filter(m => 
      m.content.toLowerCase().includes('prefers to be called') ||
      m.content.toLowerCase().includes('responds positively to being called')
    )
    
    const preferenceMemories = extractedMemories.filter(m => 
      m.memory_type === 'preference' && 
      !m.content.toLowerCase().includes('prefers to be called') &&
      !m.content.toLowerCase().includes('responds positively')
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: `Extracted ${extractedMemories.length} memories from conversation`,
        memories: savedMemories,
        analysis: {
          nicknames: nicknameMemories.length,
          preferences: preferenceMemories.length,
          other: extractedMemories.length - nicknameMemories.length - preferenceMemories.length,
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

