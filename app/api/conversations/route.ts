import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/get-user'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const archived = searchParams.get('archived') === 'true'
    const personaId = searchParams.get('personaId')

    const supabase = await createClient()
    const userId = await getUserId()

    let query = supabase
      .from('conversations')
      .select(`
        *,
        personas:persona_id (
          id,
          name,
          avatar_url
        ),
        messages (
          id,
          role,
          content,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('is_archived', archived)
      .order('updated_at', { ascending: false })

    // Handle persona_id filter - can be null for shared conversations
    if (personaId) {
      query = query.eq('persona_id', personaId)
    } else if (personaId === null) {
      // Explicitly filter for null persona_id (shared conversations)
      query = query.is('persona_id', null)
    }
    // If personaId is undefined, show all conversations

    const { data: conversations, error } = await query

    if (error) throw error

    // Get message counts and last message for each conversation
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)

        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at, role')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        return {
          ...conv,
          message_count: count || 0,
          last_message: lastMessage || null,
        }
      })
    )

    return Response.json({ conversations: enrichedConversations })
  } catch (error) {
    console.error('Conversations API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

