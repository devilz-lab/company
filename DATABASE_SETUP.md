# Database Setup Instructions

## Step 1: Run the Migration

1. Go to your Supabase project: https://supabase.com/dashboard/project/efigidhsmxqpkyvppmqm/sql/new

2. Copy the ENTIRE contents of `supabase/migrations/001_initial_schema.sql`

3. Paste into the SQL Editor

4. Click **Run** (or press Cmd/Ctrl + Enter)

5. Wait for "Success" message - you should see all tables created

## Step 2: Create Default User

After the migration succeeds, run this in SQL Editor:

```sql
INSERT INTO users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000001', NULL)
ON CONFLICT (id) DO NOTHING;
```

Or with your email:

```sql
INSERT INTO users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'your-email@example.com')
ON CONFLICT (id) DO NOTHING;
```

**Note:** We're using a fixed UUID format. This is your default user ID.

## Step 3: Verify Tables Were Created

In Supabase, go to **Table Editor** and verify you see these tables:
- ✅ users
- ✅ personas
- ✅ conversations
- ✅ messages
- ✅ memories
- ✅ kinks
- ✅ scenarios
- ✅ milestones
- ✅ achievements
- ✅ journal_entries
- ✅ message_schedules
- ✅ proactive_messages
- ✅ user_patterns

## Step 4: Test the App

```bash
npm run dev
```

Then:
1. Open http://localhost:3000
2. Go to Personas page
3. Create your first persona
4. Go to Chat and start talking!

## Troubleshooting

**"Table already exists" errors?**
- That's fine! The migration uses `IF NOT EXISTS`
- Just continue to Step 2

**Foreign key errors?**
- Make sure you ran the migration in order
- Check that the `users` table exists first

**Can't create persona?**
- Make sure the default user exists (Step 2)
- Check browser console for errors

