import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock,
  Heart,
  Lock,
  MapPin,
  Plus,
  Share2,
  Users,
} from 'lucide-react';
import { AppScreen } from '@/src/components/layout/screen';
import { APP_CONTENT } from '@/src/components/layout/shell';
import { EmptyState } from '@/src/components/layout/states';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Separator } from '@/src/components/ui/separator';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';
import { cn } from '@/src/lib/utils';

const FALLBACK_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200';

type DateFilter = 'all' | 'weekend' | 'month';

export type HubEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image_url: string | null;
  organizer?: { username: string } | { username: string }[] | null;
  status: string;
  interests_count?: number;
  interests?: { count: number }[];
};

function organizerName(event: HubEvent) {
  const o = event.organizer;
  if (!o) return 'Unknown';
  if (Array.isArray(o)) return o[0]?.username || 'Unknown';
  return o.username || 'Unknown';
}

function interestCount(event: HubEvent) {
  return event.interests_count ?? event.interests?.[0]?.count ?? 0;
}

function formatEventWhen(date: string, time: string) {
  try {
    const d = new Date(`${date}T${time || '00:00'}`);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return `${date} · ${time}`;
  }
}

function isThisWeekend(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  const now = new Date();
  const day = now.getDay();
  const toSat = (6 - day + 7) % 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + toSat);
  sat.setHours(0, 0, 0, 0);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  sun.setHours(23, 59, 59, 999);
  return d >= sat && d <= sun;
}

