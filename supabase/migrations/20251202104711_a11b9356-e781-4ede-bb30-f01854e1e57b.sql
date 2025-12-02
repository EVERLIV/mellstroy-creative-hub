-- Create AI Coach profile table to store user preferences and context
CREATE TABLE public.ai_coach_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fitness_level TEXT, -- beginner, intermediate, advanced
  goals TEXT[], -- e.g., ['build_muscle', 'lose_weight', 'improve_endurance']
  equipment_access TEXT, -- home, gym, both
  training_days_per_week INTEGER,
  dietary_restrictions TEXT[], -- e.g., ['vegetarian', 'lactose_intolerant']
  health_limitations TEXT, -- any injuries or health conditions
  preferred_training_time TEXT, -- morning, afternoon, evening
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.ai_coach_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own AI coach profile"
ON public.ai_coach_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can create own AI coach profile"
ON public.ai_coach_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own AI coach profile"
ON public.ai_coach_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own AI coach profile"
ON public.ai_coach_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updating updated_at
CREATE TRIGGER update_ai_coach_profiles_updated_at
BEFORE UPDATE ON public.ai_coach_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_ai_coach_profiles_user_id ON public.ai_coach_profiles(user_id);