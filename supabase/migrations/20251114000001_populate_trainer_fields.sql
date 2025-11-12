-- Script to add and populate trainer fields in profiles table
-- This script adds short_description, experience_years, and last_seen fields
-- and populates them with sample data for existing trainers

-- Step 1: Ensure columns exist (idempotent)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Set last_seen for existing users who don't have it
UPDATE profiles
SET last_seen = NOW() - (RANDOM() * INTERVAL '7 days')
WHERE last_seen IS NULL;

-- Step 3: Update trainers with sample data
-- Get all trainer IDs
DO $$
DECLARE
    trainer_record RECORD;
    experience_years_val INTEGER;
    last_seen_val TIMESTAMPTZ;
    short_descriptions TEXT[] := ARRAY[
        'Certified personal trainer with expertise in strength training and weight loss',
        'Professional yoga instructor specializing in Vinyasa and Hatha styles',
        'Experienced boxing coach with competitive background',
        'CrossFit Level 2 trainer focused on functional movement',
        'Swimming instructor with 10+ years teaching all levels',
        'Tennis pro with ATP coaching certification',
        'Dance fitness instructor bringing energy and fun to every class',
        'Running coach helping athletes achieve their marathon goals',
        'Pilates instructor certified in classical and contemporary methods',
        'MMA trainer with professional fighting experience'
    ];
    random_desc TEXT;
BEGIN
    -- Loop through all trainers
    FOR trainer_record IN 
        SELECT p.id, p.username, p.specialty
        FROM profiles p
        INNER JOIN user_roles ur ON p.id = ur.user_id
        WHERE ur.role = 'trainer'
    LOOP
        -- Generate random experience years (1-15)
        experience_years_val := FLOOR(RANDOM() * 15 + 1)::INTEGER;
        
        -- Generate random last_seen (between now and 2 days ago, weighted towards recent)
        -- 70% chance of being online (within last 5 minutes)
        IF RANDOM() < 0.7 THEN
            last_seen_val := NOW() - (RANDOM() * INTERVAL '5 minutes');
        ELSE
            last_seen_val := NOW() - (RANDOM() * INTERVAL '2 days');
        END IF;
        
        -- Pick random short description
        random_desc := short_descriptions[FLOOR(RANDOM() * array_length(short_descriptions, 1) + 1)];
        
        -- Update trainer profile
        UPDATE profiles
        SET 
            short_description = COALESCE(short_description, random_desc),
            experience_years = COALESCE(experience_years, experience_years_val),
            last_seen = COALESCE(last_seen, last_seen_val)
        WHERE id = trainer_record.id
        AND (short_description IS NULL OR experience_years IS NULL OR last_seen IS NULL);
        
    END LOOP;
END $$;

-- Step 4: Create index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);
CREATE INDEX IF NOT EXISTS idx_profiles_experience_years ON profiles(experience_years);

-- Step 5: Add comments
COMMENT ON COLUMN profiles.short_description IS 'Short description for trainer cards (max 150 characters)';
COMMENT ON COLUMN profiles.experience_years IS 'Years of experience as a trainer';
COMMENT ON COLUMN profiles.last_seen IS 'Last activity timestamp for online status';

-- Verification query (uncomment to check results)
-- SELECT 
--     id,
--     username,
--     short_description,
--     experience_years,
--     last_seen,
--     CASE 
--         WHEN last_seen > NOW() - INTERVAL '5 minutes' THEN 'Online'
--         ELSE 'Offline'
--     END as status
-- FROM profiles
-- WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'trainer')
-- LIMIT 10;

