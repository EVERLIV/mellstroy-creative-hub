-- Create storage bucket for event photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Create event_photos table
CREATE TABLE IF NOT EXISTS public.event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on event_photos
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_photos
CREATE POLICY "Anyone can view event photos"
  ON public.event_photos FOR SELECT
  USING (true);

CREATE POLICY "Event participants can upload photos after event ends"
  ON public.event_photos FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.event_participants 
      WHERE event_id = event_photos.event_id AND user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE id = event_photos.event_id 
      AND (date::TEXT || ' ' || time::TEXT)::TIMESTAMP WITH TIME ZONE < NOW()
    )
  );

CREATE POLICY "Users can delete their own event photos"
  ON public.event_photos FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own event photos"
  ON public.event_photos FOR UPDATE
  USING (auth.uid() = user_id);

-- Storage policies for event-photos bucket
CREATE POLICY "Anyone can view event photos in storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-photos');

CREATE POLICY "Event participants can upload photos after event"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own event photos in storage"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'event-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own event photos in storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_user_id ON public.event_photos(user_id);

-- Trigger for updating updated_at timestamp
CREATE TRIGGER update_event_photos_updated_at
  BEFORE UPDATE ON public.event_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();