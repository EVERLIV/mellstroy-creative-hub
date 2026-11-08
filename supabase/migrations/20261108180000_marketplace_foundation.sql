-- RhinoFit marketplace foundation (Phase 0)
-- Profiles extensions, packages, promotions, saved searches, waitlist, holds, analytics, reviews enrich

-- ---------------------------------------------------------------------------
-- Profiles: discovery + quality signals
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IS NULL OR gender IN ('female', 'male', 'other', 'unspecified')),
  ADD COLUMN IF NOT EXISTS distance_unit text DEFAULT 'km' CHECK (distance_unit IS NULL OR distance_unit IN ('km', 'mi')),
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS response_time_ms integer,
  ADD COLUMN IF NOT EXISTS acceptance_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS is_online_eligible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS bonus_balance numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_district_idx ON public.profiles (district);
CREATE INDEX IF NOT EXISTS profiles_last_seen_idx ON public.profiles (last_seen DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- Reviews: photos, criteria, trainer reply
-- ---------------------------------------------------------------------------
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS criteria jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS trainer_reply text,
  ADD COLUMN IF NOT EXISTS trainer_replied_at timestamptz;

-- ---------------------------------------------------------------------------
-- Class packages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  sessions integer NOT NULL CHECK (sessions > 0),
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  anchor_price numeric(12,2),
  savings_pct numeric(5,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS class_packages_class_idx ON public.class_packages (class_id) WHERE is_active;

CREATE TABLE IF NOT EXISTS public.package_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.class_packages(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sessions_total integer NOT NULL,
  sessions_remaining integer NOT NULL,
  amount_paid numeric(12,2) NOT NULL,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Promoted listings (paid ranking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promoted_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('trainer', 'class')),
  target_id uuid NOT NULL,
  weight integer NOT NULL DEFAULT 10,
  insert_every_n integer DEFAULT 6,
  budget numeric(12,2),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promoted_listings_active_idx
  ON public.promoted_listings (target_type, is_active, weight DESC);

-- ---------------------------------------------------------------------------
-- Saved searches
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  target text NOT NULL DEFAULT 'trainer' CHECK (target IN ('trainer', 'class')),
  notify boolean NOT NULL DEFAULT true,
  last_notified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_searches_user_idx ON public.saved_searches (user_id);

-- ---------------------------------------------------------------------------
-- Waitlist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_date date,
  preferred_time text,
  status text NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'notified', 'booked', 'cancelled')),
  notified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (class_id, user_id, status)
);

CREATE INDEX IF NOT EXISTS waitlist_class_status_idx ON public.waitlist_entries (class_id, status);

-- ---------------------------------------------------------------------------
-- Booking holds (10 min slot reservation)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hold_date date NOT NULL,
  hold_time text NOT NULL,
  package_id uuid REFERENCES public.class_packages(id),
  upsells jsonb DEFAULT '[]'::jsonb,
  promo_code text,
  service_fee numeric(12,2) DEFAULT 0,
  insurance_fee numeric(12,2) DEFAULT 0,
  subtotal numeric(12,2) NOT NULL,
  total numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'held'
    CHECK (status IN ('held', 'converted', 'expired', 'abandoned')),
  expires_at timestamptz NOT NULL,
  reminded_1h boolean DEFAULT false,
  reminded_24h boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_holds_expiry_idx
  ON public.booking_holds (status, expires_at)
  WHERE status = 'held';

-- ---------------------------------------------------------------------------
-- Bookings: payment + lifecycle fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS hold_id uuid REFERENCES public.booking_holds(id),
  ADD COLUMN IF NOT EXISTS package_purchase_id uuid REFERENCES public.package_purchases(id),
  ADD COLUMN IF NOT EXISTS amount_paid numeric(12,2),
  ADD COLUMN IF NOT EXISTS service_fee numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tip_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS rescheduled_from uuid REFERENCES public.bookings(id);

