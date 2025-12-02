-- Add event privacy columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS premium_only BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_password TEXT;