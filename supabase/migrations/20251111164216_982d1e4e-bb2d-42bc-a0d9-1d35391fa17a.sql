-- Create app_role enum if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'trainer', 'client');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add admin role to existing user_roles table if not already present
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Insert admin user (email: hoaandrey@gmail.com)
-- First get the user_id from auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'hoaandrey@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Update storage policies for category-icons bucket
-- Drop existing policies
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload access" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access" ON storage.objects;

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