-- ---------------------------------------------------------------------------
-- Promo codes + partner offers + related services
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric(12,2) NOT NULL,
  max_uses integer,
  uses_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  partner_name text,
  image_url text,
  cta_url text,
  category text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.related_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_specialty text NOT NULL,
  related_label text NOT NULL,
  related_category text,
  related_class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  related_trainer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.frequently_together (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_a_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  class_b_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  score integer DEFAULT 1,
  UNIQUE (class_a_id, class_b_id)
);

-- ---------------------------------------------------------------------------
-- Analytics events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  props jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_name_created_idx
  ON public.analytics_events (name, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_user_idx
  ON public.analytics_events (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Notifications: title + link for in-app center
-- ---------------------------------------------------------------------------
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS href text,
  ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Portfolio media on trainers (gallery enrichment)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trainer_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video', 'before_after')),
  url text NOT NULL,
  before_url text,
  after_url text,
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trainer_portfolio_trainer_idx ON public.trainer_portfolio (trainer_id, sort_order);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.class_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoted_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.related_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequently_together ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_portfolio ENABLE ROW LEVEL SECURITY;

-- Public read for catalog surfaces
CREATE POLICY class_packages_public_read ON public.class_packages
  FOR SELECT USING (is_active = true);
CREATE POLICY class_packages_owner_all ON public.class_packages
  FOR ALL USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY package_purchases_own ON public.package_purchases
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY promoted_listings_public_read ON public.promoted_listings
  FOR SELECT USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY saved_searches_own ON public.saved_searches
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY waitlist_own ON public.waitlist_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY waitlist_trainer_read ON public.waitlist_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = waitlist_entries.class_id AND c.trainer_id = auth.uid()
    )
  );

CREATE POLICY booking_holds_own ON public.booking_holds
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY promo_codes_public_read ON public.promo_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY partner_offers_public_read ON public.partner_offers
  FOR SELECT USING (is_active = true);

CREATE POLICY related_services_public_read ON public.related_services
  FOR SELECT USING (is_active = true);

CREATE POLICY frequently_together_public_read ON public.frequently_together
  FOR SELECT USING (true);

CREATE POLICY analytics_events_insert ON public.analytics_events
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY analytics_events_own_read ON public.analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY trainer_portfolio_public_read ON public.trainer_portfolio
  FOR SELECT USING (true);
CREATE POLICY trainer_portfolio_owner_all ON public.trainer_portfolio
  FOR ALL USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);

-- Notifications policies if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_own_select'
  ) THEN
    CREATE POLICY notifications_own_select ON public.notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_own_update'
  ) THEN
    CREATE POLICY notifications_own_update ON public.notifications
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_insert_self'
  ) THEN
    CREATE POLICY notifications_insert_self ON public.notifications
      FOR INSERT WITH CHECK (auth.uid() = user_id OR true);
  END IF;
END $$;

-- Seed helper packages for existing classes (optional soft seed)
INSERT INTO public.class_packages (class_id, trainer_id, name, sessions, price, anchor_price, savings_pct)
SELECT c.id, c.trainer_id, 'Single session', 1, c.price, c.price, 0
FROM public.classes c
WHERE NOT EXISTS (
  SELECT 1 FROM public.class_packages p WHERE p.class_id = c.id AND p.sessions = 1
)
ON CONFLICT DO NOTHING;

INSERT INTO public.class_packages (class_id, trainer_id, name, sessions, price, anchor_price, savings_pct)
SELECT c.id, c.trainer_id, '5-session pack', 5, ROUND((c.price * 5 * 0.82)::numeric, 0), c.price * 5, 18
FROM public.classes c
WHERE NOT EXISTS (
  SELECT 1 FROM public.class_packages p WHERE p.class_id = c.id AND p.sessions = 5
)
ON CONFLICT DO NOTHING;

INSERT INTO public.class_packages (class_id, trainer_id, name, sessions, price, anchor_price, savings_pct)
SELECT c.id, c.trainer_id, '10-session pack', 10, ROUND((c.price * 10 * 0.75)::numeric, 0), c.price * 10, 25
FROM public.classes c
WHERE NOT EXISTS (
  SELECT 1 FROM public.class_packages p WHERE p.class_id = c.id AND p.sessions = 10
)
ON CONFLICT DO NOTHING;
