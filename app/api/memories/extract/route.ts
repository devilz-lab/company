import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/get-user'
import { extractMemories } from '@/lib/memory/extractor'
import { Memory } from '@/types/memory'

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

    // Get existing memories
    const { data: existingMemoriesData } = await supabase
      .from('memories')
      .select('id, content, memory_type, persona_id, user_id, importance, strength, context, created_at, last_accessed, access_count')
      .eq('user_id', userId)
    
    const existingMemories = (existingMemoriesData || []) as Memory[]

    // Extract memories
    const extractionResult = extractMemories(
      messages.map(m => ({ role: m.role, content: m.content })),
      userId,
      personaId,
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

    // Insert new memories in batches
    if (extractionResult.newMemories.length > 0) {
      const batchSize = 50
      for (let i = 0; i < extractionResult.newMemories.length; i += batchSize) {
        const batch = extractionResult.newMemories.slice(i, i + batchSize)
        const { error: insertError } = await supabase.from('memories').insert(
          batch.map(m => ({
            user_id: m.user_id,
            persona_id: m.persona_id,
            memory_type: m.memory_type,
            content: m.content,
            importance: m.importance || 0.5,
            strength: m.strength || 1.0,
            context: m.context,
          }))
        )

        if (insertError) {
          console.error('Error inserting memory batch:', insertError)
        }
      }
    }

    return Response.json({ 
      message: 'Memories extracted successfully',
      extracted: extractionResult.newMemories.length,
      updated: extractionResult.memoryUpdates.length
    })
  } catch (error) {
    console.error('Memory extraction error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

