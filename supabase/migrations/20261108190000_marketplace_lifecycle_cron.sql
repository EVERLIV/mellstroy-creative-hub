-- Schedule marketplace lifecycle (requires pg_cron + pg_net on Supabase)
-- Safe no-op when extensions unavailable.

CREATE TABLE IF NOT EXISTS public.booking_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.booking_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY booking_tips_own ON public.booking_tips
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed related services for cross-sell
INSERT INTO public.related_services (source_specialty, related_label, related_category, sort_order)
SELECT * FROM (VALUES
  ('Fitness', 'Recovery massage', 'Massage', 1),
  ('Fitness', 'Nutrition consult', 'Nutrition', 2),
  ('Yoga', 'Mobility coaching', 'Mobility', 1),
  ('Boxing', 'Conditioning class', 'Fitness', 1),
  ('Swimming', 'Stretch & recover', 'Mobility', 1)
) AS v(source_specialty, related_label, related_category, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.related_services r
  WHERE r.source_specialty = v.source_specialty AND r.related_label = v.related_label
);

INSERT INTO public.partner_offers (title, description, partner_name, category, sort_order)
SELECT * FROM (VALUES
  ('Gym day pass 20% off', 'Partner studios across D1–D7', 'Rhino Partners', 'Venue', 1),
  ('Recovery kit starter', 'Foam roller + bands bundle', 'MoveLab', 'Gear', 2)
) AS v(title, description, partner_name, category, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.partner_offers p WHERE p.title = v.title
);

DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available';
  END;
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_net not available';
  END;
END $$;
