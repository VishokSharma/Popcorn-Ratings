-- ============================================
-- MIGRATION: Add password_hash column
-- ============================================
-- 
-- WHY: Store hashed passwords for authentication
-- 
-- SECURITY: Never store plain text passwords!
-- We use bcrypt hashing (one-way, cannot be reversed)

-- Add password_hash column to users table
ALTER TABLE users 
ADD COLUMN password_hash VARCHAR(255);

-- Make it required for new users (after we populate existing ones)
-- We'll run this after setting passwords for test users
-- ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

