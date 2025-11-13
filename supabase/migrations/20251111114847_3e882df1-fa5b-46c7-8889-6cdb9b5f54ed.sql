-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('trainer', 'client');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Extend profiles table with additional fields
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS specialty TEXT[],
  ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  class_type TEXT NOT NULL CHECK (class_type IN ('Indoor', 'Outdoor', 'Home')),
  image_url TEXT,
  schedule_days TEXT[],
  schedule_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- RLS policies for classes
CREATE POLICY "Classes are viewable by everyone"
  ON public.classes
  FOR SELECT
  USING (true);

CREATE POLICY "Trainers can create their own classes"
  ON public.classes
  FOR INSERT
  WITH CHECK (
    auth.uid() = trainer_id AND 
    public.has_role(auth.uid(), 'trainer')
  );

CREATE POLICY "Trainers can update their own classes"
  ON public.classes
  FOR UPDATE
  USING (
    auth.uid() = trainer_id AND 
    public.has_role(auth.uid(), 'trainer')
  );

CREATE POLICY "Trainers can delete their own classes"
  ON public.classes
  FOR DELETE
  USING (
    auth.uid() = trainer_id AND 
    public.has_role(auth.uid(), 'trainer')
  );

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'attended', 'cancelled')),
  has_left_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings
  FOR SELECT
  USING (
    auth.uid() = client_id OR 
    auth.uid() IN (
      SELECT trainer_id FROM public.classes WHERE id = bookings.class_id
    )
  );

CREATE POLICY "Clients can create bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (
    auth.uid() = client_id AND 
    public.has_role(auth.uid(), 'client')
  );

CREATE POLICY "Users can update their own bookings"
  ON public.bookings
  FOR UPDATE
  USING (
    auth.uid() = client_id OR 
    auth.uid() IN (
      SELECT trainer_id FROM public.classes WHERE id = bookings.class_id
    )
  );

CREATE POLICY "Users can delete their own bookings"
  ON public.bookings
  FOR DELETE
  USING (auth.uid() = client_id);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (booking_id)
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Clients can create reviews for their bookings"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = client_id AND 
    public.has_role(auth.uid(), 'client') AND
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND client_id = auth.uid() 
      AND status = 'attended'
      AND has_left_review = false
    )
  );

CREATE POLICY "Clients can update their own reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete their own reviews"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = client_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update trainer rating after review
CREATE OR REPLACE FUNCTION public.update_trainer_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE trainer_id = NEW.trainer_id
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE trainer_id = NEW.trainer_id
    )
  WHERE id = NEW.trainer_id;
  
  -- Mark booking as reviewed
  UPDATE public.bookings
  SET has_left_review = true
  WHERE id = NEW.booking_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update trainer rating after review insert
CREATE TRIGGER after_review_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trainer_rating();

-- Create trigger to update trainer rating after review update/delete
CREATE TRIGGER after_review_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trainer_rating();

CREATE TRIGGER after_review_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trainer_rating();