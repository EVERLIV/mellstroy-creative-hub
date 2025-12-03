-- Create class_views analytics table for tracking view statistics
CREATE TABLE public.class_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    view_date DATE NOT NULL DEFAULT CURRENT_DATE,
    view_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(class_id, viewer_id, view_date)
);

-- Create indexes for performance
CREATE INDEX idx_class_views_class_id ON public.class_views(class_id);
CREATE INDEX idx_class_views_view_date ON public.class_views(view_date);
CREATE INDEX idx_class_views_class_date ON public.class_views(class_id, view_date);

-- Enable RLS
ALTER TABLE public.class_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can insert views (for tracking)
CREATE POLICY "Anyone can record class views"
ON public.class_views
FOR INSERT
WITH CHECK (true);

-- Trainers can view analytics for their own classes
CREATE POLICY "Trainers can view own class analytics"
ON public.class_views
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_views.class_id
        AND classes.trainer_id = auth.uid()
    )
);

-- Admins can view all analytics
CREATE POLICY "Admins can view all class analytics"
ON public.class_views
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Function to record or increment a class view
CREATE OR REPLACE FUNCTION public.record_class_view(_class_id UUID, _viewer_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.class_views (class_id, viewer_id, view_date, view_count)
    VALUES (_class_id, _viewer_id, CURRENT_DATE, 1)
    ON CONFLICT (class_id, viewer_id, view_date)
    DO UPDATE SET 
        view_count = class_views.view_count + 1,
        updated_at = now();
END;
$$;

-- Function to get class view stats for a trainer
CREATE OR REPLACE FUNCTION public.get_class_view_stats(_class_id UUID, _days INTEGER DEFAULT 7)
RETURNS TABLE (
    view_date DATE,
    total_views BIGINT,
    unique_viewers BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        cv.view_date,
        SUM(cv.view_count) as total_views,
        COUNT(DISTINCT cv.viewer_id) as unique_viewers
    FROM public.class_views cv
    WHERE cv.class_id = _class_id
    AND cv.view_date >= CURRENT_DATE - (_days || ' days')::INTERVAL
    GROUP BY cv.view_date
    ORDER BY cv.view_date DESC;
$$;