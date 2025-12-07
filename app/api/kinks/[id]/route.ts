import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, notes, exploration_count } = await req.json()
    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    const updates: any = {}
    if (status !== undefined) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (exploration_count !== undefined) {
      updates.exploration_count = exploration_count
      if (exploration_count === 1) {
        updates.first_explored = new Date().toISOString()
      }
      updates.last_explored = new Date().toISOString()
    }

    const { data: kink, error } = await supabase
      .from('kinks')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return Response.json({ kink })
  } catch (error) {
    console.error('Update kink error:', error)
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
      .from('kinks')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete kink error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

