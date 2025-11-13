-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Enable realtime for conversations table  
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- Add messages to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add conversations to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Create index for faster message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at DESC);

-- Create index for faster conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_participants 
ON public.conversations(participant_1_id, participant_2_id);

-- Function to update last_message_at in conversations
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update conversation timestamp on new message
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();