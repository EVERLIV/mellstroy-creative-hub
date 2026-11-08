import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trainer, Class, UserRole } from '../types';
import {
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Edit3,
  FileText,
  Lightbulb,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Share2,
  Shield,
  ShieldCheck,
  Star,
  Timer,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import { isTrainerProfileComplete } from '../utils/profile';
import { supabase } from '../src/integrations/supabase/client';
import MyDocumentsPage from './MyDocumentsPage';
import { AppScreen } from '@/src/components/layout/screen';
import { EmptyState } from '@/src/components/layout/states';
import { Button } from '@/src/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { APP_CONTENT } from '@/src/components/layout/shell';
import { formatVND } from '@/src/lib/format';
import { cn } from '@/src/lib/utils';

const FALLBACK_CLASS_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48';
const MAX_VISIBLE_SPECIALTIES = 6;

interface ProfilePageProps {
  trainer: Trainer;
  onEdit: () => void;
  onManageClass: (cls: Class | null) => void;
  onDeleteClass: (classId: number) => void;
  userRole: UserRole;
  onStartVerification: () => void;
  onLogout: () => void;
}

type ClassTab = 'active' | 'drafts' | 'archived';

function scheduleLabel(cls: Class): string {
  const days = cls.schedule?.days?.slice(0, 3).join(', ');
  const time = cls.schedule?.time;
  if (days && time) return `${days} · ${time}`;
  if (days) return days;
  if (time) return time;
  return 'Flexible schedule';
}

function upcomingFromClasses(classes: Class[]) {
  const today = new Date();
  const items: { day: string; dateNum: string; title: string; meta: string; full?: boolean }[] = [];
  for (let i = 0; i < 7 && items.length < 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const match = classes.find((c) =>
      c.schedule?.days?.some((day) => day.toLowerCase().startsWith(weekday.toLowerCase().slice(0, 3)))
    );
    if (!match) continue;
    const enrolled = match.bookings?.length ?? 0;
    const full = match.capacity > 0 && enrolled >= match.capacity;
    items.push({
      day: weekday,
      dateNum: String(d.getDate()),
      title: match.name,
      meta: `${match.schedule?.time || 'TBD'} · ${enrolled}/${match.capacity} registered`,
      full,
    });
  }
  return items;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  trainer,
  onEdit,
  onManageClass,
  onDeleteClass,
  userRole,
  onStartVerification,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState<
    { id: string; title: string; is_verified?: boolean; created_at?: string }[]
  >([]);
  const [dismissPrompt, setDismissPrompt] = useState(false);
  const [classTab, setClassTab] = useState<ClassTab>('active');
  const profileIsIncomplete = !isTrainerProfileComplete(trainer);

  useEffect(() => {
    void checkAdminStatus();
    void loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('trainer_documents')
      .select('*')
      .eq('trainer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    setDocuments(data || []);
  };

  const checkAdminStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!roles);
  };

  const handleDelete = (classId: number) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      onDeleteClass(classId);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/trainer/${trainer.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${trainer.name} · RhinoFit`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled */
    }
  };

  const upcoming = useMemo(() => upcomingFromClasses(trainer.classes ?? []), [trainer.classes]);
  const totalCapacity = useMemo(
    () => (trainer.classes ?? []).reduce((sum, c) => sum + (c.capacity || 0), 0),
    [trainer.classes]
  );

  if (showDocuments) {
    return (
      <MyDocumentsPage
        onBack={() => {
          setShowDocuments(false);
          void loadDocuments();
        }}
      />
    );
  }

  const initials = trainer.name
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'T';

  return (
    <AppScreen className="min-w-0">
      <div className={cn(APP_CONTENT, 'space-y-8 py-6')}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Trainer profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Public listing, classes, credentials, and reviews
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-md border border-border/80 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            Coach
          </span>
        </div>

        {profileIsIncomplete && !dismissPrompt ? (
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Lightbulb className="size-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Complete your coach profile</p>
                <p className="text-sm text-muted-foreground">
                  Bio, specialties, and verified documents improve discovery in Saigon.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
              <Button type="button" className="gap-1.5" onClick={onEdit}>
                Edit profile
                <ArrowRight className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Dismiss"
                onClick={() => setDismissPrompt(true)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}

        <section className="overflow-hidden rounded-xl border border-border/80 bg-card">
          <div className="relative h-28 w-full bg-muted sm:h-40">
            <div
              className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--muted))_0%,hsl(var(--background))_55%,hsl(var(--muted))_100%)]"
              aria-hidden
            />
            <div className="absolute right-4 top-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 bg-card/95"
                onClick={onEdit}
              >
                <Camera className="size-3.5" />
                Change cover
              </Button>
            </div>
          </div>

          <div className="px-5 pb-6 sm:px-8">
            <div className="relative -mt-12 mb-5 sm:-mt-14">
              <div className="relative inline-block">
                <Avatar className="size-24 rounded-2xl border-[3px] border-card shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)] sm:size-28">
                  <AvatarImage src={trainer.imageUrl} alt="" className="object-cover" />
                  <AvatarFallback className="rounded-2xl text-2xl font-semibold">{initials}</AvatarFallback>
                </Avatar>
                {trainer.verificationStatus === 'verified' ? (
                  <div
                    className="absolute -bottom-1 -right-1 rounded-full border-2 border-card bg-emerald-600 p-1 text-white"
                    title="Identity verified"
                  >
                    <ShieldCheck className="size-3.5" />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
                    {trainer.name}
                  </h2>
                  {trainer.verificationStatus === 'verified' ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" />
                      Verified
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                  {trainer.location ? (
                    <>
                      <MapPin className="size-3.5" />
                      <span>{trainer.location}</span>
                      <span className="mx-1 text-border">·</span>
                    </>
                  ) : null}
                  <span className="text-foreground/80">RhinoFit coach</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
                  <Share2 className="size-3.5" />
                  Share
                </Button>
                <Button type="button" size="sm" className="gap-1.5" onClick={onEdit}>
                  <Pencil className="size-3.5" />
                  Edit profile
                </Button>
              </div>
            </div>

            {trainer.specialty?.length ? (
              <div className="mb-5 flex flex-wrap gap-1.5">
                {trainer.specialty.slice(0, MAX_VISIBLE_SPECIALTIES).map((spec) => (
                  <span
                    key={spec}
                    className="rounded-md border border-border/80 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border/80 bg-border/80 md:grid-cols-4">
              <div className="bg-card p-3.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Rating
                  </span>
                  <span className="text-[11px] text-muted-foreground">{trainer.reviews} reviews</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                    {trainer.rating.toFixed(1)}
                  </span>
                  <Star className="size-3.5 fill-amber-500 text-amber-500" />
                </div>
              </div>
              <div className="bg-card p-3.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Classes
                  </span>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Active</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                    {trainer.classes.length}
                  </span>
                  <span className="text-xs text-muted-foreground">published</span>
                </div>
              </div>
              <div className="bg-card p-3.5">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Experience
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                    {trainer.experienceYears ?? '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">yrs</span>
                </div>
              </div>
              <div className="bg-card p-3.5">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Rate / hour
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                    {trainer.price ? formatVND(trainer.price) : '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">/ hr</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 md:col-span-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Shield className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {trainer.verificationStatus === 'verified'
                    ? 'Verified trainer'
                    : trainer.verificationStatus === 'pending'
                      ? 'Verification pending'
                      : 'Get verified'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {trainer.verificationStatus === 'verified'
                    ? 'Shown as trusted on your public listing.'
                    : trainer.verificationStatus === 'pending'
                      ? 'Review in progress.'
                      : 'Verified coaches convert more bookings.'}
                </p>
              </div>
            </div>
            {trainer.verificationStatus === 'verified' ? (
              <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                Verified
              </span>
            ) : (
              <Button size="sm" variant="outline" onClick={onStartVerification}>
                {trainer.verificationStatus === 'pending' ? 'Status' : 'Verify'}
              </Button>
            )}
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center md:col-span-7">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
                <Crown className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {trainer.isPremium ? 'Coach Pro' : 'Coach Pro'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Extra photos, priority listing, and class analytics.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant={trainer.isPremium ? 'outline' : 'default'}
              size="sm"
              className="shrink-0 self-start sm:self-center"
              onClick={() => navigate('/subscription')}
            >
              {trainer.isPremium ? 'Manage' : 'Upgrade'}
            </Button>
          </div>
        </div>

        {/* Main split */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Classes */}
          <section className="space-y-4 lg:col-span-8">
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    My classes ({trainer.classes.length})
                  </h3>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Open for booking
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Recurring slots students can book
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                <div className="flex items-center rounded-lg border border-border/80 bg-muted/60 p-0.5">
                  {(
                    [
                      ['active', `Active (${trainer.classes.length})`],
                      ['drafts', 'Drafts (0)'],
                      ['archived', 'Archived'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setClassTab(id)}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                        classTab === id
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onManageClass(null)}
                >
                  <Plus className="size-4" />
                  Add class
                </Button>
              </div>
            </div>

            {classTab !== 'active' ? (
              <EmptyState
                icon={BookOpen}
                title={classTab === 'drafts' ? 'No drafts' : 'No archived classes'}
                description="Only active published classes are shown here for now."
              />
            ) : trainer.classes.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No classes yet"
                description="Create your first class to start teaching"
                action={
                  <Button onClick={() => onManageClass(null)}>
                    <Plus />
                    Create class
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col gap-4">
                {trainer.classes.map((cls) => {
                  const spots = Math.max(cls.capacity - (cls.bookings?.length ?? 0), 0);
                  return (
                    <li
                      key={cls.id}
                      className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-4 sm:flex-row"
                    >
                      <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-lg bg-muted outline outline-1 outline-inset outline-black/10 sm:w-44">
                        <img
                          src={cls.imageUrl || FALLBACK_CLASS_IMAGE}
                          alt=""
                          className="size-full object-cover"
                        />
                        <span className="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground">
                          {cls.classType || cls.level || 'Class'}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">
                                {cls.name}
                              </h4>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                {cls.level ? (
                                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                    {cls.level}
                                  </span>
                                ) : null}
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="size-3" />
                                  {scheduleLabel(cls)}
                                </span>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 text-muted-foreground"
                                  aria-label={`Actions for ${cls.name}`}
                                >
                                  <MoreVertical />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-[140px]">
                                <DropdownMenuItem onSelect={() => onManageClass(cls)}>
                                  <Edit3 />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => handleDelete(cls.id as number)}
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                >
                                  <Trash2 />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {cls.description ? (
                            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                              {cls.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-3">
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="text-sm font-semibold tabular-nums text-foreground">
                              {formatVND(cls.price)}
                            </span>
                            <span className="text-border">·</span>
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Timer className="size-3" />
                              {cls.duration} min
                            </span>
                            <span className="text-border">·</span>
                            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                              {spots} spots
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => navigate('/bookings')}
                          >
                            Manage roster
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Documents */}
            <div className="rounded-xl border border-border/80 bg-card p-4">
              <div className="mb-3 flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">Documents</h4>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium text-foreground hover:underline"
                  onClick={() => setShowDocuments(true)}
                >
                  View all
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
              {documents.length > 0 ? (
                <ul className="space-y-2.5">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-2"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ShieldCheck
                          className={cn(
                            'size-5 shrink-0',
                            doc.is_verified ? 'text-emerald-600' : 'text-muted-foreground'
                          )}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold text-foreground">
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {doc.is_verified ? 'Verified' : 'Pending review'}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-2 text-center text-xs text-muted-foreground">No documents uploaded</p>
              )}
              <div className="mt-4 border-t border-border/80 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDocuments(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/40 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-muted hover:text-foreground"
                >
                  <Upload className="size-4" />
                  Upload documents
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4">
              <div className="mb-3 flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">Upcoming</h4>
                </div>
                <span className="text-xs text-muted-foreground">7 days</span>
              </div>
              {upcoming.length > 0 ? (
                <ul className="space-y-3">
                  {upcoming.map((item) => (
                    <li key={`${item.day}-${item.dateNum}-${item.title}`} className="flex items-start gap-3">
                      <div className="w-12 rounded-lg border border-border bg-muted/50 py-1.5 text-center">
                        <span className="block text-[10px] font-semibold uppercase text-muted-foreground">
                          {item.day}
                        </span>
                        <span className="block text-base font-bold text-foreground">{item.dateNum}</span>
                      </div>
                      <div className="min-w-0 flex-1 text-xs">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-muted-foreground">{item.meta}</p>
                      </div>
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                          item.full
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        )}
                      >
                        {item.full ? 'Full' : 'Open'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  Add class schedules to see upcoming sessions.
                </p>
              )}
              <div className="mt-4 border-t border-border pt-3">
                <button
                  type="button"
                  className="block w-full text-center text-xs font-semibold text-primary hover:underline"
                  onClick={() => navigate('/bookings')}
                >
                  Open full timetable
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4">
              <div className="mb-3 flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">Performance</h4>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/50 p-2">
                  <span className="block text-[11px] text-muted-foreground">Published</span>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {trainer.classes.length}
                  </span>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <span className="block text-[11px] text-muted-foreground">Total capacity</span>
                  <span className="text-lg font-bold tabular-nums text-foreground">{totalCapacity}</span>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <span className="block text-[11px] text-muted-foreground">Reviews</span>
                  <span className="text-lg font-bold tabular-nums text-foreground">{trainer.reviews}</span>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <span className="block text-[11px] text-muted-foreground">Rating</span>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {trainer.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="mt-3 flex w-full items-center justify-between py-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/bookings')}
              >
                <span>View bookings</span>
                <ChevronRight className="size-4" />
              </button>
            </div>

            {isAdmin ? (
              <Button variant="outline" onClick={() => navigate('/admin')} className="w-full justify-start">
                <Shield />
                Admin dashboard
              </Button>
            ) : null}
          </aside>
        </div>
      </div>
    </AppScreen>
  );
};

export default ProfilePage;
