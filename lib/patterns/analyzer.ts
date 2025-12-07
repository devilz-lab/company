import { createClient } from '@/lib/supabase/client'

/**
 * Analyzes user patterns for smart timing
 */
export async function analyzeUserPatterns(userId: string): Promise<{
  activeHours: number[]
  responseTimes: number[]
  mostActiveDay: string | null
  averageMessagesPerDay: number
}> {
  const supabase = createClient()

  // Get all messages from last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: messages } = await supabase
    .from('messages')
    .select('created_at, role')
    .eq('role', 'user')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  if (!messages || messages.length === 0) {
    return {
      activeHours: [],
      responseTimes: [],
      mostActiveDay: null,
      averageMessagesPerDay: 0,
    }
  }

  // Analyze active hours
  const hourCounts: Record<number, number> = {}
  messages.forEach((msg) => {
    const hour = new Date(msg.created_at).getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  // Get top 3 most active hours
  const activeHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour))

  // Analyze most active day
  const dayCounts: Record<string, number> = {}
  messages.forEach((msg) => {
    const day = new Date(msg.created_at).toLocaleDateString('en-US', { weekday: 'long' })
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })

  const mostActiveDay = Object.entries(dayCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || null

  // Calculate average messages per day
  const days = new Set(messages.map(m => new Date(m.created_at).toDateString())).size
  const averageMessagesPerDay = messages.length / Math.max(days, 1)

  // Calculate response times (time between user messages)
  const responseTimes: number[] = []
  for (let i = 1; i < messages.length; i++) {
    const prevTime = new Date(messages[i - 1].created_at).getTime()
    const currTime = new Date(messages[i].created_at).getTime()
    const diffHours = (currTime - prevTime) / (1000 * 60 * 60)
    if (diffHours < 24) { // Only count same-day responses
      responseTimes.push(diffHours)
    }
  }

  return {
    activeHours,
    responseTimes,
    mostActiveDay,
    averageMessagesPerDay,
  }
}

/**
 * Saves patterns to database
 */
export async function saveUserPatterns(
  userId: string,
  patterns: {
    activeHours: number[]
    responseTimes: number[]
    mostActiveDay: string | null
    averageMessagesPerDay: number
  }
): Promise<void> {
  const supabase = createClient()

  // Save active hours pattern
  await supabase
    .from('user_patterns')
    .upsert({
      user_id: userId,
      pattern_type: 'active_hours',
      pattern_data: {
        hours: patterns.activeHours,
        confidence: patterns.activeHours.length > 0 ? 0.8 : 0.3,
      },
      last_updated: new Date().toISOString(),
    }, {
      onConflict: 'user_id,pattern_type',
    })

  // Save response time pattern
  if (patterns.responseTimes.length > 0) {
    const avgResponseTime = patterns.responseTimes.reduce((a, b) => a + b, 0) / patterns.responseTimes.length
    await supabase
      .from('user_patterns')
      .upsert({
        user_id: userId,
        pattern_type: 'response_times',
        pattern_data: {
          average: avgResponseTime,
          confidence: patterns.responseTimes.length > 5 ? 0.7 : 0.4,
        },
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'user_id,pattern_type',
      })
  }
}

/**
 * Gets optimal time to send proactive message
 */
export async function getOptimalMessageTime(userId: string): Promise<Date | null> {
  const supabase = createClient()

  const { data: pattern } = await supabase
    .from('user_patterns')
    .select('pattern_data')
    .eq('user_id', userId)
    .eq('pattern_type', 'active_hours')
    .single()

  if (!pattern?.pattern_data?.hours || pattern.pattern_data.hours.length === 0) {
    return null
  }

  const activeHours = pattern.pattern_data.hours as number[]
  const now = new Date()
  const currentHour = now.getHours()

  // Find next active hour
  const sortedHours = [...activeHours].sort((a, b) => a - b)
  const nextHour = sortedHours.find(h => h > currentHour) || sortedHours[0]

  const optimalTime = new Date(now)
  optimalTime.setHours(nextHour, 0, 0, 0)

  // If next hour is tomorrow
  if (nextHour <= currentHour) {
    optimalTime.setDate(optimalTime.getDate() + 1)
  }

  return optimalTime
}

