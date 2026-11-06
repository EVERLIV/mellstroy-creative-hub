import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  Share2,
  User,
  Users,
} from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { AppScreen } from '@/src/components/layout/screen';
import { DetailContextStrip } from '@/src/components/layout/detail-context-strip';
import { APP_CONTENT } from '@/src/components/layout/shell';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Separator } from '@/src/components/ui/separator';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { cn } from '@/src/lib/utils';

const FALLBACK_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200';

function organizerName(event: {
  organizer?: { username: string } | { username: string }[] | null;
}) {
  const o = event.organizer;
  if (!o) return 'Unknown';
  if (Array.isArray(o)) return o[0]?.username || 'Unknown';
  return o.username || 'Unknown';
}

interface EventDetailPageProps {
  event: any;
  currentUserId: string | null;
  onBack: () => void;
  onToggleInterest: (eventId: string) => void;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({
  event,
  currentUserId,
  onBack,
  onToggleInterest,
}) => {
  const [isInterested, setIsInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(0);

  useEffect(() => {
    const checkInterest = async () => {
      if (!currentUserId) return;
      try {
        const { data } = await supabase
          .from('event_interests')
          .select()
          .eq('event_id', event.id)
          .eq('user_id', currentUserId)
          .maybeSingle();
        setIsInterested(!!data);

        const { count } = await supabase
          .from('event_interests')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);
        setInterestCount(count || 0);
      } catch (error) {
        console.error('Error checking interest:', error);
      }
    };
    checkInterest();
  }, [event, currentUserId]);

  const host = organizerName(event);

  let dateLabel = event.date;
  let timeLabel = event.time;
  try {
    const d = new Date(`${event.date}T${event.time || '00:00'}`);
    dateLabel = d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    timeLabel = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    /* keep raw */
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/events/${event.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled */
    }
  };

  const interestButton = (
    <Button
      size="lg"
      variant={isInterested ? 'outline' : 'default'}
      onClick={() => onToggleInterest(event.id)}
      aria-pressed={isInterested}
      className="w-full"
    >
      <Heart data-icon="inline-start" className={cn(isInterested && 'fill-current')} />
      {isInterested ? "You're interested" : "I'm interested"}
    </Button>
  );

  return (
    <AppScreen className="min-w-0 bg-background">
      <div className={cn(APP_CONTENT, 'flex flex-col gap-6 py-4 md:py-6')}>
        <DetailContextStrip
          backLabel="Back to Events"
          onBack={onBack}
          crumbs={[
            { label: 'Home', href: '/' },
            { label: 'Events', href: '/events' },
            { label: event.title },
          ]}
          meta={
            event.status === 'pending' ? (
              <StatusBadge status="pending">Pending approval</StatusBadge>
            ) : (
              <Badge variant="secondary">Community event</Badge>
            )
          }
          actions={
            <Button type="button" variant="outline" size="sm" onClick={handleShare}>
              <Share2 data-icon="inline-start" />
              Share
            </Button>
          }
        />

        {/* Hero — class-detail style */}
        <section className="relative overflow-hidden rounded-2xl border border-border">
          <img
            src={event.image_url || FALLBACK_EVENT_IMAGE}
            alt={event.title}
            className="aspect-[16/9] w-full object-cover md:aspect-[21/9]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground md:p-8">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge className="bg-primary text-primary-foreground">Event</Badge>
              <Badge variant="secondary" className="bg-background/90 text-foreground backdrop-blur">
                {interestCount} interested
              </Badge>
            </div>
            <h1 className="max-w-3xl text-2xl font-bold tracking-tight md:text-4xl">
              {event.title}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-90">
              <span className="inline-flex items-center gap-1">
                <Calendar aria-hidden />
                {dateLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden />
                {timeLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden />
                {event.location}
              </span>
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-8">
            <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <h2 className="text-lg font-semibold text-foreground">About this event</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground md:text-base">
                {event.description || 'Details coming soon from the organizer.'}
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Day flow</h2>
              <ol className="relative flex flex-col gap-4 border-l-2 border-primary/20 pl-4">
                {[
                  {
                    t: timeLabel,
                    title: 'Check-in opens',
                    note: 'Arrive early for bib / spot confirmation',
                  },
                  {
                    t: 'Session',
                    title: 'Main activity',
                    note: event.title,
                  },
                  {
                    t: 'Wrap',
                    title: 'Cool-down & community hang',
                    note: 'Photos, recovery tips, next meetup info',
                  },
                ].map((slot) => (
                  <li key={slot.title} className="relative">
                    <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
                    <p className="text-xs font-bold text-primary">{slot.t}</p>
                    <p className="text-sm font-semibold text-foreground">{slot.title}</p>
                    <p className="text-xs text-muted-foreground">{slot.note}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Users aria-hidden />
                Who&apos;s interested
              </h2>
              {interestCount > 0 ? (
                <p className="text-sm text-muted-foreground">
                  <span className="text-lg font-semibold tabular-nums text-foreground">
                    {interestCount}
                  </span>{' '}
                  {interestCount === 1 ? 'person is' : 'people are'} interested in this event.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Be the first to show your interest!
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-muted/40 p-5 md:p-6">
              <h2 className="mb-2 text-lg font-semibold text-foreground">What to bring</h2>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                {[
                  'Athletic wear suited to the activity',
                  'Water bottle and a small towel',
                  'RhinoFit booking confirmation on your phone',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Sticky registration panel — class detail aside */}
          <aside className="lg:col-span-4">
            <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Registration
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">Join this event</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tap interested to save your spot on the community list.
                </p>
              </div>

              <Separator />

              <dl className="flex flex-col gap-4 text-sm">
                <div className="flex gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Calendar aria-hidden />
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Date</dt>
                    <dd className="font-semibold text-foreground">{dateLabel}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Clock aria-hidden />
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Time</dt>
                    <dd className="font-semibold text-foreground">{timeLabel}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <MapPin aria-hidden />
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Location</dt>
                    <dd className="font-semibold text-foreground">{event.location}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <User aria-hidden />
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Organizer</dt>
                    <dd className="font-semibold text-foreground">{host}</dd>
                  </div>
                </div>
              </dl>

              <div className="hidden md:block">{interestButton}</div>
              <p className="hidden text-center text-[11px] text-muted-foreground md:block">
                Free to mark interest · organizer may follow up in Messages
              </p>
            </div>
          </aside>
        </div>

        {/* Mobile sticky CTA */}
        <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
          <div className={cn(APP_CONTENT, 'px-0')}>{interestButton}</div>
        </div>
        <div className="h-20 md:hidden" aria-hidden />
      </div>
    </AppScreen>
  );
};

export default EventDetailPage;
