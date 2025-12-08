import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/get-user'

export async function POST(req: NextRequest) {
  try {
    const exportData = await req.json()

    if (!exportData || !exportData.version) {
      return new Response('Invalid export format', { status: 400 })
    }

    const supabase = await createClient()
    const userId = await getUserId()

    // Import conversations with messages
    if (exportData.conversations && Array.isArray(exportData.conversations)) {
      for (const conv of exportData.conversations) {
        // Create conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            id: conv.id, // Preserve original ID if possible
            user_id: userId,
            persona_id: conv.persona_id,
            mode: conv.mode || 'quick',
            theme: conv.theme,
            tags: conv.tags,
            is_archived: conv.is_archived || false,
            created_at: conv.created_at,
            updated_at: conv.updated_at || conv.created_at,
          })
          .select()
          .single()

        if (convError && !convError.message.includes('duplicate')) {
          console.error('Error importing conversation:', convError)
          continue
        }

        // Import messages for this conversation
        if (conv.messages && Array.isArray(conv.messages) && newConv) {
          const messagesToInsert = conv.messages.map((msg: any) => ({
            id: msg.id,
            conversation_id: newConv.id,
            role: msg.role,
            content: msg.content,
            reactions: msg.reactions,
            metadata: msg.metadata,
            created_at: msg.created_at,
          }))

          // Insert in batches
          const batchSize = 50
          for (let i = 0; i < messagesToInsert.length; i += batchSize) {
            const batch = messagesToInsert.slice(i, i + batchSize)
            const { error: msgError } = await supabase
              .from('messages')
              .insert(batch)

            if (msgError && !msgError.message.includes('duplicate')) {
              console.error('Error importing messages:', msgError)
            }
          }
        }
      }
    }

    // Import memories
    if (exportData.memories && Array.isArray(exportData.memories)) {
      const batchSize = 50
      for (let i = 0; i < exportData.memories.length; i += batchSize) {
        const batch = exportData.memories.slice(i, i + batchSize)
        const memoriesToInsert = batch.map((mem: any) => ({
          id: mem.id,
          user_id: userId,
          persona_id: mem.persona_id,
          memory_type: mem.memory_type,
          content: mem.content,
          importance: mem.importance || 0.5,
          strength: mem.strength || 1.0,
          context: mem.context,
          created_at: mem.created_at,
          last_accessed: mem.last_accessed,
          access_count: mem.access_count || 0,
        }))

        const { error: memError } = await supabase
          .from('memories')
          .insert(memoriesToInsert)

        if (memError && !memError.message.includes('duplicate')) {
          console.error('Error importing memories:', memError)
        }
      }
    }

    // Import kinks
    if (exportData.kinks && Array.isArray(exportData.kinks)) {
      const kinksToInsert = exportData.kinks.map((kink: any) => ({
        id: kink.id,
        user_id: userId,
        name: kink.name,
        category: kink.category,
        status: kink.status,
        notes: kink.notes,
        exploration_count: kink.exploration_count || 0,
        first_explored: kink.first_explored,
        last_explored: kink.last_explored,
        created_at: kink.created_at,
      }))

      const { error: kinkError } = await supabase
        .from('kinks')
        .insert(kinksToInsert)

      if (kinkError && !kinkError.message.includes('duplicate')) {
        console.error('Error importing kinks:', kinkError)
      }
    }

    // Import journal entries
    if (exportData.journal && Array.isArray(exportData.journal)) {
      const journalToInsert = exportData.journal.map((entry: any) => ({
        id: entry.id,
        user_id: userId,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        tags: entry.tags || [],
        companion_reflection: entry.companion_reflection,
        created_at: entry.created_at,
      }))

      const { error: journalError } = await supabase
        .from('journal_entries')
        .insert(journalToInsert)

      if (journalError && !journalError.message.includes('duplicate')) {
        console.error('Error importing journal:', journalError)
      }
    }

    // Import personas
    if (exportData.personas && Array.isArray(exportData.personas)) {
      const personasToInsert = exportData.personas.map((persona: any) => ({
        id: persona.id,
        user_id: userId,
        name: persona.name,
        personality_traits: persona.personality_traits,
        communication_style: persona.communication_style,
        avatar_url: persona.avatar_url,
        color_scheme: persona.color_scheme,
        is_active: persona.is_active || false,
        created_at: persona.created_at,
      }))

      const { error: personaError } = await supabase
        .from('personas')
        .insert(personasToInsert)

      if (personaError && !personaError.message.includes('duplicate')) {
        console.error('Error importing personas:', personaError)
      }
    }

    return Response.json({ 
      success: true,
      message: 'Data imported successfully',
      imported: {
        conversations: exportData.conversations?.length || 0,
        memories: exportData.memories?.length || 0,
        kinks: exportData.kinks?.length || 0,
        journal: exportData.journal?.length || 0,
        personas: exportData.personas?.length || 0,
      }
    })
  } catch (error) {
    console.error('Import error:', error)
    return new Response(JSON.stringify({ error: 'Import failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

