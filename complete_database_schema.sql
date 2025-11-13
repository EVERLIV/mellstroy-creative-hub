-- ============================================
-- COMPLETE DATABASE SCHEMA FOR RHINOFIT
-- ============================================
-- This file contains all tables, fields, indexes, triggers, and policies
-- Run this SQL script manually to create the complete database structure
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CREATE ENUMS
-- ============================================

-- Create user role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'trainer', 'client');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. CREATE PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Trainer fields
  phone TEXT,
  location TEXT,
  district TEXT,
  specialty TEXT[],
  price_per_hour DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  short_description TEXT,
  experience_years INTEGER,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  -- Student fields
  age INTEGER,
  height INTEGER,
  weight INTEGER,
  goals TEXT[],
  interests TEXT[],
  onboarding_completed BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_district ON profiles(district);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

-- ============================================
-- 3. CREATE USER ROLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_roles (
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

-- ============================================
-- 4. CREATE CLASSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  class_type TEXT NOT NULL CHECK (class_type IN ('Indoor', 'Outdoor', 'Home')),
  image_url TEXT,
  image_urls text[] DEFAULT ARRAY[]::text[],
  schedule_days TEXT[],
  schedule_time TEXT,
  language TEXT[] DEFAULT ARRAY[]::TEXT[],
  level TEXT,
  kids_friendly BOOLEAN DEFAULT false,
  disability_friendly BOOLEAN DEFAULT false,
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

-- ============================================
-- 5. CREATE BOOKINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  verification_code TEXT UNIQUE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'attended', 'cancelled')),
  has_left_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add client_id column for compatibility (some code may use client_id)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id);
-- Sync client_id with user_id
UPDATE public.bookings SET client_id = user_id WHERE client_id IS NULL;

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.uid() = client_id OR
    auth.uid() IN (
      SELECT trainer_id FROM public.classes WHERE id = bookings.class_id
    )
  );

CREATE POLICY "Clients can create bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id OR auth.uid() = client_id) AND 
    (public.has_role(auth.uid(), 'client') OR public.has_role(auth.uid(), 'trainer'))
  );

CREATE POLICY "Users can update their own bookings"
  ON public.bookings
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    auth.uid() = client_id OR
    auth.uid() IN (
      SELECT trainer_id FROM public.classes WHERE id = bookings.class_id
    )
  );

CREATE POLICY "Users can delete their own bookings"
  ON public.bookings
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = client_id);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_verification_code ON public.bookings(verification_code);

-- ============================================
-- 6. CREATE REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.reviews (
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
      AND user_id = auth.uid() 
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

-- ============================================
-- 7. CREATE CONVERSATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_1_id, participant_2_id)
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_1_id, participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON public.conversations(booking_id);

-- ============================================
-- 8. CREATE MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = recipient_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);

-- ============================================
-- 9. CREATE REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  district TEXT NOT NULL,
  description TEXT NOT NULL,
  desired_price DECIMAL(10, 2) NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'Beginner to Intermediate')),
  preferred_time TEXT,
  location_type TEXT CHECK (location_type IN ('home', 'gym', 'outdoor')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'accepted', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_requests_student_id ON public.requests(student_id);
CREATE INDEX IF NOT EXISTS idx_requests_category ON public.requests(category);
CREATE INDEX IF NOT EXISTS idx_requests_district ON public.requests(district);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_location_type ON public.requests(location_type);

-- Enable Row Level Security
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requests
CREATE POLICY "Anyone can view open requests"
  ON public.requests
  FOR SELECT
  USING (status = 'open' OR auth.uid() = student_id);

CREATE POLICY "Students can create their own requests"
  ON public.requests
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own requests"
  ON public.requests
  FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Students can delete their own requests"
  ON public.requests
  FOR DELETE
  USING (auth.uid() = student_id);

-- ============================================
-- 10. CREATE TRAINER_RESPONSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.trainer_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  proposed_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, trainer_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trainer_responses_request_id ON public.trainer_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_trainer_responses_trainer_id ON public.trainer_responses(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_responses_status ON public.trainer_responses(status);

-- Enable Row Level Security
ALTER TABLE public.trainer_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trainer_responses
CREATE POLICY "Request owner and trainer can view responses"
  ON public.trainer_responses
  FOR SELECT
  USING (
    auth.uid() = trainer_id OR 
    auth.uid() IN (SELECT student_id FROM public.requests WHERE id = request_id)
  );

CREATE POLICY "Trainers can create responses to open requests"
  ON public.trainer_responses
  FOR INSERT
  WITH CHECK (
    auth.uid() = trainer_id AND
    EXISTS (
      SELECT 1 FROM public.requests 
      WHERE id = request_id AND status = 'open'
    )
  );

CREATE POLICY "Trainers can update their own responses"
  ON public.trainer_responses
  FOR UPDATE
  USING (auth.uid() = trainer_id);

CREATE POLICY "Request owner can update response status"
  ON public.trainer_responses
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT student_id FROM public.requests WHERE id = request_id)
  );

