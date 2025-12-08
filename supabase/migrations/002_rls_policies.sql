-- Row Level Security Policies
-- Run this after the initial schema migration

-- Enable RLS on all tables (if not already enabled)
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
-- ALTER TABLE exports ENABLE ROW LEVEL SECURITY; -- Table doesn't exist yet

-- Users: Allow all operations for the default user
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (id = '00000000-0000-0000-0000-000000000001');

-- Personas: Allow all operations for the default user
CREATE POLICY "Users can read own personas" ON personas
  FOR SELECT USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can insert own personas" ON personas
  FOR INSERT WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update own personas" ON personas
  FOR UPDATE USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can delete own personas" ON personas
  FOR DELETE USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Conversations: Allow all operations for the default user
CREATE POLICY "Users can read own conversations" ON conversations
  FOR SELECT USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Messages: Allow all operations for the default user
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = '00000000-0000-0000-0000-000000000001'
    )
  );

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = '00000000-0000-0000-0000-000000000001'
    )
  );

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = '00000000-0000-0000-0000-000000000001'
    )
  );

CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = '00000000-0000-0000-0000-000000000001'
    )
  );

-- Memories: Allow all operations for the default user
CREATE POLICY "Users can read own memories" ON memories
  FOR SELECT USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can insert own memories" ON memories
  FOR INSERT WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update own memories" ON memories
  FOR UPDATE USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can delete own memories" ON memories
  FOR DELETE USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Kinks: Allow all operations for the default user
CREATE POLICY "Users can read own kinks" ON kinks
  FOR SELECT USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can insert own kinks" ON kinks
  FOR INSERT WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update own kinks" ON kinks
  FOR UPDATE USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can delete own kinks" ON kinks
  FOR DELETE USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Scenarios: Allow all operations for the default user
CREATE POLICY "Users can read own scenarios" ON scenarios
  FOR SELECT USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can insert own scenarios" ON scenarios
  FOR INSERT WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update own scenarios" ON scenarios
  FOR UPDATE USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can delete own scenarios" ON scenarios
  FOR DELETE USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Milestones: Allow all operations for the default user
CREATE POLICY "Users can read own milestones" ON milestones
  FOR SELECT USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can insert own milestones" ON milestones
  FOR INSERT WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update own milestones" ON milestones
  FOR UPDATE USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can delete own milestones" ON milestones
  FOR DELETE USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Achievements: Allow all operations for the default user
CREATE POLICY "Users can read own achievements" ON achievements
  FOR SELECT USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update own achievements" ON achievements
  FOR UPDATE USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can delete own achievements" ON achievements
  FOR DELETE USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Journal entries: Allow all operations for the default user
CREATE POLICY "Users can read own journal entries" ON journal_entries
  FOR SELECT USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can insert own journal entries" ON journal_entries
  FOR INSERT WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update own journal entries" ON journal_entries
  FOR UPDATE USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can delete own journal entries" ON journal_entries
  FOR DELETE USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Message schedules: Allow all operations for the default user
CREATE POLICY "Users can read own message schedules" ON message_schedules
  FOR SELECT USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can insert own message schedules" ON message_schedules
  FOR INSERT WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update own message schedules" ON message_schedules
  FOR UPDATE USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can delete own message schedules" ON message_schedules
  FOR DELETE USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Proactive messages: Allow all operations for the default user
CREATE POLICY "Users can read own proactive messages" ON proactive_messages
  FOR SELECT USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can insert own proactive messages" ON proactive_messages
  FOR INSERT WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update own proactive messages" ON proactive_messages
  FOR UPDATE USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can delete own proactive messages" ON proactive_messages
  FOR DELETE USING (user_id = '00000000-0000-0000-0000-000000000001');

-- User patterns: Allow all operations for the default user
CREATE POLICY "Users can read own user patterns" ON user_patterns
  FOR SELECT USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can insert own user patterns" ON user_patterns
  FOR INSERT WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can update own user patterns" ON user_patterns
  FOR UPDATE USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can delete own user patterns" ON user_patterns
  FOR DELETE USING (user_id = '00000000-0000-0000-0000-000000000001');

-- Exports: Allow all operations for the default user (table doesn't exist yet)
-- CREATE POLICY "Users can read own exports" ON exports
--   FOR SELECT USING (user_id = '00000000-0000-0000-0000-000000000001');
--
-- CREATE POLICY "Users can insert own exports" ON exports
--   FOR INSERT WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');
--
-- CREATE POLICY "Users can update own exports" ON exports
--   FOR UPDATE USING (user_id = '00000000-0000-0000-0000-000000000001');
--
-- CREATE POLICY "Users can delete own exports" ON exports
--   FOR DELETE USING (user_id = '00000000-0000-0000-0000-000000000001');

