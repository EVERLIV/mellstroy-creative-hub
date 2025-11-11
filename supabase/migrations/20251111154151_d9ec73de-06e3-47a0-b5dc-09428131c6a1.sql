-- Create storage bucket for category icons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-icons',
  'category-icons',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
);

-- RLS policies for category icons bucket
CREATE POLICY "Category icons are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-icons');

CREATE POLICY "Admins can upload category icons"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'category-icons' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update category icons"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'category-icons' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete category icons"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'category-icons' 
  AND has_role(auth.uid(), 'admin')
);