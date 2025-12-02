-- Add storage policy for event cover image uploads
-- Users can upload to their own folder in event-photos bucket

CREATE POLICY "Users can upload event cover images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'event-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own uploaded images
CREATE POLICY "Users can update own event images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'event-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own uploaded images
CREATE POLICY "Users can delete own event images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'event-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);