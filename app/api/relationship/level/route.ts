import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateRelationshipLevel } from '@/lib/relationship/levels'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = '00000000-0000-0000-0000-000000000001'

    const levelData = await calculateRelationshipLevel(userId)

    return Response.json(levelData)
  } catch (error) {
    console.error('Relationship level API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

