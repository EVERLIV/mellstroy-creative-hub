import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../src/integrations/supabase/client';
import { Trainer, Class, UserRole, ClassType } from '../types';
import { CATEGORIES } from '../constants';
import TrainerGrid from '../components/TrainerGrid';
import ViewToggle from '../components/ViewToggle';
import TrainerDetailPage from '../components/TrainerDetailPage';
import CategoryFilters from '../components/CategoryFilters';
import FilterModal from '../components/FilterModal';
import { Search, SlidersHorizontal, Loader } from 'lucide-react';

interface ExploreProps {
  onInitiateBooking?: (target: { trainer: Trainer; cls: Class }) => void;
  userRole?: UserRole;
  currentUserId?: string;
  favoriteTrainerIds?: string[];
  onToggleFavorite?: (trainerId: string) => void;
  onOpenReviewsModal?: (trainer: Trainer) => void;
}

const TRAINERS_PER_PAGE = 15;

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
    
    // Debug: Log first trainer's last_seen value
    if (profile.id && !(window as any).__exploreDebugLogged) {
        console.log('[Explore] First trainer last_seen:', {
            trainerId: profile.id,
            trainerName: profile.username,
            raw: lastSeenValue,
            type: typeof lastSeenValue,
            isNull: lastSeenValue === null,
            isUndefined: lastSeenValue === undefined,
            isString: typeof lastSeenValue === 'string',
            afterNullishCoalescing: lastSeenValue ?? null,
            profileKeys: Object.keys(profile).filter(k => k.includes('last') || k.includes('seen'))
        });
        (window as any).__exploreDebugLogged = true;
    }
    
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
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [displayedTrainers, setDisplayedTrainers] = useState<Trainer[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isExitingDetail, setIsExitingDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
          client:profiles!reviews_client_id_fkey(username)
        `).in('trainer_id', trainerIds),
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
      console.error('Error loading trainers:', error);
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

    if (selectedCategory) {
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

  return (
    <div className="bg-gray-50 h-full relative">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 shadow-sm flex-shrink-0">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-base font-bold text-gray-900">Explore</h1>
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-5 h-5 text-gray-800" />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search trainers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 transition-all duration-200"
              />
            </div>

            {/* Category Filters */}
            <CategoryFilters
              categories={CATEGORIES}
              selectedCategory={selectedCategory || ''}
              onSelectCategory={setSelectedCategory}
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-medium text-gray-600">
                {filteredTrainers.length} {filteredTrainers.length === 1 ? 'trainer' : 'trainers'} found
              </h2>
              <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            </div>
            <TrainerGrid
              trainers={displayedTrainers}
              viewMode={viewMode}
              onSelectTrainer={handleSelectTrainer}
              isLoading={loading}
              favoriteTrainerIds={favoriteTrainerIds}
              onToggleFavorite={onToggleFavorite}
            />
            
            {/* Lazy Loading Trigger */}
            {hasMore && (
              <div ref={observerTarget} className="flex justify-center items-center py-6">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span className="text-xs">Loading more trainers...</span>
                  </div>
                )}
              </div>
            )}
            
            {!hasMore && displayedTrainers.length > 0 && (
              <div className="text-center py-6">
                <p className="text-xs text-gray-500">No more trainers to load</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trainer Detail Overlay */}
      {selectedTrainer && (
        <div className={`absolute inset-0 z-20 bg-white transition-all duration-300 ${
          isExitingDetail 
            ? 'translate-x-full opacity-0' 
            : 'translate-x-0 opacity-100'
        }`}>
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
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
};

export default Explore;
