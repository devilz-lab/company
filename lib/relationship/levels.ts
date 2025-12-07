import { createClient } from '@/lib/supabase/client'

export interface RelationshipLevel {
  level: number
  name: string
  description: string
  requirements: {
    conversations: number
    days: number
    milestones: number
  }
}

export const RELATIONSHIP_LEVELS: RelationshipLevel[] = [
  {
    level: 1,
    name: 'Strangers',
    description: 'Just getting to know each other',
    requirements: { conversations: 0, days: 0, milestones: 0 },
  },
  {
    level: 2,
    name: 'Acquaintances',
    description: 'Starting to build a connection',
    requirements: { conversations: 5, days: 3, milestones: 1 },
  },
  {
    level: 3,
    name: 'Friends',
    description: 'Comfortable with each other',
    requirements: { conversations: 15, days: 7, milestones: 3 },
  },
  {
    level: 4,
    name: 'Close Friends',
    description: 'Deepening the bond',
    requirements: { conversations: 30, days: 14, milestones: 5 },
  },
  {
    level: 5,
    name: 'Intimate Partners',
    description: 'Strong emotional connection',
    requirements: { conversations: 50, days: 21, milestones: 8 },
  },
  {
    level: 6,
    name: 'Soulmates',
    description: 'Deeply connected and in sync',
    requirements: { conversations: 100, days: 30, milestones: 15 },
  },
]

/**
 * Calculates current relationship level
 */
export async function calculateRelationshipLevel(userId: string): Promise<{
  currentLevel: number
  nextLevel: RelationshipLevel | null
  progress: number
  stats: {
    conversations: number
    days: number
    milestones: number
  }
}> {
  const supabase = createClient()

  // Get user stats
  const { data: user } = await supabase
    .from('users')
    .select('total_conversations, created_at, relationship_level')
    .eq('id', userId)
    .single()

  // Get conversation count
  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get milestone count
  const { count: milestoneCount } = await supabase
    .from('milestones')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Calculate days since first conversation
  const daysSinceStart = user?.created_at
    ? Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const stats = {
    conversations: conversationCount || 0,
    days: daysSinceStart,
    milestones: milestoneCount || 0,
  }

  // Find current level
  let currentLevel = 1
  for (let i = RELATIONSHIP_LEVELS.length - 1; i >= 0; i--) {
    const level = RELATIONSHIP_LEVELS[i]
    if (
      stats.conversations >= level.requirements.conversations &&
      stats.days >= level.requirements.days &&
      stats.milestones >= level.requirements.milestones
    ) {
      currentLevel = level.level
      break
    }
  }

  // Get next level
  const nextLevel = RELATIONSHIP_LEVELS.find(l => l.level === currentLevel + 1) || null

  // Calculate progress to next level
  let progress = 0
  if (nextLevel) {
    const convProgress = Math.min(stats.conversations / nextLevel.requirements.conversations, 1)
    const daysProgress = Math.min(stats.days / nextLevel.requirements.days, 1)
    const milestoneProgress = Math.min(stats.milestones / nextLevel.requirements.milestones, 1)
    progress = (convProgress + daysProgress + milestoneProgress) / 3
  } else {
    progress = 1 // Max level
  }

  // Update user's relationship level
  if (user && user.relationship_level !== currentLevel) {
    await supabase
      .from('users')
      .update({ relationship_level: currentLevel })
      .eq('id', userId)
  }

  return {
    currentLevel,
    nextLevel,
    progress,
    stats,
  }
}

