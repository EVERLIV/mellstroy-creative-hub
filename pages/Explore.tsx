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
  SpotlightClassCard,
  SpotlightCoachCard,
} from '../components/explore/ExploreDiscoveryCards';
import type { ClassWithTrainer } from '../components/ClassCarousel';
import { ChevronDown, Loader, Search, SlidersHorizontal } from 'lucide-react';
import { AppScreen } from '@/src/components/layout/screen';
import { Button } from '../src/components/ui/button';
import { Input } from '../src/components/ui/input';
import { APP_CONTENT } from '@/src/components/layout/shell';
import { cn } from '../src/lib/utils';
import TrainerListItem from '../components/TrainerListItem';
import TrainerCardSkeleton from '../components/TrainerCardSkeleton';

interface ExploreProps {
  onInitiateBooking?: (target: { trainer: Trainer; cls: Class }) => void;
  userRole?: UserRole;
  currentUserId?: string;
  favoriteTrainerIds?: string[];
  onToggleFavorite?: (trainerId: string) => void;
  onOpenReviewsModal?: (trainer: Trainer) => void;
}

const TRAINERS_PER_PAGE = 15;

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

  const featuredClasses = React.useMemo(() => {
    const entries: ClassWithTrainer[] = [];
    for (const trainer of filteredTrainers) {
      for (const cls of trainer.classes ?? []) {
        entries.push({ trainer, cls });
        if (entries.length >= 10) return entries;
      }
    }
    return entries;
  }, [filteredTrainers]);

  const featuredTrainers = React.useMemo(
    () => filteredTrainers.filter((t) => t.isPremium || t.rating >= 4.5).slice(0, 6),
    [filteredTrainers]
  );

  const popularClasses = React.useMemo(
    () => featuredClasses.slice(0, 6),
    [featuredClasses]
  );

  return (
    <AppScreen className="relative min-w-0 bg-[#f9fafb] dark:bg-background">
      <div className={cn(APP_CONTENT, 'space-y-8 py-6')}>
        {/* Discovery header */}
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#fd651e]">
                <span>DISCOVER</span>
                <span>/</span>
                <span className="text-muted-foreground">COACHES &amp; PROGRAMS</span>
              </div>
              <h1 className="text-[32px] font-bold leading-10 tracking-tight text-foreground">
                Coaches
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Discover top verified fitness, combat, tennis, and yoga coaches near you in Ho Chi
                Minh City
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
              >
                <span className="font-normal text-muted-foreground">Sort:</span>
                <span>Recommended</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search coaches by discipline, name, or credentials…"
                aria-label="Search trainers"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl border-border bg-card pl-10 shadow-sm"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFilterModalOpen(true)}
              aria-label={
                activeFilterCount
                  ? `Open filters (${activeFilterCount} active)`
                  : 'Open filters'
              }
              className="relative h-11 gap-2 rounded-xl border-border bg-card px-4 shadow-sm"
            >
              <SlidersHorizontal className="size-5 text-primary" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
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
        </section>

        {/* Featured coaches */}
        {!loading && featuredTrainers.length > 0 ? (
          <section className="space-y-3" aria-label="Featured coaches">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Spotlight
                </span>
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  Featured Coaches
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
              {featuredTrainers.map((trainer) => (
                <SpotlightCoachCard
                  key={trainer.id}
                  trainer={trainer}
                  isFavorite={favoriteTrainerIds.includes(trainer.id)}
                  onToggleFavorite={onToggleFavorite}
                  onSelect={() => handleSelectTrainer(trainer)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Popular classes */}
        {!loading && popularClasses.length > 0 ? (
          <section className="space-y-3" aria-label="Popular classes">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Nearby
                </span>
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  Popular Classes
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
              {popularClasses.map(({ cls, trainer }) => (
                <SpotlightClassCard
                  key={`${trainer.id}:${cls.id}`}
                  cls={cls}
                  trainer={trainer}
                  onSelect={() => navigate(`/class/${cls.id}`)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* All coaches */}
        <section className="space-y-4 pt-2" aria-label="All coaches">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">All Coaches</h2>
              <p className="text-xs text-muted-foreground">
                {loading
                  ? 'Loading…'
                  : `${filteredTrainers.length} coach${filteredTrainers.length === 1 ? '' : 'es'} available in District 1 & surrounding areas`}
              </p>
            </div>
            <span className="rounded-full bg-[#e9edff] px-3 py-1 text-[11px] font-bold text-primary">
              Ho Chi Minh City
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" aria-busy>
              {Array.from({ length: 8 }, (_, i) => (
                <TrainerCardSkeleton key={i} />
              ))}
            </div>
          ) : displayedTrainers.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-2 text-sm text-muted-foreground">No coaches found</p>
              <p className="text-xs text-muted-foreground/80">Try adjusting your filters</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {displayedTrainers.map((trainer) => (
                <TrainerListItem
                  key={trainer.id}
                  trainer={trainer}
                  onSelect={() => handleSelectTrainer(trainer)}
                  isFavorite={favoriteTrainerIds.includes(trainer.id)}
                  onToggleFavorite={onToggleFavorite ?? (() => undefined)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {displayedTrainers.map((trainer) => (
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
                  className="rounded-lg shadow-sm"
                  onClick={() => {
                    handleResetFilters();
                    setSelectedCategory(null);
                    navigate('/explore');
                  }}
                >
                  Explore All Sports
                </Button>
                <Button
                  type="button"
                  className="rounded-lg bg-primary shadow-sm"
                  onClick={() => navigate('/venues')}
                >
                  Browse Venues
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
