import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { retrieveMemories, formatMemoriesForContext } from '@/lib/memory/retriever'
import { getUserId } from '@/lib/auth/get-user'
import { Memory } from '@/types/memory'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const personaId = searchParams.get('personaId')
    const limit = parseInt(searchParams.get('limit') || '10')

    const supabase = await createClient()
    const userId = await getUserId()

    const memories = await retrieveMemories(userId, personaId || null, undefined, limit)

    return Response.json({ memories })
  } catch (error) {
    console.error('Memories API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Extract memories from a specific conversation (for end chat)
export async function POST(req: NextRequest) {
  try {
    const { conversationId, personaId } = await req.json()

    if (!conversationId) {
      return new Response('conversationId is required', { status: 400 })
    }

    const supabase = await createClient()
    const userId = await getUserId()

    // Get conversation messages
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!messages) {
      return new Response('Conversation not found', { status: 404 })
    }

    // Get existing memories
    const { data: existingMemoriesData } = await supabase
      .from('memories')
      .select('id, content, memory_type, persona_id, user_id, importance, strength, context, created_at, last_accessed, access_count')
      .eq('user_id', userId)
    
    const existingMemories = (existingMemoriesData || []) as Memory[]

    // Extract memories (simple pattern-based for now)
    const { extractMemories } = await import('@/lib/memory/extractor')
    const extractionResult = extractMemories(
      messages,
      userId,
      personaId || null,
      existingMemories
    )

    const { updateMemoryFromConversation } = await import('@/lib/memory/updater')

    // Apply memory updates
    if (extractionResult.memoryUpdates.length > 0) {
      for (const update of extractionResult.memoryUpdates) {
        try {
          await updateMemoryFromConversation(update.memoryId, update.newContent, userId)
        } catch (err) {
          console.error('Error updating memory:', err)
        }
      }
    }

    // Save new memories
    if (extractionResult.newMemories.length > 0) {
      const { error } = await supabase.from('memories').insert(
        extractionResult.newMemories.map(m => ({
          user_id: m.user_id,
          persona_id: m.persona_id,
          memory_type: m.memory_type,
          content: m.content,
          importance: m.importance,
          strength: m.strength,
          context: m.context,
        }))
      )

      if (error) {
        console.error('Error saving memories:', error)
      }
    }

    return Response.json({ 
      success: true, 
      memoriesExtracted: extractionResult.newMemories.length,
      memoriesUpdated: extractionResult.memoryUpdates.length
    })
  } catch (error) {
    console.error('Memories extraction error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

