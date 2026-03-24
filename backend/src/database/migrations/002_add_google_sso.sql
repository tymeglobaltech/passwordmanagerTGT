-- Make password_hash nullable for SSO-only users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add auth_provider column (local, google, both)
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(10) NOT NULL DEFAULT 'local'
    CHECK (auth_provider IN ('local', 'google', 'both'));

-- Add google_id column for Google sub ID verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
