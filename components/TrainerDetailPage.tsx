import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Quote,
  Share2,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { Trainer, Class, ClassType, UserRole } from '../types';
import ImageGalleryModal from './ImageGalleryModal';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import { Button } from '@/src/components/ui/button';
import { AppScreen } from '@/src/components/layout/screen';
import { APP_CONTENT } from '@/src/components/layout/shell';
import { DetailContextStrip } from '@/src/components/layout/detail-context-strip';
import { PageLoader, EmptyState } from '@/src/components/layout/states';
import { StickyBookBar } from './marketplace/StickyBookBar';
import { SimilarTrainers, pickSimilarTrainers } from './marketplace/SimilarTrainers';
import { CrossSellCarousel } from './marketplace/CrossSellCarousel';
import { PackagePicker } from './marketplace/PackagePicker';
import { WaitlistButton } from './marketplace/WaitlistButton';
import { fetchActivePackages, type ClassPackage } from '@/src/lib/marketplace';
import { trackEvent } from '@/src/lib/analytics';

/**
 * Intent: athlete decides whether to book this coach.
 * Hierarchy: master identity card → classes → sticky book rail.
 * Lives inside AppShell (nav + footer); document scroll only — no overlay.
 */

const REVIEWS_PREVIEW = 3;
const LOW_SLOTS_THRESHOLD = 3;
const NEARLY_FULL_PERCENT = 75;

const formatTime = (time: string) => {
  try {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return time;
  }
};

const StarRow: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'size-3.5' }) => (
  <span className="inline-flex items-center" aria-hidden>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(size, rating >= i + 1 ? 'fill-amber-500 text-amber-500' : 'fill-muted text-muted')}
      />
    ))}
  </span>
);

const transformClassData = (c: Record<string, unknown>): Class => ({
  id: c.id as Class['id'],
  name: String(c.name ?? ''),
  language: (c.language as string[]) || [],
  level: String(c.level ?? ''),
  description: String(c.description ?? ''),
  duration: Number(c.duration_minutes ?? 0),
  price: Number(c.price ?? 0),
  imageUrl: String(c.image_url ?? ''),
  imageUrls: (c.image_urls as string[]) || [],
  capacity: Number(c.capacity ?? 0),
  classType: c.class_type as ClassType,
  schedule:
    c.schedule_days && c.schedule_time
      ? { days: c.schedule_days as string[], time: String(c.schedule_time) }
      : undefined,
  bookings: [],
  kids_friendly: Boolean(c.kids_friendly),
  disability_friendly: Boolean(c.disability_friendly),
});

/* ------------------------------------------------------------------ */
/* Masterclass card (Stitch section 2)                                  */
/* ------------------------------------------------------------------ */

interface ClassCardProps {
  cls: Class;
  trainer: Trainer;
  userRole: UserRole;
  currentUserId: string;
  onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
}

