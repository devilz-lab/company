# Next Steps - Quick Setup Guide

## ✅ What You've Done
- Created Supabase project
- Got your Supabase URL and anon key
- Environment file created with your credentials

## 🔑 What You Still Need

### 1. Supabase Service Role Key
1. Go to your Supabase project: https://supabase.com/dashboard/project/efigidhsmxqpkyvppmqm
2. Click **Settings** (gear icon) → **API**
3. Find **service_role** key (it's secret - don't share!)
4. Copy it and add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here
   ```

### 2. OpenRouter API Key
1. Go to https://openrouter.ai
2. Sign up or log in
3. Add credits ($10-20 to start)
4. Go to **Settings** → **Keys**
5. Copy your API key
6. Add to `.env.local`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-paste_your_key_here
   ```

### 3. Set Up Database
1. In Supabase, go to **SQL Editor**
2. Click **New query**
3. Open the file: `supabase/migrations/001_initial_schema.sql`
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for "Success" message

### 4. Create Default User
In Supabase SQL Editor, run:
```sql
INSERT INTO users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'your-email@example.com')
ON CONFLICT (id) DO NOTHING;
```
(Replace email with your email, or use NULL)

### 5. Test the App
```bash
npm run dev
```

Then open http://localhost:3000

## 🎯 Quick Checklist
- [ ] Added service_role key to `.env.local`
- [ ] Added OpenRouter API key to `.env.local`
- [ ] Ran database migration SQL
- [ ] Created default user
- [ ] Started dev server
- [ ] Created first persona
- [ ] Started chatting!

## 🐛 Troubleshooting

**"Failed to get response" in chat?**
- Check OpenRouter API key is correct
- Make sure you have credits in OpenRouter
- Check browser console for errors

**Database errors?**
- Verify migration SQL ran successfully
- Check Table Editor in Supabase to see if tables exist
- Make sure default user was created

**Can't create persona?**
- Make sure default user exists in database
- Check Supabase logs for errors

## 📞 Need Help?
Check `SETUP.md` for detailed instructions!

