-- Add cancellation tracking fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Create table to track daily cancellation counts
CREATE TABLE IF NOT EXISTS public.booking_cancellations_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cancellation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cancellation_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, cancellation_date)
);

-- Enable RLS on cancellations tracker
ALTER TABLE public.booking_cancellations_tracker ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own cancellation counts
CREATE POLICY "Users can view own cancellation counts"
ON public.booking_cancellations_tracker
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System can manage cancellation counts
CREATE POLICY "System can manage cancellation counts"
ON public.booking_cancellations_tracker
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to check if user can cancel booking
CREATE OR REPLACE FUNCTION public.can_cancel_booking(
  _booking_id UUID,
  _user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _booking RECORD;
  _cancellation_count INTEGER;
  _hours_until_booking NUMERIC;
  _is_trainer BOOLEAN;
BEGIN
  -- Get booking details
  SELECT b.*, c.trainer_id
  INTO _booking
  FROM bookings b
  JOIN classes c ON b.class_id = c.id
  WHERE b.id = _booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_cancel', false,
      'reason', 'Booking not found'
    );
  END IF;

  -- Check if already cancelled
  IF _booking.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'can_cancel', false,
      'reason', 'Booking already cancelled'
    );
  END IF;

  -- Check if user is the trainer
  _is_trainer := (_booking.trainer_id = _user_id);

  -- Calculate hours until booking
  _hours_until_booking := EXTRACT(EPOCH FROM (
    (_booking.booking_date + _booking.booking_time::TIME) - NOW()
  )) / 3600;

  -- If less than 12 hours and user is not the trainer, cannot cancel
  IF _hours_until_booking < 12 AND NOT _is_trainer THEN
    RETURN jsonb_build_object(
      'can_cancel', false,
      'reason', 'Cannot cancel within 12 hours of class. Only trainer can cancel.'
    );
  END IF;

  -- If user is client, check daily cancellation limit (3 per day)
  IF NOT _is_trainer THEN
    SELECT COALESCE(cancellation_count, 0)
    INTO _cancellation_count
    FROM booking_cancellations_tracker
    WHERE user_id = _user_id
    AND cancellation_date = CURRENT_DATE;

    IF _cancellation_count >= 3 THEN
      RETURN jsonb_build_object(
        'can_cancel', false,
        'reason', 'Daily cancellation limit reached (3 per day)'
      );
    END IF;
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'can_cancel', true,
    'reason', NULL,
    'hours_until_booking', _hours_until_booking,
    'is_trainer', _is_trainer
  );
END;
$$;

-- Function to process booking cancellation
CREATE OR REPLACE FUNCTION public.cancel_booking(
  _booking_id UUID,
  _user_id UUID,
  _cancellation_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _can_cancel JSONB;
  _booking RECORD;
  _is_trainer BOOLEAN;
BEGIN
  -- Check if cancellation is allowed
  _can_cancel := public.can_cancel_booking(_booking_id, _user_id);

  IF NOT (_can_cancel->>'can_cancel')::BOOLEAN THEN
    RETURN _can_cancel;
  END IF;

  -- Get booking details
  SELECT b.*, c.trainer_id
  INTO _booking
  FROM bookings b
  JOIN classes c ON b.class_id = c.id
  WHERE b.id = _booking_id;

  _is_trainer := (_booking.trainer_id = _user_id);

  -- Update booking status
  UPDATE bookings
  SET 
    status = 'cancelled',
    cancellation_reason = _cancellation_reason,
    cancelled_by = _user_id,
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id = _booking_id;

  -- If cancelled by client, increment daily cancellation count
  IF NOT _is_trainer THEN
    INSERT INTO booking_cancellations_tracker (user_id, cancellation_date, cancellation_count)
    VALUES (_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, cancellation_date)
    DO UPDATE SET 
      cancellation_count = booking_cancellations_tracker.cancellation_count + 1,
      updated_at = NOW();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Booking cancelled successfully'
  );
END;
$$;