const ClassCard: React.FC<ClassCardProps> = React.memo(
  ({ cls, trainer, userRole, onInitiateBooking }) => {
    const navigate = useNavigate();
    const [enrolledCount, setEnrolledCount] = useState(0);

    const isFull = enrolledCount >= cls.capacity;
    const isBookingDisabledForTrainer = userRole === 'trainer';
    const availableSlots = Math.max(cls.capacity - enrolledCount, 0);
    const enrollmentPercentage = cls.capacity > 0 ? (enrolledCount / cls.capacity) * 100 : 0;
    const level = cls.level || '';
    const cover =
      cls.imageUrl ||
      cls.imageUrls?.[0] ||
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800';

    useEffect(() => {
      const classId = String((cls as { _dbId?: string })._dbId || cls.id);
      const loadBookings = async () => {
        const { data, error } = await supabase.from('bookings').select('id').eq('class_id', classId);
        if (!error && data) setEnrolledCount(data.length);
      };
      loadBookings();
      const channel = supabase
        .channel(`class-bookings-${classId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings', filter: `class_id=eq.${classId}` },
          () => loadBookings()
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }, [cls]);

    const openClass = () => {
      const classId = String((cls as { _dbId?: string })._dbId || cls.id);
      navigate(`/class/${classId}`);
    };

    const book = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isFull) {
        openClass();
        return;
      }
      onInitiateBooking({ trainer, cls });
    };

    return (
      <article
        className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
        onClick={openClass}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openClass();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div>
          <div className="relative h-44 overflow-hidden bg-muted">
            <img
              src={cover}
              alt=""
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {level ? (
                <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                  {level}
                </span>
              ) : null}
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-foreground backdrop-blur-sm">
                {cls.duration} min
              </span>
            </div>
            <div className="absolute right-3 top-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 shadow-sm dark:bg-emerald-950 dark:text-emerald-300">
                RhinoFit 10% OFF
              </span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="size-3.5 text-orange-300" />
                {cls.classType} · {trainer.location || 'TBD'}
              </span>
              <span className="rounded bg-black/40 px-2 py-0.5 text-xs backdrop-blur-sm">
                Max {cls.capacity} players
              </span>
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {cls.name}
            </h3>
            {cls.description ? (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{cls.description}</p>
            ) : null}

            <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-border/70 bg-[#f9fafb] p-2 dark:bg-muted/30">
              <img
                src={trainer.imageUrl || cover}
                alt=""
                className="size-8 rounded-full border border-border object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{trainer.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {trainer.specialty?.[0] || 'Lead coach'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Confirmed Registrations</span>
                <span className="font-bold text-foreground">
                  {enrolledCount} / {cls.capacity} spots filled
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full border border-border bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    enrollmentPercentage >= 100
                      ? 'bg-destructive'
                      : enrollmentPercentage >= NEARLY_FULL_PERCENT
                        ? 'bg-orange-500'
                        : 'bg-orange-500/80'
                  )}
                  style={{ width: `${Math.min(enrollmentPercentage, 100)}%` }}
                />
              </div>
              {availableSlots > 0 && availableSlots <= LOW_SLOTS_THRESHOLD ? (
                <span className="block text-xs font-medium text-orange-700 dark:text-orange-300">
                  ⚡ Only {availableSlots} spot{availableSlots === 1 ? '' : 's'} left
                </span>
              ) : null}
            </div>

            {cls.schedule?.days?.length && cls.schedule.time ? (
              <div className="mt-4">
                <span className="mb-1.5 block text-xs text-muted-foreground">Upcoming Sessions:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {cls.schedule.days.slice(0, 2).map((day, i) => (
                    <span
                      key={`${day}-${i}`}
                      className={cn(
                        'flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-center text-xs font-semibold',
                        i === 0
                          ? 'border-2 border-primary bg-blue-50 text-primary dark:bg-blue-950'
                          : 'border border-border bg-card text-muted-foreground'
                      )}
                    >
                      <Clock className="size-3" />
                      {day}, {formatTime(cls.schedule!.time)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-[#f9fafb]/50 p-5 pt-3 dark:bg-muted/20">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tabular-nums text-foreground">
                {formatVND(cls.price)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">per attendee</span>
          </div>
          <Button
            type="button"
            size="sm"
            className='gap-1'
            disabled={isBookingDisabledForTrainer}
            onClick={book}
          >
            {isFull ? 'Waitlist' : isBookingDisabledForTrainer ? 'N/A' : 'Reserve Spot'}
            {!isFull && !isBookingDisabledForTrainer ? <ArrowRight className="size-3.5" /> : null}
          </Button>
        </div>
      </article>
    );
  }
);

ClassCard.displayName = 'ClassCard';

/* ------------------------------------------------------------------ */
/* Trainer detail page                                                  */
/* ------------------------------------------------------------------ */

interface TrainerDetailPageProps {
  trainer: Trainer;
  userRole: UserRole;
  currentUserId: string;
  onBack: () => void;
  onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
  isFavorite: boolean;
  onToggleFavorite: (trainerId: string) => void;
  onOpenReviewsModal: (trainer: Trainer) => void;
  onOpenChat?: (trainer: Trainer) => void;
  allTrainers?: Trainer[];
}

const TrainerDetailPage: React.FC<TrainerDetailPageProps> = ({
  trainer,
  userRole,
  currentUserId,
  onBack,
  onInitiateBooking,
  isFavorite,
  onToggleFavorite,
  onOpenReviewsModal,
  onOpenChat,
  allTrainers = [],
}) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [classes, setClasses] = useState<Class[]>(trainer?.classes || []);
  const [packages, setPackages] = useState<ClassPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ClassPackage | null>(null);
  const [similarPool, setSimilarPool] = useState<Trainer[]>(allTrainers);
  const classesSectionRef = useRef<HTMLDivElement>(null);

  const displayClasses = useMemo(
    () => (classes.length > 0 ? classes : trainer?.classes || []),
    [classes, trainer?.classes]
  );

  useEffect(() => {
    if (trainer?.classes) setClasses(trainer.classes);
  }, [trainer?.id, trainer?.classes]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [trainer?.id]);

  useEffect(() => {
    if (!trainer?.id) return;
    trackEvent('trainer_profile_view', { trainerId: trainer.id }, currentUserId);
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) trackEvent('trainer_profile_view', { trainerId: trainer.id, ref }, currentUserId);
    let booked = false;
    const mark = () => {
      booked = true;
    };
    window.addEventListener('rhinofit:booking-complete', mark);
    return () => {
      window.removeEventListener('rhinofit:booking-complete', mark);
      if (!booked && currentUserId) {
        trackEvent('booking_abandon', { trainerId: trainer.id, stage: 'profile_leave' }, currentUserId);
        const key = `rf-abandon-${trainer.id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          void supabase.from('notifications').insert({
            user_id: currentUserId,
            type: 'profile_abandon',
            title: 'Still thinking it over?',
            message: `${trainer.name} often has a free slot tomorrow — finish booking when you’re ready.`,
            reference_id: trainer.id,
            href: `/trainer/${trainer.id}`,
            is_read: false,
          } as never);
        }
      }
    };
  }, [trainer?.id, trainer?.name, currentUserId]);

  useEffect(() => {
    if (!trainer?.id) return;
    const loadClasses = async () => {
      const { data, error } = await supabase.from('classes').select('*').eq('trainer_id', trainer.id);
      if (!error && data) {
        const mapped = data.map((row) => transformClassData(row as Record<string, unknown>));
        setClasses(mapped);
        if (mapped[0]) {
          const { data: pkgs } = await fetchActivePackages(String(mapped[0].id));
          setPackages(pkgs);
          if (pkgs[0]) setSelectedPackage(pkgs[0]);
        }
      }
    };
    loadClasses();
    const channel = supabase
      .channel(`trainer-classes-${trainer.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classes', filter: `trainer_id=eq.${trainer.id}` },
        () => loadClasses()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [trainer?.id]);

  useEffect(() => {
    if (allTrainers.length) {
      setSimilarPool(allTrainers);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, specialty, rating, reviews_count, location, avatar_url, price_per_hour, is_verified, is_premium')
        .limit(40);
      if (!data) return;
      setSimilarPool(
        data.map((p) => ({
          id: p.id,
          name: p.username,
          specialty: p.specialty || [],
          rating: Number(p.rating) || 0,
          reviews: p.reviews_count || 0,
          location: p.location || '',
          price: Number(p.price_per_hour) || 0,
          imageUrl: p.avatar_url || '',
          verificationStatus: p.is_verified ? 'verified' : 'unverified',
          isPremium: !!p.is_premium,
          bio: '',
          reviewsData: [],
          classes: [],
          chatHistory: [],
        })) as Trainer[]
      );
    })();
  }, [allTrainers, trainer?.id]);

  if (!trainer) {
    return (
      <AppScreen>
        <PageLoader title="Loading trainer…" />
      </AppScreen>
    );
  }

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `${trainer.name} - Trainer Profile`,
        text: `Check out ${trainer.name}'s profile`,
        url: window.location.href,
      });
    } catch {
      /* cancelled */
    }
  };

  const scrollToClasses = () =>
    classesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const sessionPrice = Number(
    selectedPackage?.price ?? trainer.price ?? displayClasses[0]?.price ?? 0
  );
  const titleLine = [
    trainer.specialty?.[0] ? `${trainer.specialty[0]} Coach` : 'Performance Coach',
    trainer.verificationStatus === 'verified' ? 'Verified' : null,
    trainer.experienceYears ? `${trainer.experienceYears}+ yrs` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const quote = trainer.reviewsData?.[0];
  const similar = pickSimilarTrainers(trainer, similarPool, 4);
  const startBook = () => {
    if (displayClasses[0]) onInitiateBooking({ trainer, cls: displayClasses[0] });
    else scrollToClasses();
  };
  const responseLabel =
    trainer.responseTimeMs != null
      ? trainer.responseTimeMs < 3_600_000
        ? `~${Math.max(1, Math.round(trainer.responseTimeMs / 60_000))} min reply`
        : `~${Math.round(trainer.responseTimeMs / 3_600_000)}h reply`
      : null;
  const onPlatform =
    trainer.createdAt != null
      ? new Date(trainer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : null;

  return (
    <AppScreen className="min-w-0 bg-muted/30 text-foreground">
      <div className={cn(APP_CONTENT, 'space-y-6 py-6 md:py-8 pb-28 md:pb-8')}>
        <DetailContextStrip
          backLabel="Back to Coaches"
          onBack={onBack}
          crumbs={[
            { label: 'Coaches', href: '/explore' },
            ...(trainer.specialty?.[0]
              ? [
                  {
                    label: trainer.specialty[0],
                    href: `/explore?category=${encodeURIComponent(
                      trainer.specialty[0].toLowerCase()
                    )}`,
                  },
                ]
              : []),
            {
              label: trainer.name,
              href: `/trainer/${encodeURIComponent(trainer.id)}`,
            },
          ]}
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleShare}
              >
                <Share2 className="size-3.5" />
                Share
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                aria-pressed={isFavorite}
                onClick={() => onToggleFavorite(trainer.id)}
              >
                <Heart
                  className={cn(
                    'size-3.5',
                    isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'
                  )}
                />
                {isFavorite ? 'Saved' : 'Save'}
              </Button>
            </>
          }
        />

        {/* Master trainer card */}
        <section className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary to-primary" />
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="relative shrink-0">
              <div className="h-36 w-32 overflow-hidden rounded-xl border border-border bg-muted shadow-sm sm:h-48 sm:w-40">
                {trainer.imageUrl ? (
                  <img src={trainer.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center text-2xl font-bold text-muted-foreground">
                    {trainer.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              {trainer.verificationStatus === 'verified' ? (
                <div
                  className="absolute -bottom-2 -right-2 rounded-full border-2 border-card bg-primary p-1 text-white shadow-md"
                  title="Verified"
                >
                  <ShieldCheck className="size-4" />
                </div>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[1.65rem]">
                      {trainer.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Available Today
                    </span>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-muted/60 px-2.5 py-1">
                    <Star className="size-4 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-semibold tabular-nums">
                      {trainer.rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({trainer.reviews} reviews)
                    </span>
                  </div>
                </div>
                <p className="mt-0.5 text-sm font-semibold text-primary">{titleLine}</p>
                <p className="mt-2.5 line-clamp-3 text-sm text-muted-foreground">
                  {trainer.bio ||
                    trainer.shortDescription ||
                    'Book a session to train with this RhinoFit coach.'}
                </p>
                {trainer.specialty?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {trainer.specialty.map((tag, i) => (
                      <span
                        key={tag}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-xs font-medium',
                          i === trainer.specialty.length - 1
                            ? 'border-transparent bg-primary/10 font-semibold text-primary dark:bg-blue-950'
                            : 'border-border bg-muted/50 text-muted-foreground'
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-[#f9fafb] p-2.5 text-sm dark:bg-muted/30">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4 text-orange-500" />
                  <span>
                    Next slot:{' '}
                    <strong className="text-foreground">
                      {displayClasses[0]?.schedule?.time
                        ? `Tomorrow, ${formatTime(displayClasses[0].schedule.time)}`
                        : 'Book to arrange time'}
                    </strong>
                    {trainer.location ? ` (${trainer.location})` : ''}
                  </span>
                </span>
                <span className="shrink-0 rounded bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                  Fast Filling
                </span>
              </div>
            </div>
          </div>

          {quote ? (
            <div className="mt-5 flex items-start gap-3 rounded-lg border-t border-border/60 bg-muted/40 p-3 pt-4">
              <Quote className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">“{quote.comment}”</span>
                <span className="ml-1">— {quote.reviewerName}</span>
              </p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight tabular-nums">
                {sessionPrice ? formatVND(sessionPrice) : '—'}
              </span>
              <span className="text-sm text-muted-foreground">/ 60-min session</span>
              <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                100% Guaranteed
              </span>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-initial"
                onClick={scrollToClasses}
                disabled={displayClasses.length === 0}
              >
                View Classes
              </Button>
              <Button
                type="button"
                className='flex-1 gap-1.5 sm:flex-initial'
                onClick={startBook}
                disabled={userRole === 'trainer'}
              >
                <Calendar className="size-4" />
                Book Session
              </Button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* Quality signals */}
            <section className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Reply</p>
                <p className="text-sm font-semibold">{responseLabel || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Accept rate</p>
                <p className="text-sm font-semibold tabular-nums">
                  {trainer.acceptanceRate != null ? `${Math.round(trainer.acceptanceRate)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">On platform</p>
                <p className="text-sm font-semibold">{onPlatform || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sessions from</p>
                <p className="text-sm font-semibold tabular-nums">{formatVND(sessionPrice || 0)}</p>
              </div>
            </section>

            {packages.length > 0 ? (
              <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Packages</h2>
                  <p className="text-sm text-muted-foreground">Single, 5-pack, or 10-pack with savings</p>
                </div>
                <PackagePicker
                  packages={packages}
                  value={selectedPackage?.id}
                  onChange={setSelectedPackage}
                />
              </section>
            ) : null}

            {/* About */}
            {trainer.bio ? (
              <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-lg font-semibold tracking-tight">About this coach</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {trainer.bio}
                </p>
                {trainer.location ? (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 text-primary" />
                    {trainer.location}
                  </p>
                ) : null}
              </section>
            ) : null}

            {/* Classes */}
            <section ref={classesSectionRef} className="scroll-mt-24 space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Classes & Masterclasses</h2>
                  <p className="text-sm text-muted-foreground">
                    {displayClasses.length > 0
                      ? `${displayClasses.length} sessions available`
                      : 'No published classes yet'}
                  </p>
                </div>
              </div>
              {displayClasses.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {displayClasses.map((cls) => (
                    <ClassCard
                      key={cls.id}
                      cls={cls}
                      trainer={trainer}
                      userRole={userRole}
                      currentUserId={currentUserId}
                      onInitiateBooking={onInitiateBooking}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No classes available yet"
                  description="Check back soon — new classes appear here."
                />
              )}
            </section>

            {/* Gallery */}
            {trainer.galleryImages && trainer.galleryImages.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-xl font-bold tracking-tight">Gallery</h2>
                <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                  {trainer.galleryImages.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => {
                        setSelectedImageIndex(index);
                        setIsGalleryOpen(true);
                      }}
                      aria-label={`Open photo ${index + 1}`}
                      className="overflow-hidden rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <img
                        src={url}
                        alt=""
                        loading="lazy"
                        className="aspect-square w-full object-cover transition-opacity hover:opacity-80"
                      />
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Reviews */}
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight">
                  Student reviews ({trainer.reviews})
                </h2>
                {trainer.reviewsData && trainer.reviewsData.length > REVIEWS_PREVIEW ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-primary"
                    onClick={() => onOpenReviewsModal(trainer)}
                  >
                    View all
                    <ArrowRight className="size-3.5" />
                  </Button>
                ) : null}
              </div>
              {trainer.reviewsData && trainer.reviewsData.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {trainer.reviewsData.slice(0, REVIEWS_PREVIEW).map((review, index) => (
                    <article
                      key={index}
                      className="rounded-xl border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <span className="grid size-8 place-items-center rounded-full bg-muted">
                          <Users className="size-4 text-muted-foreground" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {review.reviewerName}
                        </span>
                        <StarRow rating={review.rating} />
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                      {review.criteria ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {Object.entries(review.criteria).map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground"
                            >
                              {k} {String(v)}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {review.trainerReply ? (
                        <p className="mt-2 border-l-2 border-primary/40 pl-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Coach: </span>
                          {review.trainerReply}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Star}
                  title="No reviews yet"
                  description="Reviews from students will appear here."
                />
              )}
            </section>

            <SimilarTrainers trainers={similar} />
            <CrossSellCarousel specialty={trainer.specialty?.[0]} />
          </div>

          {/* Sticky book rail — sticks under AppShell top nav on document scroll */}
          <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-[5.5rem] lg:self-start">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Session from
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-foreground">
                {sessionPrice ? formatVND(sessionPrice) : '—'}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center justify-between">
                  <span>Classes</span>
                  <span className="font-semibold text-foreground">{displayClasses.length}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Reviews</span>
                  <span className="font-semibold text-foreground">{trainer.reviews}</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Check className="size-4" />
                  Satisfaction guaranteed
                </li>
              </ul>
              <Button
                type="button"
                className='mt-4 w-full gap-1.5'
                onClick={startBook}
                disabled={userRole === 'trainer' || displayClasses.length === 0}
              >
                <Calendar className="size-4" />
                Book Session
              </Button>
              {displayClasses[0] ? (
                <WaitlistButton
                  classId={String(displayClasses[0].id)}
                  userId={currentUserId}
                  className="mt-2 w-full"
                />
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full gap-1.5"
                onClick={() => {
                  trackEvent('chat_open', { trainerId: trainer.id }, currentUserId);
                  if (onOpenChat) onOpenChat(trainer);
                  else scrollToClasses();
                }}
              >
                <MessageCircle className="size-4" />
                Message Coach
              </Button>
            </div>

            {trainer.specialty?.length ? (
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">Specialties</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {trainer.specialty.map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      {isGalleryOpen && trainer.galleryImages ? (
        <ImageGalleryModal
          images={trainer.galleryImages}
          startIndex={selectedImageIndex}
          onClose={() => setIsGalleryOpen(false)}
        />
      ) : null}

      {userRole !== 'trainer' ? (
        <StickyBookBar
          price={sessionPrice}
          meta={selectedPackage?.name || displayClasses[0]?.name}
          onBook={startBook}
          disabled={displayClasses.length === 0}
        />
      ) : null}
    </AppScreen>
  );
};

export default TrainerDetailPage;
