-- First, clean up any users with multiple roles (keep the first role only)
DELETE FROM public.user_roles
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
    FROM public.user_roles
  ) t
  WHERE rn > 1
);

-- Add unique constraint to ensure one role per user
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Update RLS policy to prevent users from adding multiple roles
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;
CREATE POLICY "Users can insert their own role on signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
);