CREATE POLICY "Trainers can delete their own responses"
  ON public.trainer_responses
  FOR DELETE
  USING (auth.uid() = trainer_id);

-- ============================================
-- 11. CREATE TRAINER_DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.trainer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('certificate', 'award', 'other')),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_trainer_documents_trainer_id ON public.trainer_documents(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_documents_is_verified ON public.trainer_documents(is_verified);
CREATE INDEX IF NOT EXISTS idx_trainer_documents_priority ON public.trainer_documents(priority DESC);

-- Enable RLS
ALTER TABLE public.trainer_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Trainers can view their own documents
CREATE POLICY "Trainers can view own documents"
    ON public.trainer_documents
    FOR SELECT
    USING (auth.uid() = trainer_id);

-- Policy: Trainers can insert their own documents
CREATE POLICY "Trainers can insert own documents"
    ON public.trainer_documents
    FOR INSERT
    WITH CHECK (auth.uid() = trainer_id);

-- Policy: Trainers can delete their own documents
CREATE POLICY "Trainers can delete own documents"
    ON public.trainer_documents
    FOR DELETE
    USING (auth.uid() = trainer_id);

-- Policy: Admins can view all documents
CREATE POLICY "Admins can view all documents"
    ON public.trainer_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update documents (for verification)
CREATE POLICY "Admins can update documents"
    ON public.trainer_documents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 12. CREATE SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium_monthly', 'premium_yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- 13. CREATE PAYMENT_HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  status TEXT NOT NULL CHECK (status IN ('paid', 'failed', 'pending', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  invoice_number TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON public.payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_date ON public.payment_history(payment_date DESC);

-- Enable RLS on payment_history
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_history table
CREATE POLICY "Users can view their own payment history"
  ON public.payment_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert payment history"
  ON public.payment_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all payment history"
  ON public.payment_history
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- 14. CREATE EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  organizer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  time text NOT NULL,
  location text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create event_interests table for tracking interested users
CREATE TABLE IF NOT EXISTS public.event_interests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Approved events viewable by everyone"
ON public.events
FOR SELECT
USING (status = 'approved' OR organizer_id = auth.uid());

CREATE POLICY "Trainers can create events"
ON public.events
FOR INSERT
WITH CHECK (auth.uid() = organizer_id AND has_role(auth.uid(), 'trainer'));

CREATE POLICY "Trainers can update own events"
ON public.events
FOR UPDATE
USING (auth.uid() = organizer_id);

CREATE POLICY "Admins can update all events"
ON public.events
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for event_interests
CREATE POLICY "Event interests viewable by everyone"
ON public.event_interests
FOR SELECT
USING (true);

CREATE POLICY "Users can mark interest"
ON public.event_interests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own interest"
ON public.event_interests
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 15. CREATE MEAL_PLANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON public.meal_plans(user_id);

-- Enable Row Level Security
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own meal plans"
  ON public.meal_plans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plans"
  ON public.meal_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
  ON public.meal_plans
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
  ON public.meal_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 18. CREATE NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('booking', 'review')),
  reference_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- ============================================
-- 16. CREATE CHALLENGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  cover_image_url TEXT,
  duration_days INTEGER NOT NULL DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'draft')),
  votes_count INTEGER DEFAULT 0,
  participants_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges viewable by everyone"
  ON public.challenges FOR SELECT
  USING (true);

CREATE POLICY "Users can create challenges"
  ON public.challenges FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own challenges"
  ON public.challenges FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own challenges"
  ON public.challenges FOR DELETE
  USING (auth.uid() = author_id);

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes viewable by everyone"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- Create challenge_participations table
CREATE TABLE IF NOT EXISTS public.challenge_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participations viewable by everyone"
  ON public.challenge_participations FOR SELECT
  USING (true);

CREATE POLICY "Users can join challenges"
  ON public.challenge_participations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges"
  ON public.challenge_participations FOR DELETE
  USING (auth.uid() = user_id);

-- Create submissions table for photos/videos
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Submissions viewable by everyone"
  ON public.submissions FOR SELECT
  USING (true);

CREATE POLICY "Users can create submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own submissions"
  ON public.submissions FOR DELETE
  USING (auth.uid() = user_id);

-- Create saved_challenges table
CREATE TABLE IF NOT EXISTS public.saved_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.saved_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Saved challenges viewable by owner"
  ON public.saved_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save challenges"
  ON public.saved_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave challenges"
  ON public.saved_challenges FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 17. CREATE FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, onboarding_completed, last_seen)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'avatar_url',
    false,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update trainer rating after review
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

-- Function to generate verification code for bookings
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-character code
    code := UPPER(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE verification_code = code) INTO exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to set verification code on booking insert
CREATE OR REPLACE FUNCTION set_verification_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update request status when response is accepted
CREATE OR REPLACE FUNCTION public.handle_response_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    -- Close the request
    UPDATE public.requests
    SET status = 'accepted'
    WHERE id = NEW.request_id;

    -- Reject other responses for the same request
    UPDATE public.trainer_responses
    SET status = 'rejected'
    WHERE request_id = NEW.request_id
      AND id != NEW.id
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

