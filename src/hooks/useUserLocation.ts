import { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

/** Current user's district from profiles.location / district. */
export function useUserLocation(userId?: string | null) {
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userId) {
        setLocation(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('location, district')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;
      const row = data as { location?: string; district?: string } | null;
      setLocation(row?.location || row?.district || null);
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { location, loading, setLocation };
}
