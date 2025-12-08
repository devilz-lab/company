import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/get-user'
import { extractMemories } from '@/lib/memory/extractor'

export async function POST(req: NextRequest) {
  try {
    const { conversationId } = await req.json()

    if (!conversationId) {
      return new Response('Conversation ID is required', { status: 400 })
    }

    const supabase = await createClient()
    const userId = await getUserId()

    // Get all messages from the conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    if (!messages || messages.length === 0) {
      return Response.json({ message: 'No messages found in conversation', extracted: 0 })
    }

    // Get conversation to determine persona_id
    const { data: conversation } = await supabase
      .from('conversations')
      .select('persona_id')
      .eq('id', conversationId)
      .single()

    const personaId = conversation?.persona_id || null

    // Extract memories
    const extractedMemories = extractMemories(
      messages.map(m => ({ role: m.role, content: m.content })),
      userId,
      personaId
    )

    if (extractedMemories.length > 0) {
      // Insert memories in batches
      const batchSize = 50
      for (let i = 0; i < extractedMemories.length; i += batchSize) {
        const batch = extractedMemories.slice(i, i + batchSize)
        const { error: insertError } = await supabase.from('memories').insert(
          batch.map(m => ({
            user_id: m.user_id,
            persona_id: m.persona_id,
            memory_type: m.memory_type,
            content: m.content,
            importance: m.importance || 0.5,
            strength: m.strength || 1.0,
          }))
        )

        if (insertError) {
          console.error('Error inserting memory batch:', insertError)
        }
      }
    }

    return Response.json({ 
      message: 'Memories extracted successfully',
      extracted: extractedMemories.length 
    })
  } catch (error) {
    console.error('Memory extraction error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

