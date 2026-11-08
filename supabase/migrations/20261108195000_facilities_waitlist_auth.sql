-- Facilities linked to classes + waitlist trainer visibility helpers

CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  description text,
  address text,
  district text,
  image_url text,
  image_urls text[] DEFAULT '{}',
  price_per_hour numeric(12,2) DEFAULT 0,
  amenities text[] DEFAULT '{}',
  equipment text[] DEFAULT '{}',
  capacity integer,
  rating numeric(3,2) DEFAULT 0,
  reviews_count integer DEFAULT 0,
  phone text,
  email text,
  website text,
  is_active boolean DEFAULT true,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS venues_district_idx ON public.venues (district);
CREATE INDEX IF NOT EXISTS venues_active_idx ON public.venues (is_active);

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS classes_venue_idx ON public.classes (venue_id);

-- Many-to-many for multi-facility classes (optional)
CREATE TABLE IF NOT EXISTS public.class_venues (
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  PRIMARY KEY (class_id, venue_id)
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY venues_public_read ON public.venues
  FOR SELECT USING (is_active = true OR owner_id = auth.uid());
CREATE POLICY venues_owner_write ON public.venues
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY class_venues_public_read ON public.class_venues
  FOR SELECT USING (true);
CREATE POLICY class_venues_trainer_write ON public.class_venues
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_venues.class_id AND c.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_venues.class_id AND c.trainer_id = auth.uid()
    )
  );

-- Trainer can update waitlist status (notified / cancelled) for their classes
DROP POLICY IF EXISTS waitlist_trainer_update ON public.waitlist_entries;
CREATE POLICY waitlist_trainer_update ON public.waitlist_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = waitlist_entries.class_id AND c.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = waitlist_entries.class_id AND c.trainer_id = auth.uid()
    )
  );

-- Authenticated users may insert notifications for themselves OR for a class trainer
-- when joining waitlist / booking (controlled by payload type checks in app + this policy)
DROP POLICY IF EXISTS notifications_insert_self ON public.notifications;
CREATE POLICY notifications_insert_authenticated ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.trainer_id = notifications.user_id
        AND (
          notifications.type LIKE 'waitlist%'
          OR notifications.type LIKE 'booking%'
        )
    )
  );

-- Seed a few HCMC facilities
INSERT INTO public.venues (name, category, description, address, district, image_url, price_per_hour, amenities, capacity, rating, reviews_count)
SELECT * FROM (VALUES
  (
    'Elite Tennis Club',
    'tennis',
    'Premium tennis facility with indoor and outdoor courts.',
    '123 Nguyen Hue Boulevard',
    'Quận 1',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
    500000::numeric,
    ARRAY['Parking','Locker Room','Shower','WiFi'],
    32,
    4.8::numeric,
    156
  ),
  (
    'District 3 Training Hall',
    'gym',
    'Multi-sport hall for group classes and 1:1 coaching.',
    '456 Le Loi Street',
    'Quận 3',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    300000::numeric,
    ARRAY['AC','Mats','Parking'],
    40,
    4.6::numeric,
    89
  ),
  (
    'Saigon Yoga Loft',
    'yoga',
    'Quiet loft studio for yoga and mobility.',
    '88 Dong Khoi',
    'Quận 1',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    250000::numeric,
    ARRAY['Mats','Shower','Tea'],
    20,
    4.9::numeric,
    210
  )
) AS v(name, category, description, address, district, image_url, price_per_hour, amenities, capacity, rating, reviews_count)
WHERE NOT EXISTS (SELECT 1 FROM public.venues x WHERE x.name = v.name);

-- Attach a default facility to classes missing venue_id
UPDATE public.classes c
SET venue_id = (
  SELECT v.id FROM public.venues v WHERE v.is_active = true ORDER BY v.created_at ASC LIMIT 1
)
WHERE c.venue_id IS NULL
  AND EXISTS (SELECT 1 FROM public.venues v WHERE v.is_active = true);

INSERT INTO public.class_venues (class_id, venue_id, is_primary)
SELECT c.id, c.venue_id, true
FROM public.classes c
WHERE c.venue_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.class_venues cv WHERE cv.class_id = c.id AND cv.venue_id = c.venue_id
  );
