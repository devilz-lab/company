import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    const { data: kinks, error } = await supabase
      .from('kinks')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (error) throw error

    return Response.json({ kinks: kinks || [] })
  } catch (error) {
    console.error('Kinks API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, category, status, notes } = await req.json()

    if (!name || !category || !status) {
      return new Response('Name, category, and status are required', { status: 400 })
    }

    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    // Check if kink already exists
    const { data: existing } = await supabase
      .from('kinks')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .maybeSingle()

    if (existing) {
      // Update existing
      const { data: kink, error } = await supabase
        .from('kinks')
        .update({
          category,
          status,
          notes: notes || null,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return Response.json({ kink })
    } else {
      // Create new
      const { data: kink, error } = await supabase
        .from('kinks')
        .insert({
          user_id: userId,
          name,
          category,
          status,
          notes: notes || null,
        })
        .select()
        .single()

      if (error) throw error
      return Response.json({ kink })
    }
  } catch (error) {
    console.error('Kinks API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

