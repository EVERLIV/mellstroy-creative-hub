import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Star,
  Sun,
  Users,
  Zap,
} from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { Class, Trainer, UserRole, Review } from '../types';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import { Button } from '@/src/components/ui/button';
import { PageLoader, EmptyState } from '@/src/components/layout/states';
import { DetailContextStrip } from '@/src/components/layout/detail-context-strip';
import { useOptionalCartQuantities } from '@/src/hooks/useCartQuantities';

/**
 * Stitch Class Details → product page
 * Intent: athlete reserves a mat/court spot now.
 * Hierarchy: hero + sticky Book CTA win; editorial modules follow.
 * Palette: Stitch blue (#2563eb) for selection, orange (#fd651e) for convert.
 * Depth: borders + whisper shadow. No sidebar — shell owns top nav.
 */

const CTA_BLUE = 'bg-[#2563eb] text-white hover:bg-[#004ac6]';
const CTA_ORANGE = 'bg-[#fd651e] text-white hover:bg-[#a73a00]';

interface ClassDetailPageProps {
  userRole?: UserRole;
  currentUserId?: string;
  onInitiateBooking?: (target: { trainer: Trainer; cls: Class }) => void;
  onOpenChat?: (
    trainer: Trainer,
    context?: { className: string; bookingDate?: string }
  ) => void;
}

const formatTime = (time: string) => {
  try {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return time;
  }
};

const mapClass = (c: Record<string, unknown>): Class => ({
  id: c.id as Class['id'],
  name: String(c.name ?? ''),
  description: String(c.description ?? ''),
  duration: Number(c.duration_minutes ?? 0),
  price: Number(c.price ?? 0),
  imageUrl: String(c.image_url ?? ''),
  imageUrls: (c.image_urls as string[]) || [],
  capacity: Number(c.capacity ?? 0),
  classType: c.class_type as Class['classType'],
  schedule:
    c.schedule_days && c.schedule_time
      ? { days: c.schedule_days as string[], time: String(c.schedule_time) }
      : undefined,
  language: (c.language as string[]) || [],
  level: String(c.level ?? ''),
  kids_friendly: Boolean(c.kids_friendly),
  disability_friendly: Boolean(c.disability_friendly),
});

function nextSessionDays(scheduleDays?: string[]) {
  const today = new Date();
  const labels = ['Today', 'Tomorrow', 'Weekend', 'Sunday'];
  return Array.from({ length: 4 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    return {
      key: `${i}`,
      eyebrow: labels[i] || weekday,
      title: `${weekday} ${dayNum}`,
      meta: scheduleDays?.length ? `${scheduleDays.length} slots` : 'Open',
      date: d,
    };
  });
}

