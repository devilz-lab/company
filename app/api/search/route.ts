import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/get-user'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all' // all, conversations, messages, memories, journal

    if (!query || query.length < 2) {
      return Response.json({ results: [] })
    }

    const supabase = await createClient()
    const userId = await getUserId()
    const searchTerm = `%${query}%`

    const results: any = {
      conversations: [],
      messages: [],
      memories: [],
      journal: [],
    }

    // Search conversations
    if (type === 'all' || type === 'conversations') {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, mode, created_at, updated_at, persona_id')
        .eq('user_id', userId)
        .ilike('mode', searchTerm)
        .limit(10)

      if (conversations) {
        results.conversations = conversations
      }
    }

    // Search messages
    if (type === 'all' || type === 'messages') {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)

      if (conversations && conversations.length > 0) {
        const { data: messages } = await supabase
          .from('messages')
          .select('id, content, created_at, conversation_id, role')
          .in('conversation_id', conversations.map(c => c.id))
          .ilike('content', searchTerm)
          .limit(20)

        if (messages) {
          results.messages = messages
        }
      }
    }

    // Search memories
    if (type === 'all' || type === 'memories') {
      const { data: memories } = await supabase
        .from('memories')
        .select('id, content, memory_type, importance, created_at')
        .eq('user_id', userId)
        .ilike('content', searchTerm)
        .limit(20)

      if (memories) {
        results.memories = memories
      }
    }

    // Search journal
    if (type === 'all' || type === 'journal') {
      const { data: journal } = await supabase
        .from('journal_entries')
        .select('id, title, content, created_at')
        .eq('user_id', userId)
        .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .limit(10)

      if (journal) {
        results.journal = journal
      }
    }

    return Response.json({ results })
  } catch (error) {
    console.error('Search API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

