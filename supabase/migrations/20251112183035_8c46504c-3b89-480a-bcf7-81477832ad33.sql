-- Create meal_plans table
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX idx_meal_plans_user_id ON public.meal_plans(user_id);

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

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();