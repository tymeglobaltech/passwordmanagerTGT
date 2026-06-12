ALTER TABLE passwords ADD COLUMN IF NOT EXISTS is_secured BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS password_access_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    password_id UUID NOT NULL REFERENCES passwords(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(password_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pac_password_id ON password_access_control(password_id);
CREATE INDEX IF NOT EXISTS idx_pac_user_id ON password_access_control(user_id);
