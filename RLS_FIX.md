# Fix Row Level Security (RLS) Error

## Problem
You're getting this error when creating a persona:
```
new row violates row-level security policy for table "personas"
```

## Solution (Personal Use - Recommended)

Since this is a personal app, the simplest solution is to **disable RLS entirely**.

### Quick Fix: Disable RLS

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the **entire contents** of `DISABLE_RLS.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Wait for "Success" message

### Step 2: Verify It Worked

After running the SQL, try creating a persona again. It should work now!

## Alternative: Create RLS Policies

If you prefer to keep RLS enabled, you can use `QUICK_RLS_FIX.sql` to create policies instead.

### What This Does

The migration creates RLS policies that allow the default user (`00000000-0000-0000-0000-000000000001`) to:
- ✅ Read their own data
- ✅ Insert new records
- ✅ Update their records
- ✅ Delete their records

This applies to all tables:
- users
- personas
- conversations
- messages
- memories
- kinks
- scenarios
- milestones
- achievements
- journal_entries
- message_schedules
- proactive_messages
- user_patterns
- exports

### Alternative: Disable RLS (Not Recommended)

If you want to disable RLS entirely (not recommended for production), you can run:

```sql
ALTER TABLE personas DISABLE ROW LEVEL SECURITY;
-- Repeat for other tables
```

But it's better to use the policies above for security.

