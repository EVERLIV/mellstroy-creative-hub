-- Create requests table for student training requests
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- e.g., 'gym', 'yoga', 'tennis', etc.
  district TEXT NOT NULL, -- e.g., 'Quận 1', 'Quận 2', etc.
  description TEXT NOT NULL,
  desired_price DECIMAL(10, 2) NOT NULL, -- Price per hour in VND
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'Beginner to Intermediate')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'accepted', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trainer_responses table for trainer responses to requests
CREATE TABLE IF NOT EXISTS public.trainer_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL, -- Trainer's message/offer
  proposed_price DECIMAL(10, 2) NOT NULL, -- Trainer's proposed price
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, trainer_id) -- One response per trainer per request
);

-- Create indexes for better query performance
CREATE INDEX idx_requests_student_id ON public.requests(student_id);
CREATE INDEX idx_requests_category ON public.requests(category);
CREATE INDEX idx_requests_district ON public.requests(district);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_created_at ON public.requests(created_at DESC);

CREATE INDEX idx_trainer_responses_request_id ON public.trainer_responses(request_id);
CREATE INDEX idx_trainer_responses_trainer_id ON public.trainer_responses(trainer_id);
CREATE INDEX idx_trainer_responses_status ON public.trainer_responses(status);

-- Enable Row Level Security
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requests
CREATE POLICY "Anyone can view open requests"
  ON public.requests
  FOR SELECT
  USING (status = 'open' OR auth.uid() = student_id);

CREATE POLICY "Students can create their own requests"
  ON public.requests
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own requests"
  ON public.requests
  FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Students can delete their own requests"
  ON public.requests
  FOR DELETE
  USING (auth.uid() = student_id);

-- RLS Policies for trainer_responses
CREATE POLICY "Request owner and trainer can view responses"
  ON public.trainer_responses
  FOR SELECT
  USING (
    auth.uid() = trainer_id OR 
    auth.uid() IN (SELECT student_id FROM public.requests WHERE id = request_id)
  );

CREATE POLICY "Trainers can create responses to open requests"
  ON public.trainer_responses
  FOR INSERT
  WITH CHECK (
    auth.uid() = trainer_id AND
    EXISTS (
      SELECT 1 FROM public.requests 
      WHERE id = request_id AND status = 'open'
    )
  );

CREATE POLICY "Trainers can update their own responses"
  ON public.trainer_responses
  FOR UPDATE
  USING (auth.uid() = trainer_id);

CREATE POLICY "Request owner can update response status"
  ON public.trainer_responses
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT student_id FROM public.requests WHERE id = request_id)
  );

CREATE POLICY "Trainers can delete their own responses"
  ON public.trainer_responses
  FOR DELETE
  USING (auth.uid() = trainer_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_trainer_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
CREATE TRIGGER update_requests_updated_at_trigger
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION update_requests_updated_at();

CREATE TRIGGER update_trainer_responses_updated_at_trigger
  BEFORE UPDATE ON public.trainer_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_trainer_responses_updated_at();