const ClassDetailPage: React.FC<ClassDetailPageProps> = ({
  userRole = 'student',
  onInitiateBooking,
  onOpenChat,
}) => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<Class | null>(null);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [classReviews, setClassReviews] = useState<Review[]>([]);
  const [similarClasses, setSimilarClasses] = useState<Class[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [passOption, setPassOption] = useState<'single' | 'pack'>('single');
  const [saved, setSaved] = useState(false);
  const cart = useOptionalCartQuantities();
  const cartId = classId ? `class:${classId}` : '';

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const { data: classInfo, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .maybeSingle();
        if (classError) throw classError;
        if (!classInfo || cancelled) return;

        const { data: trainerProfile, error: trainerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', classInfo.trainer_id)
          .maybeSingle();
        if (trainerError) throw trainerError;
        if (!trainerProfile || cancelled) return;

        const { data: bookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('class_id', classId);

        setEnrolledCount(bookings?.length || 0);

        let reviewsData: Review[] = [];
        if (bookings && bookings.length > 0) {
          const { data: reviews } = await supabase
            .from('reviews')
            .select(`*, client:profiles!reviews_client_id_fkey(username)`)
            .in(
              'booking_id',
              bookings.map((b) => b.id)
            );
          if (reviews) {
            reviewsData = reviews.map((r) => ({
              reviewerName: (r.client as { username?: string } | null)?.username || 'Anonymous',
              rating: r.rating,
              comment: r.comment || '',
            }));
          }
        }

        const cls = mapClass(classInfo as Record<string, unknown>);
        const trainerData: Trainer = {
          id: trainerProfile.id,
          name: trainerProfile.username,
          specialty: trainerProfile.specialty || [],
          rating: Number(trainerProfile.rating) || 0,
          reviews: trainerProfile.reviews_count || 0,
          location: trainerProfile.location || '',
          price: Number(trainerProfile.price_per_hour) || 0,
          imageUrl: trainerProfile.avatar_url || '',
          verificationStatus: trainerProfile.is_verified ? 'verified' : 'unverified',
          isPremium: trainerProfile.is_premium || false,
          bio: trainerProfile.bio || '',
          experienceYears: (trainerProfile as { experience_years?: number }).experience_years,
          reviewsData: [],
          classes: [],
          chatHistory: [],
        };

        if (!cancelled) {
          setClassData(cls);
          setTrainer(trainerData);
          setClassReviews(reviewsData);
        }

        const { data: trainerClasses } = await supabase
          .from('classes')
          .select('*')
          .eq('trainer_id', classInfo.trainer_id)
          .neq('id', classId)
          .limit(3);

        let similar = (trainerClasses || []).map((c) => mapClass(c as Record<string, unknown>));
        if (similar.length === 0) {
          const { data: byType } = await supabase
            .from('classes')
            .select('*')
            .eq('class_type', classInfo.class_type)
            .neq('id', classId)
            .limit(3);
          similar = (byType || []).map((c) => mapClass(c as Record<string, unknown>));
        }
        if (!cancelled) setSimilarClasses(similar);
      } catch {
        if (!cancelled) {
          setClassData(null);
          setTrainer(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    const channel = supabase
      .channel(`class-detail-bookings-${classId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `class_id=eq.${classId}`,
        },
        async () => {
          const { data } = await supabase.from('bookings').select('id').eq('class_id', classId);
          setEnrolledCount(data?.length || 0);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId]);

  const days = useMemo(
    () => nextSessionDays(classData?.schedule?.days),
    [classData?.schedule?.days]
  );

  const slots = useMemo(() => {
    const time = classData?.schedule?.time
      ? formatTime(classData.schedule.time)
      : '07:00 AM';
    const endHint = classData?.duration
      ? `${classData.duration} min`
      : '75 min';
    const spotsLeft = Math.max(classData ? classData.capacity - enrolledCount : 0, 0);
    return [
      {
        id: 0,
        range: `${time} – session`,
        badge: spotsLeft <= 2 && spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : null,
        badgeTone: 'urgent' as const,
        meta: `${classData?.classType || 'Studio'} • Coach ${trainer?.name || ''}`,
        price: classData?.price || 0,
        status: spotsLeft === 0 ? 'Full' : 'Selected',
      },
      {
        id: 1,
        range: '12:00 PM – Midday',
        badge: 'Midday Flow',
        badgeTone: 'neutral' as const,
        meta: `${classData?.classType || 'Studio'} • Coach ${trainer?.name || ''}`,
        price: classData?.price || 0,
        status: 'Available',
      },
      {
        id: 2,
        range: '06:30 PM – Evening',
        badge: 'Peak Hours',
        badgeTone: 'success' as const,
        meta: `${classData?.classType || 'Studio'} • Coach ${trainer?.name || ''}`,
        price: classData?.price || 0,
        status: 'Available',
      },
    ].map((s) => ({ ...s, endHint }));
  }, [classData, enrolledCount, trainer?.name]);

  if (loading) {
    return (
      <div className="min-h-[50vh] bg-[#f9fafb] dark:bg-background">
        <PageLoader title="Loading class details…" />
      </div>
    );
  }

  if (!classData || !trainer) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-8">
        <EmptyState
          icon={Calendar}
          title="Class not found"
          description={`Class ID: ${classId}`}
          action={<Button onClick={() => navigate('/explore')}>Back to Explore</Button>}
        />
      </div>
    );
  }

  const isFull = enrolledCount >= classData.capacity;
  const isTrainer = userRole === 'trainer';
  const isBookingDisabled = isTrainer || isFull;
  const spotsLeft = Math.max(classData.capacity - enrolledCount, 0);
  const cover =
    classData.imageUrl ||
    classData.imageUrls?.[0] ||
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1400';
  const walkIn = Math.round(classData.price * 1.12);
  const packPrice = Math.round(classData.price * 5 * 0.82);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: classData.name,
          text: classData.description,
          url: window.location.href,
        });
      } catch {
        /* cancelled */
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBook = () => {
    if (!onInitiateBooking || isBookingDisabled) return;
    if (cartId) cart?.setQuantity(cartId, Math.max(1, cart.getQuantity(cartId) || 1));
    onInitiateBooking({ trainer, cls: classData });
  };

  const typeIcon =
    classData.classType === 'Outdoor' ? (
      <Sun className="size-3.5" />
    ) : classData.classType === 'Home' ? (
      <Home className="size-3.5" />
    ) : (
      <Building className="size-3.5" />
    );

  const learnings = [
    'Structured session progressions with clear cues',
    'Form and mobility focus for lasting results',
    'Coach-led intensity dialed to your level',
    'Studio amenities included with every booking',
  ];

  return (
    <div className="min-w-0 bg-[#f9fafb] text-foreground dark:bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-8">
        <DetailContextStrip
          backLabel="Back to Classes"
          onBack={() => navigate(-1)}
          crumbs={[
            { label: 'Classes', href: '/explore' },
            {
              label: classData.classType,
              href: `/explore?type=${encodeURIComponent(classData.classType)}`,
            },
            {
              label: classData.name,
              href: `/class/${encodeURIComponent(String(classId ?? classData.id))}`,
            },
          ]}
          meta={
            <>
              <span className="inline-flex items-center gap-2">
                {typeIcon}
                <span>{classData.level || 'All levels'} series</span>
              </span>
              {spotsLeft > 0 && spotsLeft <= 3 ? (
                <>
                  <span className="size-1.5 rounded-full bg-border" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} available
                  </span>
                </>
              ) : null}
            </>
          }
          actions={
            <>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
                <Share2 className="size-3.5" />
                Share
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                aria-pressed={saved}
                onClick={() => setSaved((v) => !v)}
              >
                <Heart className={cn('size-3.5', saved && 'fill-destructive text-destructive')} />
                Save
              </Button>
            </>
          }
        />

        {/* Hero */}
        <div className="relative mb-8 h-72 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:h-96">
          <img src={cover} alt="" className="size-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#293040]/90 via-transparent to-black/15" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#fd651e] px-3 py-1 text-xs font-bold text-white shadow-sm">
              Hot Pick
            </span>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur-md">
              {classData.level || 'All Levels Welcome'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur-md">
              {typeIcon}
              {classData.classType}
            </span>
          </div>
          <div className="absolute bottom-5 left-6 right-6 flex flex-col justify-between gap-3 text-white sm:flex-row sm:items-end">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  Verified Studio Class
                </span>
                {trainer.location ? (
                  <span className="text-xs text-slate-200">{trainer.location}</span>
                ) : null}
              </div>
              <h1 className="text-balance text-3xl font-bold tracking-tight drop-shadow-sm md:text-4xl">
                {classData.name}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-200">
                <span>
                  with Coach{' '}
                  <button
                    type="button"
                    className="font-semibold text-white underline decoration-[#fd651e] decoration-2 underline-offset-4"
                    onClick={() => navigate(`/trainer/${trainer.id}`)}
                  >
                    {trainer.name}
                  </button>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <strong className="text-white">{trainer.rating.toFixed(1)}</strong>
                  <span>({trainer.reviews} reviews)</span>
                </span>
              </p>
            </div>
            <div className="hidden text-right md:block">
              <span className="block text-xs text-slate-300">Single entry from</span>
              <span className="text-xl font-bold tabular-nums text-white">
                {formatVND(classData.price)}
              </span>
            </div>
          </div>
        </div>

        {/* 2-col */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* Metrics */}
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:divide-x sm:divide-border">
                {[
                  {
                    icon: <Clock className="size-5" />,
                    label: 'Duration',
                    value: `${classData.duration} minutes`,
                    meta: 'Incl. warmup',
                    tone: 'blue',
                  },
                  {
                    icon: <Users className="size-5" />,
                    label: 'Capacity',
                    value: `${enrolledCount} / ${classData.capacity} enrolled`,
                    meta: spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left!` : 'Full',
                    tone: 'orange',
                  },
                  {
                    icon: <Flame className="size-5" />,
                    label: 'Intensity',
                    value: classData.level || 'Moderate',
                    meta: classData.classType,
                    tone: 'blue',
                  },
                  {
                    icon: <Dumbbell className="size-5" />,
                    label: 'Format',
                    value: classData.classType,
                    meta: classData.kids_friendly ? 'Kids friendly' : 'Adults',
                    tone: 'green',
                  },
                ].map((m) => (
                  <div key={m.label} className="flex items-start gap-3 sm:px-3 first:sm:pl-0 last:sm:pr-0">
                    <span
                      className={cn(
                        'grid size-10 shrink-0 place-items-center rounded-lg',
                        m.tone === 'orange' && 'bg-orange-50 text-orange-700 dark:bg-orange-950',
                        m.tone === 'green' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950',
                        m.tone === 'blue' && 'bg-muted text-[#004ac6]'
                      )}
                    >
                      {m.icon}
                    </span>
                    <div>
                      <span className="block text-xs text-muted-foreground">{m.label}</span>
                      <span className="block text-sm font-semibold text-foreground">{m.value}</span>
                      <span
                        className={cn(
                          'block text-[11px] font-semibold',
                          m.tone === 'orange' ? 'text-orange-600' : 'text-muted-foreground'
                        )}
                      >
                        {m.meta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Schedule */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Select Session Date & Time</h2>
                  <p className="text-sm text-muted-foreground">
                    Book ahead to secure your spot. Instant confirmation.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#004ac6] hover:underline"
                  onClick={() => navigate('/bookings')}
                >
                  View calendar
                  <ArrowRight className="size-3.5" />
                </button>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {days.map((d, i) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelectedDay(i)}
                    className={cn(
                      'flex flex-col items-center rounded-lg px-3 py-2.5 transition-all',
                      selectedDay === i
                        ? 'border-2 border-[#2563eb] bg-blue-50 text-[#004ac6] dark:bg-blue-950'
                        : 'border border-border bg-card text-muted-foreground hover:border-[#2563eb]/50 hover:text-foreground'
                    )}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider">{d.eyebrow}</span>
                    <span className="text-sm font-bold text-foreground">{d.title}</span>
                    <span
                      className={cn(
                        'text-[11px] font-semibold',
                        selectedDay === i ? 'text-orange-600' : 'text-muted-foreground'
                      )}
                    >
                      {d.meta}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                {slots.map((slot) => {
                  const active = selectedSlot === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg p-3.5 text-left transition-all',
                        active
                          ? 'border-2 border-[#2563eb] bg-[#f1f3ff] dark:bg-blue-950/40'
                          : 'border border-border bg-card hover:border-[#2563eb]/50'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            'grid size-5 place-items-center rounded-full border-2',
                            active ? 'border-[#2563eb]' : 'border-border'
                          )}
                        >
                          {active ? <span className="size-2.5 rounded-full bg-[#2563eb]" /> : null}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{slot.range}</span>
                            {slot.badge ? (
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[11px] font-bold',
                                  slot.badgeTone === 'urgent' &&
                                    'bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
                                  slot.badgeTone === 'success' &&
                                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                                  slot.badgeTone === 'neutral' && 'bg-muted text-muted-foreground'
                                )}
                              >
                                {slot.badge}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">{slot.meta}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold tabular-nums">
                          {formatVND(slot.price)}
                        </span>
                        <span
                          className={cn(
                            'block text-[11px] font-semibold',
                            active ? 'text-emerald-600' : 'text-muted-foreground'
                          )}
                        >
                          {active ? 'Selected' : slot.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* About */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold tracking-tight">About this class</h2>
              <div className="space-y-3 text-[15px] leading-relaxed text-muted-foreground">
                <p className="text-pretty">
                  {classData.description ||
                    'A coach-led session designed to build skill, conditioning, and recovery — structured for athletes who want measurable progress without guesswork.'}
                </p>
              </div>
              <div className="mt-5 border-t border-border pt-5">
                <h3 className="mb-3 text-base font-semibold">What You Will Experience & Learn</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {learnings.map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-700">
                  {classData.classType.toLowerCase()}
                </span>
                {classData.level ? (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {classData.level}
                  </span>
                ) : null}
                {(classData.language || []).map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {lang}
                  </span>
                ))}
                {trainer.location ? (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {trainer.location}
                  </span>
                ) : null}
              </div>
            </section>

            {/* Coach */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Instructor in Charge
                </span>
                {trainer.verificationStatus === 'verified' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <ShieldCheck className="size-3.5" />
                    RhinoFit Master Coach
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <img
                    src={trainer.imageUrl || cover}
                    alt=""
                    className="size-20 rounded-2xl border-2 border-white object-cover shadow-md"
                  />
                  <span className="absolute -bottom-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-[#fd651e] text-xs font-bold text-white shadow-sm">
                    ★
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold">{trainer.name}</h3>
                    {trainer.specialty?.[0] ? (
                      <span className="text-sm text-muted-foreground">• {trainer.specialty[0]}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {trainer.bio ||
                      `${trainer.experienceYears ? `${trainer.experienceYears}+ years` : 'Experienced'} coaching athletes across ${trainer.specialty?.join(', ') || 'multiple disciplines'}.`}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-bold text-foreground">
                      <Star className="size-3.5 fill-amber-500 text-amber-500" />
                      {trainer.rating.toFixed(1)} ({trainer.reviews} student reviews)
                    </span>
                  </div>
                </div>
                <div className="flex w-full shrink-0 gap-2 sm:w-auto sm:flex-col">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('flex-1 border-[#2563eb] text-[#004ac6] sm:flex-none', 'hover:bg-blue-50')}
                    onClick={() => navigate(`/trainer/${trainer.id}`)}
                  >
                    View Profile
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 sm:flex-none"
                    onClick={() => onOpenChat?.(trainer, { className: classData.name })}
                  >
                    Message Coach
                  </Button>
                </div>
              </div>
            </section>

            {/* Venue */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Venue & Location</h2>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#004ac6]">
                  <MapPin className="size-3.5" />
                  Get directions
                </span>
              </div>
              <div className="mb-4 flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-muted text-[#004ac6]">
                  <Building className="size-6" />
                </span>
                <div>
                  <h3 className="text-base font-semibold">
                    {trainer.location || 'RhinoFit Partner Studio'}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Session format: {classData.classType}
                    {classData.schedule?.days?.length
                      ? ` • ${classData.schedule.days.join(', ')}`
                      : ''}
                  </p>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <span className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Facility Amenities
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {['Showers', 'Lockers', 'Parking', 'Gear provided'].map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Reviews */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">
                    Student reviews ({classReviews.length || trainer.reviews})
                  </h2>
                  <p className="text-sm text-muted-foreground">Verified athlete feedback</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-orange-50 px-3 py-1.5 dark:bg-orange-950/40">
                  <Star className="size-4 fill-amber-500 text-amber-500" />
                  <span className="text-sm font-bold">{trainer.rating.toFixed(1)}</span>
                  <span className="text-[11px] font-bold text-orange-800 dark:text-orange-200">
                    / 5.0
                  </span>
                </div>
              </div>
              {classReviews.length > 0 ? (
                <div className="space-y-3">
                  {classReviews.slice(0, 3).map((review, i) => (
                    <article
                      key={i}
                      className="space-y-2 rounded-xl border border-border bg-muted/40 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-8 place-items-center rounded-full bg-[#2563eb] text-xs font-bold text-white">
                            {review.reviewerName.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <span className="text-sm font-semibold">{review.reviewerName}</span>
                            <span className="ml-1.5 text-[11px] font-bold text-emerald-600">
                              ✓ Verified Student
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex text-amber-500">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star
                              key={si}
                              className={cn(
                                'size-3.5',
                                review.rating >= si + 1 ? 'fill-amber-500' : 'text-muted'
                              )}
                            />
                          ))}
                        </span>
                      </div>
                      <p className="text-sm italic text-muted-foreground">“{review.comment}”</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No class-specific reviews yet — be the first after your session.
                </p>
              )}
            </section>

            {/* Similar */}
            {similarClasses.length > 0 ? (
              <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold tracking-tight">More classes you might like</h2>
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#004ac6] hover:underline"
                    onClick={() => navigate('/explore')}
                  >
                    Explore all
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {similarClasses.map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => navigate(`/class/${cls.id}`)}
                      className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:border-[#2563eb]/50 hover:shadow-md"
                    >
                      <div className="relative h-32 w-full overflow-hidden bg-muted">
                        <img
                          src={
                            cls.imageUrl ||
                            'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600'
                          }
                          alt=""
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                          {cls.classType}
                        </span>
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-semibold transition-colors group-hover:text-[#004ac6]">
                          {cls.name}
                        </h4>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {cls.description || cls.level || 'Bookable session'}
                        </p>
                        <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2">
                          <span className="text-sm font-bold tabular-nums text-orange-600">
                            {formatVND(cls.price)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="size-3" />
                            {cls.duration} min
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Sticky booking rail */}
          <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-24" id="booking-card">
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#2563eb]/20 bg-card p-6 shadow-md">
              {spotsLeft > 0 && spotsLeft <= 3 ? (
                <div className="mb-4 flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-800 dark:bg-orange-950/50 dark:text-orange-200">
                  <Flame className="size-4 text-orange-600" />
                  High Demand • Only {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left
                </div>
              ) : null}

              <div className="mb-1 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight tabular-nums text-orange-600">
                    {formatVND(classData.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">/ session</span>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  -10% RhinoFit
                </span>
              </div>
              <p className="mb-5 text-xs text-muted-foreground">
                Regular walk-in price: <span className="line-through">{formatVND(walkIn)}</span>
              </p>

              <div className="mb-5 space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select Pass Option
                </span>
                <label
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-lg p-3 transition-all',
                    passOption === 'single'
                      ? 'border-2 border-[#2563eb] bg-[#f1f3ff] dark:bg-blue-950/30'
                      : 'border border-border hover:border-[#2563eb]/50'
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="pass_option"
                      checked={passOption === 'single'}
                      onChange={() => setPassOption('single')}
                      className="size-4 accent-[#2563eb]"
                    />
                    <span>
                      <span className="block text-xs font-bold text-foreground">Single Session Entry</span>
                      <span className="text-xs text-muted-foreground">
                        {classData.duration} min class + amenities
                      </span>
                    </span>
                  </span>
                  <span className="text-sm font-bold tabular-nums">{formatVND(classData.price)}</span>
                </label>
                <label
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-lg p-3 transition-all',
                    passOption === 'pack'
                      ? 'border-2 border-[#2563eb] bg-[#f1f3ff] dark:bg-blue-950/30'
                      : 'border border-border hover:border-[#2563eb]/50'
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="pass_option"
                      checked={passOption === 'pack'}
                      onChange={() => setPassOption('pack')}
                      className="size-4 accent-[#2563eb]"
                    />
                    <span>
                      <span className="block text-xs font-bold text-foreground">5-Class Pack (Save 18%)</span>
                      <span className="text-xs text-muted-foreground">
                        {formatVND(Math.round(packPrice / 5))} / class • Valid 60 days
                      </span>
                    </span>
                  </span>
                  <span className="text-sm font-bold tabular-nums">{formatVND(packPrice)}</span>
                </label>
              </div>

              <div className="mb-5 space-y-2 rounded-xl border border-border bg-muted/40 p-3.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <Calendar className="size-3.5 text-[#2563eb]" />
                    {days[selectedDay]?.title}
                  </span>
                  <span className="font-bold text-foreground">{slots[selectedSlot]?.range}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-emerald-600" />
                    {classData.classType}
                  </span>
                  <span className="font-semibold text-orange-600">
                    {enrolledCount} / {classData.capacity} Enrolled
                  </span>
                </div>
              </div>

              <Button
                type="button"
                className={cn('mb-3 h-12 w-full gap-2 text-base font-bold shadow-md', CTA_ORANGE)}
                disabled={isBookingDisabled}
                onClick={handleBook}
              >
                <Zap className="size-5" />
                {isFull
                  ? 'Class Full'
                  : isTrainer
                    ? 'Trainers Cannot Book'
                    : 'Book This Spot Now'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="mb-4 w-full gap-1.5"
                disabled={isBookingDisabled}
                onClick={handleBook}
              >
                Book with RhinoFit Pass (1 Credit)
              </Button>

              <div className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                {[
                  'Free cancellation up to 4 hours before session',
                  'Instant confirmation via RhinoFit',
                  'Studio amenities included',
                ].map((line) => (
                  <div key={line} className="flex items-center gap-2">
                    <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-orange-500/10 text-orange-600">
                  <MessageCircle className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Questions for {trainer.name.split(' ')[0]}?</p>
                  <p className="text-[11px] text-muted-foreground">Avg response time: 10 mins</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChat?.(trainer, { className: classData.name })}
              >
                Chat
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailPage;
