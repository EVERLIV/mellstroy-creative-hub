/**
 * Demo dataset for RhinoFit on Firebase.
 * Concrete schedules, real student profiles, no orphan client IDs.
 */

export const SEED_IDS = {
  student: 'seed-student-1',
  studentB: 'seed-student-2',
  studentC: 'seed-student-3',
  studentD: 'seed-student-4',
  trainerA: 'seed-trainer-1',
  trainerB: 'seed-trainer-2',
  trainerC: 'seed-trainer-3',
  classA: 'seed-class-1',
  classB: 'seed-class-2',
  classC: 'seed-class-3',
  venueA: 'seed-venue-1',
  venueB: 'seed-venue-2',
  venueC: 'seed-venue-3',
} as const;

/** Seed schema version — bump when mock shape changes so local stores reseed. */
export const SEED_VERSION = 2;

function nextWeekdayDate(weekday: number, hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  const delta = (weekday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d;
}

function dateKey(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function buildSeedCollections() {
  const now = new Date().toISOString();
  const boxingSlot = nextWeekdayDate(1, 18, 0); // next Monday 18:00
  const boxingDate = dateKey(boxingSlot);
  const yogaSlot = nextWeekdayDate(2, 8, 30); // next Tuesday
  const yogaDate = dateKey(yogaSlot);
  const strengthSlot = nextWeekdayDate(1, 7, 0); // next Monday
  const strengthDate = dateKey(strengthSlot);

  const profiles = [
    {
      id: SEED_IDS.student,
      username: 'Alex Athlete',
      email: 'alex@rhinofit.demo',
      role: 'student',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200',
      location: 'Quận 1, HCMC',
      district: 'Quận 1',
      onboarding_completed: true,
      gender: 'other',
      distance_unit: 'km',
      goals: ['Strength', 'Consistency'],
      last_seen: now,
      created_at: now,
      bonus_balance: 0,
    },
    {
      id: SEED_IDS.studentB,
      username: 'Mai Nguyen',
      email: 'mai@rhinofit.demo',
      role: 'student',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      location: 'Quận 3, HCMC',
      district: 'Quận 3',
      onboarding_completed: true,
      gender: 'female',
      distance_unit: 'km',
      goals: ['Mobility', 'Recovery'],
      last_seen: now,
      created_at: '2025-10-01T00:00:00.000Z',
      bonus_balance: 50000,
    },
    {
      id: SEED_IDS.studentC,
      username: 'Jordan Lee',
      email: 'jordan@rhinofit.demo',
      role: 'student',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      location: 'Quận 7, HCMC',
      district: 'Quận 7',
      onboarding_completed: true,
      gender: 'male',
      distance_unit: 'km',
      goals: ['Boxing', 'Conditioning'],
      last_seen: now,
      created_at: '2025-11-15T00:00:00.000Z',
      bonus_balance: 0,
    },
    {
      id: SEED_IDS.studentD,
      username: 'Priya Shah',
      email: 'priya@rhinofit.demo',
      role: 'student',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      location: 'Thảo Điền, HCMC',
      district: 'Quận 2',
      onboarding_completed: true,
      gender: 'female',
      distance_unit: 'km',
      goals: ['Yoga', 'Flexibility'],
      last_seen: now,
      created_at: '2026-01-08T00:00:00.000Z',
      bonus_balance: 20000,
    },
    {
      id: SEED_IDS.trainerA,
      username: 'Minh Strength',
      email: 'minh@rhinofit.demo',
      role: 'trainer',
      specialty: ['Fitness', 'Strength'],
      rating: 4.9,
      reviews_count: 128,
      price_per_hour: 450000,
      avatar_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
      location: 'Quận 1, HCMC',
      district: 'Quận 1',
      is_verified: true,
      is_premium: true,
      bio: 'Former national team S&C coach. Technique-first strength sessions.',
      short_description: 'Strength & conditioning in D1',
      experience_years: 8,
      onboarding_completed: true,
      gender: 'male',
      response_time_ms: 12 * 60_000,
      acceptance_rate: 94,
      last_seen: now,
      created_at: '2025-06-01T00:00:00.000Z',
    },
    {
      id: SEED_IDS.trainerB,
      username: 'Linh Yoga',
      email: 'linh@rhinofit.demo',
      role: 'trainer',
      specialty: ['Yoga', 'Mobility'],
      rating: 4.8,
      reviews_count: 86,
      price_per_hour: 320000,
      avatar_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
      location: 'Quận 3, HCMC',
      district: 'Quận 3',
      is_verified: true,
      is_premium: false,
      bio: 'Vinyasa + mobility for desk athletes.',
      short_description: 'Yoga loft sessions',
      experience_years: 5,
      onboarding_completed: true,
      gender: 'female',
      response_time_ms: 25 * 60_000,
      acceptance_rate: 91,
      last_seen: now,
      created_at: '2025-09-12T00:00:00.000Z',
    },
    {
      id: SEED_IDS.trainerC,
      username: 'Kai Boxing',
      email: 'kai@rhinofit.demo',
      role: 'trainer',
      specialty: ['Boxing', 'Fitness'],
      rating: 4.7,
      reviews_count: 54,
      price_per_hour: 380000,
      avatar_url: 'https://images.unsplash.com/photo-1549719386-0ddced763883?w=400',
      location: 'Quận 7, HCMC',
      district: 'Quận 7',
      is_verified: true,
      is_premium: true,
      bio: 'Pad work, sparring drills, fight conditioning.',
      short_description: 'Boxing fundamentals',
      experience_years: 6,
      onboarding_completed: true,
      gender: 'male',
      response_time_ms: 40 * 60_000,
      acceptance_rate: 88,
      last_seen: new Date(Date.now() - 3_600_000).toISOString(),
      created_at: '2025-11-01T00:00:00.000Z',
    },
  ];

  const user_roles = [
    { id: `${SEED_IDS.student}-role`, user_id: SEED_IDS.student, role: 'student' },
    { id: `${SEED_IDS.studentB}-role`, user_id: SEED_IDS.studentB, role: 'student' },
    { id: `${SEED_IDS.studentC}-role`, user_id: SEED_IDS.studentC, role: 'student' },
    { id: `${SEED_IDS.studentD}-role`, user_id: SEED_IDS.studentD, role: 'student' },
    { id: `${SEED_IDS.trainerA}-role`, user_id: SEED_IDS.trainerA, role: 'trainer' },
    { id: `${SEED_IDS.trainerB}-role`, user_id: SEED_IDS.trainerB, role: 'trainer' },
    { id: `${SEED_IDS.trainerC}-role`, user_id: SEED_IDS.trainerC, role: 'trainer' },
  ];

  const venues = [
    {
      id: SEED_IDS.venueA,
      name: 'Elite Tennis Club',
      category: 'tennis',
      description: 'Premium multi-court facility in District 1.',
      address: '123 Nguyen Hue Boulevard',
      district: 'Quận 1',
      image_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
      price_per_hour: 500000,
      amenities: ['Parking', 'Locker Room', 'Shower', 'WiFi'],
      capacity: 32,
      rating: 4.8,
      reviews_count: 156,
      is_active: true,
    },
    {
      id: SEED_IDS.venueB,
      name: 'Saigon Yoga Loft',
      category: 'yoga',
      description: 'Quiet loft studio for yoga and mobility.',
      address: '88 Dong Khoi',
      district: 'Quận 1',
      image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      price_per_hour: 250000,
      amenities: ['Mats', 'Shower', 'Tea'],
      capacity: 20,
      rating: 4.9,
      reviews_count: 210,
      is_active: true,
    },
    {
      id: SEED_IDS.venueC,
      name: 'District 7 Fight Lab',
      category: 'boxing',
      description: 'Pads, bags, and sparring ring.',
      address: '12 Nguyen Van Linh',
      district: 'Quận 7',
      image_url: 'https://images.unsplash.com/photo-1549719386-0ddced763883?w=800',
      price_per_hour: 350000,
      amenities: ['Ring', 'Bags', 'Showers'],
      capacity: 24,
      rating: 4.6,
      reviews_count: 72,
      is_active: true,
    },
  ];

  const classes = [
    {
      id: SEED_IDS.classA,
      trainer_id: SEED_IDS.trainerA,
      venue_id: SEED_IDS.venueA,
      name: 'Strength Foundations',
      description: 'Barbell patterns, bracing, progressive overload.',
      duration_minutes: 60,
      price: 450000,
      capacity: 6,
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
      id: SEED_IDS.classB,
      trainer_id: SEED_IDS.trainerB,
      venue_id: SEED_IDS.venueB,
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
      id: SEED_IDS.classC,
      trainer_id: SEED_IDS.trainerC,
      venue_id: SEED_IDS.venueC,
      name: 'Boxing Conditioning',
      description: 'Pads + conditioning circuits. Full class (waitlist demo).',
      duration_minutes: 60,
      price: 380000,
      capacity: 2,
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

  const class_packages = [
    {
      id: 'seed-pkg-1',
      class_id: SEED_IDS.classA,
      trainer_id: SEED_IDS.trainerA,
      name: 'Single session',
      sessions: 1,
      price: 450000,
      anchor_price: 450000,
      savings_pct: 0,
      is_active: true,
    },
    {
      id: 'seed-pkg-5',
      class_id: SEED_IDS.classA,
      trainer_id: SEED_IDS.trainerA,
      name: '5-session pack',
      sessions: 5,
      price: 1_845_000,
      anchor_price: 2_250_000,
      savings_pct: 18,
      is_active: true,
    },
    {
      id: 'seed-pkg-10',
      class_id: SEED_IDS.classA,
      trainer_id: SEED_IDS.trainerA,
      name: '10-session pack',
      sessions: 10,
      price: 3_375_000,
      anchor_price: 4_500_000,
      savings_pct: 25,
      is_active: true,
    },
    {
      id: 'seed-pkg-b1',
      class_id: SEED_IDS.classB,
      trainer_id: SEED_IDS.trainerB,
      name: 'Single session',
      sessions: 1,
      price: 320000,
      anchor_price: 320000,
      savings_pct: 0,
      is_active: true,
    },
    {
      id: 'seed-pkg-b5',
      class_id: SEED_IDS.classB,
      trainer_id: SEED_IDS.trainerB,
      name: '5-session pack',
      sessions: 5,
      price: 1_312_000,
      anchor_price: 1_600_000,
      savings_pct: 18,
      is_active: true,
    },
  ];

  const bookings = [
    {
      id: 'seed-booking-full-1',
      class_id: SEED_IDS.classC,
      client_id: SEED_IDS.studentC,
      booking_date: boxingDate,
      booking_time: '18:00',
      status: 'booked',
      verification_code: 'RF1111',
      amount_paid: 380000,
      service_fee: 19000,
      tip_amount: 0,
      created_at: now,
    },
    {
      id: 'seed-booking-full-2',
      class_id: SEED_IDS.classC,
      client_id: SEED_IDS.studentB,
      booking_date: boxingDate,
      booking_time: '18:00',
      status: 'booked',
      verification_code: 'RF2222',
      amount_paid: 380000,
      service_fee: 19000,
      tip_amount: 0,
      created_at: now,
    },
    {
      id: 'seed-booking-yoga-1',
      class_id: SEED_IDS.classB,
      client_id: SEED_IDS.studentD,
      booking_date: yogaDate,
      booking_time: '08:30',
      status: 'booked',
      verification_code: 'RF3333',
      amount_paid: 320000,
      service_fee: 16000,
      tip_amount: 0,
      created_at: now,
    },
    {
      id: 'seed-booking-strength-1',
      class_id: SEED_IDS.classA,
      client_id: SEED_IDS.student,
      booking_date: strengthDate,
      booking_time: '07:00',
      status: 'booked',
      verification_code: 'RF4444',
      amount_paid: 450000,
      service_fee: 22500,
      tip_amount: 20000,
      created_at: now,
    },
  ];

  const waitlist_entries = [
    {
      id: 'seed-wait-1',
      class_id: SEED_IDS.classC,
      user_id: SEED_IDS.student,
      preferred_date: boxingDate,
      preferred_time: '18:00',
      status: 'waiting',
      notified_at: null,
      created_at: now,
    },
  ];

  const reviews = [
    {
      id: 'seed-review-1',
      trainer_id: SEED_IDS.trainerA,
      client_id: SEED_IDS.student,
      rating: 5,
      comment: 'Clear cues and great progressive overload.',
      photos: [],
      criteria: { technique: 5, punctuality: 5, result: 5 },
      trainer_reply: 'Thanks Alex — see you next week!',
      created_at: now,
    },
    {
      id: 'seed-review-2',
      trainer_id: SEED_IDS.trainerB,
      client_id: SEED_IDS.studentD,
      rating: 5,
      comment: 'Perfect morning reset.',
      photos: [],
      criteria: { technique: 5, punctuality: 4, result: 5 },
      trainer_reply: null,
      created_at: now,
    },
    {
      id: 'seed-review-3',
      trainer_id: SEED_IDS.trainerC,
      client_id: SEED_IDS.studentC,
      rating: 4,
      comment: 'Hard session, excellent pad work.',
      photos: [],
      criteria: { technique: 4, punctuality: 5, result: 4 },
      trainer_reply: 'Appreciate it Jordan!',
      created_at: now,
    },
  ];

  const notifications = [
    {
      id: 'seed-notif-1',
      user_id: SEED_IDS.trainerC,
      type: 'waitlist_new',
      title: 'New waitlist signup',
      message: 'Alex Athlete is waiting for Boxing Conditioning.',
      reference_id: 'seed-wait-1',
      href: '/bookings?tab=waitlist',
      is_read: false,
      payload: { classId: SEED_IDS.classC },
      created_at: now,
    },
    {
      id: 'seed-notif-2',
      user_id: SEED_IDS.student,
      type: 'waitlist_joined',
      title: 'Waitlist joined',
      message: 'We will notify you when a spot opens.',
      reference_id: SEED_IDS.classC,
      href: `/class/${SEED_IDS.classC}`,
      is_read: false,
      payload: {},
      created_at: now,
    },
  ];

  const promoted_listings = [
    {
      id: 'seed-promo-1',
      target_type: 'trainer',
      target_id: SEED_IDS.trainerA,
      weight: 20,
      insert_every_n: 6,
      is_active: true,
      starts_at: '2025-01-01T00:00:00.000Z',
      ends_at: null,
    },
  ];

  const partner_offers = [
    {
      id: 'seed-partner-1',
      title: 'Gym day pass 20% off',
      description: 'Partner studios across D1–D7',
      partner_name: 'Rhino Partners',
      category: 'Venue',
      cta_url: '/venues',
      is_active: true,
      sort_order: 1,
    },
    {
      id: 'seed-partner-2',
      title: 'Recovery kit starter',
      description: 'Foam roller + bands bundle',
      partner_name: 'MoveLab',
      category: 'Gear',
      cta_url: '/venues',
      is_active: true,
      sort_order: 2,
    },
  ];

  const related_services = [
    {
      id: 'seed-rel-1',
      source_specialty: 'Fitness',
      related_label: 'Recovery massage',
      related_category: 'Massage',
      sort_order: 1,
      is_active: true,
    },
    {
      id: 'seed-rel-2',
      source_specialty: 'Yoga',
      related_label: 'Mobility coaching',
      related_category: 'Mobility',
      sort_order: 1,
      is_active: true,
    },
  ];

  const promo_codes = [
    {
      id: 'seed-code-1',
      code: 'RHINO10',
      discount_type: 'percent',
      discount_value: 10,
      is_active: true,
      max_uses: 1000,
      uses_count: 0,
    },
  ];

  const analytics_events: unknown[] = [];
  const booking_holds: unknown[] = [];
  const saved_searches: unknown[] = [];
  const class_venues = classes.map((c) => ({
    id: `cv-${c.id}`,
    class_id: c.id,
    venue_id: c.venue_id,
    is_primary: true,
  }));

  return {
    profiles,
    user_roles,
    venues,
    classes,
    class_packages,
    class_venues,
    bookings,
    waitlist_entries,
    reviews,
    notifications,
    promoted_listings,
    partner_offers,
    related_services,
    promo_codes,
    analytics_events,
    booking_holds,
    saved_searches,
  };
}

export type SeedCollections = ReturnType<typeof buildSeedCollections>;
export type CollectionName = keyof SeedCollections;
