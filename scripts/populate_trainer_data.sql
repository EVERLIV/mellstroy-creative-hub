-- Script to populate trainer profiles with sample data
-- Run this script in Supabase SQL Editor to add test data

-- Update existing trainers with sample data
UPDATE profiles
SET 
    short_description = CASE 
        WHEN specialty @> ARRAY['Yoga'] THEN 'Certified yoga instructor with expertise in Vinyasa and Hatha styles. Helping students find balance and strength.'
        WHEN specialty @> ARRAY['Boxing'] THEN 'Professional boxing coach with competitive background. Training champions for over a decade.'
        WHEN specialty @> ARRAY['CrossFit'] THEN 'CrossFit Level 2 trainer focused on functional movement and high-intensity workouts.'
        WHEN specialty @> ARRAY['Swimming'] THEN 'Swimming instructor with 10+ years teaching all levels from beginners to competitive swimmers.'
        WHEN specialty @> ARRAY['Tennis'] THEN 'Tennis pro with ATP coaching certification. Specializing in technique and match strategy.'
        WHEN specialty @> ARRAY['Running'] THEN 'Running coach helping athletes achieve their marathon and personal best goals.'
        WHEN specialty @> ARRAY['Strength Training'] THEN 'Certified personal trainer with expertise in strength training and weight loss programs.'
        WHEN specialty @> ARRAY['Dance Fitness'] THEN 'Dance fitness instructor bringing energy and fun to every class. No experience needed!'
        WHEN specialty @> ARRAY['Pilates'] THEN 'Pilates instructor certified in classical and contemporary methods. Core strength specialist.'
        WHEN specialty @> ARRAY['MMA'] THEN 'MMA trainer with professional fighting experience. Teaching self-defense and combat sports.'
        ELSE 'Experienced fitness professional dedicated to helping you achieve your goals.'
    END,
    experience_years = CASE 
        WHEN id = (SELECT user_id FROM user_roles WHERE role = 'trainer' LIMIT 1 OFFSET 0) THEN 8
        WHEN id = (SELECT user_id FROM user_roles WHERE role = 'trainer' LIMIT 1 OFFSET 1) THEN 5
        WHEN id = (SELECT user_id FROM user_roles WHERE role = 'trainer' LIMIT 1 OFFSET 2) THEN 12
        WHEN id = (SELECT user_id FROM user_roles WHERE role = 'trainer' LIMIT 1 OFFSET 3) THEN 3
        WHEN id = (SELECT user_id FROM user_roles WHERE role = 'trainer' LIMIT 1 OFFSET 4) THEN 15
        ELSE FLOOR(RANDOM() * 12 + 2)::INTEGER
    END,
    last_seen = CASE 
        -- Make some trainers online (seen within last 5 minutes)
        WHEN id IN (
            SELECT user_id FROM user_roles WHERE role = 'trainer' LIMIT 3
        ) THEN NOW() - (RANDOM() * INTERVAL '5 minutes')
        -- Others seen recently (within last hour)
        WHEN id IN (
            SELECT user_id FROM user_roles WHERE role = 'trainer' LIMIT 5 OFFSET 3
        ) THEN NOW() - (RANDOM() * INTERVAL '1 hour')
        -- Some seen today
        ELSE NOW() - (RANDOM() * INTERVAL '12 hours')
    END
WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'trainer')
AND (short_description IS NULL OR experience_years IS NULL OR last_seen IS NULL);

-- Set last_seen for all trainers if still null
UPDATE profiles
SET last_seen = NOW() - (RANDOM() * INTERVAL '2 days')
WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'trainer')
AND last_seen IS NULL;

-- Verify the updates
SELECT 
    p.id,
    p.username,
    p.short_description,
    p.experience_years,
    p.last_seen,
    CASE 
        WHEN p.last_seen > NOW() - INTERVAL '5 minutes' THEN '🟢 Online'
        WHEN p.last_seen > NOW() - INTERVAL '1 hour' THEN '🟡 Seen recently'
        WHEN p.last_seen > NOW() - INTERVAL '1 day' THEN '⚪ Seen today'
        ELSE '⚫ Offline'
    END as status
FROM profiles p
INNER JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'trainer'
ORDER BY p.last_seen DESC
LIMIT 20;

