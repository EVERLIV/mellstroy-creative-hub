-- Update events table for premium user events functionality
-- Allow premium users to create events for finding partners, groups, sparring, etc.

-- Add new columns to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'general';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_participants INTEGER;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0;

-- Add comment for event_type
COMMENT ON COLUMN public.events.event_type IS 'Type of event: partner_search, sparring, group_class, ride, competition, general';

-- Create event_participants table (rename from event_interests for clarity)
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_participants
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_participants
CREATE POLICY "Anyone can view event participants"
  ON public.event_participants FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join events"
  ON public.event_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events they joined"
  ON public.event_participants FOR DELETE
  USING (auth.uid() = user_id);

-- Update events RLS policies to allow premium users to create events
DROP POLICY IF EXISTS "Trainers can create events" ON public.events;
DROP POLICY IF EXISTS "Trainers can update own events" ON public.events;

CREATE POLICY "Premium users can create events"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() = organizer_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_premium = true)
  );

CREATE POLICY "Users can update own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = organizer_id);

-- Function to update participant count
CREATE OR REPLACE FUNCTION public.update_event_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events 
    SET participant_count = participant_count + 1 
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events 
    SET participant_count = participant_count - 1 
    WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to update participant count
DROP TRIGGER IF EXISTS update_event_participants_count ON public.event_participants;
CREATE TRIGGER update_event_participants_count
  AFTER INSERT OR DELETE ON public.event_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_participant_count();

-- Function to check if registration is still open (6 hours before event)
CREATE OR REPLACE FUNCTION public.is_event_registration_open(event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  event_datetime TIMESTAMP WITH TIME ZONE;
  registration_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT (date::TEXT || ' ' || time::TEXT)::TIMESTAMP WITH TIME ZONE
  INTO event_datetime
  FROM public.events
  WHERE id = event_id;
  
  registration_deadline := event_datetime - INTERVAL '6 hours';
  
  RETURN NOW() < registration_deadline;
END;
$$;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date_status ON public.events(date, status) WHERE status = 'approved';

-- Migrate existing event_interests data to event_participants if they exist
INSERT INTO public.event_participants (event_id, user_id, joined_at)
SELECT event_id, user_id, created_at
FROM public.event_interests
ON CONFLICT (event_id, user_id) DO NOTHING;