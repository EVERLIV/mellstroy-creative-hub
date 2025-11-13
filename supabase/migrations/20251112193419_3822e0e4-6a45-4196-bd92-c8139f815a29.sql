-- Add verification fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS verification_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Create index for faster verification code lookups
CREATE INDEX IF NOT EXISTS idx_bookings_verification_code ON public.bookings(verification_code);

-- Function to generate unique verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-digit code
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE verification_code = code) INTO exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Trigger to auto-generate verification code on booking insert
CREATE OR REPLACE FUNCTION set_verification_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_verification_code ON public.bookings;
CREATE TRIGGER trigger_set_verification_code
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_verification_code();