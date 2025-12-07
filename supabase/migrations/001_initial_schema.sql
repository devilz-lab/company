-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (single user for personal app)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  relationship_level INTEGER DEFAULT 1,
  total_conversations INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE
);

-- Personas table
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personality_traits JSONB NOT NULL DEFAULT '{}',
  communication_style TEXT NOT NULL,
  avatar_url TEXT,
  voice_id TEXT,
  color_scheme JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'quick',
  theme TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}'
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  reactions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Memories table (with strength system)
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL,
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  strength DECIMAL DEFAULT 1.0 CHECK (strength >= 0 AND strength <= 1),
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0
);

-- Kinks table
CREATE TABLE IF NOT EXISTS kinks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('interested', 'curious', 'limit', 'explored')),
  notes TEXT,
  exploration_count INTEGER DEFAULT 0,
  first_explored TIMESTAMP WITH TIME ZONE,
  last_explored TIMESTAMP WITH TIME ZONE
);

-- Scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  template_data JSONB,
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  companion_reflection TEXT
);

-- Proactive message schedules
CREATE TABLE IF NOT EXISTS message_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL,
  message_template TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sent TIMESTAMP WITH TIME ZONE,
  next_send TIMESTAMP WITH TIME ZONE
);

-- Proactive messages sent
CREATE TABLE IF NOT EXISTS proactive_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  responded BOOLEAN DEFAULT false
);

-- User patterns (for smart timing)
CREATE TABLE IF NOT EXISTS user_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence DECIMAL DEFAULT 0.5,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_persona_id ON conversations(persona_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_persona_id ON memories(persona_id);
CREATE INDEX IF NOT EXISTS idx_memories_strength ON memories(strength DESC);
CREATE INDEX IF NOT EXISTS idx_kinks_user_id ON kinks(user_id);
CREATE INDEX IF NOT EXISTS idx_kinks_status ON kinks(status);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON milestones(date DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for conversations
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Enable for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies (for single user, allow all - adjust based on your auth setup)
-- For now, we'll use service role key for server-side operations
-- You can add proper user-based policies when you implement auth

