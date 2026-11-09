import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { Trainer, Class, UserRole } from '../types';
import { CATEGORIES } from '../constants';
import ViewToggle from '../components/ViewToggle';
import CategoryFilters from '../components/CategoryFilters';
import {
  DiscoveryCoachCard,
  DiscoveryCoachListItem,
} from '../components/explore/ExploreDiscoveryCards';
import {
  DiscoveryFilterMobileTrigger,
  DiscoveryFilterPanel,
  DiscoveryFilterSidebar,
} from '../components/explore/DiscoveryFilterPanel';
import { BellRing, Loader, Search, X } from 'lucide-react';
import { AppScreen } from '@/src/components/layout/screen';
import { Badge } from '../src/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../src/components/ui/breadcrumb';
import { Button } from '../src/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '../src/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../src/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../src/components/ui/sheet';
import { APP_CONTENT } from '@/src/components/layout/shell';
import { cn } from '../src/lib/utils';
import { mapClassSchedule } from '@/src/lib/mapClassSchedule';
import TrainerCardSkeleton from '../components/TrainerCardSkeleton';
import {
  countDiscoveryFilters,
  EMPTY_DISCOVERY_FILTERS,
  trainerDistanceKm,
  trainerMatchesDiscoveryFilters,
  type DiscoveryFilters,
} from '@/src/lib/discovery-filters';
import {
  readDiscoveryFilters,
  writeDiscoveryFilters,
} from '@/src/lib/discovery-filter-storage';
import { formatDistance } from '@/src/lib/geo';
import { useDistanceUnit } from '@/src/hooks/useDistanceUnit';
import { useUserLocation } from '@/src/hooks/useUserLocation';
import { trackEvent } from '@/src/lib/analytics';
import { boostScore, fetchPromoted, saveSearch } from '@/src/lib/marketplace';
import { DiscoveryCollections } from '../components/explore/DiscoveryCollections';
import { DiscoveryEmptyState } from '../components/explore/DiscoveryEmptyState';
import { DistrictMap } from '../components/marketplace/DistrictMap';
import { useToast } from '@/src/hooks/use-toast';
import { requireAuth } from '@/src/lib/require-auth';

interface ExploreProps {
  onInitiateBooking?: (target: { trainer: Trainer; cls: Class }) => void;
  userRole?: UserRole;
  currentUserId?: string;
  favoriteTrainerIds?: string[];
  onToggleFavorite?: (trainerId: string) => void;
  onOpenReviewsModal?: (trainer: Trainer) => void;
}

const TRAINERS_PER_PAGE = 24;

const allCategories = [{ id: 'all', name: 'All', icon: 'grid' }, ...CATEGORIES];

// Helper function to transform class data
const transformClassData = (c: any): Class => ({
    id: c.id as any,
    name: c.name,
    language: (c as any).language || [],
    level: (c as any).level || '',
    description: c.description || '',
    duration: c.duration_minutes,
    price: Number(c.price),
    imageUrl: c.image_url || '',
    imageUrls: c.image_urls || [],
    capacity: c.capacity,
    classType: c.class_type as 'Indoor' | 'Outdoor' | 'Home',
    schedule: mapClassSchedule(c),
    bookings: [],
    kids_friendly: c.kids_friendly || false,
    disability_friendly: c.disability_friendly || false,
});

// Helper function to transform review data
const transformReviewData = (r: any) => ({
    reviewerName: (r.client as any)?.username || 'Anonymous',
    rating: r.rating,
    comment: r.comment || '',
    photos: r.photos || [],
    criteria: r.criteria || undefined,
    trainerReply: r.trainer_reply || undefined,
});

// Helper function to transform trainer data
const transformTrainerData = (profile: any, classes: any[], reviews: any[]): Trainer => {
    const lastSeenValue = profile.last_seen;
    
    return {
    id: profile.id,
    name: profile.username,
    specialty: profile.specialty || [],
    rating: Number(profile.rating) || 0,
    reviews: profile.reviews_count || 0,
    location: profile.location || '',
    price: Number(profile.price_per_hour) || 0,
    imageUrl: profile.avatar_url || '',
    verificationStatus: profile.is_verified ? 'verified' : 'unverified',
    isPremium: profile.is_premium || false,
    bio: profile.bio || '',
    shortDescription: profile.short_description || '',
    experienceYears: profile.experience_years || undefined,
    lastSeen: lastSeenValue ?? null,
    gender: profile.gender || undefined,
    responseTimeMs: profile.response_time_ms ?? undefined,
    acceptanceRate: profile.acceptance_rate != null ? Number(profile.acceptance_rate) : undefined,
    createdAt: profile.created_at ?? null,
    reviewsData: reviews
        .filter(r => r.trainer_id === profile.id)
        .map(transformReviewData),
    classes: classes
        .filter(c => c.trainer_id === profile.id)
        .map(transformClassData),
    chatHistory: [],
    };
};

