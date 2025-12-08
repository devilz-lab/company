import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/get-user'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, personality_traits, communication_style, color_scheme, is_active, avatar_url } = await req.json()
    const supabase = await createClient()
    const userId = await getUserId()

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (personality_traits !== undefined) updates.personality_traits = personality_traits
    if (communication_style !== undefined) updates.communication_style = communication_style
    if (color_scheme !== undefined) updates.color_scheme = color_scheme
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (is_active !== undefined) {
      updates.is_active = is_active
      // If activating this persona, deactivate others
      if (is_active) {
        await supabase
          .from('personas')
          .update({ is_active: false })
          .eq('user_id', userId)
          .neq('id', params.id)
      }
    }

    const { data: persona, error } = await supabase
      .from('personas')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return Response.json({ persona })
  } catch (error) {
    console.error('Update persona error:', error)
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

    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete persona error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

