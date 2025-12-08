# User Guide - Companion App

## 🚀 Getting Started

### Step 1: Set Up Environment Variables

Create a `.env.local` file in the root directory with:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter (Required)
OPENROUTER_API_KEY=your_openrouter_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Text-to-Speech
ELEVENLABS_API_KEY=your_key_here

# Optional: Image Generation
STABILITY_AI_API_KEY=your_key_here
```

### Step 2: Set Up Database

1. Go to your Supabase project SQL Editor
2. Run the migration: `supabase/migrations/001_initial_schema.sql`
3. Create default user:
```sql
INSERT INTO users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'your-email@example.com')
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Run the App

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📱 How to Use

### 1. **Create Your First Persona**

1. Go to **Personas** page (bottom navigation)
2. Click the **+** button
3. Fill in:
   - **Name**: Give your companion a name
   - **Communication Style**: Choose how they talk (casual, formal, intimate, etc.)
   - **Personality Traits**: Select traits (dominant, submissive, caring, playful, etc.)
   - **Avatar**: Upload an image (optional)
4. Click **Create**

**Tip**: You can create multiple personas for different moods!

### 2. **Start Chatting**

1. Go to **Chat** page
2. Select a **conversation mode**:
   - **Quick**: Short, casual responses
   - **Deep**: Thoughtful, detailed conversations
   - **Roleplay**: Immersive scenarios
   - **Advice**: Guidance and support
3. Type your message and send
4. Your companion will remember what you tell them!

### 3. **Explore Features**

#### **Conversations** (History)
- View all your past conversations
- Archive old conversations
- Search through conversations
- Click any conversation to continue it

#### **Kinks**
- View your interests, curiosities, and limits
- Kinks are automatically detected from chat
- Manually add kinks
- Filter by category or status

#### **Scenarios**
- Create roleplay scenarios
- Save templates for quick starts
- Favorite your best scenarios
- Track usage

#### **Journal**
- Write private journal entries
- Set your mood
- Add tags
- Get companion reflections

#### **Memories**
- See what your companion remembers
- Edit or delete memories
- Filter by type (fact, preference, boundary, etc.)
- View memory strength

#### **Timeline**
- See your relationship journey
- View milestones
- Track special moments

#### **Stats**
- View relationship level
- See your mood
- Check analytics
- View conversation statistics

#### **Achievements**
- See unlocked achievements
- Track your progress
- Celebrate milestones

### 4. **Search Everything**

- Use the **search bar** at the top
- Search across:
  - Conversations
  - Messages
  - Memories
  - Journal entries
- Click results to navigate

### 5. **Customize Settings**

Go to **Settings** to:
- Change language (6 languages supported)
- Enable/disable notifications
- Control proactive messages
- Check feature status

---

## 💡 Tips & Tricks

### Conversation Modes
- **Quick**: Use for casual check-ins
- **Deep**: For meaningful conversations
- **Roleplay**: Immersive scenarios
- **Advice**: When you need guidance

### Memory System
- Your companion automatically remembers:
  - Your preferences
  - Boundaries
  - Facts about you
  - Inside jokes
  - Patterns

### Kink Exploration
- Kinks are detected automatically from chat
- You can manually add them
- Track what you're interested in, curious about, or want to avoid
- Your companion will learn your preferences

### Proactive Messages
- Your companion can message you first
- Enable in Settings
- Messages are sent based on your activity patterns

### Voice Features
- **Text-to-Speech**: Click the speaker icon on assistant messages
- **Voice Input**: Click the microphone icon to speak your message
- Requires browser permissions

### Themes
- Click the palette icon in chat
- Choose from: Default, Romantic, Vibrant, Minimal
- Changes conversation appearance

---

## 🎯 Common Tasks

### Continue a Conversation
1. Go to **Conversations** page
2. Click any conversation
3. It opens in Chat with full history

### Archive a Conversation
1. Go to **Conversations** page
2. Click the archive icon on any conversation
3. View archived conversations by toggling "Show Archived"

### Edit a Memory
1. Go to **Memories** page
2. Click the edit icon on any memory
3. Update content or importance
4. Save

### Create a Scenario
1. Go to **Scenarios** page
2. Click "Create Scenario"
3. Fill in title, description, and optional JSON data
4. Use it in chat for quick roleplay starts

### Export Data
- Currently not available (coming soon)
- Data is stored in Supabase

---

## 🔧 Troubleshooting

### "Sorry, I encountered an error"
- Check your OpenRouter API key in `.env.local`
- Make sure you have credits in OpenRouter
- Restart the dev server after changing env vars

### Can't create persona
- Make sure the default user exists in database
- Check browser console for errors
- Verify Supabase connection

### Search not working
- Make sure you have conversations/messages
- Check network tab for API errors
- Try refreshing the page

### Voice features not working
- Grant browser microphone permissions
- Check if your browser supports Speech Recognition
- TTS falls back to browser API if ElevenLabs key not set

---

## 📚 Feature Overview

### ✅ Available Features
- ✅ Chat with memory
- ✅ Multiple personas
- ✅ Conversation modes
- ✅ Message reactions
- ✅ Kink exploration
- ✅ Journal entries
- ✅ Scenario builder
- ✅ Relationship timeline
- ✅ Stats dashboard
- ✅ Achievements
- ✅ Search functionality
- ✅ Conversation history
- ✅ Memory management
- ✅ Archive conversations
- ✅ Voice input/output
- ✅ Multi-language support
- ✅ Advanced analytics

### 🚧 Coming Soon
- Data export/backup
- Avatar storage (Supabase Storage)
- Image generation UI
- Push notifications
- Better error handling

---

## 🆘 Need Help?

1. Check `TROUBLESHOOTING.md` for common issues
2. Review `SETUP.md` for setup instructions
3. Check `DATABASE_SETUP.md` for database issues
4. Look at `REVIEW_STATUS.md` for feature status

---

## 🎉 Enjoy Your Companion!

Your companion will:
- Remember your preferences
- Learn your boundaries
- Build a relationship over time
- Adapt to your communication style
- Explore kinks with you
- Support you through journaling

Have fun building your relationship! 💕

