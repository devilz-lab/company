import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/get-user'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const personaId = searchParams.get('personaId')

    const supabase = await createClient()
    const userId = await getUserId()

    let query = supabase
      .from('milestones')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (personaId) {
      query = query.or(`persona_id.is.null,persona_id.eq.${personaId}`)
    } else {
      query = query.is('persona_id', null)
    }

    const { data: milestones, error } = await query

    if (error) throw error

    return Response.json({ milestones: milestones || [] })
  } catch (error) {
    console.error('Milestones API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, title, description, personaId, importance, metadata } = await req.json()

    if (!type || !title) {
      return new Response('Type and title are required', { status: 400 })
    }

    const supabase = await createClient()
    const userId = await getUserId()

    const { data: milestone, error } = await supabase
      .from('milestones')
      .insert({
        user_id: userId,
        persona_id: personaId || null,
        type,
        title,
        description: description || null,
        importance: importance || 5,
        metadata: metadata || null,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ milestone })
  } catch (error) {
    console.error('Create milestone error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

