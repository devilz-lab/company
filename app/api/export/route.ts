import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/get-user'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'json' // 'json' or 'csv'
    const type = searchParams.get('type') || 'all' // 'all', 'conversations', 'memories', 'kinks', 'journal', 'personas'

    const supabase = await createClient()
    const userId = await getUserId()

    const exportData: any = {
      exportDate: new Date().toISOString(),
      userId,
      version: '1.0',
    }

    // Export conversations
    if (type === 'all' || type === 'conversations') {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (conversations) {
        // Get messages for each conversation
        const conversationsWithMessages = await Promise.all(
          conversations.map(async (conv) => {
            const { data: messages } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: true })

            return {
              ...conv,
              messages: messages || [],
            }
          })
        )

        exportData.conversations = conversationsWithMessages
      }
    }

    // Export memories
    if (type === 'all' || type === 'memories') {
      const { data: memories } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      exportData.memories = memories || []
    }

    // Export kinks
    if (type === 'all' || type === 'kinks') {
      const { data: kinks } = await supabase
        .from('kinks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      exportData.kinks = kinks || []
    }

    // Export journal entries
    if (type === 'all' || type === 'journal') {
      const { data: journalEntries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      exportData.journal = journalEntries || []
    }

    // Export personas
    if (type === 'all' || type === 'personas') {
      const { data: personas } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      exportData.personas = personas || []
    }

    // Export scenarios
    if (type === 'all') {
      const { data: scenarios } = await supabase
        .from('scenarios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      exportData.scenarios = scenarios || []
    }

    // Format response
    if (format === 'csv') {
      // Convert to CSV format
      const csvLines: string[] = []
      
      if (exportData.conversations) {
        csvLines.push('=== CONVERSATIONS ===')
        exportData.conversations.forEach((conv: any) => {
          csvLines.push(`Conversation ID,${conv.id}`)
          csvLines.push(`Created,${conv.created_at}`)
          csvLines.push(`Mode,${conv.mode}`)
          csvLines.push(`Tags,${conv.tags?.join(';') || ''}`)
          csvLines.push(`Messages,${conv.messages?.length || 0}`)
          csvLines.push('')
        })
      }

      if (exportData.memories) {
        csvLines.push('=== MEMORIES ===')
        csvLines.push('ID,Type,Content,Importance,Strength,Created')
        exportData.memories.forEach((mem: any) => {
          csvLines.push(`${mem.id},${mem.memory_type},"${mem.content.replace(/"/g, '""')}",${mem.importance},${mem.strength},${mem.created_at}`)
        })
        csvLines.push('')
      }

      if (exportData.kinks) {
        csvLines.push('=== KINKS ===')
        csvLines.push('ID,Name,Category,Status,Notes')
        exportData.kinks.forEach((kink: any) => {
          csvLines.push(`${kink.id},${kink.name},${kink.category},${kink.status},"${(kink.notes || '').replace(/"/g, '""')}"`)
        })
        csvLines.push('')
      }

      return new Response(csvLines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="companion-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else {
      // JSON format
      return Response.json(exportData, {
        headers: {
          'Content-Disposition': `attachment; filename="companion-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

