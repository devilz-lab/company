import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const personaId = searchParams.get('personaId')

    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    let query = supabase
      .from('scenarios')
      .select('*')
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (personaId) {
      query = query.or(`persona_id.is.null,persona_id.eq.${personaId}`)
    }

    const { data: scenarios, error } = await query

    if (error) throw error

    return Response.json({ scenarios: scenarios || [] })
  } catch (error) {
    console.error('Scenarios API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, template_data, personaId } = await req.json()

    if (!title) {
      return new Response('Title is required', { status: 400 })
    }

    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    const { data: scenario, error } = await supabase
      .from('scenarios')
      .insert({
        user_id: userId,
        persona_id: personaId || null,
        title,
        description: description || null,
        template_data: template_data || null,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ scenario })
  } catch (error) {
    console.error('Create scenario error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

