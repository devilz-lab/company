import { createClient } from '@/lib/supabase/server'

/**
 * Gets the authenticated user ID, or falls back to default user for personal app
 * In production, you might want to require authentication
 */
export async function getUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // Use authenticated user ID, or fallback to default for personal app
  // For a personal-only app, this allows it to work without auth setup
  const userId = user?.id || '00000000-0000-0000-0000-000000000001'
  
  if (authError && user) {
    console.warn('Auth error (using fallback):', authError)
  }
  
  return userId
}

