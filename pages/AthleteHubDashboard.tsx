import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  MapPin,
  MessageCircle,
  Navigation,
  Plus,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  UtensilsCrossed,
  Verified,
} from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { useTrainers } from '@/src/hooks/useTrainers';
import { mockVenues } from '@/data/mockVenues';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import type { Trainer } from '@/types';

/**
 * Stitch → code: Athlete & Customer Hub Dashboard
 * (projects/308798188746649405/screens/80d503d2bacd4e6b8649f3c5cc80fa97)
 * Shell owns top nav — this page is content-only, same max-w-7xl rail.
 */

const CTA = 'bg-[#2563eb] text-white hover:bg-[#004ac6]';
const CTA_OUTLINE = 'border-[#2563eb] text-[#2563eb] hover:bg-blue-50 dark:hover:bg-blue-950/40';

const WEEK_SESSIONS = [
  {
    id: '1',
    title: 'CrossFit Intensity WOD',
    meta: 'District 2 Box • Mon 21 Oct',
    right: '580 kcal',
    tone: 'done' as const,
  },
  {
    id: '2',
    title: 'Padel Drills & Match',
    meta: 'Saigon Padel • Thu 24 Oct, 07:00 AM',
    right: 'Confirmed',
    tone: 'confirmed' as const,
  },
  {
    id: '3',
    title: 'Sunset Mobility & Yoga',
    meta: 'Open Slot • Sat 26 Oct',
    right: '+ Reserve',
    tone: 'open' as const,
  },
];

const ACTIVITY_ROWS = [
  {
    id: '1',
    session: 'Padel Match & Serve Drill',
    when: 'Tomorrow · 07:00–08:30',
    venue: 'Saigon Padel Arena',
    status: 'Confirmed',
    perk: '10% Pro Pass Savings',
    amount: '450.000₫',
  },
  {
    id: '2',
    session: 'CrossFit Intensity WOD',
    when: 'Mon 21 Oct · 18:00–19:00',
    venue: 'District 2 Box',
    status: 'Completed',
    perk: '10% Pro Pass Savings',
    amount: '280.000₫',
  },
  {
    id: '3',
    session: 'RhinoFit Pro Pass (Monthly)',
    when: '01 Nov · Auto-renew',
    venue: '—',
    status: 'Paid',
    perk: 'Membership',
    amount: '1.200.000₫',
  },
];

const SLOT_PRESETS = [
  ['15:00', '16:30', '18:00'],
  ['17:00', '19:00', '20:30'],
  ['14:00', '16:00', '19:30'],
];

function firstNameFromUser(user: ReturnType<typeof useAuth>['user']): string {
  const meta = user?.user_metadata as Record<string, string> | undefined;
  const raw =
    meta?.username ||
    meta?.full_name ||
    meta?.name ||
    user?.email?.split('@')[0] ||
    'Athlete';
  const cleaned = raw.replace(/[._]/g, ' ').replace(/\s+/g, ' ').trim();
  const first = cleaned.split(' ')[0] || 'Athlete';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function weekStrip() {
  const base = new Date();
  const day = base.getDay(); // 0 Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);
  const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === base.toDateString();
    const isTomorrow =
      d.toDateString() === new Date(base.getTime() + 86400000).toDateString();
    return { label, date: d.getDate(), isToday, isTomorrow, done: i < 2 };
  });
}

