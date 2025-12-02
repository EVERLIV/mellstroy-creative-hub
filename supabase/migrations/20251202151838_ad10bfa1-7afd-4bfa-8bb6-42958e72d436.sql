-- Add event creation password column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS event_password TEXT;