-- Fix SECURITY DEFINER view issue by dropping and recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;
DROP VIEW IF EXISTS public.secure_bookings;
DROP VIEW IF EXISTS public.secure_events;
DROP VIEW IF EXISTS public.public_trainer_profiles;

-- Recreate views with SECURITY INVOKER (default, safer)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
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
  CASE WHEN p.id = auth.uid() THEN p.phone ELSE NULL END as phone,
  CASE WHEN p.id = auth.uid() THEN p.age ELSE NULL END as age,
  CASE WHEN p.id = auth.uid() THEN p.height ELSE NULL END as height,
  CASE WHEN p.id = auth.uid() THEN p.weight ELSE NULL END as weight,
  CASE WHEN p.id = auth.uid() THEN p.event_password ELSE NULL END as event_password
FROM public.profiles p;

CREATE VIEW public.secure_bookings 
WITH (security_invoker = true)
AS
SELECT 
  b.id,
  b.class_id,
  b.client_id,
  b.booking_date,
  b.booking_time,
  b.status,
  b.has_left_review,
  b.created_at,
  b.updated_at,
  b.verified_at,
  b.verified_by,
  b.cancelled_by,
  b.cancelled_at,
  b.cancellation_reason,
  CASE 
    WHEN b.client_id = auth.uid() THEN b.verification_code
    WHEN EXISTS (
      SELECT 1 FROM public.classes c 
      WHERE c.id = b.class_id AND c.trainer_id = auth.uid()
    ) THEN b.verification_code
    ELSE NULL
  END as verification_code
FROM public.bookings b;

CREATE VIEW public.secure_events 
WITH (security_invoker = true)
AS
SELECT 
  e.id,
  e.title,
  e.description,
  e.organizer_id,
  e.date,
  e.time,
  e.location,
  e.district,
  e.image_url,
  e.status,
  e.event_type,
  e.sport_category,
  e.price,
  e.max_participants,
  e.participant_count,
  e.premium_only,
  e.created_at,
  e.updated_at,
  CASE 
    WHEN e.organizer_id = auth.uid() THEN e.event_password
    ELSE NULL
  END as event_password
FROM public.events e;