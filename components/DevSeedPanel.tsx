import React, { useState } from 'react';
import { Database, LogOut } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useAuth } from '@/src/hooks/useAuth';
import { useToast } from '@/src/hooks/use-toast';
import { clearLegacyMockData, listCollectionAsync } from '@/src/lib/firebase-store';

/**
 * Dev panel: shows live Firestore counts + quick sign-out.
 * Mock demo logins removed — use real Firebase Auth accounts.
 */
export function DevSeedPanel() {
  const show =
    import.meta.env.DEV || import.meta.env.VITE_SHOW_DEV_SEED === '1';
  const { user, userRole, signOut, signIn } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  if (!show) return null;

  const refreshCounts = async () => {
    setBusy(true);
    try {
      clearLegacyMockData();
      const [profiles, classes, venues, slots, bookings] = await Promise.all([
        listCollectionAsync('profiles', true),
        listCollectionAsync('classes', true),
        listCollectionAsync('venues', true),
        listCollectionAsync('class_slots', true),
        listCollectionAsync('bookings', true),
      ]);
      setCounts({
        profiles: profiles.length,
        classes: classes.length,
        venues: venues.length,
        slots: slots.length,
        bookings: bookings.length,
      });
    } catch (e) {
      toast({
        title: 'Firestore read failed',
        description: e instanceof Error ? e.message : 'Check rules / network',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-3 z-[60] w-[min(100vw-1.5rem,18rem)] rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur md:bottom-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Database className="size-3.5" />
        Live Firebase
      </div>
      <p className="mb-2 text-[11px] text-muted-foreground">
        {user
          ? `Signed in as ${user.displayName || user.email} (${userRole || '—'})`
          : 'Use real Auth signup/login — mock data removed'}
      </p>
      <div className="mb-2 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
        {Object.entries(counts).map(([k, v]) => (
          <span key={k} className="rounded bg-muted/60 px-1.5 py-0.5 tabular-nums">
            {k}: {v}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void refreshCounts()}>
          Refresh Firestore counts
        </Button>
        {!user ? (
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => void signIn('alex@rhinofit.app', 'RhinoFit123!')}
          >
            Sign in as Alex (seeded)
          </Button>
        ) : (
          <Button type="button" size="sm" variant="ghost" className="gap-1" onClick={() => void signOut()}>
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        )}
      </div>
    </div>
  );
}
