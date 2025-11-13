-- Add booking_id reference to conversations table
ALTER TABLE public.conversations 
ADD COLUMN booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_conversations_booking_id ON public.conversations(booking_id);