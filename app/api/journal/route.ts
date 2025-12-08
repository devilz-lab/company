import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithOpenRouter } from '@/lib/openrouter/client'
import { getUserId } from '@/lib/auth/get-user'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = await getUserId()

    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ entries: entries || [] })
  } catch (error) {
    console.error('Journal API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, mood, tags } = await req.json()

    if (!content) {
      return new Response('Content is required', { status: 400 })
    }

    const supabase = await createClient()
    const userId = await getUserId()

    // Create journal entry
    const { data: entry, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        title: title || null,
        content,
        mood: mood || null,
        tags: tags || [],
      })
      .select()
      .single()

    if (error) throw error

    // Generate companion reflection
    try {
      const { data: persona } = await supabase
        .from('personas')
        .select('name, communication_style, personality_traits')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      const reflectionPrompt = `You are ${persona?.name || 'a companion'}. Read this journal entry and provide a thoughtful, supportive reflection (2-3 sentences). Be empathetic and understanding.

Journal Entry:
${content}

${mood ? `Mood: ${mood}` : ''}
${tags && tags.length > 0 ? `Tags: ${tags.join(', ')}` : ''}

Provide a warm, supportive reflection that shows you understand and care.`

      const reflectionResponse = await chatWithOpenRouter(
        [
          { role: 'system', content: reflectionPrompt },
          { role: 'user', content: 'Please reflect on this journal entry.' },
        ],
        'meta-llama/llama-3-70b-instruct',
        false
      )

      if (typeof reflectionResponse === 'object' && 'choices' in reflectionResponse) {
        const reflection = reflectionResponse.choices[0]?.message?.content || ''

        await supabase
          .from('journal_entries')
          .update({ companion_reflection: reflection })
          .eq('id', entry.id)
      }
    } catch (reflectionError) {
      console.error('Error generating reflection:', reflectionError)
      // Don't fail if reflection generation fails
    }

    return Response.json({ entry })
  } catch (error) {
    console.error('Journal API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

