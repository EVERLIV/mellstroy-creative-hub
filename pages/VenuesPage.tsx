import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Star,
  Calendar,
  LayoutGrid,
  List,
  Check,
  Clock,
  Phone,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { Venue } from '../types';
import VenueCard, { VENUE_CATEGORY_LABELS } from '../components/VenueCard';
import VenueDetailPage from './VenueDetailPage';
import VenueFilterModal from '../components/VenueFilterModal';
import { AppScreen } from '../src/components/layout/screen';
import { EmptyState } from '../src/components/layout/states';
import { Button } from '../src/components/ui/button';
import { Input } from '../src/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../src/components/ui/sheet';
import { SCREEN_BOTTOM_SAFE, SCREEN_GUTTER } from '../src/components/layout/shell';
import { formatVND } from '../src/lib/format';
import { cn } from '../src/lib/utils';

interface VenuesPageProps {
  venues: Venue[];
  onBack: () => void;
}

type VenueFilters = {
  category: string[];
  district: string;
  minRating: number;
  trainerAvailability: boolean;
  priceRange: 'any' | 'low' | 'medium' | 'high';
  operatingHours: 'any' | 'morning' | 'afternoon' | 'evening';
};

type SortKey = 'recommended' | 'price-asc' | 'rating' | 'name';

const SLOT_OPTIONS = ['17:00–18:00', '18:00–19:00', '19:00–20:00', '20:00–21:00', 'Booked', '21:00–22:00'];

