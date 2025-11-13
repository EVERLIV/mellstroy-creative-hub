-- Add new fields to requests table
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS preferred_time TEXT,
ADD COLUMN IF NOT EXISTS location_type TEXT CHECK (location_type IN ('home', 'gym', 'outdoor', NULL));

-- Create index for location_type
CREATE INDEX IF NOT EXISTS idx_requests_location_type ON public.requests(location_type);

