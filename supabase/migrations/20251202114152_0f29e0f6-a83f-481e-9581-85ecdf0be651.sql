-- Update bookings table to support 'closed' status
-- This allows bookings that were not verified within 24 hours to be marked as closed

-- No schema change needed since status is TEXT, but we'll add a comment for clarity
COMMENT ON COLUMN public.bookings.status IS 'Booking status: booked, attended, cancelled, or closed (auto-closed after 24 hours without verification)';

-- Optional: Add index for efficient querying of bookings to close
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON public.bookings(status, booking_date) WHERE status = 'booked';