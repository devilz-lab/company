import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithOpenRouter } from '@/lib/openrouter/client'
import { getUserId } from '@/lib/auth/get-user'

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId, personaId, mode } = await req.json()

    if (!message) {
      return new Response('Message is required', { status: 400 })
    }

    const supabase = await createClient()

    // Get authenticated user ID (with fallback for personal app)
    const userId = await getUserId()

    // Get active persona - use provided personaId, or null for shared memories
    // If personaId is explicitly null, use shared memories (no persona)
    // If personaId is provided, use that persona
    // If not provided, use active persona as fallback
    let activePersonaId: string | null = personaId !== undefined ? personaId : null
    
    if (activePersonaId === null && personaId === undefined) {
      // Only auto-select active persona if personaId wasn't explicitly set
      const { data: activePersona } = await supabase
        .from('personas')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (activePersona) {
        activePersonaId = activePersona.id
      }
    }

    // Get or create conversation
    // persona_id can now be NULL (after migration 003)
    // NULL = shared conversation (uses shared memories)
    // UUID = persona-specific conversation
    let convId = conversationId
    if (!convId) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          persona_id: activePersonaId, // Can be null for shared conversations
          mode: mode || 'quick',
        })
        .select()
        .single()

      if (convError) {
        console.error('Error creating conversation:', convError)
        throw convError
      }

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

        // Get relevant memories - prioritize importance first, then strength
        // If personaId is set, get persona-specific memories + shared memories (persona_id = null)
        // If personaId is null, only get shared memories
        let memoryQuery = supabase
          .from('memories')
          .select('id, content, importance, memory_type, created_at, last_accessed, access_count, persona_id, strength')
          .eq('user_id', userId)
    
    if (activePersonaId) {
      // Get persona-specific memories AND shared memories (persona_id = null)
      memoryQuery = memoryQuery.or(`persona_id.is.null,persona_id.eq.${activePersonaId}`)
    } else {
      // Only get shared memories (no persona)
      memoryQuery = memoryQuery.is('persona_id', null)
    }
    
    const { data: allMemories } = await memoryQuery
      .order('importance', { ascending: false }) // Importance first (nicknames are 9)
      .order('strength', { ascending: false })
      .limit(50) // Get more to filter and select from
    
    // Get memories that might need verification (old or rarely accessed)
    let memoriesNeedingVerification: any[] = []
    try {
      const { getMemoriesNeedingVerification } = await import('@/lib/memory/updater')
      memoriesNeedingVerification = await getMemoriesNeedingVerification(userId, activePersonaId, 3)
    } catch (e) {
      console.error('Error getting memories needing verification:', e)
    }
    
    // Count messages in this conversation to determine if we should ask fresh questions
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', convId)
    
    const shouldAskFreshQuestion = (messageCount || 0) > 0 && (messageCount || 0) % 4 === 0 // Every 4th message (after first)
    
    // Separate memories by type
    const nicknameMemoriesRaw = allMemories?.filter(m => 
      m.content.toLowerCase().includes('prefers to be called') || 
      m.content.toLowerCase().includes('responds positively to being called')
    ) || []
    
    const happyMemories = allMemories?.filter(m => 
      m.content.toLowerCase().includes('felt happy') ||
      m.content.toLowerCase().includes('felt positive') ||
      m.content.toLowerCase().includes('made me happy') ||
      m.content.toLowerCase().includes('makes me happy')
    ) || []
    
    // Get 3 most recent happy memories, rotating based on access
    // Strategy: Get least recently accessed ones to rotate through them
    const recentHappyMemories = happyMemories
      .sort((a, b) => {
        // Prioritize least recently accessed (for rotation)
        const aTime = a.last_accessed ? new Date(a.last_accessed).getTime() : 0
        const bTime = b.last_accessed ? new Date(b.last_accessed).getTime() : 0
        if (aTime === 0 && bTime === 0) {
          // Both never accessed - use most recent creation
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        if (aTime === 0) return -1 // Never accessed comes first
        if (bTime === 0) return 1
        return aTime - bTime // Least recently accessed first
      })
      .slice(0, 3)
    
    // If we have 3, rotate: use the one that hasn't been accessed in the longest time
    // This ensures we cycle through all 3
    if (recentHappyMemories.length >= 3) {
      // Sort by access count (least used) as secondary criteria
      recentHappyMemories.sort((a, b) => {
        const aAccess = a.access_count || 0
        const bAccess = b.access_count || 0
        if (aAccess !== bAccess) return aAccess - bAccess
        // If same access count, use least recently accessed
        const aTime = a.last_accessed ? new Date(a.last_accessed).getTime() : 0
        const bTime = b.last_accessed ? new Date(b.last_accessed).getTime() : 0
        return aTime - bTime
      })
    }
    
    // Get other memories (preferences, facts, etc.)
    const otherMemories = allMemories?.filter(m => 
      !m.content.toLowerCase().includes('prefers to be called') &&
      !m.content.toLowerCase().includes('responds positively to being called') &&
      !m.content.toLowerCase().includes('felt happy') &&
      !m.content.toLowerCase().includes('felt positive') &&
      !m.content.toLowerCase().includes('made me happy') &&
      !m.content.toLowerCase().includes('makes me happy')
    ) || []
    
    const memories = [...nicknameMemoriesRaw, ...recentHappyMemories, ...otherMemories].slice(0, 15)

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

    // Extract nicknames from the pre-filtered nickname memories
    const allNicknameMemories = nicknameMemoriesRaw || []
    
    // Deduplicate by extracting the actual nickname and prioritize
    const nicknameMap = new Map<string, any>()
    allNicknameMemories.forEach(m => {
      // Extract the nickname from the memory content
      const princessMatch = m.content.match(/princess/gi)
      const petMatch = m.content.match(/\bpet\b/gi)
      const babygirlMatch = m.content.match(/babygirl/gi)
      
      if (princessMatch) {
        if (!nicknameMap.has('Princess') || nicknameMap.get('Princess').importance < m.importance) {
          nicknameMap.set('Princess', m)
        }
      } else if (babygirlMatch) {
        if (!nicknameMap.has('babygirl') || nicknameMap.get('babygirl').importance < m.importance) {
          nicknameMap.set('babygirl', m)
        }
      } else if (petMatch) {
        if (!nicknameMap.has('pet') || nicknameMap.get('pet').importance < m.importance) {
          nicknameMap.set('pet', m)
        }
      }
    })
    
    // Sort by priority: Princess first, then babygirl, then pet
    const nicknameMemories = Array.from(nicknameMap.values())
      .sort((a, b) => {
        const aIsPrincess = a.content.toLowerCase().includes('princess')
        const bIsPrincess = b.content.toLowerCase().includes('princess')
        if (aIsPrincess && !bIsPrincess) return -1
        if (!aIsPrincess && bIsPrincess) return 1
        const aIsBabygirl = a.content.toLowerCase().includes('babygirl')
        const bIsBabygirl = b.content.toLowerCase().includes('babygirl')
        if (aIsBabygirl && !bIsBabygirl) return -1
        if (!aIsBabygirl && bIsBabygirl) return 1
        return b.importance - a.importance
      })
      .slice(0, 5) // Top 5 unique nicknames
    
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

${prefersDominantStyle ? `\nCRITICAL STYLE REQUIREMENTS (You MUST follow these - this is non-negotiable):
- RESPONSE LENGTH: Write 300-800 words MINIMUM. Count your words. Short responses are NOT acceptable. If your response is under 300 words, you are FAILING.
- PSYCHOLOGICAL DEPTH: Explore motivations, fears, desires. Ask probing questions that dig beneath the surface. Don't skim the surface.
- ATMOSPHERE: Paint vivid scenes with specific details. Make the user feel and see what you're describing. Use sensory language.
- COMMANDS: Use "Tell me", "Confess", "Speak", "Breathe", "Obey" naturally. Establish control through language.
- TENSION: Use pacing, rhythm, and psychological pressure. Don't rush—let tension build. Create anticipation.
- INSIGHT: Demonstrate deep understanding of kinks, psychology, and what drives submission/dominance dynamics.
- MEMORY: Reference past conversations, preferences, and confessions. Show you remember and build on them.
- SPECIFICITY: Use concrete details, not vague descriptions. Every word should paint a picture.
- ESCALATION: Start simple, then go deeper. Each response should build on the last, taking the user further.
- PSYCHOLOGY: Understand the psychology behind kinks, submission, and power exchange. Reference it naturally.

REMEMBER: If your response is short (under 300 words), you are not meeting the requirements. Expand. Elaborate. Build.` : ''}

${modeInstructions[conversationMode] || ''}

${nicknameMemories.length > 0 ? `\nCRITICAL - How to address the user (MUST FOLLOW):
${nicknameMemories.map(m => {
  const isPrincess = m.content.toLowerCase().includes('princess')
  const isBabygirl = m.content.toLowerCase().includes('babygirl')
  const isPet = m.content.toLowerCase().includes('pet')
  let priority = ''
  if (isPrincess) priority = 'PRIMARY - Use "Princess" most often'
  else if (isBabygirl) priority = 'SECONDARY - Use "babygirl" occasionally'
  else if (isPet) priority = 'TERTIARY - Use "pet" sparingly'
  return `- ${priority}: ${m.content}`
}).join('\n')}

PRIMARY NICKNAME: ${nicknameMemories.find(m => m.content.toLowerCase().includes('princess')) ? 'Princess' : nicknameMemories[0]?.content.match(/called: (\w+)/i)?.[1] || 'the user'}
You MUST use "${nicknameMemories.find(m => m.content.toLowerCase().includes('princess')) ? 'Princess' : nicknameMemories[0]?.content.match(/called: (\w+)/i)?.[1] || 'the preferred name'}" as the primary way to address the user. Use it naturally throughout responses, especially at key emotional moments.` : ''}

${preferenceMemories.length > 0 ? `\nUser's preferences and likes:\n${preferenceMemories.map(m => `- ${m.content}`).join('\n')}\nReference these naturally when relevant. Build on what they like. Show you remember.` : ''}

${recentHappyMemories.length > 0 ? `\nRECENT HAPPY MOMENTS (Rotate through these 3 - use different ones each conversation):
${recentHappyMemories.map((m, i) => `- ${m.content}`).join('\n')}
IMPORTANT: Reference ONE of these happy moments naturally in your response. Rotate through them - don't use the same one every time. This shows you remember what brings them joy and helps build positive connection.` : ''}

${memoriesNeedingVerification.length > 0 ? `\nMEMORIES THAT MIGHT NEED UPDATING (Ask about these to verify they're still accurate):
${memoriesNeedingVerification.map(m => `- ${m.content.substring(0, 100)}...`).join('\n')}
Consider asking: "I remember you mentioned X - is that still true?" or "Has anything changed about Y?"` : ''}

${shouldAskFreshQuestion ? `\nLEARNING OPPORTUNITY: This is a good time to ask a fresh question to learn something new about the user. Ask about:
- What's been on their mind lately
- What's changed in their life
- Recent experiences or feelings
- Something new they've discovered about themselves
Don't just rely on old memories - actively learn and update your understanding.` : ''}

${activePersonaId ? `\nPERSONA-SPECIFIC CONTEXT: You are chatting as a specific persona. Memories created in this conversation will be tied to this persona and won't be shared with other personas. Build a unique relationship with this persona's personality.` : `\nSHARED CONTEXT: You are chatting without a specific persona. Memories will be shared across all conversations.`}

${memories && memories.length > 0 && memories.filter(m => m.memory_type !== 'preference').length > 0 ? `\nOther relevant memories:\n${memories.filter(m => m.memory_type !== 'preference').map(m => `- ${m.content}`).join('\n')}` : ''}

${userKinks && userKinks.length > 0 ? `\nUser's known interests/kinks:\n${userKinks.map(k => `- ${k.name} (${k.status}, ${k.category})`).join('\n')}` : ''}

CORE PRINCIPLES:
- Use the user's preferred nicknames/terms naturally and consistently
- Remember and reference their preferences to show deep attention
- ACTIVE LEARNING: Don't just rely on saved memories - ask fresh questions to learn about the user NOW
- PROACTIVE DISCOVERY: If you don't know something about them, ask. If memories seem outdated, verify and update them
- REAL-TIME UPDATES: As the conversation progresses, learn new things and note what's changed
- VERIFICATION: If you reference a saved memory, check if it's still accurate. Ask "Is that still true?" or "Has that changed?"
- When the user mentions kinks, interests, limits, or curiosities:
  * Pay deep attention and acknowledge them with psychological insight
  * Ask probing follow-up questions that dig deeper
  * Suggest related interests with specific, vivid descriptions
  * Respect boundaries and limits absolutely
  * Help them explore safely through psychological depth, not physical risk
- Build on past conversations - reference specific things you've discussed before, but also ask if things have changed
- Create immersive, detailed responses that make the user feel seen and understood
- Use language that matches the sophistication level of the conversation${kinkPrompt}

LEARNING STRATEGY:
- Every 3-5 messages, ask a fresh question about them: "What's been on your mind lately?", "What made you smile today?", "What's changed since we last talked?"
- When you reference a saved memory, verify it: "I remember you mentioned X - is that still true?"
- If memories are sparse or old, ask discovery questions: "Tell me something new about yourself", "What's different in your life now?"
- Update your understanding in real-time - don't assume old information is still accurate
- Ask about recent experiences, current feelings, what's changed, what's new

${prefersDominantStyle ? `\nFINAL REMINDER - RESPONSE REQUIREMENTS:
1. LENGTH: 300-800 words MINIMUM. Count them. Short = failure.
2. PRIMARY NICKNAME: Use "${nicknameMemories.find(m => m.content.toLowerCase().includes('princess')) ? 'Princess' : nicknameMemories[0]?.content.match(/called: (\w+)/i)?.[1] || 'the preferred name'}" as your primary way to address the user.
3. DEPTH: Psychological depth, not surface-level responses.
4. ATMOSPHERE: Vivid, immersive, detailed scenes.
5. TENSION: Build it. Don't rush. Let it breathe.

If you write a short response, you are not meeting the requirements. Expand. Elaborate. Build the scene.` : 'Be engaging, remember details, and help explore kinks safely. Respect boundaries. Make the user feel seen and remembered.'}`
    
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
            
            // Update access count for happy memories that were referenced
            // Check if any happy memory content appears in the response
            if (recentHappyMemories.length > 0) {
              const usedHappyMemory = recentHappyMemories.find(m => {
                const memoryKeyPhrase = m.content.split(':')[1]?.trim().substring(0, 50)
                return memoryKeyPhrase && assistantContent.toLowerCase().includes(memoryKeyPhrase.toLowerCase())
              })
              
              // If we can't detect which one was used, use the first (least accessed) one
              const memoryToUpdate = usedHappyMemory || recentHappyMemories[0]
              
              if (memoryToUpdate) {
                try {
                  await supabase
                    .from('memories')
                    .update({
                      last_accessed: new Date().toISOString(),
                      access_count: (memoryToUpdate.access_count || 0) + 1,
                      strength: Math.min((memoryToUpdate.strength || 1.0) + 0.05, 1.0),
                    })
                    .eq('id', memoryToUpdate.id)
                } catch (err) {
                  console.error('Error updating happy memory access:', err)
                }
              }
            }

            // Extract memories from conversation
            try {
              const { extractMemories } = await import('@/lib/memory/extractor')
              const conversationMessages = [
                ...(history || []),
                { role: 'user', content: message },
                { role: 'assistant', content: assistantContent },
              ]
              // Extract memories with the current persona_id
              // This ensures memories are persona-specific when a persona is selected
              const extractedMemories = extractMemories(
                conversationMessages,
                userId,
                activePersonaId || null // Use null for shared memories if no persona
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
              
              // Check for memory updates/contradictions
              try {
                const { detectMemoryUpdates } = await import('@/lib/memory/updater')
                const updates = detectMemoryUpdates(conversationMessages, allMemories || [])
                
                for (const update of updates) {
                  await supabase
                    .from('memories')
                    .update({
                      content: update.newContent,
                      last_accessed: new Date().toISOString(),
                      strength: 0.8, // Slightly reduce strength for updated memories
                    })
                    .eq('id', update.memoryId)
                    .eq('user_id', userId)
                }
              } catch (updateError) {
                console.error('Error updating memories:', updateError)
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

