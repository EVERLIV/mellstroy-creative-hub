-- Fix search_path for generate_verification_code function
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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