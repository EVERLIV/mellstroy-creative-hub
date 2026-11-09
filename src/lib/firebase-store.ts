/**
 * Live Firestore data layer for RhinoFit.
 * No localStorage mock store — every read/write hits Firebase (with a short memory cache).
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

type Row = DocumentData & { id: string };

const cache = new Map<string, { at: number; rows: Row[] }>();
const CACHE_TTL_MS = 15_000;

const LEGACY_KEYS = [
  'rhinofit.firebase.mockStore.v1',
  'rhinofit.firebase.mockStore.v2',
  'rhinofit.firebase.seeded',
  'rhinofit.firebase.seeded.v2',
  'rhinofit.demoUser',
];

export function clearLegacyMockData() {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith('rhinofit.firebase.mockStore')) {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    }
  }
  cache.clear();
}

/** Wipe any leftover mock blobs on first import. */
if (typeof window !== 'undefined') {
  clearLegacyMockData();
}

function invalidate(name?: string) {
  if (name) cache.delete(name);
  else cache.clear();
}

export async function listCollectionAsync(name: string, force = false): Promise<Row[]> {
  const hit = cache.get(name);
  if (!force && hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.rows;
  }
  const snap = await getDocs(collection(db, name));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Row[];
  cache.set(name, { at: Date.now(), rows });
  return rows;
}

/** Sync helper for rare call sites — prefer listCollectionAsync. */
export function listCollection(name: string): Row[] {
  return cache.get(name)?.rows ?? [];
}

export async function ensureCollection(name: string): Promise<Row[]> {
  return listCollectionAsync(name);
}

/** No-op kept for older call sites; real data lives in Firestore. */
export function ensureSeeded() {
  return { ok: true };
}

export async function upsertRow(name: string, row: Row) {
  const id = String(row.id);
  const payload = { ...row, id };
  await setDoc(doc(db, name, id), payload, { merge: true });
  const rows = await listCollectionAsync(name, true);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx >= 0) rows[idx] = { ...rows[idx], ...payload };
  else rows.push(payload);
  cache.set(name, { at: Date.now(), rows });
  return payload;
}

export async function deleteRow(name: string, id: string) {
  await deleteDoc(doc(db, name, id));
  invalidate(name);
  await listCollectionAsync(name, true);
}

export async function updateRows(
  name: string,
  match: (row: Row) => boolean,
  patch: Partial<Row>
) {
  const rows = await listCollectionAsync(name, true);
  const batch = writeBatch(db);
  let count = 0;
  for (const row of rows) {
    if (!match(row)) continue;
    const next = { ...row, ...patch, id: row.id };
    batch.set(doc(db, name, row.id), next, { merge: true });
    count += 1;
  }
  if (count) await batch.commit();
  invalidate(name);
  return count;
}

export async function getFirestoreDoc(name: string, id: string) {
  const snap = await getDoc(doc(db, name, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function setFirestoreDoc(name: string, id: string, data: DocumentData) {
  return upsertRow(name, { ...data, id } as Row);
}

/** @deprecated mock sync removed — use scripts/seed-firestore.mjs */
export async function syncSeedToFirestore() {
  return 0;
}

export async function pullCollectionFromFirestore(name: string) {
  return listCollectionAsync(name, true);
}

export function resetStore() {
  clearLegacyMockData();
  return {};
}
