-- Fix function search_path security warning
CREATE OR REPLACE FUNCTION public.is_event_registration_open(event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_datetime TIMESTAMP WITH TIME ZONE;
  registration_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT (date::TEXT || ' ' || time::TEXT)::TIMESTAMP WITH TIME ZONE
  INTO event_datetime
  FROM public.events
  WHERE id = event_id;
  
  registration_deadline := event_datetime - INTERVAL '6 hours';
  
  RETURN NOW() < registration_deadline;
END;
$$;