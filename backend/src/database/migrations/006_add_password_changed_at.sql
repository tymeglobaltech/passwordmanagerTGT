-- Track when a user's password was last set, so external user passwords can expire
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

-- Start the expiry clock now for existing accounts that already have a password.
-- Only touches rows still NULL, so it is safe to re-run on every deploy.
UPDATE users SET password_changed_at = CURRENT_TIMESTAMP WHERE password_changed_at IS NULL AND password_hash IS NOT NULL;
