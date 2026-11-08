/**
 * Firebase-backed data client with a Supabase-like chain API
 * so existing pages keep working while the backend is Firestore + local seed.
 */
import { auth } from '@/src/lib/firebase';
import {
  deleteRow,
  ensureSeeded,
  listCollection,
  updateRows,
  upsertRow,
} from '@/src/lib/firebase-store';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

type Row = Record<string, unknown> & { id: string };

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nestJoin(rows: Row[], select: string): Row[] {
  // Support simple nested selects like:
  // `*, classes:class_id (...), profiles:user_id (...)`
  const classJoin = /classes:class_id/.test(select);
  const profileJoin = /profiles:user_id/.test(select);
  const venueJoin = /venues:venue_id/.test(select);
  const clientJoin = /client:client_id/.test(select);
  const trainerProfileJoin = /profiles:trainer_id/.test(select);
  if (!classJoin && !profileJoin && !venueJoin && !clientJoin && !trainerProfileJoin) {
    return rows;
  }

  const classes = listCollection('classes');
  const profiles = listCollection('profiles');
  const venues = listCollection('venues');

  return rows.map((row) => {
    const next: Row = { ...row };
    if (classJoin && row.class_id) {
      const cls = classes.find((c) => c.id === row.class_id);
      if (cls) {
        const classRow: Row = { ...cls };
        if (venueJoin || /venues:venue_id/.test(select)) {
          classRow.venues = venues.find((v) => v.id === cls.venue_id) || null;
        }
        if (trainerProfileJoin || /profiles:trainer_id/.test(select)) {
          classRow.profiles = profiles.find((p) => p.id === cls.trainer_id) || null;
        }
        next.classes = classRow;
      }
    }
    if (profileJoin && row.user_id) {
      next.profiles = profiles.find((p) => p.id === row.user_id) || null;
    }
    if (clientJoin && row.client_id) {
      next.client = profiles.find((p) => p.id === row.client_id) || null;
    }
    if (venueJoin && row.venue_id) {
      next.venues = venues.find((v) => v.id === row.venue_id) || null;
    }
    return next;
  });
}

class QueryBuilder {
  private filters: Array<(row: Row) => boolean> = [];
  private inFilters: Array<{ col: string; values: unknown[] }> = [];
  private orderByField: string | null = null;
  private ascending = true;
  private limitN: number | null = null;
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertPayload: Row | Row[] | null = null;
  private updatePayload: Partial<Row> | null = null;
  private selectClause = '*';
  private wantSingle = false;
  private wantMaybeSingle = false;
  private countOnly = false;
  private headOnly = false;
  private pending: Promise<{
    data: unknown;
    error: { message: string } | null;
    count: number;
  }> | null = null;

  constructor(private table: string) {
    ensureSeeded();
  }

  select(columns = '*', opts?: { count?: 'exact'; head?: boolean }) {
    this.selectClause = columns;
    this.mode = 'select';
    if (opts?.count === 'exact') this.countOnly = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }

  insert(payload: Record<string, unknown> | Record<string, unknown>[]) {
    this.mode = 'insert';
    this.insertPayload = (
      Array.isArray(payload) ? payload : [payload]
    ).map((p) => ({ id: String((p as Row).id || uid()), ...p })) as Row[];
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.mode = 'update';
    this.updatePayload = payload as Partial<Row>;
    return this;
  }

  delete() {
    this.mode = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.inFilters.push({ col: column, values });
    return this;
  }

  ilike(column: string, pattern: string) {
    const needle = pattern.replace(/%/g, '').toLowerCase();
    this.filters.push((row) => String(row[column] ?? '').toLowerCase().includes(needle));
    return this;
  }

  or(_expr: string) {
    // simplified: no-op pass-through for frequently_together
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push((row) => {
      const a = row[column];
      if (a == null) return true;
      return a <= (value as never);
    });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push((row) => {
      const a = row[column];
      if (a == null) return false;
      return a < (value as never);
    });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push((row) => {
      const a = row[column];
      if (a == null) return false;
      return a >= (value as never);
    });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderByField = column;
    this.ascending = opts?.ascending !== false;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this.run();
  }

  maybeSingle() {
    this.wantMaybeSingle = true;
    return this.run();
  }

  private run() {
    if (!this.pending) this.pending = this.execute();
    return this.pending;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: Awaited<ReturnType<QueryBuilder['execute']>>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.run().then(onfulfilled, onrejected);
  }

