import React, { useState } from 'react';
import { Database, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { ensureSeeded, resetStore, syncSeedToFirestore } from '@/src/lib/firebase-store';
import { useAuth } from '@/src/hooks/useAuth';
import { useToast } from '@/src/hooks/use-toast';
import { listCollection } from '@/src/lib/firebase-store';

/**
 * Dev-only panel: reset mock data, push to Firestore, demo login.
 * Hidden in production builds unless VITE_SHOW_DEV_SEED=1.
 */
export function DevSeedPanel() {
  const show =
    import.meta.env.DEV || import.meta.env.VITE_SHOW_DEV_SEED === '1';
  const { signInAsDemo, user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!show) return null;

  const counts = () => {
    ensureSeeded();
    return {
      trainers: listCollection('profiles').filter((p) => p.role === 'trainer').length,
      classes: listCollection('classes').length,
      venues: listCollection('venues').length,
      waitlist: listCollection('waitlist_entries').length,
      bookings: listCollection('bookings').length,
    };
  };

  return (
    <div className="fixed bottom-20 right-3 z-[60] w-[min(100vw-1.5rem,18rem)] rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur md:bottom-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Database className="size-3.5" />
        Firebase mock backend
      </div>
      <p className="mb-2 text-[11px] text-muted-foreground">
        {user
          ? `Signed in as ${user.displayName || user.email} (${userRole || '—'})`
          : 'Not signed in — use demo roles to test waitlist/bookings'}
      </p>
      <div className="mb-2 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
        {Object.entries(counts()).map(([k, v]) => (
          <span key={k} className="rounded bg-muted/60 px-1.5 py-0.5 tabular-nums">
            {k}: {v}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => void signInAsDemo('student')}
          >
            Demo student
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="flex-1"
            disabled={busy}
            onClick={() => void signInAsDemo('trainer')}
          >
            Demo trainer
          </Button>
        </div>
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 gap-1"
            disabled={busy}
            onClick={() => {
              resetStore();
              toast({ title: 'Mock data reset' });
            }}
          >
            <RefreshCw className="size-3.5" />
            Reset seed
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 gap-1"
            disabled={busy}
            onClick={() => {
              void (async () => {
                setBusy(true);
                try {
                  const n = await syncSeedToFirestore();
                  toast({ title: 'Synced to Firestore', description: `${n} docs written` });
                } catch (e) {
                  toast({
                    title: 'Firestore sync failed',
                    description: e instanceof Error ? e.message : 'Check rules / login',
                    variant: 'destructive',
                  });
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            <Upload className="size-3.5" />
            Sync
          </Button>
        </div>
        {user ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => void signOut()}>
            Sign out
          </Button>
        ) : null}
      </div>
    </div>
  );
}