function isThisMonth(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

interface EventCardProps {
  event: HubEvent;
  onSelect: () => void;
}

function EventCard({ event, onSelect }: EventCardProps) {
  const count = interestCount(event);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <button type="button" onClick={onSelect} className="group text-left">
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          <img
            src={event.image_url || FALLBACK_EVENT_IMAGE}
            alt={event.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {event.status === 'pending' ? (
              <StatusBadge status="pending" className="shadow-sm">
                Pending
              </StatusBadge>
            ) : (
              <Badge className="bg-primary text-primary-foreground">Community</Badge>
            )}
          </div>
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 text-primary-foreground">
            <span className="inline-flex items-center gap-1 text-xs font-semibold">
              <Clock aria-hidden />
              {formatEventWhen(event.date, event.time)}
            </span>
            <span className="text-xs font-medium opacity-90">{count} interested</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {event.title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin aria-hidden />
              <span className="truncate">{event.location}</span>
            </p>
          </div>

          {event.description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-2 pt-1">
            <div>
              <p className="text-[11px] text-muted-foreground">Organized by</p>
              <p className="text-xs font-semibold text-foreground">{organizerName(event)}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users aria-hidden />
              {count}
            </span>
          </div>
        </div>
      </button>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border bg-muted/40 px-5 py-3">
        <Button type="button" variant="ghost" size="sm" onClick={onSelect}>
          View schedule
        </Button>
        <Button type="button" size="sm" onClick={onSelect}>
          Join event
        </Button>
      </div>
    </article>
  );
}

interface EventsPageProps {
  events: HubEvent[];
  isTrainer: boolean;
  onBack?: () => void;
  onSelectEvent: (event: HubEvent) => void;
  onOpenCreate: () => void;
}

const EventsPage: React.FC<EventsPageProps> = ({
  events,
  isTrainer,
  onSelectEvent,
  onOpenCreate,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [inspectId, setInspectId] = useState<string | null>(null);

  const approved = useMemo(
    () => events.filter((e) => e.status !== 'pending'),
    [events]
  );
  const pending = useMemo(
    () => events.filter((e) => e.status === 'pending'),
    [events]
  );

  const filtered = useMemo(() => {
    return approved.filter((e) => {
      if (dateFilter === 'weekend') return isThisWeekend(e.date);
      if (dateFilter === 'month') return isThisMonth(e.date);
      return true;
    });
  }, [approved, dateFilter]);

  const featured = filtered[0] ?? approved[0] ?? null;
  const gridEvents = filtered.filter((e) => e.id !== featured?.id);
  const inspect =
    (inspectId && events.find((e) => e.id === inspectId)) || featured;

  return (
    <AppScreen className="min-w-0 bg-background">
      <div className={cn(APP_CONTENT, 'flex flex-col gap-6 py-6 md:py-8')}>
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-primary">Events</p>
              <Badge variant="secondary">Live season</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Community competitions & workshops
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Tournaments, clinics and social runs across Saigon — register in one tap.
            </p>
          </div>
          <Button
            type="button"
            onClick={isTrainer ? onOpenCreate : undefined}
            disabled={!isTrainer}
          >
            {isTrainer ? <Plus data-icon="inline-start" /> : <Lock data-icon="inline-start" />}
            Host an event
          </Button>
        </header>

        {!isTrainer ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock aria-hidden />
            Only trainers can host events
          </p>
        ) : null}

        {events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events"
            description={
              isTrainer
                ? 'Create the first event for the community.'
                : 'Check back soon — new events are added every week.'
            }
            action={
              isTrainer ? (
                <Button type="button" onClick={onOpenCreate}>
                  <Plus data-icon="inline-start" />
                  Create event
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-12">
            <div className="flex flex-col gap-8 xl:col-span-8">
              {featured ? (
                <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  <div className="relative h-[280px] w-full overflow-hidden md:h-[360px]">
                    <img
                      src={featured.image_url || FALLBACK_EVENT_IMAGE}
                      alt={featured.title}
                      className="size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/70 to-transparent" />
                    <div className="absolute left-4 right-4 top-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                        <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                          {interestCount(featured)} registered interest
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="rounded-full"
                        aria-label="Share event"
                        onClick={() => onSelectEvent(featured)}
                      >
                        <Share2 />
                      </Button>
                    </div>
                    <div className="absolute inset-x-4 bottom-4 text-primary-foreground md:inset-x-5 md:bottom-5">
                      <p className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold opacity-90">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays aria-hidden />
                          {formatEventWhen(featured.date, featured.time)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin aria-hidden />
                          {featured.location}
                        </span>
                      </p>
                      <h2 className="mb-2 max-w-3xl text-2xl font-bold tracking-tight md:text-3xl">
                        {featured.title}
                      </h2>
                      {featured.description ? (
                        <p className="mb-4 line-clamp-2 max-w-2xl text-sm opacity-90">
                          {featured.description}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary-foreground/20 pt-3">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-2 ring-background">
                            {(organizerName(featured).charAt(0) || 'E').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              Hosted by {organizerName(featured)}
                            </p>
                            <p className="text-[11px] opacity-80">
                              {interestCount(featured)} athletes interested
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="bg-background/15 text-primary-foreground hover:bg-background/25"
                            onClick={() => {
                              setInspectId(featured.id);
                              onSelectEvent(featured);
                            }}
                          >
                            View details
                          </Button>
                          <Button type="button" onClick={() => onSelectEvent(featured)}>
                            <Heart data-icon="inline-start" />
                            I&apos;m interested
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              <div className="flex flex-col gap-3">
                <ToggleGroup
                  type="single"
                  value={dateFilter}
                  onValueChange={(v) => v && setDateFilter(v as DateFilter)}
                  variant="outline"
                  size="sm"
                  className="no-scrollbar w-full justify-start overflow-x-auto"
                  aria-label="Filter by date"
                >
                  <ToggleGroupItem value="all" className="rounded-full px-4">
                    All events ({approved.length})
                  </ToggleGroupItem>
                  <ToggleGroupItem value="weekend" className="rounded-full px-4">
                    This weekend
                  </ToggleGroupItem>
                  <ToggleGroupItem value="month" className="rounded-full px-4">
                    This month
                  </ToggleGroupItem>
                </ToggleGroup>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm">
                  <p className="text-muted-foreground">
                    Showing{' '}
                    <span className="font-semibold text-foreground">
                      {featured ? gridEvents.length + 1 : gridEvents.length}
                    </span>{' '}
                    of <span className="font-semibold text-foreground">{approved.length}</span>{' '}
                    community events
                  </p>
                  <span className="text-xs text-muted-foreground">Sort: date (earliest)</span>
                </div>
              </div>

              {gridEvents.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {gridEvents.map((event) => (
                    <div
                      key={event.id}
                      onMouseEnter={() => setInspectId(event.id)}
                      onFocus={() => setInspectId(event.id)}
                    >
                      <EventCard event={event} onSelect={() => onSelectEvent(event)} />
                    </div>
                  ))}
                </div>
              ) : featured ? null : (
                <EmptyState
                  icon={CalendarDays}
                  title="No events in this range"
                  description="Try another date filter."
                />
              )}

              {pending.length > 0 ? (
                <section className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Awaiting approval</h2>
                    <p className="text-sm text-muted-foreground">
                      Only you can see these until an admin approves them
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {pending.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onSelect={() => onSelectEvent(event)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            {/* Deep-dive drawer — mirrors mock right column */}
            <aside className="hidden xl:col-span-4 xl:block">
              <div className="sticky top-24 flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                {inspect ? (
                  <>
                    <div className="border-b border-border pb-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <Badge variant="secondary">Event deep dive</Badge>
                        <span className="text-[11px] text-muted-foreground">Live interest</span>
                      </div>
                      <h2 className="text-xl font-bold leading-tight text-foreground">
                        {inspect.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Schedule, location and host details for this event.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Clock aria-hidden />
                        When & where
                      </h3>
                      <dl className="flex flex-col gap-3 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Date & time</dt>
                          <dd className="font-semibold text-foreground">
                            {formatEventWhen(inspect.date, inspect.time)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Location</dt>
                          <dd className="font-semibold text-foreground">{inspect.location}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Organizer</dt>
                          <dd className="font-semibold text-foreground">
                            {organizerName(inspect)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {inspect.description ? (
                      <>
                        <Separator />
                        <div className="flex flex-col gap-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            About
                          </h3>
                          <p className="line-clamp-6 text-sm leading-relaxed text-muted-foreground">
                            {inspect.description}
                          </p>
                        </div>
                      </>
                    ) : null}

                    <Separator />

                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Heart aria-hidden className="text-primary" />
                        <strong className="text-foreground">{interestCount(inspect)}</strong>{' '}
                        interested
                      </span>
                    </div>

                    <div className="-mx-6 -mb-6 flex flex-col gap-2 rounded-b-xl border-t border-border bg-muted/40 p-6">
                      <Button type="button" className="w-full" onClick={() => onSelectEvent(inspect)}>
                        Open event page
                      </Button>
                      <p className="text-center text-[11px] text-muted-foreground">
                        Full schedule, dress code and registration on the detail page.
                      </p>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={CalendarDays}
                    title="Select an event"
                    description="Hover or open a card to inspect details here."
                  />
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </AppScreen>
  );
};

export default EventsPage;
