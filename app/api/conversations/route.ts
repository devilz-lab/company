import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const archived = searchParams.get('archived') === 'true'
    const personaId = searchParams.get('personaId')

    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

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

    if (personaId) {
      query = query.eq('persona_id', personaId)
    }

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

