-- Add student profile fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS height integer,
ADD COLUMN IF NOT EXISTS weight integer,
ADD COLUMN IF NOT EXISTS goals text[],
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Update handle_new_user function to set onboarding_completed to false for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'avatar_url',
    false
  );
  RETURN NEW;
END;
$function$;