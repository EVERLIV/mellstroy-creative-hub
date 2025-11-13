-- Create trainer_documents table for document verification
CREATE TABLE public.trainer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  rejection_reason TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_trainer_documents_trainer_id ON public.trainer_documents(trainer_id);
CREATE INDEX idx_trainer_documents_is_verified ON public.trainer_documents(is_verified);
CREATE INDEX idx_trainer_documents_priority ON public.trainer_documents(priority);

-- Enable Row Level Security
ALTER TABLE public.trainer_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Trainers can view their own documents
CREATE POLICY "Trainers can view own documents"
ON public.trainer_documents
FOR SELECT
USING (auth.uid() = trainer_id);

-- Policy: Trainers can insert their own documents
CREATE POLICY "Trainers can upload own documents"
ON public.trainer_documents
FOR INSERT
WITH CHECK (
  auth.uid() = trainer_id 
  AND has_role(auth.uid(), 'trainer'::app_role)
);

-- Policy: Trainers can delete their own documents
CREATE POLICY "Trainers can delete own documents"
ON public.trainer_documents
FOR DELETE
USING (auth.uid() = trainer_id);

-- Policy: Admins can view all documents
CREATE POLICY "Admins can view all documents"
ON public.trainer_documents
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can update all documents (for verification)
CREATE POLICY "Admins can update all documents"
ON public.trainer_documents
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Everyone can view verified documents (for trainer cards)
CREATE POLICY "Verified documents are publicly viewable"
ON public.trainer_documents
FOR SELECT
USING (is_verified = true);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_trainer_documents_updated_at
BEFORE UPDATE ON public.trainer_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.trainer_documents IS 'Stores verification documents uploaded by trainers for admin review and approval';