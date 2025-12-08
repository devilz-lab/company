import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithOpenRouter } from '@/lib/openrouter/client'
import { getUserId } from '@/lib/auth/get-user'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = await getUserId()

    const { data: messages, error } = await supabase
      .from('proactive_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('read_at', null)
      .order('sent_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return Response.json({ messages: messages || [] })
  } catch (error) {
    console.error('Proactive messages API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { scheduleId } = await req.json()
    const supabase = await createClient()
    const userId = await getUserId()

    // Get active schedule
    const { data: schedule } = await supabase
      .from('message_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!schedule) {
      return new Response('Schedule not found', { status: 404 })
    }

    // Get active persona
    const { data: persona } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!persona) {
      return new Response('No active persona', { status: 404 })
    }

    // Get recent context
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('role, content')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get memories
    const { data: memories } = await supabase
      .from('memories')
      .select('content, importance')
      .eq('user_id', userId)
      .or(`persona_id.is.null,persona_id.eq.${persona.id}`)
      .order('strength', { ascending: false })
      .order('importance', { ascending: false })
      .limit(5)

    // Generate proactive message
    const systemPrompt = `You are ${persona.name}, a personal NSFW companion. 
Generate a proactive, engaging message to check in with the user. 
Be warm, personal, and reference past conversations if relevant.
Communication style: ${persona.communication_style}
Personality: ${JSON.stringify(persona.personality_traits)}

${memories && memories.length > 0 ? `Recent memories:\n${memories.map(m => `- ${m.content}`).join('\n')}` : ''}

Keep it short (1-2 sentences), engaging, and appropriate for the time of day.`

    const openRouterMessages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: 'Generate a proactive check-in message.' },
    ]

    const response = await chatWithOpenRouter(openRouterMessages, 'meta-llama/llama-3-70b-instruct', false)
    
    if (typeof response === 'object' && 'choices' in response) {
      const content = response.choices[0]?.message?.content || 'Hey! How are you doing today?'
      
      // Save proactive message
      const { data: proactiveMessage, error: msgError } = await supabase
        .from('proactive_messages')
        .insert({
          user_id: userId,
          persona_id: persona.id,
          content,
        })
        .select()
        .single()

      if (msgError) throw msgError

      // Update schedule
      await supabase
        .from('message_schedules')
        .update({
          last_sent: new Date().toISOString(),
          next_send: calculateNextSend(schedule.trigger_config),
        })
        .eq('id', scheduleId)

      return Response.json({ message: proactiveMessage })
    }

    return new Response('Failed to generate message', { status: 500 })
  } catch (error) {
    console.error('Proactive message generation error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function calculateNextSend(triggerConfig: any): string {
  const now = new Date()
  
  if (triggerConfig.type === 'scheduled') {
    // Next scheduled time
    const hours = triggerConfig.hours || 9
    const minutes = triggerConfig.minutes || 0
    const next = new Date(now)
    next.setHours(hours, minutes, 0, 0)
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
    return next.toISOString()
  } else if (triggerConfig.type === 'random') {
    // Random time within range
    const minHours = triggerConfig.minHours || 2
    const maxHours = triggerConfig.maxHours || 6
    const randomHours = Math.floor(Math.random() * (maxHours - minHours + 1)) + minHours
    const next = new Date(now)
    next.setHours(next.getHours() + randomHours)
    return next.toISOString()
  }

  // Default: 4 hours from now
  const next = new Date(now)
  next.setHours(next.getHours() + 4)
  return next.toISOString()
}

