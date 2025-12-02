-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'fire')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Create index for faster queries
CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON public.message_reactions(user_id);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can add reactions
CREATE POLICY "Users can add reactions to messages in their conversations"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = message_reactions.message_id
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Users can view reactions in their conversations
CREATE POLICY "Users can view reactions in their conversations"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.id = message_reactions.message_id
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

-- Enable realtime
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;