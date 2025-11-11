-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create new policy that allows viewing all trainer roles
CREATE POLICY "Users can view all trainer roles" 
ON public.user_roles 
FOR SELECT 
USING (true);

-- Keep the insert policy as is
-- Users can still only insert their own role