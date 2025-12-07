import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This endpoint should be called by Vercel Cron or external cron service
// To set up: Add to vercel.json or use external service like cron-job.org
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    // Get active schedules that are due
    const now = new Date().toISOString()
    const { data: schedules } = await supabase
      .from('message_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('next_send', now)

    if (!schedules || schedules.length === 0) {
      return Response.json({ message: 'No schedules due' })
    }

    // Generate and send proactive messages
    const results = []
    for (const schedule of schedules) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proactive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleId: schedule.id }),
        })
        
        if (response.ok) {
          const data = await response.json()
          results.push({ scheduleId: schedule.id, success: true, message: data.message })
        } else {
          results.push({ scheduleId: schedule.id, success: false, error: await response.text() })
        }
      } catch (error) {
        results.push({ scheduleId: schedule.id, success: false, error: String(error) })
      }
    }

    return Response.json({ results })
  } catch (error) {
    console.error('Cron job error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

