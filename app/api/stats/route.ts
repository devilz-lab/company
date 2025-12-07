import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    // Get conversation stats
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, created_at, mode, persona_id')
      .eq('user_id', userId)

    // Get message stats
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('role, created_at')
      .in('conversation_id', conversations?.map(c => c.id) || [])

    // Get persona stats
    const { data: personas, error: personaError } = await supabase
      .from('personas')
      .select('id, name, is_active')
      .eq('user_id', userId)

    // Get memory stats
    const { data: memories, error: memError } = await supabase
      .from('memories')
      .select('memory_type, importance, strength')
      .eq('user_id', userId)

    // Get kink stats
    const { data: kinks, error: kinkError } = await supabase
      .from('kinks')
      .select('status, exploration_count')
      .eq('user_id', userId)

    // Get milestone stats
    const { data: milestones, error: milestoneError } = await supabase
      .from('milestones')
      .select('type, importance')
      .eq('user_id', userId)

    // Calculate stats
    const totalConversations = conversations?.length || 0
    const totalMessages = messages?.length || 0
    const userMessages = messages?.filter(m => m.role === 'user').length || 0
    const assistantMessages = messages?.filter(m => m.role === 'assistant').length || 0

    // Messages by day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentMessages = messages?.filter(m => 
      new Date(m.created_at) >= thirtyDaysAgo
    ) || []

    const messagesByDay = recentMessages.reduce((acc, msg) => {
      const date = new Date(msg.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Persona usage
    const personaUsage = conversations?.reduce((acc, conv) => {
      const persona = personas?.find(p => p.id === conv.persona_id)
      if (persona) {
        acc[persona.name] = (acc[persona.name] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    // Memory stats
    const memoryByType = memories?.reduce((acc, mem) => {
      acc[mem.memory_type] = (acc[mem.memory_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Kink stats
    const kinkByStatus = kinks?.reduce((acc, kink) => {
      acc[kink.status] = (acc[kink.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const totalExplorations = kinks?.reduce((sum, kink) => sum + (kink.exploration_count || 0), 0) || 0

    // Conversation modes
    const modeStats = conversations?.reduce((acc, conv) => {
      acc[conv.mode] = (acc[conv.mode] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return Response.json({
      totalConversations,
      totalMessages,
      userMessages,
      assistantMessages,
      messagesByDay: Object.entries(messagesByDay).map(([date, count]) => ({ date, count })),
      personaUsage: Object.entries(personaUsage).map(([name, count]) => ({ name, count })),
      memoryByType: Object.entries(memoryByType).map(([type, count]) => ({ type, count })),
      kinkByStatus: Object.entries(kinkByStatus).map(([status, count]) => ({ status, count })),
      totalExplorations,
      modeStats: Object.entries(modeStats).map(([mode, count]) => ({ mode, count })),
      totalPersonas: personas?.length || 0,
      totalMemories: memories?.length || 0,
      totalKinks: kinks?.length || 0,
      totalMilestones: milestones?.length || 0,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

