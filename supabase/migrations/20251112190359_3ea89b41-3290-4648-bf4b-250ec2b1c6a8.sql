-- Add kids_friendly and disability_friendly columns to classes table
ALTER TABLE public.classes
ADD COLUMN kids_friendly BOOLEAN DEFAULT false,
ADD COLUMN disability_friendly BOOLEAN DEFAULT false;

-- Add comment to explain the columns
COMMENT ON COLUMN public.classes.kids_friendly IS 'Indicates if the class is suitable for children';
COMMENT ON COLUMN public.classes.disability_friendly IS 'Indicates if the class is accessible for people with disabilities';