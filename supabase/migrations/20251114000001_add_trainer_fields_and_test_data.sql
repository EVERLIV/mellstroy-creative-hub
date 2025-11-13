-- Add new fields to profiles table for trainers (if not exists)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Set default last_seen for existing users
UPDATE profiles
SET last_seen = NOW()
WHERE last_seen IS NULL;

-- Create index on last_seen for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

-- Add comment to columns
COMMENT ON COLUMN profiles.short_description IS 'Short description for trainer cards (max 150 characters)';
COMMENT ON COLUMN profiles.experience_years IS 'Years of experience as a trainer';
COMMENT ON COLUMN profiles.last_seen IS 'Last activity timestamp for online status';

-- Update existing trainers with test data (if they don't have these fields filled)
-- This will update trainers who have trainer role but missing short_description or experience_years

-- First, let's update trainers with short descriptions and experience years
UPDATE profiles
SET 
  short_description = CASE 
    WHEN specialty @> ARRAY['Yoga'] THEN 'Certified yoga instructor with expertise in Vinyasa and Hatha styles. Helping students find balance and flexibility.'
    WHEN specialty @> ARRAY['Boxing'] THEN 'Professional boxing coach with competitive experience. Training athletes and fitness enthusiasts of all levels.'
    WHEN specialty @> ARRAY['Tennis'] THEN 'Former professional tennis player turned coach. Specializing in technique improvement and match strategy.'
    WHEN specialty @> ARRAY['Gym'] OR specialty @> ARRAY['Strength Training'] THEN 'Personal trainer focused on strength building and body transformation. Customized programs for every goal.'
    WHEN specialty @> ARRAY['Running'] THEN 'Marathon runner and running coach. Helping runners achieve their distance and speed goals.'
    WHEN specialty @> ARRAY['Swimming'] THEN 'Swimming instructor and competitive swimmer. Teaching proper technique and endurance training.'
    ELSE 'Experienced fitness professional dedicated to helping clients achieve their health and wellness goals.'
  END,
  experience_years = CASE 
    WHEN specialty @> ARRAY['Yoga'] THEN 8
    WHEN specialty @> ARRAY['Boxing'] THEN 12
    WHEN specialty @> ARRAY['Tennis'] THEN 15
    WHEN specialty @> ARRAY['Gym'] OR specialty @> ARRAY['Strength Training'] THEN 10
    WHEN specialty @> ARRAY['Running'] THEN 7
    WHEN specialty @> ARRAY['Swimming'] THEN 9
    ELSE 5
  END,
  last_seen = CASE 
    -- Some trainers online (within last 5 minutes)
    WHEN id IN (SELECT id FROM profiles WHERE role = 'trainer' LIMIT 3) THEN NOW() - INTERVAL '2 minutes'
    -- Some trainers seen recently (10-30 minutes ago)
    WHEN id IN (SELECT id FROM profiles WHERE role = 'trainer' OFFSET 3 LIMIT 3) THEN NOW() - INTERVAL '15 minutes'
    -- Some trainers seen hours ago
    WHEN id IN (SELECT id FROM profiles WHERE role = 'trainer' OFFSET 6 LIMIT 2) THEN NOW() - INTERVAL '3 hours'
    -- Rest seen days ago
    ELSE NOW() - INTERVAL '2 days'
  END
WHERE id IN (
  SELECT p.id 
  FROM profiles p
  INNER JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.role = 'trainer'
  AND (p.short_description IS NULL OR p.experience_years IS NULL)
)
AND (short_description IS NULL OR experience_years IS NULL);

-- Update last_seen for all trainers to have realistic timestamps
-- This ensures all trainers have a last_seen value
UPDATE profiles
SET last_seen = COALESCE(
  last_seen,
  NOW() - (RANDOM() * INTERVAL '7 days')
)
WHERE id IN (
  SELECT p.id 
  FROM profiles p
  INNER JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.role = 'trainer'
);



