-- Add full_name column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Add password setup token columns for external user onboarding
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_setup_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_setup_expires TIMESTAMP;
