-- Create events table
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  organizer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  time text NOT NULL,
  location text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create event_interests table for tracking interested users
CREATE TABLE public.event_interests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Approved events viewable by everyone"
ON public.events
FOR SELECT
USING (status = 'approved' OR organizer_id = auth.uid());

CREATE POLICY "Trainers can create events"
ON public.events
FOR INSERT
WITH CHECK (auth.uid() = organizer_id AND has_role(auth.uid(), 'trainer'));

CREATE POLICY "Trainers can update own events"
ON public.events
FOR UPDATE
USING (auth.uid() = organizer_id);

CREATE POLICY "Admins can update all events"
ON public.events
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for event_interests
CREATE POLICY "Event interests viewable by everyone"
ON public.event_interests
FOR SELECT
USING (true);

CREATE POLICY "Users can mark interest"
ON public.event_interests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own interest"
ON public.event_interests
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();