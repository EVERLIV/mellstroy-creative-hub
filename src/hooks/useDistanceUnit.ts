import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { DistanceUnit } from '../lib/geo';

const STORAGE_KEY = 'rhinofit.distanceUnit';

function readStored(): DistanceUnit {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'km' || value === 'mi') return value;
  } catch {
    /* ignore */
  }
  return 'km';
}

/**
 * Distance display unit from profile preference (localStorage + optional profiles.distance_unit).
 * Vietnam default: km. Profile edit can switch to miles.
 */
export function useDistanceUnit(userId?: string | null) {
  const [unit, setUnitState] = useState<DistanceUnit>(() => readStored());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const stored = readStored();
      if (!userId) {
        if (!cancelled) setUnitState(stored);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('distance_unit')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;

      const remote = (data as { distance_unit?: string } | null)?.distance_unit;
      if (remote === 'km' || remote === 'mi') {
        setUnitState(remote);
        try {
          localStorage.setItem(STORAGE_KEY, remote);
        } catch {
          /* ignore */
        }
      } else {
        setUnitState(stored);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setUnit = useCallback(
    async (next: DistanceUnit) => {
      setUnitState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      if (!userId) return;
      try {
        await supabase.from('profiles').update({ distance_unit: next } as never).eq('id', userId);
      } catch {
        /* column may not exist yet — local preference still works */
      }
    },
    [userId]
  );

  return { unit, setUnit };
}
