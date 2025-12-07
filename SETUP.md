# Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Accounts & Get API Keys

### OpenRouter
1. Go to https://openrouter.ai
2. Sign up for an account
3. Add credits ($10-20 to start)
4. Go to Settings → Keys
5. Copy your API key

### Supabase
1. Go to https://supabase.com
2. Sign up (free tier is fine)
3. Create a new project
4. Wait for project to be ready
5. Go to Settings → API
6. Copy:
   - Project URL
   - anon/public key
   - service_role key (keep this secret!)

## Step 3: Set Up Database

1. In Supabase, go to SQL Editor
2. Click "New query"
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" to execute the migration
5. Verify tables were created (check Table Editor)

## Step 4: Create Environment File

Create a file named `.env.local` in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxxxx...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the values with your actual keys.

## Step 5: Create Default User

Since this is a personal app, you need to create a default user in the database:

1. Go to Supabase SQL Editor
2. Run this query:

```sql
INSERT INTO users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'your-email@example.com')
ON CONFLICT (id) DO NOTHING;
```

Replace `your-email@example.com` with your email (optional).

## Step 6: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Create Your First Persona

1. Navigate to the Personas page (bottom nav)
2. Click the "+" button
3. Fill in:
   - Name (e.g., "My Companion")
   - Communication style
   - Personality traits
4. Click "Create"

## Step 8: Start Chatting

1. Go to the Chat page
2. Start a conversation!
3. The companion will remember things you tell it

## Troubleshooting

### "Failed to get response" in chat
- Check your OpenRouter API key is correct
- Make sure you have credits in your OpenRouter account
- Check browser console for errors

### Database errors
- Verify you ran the migration SQL
- Check your Supabase URL and keys are correct
- Make sure you created the default user

### Build errors
- Make sure all dependencies are installed: `npm install`
- Check Node.js version (should be 18+)
- Delete `node_modules` and `.next` folder, then `npm install` again

## Next Steps

- The app is ready to use!
- Memory extraction happens automatically after conversations
- You can create multiple personas and switch between them
- More features (timeline, stats, kink explorer) are coming soon

## Deployment to Vercel

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your GitHub repository
4. Add all environment variables from `.env.local`
5. Deploy!

Note: Update `NEXT_PUBLIC_APP_URL` to your Vercel URL after deployment.

