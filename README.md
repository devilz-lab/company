# Companion App

A personal NSFW companion app with memory, multiple personas, and relationship building features.

## Features

- 💬 **Chat Interface** - Real-time conversations with streaming responses
- 👥 **Multiple Personas** - Switch between different companion personalities
- 🧠 **Memory System** - Remembers preferences, boundaries, and conversations
- 📊 **Visual Timeline** - See your relationship journey
- 🔍 **Kink Explorer** - Discover and track interests
- 📈 **Stats Dashboard** - Visualize your interactions
- ⏰ **Proactive Messaging** - Companion initiates conversations
- 📱 **Mobile-First** - Optimized for mobile devices
- 🌙 **Dark Mode** - Default dark theme

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/001_initial_schema.sql`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /(main)          # Main app routes
    /chat          # Chat interface
    /personas      # Persona management
    /timeline      # Relationship timeline
    /stats         # Statistics dashboard
    /settings      # Settings
  /api             # API routes
    /chat          # Chat endpoint
    /memories      # Memory management
    /personas      # Persona CRUD
/components        # React components
/lib
  /supabase        # Supabase client
  /openrouter      # OpenRouter integration
  /memory          # Memory system
/types             # TypeScript types
/supabase
  /migrations      # Database migrations
```

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database & backend
- **OpenRouter** - LLM API
- **React Hook Form** - Form handling
- **Zod** - Validation

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Notes

- This is a personal app - single user setup
- Default user ID is used (implement auth for production)
- Memory extraction is pattern-based (can be enhanced with LLM)
- Proactive messaging requires cron job setup

## Future Features

- [ ] Text-to-speech integration
- [ ] Image generation
- [ ] Voice input
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Export functionality

