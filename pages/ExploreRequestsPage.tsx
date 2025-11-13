import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { TrainingRequest } from '../types';
import { CATEGORIES } from '../constants';
import RequestCard from '../components/RequestCard';
import FilterModal from '../components/FilterModal';
import { Search, SlidersHorizontal, Loader } from 'lucide-react';

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
          student:profiles!requests_student_id_fkey(username, avatar_url)
        `)
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

  return (
    <div className="bg-gray-50 h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="px-4 py-3">
          {/* Page Title */}
          <h1 className="text-base font-bold text-gray-900 mb-3">Explore Requests</h1>
          
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-sm text-gray-900"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Filter Button */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-[#FF6B35] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-[#FF6B35] hover:text-orange-600"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 pb-safe-nav">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 text-gray-800 animate-spin" />
          </div>
        ) : displayedRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-bold text-gray-900 mb-2">No requests found</p>
            <p className="text-xs text-gray-600 mb-4">
              {activeFilterCount > 0 || searchQuery
                ? 'Try adjusting your filters or search query'
                : 'No open training requests available'}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[#FF6B35] text-white text-xs font-semibold rounded-lg hover:bg-orange-600 active:scale-95 transition-all duration-200"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-3">
              <p className="text-xs text-gray-600">
                {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} found
              </p>
            </div>
            <div className="space-y-3">
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
                {loadingMore && <Loader className="w-5 h-5 text-gray-800 animate-spin" />}
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Modal */}
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
    </div>
  );
};

export default ExploreRequestsPage;

