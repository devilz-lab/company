# Troubleshooting Guide

## Error: "Sorry, I encountered an error"

### Most Common Issue: Missing OpenRouter API Key

**Problem:** Your `.env.local` file still has the placeholder value for OpenRouter API key.

**Solution:**
1. Go to https://openrouter.ai
2. Sign up/login and add credits
3. Go to Settings → Keys
4. Copy your API key (starts with `sk-or-v1-...`)
5. Open `.env.local` in your project
6. Replace `your_openrouter_api_key_here` with your actual key
7. Restart the dev server:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### Check Your Environment Variables

Run this to verify:
```bash
cat .env.local | grep OPENROUTER
```

Should show:
```
OPENROUTER_API_KEY=sk-or-v1-xxxxx...
```

NOT:
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Other Common Issues

**1. OpenRouter API Key Not Set**
- Error: "OpenRouter API error: Unauthorized"
- Fix: Add your actual API key to `.env.local`

**2. No Credits in OpenRouter**
- Error: "OpenRouter API error: Insufficient credits"
- Fix: Add credits to your OpenRouter account

**3. Database Connection Issues**
- Error: "Failed to create conversation"
- Fix: 
  - Verify Supabase URL and keys in `.env.local`
  - Make sure you ran the database migration
  - Check that default user exists

**4. Persona Not Found**
- Error: "Failed to get persona"
- Fix: Create a persona first (go to Personas page)

### Check Server Logs

Look at your terminal where `npm run dev` is running. You should see error messages there that will help identify the issue.

### Test OpenRouter Connection

You can test if your OpenRouter key works by checking the browser console (F12) → Network tab → Look for `/api/chat` request → Check the response.

### Still Having Issues?

1. Check browser console (F12) for errors
2. Check server terminal for error logs
3. Verify all environment variables are set correctly
4. Make sure you restarted the dev server after changing `.env.local`

