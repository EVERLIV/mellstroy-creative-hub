-- Fix: Drop duplicate policy check issue - the policy already exists from earlier
-- Just ensure the ALL policy is removed
DROP POLICY IF EXISTS "System can manage cancellation counts" ON public.booking_cancellations_tracker;

-- Create secure view for profiles hiding sensitive personal data from public
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  p.id,
  p.username,
  p.avatar_url,
  p.bio,
  p.location,
  p.district,
  p.specialty,
  p.price_per_hour,
  p.rating,
  p.reviews_count,
  p.is_verified,
  p.is_premium,
  p.experience_years,
  p.short_description,
  p.last_seen,
  p.created_at,
  p.interests,
  p.goals,
  -- Hide sensitive fields from non-owners
  CASE WHEN p.id = auth.uid() THEN p.phone ELSE NULL END as phone,
  CASE WHEN p.id = auth.uid() THEN p.age ELSE NULL END as age,
  CASE WHEN p.id = auth.uid() THEN p.height ELSE NULL END as height,
  CASE WHEN p.id = auth.uid() THEN p.weight ELSE NULL END as weight,
  CASE WHEN p.id = auth.uid() THEN p.event_password ELSE NULL END as event_password
FROM public.profiles p;