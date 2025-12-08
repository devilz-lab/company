import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/get-user'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = await getUserId()

    const { data: personas, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ personas: personas || [] })
  } catch (error) {
    console.error('Personas API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, personality_traits, communication_style, color_scheme, avatar_url } = await req.json()

    if (!name || !communication_style) {
      return new Response('Name and communication_style are required', { status: 400 })
    }

    const supabase = await createClient()
    const userId = await getUserId()

    // If this is the first persona, make it active
    const { data: existingPersonas } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    const isActive = !existingPersonas || existingPersonas.length === 0

    const { data: persona, error } = await supabase
      .from('personas')
      .insert({
        user_id: userId,
        name,
        personality_traits: personality_traits || {},
        communication_style,
        color_scheme: color_scheme || null,
        avatar_url: avatar_url || null,
        is_active: isActive,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ persona })
  } catch (error: any) {
    console.error('Create persona error:', error)
    const errorMessage = error?.message || 'Internal server error'
    return new Response(JSON.stringify({ error: errorMessage, details: error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

