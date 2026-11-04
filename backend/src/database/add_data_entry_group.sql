-- Ensure the "Data Entry" group exists
INSERT INTO groups (name)
VALUES ('Data Entry')
ON CONFLICT (name) DO NOTHING;

-- Preview which passwords this will affect
SELECT id, title, is_secured
FROM passwords
WHERE title ILIKE 'Date Entry Account Log%'
  AND is_active = true;

-- Grant the Data Entry group access to those passwords, alongside Tier1
INSERT INTO password_group_access (password_id, group_id)
SELECT p.id, g.id
FROM passwords p
JOIN groups g ON g.name = 'Data Entry'
WHERE p.title ILIKE 'Date Entry Account Log%'
  AND p.is_active = true
ON CONFLICT (password_id, group_id) DO NOTHING;
