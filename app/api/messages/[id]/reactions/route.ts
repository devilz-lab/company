import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { reactions } = await req.json()
    const supabase = await createClient()

    const { data: message, error } = await supabase
      .from('messages')
      .update({ reactions })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return Response.json({ message })
  } catch (error) {
    console.error('Update message reactions error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

