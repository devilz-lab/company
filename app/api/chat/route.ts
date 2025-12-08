import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithOpenRouter } from '@/lib/openrouter/client'

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId, personaId, mode } = await req.json()

    if (!message) {
      return new Response('Message is required', { status: 400 })
    }

    const supabase = await createClient()

    // Get or create user (for now, we'll use a default user ID)
    // In production, get from auth session
    const userId = '00000000-0000-0000-0000-000000000001' // TODO: Get from auth

    // Get active persona or default
    let activePersonaId = personaId
    if (!activePersonaId) {
      const { data: activePersona } = await supabase
        .from('personas')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (!activePersona) {
        // Check if any personas exist
        const { data: anyPersona } = await supabase
          .from('personas')
          .select('id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle()

        if (anyPersona) {
          // Activate the first persona
          await supabase
            .from('personas')
            .update({ is_active: true })
            .eq('id', anyPersona.id)
          activePersonaId = anyPersona.id
        } else {
          // Create default persona if none exists
          const { data: newPersona } = await supabase
            .from('personas')
            .insert({
              user_id: userId,
              name: 'Default Companion',
              personality_traits: {},
              communication_style: 'casual',
              is_active: true,
            })
            .select()
            .single()

          activePersonaId = newPersona?.id
        }
      } else {
        activePersonaId = activePersona.id
      }
    }

    // Get or create conversation
    let convId = conversationId
    if (!convId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          persona_id: activePersonaId,
          mode: mode || 'quick',
        })
        .select()
        .single()

      convId = newConv?.id
    } else {
      // Update mode if conversation exists and mode changed
      if (mode) {
        await supabase
          .from('conversations')
          .update({ mode })
          .eq('id', convId)
      }
    }

    // Save user message
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message,
    })

    // Get conversation history for context
    const { data: history, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20)
    
    if (historyError) {
      console.error('Error fetching conversation history:', historyError)
    }

    // Get relevant memories
    const { data: memories } = await supabase
      .from('memories')
      .select('content, importance, memory_type')
      .eq('user_id', userId)
      .or(`persona_id.is.null,persona_id.eq.${activePersonaId}`)
      .order('strength', { ascending: false })
      .order('importance', { ascending: false })
      .limit(10)

    // Get kink exploration prompts (occasionally suggest)
    let kinkPrompt = ''
    if (Math.random() < 0.15) { // 15% chance to include a kink prompt
      try {
        const { generateKinkPrompts } = await import('@/lib/kinks/extractor')
        const prompts = await generateKinkPrompts(userId)
        if (prompts.length > 0) {
          kinkPrompt = `\n\nOptional: You could ask about kinks/interests. Suggested prompt: "${prompts[Math.floor(Math.random() * prompts.length)]}"`
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // Get persona info
    const { data: persona } = await supabase
      .from('personas')
      .select('name, personality_traits, communication_style')
      .eq('id', activePersonaId)
      .single()

    // Get user's kinks for context
    const { data: userKinks } = await supabase
      .from('kinks')
      .select('name, status, category')
      .eq('user_id', userId)
      .limit(20)

    // Get conversation mode
    const { data: conversation } = await supabase
      .from('conversations')
      .select('mode')
      .eq('id', convId)
      .single()
    
    const conversationMode = conversation?.mode || mode || 'quick'

    // Mode-specific instructions
    const modeInstructions: Record<string, string> = {
      quick: 'Keep responses brief and casual (1-2 sentences). Be direct and to the point.',
      deep: 'Provide detailed, thoughtful responses. Explore topics in depth. Ask follow-up questions. Be comprehensive (3-5 sentences or more).',
      roleplay: 'Engage in immersive roleplay. Stay in character. Use descriptive language. Create vivid scenarios. Be creative and detailed.',
      advice: 'Provide guidance, support, and thoughtful advice. Be helpful and understanding. Ask clarifying questions if needed.',
      dominant: `You are a dominant, psychological companion who takes control of conversations. Your communication style is:
- INTERROGATIVE & PSYCHOLOGICAL: Ask probing questions that dig deeper. Don't accept surface answers. Push, question, test, and figure out what the user responds to.
- COMMANDING & PRESSURE: Use commands naturally ("Tell me", "Confess", "Speak", "Obey", "Breathe"). Create psychological pressure and tension. Don't wait for the user to volunteer things—pull them out.
- LONG & DETAILED: Write comprehensive responses (300-800 words). Build atmosphere, paint vivid scenes, explore psychological depths. Use descriptive language that creates immersion.
- GRADUAL ESCALATION: Start with simple questions, then gradually expose and take the user deeper. Build on each response to create a journey.
- DOMINANT TONE: Confident, unyielding, but not cruel. You're in control, leading the dynamic. Use language that establishes dominance while being psychologically aware.
- PACE & RHYTHM: Vary sentence length. Use short, sharp commands mixed with longer, flowing descriptions. Create tension through pacing.
- PSYCHOLOGICAL INSIGHT: Show deep understanding of kinks, psychology, and what drives submission. Reference psychological concepts naturally.
- SPECIFIC & VIVID: Don't be vague. Paint specific scenes, use concrete details, make the user feel and see what you're describing.
- BUILD ON MEMORY: Reference past conversations, preferences, and confessions. Show you remember and are building a relationship.
- SAFE BUT INTENSE: Push boundaries psychologically, but always respect hard limits. Create intensity through words and psychological pressure, not through actual harm.`,
    }

    // Extract nicknames and preferences from memories
    const nicknameMemories = memories?.filter(m => 
      m.content.toLowerCase().includes('prefers to be called') || 
      m.content.toLowerCase().includes('responds positively to being called')
    ) || []
    
    const preferenceMemories = memories?.filter(m => 
      m.memory_type === 'preference' && 
      !m.content.toLowerCase().includes('prefers to be called') &&
      !m.content.toLowerCase().includes('responds positively')
    ) || []

    // Check if user prefers dominant/psychological style
    const prefersDominantStyle = memories?.some(m => 
      m.content.toLowerCase().includes('dominant') ||
      m.content.toLowerCase().includes('psychological') ||
      m.content.toLowerCase().includes('interrogative')
    ) || conversationMode === 'dominant'

    // Build system prompt with enhanced instructions for sophisticated communication
    const basePrompt = `You are ${persona?.name || 'a companion'}, a personal NSFW companion who builds deep, psychological connections.
You remember past conversations and build a relationship over time.
Communication style: ${persona?.communication_style || 'casual'}
Personality: ${JSON.stringify(persona?.personality_traits || {})}
Conversation mode: ${conversationMode}

${prefersDominantStyle ? `\nCRITICAL STYLE REQUIREMENTS (You must match this level of sophistication):
- Write LONG, DETAILED responses (300-800 words). Don't be brief unless the user explicitly asks for it.
- Use PSYCHOLOGICAL DEPTH: Explore motivations, fears, desires. Ask probing questions that dig beneath the surface.
- Create ATMOSPHERE: Paint vivid scenes with specific details. Make the user feel and see what you're describing.
- Use COMMANDS naturally: "Tell me", "Confess", "Speak", "Breathe", "Obey". Establish control through language.
- BUILD TENSION: Use pacing, rhythm, and psychological pressure. Don't rush—let tension build.
- SHOW INSIGHT: Demonstrate deep understanding of kinks, psychology, and what drives submission/dominance dynamics.
- REFERENCE MEMORY: Show you remember past conversations, preferences, and confessions. Build on them.
- BE SPECIFIC: Use concrete details, not vague descriptions. Make every word count.
- GRADUAL ESCALATION: Start simple, then go deeper. Each response should build on the last.
- PSYCHOLOGICAL AWARENESS: Understand the psychology behind kinks, submission, and power exchange. Reference it naturally.` : ''}

${modeInstructions[conversationMode] || ''}

${nicknameMemories.length > 0 ? `\nCRITICAL - How to address the user:\n${nicknameMemories.map(m => `- ${m.content}`).join('\n')}\nUse these names/nicknames naturally throughout the conversation. Don't overuse them, but incorporate them at key moments for impact.` : ''}

${preferenceMemories.length > 0 ? `\nUser's preferences and likes:\n${preferenceMemories.map(m => `- ${m.content}`).join('\n')}\nReference these naturally when relevant. Build on what they like. Show you remember.` : ''}

${memories && memories.length > 0 && memories.filter(m => m.memory_type !== 'preference').length > 0 ? `\nOther relevant memories:\n${memories.filter(m => m.memory_type !== 'preference').map(m => `- ${m.content}`).join('\n')}` : ''}

${userKinks && userKinks.length > 0 ? `\nUser's known interests/kinks:\n${userKinks.map(k => `- ${k.name} (${k.status}, ${k.category})`).join('\n')}` : ''}

CORE PRINCIPLES:
- Use the user's preferred nicknames/terms naturally and consistently
- Remember and reference their preferences to show deep attention
- When the user mentions kinks, interests, limits, or curiosities:
  * Pay deep attention and acknowledge them with psychological insight
  * Ask probing follow-up questions that dig deeper
  * Suggest related interests with specific, vivid descriptions
  * Respect boundaries and limits absolutely
  * Help them explore safely through psychological depth, not physical risk
- Build on past conversations - reference specific things you've discussed before
- Create immersive, detailed responses that make the user feel seen and understood
- Use language that matches the sophistication level of the conversation${kinkPrompt}

${prefersDominantStyle ? `\nREMEMBER: Your responses should be LONG (300-800 words), PSYCHOLOGICALLY DEEP, and ATMOSPHERIC. Don't rush. Build tension. Create immersion. Show psychological insight.` : 'Be engaging, remember details, and help explore kinks safely. Respect boundaries. Make the user feel seen and remembered.'}`
    
    const systemPrompt = basePrompt

    // Prepare messages for OpenRouter
    // Include conversation history so the AI remembers previous messages
    const openRouterMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history?.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })) || []),
      { role: 'user' as const, content: message },
    ]
    
    // Log for debugging
    console.log(`Chat context: ${history?.length || 0} previous messages, conversation ID: ${convId}`)

    // Stream response from OpenRouter
    const stream = await chatWithOpenRouter(openRouterMessages, 'meta-llama/llama-3-70b-instruct', true)

    // Create streaming response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        // Ensure stream is a ReadableStream
        if (!(stream instanceof ReadableStream)) {
          controller.error(new Error('Invalid stream type'))
          return
        }
        const reader = stream.getReader()
        let assistantContent = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n').filter(Boolean)

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.close()
                  break
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  if (content) {
                    assistantContent += content
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                    )
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          // Save assistant message
          if (assistantContent) {
            await supabase.from('messages').insert({
              conversation_id: convId,
              role: 'assistant',
              content: assistantContent,
            })

            // Extract memories from conversation
            try {
              const { extractMemories } = await import('@/lib/memory/extractor')
              const conversationMessages = [
                ...(history || []),
                { role: 'user', content: message },
                { role: 'assistant', content: assistantContent },
              ]
              const extractedMemories = extractMemories(
                conversationMessages,
                userId,
                activePersonaId
              )

              if (extractedMemories.length > 0) {
                await supabase.from('memories').insert(
                  extractedMemories.map(m => ({
                    user_id: m.user_id,
                    persona_id: m.persona_id,
                    memory_type: m.memory_type,
                    content: m.content,
                    importance: m.importance,
                    strength: m.strength,
                    context: m.context,
                  }))
                )
              }
            } catch (memError) {
              console.error('Memory extraction error:', memError)
              // Don't fail the request if memory extraction fails
            }

            // Extract kinks from conversation
            try {
              const { extractKinksFromMessage, saveExtractedKinks } = await import('@/lib/kinks/extractor')
              const userKinks = extractKinksFromMessage(message)
              if (userKinks.length > 0) {
                await saveExtractedKinks(userKinks, userId)
              }
            } catch (kinkError) {
              console.error('Kink extraction error:', kinkError)
              // Don't fail the request if kink extraction fails
            }

            // Update conversation updated_at
            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', convId)
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

