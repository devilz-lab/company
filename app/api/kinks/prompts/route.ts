import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateKinkPrompts } from '@/lib/kinks/extractor'
import { getUserId } from '@/lib/auth/get-user'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = await getUserId()

    const prompts = await generateKinkPrompts(userId)

    return Response.json({ prompts })
  } catch (error) {
    console.error('Kink prompts API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

