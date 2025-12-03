-- Enable realtime for event_messages table
ALTER TABLE public.event_messages REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_messages;