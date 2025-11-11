-- Create storage bucket for class images
INSERT INTO storage.buckets (id, name, public)
VALUES ('class-images', 'class-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for class-images bucket
CREATE POLICY "Anyone can view class images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'class-images');

CREATE POLICY "Trainers can upload class images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'class-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'trainer'::app_role)
);

CREATE POLICY "Trainers can update their own class images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'class-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'trainer'::app_role)
);

CREATE POLICY "Trainers can delete their own class images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'class-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND has_role(auth.uid(), 'trainer'::app_role)
);

-- Update classes table to support multiple images
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT ARRAY[]::text[];

-- Migrate existing image_url to image_urls array
UPDATE public.classes 
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND (image_urls IS NULL OR array_length(image_urls, 1) IS NULL);