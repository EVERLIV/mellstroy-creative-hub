import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { Trainer, Class, UserRole, ClassType } from '../types';
import { CATEGORIES } from '../constants';
import ViewToggle from '../components/ViewToggle';
import TrainerDetailPage from '../components/TrainerDetailPage';
import CategoryFilters from '../components/CategoryFilters';
import FilterModal from '../components/FilterModal';
import {
  DiscoveryCoachCard,
  DiscoveryCoachListItem,
} from '../components/explore/ExploreDiscoveryCards';
import { Loader, Search, SlidersHorizontal, X } from 'lucide-react';
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '../src/components/ui/empty';
import { APP_CONTENT } from '@/src/components/layout/shell';
import { cn } from '../src/lib/utils';
import TrainerCardSkeleton from '../components/TrainerCardSkeleton';

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
    schedule: c.schedule_days && c.schedule_time ? {
        days: c.schedule_days,
        time: c.schedule_time
    } : undefined,
    bookings: [],
    kids_friendly: c.kids_friendly || false,
    disability_friendly: c.disability_friendly || false,
});

// Helper function to transform review data
const transformReviewData = (r: any) => ({
    reviewerName: (r.client as any)?.username || 'Anonymous',
    rating: r.rating,
    comment: r.comment || '',
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
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isExitingDetail, setIsExitingDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFromUrl);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [activeFilters, setActiveFilters] = useState({
    specialty: [] as string[],
    verified: false,
    topRated: false,
    premiumOnly: false,
    district: 'All',
    time: 'any' as 'any' | 'morning' | 'afternoon' | 'evening',
    classType: [] as ClassType[],
    languages: [] as string[],
    level: '',
  });
  const observerTarget = useRef<HTMLDivElement>(null);

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

    let filtered = [...trainers];

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(trainer => 
        trainer?.specialty && Array.isArray(trainer.specialty) && trainer.specialty.includes(selectedCategory)
      );
    }

    if (activeFilters?.specialty && activeFilters.specialty.length > 0) {
      filtered = filtered.filter(trainer =>
        trainer?.specialty && Array.isArray(trainer.specialty) && 
        activeFilters.specialty.some(s => trainer.specialty.includes(s))
      );
    }

    if (activeFilters?.district && activeFilters.district !== 'All') {
      filtered = filtered.filter(trainer =>
        trainer?.location && trainer.location.includes(activeFilters.district)
      );
    }

    if (activeFilters?.verified) {
      filtered = filtered.filter(trainer => trainer?.verificationStatus === 'verified');
    }

    if (activeFilters?.topRated) {
      filtered = filtered.filter(trainer => trainer?.rating && trainer.rating >= 4.8);
    }

    if (activeFilters?.premiumOnly) {
      filtered = filtered.filter(trainer => trainer?.isPremium === true);
    }

    if (activeFilters?.languages && activeFilters.languages.length > 0) {
      filtered = filtered.filter(trainer =>
        trainer?.classes && trainer.classes.some(cls =>
          (cls as any).language && Array.isArray((cls as any).language) &&
          activeFilters.languages.some(lang => (cls as any).language.includes(lang))
        )
      );
    }

    if (activeFilters?.level && activeFilters.level !== '') {
      filtered = filtered.filter(trainer =>
        trainer?.classes && trainer.classes.some(cls =>
          (cls as any).level && (cls as any).level === activeFilters.level
        )
      );
    }

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(trainer =>
        (trainer?.name && trainer.name.toLowerCase().includes(query)) ||
        (trainer?.location && trainer.location.toLowerCase().includes(query)) ||
        (trainer?.specialty && Array.isArray(trainer.specialty) && 
         trainer.specialty.some(s => s && s.toLowerCase().includes(query)))
      );
    }

    setFilteredTrainers(filtered);
    // Reset pagination when filters change
    setDisplayedTrainers(filtered.slice(0, TRAINERS_PER_PAGE));
    setHasMore(filtered.length > TRAINERS_PER_PAGE);
  }, [trainers, selectedCategory, searchQuery, activeFilters]);

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

  const handleApplyFilters = (newFilters: typeof activeFilters) => {
    setActiveFilters(newFilters);
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setActiveFilters({
      specialty: [],
      verified: false,
      topRated: false,
      premiumOnly: false,
      district: 'All',
      time: 'any',
      classType: [],
      languages: [],
      level: '',
    });
  };

  const handleSelectTrainer = (trainer: Trainer) => {
    setIsExitingDetail(false);
    setSelectedTrainer(trainer);
    window.scrollTo(0, 0);
  };

  const handleBackFromDetail = () => {
    setIsExitingDetail(true);
    setTimeout(() => {
      setSelectedTrainer(null);
      setIsExitingDetail(false);
    }, 300);
  };

  const activeFilterCount =
    activeFilters.specialty.length +
    activeFilters.classType.length +
    activeFilters.languages.length +
    (activeFilters.district !== 'All' ? 1 : 0) +
    (activeFilters.time !== 'any' ? 1 : 0) +
    (activeFilters.level ? 1 : 0) +
    (activeFilters.verified ? 1 : 0) +
    (activeFilters.topRated ? 1 : 0) +
    (activeFilters.premiumOnly ? 1 : 0);

  const activeFilterChips = React.useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
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
        label: 'Premium',
        clear: () => setActiveFilters((prev) => ({ ...prev, premiumOnly: false })),
      });
    }
    return chips;
  }, [activeFilters]);

  const sortedDisplayed = React.useMemo(() => {
    const list = [...displayedTrainers];
    switch (sortBy) {
      case 'rating':
        return list.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'reviews':
        return list.sort((a, b) => b.reviews - a.reviews);
      default:
        return list;
    }
  }, [displayedTrainers, sortBy]);

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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]" aria-label="Sort coaches">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="reviews">Most reviews</SelectItem>
                  <SelectItem value="price-asc">Price: low to high</SelectItem>
                  <SelectItem value="price-desc">Price: high to low</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
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
            <Button
              type="button"
              variant="outline"
              className="relative h-11 gap-2 bg-card px-4"
              onClick={() => setIsFilterModalOpen(true)}
              aria-label={
                activeFilterCount
                  ? `Open filters (${activeFilterCount} active)`
                  : 'Open filters'
              }
            >
              <SlidersHorizontal className="text-primary" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 ? (
                <Badge className="absolute -right-2 -top-2 size-5 justify-center rounded-full p-0 text-[10px]">
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
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

        {/* Results — single view system (grid | list) */}
        <section className="flex flex-col gap-4" aria-label="Coach results">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {loading
                  ? 'Loading coaches…'
                  : `${filteredTrainers.length} coach${filteredTrainers.length === 1 ? '' : 'es'}`}
              </h2>
              <p className="text-xs text-muted-foreground">Ho Chi Minh City · denser results for faster comparison</p>
            </div>
            <div className="flex items-center gap-2">
              <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
              <Badge variant="secondary">{viewMode === 'list' ? 'List' : 'Cards'}</Badge>
            </div>
          </div>

          {loading ? (
            <div
              className={cn(
                'grid gap-3',
                viewMode === 'list'
                  ? 'grid-cols-1 lg:grid-cols-2'
                  : 'grid-cols-2 items-stretch sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              )}
              aria-busy
            >
              {Array.from({ length: 10 }, (_, i) => (
                <TrainerCardSkeleton key={i} />
              ))}
            </div>
          ) : sortedDisplayed.length === 0 ? (
            <Empty className="border border-dashed bg-card">
              <EmptyHeader>
                <EmptyTitle>No coaches found</EmptyTitle>
                <EmptyDescription>
                  Try adjusting your filters or search to see more coaches nearby.
                </EmptyDescription>
              </EmptyHeader>
              {activeFilterCount > 0 || searchQuery ? (
                <EmptyContent>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleResetFilters();
                      setSearchQuery('');
                    }}
                  >
                    Clear filters
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : viewMode === 'list' ? (
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {sortedDisplayed.map((trainer) => (
                <DiscoveryCoachListItem
                  key={trainer.id}
                  trainer={trainer}
                  isFavorite={favoriteTrainerIds.includes(trainer.id)}
                  onToggleFavorite={onToggleFavorite}
                  onSelect={() => handleSelectTrainer(trainer)}
                  onBook={() => handleSelectTrainer(trainer)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {sortedDisplayed.map((trainer) => (
                <DiscoveryCoachCard
                  key={trainer.id}
                  trainer={trainer}
                  isFavorite={favoriteTrainerIds.includes(trainer.id)}
                  onToggleFavorite={onToggleFavorite}
                  onSelect={() => handleSelectTrainer(trainer)}
                  onBook={() => handleSelectTrainer(trainer)}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/classes')}
                >
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

      {selectedTrainer ? (
        <div
          className={cn(
            'fixed inset-0 z-50 overflow-y-auto bg-background transition-all duration-300 md:absolute',
            isExitingDetail ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          )}
        >
          <TrainerDetailPage
            trainer={selectedTrainer}
            onBack={handleBackFromDetail}
            onInitiateBooking={onInitiateBooking}
            userRole={userRole}
            currentUserId={currentUserId}
            isFavorite={favoriteTrainerIds.includes(selectedTrainer.id)}
            onToggleFavorite={onToggleFavorite}
            onOpenReviewsModal={onOpenReviewsModal}
          />
        </div>
      ) : null}

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />
    </AppScreen>
  );
};

export default Explore;