function VenueInstantCard({
  venue,
  slots,
  onBook,
}: {
  venue: (typeof mockVenues)[number];
  slots: string[];
  onBook: () => void;
}) {
  return (
    <article className="flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow">
      <div>
        <div className="relative h-44 overflow-hidden">
          <img
            src={venue.imageUrl}
            alt=""
            className="size-full object-cover"
          />
          <span className="absolute left-3 top-3 rounded bg-[#2563eb] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {venue.category}
          </span>
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-bold text-foreground backdrop-blur">
            <Star className="size-3.5 fill-amber-500 text-amber-500" />
            {venue.rating.toFixed(1)} ({venue.reviews})
          </div>
        </div>
        <div className="space-y-2 p-4">
          <h3 className="text-base font-semibold tracking-tight text-foreground">{venue.name}</h3>
          <p className="text-sm text-muted-foreground">
            {venue.address}, {venue.district}
          </p>
          <div className="pt-2">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Next Available Slots Today:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {slots.map((slot, i) => (
                <button
                  key={slot}
                  type="button"
                  onClick={onBook}
                  className={cn(
                    'rounded border px-2 py-1 text-xs font-semibold transition-colors',
                    i === 2
                      ? 'border-emerald-200 bg-emerald-50 font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'border-border bg-muted/60 text-foreground hover:bg-[#2563eb] hover:text-white'
                  )}
                >
                  {slot}
                  {i === 2 ? ' (Deal)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/70 p-4 pt-3">
        <div>
          <span className="block text-[11px] text-muted-foreground">Starting from</span>
          <span className="text-base font-semibold text-foreground">
            {formatVND(venue.pricePerHour)}
            <span className="text-sm font-normal text-muted-foreground">/hr</span>
          </span>
        </div>
        <Button type="button" size="sm" className={cn('h-8', CTA)} onClick={onBook}>
          Book Slot
        </Button>
      </div>
    </article>
  );
}

function CoachCard({
  trainer,
  onBook,
}: {
  trainer: Trainer;
  onBook: () => void;
}) {
  const specialty = trainer.specialty?.[0] || trainer.sports?.[0] || 'Coach';
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img src={trainer.imageUrl} alt="" className="size-full object-cover" />
        <span className="absolute left-3 top-3 rounded bg-card/90 px-2 py-0.5 text-[11px] font-bold text-foreground backdrop-blur">
          {specialty}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">{trainer.name}</h3>
            <p className="truncate text-sm text-muted-foreground">{trainer.location}</p>
          </div>
          {trainer.reviews > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold tabular-nums">
              <Star className="size-3.5 fill-amber-500 text-amber-500" />
              {trainer.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {formatVND(trainer.price)}
          <span className="font-normal text-muted-foreground">/class</span>
        </p>
        <Button type="button" size="sm" className={cn('mt-auto w-full', CTA)} onClick={onBook}>
          Book Session
        </Button>
      </div>
    </article>
  );
}

export default function AthleteHubDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trainers } = useTrainers();
  const venueRailRef = useRef<HTMLDivElement>(null);
  const coachRailRef = useRef<HTMLDivElement>(null);

  const name = firstNameFromUser(user);
  const days = useMemo(() => weekStrip(), []);
  const venues = useMemo(() => mockVenues.slice(0, 3), []);
  const coaches = useMemo(
    () =>
      [...trainers]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0))
        .slice(0, 4),
    [trainers]
  );

  const scrollRail = (ref: React.RefObject<HTMLDivElement | null>, dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <div className="min-w-0 bg-[#f9fafb] text-foreground dark:bg-background">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 md:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-r from-card via-[#e9edff] to-card p-6 shadow-sm dark:from-card dark:via-card dark:to-card md:p-8">
          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-50 px-2.5 py-1 dark:bg-orange-950/40">
                <Flame className="size-4 text-orange-600" />
                <span className="text-xs font-semibold text-orange-800 dark:text-orange-200">
                  14-Day Active Streak
                </span>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-xs font-semibold text-orange-600">Top 5% active in District 1</span>
              </div>
              <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                Welcome back, {name}! 🔥
              </h1>
              <p className="text-pretty text-base text-muted-foreground md:text-lg">
                You have a confirmed Padel match tomorrow at 07:00 AM. Your conditioning is peaking
                this week.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                className={cn('h-10 gap-2', CTA)}
                onClick={() => navigate('/venues')}
              >
                <Dumbbell className="size-4" />
                Book Court
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn('h-10 gap-2', CTA_OUTLINE)}
                onClick={() => navigate('/explore')}
              >
                Schedule Coach
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2"
                onClick={() => navigate('/bookings')}
              >
                Log Workout
              </Button>
            </div>
          </div>
          <div
            className="pointer-events-none absolute -bottom-10 -right-10 size-64 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-900/20"
            aria-hidden
          />
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow">
            <div className="mb-2 flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-medium">Active Bookings</span>
              <span className="grid size-8 place-items-center rounded-lg bg-[#e9edff] text-[#004ac6] dark:bg-blue-950">
                <Calendar className="size-4" />
              </span>
            </div>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tabular-nums leading-none">2</span>
              <span className="text-sm text-muted-foreground">this week</span>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              Next: Tomorrow 07:00 AM @ Saigon Padel
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow">
            <div className="mb-2 flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-medium">Hours Trained</span>
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Clock className="size-4" />
              </span>
            </div>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tabular-nums leading-none">18.5</span>
              <span className="text-sm text-muted-foreground">hrs</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <TrendingUp className="size-4" />
              +12% vs last month
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow">
            <div className="mb-2 flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-medium">Membership Tier</span>
              <span className="grid size-8 place-items-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950">
                <Verified className="size-4" />
              </span>
            </div>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-xl font-bold leading-tight">Pro Pass</span>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Active
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Saves 10% auto • Renews Nov 28</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow">
            <div className="mb-2 flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-medium">RhinoFit Points</span>
              <span className="grid size-8 place-items-center rounded-lg bg-muted text-amber-500">
                <Star className="size-4 fill-amber-500" />
              </span>
            </div>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tabular-nums leading-none">2,450</span>
              <span className="text-sm text-muted-foreground">pts</span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#004ac6] hover:underline"
              onClick={() => navigate('/subscription')}
            >
              Redeem perks & recovery passes
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </section>

        {/* Next match + weekly rhythm */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-7">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 animate-pulse rounded-full bg-emerald-600" />
                  <span className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Next Confirmed Match
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                  <Clock className="size-3.5" />
                  18h 42m away
                </span>
              </div>
              <div className="flex flex-col items-start gap-5 md:flex-row">
                <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-lg border border-border md:w-36">
                  <img
                    src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400"
                    alt=""
                    className="size-full object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-foreground/80 px-2 py-0.5 text-[10px] font-semibold text-background backdrop-blur">
                    Court #3
                  </span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#2563eb] dark:bg-blue-950">
                      Padel Tennis
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Indoor AC • Covered
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                    Padel Match & Serve Drill with Coach Minh Vu
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0" />
                      <span>Saigon Padel Arena — 182 Nguyen Van Thu, District 1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 shrink-0" />
                      <span>Tomorrow, 07:00 AM – 08:30 AM (90 mins)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t border-border/70 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5">
                  <Navigation className="size-3.5" />
                  Get Directions
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5">
                  <Calendar className="size-3.5" />
                  Add to Calendar
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5">
                  <Share2 className="size-3.5" />
                  Share with Partner
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 gap-1.5 text-[#004ac6]"
                onClick={() => navigate('/messages')}
              >
                <MessageCircle className="size-3.5" />
                Message Coach
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-5">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Weekly Training Rhythm</h3>
                  <p className="text-sm text-muted-foreground">Target: 4 sessions / week</p>
                </div>
                <span className="text-sm font-semibold text-[#004ac6]">3 of 4 Completed</span>
              </div>
              <div className="mb-5 grid grid-cols-7 gap-1.5 text-center">
                {days.map((d) => (
                  <div
                    key={d.label}
                    className={cn(
                      'flex flex-col items-center rounded-lg p-2',
                      d.isToday && 'bg-[#e9edff] ring-1 ring-[#004ac6] dark:bg-blue-950',
                      d.isTomorrow && !d.isToday && 'bg-orange-50 dark:bg-orange-950/50',
                      !d.isToday && !d.isTomorrow && 'bg-muted/50'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[11px] font-semibold',
                        d.isToday && 'font-bold text-[#004ac6]',
                        d.isTomorrow && !d.isToday && 'text-orange-600',
                        !d.isToday && !d.isTomorrow && 'text-muted-foreground'
                      )}
                    >
                      {d.label}
                    </span>
                    <span
                      className={cn(
                        'my-1 text-sm font-bold',
                        d.isToday && 'text-[#004ac6]',
                        d.isTomorrow && !d.isToday && 'text-orange-600'
                      )}
                    >
                      {d.date}
                    </span>
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        d.done && 'bg-emerald-500',
                        d.isToday && 'bg-[#2563eb]',
                        d.isTomorrow && !d.isToday && 'bg-orange-500',
                        !d.done && !d.isToday && !d.isTomorrow && 'bg-border'
                      )}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {WEEK_SESSIONS.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-[#f9fafb] p-2.5 dark:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'grid size-8 place-items-center rounded-lg text-xs font-bold',
                          s.tone === 'done' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950',
                          s.tone === 'confirmed' && 'bg-blue-50 text-[#2563eb] dark:bg-blue-950',
                          s.tone === 'open' && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {s.tone === 'done' ? <Check className="size-4" /> : <Clock className="size-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.title}</p>
                        <p className="text-[11px] text-muted-foreground">{s.meta}</p>
                      </div>
                    </div>
                    {s.tone === 'open' ? (
                      <button
                        type="button"
                        className="text-[11px] font-bold text-[#004ac6] hover:underline"
                        onClick={() => navigate('/venues')}
                      >
                        {s.right}
                      </button>
                    ) : s.tone === 'confirmed' ? (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {s.right}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-muted-foreground">{s.right}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full"
              onClick={() => navigate('/bookings')}
            >
              View Full Schedule Calendar
            </Button>
          </div>
        </section>

        {/* AI widgets */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate('/ai-coach')}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-[#2563eb]/40"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-sm">
              <Sparkles className="size-6" />
            </span>
            <span className="min-w-0 flex-1 space-y-1.5">
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="text-base font-semibold">AI Performance Coach</span>
                  <span className="rounded bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-800 dark:bg-orange-950 dark:text-orange-200">
                    Optimized
                  </span>
                </span>
                <span className="text-[11px] text-muted-foreground">Today 08:15 AM</span>
              </span>
              <span className="block text-sm text-muted-foreground">
                “Your heart rate recovery was 4 bpm slower after Monday&apos;s session. Recommended:
                Cryo or Sauna session after tomorrow&apos;s high-intensity padel drill.”
              </span>
              <span className="inline-flex items-center gap-1 pt-1 text-sm font-semibold text-[#004ac6]">
                Book 20-min Cold Plunge @ District 1
                <ArrowRight className="size-3.5" />
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/meal-planner')}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-[#2563eb]/40"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-sm">
              <UtensilsCrossed className="size-6" />
            </span>
            <span className="min-w-0 flex-1 space-y-2">
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="text-base font-semibold">AI Meal Planner</span>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Match Prep
                  </span>
                </span>
                <span className="text-sm font-bold tabular-nums">2,350 / 2,600 kcal</span>
              </span>
              <span className="grid grid-cols-3 gap-2 text-center text-[11px]">
                {[
                  ['Protein', '152g / 170g'],
                  ['Carbs', '240g / 280g'],
                  ['Hydration', '2.8L / 3.5L'],
                ].map(([label, value]) => (
                  <span key={label} className="rounded bg-muted/60 p-1.5">
                    <span className="block text-muted-foreground">{label}</span>
                    <span className="font-bold text-foreground">{value}</span>
                  </span>
                ))}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Post-Workout: Salmon Poke Bowl w/ brown rice & electrolyte citrus water.
              </span>
            </span>
          </button>
        </section>

        {/* Venues */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Favorite Venues & Instant Slots
              </h2>
              <p className="text-sm text-muted-foreground">
                Real-time availability in your regular District 1 & 2 facilities
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Previous venues"
                onClick={() => scrollRail(venueRailRef, -1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Next venues"
                onClick={() => scrollRail(venueRailRef, 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <div
            ref={venueRailRef}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {venues.map((venue, i) => (
              <VenueInstantCard
                key={venue.id}
                venue={venue}
                slots={SLOT_PRESETS[i % SLOT_PRESETS.length]}
                onBook={() => navigate('/venues')}
              />
            ))}
          </div>
        </section>

        {/* Coaches */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Your Coaches & Recommended Specialists
              </h2>
              <p className="text-sm text-muted-foreground">Book a session with trainers you trust</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[#004ac6]"
                onClick={() => navigate('/explore')}
              >
                View all
                <ArrowRight className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="hidden size-8 sm:inline-flex"
                aria-label="Previous coaches"
                onClick={() => scrollRail(coachRailRef, -1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="hidden size-8 sm:inline-flex"
                aria-label="Next coaches"
                onClick={() => scrollRail(coachRailRef, 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <div
            ref={coachRailRef}
            className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4"
          >
            {coaches.length > 0
              ? coaches.map((trainer) => (
                  <div key={trainer.id} className="w-[15rem] shrink-0 sm:w-auto">
                    <CoachCard
                      trainer={trainer}
                      onBook={() => navigate(`/trainer/${trainer.id}`)}
                    />
                  </div>
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] w-[15rem] shrink-0 animate-pulse rounded-xl bg-muted sm:w-auto"
                  />
                ))}
          </div>
        </section>

        {/* Activity table */}
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Recent Activity & Court Receipts</h2>
              <p className="text-sm text-muted-foreground">Bookings, memberships and tax-ready PDFs</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <Plus className="size-3.5" />
              Download Tax Statements
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Booking / Session</th>
                  <th className="px-5 py-3 font-semibold">Date & Time</th>
                  <th className="px-5 py-3 font-semibold">Venue</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Member Perk</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVITY_ROWS.map((row) => (
                  <tr key={row.id} className="border-t border-border/70">
                    <td className="px-5 py-3.5 font-semibold text-foreground">{row.session}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.when}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.venue}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-bold',
                          row.status === 'Confirmed' &&
                            'bg-blue-50 text-[#2563eb] dark:bg-blue-950',
                          row.status === 'Completed' &&
                            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                          row.status === 'Paid' &&
                            'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[11px] font-semibold text-emerald-600">
                      {row.perk}
                    </td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums">{row.amount}</td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        className="font-semibold text-[#004ac6] hover:underline"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
