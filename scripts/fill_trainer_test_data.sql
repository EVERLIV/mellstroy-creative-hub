-- Script to fill trainer profiles with test data
-- Run this script in Supabase SQL Editor to populate trainer data

-- Step 1: Ensure columns exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Update existing trainers with test data based on their specialty
UPDATE profiles
SET 
  short_description = CASE 
    WHEN specialty @> ARRAY['Yoga'] THEN 'Certified yoga instructor with expertise in Vinyasa and Hatha styles. Helping students find balance and flexibility.'
    WHEN specialty @> ARRAY['Pilates'] THEN 'Pilates instructor focused on core strength and body alignment. Transform your body with controlled movements.'
    WHEN specialty @> ARRAY['Boxing'] THEN 'Professional boxing coach with competitive experience. Training athletes and fitness enthusiasts of all levels.'
    WHEN specialty @> ARRAY['MMA'] THEN 'MMA coach and former fighter. Teaching striking, grappling, and self-defense techniques.'
    WHEN specialty @> ARRAY['Tennis'] THEN 'Former professional tennis player turned coach. Specializing in technique improvement and match strategy.'
    WHEN specialty @> ARRAY['Badminton'] THEN 'Badminton coach with tournament experience. Improving your game with proper technique and strategy.'
    WHEN specialty @> ARRAY['Gym'] OR specialty @> ARRAY['Strength Training'] OR specialty @> ARRAY['Gym Coach'] THEN 'Personal trainer focused on strength building and body transformation. Customized programs for every goal.'
    WHEN specialty @> ARRAY['Running'] THEN 'Marathon runner and running coach. Helping runners achieve their distance and speed goals.'
    WHEN specialty @> ARRAY['Swimming'] THEN 'Swimming instructor and competitive swimmer. Teaching proper technique and endurance training.'
    WHEN specialty @> ARRAY['HIIT'] THEN 'HIIT specialist creating high-intensity workouts for maximum results in minimal time.'
    WHEN specialty @> ARRAY['CrossFit'] THEN 'CrossFit Level 2 trainer. Building functional fitness and community through challenging workouts.'
    WHEN specialty @> ARRAY['Dance Fitness'] THEN 'Dance fitness instructor making workouts fun and energetic. Move your body to the beat!'
    WHEN specialty @> ARRAY['Personal Training'] THEN 'Certified personal trainer creating customized programs tailored to your unique goals and needs.'
    ELSE 'Experienced fitness professional dedicated to helping clients achieve their health and wellness goals.'
  END,
  experience_years = CASE 
    WHEN specialty @> ARRAY['Yoga'] THEN 8
    WHEN specialty @> ARRAY['Pilates'] THEN 6
    WHEN specialty @> ARRAY['Boxing'] THEN 12
    WHEN specialty @> ARRAY['MMA'] THEN 10
    WHEN specialty @> ARRAY['Tennis'] THEN 15
    WHEN specialty @> ARRAY['Badminton'] THEN 7
    WHEN specialty @> ARRAY['Gym'] OR specialty @> ARRAY['Strength Training'] OR specialty @> ARRAY['Gym Coach'] THEN 10
    WHEN specialty @> ARRAY['Running'] THEN 7
    WHEN specialty @> ARRAY['Swimming'] THEN 9
    WHEN specialty @> ARRAY['HIIT'] THEN 5
    WHEN specialty @> ARRAY['CrossFit'] THEN 8
    WHEN specialty @> ARRAY['Dance Fitness'] THEN 6
    WHEN specialty @> ARRAY['Personal Training'] THEN 11
    ELSE 5
  END
WHERE id IN (
  SELECT p.id 
  FROM profiles p
  INNER JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.role = 'trainer'
)
AND (short_description IS NULL OR experience_years IS NULL);

-- Step 3: Set realistic last_seen timestamps for trainers
-- This creates variety: some online, some seen recently, some seen hours/days ago
DO $$
DECLARE
  trainer_count INTEGER;
  online_count INTEGER;
  recent_count INTEGER;
  hours_count INTEGER;
BEGIN
  -- Count total trainers
  SELECT COUNT(*) INTO trainer_count
  FROM profiles p
  INNER JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.role = 'trainer';
  
  -- Calculate counts for each group
  online_count := CEIL(trainer_count * 0.3);
  recent_count := CEIL(trainer_count * 0.3);
  hours_count := CEIL(trainer_count * 0.2);
  
  -- Update trainers: 30% online (within last 5 minutes)
  UPDATE profiles
  SET last_seen = NOW() - (RANDOM() * INTERVAL '4 minutes')
  WHERE id IN (
    SELECT p.id 
    FROM profiles p
    INNER JOIN user_roles ur ON p.id = ur.user_id
    WHERE ur.role = 'trainer'
    ORDER BY RANDOM()
    LIMIT online_count
  );
  
  -- Update trainers: 30% seen 10-60 minutes ago
  UPDATE profiles
  SET last_seen = NOW() - (INTERVAL '30 minutes' + RANDOM() * INTERVAL '30 minutes')
  WHERE id IN (
    SELECT p.id 
    FROM profiles p
    INNER JOIN user_roles ur ON p.id = ur.user_id
    WHERE ur.role = 'trainer'
    AND (last_seen IS NULL OR last_seen < NOW() - INTERVAL '1 hour')
    ORDER BY RANDOM()
    LIMIT recent_count
  );
  
  -- Update trainers: 20% seen 2-6 hours ago
  UPDATE profiles
  SET last_seen = NOW() - (INTERVAL '2 hours' + RANDOM() * INTERVAL '4 hours')
  WHERE id IN (
    SELECT p.id 
    FROM profiles p
    INNER JOIN user_roles ur ON p.id = ur.user_id
    WHERE ur.role = 'trainer'
    AND (last_seen IS NULL OR last_seen < NOW() - INTERVAL '6 hours')
    ORDER BY RANDOM()
    LIMIT hours_count
  );
  
  -- Rest: seen 1-7 days ago
  UPDATE profiles
  SET last_seen = NOW() - (INTERVAL '1 day' + RANDOM() * INTERVAL '6 days')
  WHERE id IN (
    SELECT p.id 
    FROM profiles p
    INNER JOIN user_roles ur ON p.id = ur.user_id
    WHERE ur.role = 'trainer'
    AND (last_seen IS NULL OR last_seen < NOW() - INTERVAL '1 day')
  );
END $$;

-- Step 4: Ensure all trainers have last_seen set (fallback)
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
)
AND last_seen IS NULL;

-- Verification query: Check the results
SELECT 
  p.id,
  p.username,
  p.specialty,
  p.short_description,
  p.experience_years,
  p.last_seen,
  CASE 
    WHEN p.last_seen > NOW() - INTERVAL '5 minutes' THEN 'Online'
    WHEN p.last_seen > NOW() - INTERVAL '1 hour' THEN 'Seen ' || EXTRACT(EPOCH FROM (NOW() - p.last_seen))::int / 60 || ' min ago'
    WHEN p.last_seen > NOW() - INTERVAL '1 day' THEN 'Seen ' || EXTRACT(EPOCH FROM (NOW() - p.last_seen))::int / 3600 || ' hours ago'
    ELSE 'Seen ' || EXTRACT(EPOCH FROM (NOW() - p.last_seen))::int / 86400 || ' days ago'
  END as status
FROM profiles p
INNER JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'trainer'
ORDER BY p.last_seen DESC NULLS LAST
LIMIT 20;

