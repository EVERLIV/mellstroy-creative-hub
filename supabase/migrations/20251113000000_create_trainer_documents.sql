-- Create trainer_documents table
CREATE TABLE IF NOT EXISTS public.trainer_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('certificate', 'award', 'other')),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    priority INTEGER DEFAULT 0 -- Higher priority for premium users
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trainer_documents_trainer_id ON public.trainer_documents(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_documents_is_verified ON public.trainer_documents(is_verified);
CREATE INDEX IF NOT EXISTS idx_trainer_documents_priority ON public.trainer_documents(priority DESC);

-- Enable RLS
ALTER TABLE public.trainer_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Trainers can view their own documents
CREATE POLICY "Trainers can view own documents"
    ON public.trainer_documents
    FOR SELECT
    USING (auth.uid() = trainer_id);

-- Policy: Trainers can insert their own documents
CREATE POLICY "Trainers can insert own documents"
    ON public.trainer_documents
    FOR INSERT
    WITH CHECK (auth.uid() = trainer_id);

-- Policy: Trainers can delete their own documents
CREATE POLICY "Trainers can delete own documents"
    ON public.trainer_documents
    FOR DELETE
    USING (auth.uid() = trainer_id);

-- Policy: Admins can view all documents
CREATE POLICY "Admins can view all documents"
    ON public.trainer_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update documents (for verification)
CREATE POLICY "Admins can update documents"
    ON public.trainer_documents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

