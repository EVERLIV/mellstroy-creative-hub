-- Add trainer profile enhancement columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Populate short descriptions and experience years for trainers
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

-- Set realistic last_seen timestamps
WITH trainer_ids AS (
  SELECT p.id, ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
  FROM profiles p
  INNER JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.role = 'trainer'
),
trainer_stats AS (
  SELECT COUNT(*) as total FROM trainer_ids
)
UPDATE profiles p
SET last_seen = CASE 
  -- First 30% - online (active in last 5 minutes)
  WHEN p.id IN (
    SELECT id FROM trainer_ids 
    WHERE rn <= (SELECT CEIL(total * 0.3) FROM trainer_stats)
  ) THEN NOW() - (RANDOM() * INTERVAL '4 minutes')
  
  -- Next 30% - seen 10-60 minutes ago
  WHEN p.id IN (
    SELECT id FROM trainer_ids 
    WHERE rn > (SELECT CEIL(total * 0.3) FROM trainer_stats)
    AND rn <= (SELECT CEIL(total * 0.6) FROM trainer_stats)
  ) THEN NOW() - (INTERVAL '30 minutes' + RANDOM() * INTERVAL '30 minutes')
  
  -- Next 20% - seen 2-6 hours ago
  WHEN p.id IN (
    SELECT id FROM trainer_ids 
    WHERE rn > (SELECT CEIL(total * 0.6) FROM trainer_stats)
    AND rn <= (SELECT CEIL(total * 0.8) FROM trainer_stats)
  ) THEN NOW() - (INTERVAL '2 hours' + RANDOM() * INTERVAL '4 hours')
  
  -- Rest - seen 1-7 days ago
  ELSE NOW() - (INTERVAL '1 day' + RANDOM() * INTERVAL '6 days')
END
FROM trainer_ids ti
WHERE p.id = ti.id
AND (p.last_seen IS NULL OR p.last_seen < NOW() - INTERVAL '1 day');

-- Ensure all trainers have last_seen
UPDATE profiles
SET last_seen = COALESCE(last_seen, NOW() - (RANDOM() * INTERVAL '7 days'))
WHERE id IN (
  SELECT p.id 
  FROM profiles p
  INNER JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.role = 'trainer'
)
AND last_seen IS NULL;