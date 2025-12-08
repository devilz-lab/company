import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/get-user'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = await getUserId()

    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })

    if (error) throw error

    // Check for new achievements
    await checkAndUnlockAchievements(userId, supabase)

    return Response.json({ achievements: achievements || [] })
  } catch (error) {
    console.error('Achievements API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function checkAndUnlockAchievements(userId: string, supabase: any) {
  // Get user stats
  const { data: user } = await supabase
    .from('users')
    .select('total_conversations, streak_days, relationship_level')
    .eq('id', userId)
    .single()

  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', 
      (await supabase.from('conversations').select('id').eq('user_id', userId)).data?.map((c: any) => c.id) || []
    )

  const { count: kinkCount } = await supabase
    .from('kinks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: milestoneCount } = await supabase
    .from('milestones')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Define achievements
  const achievements = [
    { type: 'first_conversation', title: 'First Chat', description: 'Started your first conversation', condition: () => (conversationCount || 0) >= 1 },
    { type: 'ten_conversations', title: 'Getting Started', description: 'Had 10 conversations', condition: () => (conversationCount || 0) >= 10 },
    { type: 'fifty_conversations', title: 'Regular Chat', description: 'Had 50 conversations', condition: () => (conversationCount || 0) >= 50 },
    { type: 'hundred_conversations', title: 'Dedicated', description: 'Had 100 conversations', condition: () => (conversationCount || 0) >= 100 },
    { type: 'first_milestone', title: 'First Milestone', description: 'Created your first milestone', condition: () => (milestoneCount || 0) >= 1 },
    { type: 'five_milestones', title: 'Memory Keeper', description: 'Created 5 milestones', condition: () => (milestoneCount || 0) >= 5 },
    { type: 'first_kink', title: 'Explorer', description: 'Added your first kink', condition: () => (kinkCount || 0) >= 1 },
    { type: 'ten_kinks', title: 'Kink Collector', description: 'Added 10 kinks', condition: () => (kinkCount || 0) >= 10 },
    { type: 'streak_7', title: 'Week Warrior', description: '7 day conversation streak', condition: () => (user?.streak_days || 0) >= 7 },
    { type: 'streak_30', title: 'Monthly Master', description: '30 day conversation streak', condition: () => (user?.streak_days || 0) >= 30 },
    { type: 'level_3', title: 'Friends', description: 'Reached relationship level 3', condition: () => (user?.relationship_level || 0) >= 3 },
    { type: 'level_6', title: 'Soulmates', description: 'Reached relationship level 6', condition: () => (user?.relationship_level || 0) >= 6 },
  ]

  // Check and unlock achievements
  for (const achievement of achievements) {
    if (achievement.condition()) {
      // Check if already unlocked
      const { data: existing } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_type', achievement.type)
        .maybeSingle()

      if (!existing) {
        // Unlock achievement
        await supabase
          .from('achievements')
          .insert({
            user_id: userId,
            achievement_type: achievement.type,
            title: achievement.title,
            description: achievement.description,
          })
      }
    }
  }
}

