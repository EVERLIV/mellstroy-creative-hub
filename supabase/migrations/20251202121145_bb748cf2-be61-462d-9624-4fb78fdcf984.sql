-- Enable replica identity for realtime updates
ALTER TABLE public.event_participants REPLICA IDENTITY FULL;
ALTER TABLE public.event_waitlist REPLICA IDENTITY FULL;

-- Ensure tables are in realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_participants;