-- Function to create notification for new booking
CREATE OR REPLACE FUNCTION public.notify_trainer_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trainer_id_var uuid;
  client_name text;
BEGIN
  -- Get trainer_id from the class
  SELECT c.trainer_id INTO trainer_id_var
  FROM classes c
  WHERE c.id = NEW.class_id;
  
  -- Get client username
  SELECT p.username INTO client_name
  FROM profiles p
  WHERE p.id = NEW.client_id;
  
  -- Insert notification for trainer
  INSERT INTO public.notifications (user_id, type, reference_id, message)
  VALUES (
    trainer_id_var,
    'booking',
    NEW.id,
    client_name || ' booked your class on ' || TO_CHAR(NEW.booking_date, 'Mon DD, YYYY')
  );
  
  RETURN NEW;
END;
$$;

-- Function to create notification for new review
CREATE OR REPLACE FUNCTION public.notify_trainer_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_name text;
BEGIN
  -- Get client username
  SELECT p.username INTO client_name
  FROM profiles p
  WHERE p.id = NEW.client_id;
  
  -- Insert notification for trainer
  INSERT INTO public.notifications (user_id, type, reference_id, message)
  VALUES (
    NEW.trainer_id,
    'review',
    NEW.id,
    client_name || ' left you a ' || NEW.rating || '-star review'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new bookings
CREATE TRIGGER on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_trainer_new_booking();

-- Trigger for new reviews
CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_trainer_new_review();