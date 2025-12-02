
-- Drop the existing premium-only policy for event creation
DROP POLICY IF EXISTS "Premium users can create events" ON public.events;

-- Create new policy allowing all authenticated users to create events
CREATE POLICY "Authenticated users can create events" 
ON public.events 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = organizer_id);
