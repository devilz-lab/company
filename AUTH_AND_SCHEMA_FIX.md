# Authentication & Schema Fix

## Changes Made

### 1. Proper Authentication ✅
- Created `lib/auth/get-user.ts` helper function
- Uses Supabase Auth to get authenticated user
- Falls back to default user ID for personal app (no auth required)
- Updated all API routes to use `getUserId()` instead of hardcoded user ID

**Files Updated:**
- `lib/auth/get-user.ts` (new)
- `app/api/chat/route.ts`
- `app/api/personas/route.ts`
- `app/api/personas/[id]/route.ts`
- `app/api/memories/route.ts`
- `app/api/memories/[id]/route.ts`
- `app/api/conversations/route.ts`
- `app/api/conversations/[id]/route.ts`
- `app/api/conversations/import/route.ts`
- `app/api/search/route.ts`
- `app/api/stats/route.ts`
- `app/api/analytics/route.ts`
- `app/api/scenarios/route.ts`
- `app/api/scenarios/[id]/route.ts`
- `app/api/journal/route.ts`
- `app/api/achievements/route.ts`
- `app/api/relationship/level/route.ts`
- `app/api/kinks/prompts/route.ts`
- `app/api/cron/proactive-messages/route.ts`
- `app/api/proactive/route.ts`
- `app/api/kinks/route.ts`
- `app/api/kinks/[id]/route.ts`
- `app/api/milestones/route.ts`

### 2. Fixed persona_id NOT NULL Constraint ✅
- Created migration `003_fix_persona_nullable.sql`
- Allows `persona_id` to be `NULL` in conversations table
- `NULL` = shared conversation (uses shared memories)
- `UUID` = persona-specific conversation
- Updated chat route to handle null persona_id properly

**Files Created:**
- `supabase/migrations/003_fix_persona_nullable.sql`

**Files Updated:**
- `app/api/chat/route.ts` - Removed workaround logic, now directly uses null persona_id
- `app/api/conversations/route.ts` - Added handling for null persona_id in queries
- `app/api/conversations/[id]/route.ts` - Added comment about null persona_id handling in joins

## Migration Required

Run this SQL in your Supabase SQL Editor:

```sql
-- Fix: Allow persona_id to be NULL in conversations for shared conversations
ALTER TABLE conversations 
ALTER COLUMN persona_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN conversations.persona_id IS 'NULL = shared conversation (uses shared memories), UUID = persona-specific conversation';
```

Or use the migration file: `supabase/migrations/003_fix_persona_nullable.sql`

## How It Works

### Authentication
- When a user is authenticated via Supabase Auth, their user ID is used
- If no auth is set up (personal app), it falls back to the default user ID
- This allows the app to work with or without authentication

### Persona System
- **Shared Conversations** (`persona_id = NULL`): Uses shared memories (memories with `persona_id = NULL`)
- **Persona-Specific Conversations** (`persona_id = UUID`): Uses memories for that specific persona + shared memories

## Testing

1. Run the migration in Supabase
2. Test creating a conversation without selecting a persona (should work now)
3. Test creating a conversation with a persona selected
4. Verify memories are correctly filtered by persona_id

## Next Steps

If you want to add proper authentication later:
1. Set up Supabase Auth in your project
2. Add login/signup pages
3. The `getUserId()` function will automatically use the authenticated user
4. No code changes needed - it's already set up!

