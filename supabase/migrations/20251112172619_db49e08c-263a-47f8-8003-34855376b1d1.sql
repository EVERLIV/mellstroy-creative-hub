-- Add last_seen column (if not exists)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Set value for existing users
UPDATE profiles
SET last_seen = NOW()
WHERE last_seen IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);