const VenuesPage: React.FC<VenuesPageProps> = ({ venues, onBack }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const venueId = searchParams.get('venue');
  const districtParam = searchParams.get('district');

  const selectedVenue = useMemo(
    () => (venueId ? venues.find((v) => v.id === venueId) ?? null : null),
    [venues, venueId]
  );

  const [bookingVenue, setBookingVenue] = useState<Venue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [topRated, setTopRated] = useState(false);
  const [rhinofitDeal, setRhinofitDeal] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('recommended');
  const [listView, setListView] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('18:00–19:00');
  const [activeFilters, setActiveFilters] = useState<VenueFilters>({
    category: [],
    district: 'All Districts',
    minRating: 0,
    trainerAvailability: false,
    priceRange: 'any',
    operatingHours: 'any',
  });

  // Sync district filter from breadcrumb / deep links.
  useEffect(() => {
    const nextDistrict = districtParam || 'All Districts';
    setActiveFilters((prev) =>
      prev.district === nextDistrict ? prev : { ...prev, district: nextDistrict }
    );
  }, [districtParam]);

  const handleSelectVenue = (venue: Venue) => {
    setBookingVenue(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('venue', venue.id);
        if (venue.district) next.set('district', venue.district);
        return next;
      },
      { replace: false }
    );
    window.scrollTo(0, 0);
  };

  const handleBackFromDetail = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('venue');
        return next;
      },
      { replace: true }
    );
  };

  const handleApplyFilters = (next: VenueFilters) => {
    setActiveFilters(next);
    setIsFilterModalOpen(false);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete('venue');
        if (next.district && next.district !== 'All Districts') {
          params.set('district', next.district);
        } else {
          params.delete('district');
        }
        return params;
      },
      { replace: true }
    );
  };

  const handleResetFilters = () => {
    setActiveFilters({
      category: [],
      district: 'All Districts',
      minRating: 0,
      trainerAvailability: false,
      priceRange: 'any',
      operatingHours: 'any',
    });
    setSportFilter('all');
    setIndoorOnly(false);
    setOpenNow(false);
    setTopRated(false);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete('district');
        params.delete('venue');
        return params;
      },
      { replace: true }
    );
  };

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of venues) counts.set(v.category, (counts.get(v.category) || 0) + 1);
    return counts;
  }, [venues]);

  const filteredVenues = useMemo(() => {
    let list = venues.filter((venue) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        venue.name.toLowerCase().includes(q) ||
        venue.description.toLowerCase().includes(q) ||
        venue.district.toLowerCase().includes(q) ||
        venue.address.toLowerCase().includes(q) ||
        VENUE_CATEGORY_LABELS[venue.category].toLowerCase().includes(q);

      const matchesSport = sportFilter === 'all' || venue.category === sportFilter;
      const matchesCategory =
        activeFilters.category.length === 0 || activeFilters.category.includes(venue.category);
      const matchesDistrict =
        activeFilters.district === 'All Districts' || venue.district === activeFilters.district;
      const matchesRating =
        venue.rating >= activeFilters.minRating && (!topRated || venue.rating >= 4.5);
      const matchesTrainer =
        !activeFilters.trainerAvailability || venue.trainerAvailability === true;

      let matchesPrice = true;
      if (activeFilters.priceRange === 'low') matchesPrice = venue.pricePerHour < 200000;
      else if (activeFilters.priceRange === 'medium')
        matchesPrice = venue.pricePerHour >= 200000 && venue.pricePerHour <= 400000;
      else if (activeFilters.priceRange === 'high') matchesPrice = venue.pricePerHour > 400000;

      let matchesHours = true;
      if (activeFilters.operatingHours !== 'any' || openNow) {
        matchesHours = venue.operatingHours.some((oh) => {
          const openHour = parseInt(oh.open.split(':')[0], 10);
          const closeHour = parseInt(oh.close.split(':')[0], 10);
          if (openNow) {
            const now = new Date().getHours();
            return openHour <= now && closeHour > now;
          }
          if (activeFilters.operatingHours === 'morning') return openHour <= 8 && closeHour >= 12;
          if (activeFilters.operatingHours === 'afternoon') return openHour <= 12 && closeHour >= 17;
          if (activeFilters.operatingHours === 'evening') return openHour <= 17 && closeHour >= 20;
          return true;
        });
      }

      const matchesIndoor =
        !indoorOnly ||
        venue.amenities.some((a) => /indoor|air conditioning/i.test(a)) ||
        venue.equipment.some((e) => /indoor/i.test(e)) ||
        /indoor/i.test(venue.description);

      return (
        matchesSearch &&
        matchesSport &&
        matchesCategory &&
        matchesDistrict &&
        matchesRating &&
        matchesTrainer &&
        matchesPrice &&
        matchesHours &&
        matchesIndoor
      );
    });

    return [...list].sort((a, b) => {
      if (sortKey === 'price-asc') return a.pricePerHour - b.pricePerHour;
      if (sortKey === 'rating') return b.rating - a.rating || b.reviews - a.reviews;
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      return (
        b.rating * 10 +
        (b.trainerAvailability ? 5 : 0) -
        (a.rating * 10 + (a.trainerAvailability ? 5 : 0))
      );
    });
  }, [venues, searchQuery, activeFilters, sportFilter, indoorOnly, openNow, topRated, sortKey]);

  const featuredVenue = useMemo(
    () => filteredVenues.find((v) => v.trainerAvailability) || filteredVenues[0] || null,
    [filteredVenues]
  );

  const availableCategories = Array.from(new Set(venues.map((v) => v.category)));
  const districtLabel =
    activeFilters.district !== 'All Districts' ? activeFilters.district : 'Ho Chi Minh City';

  const hasActiveFilters =
    activeFilters.category.length > 0 ||
    activeFilters.district !== 'All Districts' ||
    activeFilters.minRating > 0 ||
    activeFilters.trainerAvailability ||
    activeFilters.priceRange !== 'any' ||
    activeFilters.operatingHours !== 'any' ||
    sportFilter !== 'all' ||
    indoorOnly ||
    openNow ||
    topRated;

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const discountedPrice = bookingVenue ? Math.round(bookingVenue.pricePerHour * 0.9) : 0;
  const discountAmount = bookingVenue ? bookingVenue.pricePerHour - discountedPrice : 0;

  if (selectedVenue) {
    return (
      <VenueDetailPage
        key={selectedVenue.id}
        venue={selectedVenue}
        onBack={handleBackFromDetail}
      />
    );
  }

  return (
    <AppScreen className="min-w-0 bg-background">
      <div className={cn('mx-auto w-full max-w-6xl space-y-5 py-4 md:py-6', SCREEN_GUTTER, SCREEN_BOTTOM_SAFE)}>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courts, gyms, facilities…"
              aria-label="Search venues"
              className="pl-9 pr-9"
            />
            {searchQuery ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setIsFilterModalOpen(true)}>
              <MapPin className="size-4 text-primary" />
              <span className="max-w-[9rem] truncate">{districtLabel}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Filters"
              className={cn(hasActiveFilters && 'border-primary text-primary')}
              onClick={() => setIsFilterModalOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={!featuredVenue}
              onClick={() => featuredVenue && setBookingVenue(featuredVenue)}
            >
              <Calendar className="size-4" />
              Book Court
            </Button>
          </div>
        </div>

        {/* Title row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <button type="button" className="hover:text-primary" onClick={onBack}>
                RhinoFit
              </button>
              <span>/</span>
              <span className="font-medium text-foreground">Venues</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Facilities &amp; Courts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredVenues.length} verified {filteredVenues.length === 1 ? 'facility' : 'facilities'} in{' '}
              {districtLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={!listView}
                onClick={() => setListView(false)}
                className={cn(
                  'rounded-md p-1.5',
                  !listView ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={listView}
                onClick={() => setListView(true)}
                className={cn(
                  'rounded-md p-1.5',
                  listView ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="size-4" />
              </button>
            </div>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Sort venues"
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Sport chips */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <Chip active={sportFilter === 'all'} onClick={() => setSportFilter('all')}>
            All Sports
          </Chip>
          {availableCategories.map((cat) => (
            <Chip
              key={cat}
              active={sportFilter === cat}
              onClick={() => setSportFilter(sportFilter === cat ? 'all' : cat)}
            >
              {VENUE_CATEGORY_LABELS[cat as Venue['category']] || cat} ({categoryCounts.get(cat) || 0})
            </Chip>
          ))}
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2">
          <QuickToggle
            active={activeFilters.trainerAvailability}
            onClick={() =>
              setActiveFilters((f) => ({ ...f, trainerAvailability: !f.trainerAvailability }))
            }
            icon={Check}
            label="Trainers"
          />
          <QuickToggle active={indoorOnly} onClick={() => setIndoorOnly((v) => !v)} label="Indoor" />
          <QuickToggle active={openNow} onClick={() => setOpenNow((v) => !v)} label="Open now" />
          <QuickToggle active={topRated} onClick={() => setTopRated((v) => !v)} icon={Star} label="4.5+" />
          <QuickToggle
            active={rhinofitDeal}
            onClick={() => setRhinofitDeal((v) => !v)}
            icon={Percent}
            label="10% Off"
            accent
          />
        </div>

        {/* Featured */}
        {featuredVenue ? (
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid gap-0 md:grid-cols-[minmax(0,280px)_1fr]">
              <div className="relative aspect-[16/10] bg-muted md:aspect-auto md:min-h-[220px]">
                <img
                  src={featuredVenue.imageUrl}
                  alt={featuredVenue.name}
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-col justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                      {VENUE_CATEGORY_LABELS[featuredVenue.category]}
                    </span>
                    {featuredVenue.trainerAvailability ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                        Trainers available
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold">
                      <Star className="size-3.5 fill-amber-500 text-amber-500" />
                      {featuredVenue.rating.toFixed(1)}
                      <span className="font-normal text-muted-foreground">({featuredVenue.reviews})</span>
                    </span>
                  </div>
                  <h2 className="truncate text-xl font-bold tracking-tight text-foreground">
                    {featuredVenue.name}
                  </h2>
                  <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {featuredVenue.address}, {featuredVenue.district}
                    </span>
                  </p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{featuredVenue.description}</p>
                </div>
                <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[11px] text-muted-foreground">From</div>
                    <div className="text-lg font-bold tabular-nums text-foreground">
                      {formatVND(featuredVenue.pricePerHour)}
                      <span className="text-xs font-normal text-muted-foreground">/hr</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleSelectVenue(featuredVenue)}>
                      Details
                    </Button>
                    <Button type="button" size="sm" className="gap-1.5" onClick={() => setBookingVenue(featuredVenue)}>
                      <Calendar className="size-3.5" />
                      Book Court
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Grid */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight text-foreground">All facilities</h2>
          {filteredVenues.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No venues found"
              description="Try adjusting your filters or search query."
              action={
                hasActiveFilters ? (
                  <Button
                    onClick={() => {
                      handleResetFilters();
                      setSearchQuery('');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div
              className={cn(
                'grid gap-4',
                listView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
              )}
            >
              {filteredVenues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onSelect={() => handleSelectVenue(venue)}
                  onBook={() => setBookingVenue(venue)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Book drawer — overlays shell, does not shrink the page */}
      <Sheet open={!!bookingVenue} onOpenChange={(open) => !open && setBookingVenue(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          {bookingVenue ? (
            <>
              <SheetHeader className="border-b border-border px-5 py-4 text-left">
                <SheetTitle className="flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  Instant Court Booking
                </SheetTitle>
                <SheetDescription>
                  {bookingVenue.name} · {VENUE_CATEGORY_LABELS[bookingVenue.category]}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-4 px-5 py-4">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img src={bookingVenue.imageUrl} alt="" className="size-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{bookingVenue.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {bookingVenue.district} · {bookingVenue.address}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Available today</span>
                    <span className="font-semibold text-foreground">{todayLabel}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {SLOT_OPTIONS.map((slot) => {
                      const booked = slot === 'Booked';
                      const active = slot === selectedSlot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={booked}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            'rounded-lg px-2 py-2.5 text-xs font-medium transition-colors',
                            booked && 'cursor-not-allowed bg-muted text-muted-foreground',
                            !booked && active && 'bg-primary font-semibold text-primary-foreground',
                            !booked &&
                              !active &&
                              'border border-border bg-card text-foreground hover:border-primary'
                          )}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {rhinofitDeal ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="size-4" />
                      RhinoFit 10% perk
                    </span>
                    <span className="font-bold">−{formatVND(discountAmount)}</span>
                  </div>
                ) : null}

                <div className="mt-auto space-y-3 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total (1 hour)</span>
                    <div className="flex items-baseline gap-2">
                      {rhinofitDeal ? (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatVND(bookingVenue.pricePerHour)}
                        </span>
                      ) : null}
                      <span className="text-xl font-bold tabular-nums text-foreground">
                        {formatVND(rhinofitDeal ? discountedPrice : bookingVenue.pricePerHour)}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full gap-1.5"
                    onClick={() => {
                      const venue = bookingVenue;
                      setBookingVenue(null);
                      handleSelectVenue(venue);
                    }}
                  >
                    Proceed to Reservation
                    <ArrowRight className="size-4" />
                  </Button>
                </div>

                {bookingVenue.operatingHours[0] ? (
                  <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                    <div className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
                      <Clock className="size-3.5 text-primary" />
                      Hours
                    </div>
                    {bookingVenue.operatingHours.map((oh) => (
                      <div key={oh.day} className="flex justify-between gap-2 py-0.5">
                        <span>{oh.day}</span>
                        <span className="font-medium text-foreground">
                          {oh.open} – {oh.close}
                        </span>
                      </div>
                    ))}
                    {bookingVenue.phone ? (
                      <a
                        href={`tel:${bookingVenue.phone.replace(/\s/g, '')}`}
                        className="mt-2 inline-flex items-center gap-1 font-semibold text-primary"
                      >
                        <Phone className="size-3.5" />
                        {bookingVenue.phone}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <VenueFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        availableCategories={availableCategories}
      />
    </AppScreen>
  );
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'bg-foreground text-background'
          : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function QuickToggle({
  active,
  onClick,
  label,
  icon: Icon,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ElementType;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors',
        active && !accent && 'bg-primary/10 font-semibold text-primary',
        active &&
          accent &&
          'bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
        !active && 'border border-border bg-card text-muted-foreground hover:bg-muted'
      )}
    >
      {active && Icon ? <Icon className="size-3.5" /> : null}
      <span>{label}</span>
    </button>
  );
}

export default VenuesPage;
