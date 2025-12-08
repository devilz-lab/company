import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/get-user'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const userId = await getUserId()

    // Get message with conversation info
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*, conversation_id')
      .eq('id', params.id)
      .single()

    if (messageError) throw messageError

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', message.conversation_id)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      return new Response('Unauthorized', { status: 403 })
    }

    return Response.json({ message })
  } catch (error) {
    console.error('Get message error:', error)
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
    const { content } = await req.json()
    const supabase = await createClient()
    const userId = await getUserId()

    // Get message to verify ownership
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*, conversation_id, role')
      .eq('id', params.id)
      .single()

    if (messageError) throw messageError

    // Only allow editing user messages
    if (message.role !== 'user') {
      return new Response('Can only edit user messages', { status: 400 })
    }

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', message.conversation_id)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      return new Response('Unauthorized', { status: 403 })
    }

    const { data: updatedMessage, error } = await supabase
      .from('messages')
      .update({ content })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return Response.json({ message: updatedMessage })
  } catch (error) {
    console.error('Update message error:', error)
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
    const userId = await getUserId()

    // Get message to verify ownership
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*, conversation_id')
      .eq('id', params.id)
      .single()

    if (messageError) throw messageError

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', message.conversation_id)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      return new Response('Unauthorized', { status: 403 })
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete message error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

