/**
 * Seed real Firebase Auth users + Firestore marketplace data for rihnofit.
 * Usage: node scripts/seed-firestore.mjs
 * Requires: gcloud auth (access token) + Blaze / Identity Toolkit enabled.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const PROJECT = 'rihnofit';
const API_KEY = 'AIzaSyBIwYEuZrP65pFmotNvNBRvFOMRcV75YhE';

function token() {
  return execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
}

function loadEnvKey() {
  try {
    const env = readFileSync(resolve(root, '.env.local'), 'utf8');
    const m = env.match(/VITE_FIREBASE_API_KEY=(.+)/);
    return (m?.[1] || API_KEY).trim();
  } catch {
    return API_KEY;
  }
}

const apiKey = loadEnvKey();
const access = token();

async function authSignup(email, password, displayName) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
    }
  );
  const json = await res.json();
  if (json.localId) return { uid: json.localId, created: true };
  if (json.error?.message === 'EMAIL_EXISTS') {
    // lookup via accounts:signInWithPassword
    const sign = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const s = await sign.json();
    if (!s.localId) throw new Error(`Cannot sign in ${email}: ${s.error?.message}`);
    return { uid: s.localId, created: false };
  }
  throw new Error(`Signup failed ${email}: ${json.error?.message || res.status}`);
}

function toValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((v) => toValue(v)) } };
  }
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (typeof value === 'object') {
    const map = {};
    for (const [k, v] of Object.entries(value)) map[k] = toValue(v);
    return { mapValue: { fields: map } };
  }
  return { stringValue: String(value) };
}

function toDocumentFields(data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toValue(v);
  return fields;
}

async function setDoc(collection, id, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${collection}/${encodeURIComponent(id)}`;
  const body = JSON.stringify({ fields: toDocumentFields(data) });
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${access}`,
      'Content-Type': 'application/json',
      'x-goog-user-project': PROJECT,
    },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Firestore set ${collection}/${id}: ${t}`);
  }
}

function dateKey(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function nextWeekday(weekday, hour, minute = 0) {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(hour, minute, 0, 0);
  const delta = (weekday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d;
}

const PASSWORD = 'RhinoFit123!';

const users = [
  { key: 'alex', email: 'alex@rhinofit.app', name: 'Alex Athlete', role: 'student' },
  { key: 'mai', email: 'mai@rhinofit.app', name: 'Mai Nguyen', role: 'student' },
  { key: 'jordan', email: 'jordan@rhinofit.app', name: 'Jordan Lee', role: 'student' },
  { key: 'priya', email: 'priya@rhinofit.app', name: 'Priya Shah', role: 'student' },
  {
    key: 'minh',
    email: 'minh@rhinofit.app',
    name: 'Minh Strength',
    role: 'trainer',
    specialty: ['Fitness', 'Strength'],
    price: 450000,
    bio: 'Former national team S&C coach.',
  },
  {
    key: 'linh',
    email: 'linh@rhinofit.app',
    name: 'Linh Yoga',
    role: 'trainer',
    specialty: ['Yoga', 'Mobility'],
    price: 320000,
    bio: 'Vinyasa + mobility for desk athletes.',
  },
  {
    key: 'kai',
    email: 'kai@rhinofit.app',
    name: 'Kai Boxing',
    role: 'trainer',
    specialty: ['Boxing', 'Fitness'],
    price: 380000,
    bio: 'Pad work, sparring drills, fight conditioning.',
  },
];

async function main() {
  console.log('Seeding Firebase Auth + Firestore for', PROJECT);
  const ids = {};
  for (const u of users) {
    const { uid, created } = await authSignup(u.email, PASSWORD, u.name);
    ids[u.key] = uid;
    console.log(`${created ? 'created' : 'exists'} ${u.email} -> ${uid}`);
    const now = new Date().toISOString();
    await setDoc('profiles', uid, {
      id: uid,
      username: u.name,
      email: u.email,
      role: u.role,
      specialty: u.specialty || [],
      rating: u.role === 'trainer' ? 4.8 : 0,
      reviews_count: u.role === 'trainer' ? 40 : 0,
      price_per_hour: u.price || 0,
      avatar_url:
        u.role === 'trainer'
          ? 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400'
          : 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200',
      location: 'Ho Chi Minh City',
      district: 'Quận 1',
      is_verified: u.role === 'trainer',
      is_premium: u.key === 'minh' || u.key === 'kai',
      bio: u.bio || '',
      onboarding_completed: true,
      gender: 'other',
      created_at: now,
      last_seen: now,
    });
    await setDoc('user_roles', uid, { id: uid, user_id: uid, role: u.role });
  }

  const venues = [
    {
      id: 'venue-elite',
      name: 'Elite Performance Club',
      category: 'fitness',
      description: 'Strength hall + recovery in District 1.',
      address: '123 Nguyen Hue',
      district: 'Quận 1',
      image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      price_per_hour: 500000,
      amenities: ['Parking', 'Locker', 'Shower'],
      capacity: 32,
      rating: 4.8,
      reviews_count: 120,
      is_active: true,
    },
    {
      id: 'venue-yoga',
      name: 'Saigon Yoga Loft',
      category: 'yoga',
      description: 'Quiet loft for yoga and mobility.',
      address: '88 Dong Khoi',
      district: 'Quận 1',
      image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      price_per_hour: 250000,
      amenities: ['Mats', 'Tea'],
      capacity: 20,
      rating: 4.9,
      reviews_count: 210,
      is_active: true,
    },
    {
      id: 'venue-fight',
      name: 'District 7 Fight Lab',
      category: 'boxing',
      description: 'Pads, bags, sparring ring.',
      address: '12 Nguyen Van Linh',
      district: 'Quận 7',
      image_url: 'https://images.unsplash.com/photo-1549719386-0ddced763883?w=800',
      price_per_hour: 350000,
      amenities: ['Ring', 'Bags'],
      capacity: 24,
      rating: 4.6,
      reviews_count: 72,
      is_active: true,
    },
  ];
  for (const v of venues) await setDoc('venues', v.id, v);

  const classes = [
    {
      id: 'class-strength',
      trainer_id: ids.minh,
      venue_id: 'venue-elite',
      name: 'Strength Foundations',
      description: 'Barbell patterns, bracing, progressive overload.',
      duration_minutes: 60,
      price: 450000,
      capacity: 8,
      class_type: 'Indoor',
      level: 'Intermediate',
      language: ['English', 'Vietnamese'],
      schedule_days: ['Mon', 'Wed', 'Fri'],
      schedule_time: '07:00',
      schedule_times: ['07:00', '12:00', '18:30'],
      image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      kids_friendly: false,
      disability_friendly: false,
    },
    {
      id: 'class-yoga',
      trainer_id: ids.linh,
      venue_id: 'venue-yoga',
      name: 'Morning Flow Yoga',
      description: 'Breath-led vinyasa for mobility and calm.',
      duration_minutes: 55,
      price: 320000,
      capacity: 12,
      class_type: 'Indoor',
      level: 'Beginner',
      language: ['English', 'Vietnamese'],
      schedule_days: ['Tue', 'Thu', 'Sat'],
      schedule_time: '08:30',
      schedule_times: ['08:30', '17:30'],
      image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      kids_friendly: true,
      disability_friendly: true,
    },
    {
      id: 'class-boxing',
      trainer_id: ids.kai,
      venue_id: 'venue-fight',
      name: 'Boxing Conditioning',
      description: 'Pads + conditioning circuits.',
      duration_minutes: 60,
      price: 380000,
      capacity: 6,
      class_type: 'Indoor',
      level: 'Advanced',
      language: ['English'],
      schedule_days: ['Mon', 'Tue', 'Thu'],
      schedule_time: '18:00',
      schedule_times: ['18:00', '19:30'],
      image_url: 'https://images.unsplash.com/photo-1549719386-0ddced763883?w=800',
      kids_friendly: false,
      disability_friendly: false,
    },
  ];
  for (const c of classes) {
    await setDoc('classes', c.id, c);
    await setDoc('class_venues', `cv-${c.id}`, {
      id: `cv-${c.id}`,
      class_id: c.id,
      venue_id: c.venue_id,
      is_primary: true,
    });
  }

  const packages = [
    {
      id: 'pkg-strength-1',
      class_id: 'class-strength',
      trainer_id: ids.minh,
      name: 'Single session',
      sessions: 1,
      price: 450000,
      anchor_price: 450000,
      savings_pct: 0,
      is_active: true,
    },
    {
      id: 'pkg-strength-5',
      class_id: 'class-strength',
      trainer_id: ids.minh,
      name: '5-session pack',
      sessions: 5,
      price: 1845000,
      anchor_price: 2250000,
      savings_pct: 18,
      is_active: true,
    },
    {
      id: 'pkg-yoga-1',
      class_id: 'class-yoga',
      trainer_id: ids.linh,
      name: 'Single session',
      sessions: 1,
      price: 320000,
      anchor_price: 320000,
      savings_pct: 0,
      is_active: true,
    },
    {
      id: 'pkg-boxing-1',
      class_id: 'class-boxing',
      trainer_id: ids.kai,
      name: 'Single session',
      sessions: 1,
      price: 380000,
      anchor_price: 380000,
      savings_pct: 0,
      is_active: true,
    },
  ];
  for (const p of packages) await setDoc('class_packages', p.id, p);

  // Concrete upcoming slots for the next 2 weeks
  const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const c of classes) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let n = 0;
    for (let i = 0; i < 16 && n < 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const day = WEEKDAY[d.getDay()];
      if (!c.schedule_days.includes(day)) continue;
      for (const time of c.schedule_times) {
        const [hh, mm] = time.split(':').map(Number);
        const when = new Date(d);
        when.setHours(hh, mm, 0, 0);
        if (when <= new Date()) continue;
        const id = `${c.id}_${dateKey(d)}_${time.replace(':', '')}`;
        await setDoc('class_slots', id, {
          id,
          class_id: c.id,
          trainer_id: c.trainer_id,
          venue_id: c.venue_id,
          date: dateKey(d),
          time,
          capacity: c.capacity,
          enrolled: 0,
          status: 'open',
        });
        n += 1;
        if (n >= 10) break;
      }
    }
  }

  await setDoc('promo_codes', 'RHINO10', {
    id: 'RHINO10',
    code: 'RHINO10',
    discount_type: 'percent',
    discount_value: 10,
    is_active: true,
    max_uses: 1000,
    uses_count: 0,
  });

  // Sample booking for realism (not filling boxing)
  const mon = nextWeekday(1, 7, 0);
  await setDoc('bookings', 'booking-alex-strength', {
    id: 'booking-alex-strength',
    class_id: 'class-strength',
    client_id: ids.alex,
    booking_date: dateKey(mon),
    booking_time: '07:00',
    status: 'booked',
    verification_code: 'RF9001',
    amount_paid: 450000,
    service_fee: 22500,
    tip_amount: 0,
    created_at: new Date().toISOString(),
  });

  console.log('\nDone. Real accounts (password RhinoFit123!):');
  for (const u of users) console.log(`  ${u.role.padEnd(8)} ${u.email}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
