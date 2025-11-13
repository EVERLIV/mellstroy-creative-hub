-- Enable full replica identity for bookings table (needed for realtime updates)
ALTER TABLE public.bookings REPLICA IDENTITY FULL;