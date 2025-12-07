-- Quick fix: Create default user with proper UUID format
-- Run this in Supabase SQL Editor after the migration

INSERT INTO users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000001', NULL)
ON CONFLICT (id) DO NOTHING;

-- Verify it was created
SELECT * FROM users WHERE id = '00000000-0000-0000-0000-000000000001';

