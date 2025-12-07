import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        *,
        personas:persona_id (
          id,
          name,
          avatar_url,
          communication_style
        )
      `)
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (error) throw error

    // Get all messages for this conversation
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true })

    return Response.json({
      conversation,
      messages: messages || [],
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { is_archived, tags } = await req.json()
    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    const updates: any = {}
    if (is_archived !== undefined) updates.is_archived = is_archived
    if (tags !== undefined) updates.tags = tags

    const { data: conversation, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return Response.json({ conversation })
  } catch (error) {
    console.error('Update conversation error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete conversation error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

