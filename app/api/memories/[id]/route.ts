import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content, importance, strength } = await req.json()
    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    const updates: any = {}
    if (content !== undefined) updates.content = content
    if (importance !== undefined) updates.importance = importance
    if (strength !== undefined) updates.strength = strength

    const { data: memory, error } = await supabase
      .from('memories')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return Response.json({ memory })
  } catch (error) {
    console.error('Update memory error:', error)
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
      .from('memories')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete memory error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

