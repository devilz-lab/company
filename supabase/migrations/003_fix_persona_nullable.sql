-- Fix: Allow persona_id to be NULL in conversations for shared conversations
-- This allows conversations without a specific persona (using shared memories)

ALTER TABLE conversations 
ALTER COLUMN persona_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN conversations.persona_id IS 'NULL = shared conversation (uses shared memories), UUID = persona-specific conversation';

