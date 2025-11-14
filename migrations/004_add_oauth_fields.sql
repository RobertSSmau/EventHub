-- Migration: Add OAuth fields to users table
-- Date: 2025-11-14

-- Add google_id column
ALTER TABLE users
ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- Add provider column with check constraint
ALTER TABLE users
ADD COLUMN provider VARCHAR(10) DEFAULT 'local' CHECK (provider IN ('local', 'google'));

-- Make password_hash nullable for OAuth users
ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

-- Set email_verified to true for OAuth users by default
-- This will be handled in the application logic