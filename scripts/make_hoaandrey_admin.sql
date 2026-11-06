-- Promote hoaandrey@gmail.com to admin (RhinoFit).
-- Run in the Supabase SQL editor for the RhinoFit project.

DO $$
DECLARE
  uid uuid;
  updated_count int;
BEGIN
  SELECT id INTO uid
  FROM auth.users
  WHERE lower(email) = lower('hoaandrey@gmail.com')
  LIMIT 1;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'No auth.users row for hoaandrey@gmail.com';
  END IF;

  UPDATE public.user_roles
  SET role = 'admin'::public.app_role
  WHERE user_id = uid;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'admin'::public.app_role);
  END IF;
END $$;

-- Verify
SELECT u.email, ur.role, ur.user_id, ur.id
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE lower(u.email) = lower('hoaandrey@gmail.com');
