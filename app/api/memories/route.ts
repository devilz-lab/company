import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { retrieveMemories, formatMemoriesForContext } from '@/lib/memory/retriever'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const personaId = searchParams.get('personaId')
    const limit = parseInt(searchParams.get('limit') || '10')

    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001' // TODO: Get from auth

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

export async function POST(req: NextRequest) {
  try {
    const { conversationId, personaId } = await req.json()

    if (!conversationId) {
      return new Response('conversationId is required', { status: 400 })
    }

    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001' // TODO: Get from auth

    // Get conversation messages
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!messages) {
      return new Response('Conversation not found', { status: 404 })
    }

    // Extract memories (simple pattern-based for now)
    const { extractMemories } = await import('@/lib/memory/extractor')
    const extractedMemories = extractMemories(
      messages,
      userId,
      personaId || null
    )

    // Save memories
    if (extractedMemories.length > 0) {
      const { error } = await supabase.from('memories').insert(
        extractedMemories.map(m => ({
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
      memoriesExtracted: extractedMemories.length 
    })
  } catch (error) {
    console.error('Memories extraction error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

