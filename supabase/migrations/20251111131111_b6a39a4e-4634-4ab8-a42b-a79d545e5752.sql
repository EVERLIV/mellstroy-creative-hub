-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for verification-docs bucket
CREATE POLICY "Users can upload their own verification docs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own verification docs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);