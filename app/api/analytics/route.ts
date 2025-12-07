import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    // Get comprehensive analytics
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, created_at, mode, persona_id')
      .eq('user_id', userId)

    const { data: messages } = await supabase
      .from('messages')
      .select('role, created_at, reactions')
      .in('conversation_id', conversations?.map(c => c.id) || [])

    const { data: personas } = await supabase
      .from('personas')
      .select('id, name')
      .eq('user_id', userId)

    const { data: kinks } = await supabase
      .from('kinks')
      .select('status, category, exploration_count')
      .eq('user_id', userId)

    const { data: memories } = await supabase
      .from('memories')
      .select('memory_type, importance, strength, created_at')
      .eq('user_id', userId)

    // Advanced analytics
    const analytics = {
      // Time-based analytics
      messagesByHour: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: messages?.filter(m => new Date(m.created_at).getHours() === i).length || 0,
      })),
      messagesByDayOfWeek: Array.from({ length: 7 }, (_, i) => ({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        count: messages?.filter(m => new Date(m.created_at).getDay() === i).length || 0,
      })),
      messagesByMonth: (() => {
        const monthCounts: Record<string, number> = {}
        messages?.forEach(m => {
          const month = new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          monthCounts[month] = (monthCounts[month] || 0) + 1
        })
        return Object.entries(monthCounts).map(([month, count]) => ({ month, count }))
      })(),

      // Engagement metrics
      averageResponseTime: calculateAverageResponseTime(messages || []),
      conversationLength: calculateAverageConversationLength(conversations || []),
      reactionRate: calculateReactionRate(messages || []),

      // Persona analytics
      personaEngagement: personas?.map(p => ({
        name: p.name,
        conversations: conversations?.filter(c => c.persona_id === p.id).length || 0,
      })) || [],

      // Kink analytics
      kinkExplorationRate: kinks?.filter(k => k.status === 'explored').length || 0,
      kinkCategories: (() => {
        const categoryCounts: Record<string, number> = {}
        kinks?.forEach(k => {
          categoryCounts[k.category] = (categoryCounts[k.category] || 0) + 1
        })
        return Object.entries(categoryCounts).map(([category, count]) => ({ category, count }))
      })(),

      // Memory analytics
      memoryGrowth: calculateMemoryGrowth(memories || []),
      memoryStrengthDistribution: calculateMemoryStrengthDistribution(memories || []),

      // Mode analytics
      modeUsage: (() => {
        const modeCounts: Record<string, number> = {}
        conversations?.forEach(c => {
          modeCounts[c.mode] = (modeCounts[c.mode] || 0) + 1
        })
        return Object.entries(modeCounts).map(([mode, count]) => ({ mode, count }))
      })(),
    }

    return Response.json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function calculateAverageResponseTime(messages: any[]): number {
  const userMessages = messages.filter(m => m.role === 'user')
  let totalTime = 0
  let count = 0

  for (let i = 1; i < userMessages.length; i++) {
    const prevTime = new Date(userMessages[i - 1].created_at).getTime()
    const currTime = new Date(userMessages[i].created_at).getTime()
    const diffMinutes = (currTime - prevTime) / (1000 * 60)
    if (diffMinutes < 1440) { // Within 24 hours
      totalTime += diffMinutes
      count++
    }
  }

  return count > 0 ? totalTime / count : 0
}

function calculateAverageConversationLength(conversations: any[]): number {
  // This would need message counts per conversation
  return conversations.length > 0 ? 10 : 0 // Placeholder
}

function calculateReactionRate(messages: any[]): number {
  const assistantMessages = messages.filter(m => m.role === 'assistant')
  const reactedMessages = assistantMessages.filter(m => m.reactions && Object.values(m.reactions).some(v => v === true))
  return assistantMessages.length > 0 ? (reactedMessages.length / assistantMessages.length) * 100 : 0
}

function calculateMemoryGrowth(memories: any[]): Array<{ date: string; count: number }> {
  const growth: Record<string, number> = {}
  memories.forEach(m => {
    const date = new Date(m.created_at).toISOString().split('T')[0]
    growth[date] = (growth[date] || 0) + 1
  })
  return Object.entries(growth).map(([date, count]) => ({ date, count }))
}

function calculateMemoryStrengthDistribution(memories: any[]): Array<{ range: string; count: number }> {
  const ranges = [
    { min: 0, max: 0.2, label: '0-0.2' },
    { min: 0.2, max: 0.4, label: '0.2-0.4' },
    { min: 0.4, max: 0.6, label: '0.4-0.6' },
    { min: 0.6, max: 0.8, label: '0.6-0.8' },
    { min: 0.8, max: 1.0, label: '0.8-1.0' },
  ]

  return ranges.map(range => ({
    range: range.label,
    count: memories.filter(m => {
      const strength = m.strength || 0
      return strength >= range.min && strength < range.max
    }).length,
  }))
}

