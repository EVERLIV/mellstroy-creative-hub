import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { TrainingRequest } from '../types';
import { CATEGORIES } from '../constants';
import RequestCard from '../components/RequestCard';
import FilterModal from '../components/FilterModal';
import { Search, SlidersHorizontal, Loader2, FileSearch } from 'lucide-react';
import { AppScreen } from '@/src/components/layout/screen';
import { StitchCanvas, StitchPageHeader, StitchPanel } from '@/src/components/layout/stitch-page';
import { PageLoader, EmptyState } from '../src/components/layout/states';
import { Input } from '../src/components/ui/input';
import { Button } from '../src/components/ui/button';
import { cn } from '../src/lib/utils';

const REQUESTS_PER_PAGE = 15;

const ExploreRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TrainingRequest[]>([]);
  const [displayedRequests, setDisplayedRequests] = useState<TrainingRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    category: [] as string[],
    district: 'All',
    level: '' as string,
    priceRange: 'any' as 'any' | 'low' | 'medium' | 'high',
  });
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRequests();

    const requestsChannel = supabase
      .channel('explore-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests'
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
    };
  }, []);

  const loadRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          student:profiles!requests_student_id_fkey(username, avatar_url)`)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedRequests: TrainingRequest[] = (data || []).map((req: any) => {
        return {
          id: req.id,
          student_id: req.student_id,
          student_name: req.student?.username,
          student_avatar: req.student?.avatar_url,
          category: req.category,
          district: req.district,
          description: req.description,
          desired_price: parseFloat(req.desired_price),
          level: req.level,
          preferred_time: req.preferred_time,
          location_type: req.location_type,
          status: req.status,
          created_at: req.created_at,
          updated_at: req.updated_at,
        };
      });

      // Load responses count for each request
      const requestsWithCounts = await Promise.all(
        transformedRequests.map(async (req) => {
          const { count } = await supabase
            .from('trainer_responses')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', req.id)
            .eq('trainer_id', user.id);

          return {
            ...req,
            responses_count: count || 0
          };
        })
      );

      setRequests(requestsWithCounts);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!requests || requests.length === 0) {
      setFilteredRequests([]);
      setDisplayedRequests([]);
      setHasMore(false);
      return;
    }

    let filtered = [...requests];

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(req => req.category === selectedCategory);
    }

    // Active filters
    if (activeFilters.category.length > 0) {
      filtered = filtered.filter(req => 
        activeFilters.category.includes(req.category)
      );
    }

    if (activeFilters.district !== 'All') {
      filtered = filtered.filter(req => req.district === activeFilters.district);
    }

    if (activeFilters.level) {
      filtered = filtered.filter(req => req.level === activeFilters.level);
    }

    if (activeFilters.priceRange !== 'any') {
      filtered = filtered.filter(req => {
        const price = req.desired_price;
        if (activeFilters.priceRange === 'low') {
          return price < 200000;
        } else if (activeFilters.priceRange === 'medium') {
          return price >= 200000 && price <= 400000;
        } else if (activeFilters.priceRange === 'high') {
          return price > 400000;
        }
        return true;
      });
    }

    // Search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(req =>
        (req.description && req.description.toLowerCase().includes(query)) ||
        (req.category && req.category.toLowerCase().includes(query)) ||
        (req.district && req.district.toLowerCase().includes(query)) ||
        (req.student_name && req.student_name.toLowerCase().includes(query))
      );
    }

    setFilteredRequests(filtered);
    setDisplayedRequests(filtered.slice(0, REQUESTS_PER_PAGE));
    setHasMore(filtered.length > REQUESTS_PER_PAGE);
  }, [requests, selectedCategory, searchQuery, activeFilters]);

  const loadMoreRequests = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setTimeout(() => {
      const nextPageStart = displayedRequests.length;
      const nextPageEnd = nextPageStart + REQUESTS_PER_PAGE;
      const nextRequests = filteredRequests.slice(nextPageStart, nextPageEnd);
      
      setDisplayedRequests(prev => [...prev, ...nextRequests]);
      setHasMore(nextPageEnd < filteredRequests.length);
      setLoadingMore(false);
    }, 300);
  }, [displayedRequests.length, filteredRequests, hasMore, loadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreRequests();
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
  }, [hasMore, loadingMore, loadMoreRequests]);

  const handleApplyFilters = (newFilters: any) => {
    setActiveFilters({
      category: newFilters.specialty || [],
      district: newFilters.district || 'All',
      level: newFilters.level || '',
      priceRange: 'any',
    });
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setActiveFilters({
      category: [],
      district: 'All',
      level: '',
      priceRange: 'any',
    });
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const activeFilterCount = 
    (activeFilters.category.length > 0 ? 1 : 0) +
    (activeFilters.district !== 'All' ? 1 : 0) +
    (activeFilters.level ? 1 : 0) +
    (activeFilters.priceRange !== 'any' ? 1 : 0);

  const categoryChips: ReadonlyArray<{ id: string | null; name: string }> = [
    { id: null, name: 'All' },
    ...CATEGORIES.map((cat) => ({ id: cat.id, name: cat.name })),
  ];

  return (
    <AppScreen className="min-w-0 bg-[#f9fafb] dark:bg-background">
      <StitchCanvas>
        <StitchPageHeader title="Explore requests" description="Students looking for a trainer right now.">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:max-w-xl">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search requests..."
                aria-label="Search requests"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl bg-card pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => setIsFilterModalOpen(true)} className="h-11 shrink-0 gap-2 rounded-xl">
              <SlidersHorizontal />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#fd651e] px-1 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={handleResetFilters} className="h-11 shrink-0 text-[#fd651e] hover:text-[#a73a00]">
                Reset
              </Button>
            )}
          </div>

          <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
            {categoryChips.map((chip) => {
              const isActive = selectedCategory === chip.id;
              return (
                <button
                  key={chip.id ?? 'all'}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelectedCategory(chip.id)}
                  className={cn(
                    'h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm',
                    isActive
                      ? 'bg-[#fd651e] text-white shadow-sm hover:bg-[#a73a00]'
                      : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {chip.name}
                </button>
              );
            })}
          </div>
        </StitchPageHeader>

        {loading ? (
          <PageLoader title="Loading requests..." className="min-h-[40vh]" />
        ) : displayedRequests.length === 0 ? (
          <StitchPanel className="p-4 md:p-6">
            <EmptyState
              icon={FileSearch}
              title="No requests found"
              description={
                activeFilterCount > 0 || searchQuery
                  ? 'Try adjusting your filters or search query'
                  : 'No open training requests available'
              }
              action={
                activeFilterCount > 0 && (
                  <Button onClick={handleResetFilters} className="bg-[#fd651e] text-white hover:bg-[#a73a00]">
                    Reset Filters
                  </Button>
                )
              }
            />
          </StitchPanel>
        ) : (
          <StitchPanel className="p-4 md:p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground md:text-lg">Open requests</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {`${filteredRequests.length} ${filteredRequests.length === 1 ? 'request' : 'requests'} found`}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {displayedRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  userRole="trainer"
                  currentUserId={user?.id || ''}
                  onRespond={(req) => navigate(`/requests/${req.id}/respond`, { state: { request: req } })}
                  onClick={() => navigate(`/requests/${request.id}/respond`, { state: { request } })}
                />
              ))}
            </div>
            {hasMore && (
              <div ref={observerTarget} className="flex items-center justify-center py-4">
                {loadingMore && <Loader2 className="size-5 animate-spin text-[#fd651e]" aria-label="Loading more" />}
              </div>
            )}
          </StitchPanel>
        )}
      </StitchCanvas>      {/* Filter Modal */}
      {isFilterModalOpen && (
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={handleApplyFilters}
          activeFilters={{
            specialty: activeFilters.category,
            district: activeFilters.district,
            level: activeFilters.level,
            verified: false,
            topRated: false,
            premiumOnly: false,
            time: 'any',
            classType: [],
            languages: [],
          }}
        />
      )}
    </AppScreen>
  );
};

export default ExploreRequestsPage;

