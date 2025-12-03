-- CRITICAL: Fix profiles public exposure
-- Drop the overly permissive "viewable by everyone" policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create more granular policies for profiles
-- Policy 1: Users can view their own complete profile
CREATE POLICY "Users can view own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Policy 2: Everyone can view trainer public info (for discovery)
-- This allows viewing profiles of users who are trainers
CREATE POLICY "Everyone can view trainer profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = profiles.id 
    AND role = 'trainer'
  )
);

-- Note: With these policies, sensitive data like phone, age, height, weight 
-- are still in the table but we created secure views earlier. 
-- The frontend should use the public_profiles view for non-owner queries.