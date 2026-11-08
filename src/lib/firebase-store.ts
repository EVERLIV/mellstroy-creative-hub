import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  buildSeedCollections,
  type CollectionName,
  type SeedCollections,
} from '../data/seed/mockBackendData';

const STORAGE_KEY = 'rhinofit.firebase.mockStore.v1';
const SEEDED_FLAG = 'rhinofit.firebase.seeded';

type Row = DocumentData & { id: string };
type Store = Record<string, Row[]>;

function cloneSeed(): Store {
  const seed = buildSeedCollections();
  const out: Store = {};
  for (const [key, rows] of Object.entries(seed) as [CollectionName, SeedCollections[CollectionName]][]) {
    out[key] = (rows as Row[]).map((r) => ({ ...r }));
  }
  return out;
}

function loadLocal(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    /* ignore */
  }
  const seeded = cloneSeed();
  saveLocal(seeded);
  localStorage.setItem(SEEDED_FLAG, '1');
  return seeded;
}

function saveLocal(store: Store) {
  try {
    // Cap noisy collections so analytics spam cannot blow up localStorage / freeze the tab.
    if (Array.isArray(store.analytics_events) && store.analytics_events.length > 200) {
      store.analytics_events = store.analytics_events.slice(-100);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

let memory: Store | null = null;

export function getStore(): Store {
  if (typeof window === 'undefined') {
    return cloneSeed();
  }
  if (!memory) memory = loadLocal();
  return memory;
}

export function resetStore() {
  memory = cloneSeed();
  saveLocal(memory);
  localStorage.setItem(SEEDED_FLAG, '1');
  return memory;
}

export function ensureSeeded() {
  if (typeof window === 'undefined') return getStore();
  if (!localStorage.getItem(SEEDED_FLAG)) {
    return resetStore();
  }
  return getStore();
}

function persist() {
  if (memory) saveLocal(memory);
}

export function listCollection(name: string): Row[] {
  ensureSeeded();
  const store = getStore();
  if (!store[name]) store[name] = [];
  return store[name];
}

export function upsertRow(name: string, row: Row) {
  const rows = listCollection(name);
  const idx = rows.findIndex((r) => r.id === row.id);
  if (idx >= 0) rows[idx] = { ...rows[idx], ...row };
  else rows.push(row);
  persist();
  return row;
}

export function deleteRow(name: string, id: string) {
  const store = getStore();
  store[name] = listCollection(name).filter((r) => r.id !== id);
  persist();
}

export function updateRows(
  name: string,
  match: (row: Row) => boolean,
  patch: Partial<Row>
) {
  const rows = listCollection(name);
  let count = 0;
  for (let i = 0; i < rows.length; i++) {
    if (match(rows[i])) {
      rows[i] = { ...rows[i], ...patch };
      count += 1;
    }
  }
  persist();
  return count;
}

/** Push local seed into Firestore (best-effort; needs auth + rules). */
export async function syncSeedToFirestore() {
  const store = ensureSeeded();
  const batch = writeBatch(db);
  let ops = 0;
  for (const [col, rows] of Object.entries(store)) {
    for (const row of rows) {
      batch.set(doc(db, col, String(row.id)), row, { merge: true });
      ops += 1;
      if (ops >= 400) break;
    }
    if (ops >= 400) break;
  }
  await batch.commit();
  return ops;
}

export async function pullCollectionFromFirestore(name: string) {
  const snap = await getDocs(collection(db, name));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const store = getStore();
  store[name] = rows;
  persist();
  return rows;
}

export async function getFirestoreDoc(name: string, id: string) {
  const snap = await getDoc(doc(db, name, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function setFirestoreDoc(name: string, id: string, data: DocumentData) {
  await setDoc(doc(db, name, id), { ...data, id }, { merge: true });
  upsertRow(name, { ...data, id } as Row);
}