const Explore: React.FC<ExploreProps> = ({
  onInitiateBooking,
  userRole = 'student',
  currentUserId = '',
  favoriteTrainerIds = [],
  onToggleFavorite,
  onOpenReviewsModal,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [displayedTrainers, setDisplayedTrainers] = useState<Trainer[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFromUrl);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [viewSurface, setViewSurface] = useState<'list' | 'map'>('list');
  const [promotedIds, setPromotedIds] = useState<string[]>([]);
  const [promotedWeight, setPromotedWeight] = useState<Record<string, number>>({});
  const [savingSearch, setSavingSearch] = useState(false);
  const [activeFilters, setActiveFilters] = useState<DiscoveryFilters>(() =>
    readDiscoveryFilters()
  );
  const { toast } = useToast();

  useEffect(() => {
    writeDiscoveryFilters(activeFilters);
    trackEvent('filter_apply', { filters: activeFilters, target: 'trainer' }, currentUserId);
  }, [activeFilters, currentUserId]);
  const { unit: distanceUnit, setUnit: setDistanceUnit } = useDistanceUnit(currentUserId);
  const { location: userLocation } = useUserLocation(currentUserId);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent('discover_view', { surface: 'explore' }, currentUserId);
    void (async () => {
      const { data } = await fetchPromoted('trainer');
      setPromotedIds(data.map((p) => p.target_id));
      const weights: Record<string, number> = {};
      for (const p of data) weights[p.target_id] = p.weight;
      setPromotedWeight(weights);
    })();
  }, [currentUserId]);

  // Update selectedCategory when URL parameter changes
  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory(null);
    }
  }, [categoryFromUrl]);

  useEffect(() => {
    loadTrainers();

    const classesChannel = supabase
      .channel('explore-classes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes'
        },
        () => {
          loadTrainers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(classesChannel);
    };
  }, []);

  const loadTrainers = async () => {
    try {
      setLoading(true);
      
      const { data: trainerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'trainer');

      if (rolesError) throw rolesError;

      const trainerIds = trainerRoles?.map(r => r.user_id) || [];

      if (trainerIds.length === 0) {
        setTrainers([]);
        setLoading(false);
        return;
      }

      const [profilesResult, classesResult, reviewsResult] = await Promise.all([
        supabase.from('profiles').select('*').in('id', trainerIds),
        supabase.from('classes').select('*').in('trainer_id', trainerIds),
        supabase.from('reviews').select(`
          *,
          client:profiles!reviews_client_id_fkey(username)`).in('trainer_id', trainerIds),
      ]);

      if (profilesResult.error) throw profilesResult.error;

      const profiles = profilesResult.data || [];
      const classes = classesResult.data || [];
      const reviews = reviewsResult.data || [];

      const trainersData: Trainer[] = profiles.map(profile => 
        transformTrainerData(profile, classes, reviews)
      );

      setTrainers(trainersData);
    } catch (error) {
      // Silently handle error - loading state will show empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!trainers || trainers.length === 0) {
      setFilteredTrainers([]);
      setDisplayedTrainers([]);
      setHasMore(false);
      return;
    }

    let filtered = trainers.filter((trainer) =>
      trainerMatchesDiscoveryFilters(trainer, activeFilters, {
        searchQuery,
        categoryId: selectedCategory,
        userLocation,
        distanceUnit,
      })
    );

    if (activeFilters.maxDistance != null && userLocation) {
      filtered = [...filtered].sort((a, b) => {
        const da = trainerDistanceKm(a, userLocation) ?? Number.POSITIVE_INFINITY;
        const db = trainerDistanceKm(b, userLocation) ?? Number.POSITIVE_INFINITY;
        return da - db;
      });
    }

    setFilteredTrainers(filtered);
    setDisplayedTrainers(filtered.slice(0, TRAINERS_PER_PAGE));
    setHasMore(filtered.length > TRAINERS_PER_PAGE);
  }, [trainers, selectedCategory, searchQuery, activeFilters, userLocation, distanceUnit]);

  const loadMoreTrainers = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setTimeout(() => {
      const nextPageStart = displayedTrainers.length;
      const nextPageEnd = nextPageStart + TRAINERS_PER_PAGE;
      const nextTrainers = filteredTrainers.slice(nextPageStart, nextPageEnd);
      
      setDisplayedTrainers(prev => [...prev, ...nextTrainers]);
      setHasMore(nextPageEnd < filteredTrainers.length);
      setLoadingMore(false);
    }, 300);
  }, [displayedTrainers.length, filteredTrainers, hasMore, loadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreTrainers();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loadMoreTrainers]);

  const handleResetFilters = () => {
    setActiveFilters(EMPTY_DISCOVERY_FILTERS);
  };

  /** Open coach in AppShell route — keeps top nav + footer, one document scroll. */
  const handleSelectTrainer = (trainer: Trainer) => {
    navigate(`/trainer/${encodeURIComponent(trainer.id)}`);
  };

  const activeFilterCount = countDiscoveryFilters(activeFilters);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (activeFilters.maxDistance != null) {
      chips.push({
        key: 'distance',
        label: `Within ${activeFilters.maxDistance}${distanceUnit}`,
        clear: () => setActiveFilters((prev) => ({ ...prev, maxDistance: null })),
      });
    }
    activeFilters.specialty.forEach((s) => {
      chips.push({
        key: `specialty:${s}`,
        label: s,
        clear: () =>
          setActiveFilters((prev) => ({
            ...prev,
            specialty: prev.specialty.filter((x) => x !== s),
          })),
      });
    });
    if (activeFilters.district !== 'All') {
      chips.push({
        key: 'district',
        label: activeFilters.district,
        clear: () => setActiveFilters((prev) => ({ ...prev, district: 'All' })),
      });
    }
    if (activeFilters.time !== 'any') {
      chips.push({
        key: 'time',
        label: activeFilters.time,
        clear: () => setActiveFilters((prev) => ({ ...prev, time: 'any' })),
      });
    }
    activeFilters.classType.forEach((t) => {
      chips.push({
        key: `class:${t}`,
        label: t,
        clear: () =>
          setActiveFilters((prev) => ({
            ...prev,
            classType: prev.classType.filter((x) => x !== t),
          })),
      });
    });
    activeFilters.languages.forEach((l) => {
      chips.push({
        key: `lang:${l}`,
        label: l,
        clear: () =>
          setActiveFilters((prev) => ({
            ...prev,
            languages: prev.languages.filter((x) => x !== l),
          })),
      });
    });
    if (activeFilters.level) {
      chips.push({
        key: 'level',
        label: activeFilters.level,
        clear: () => setActiveFilters((prev) => ({ ...prev, level: '' })),
      });
    }
    if (activeFilters.verified) {
      chips.push({
        key: 'verified',
        label: 'Verified',
        clear: () => setActiveFilters((prev) => ({ ...prev, verified: false })),
      });
    }
    if (activeFilters.topRated) {
      chips.push({
        key: 'topRated',
        label: 'Top rated',
        clear: () => setActiveFilters((prev) => ({ ...prev, topRated: false })),
      });
    }
    if (activeFilters.premiumOnly) {
      chips.push({
        key: 'premium',
        label: 'Coach Pro',
        clear: () => setActiveFilters((prev) => ({ ...prev, premiumOnly: false })),
      });
    }
    return chips;
  }, [activeFilters, distanceUnit]);

  const filterPanel = (
    <DiscoveryFilterPanel
      filters={activeFilters}
      onChange={setActiveFilters}
      target="trainer"
      distanceUnit={distanceUnit}
      onDistanceUnitChange={setDistanceUnit}
      userLocation={userLocation}
    />
  );

  const sortedDisplayed = React.useMemo(() => {
    const list = [...displayedTrainers];
    const scoreOf = (t: Trainer) =>
      boostScore({
        rating: t.rating,
        reviews: t.reviews,
        isPremium: t.isPremium,
        promotedWeight: promotedWeight[t.id] || 0,
        distanceKm: trainerDistanceKm(t, userLocation),
        createdAt: t.createdAt,
      });
    switch (sortBy) {
      case 'rating':
        return list.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'reviews':
        return list.sort((a, b) => b.reviews - a.reviews);
      case 'distance':
        return list.sort((a, b) => {
          const da = trainerDistanceKm(a, userLocation) ?? Number.POSITIVE_INFINITY;
          const db = trainerDistanceKm(b, userLocation) ?? Number.POSITIVE_INFINITY;
          return da - db;
        });
      default:
        return list.sort((a, b) => scoreOf(b) - scoreOf(a));
    }
  }, [displayedTrainers, sortBy, promotedWeight, userLocation]);

  const similarForEmpty = useMemo(() => {
    if (filteredTrainers.length > 0) return [];
    return [...trainers]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [filteredTrainers.length, trainers]);

  const handleSaveSearch = async () => {
    if (
      !requireAuth(currentUserId, navigate, {
        returnTo: '/explore',
        toast: (msg) => toast({ ...msg, variant: 'destructive' }),
      })
    ) {
      return;
    }
    setSavingSearch(true);
    try {
      const { error } = await saveSearch({
        userId: currentUserId,
        filters: activeFilters,
        target: 'trainer',
        notify: true,
      });
      if (error) throw error;
      trackEvent('saved_search_create', { target: 'trainer' }, currentUserId);
      toast({ title: 'Search saved', description: 'We’ll notify you when new coaches match.' });
    } catch (e) {
      toast({
        title: 'Could not save search',
        description: e instanceof Error ? e.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setSavingSearch(false);
    }
  };

  return (
    <AppScreen className="relative min-w-0 bg-muted/30">
      <div className={cn(APP_CONTENT, 'flex flex-col gap-8 py-6')}>
        {/* Discovery header */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="flex flex-col gap-2">
              <Breadcrumb>
                <BreadcrumbList className="text-[11px] font-semibold uppercase tracking-wide">
                  <BreadcrumbItem>
                    <span className="text-primary">Discover</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>/</BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-semibold uppercase text-muted-foreground">
                      Coaches
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[32px] md:leading-10">
                Find a coach
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Compare verified coaches nearby — specialty, price, rating, and availability in one
                dense list. Looking for sessions?{' '}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => navigate('/classes')}
                >
                  Browse classes
                </button>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]" aria-label="Sort coaches">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="rating">Highest rated</SelectItem>
                    <SelectItem value="reviews">Most reviews</SelectItem>
                    <SelectItem value="price-asc">Price: low to high</SelectItem>
                    <SelectItem value="price-desc">Price: high to low</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant={viewSurface === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewSurface((v) => (v === 'map' ? 'list' : 'map'))}
              >
                {viewSurface === 'map' ? 'List' : 'Map'}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <InputGroup className="h-11 flex-1 bg-card">
              <InputGroupAddon>
                <Search aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                placeholder="Search coaches by discipline, name, or credentials…"
                aria-label="Search trainers"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-sm"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery('')}
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
            <DiscoveryFilterMobileTrigger
              count={activeFilterCount}
              onClick={() => setMobileFiltersOpen(true)}
            />
          </div>

          <CategoryFilters
            categories={allCategories}
            selectedCategory={selectedCategory || 'all'}
            onSelectCategory={(categoryId) => {
              setSelectedCategory(categoryId);
              if (categoryId === 'all' || !categoryId) {
                navigate('/explore');
              } else {
                navigate(`/explore?category=${categoryId}`);
              }
            }}
          />

          {activeFilterChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <Badge key={chip.key} variant="secondary" className="gap-1 pr-1 capitalize">
                  {chip.label}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-5 rounded-full"
                    aria-label={`Remove ${chip.label} filter`}
                    onClick={chip.clear}
                  >
                    <X />
                  </Button>
                </Badge>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters}>
                Clear all
              </Button>
            </div>
          ) : null}
        </section>

        <div className="flex items-start gap-6">
          <DiscoveryFilterSidebar>{filterPanel}</DiscoveryFilterSidebar>

          <section className="flex min-w-0 flex-1 flex-col gap-4" aria-label="Coach results">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {loading
                    ? 'Loading coaches…'
                    : `${filteredTrainers.length} coach${filteredTrainers.length === 1 ? '' : 'es'}`}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {userLocation
                    ? `${userLocation} · distance in ${distanceUnit}`
                    : `Ho Chi Minh City · distance in ${distanceUnit}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={savingSearch || activeFilterCount === 0}
                  onClick={() => void handleSaveSearch()}
                >
                  <BellRing className="size-3.5" />
                  Notify me
                </Button>
                <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                <Badge variant="secondary">{viewMode === 'list' ? 'List' : 'Cards'}</Badge>
              </div>
            </div>

            {!loading && filteredTrainers.length > 0 && sortBy === 'recommended' ? (
              <DiscoveryCollections trainers={filteredTrainers} userLocation={userLocation} />
            ) : null}

            {loading ? (
              <div
                className={cn(
                  'grid gap-3',
                  viewMode === 'list'
                    ? 'grid-cols-1 xl:grid-cols-2'
                    : 'grid-cols-2 items-stretch gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3'
                )}
                aria-busy
              >
                {Array.from({ length: 9 }, (_, i) => (
                  <TrainerCardSkeleton key={i} />
                ))}
              </div>
            ) : sortedDisplayed.length === 0 ? (
              <DiscoveryEmptyState
                similar={similarForEmpty}
                onClear={() => {
                  handleResetFilters();
                  setSearchQuery('');
                }}
              />
            ) : viewSurface === 'map' ? (
              <DistrictMap
                pins={sortedDisplayed.map((t) => ({
                  id: t.id,
                  label: t.name,
                  location: t.location,
                }))}
                onSelect={(id) => {
                  const t = sortedDisplayed.find((x) => x.id === id);
                  if (t) handleSelectTrainer(t);
                }}
              />
            ) : viewMode === 'list' ? (
              <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
                {sortedDisplayed.map((trainer) => (
                  <DiscoveryCoachListItem
                    key={trainer.id}
                    trainer={trainer}
                    distanceLabel={formatDistance(
                      trainerDistanceKm(trainer, userLocation),
                      distanceUnit
                    )}
                    isFavorite={favoriteTrainerIds.includes(trainer.id)}
                    onToggleFavorite={onToggleFavorite}
                    onSelect={() => handleSelectTrainer(trainer)}
                    onBook={() => handleSelectTrainer(trainer)}
                    promoted={promotedIds.includes(trainer.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {sortedDisplayed.map((trainer) => (
                  <DiscoveryCoachCard
                    key={trainer.id}
                    trainer={trainer}
                    distanceLabel={formatDistance(
                      trainerDistanceKm(trainer, userLocation),
                      distanceUnit
                    )}
                    isFavorite={favoriteTrainerIds.includes(trainer.id)}
                    onToggleFavorite={onToggleFavorite}
                    onSelect={() => handleSelectTrainer(trainer)}
                    onBook={() => handleSelectTrainer(trainer)}
                    promoted={promotedIds.includes(trainer.id)}
                  />
                ))}
              </div>
            )}

            {hasMore ? (
              <div ref={observerTarget} className="flex items-center justify-center py-6">
                {loadingMore ? (
                  <div role="status" className="flex items-center gap-2 text-muted-foreground">
                    <Loader className="size-5 animate-spin" aria-hidden />
                    <span className="text-sm">Loading more coaches…</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!hasMore && displayedTrainers.length > 0 ? (
              <div className="mt-4 flex flex-col items-center border-t border-border py-8 text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  You&apos;ve seen all {displayedTrainers.length} coaches shown above
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button type="button" variant="outline" onClick={() => navigate('/classes')}>
                    Browse classes
                  </Button>
                  <Button type="button" onClick={() => navigate('/venues')}>
                    Browse venues
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[92dvh] flex-col gap-0 overflow-hidden rounded-t-2xl p-0"
        >
          <SheetHeader className="shrink-0 border-b border-border/80 p-4 text-left">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{filterPanel}</div>
          <SheetFooter className="shrink-0 border-t border-border/80 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button type="button" className="w-full" onClick={() => setMobileFiltersOpen(false)}>
              Show {filteredTrainers.length} coaches
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppScreen>
  );
};

export default Explore;
