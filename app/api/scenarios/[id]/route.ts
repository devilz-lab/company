import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, description, template_data, is_favorite, usage_count } = await req.json()
    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (template_data !== undefined) updates.template_data = template_data
    if (is_favorite !== undefined) updates.is_favorite = is_favorite
    if (usage_count !== undefined) updates.usage_count = usage_count

    const { data: scenario, error } = await supabase
      .from('scenarios')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return Response.json({ scenario })
  } catch (error) {
    console.error('Update scenario error:', error)
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
      .from('scenarios')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete scenario error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