-- Function to update updated_at for requests
CREATE OR REPLACE FUNCTION update_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at for trainer_responses
CREATE OR REPLACE FUNCTION update_trainer_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update challenge vote count
CREATE OR REPLACE FUNCTION update_challenge_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.challenges 
    SET votes_count = votes_count + 1 
    WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.challenges 
    SET votes_count = votes_count - 1 
    WHERE id = OLD.challenge_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update participant count
CREATE OR REPLACE FUNCTION update_challenge_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.challenges 
    SET participants_count = participants_count + 1 
    WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.challenges 
    SET participants_count = participants_count - 1 
    WHERE id = OLD.challenge_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 19. CREATE TRIGGERS
-- ============================================

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers to update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trainer_documents_updated_at
  BEFORE UPDATE ON public.trainer_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION update_challenge_votes_count();

CREATE TRIGGER on_participation_change
  AFTER INSERT OR DELETE ON public.challenge_participations
  FOR EACH ROW EXECUTE FUNCTION update_challenge_participants_count();

-- Trigger to update trainer rating after review
CREATE TRIGGER after_review_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trainer_rating();

CREATE TRIGGER after_review_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trainer_rating();

CREATE TRIGGER after_review_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trainer_rating();

-- Trigger to set verification code on booking insert
DROP TRIGGER IF EXISTS trigger_set_verification_code ON public.bookings;
CREATE TRIGGER trigger_set_verification_code
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_verification_code();

-- Trigger to handle response accepted
CREATE TRIGGER trg_handle_response_accepted
  AFTER UPDATE OF status ON public.trainer_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_response_accepted();

-- Triggers to update updated_at for requests and responses
CREATE TRIGGER update_requests_updated_at_trigger
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION update_requests_updated_at();

CREATE TRIGGER update_trainer_responses_updated_at_trigger
  BEFORE UPDATE ON public.trainer_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_trainer_responses_updated_at();

-- ============================================
-- 20. CREATE STORAGE BUCKETS
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('challenge-covers', 'challenge-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('challenge-submissions', 'challenge-submissions', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('class-images', 'class-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('category-icons', 'category-icons', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 21. CREATE STORAGE POLICIES
-- ============================================

-- Storage policies for challenge covers
CREATE POLICY "Challenge covers are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'challenge-covers');

CREATE POLICY "Users can upload challenge covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'challenge-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for submissions
CREATE POLICY "Submissions are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'challenge-submissions');

CREATE POLICY "Users can upload submissions"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'challenge-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for class-images bucket
CREATE POLICY "Anyone can view class images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'class-images');

CREATE POLICY "Trainers can upload class images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'class-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'trainer'::app_role)
);

CREATE POLICY "Trainers can update their own class images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'class-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'trainer'::app_role)
);

CREATE POLICY "Trainers can delete their own class images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'class-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'trainer'::app_role)
);

-- RLS policies for verification-docs bucket
CREATE POLICY "Users can upload their own verification docs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own verification docs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to category-icons
CREATE POLICY "Public can view category icons"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-icons');

-- Allow admin to upload category icons
CREATE POLICY "Admin can upload category icons"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'category-icons' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admin to update category icons
CREATE POLICY "Admin can update category icons"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'category-icons' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admin to delete category icons
CREATE POLICY "Admin can delete category icons"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'category-icons' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================
-- 22. ENABLE REALTIME
-- ============================================

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime for bookings and reviews (for real-time detection)
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

-- Set replica identity for conversations (for realtime)
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- ============================================
-- END OF SCHEMA
-- ============================================
-- 
-- This SQL script creates the complete database schema for RhinoFit application.
-- 
-- Tables created:
-- 1. profiles - User profiles (trainers and students)
-- 2. user_roles - User role assignments
-- 3. classes - Training classes offered by trainers
-- 4. bookings - Class bookings by students
-- 5. reviews - Reviews for trainers
-- 6. conversations - Chat conversations between users
-- 7. messages - Individual messages in conversations
-- 8. requests - Training requests from students
-- 9. trainer_responses - Trainer responses to requests
-- 10. trainer_documents - Verification documents for trainers
-- 11. subscriptions - User subscription plans
-- 12. payment_history - Payment records
-- 13. events - Fitness events
-- 14. event_interests - User interests in events
-- 15. meal_plans - Meal planning data
-- 16. notifications - User notifications
-- 17. challenges - Fitness challenges
-- 18. votes - Votes on challenges
-- 19. challenge_participations - Challenge participations
-- 20. submissions - Challenge submissions
-- 21. saved_challenges - Saved challenges by users
-- 
-- All tables include:
-- - Row Level Security (RLS) policies
-- - Appropriate indexes for performance
-- - Triggers for automatic updates
-- - Foreign key constraints
-- 
-- Storage buckets created:
-- - avatars
-- - class-images
-- - challenge-covers
-- - challenge-submissions
-- - verification-docs
-- - category-icons
-- 
-- Run this script in your Supabase SQL editor to create the complete database structure.
-- ============================================