  private applyFilters(rows: Row[]) {
    let out = rows.filter((row) => this.filters.every((f) => f(row)));
    for (const inf of this.inFilters) {
      out = out.filter((row) => inf.values.includes(row[inf.col]));
    }
    if (this.orderByField) {
      const key = this.orderByField;
      out = [...out].sort((a, b) => {
        const av = a[key] as never;
        const bv = b[key] as never;
        if (av === bv) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return (av > bv ? 1 : -1) * (this.ascending ? 1 : -1);
      });
    }
    if (this.limitN != null) out = out.slice(0, this.limitN);
    return nestJoin(out, this.selectClause);
  }

  private async execute() {
    try {
      if (this.mode === 'insert' && this.insertPayload) {
        const rows = Array.isArray(this.insertPayload)
          ? this.insertPayload
          : [this.insertPayload];
        const saved = rows.map((r) => upsertRow(this.table, r as Row));
        if (this.wantSingle || this.wantMaybeSingle) {
          return { data: saved[0] ?? null, error: null, count: saved.length };
        }
        return { data: saved, error: null, count: saved.length };
      }

      const matched = this.applyFilters(listCollection(this.table) as Row[]);

      if (this.mode === 'update' && this.updatePayload) {
        const ids = new Set(matched.map((m) => m.id));
        updateRows(this.table, (r) => ids.has(r.id), this.updatePayload);
        const updated = this.applyFilters(listCollection(this.table) as Row[]);
        if (this.wantSingle || this.wantMaybeSingle) {
          return { data: updated[0] ?? null, error: null, count: updated.length };
        }
        return { data: updated, error: null, count: updated.length };
      }

      if (this.mode === 'delete') {
        matched.forEach((m) => deleteRow(this.table, m.id));
        return { data: null, error: null, count: matched.length };
      }

      if (this.countOnly || this.headOnly) {
        return { data: null, error: null, count: matched.length };
      }

      if (this.wantSingle) {
        if (!matched.length) {
          return { data: null, error: { message: 'No rows' }, count: 0 };
        }
        return { data: matched[0], error: null, count: 1 };
      }
      if (this.wantMaybeSingle) {
        return { data: matched[0] ?? null, error: null, count: matched.length };
      }
      return { data: matched, error: null, count: matched.length };
    } catch (e) {
      return {
        data: null,
        error: { message: e instanceof Error ? e.message : 'Query failed' },
        count: 0,
      };
    }
  }
}

function mapUser(u: FirebaseUser | null) {
  if (!u) return null;
  return {
    id: u.uid,
    uid: u.uid,
    email: u.email,
    user_metadata: { username: u.displayName || u.email?.split('@')[0] },
    app_metadata: {},
    aud: 'authenticated',
    created_at: u.metadata.creationTime || '',
  };
}

export const firebaseClient = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  auth: {
    async getUser() {
      return { data: { user: mapUser(auth.currentUser) }, error: null };
    },
    async getSession() {
      const user = mapUser(auth.currentUser);
      return {
        data: {
          session: user
            ? { user, access_token: 'firebase', refresh_token: 'firebase' }
            : null,
        },
        error: null,
      };
    },
    onAuthStateChange(cb: (event: string, session: { user: ReturnType<typeof mapUser> } | null) => void) {
      const unsub = onAuthStateChanged(auth, (u) => {
        const user = mapUser(u);
        cb(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);
      });
      return { data: { subscription: { unsubscribe: unsub } } };
    },
    async signInWithPassword() {
      return { data: null, error: { message: 'Use Firebase Auth via useAuth' } };
    },
    async signUp() {
      return { data: null, error: { message: 'Use Firebase Auth via useAuth' } };
    },
    async signOut() {
      return { error: null };
    },
    async signInWithOAuth() {
      return { data: null, error: { message: 'Use Firebase Auth via useAuth' } };
    },
  },
  channel(name: string) {
    const handlers: Array<() => void> = [];
    return {
      on(_evt: string, _filter: unknown, cb: () => void) {
        handlers.push(cb);
        return this;
      },
      subscribe() {
        return { status: 'SUBSCRIBED' };
      },
      unsubscribe() {
        handlers.length = 0;
      },
    };
  },
  removeChannel(_ch: unknown) {
    return Promise.resolve('ok');
  },
  functions: {
    async invoke(name: string, opts?: { body?: Record<string, unknown> }) {
      // Local mock cloud functions
      if (name === 'create-booking-payment') {
        const holdId = opts?.body?.holdId || 'local';
        return {
          data: {
            clientSecret: null,
            paymentIntentId: `mock_pi_${holdId}`,
            amount: opts?.body?.tipAmount || 0,
            currency: 'vnd',
            mock: true,
          },
          error: null,
        };
      }
      if (name === 'marketplace-lifecycle') {
        return { data: { ok: true, summary: { mock: true } }, error: null };
      }
      return { data: null, error: { message: `Unknown function ${name}` } };
    },
  },
};

/** Drop-in replacement used across the app */
export const supabase = firebaseClient;
export default firebaseClient;
