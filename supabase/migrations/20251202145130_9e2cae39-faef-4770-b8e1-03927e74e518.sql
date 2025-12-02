-- Create event messages table for group chat
CREATE TABLE public.event_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view messages for events they participate in
CREATE POLICY "Participants can view event messages"
ON public.event_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_participants
    WHERE event_participants.event_id = event_messages.event_id
    AND event_participants.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_messages.event_id
    AND events.organizer_id = auth.uid()
  )
);

-- Participants can send messages
CREATE POLICY "Participants can send event messages"
ON public.event_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM public.event_participants
      WHERE event_participants.event_id = event_messages.event_id
      AND event_participants.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_messages.event_id
      AND events.organizer_id = auth.uid()
    )
  )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own event messages"
ON public.event_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_event_messages_event_id ON public.event_messages(event_id);
CREATE INDEX idx_event_messages_created_at ON public.event_messages(created_at);

-- Enable realtime
ALTER TABLE public.event_messages REPLICA IDENTITY FULL;