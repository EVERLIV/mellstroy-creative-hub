-- Add reply_to_id column for message replies
ALTER TABLE public.event_messages 
ADD COLUMN reply_to_id UUID REFERENCES public.event_messages(id) ON DELETE SET NULL;