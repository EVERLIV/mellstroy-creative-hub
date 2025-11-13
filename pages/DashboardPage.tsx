import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Dumbbell, Calendar, UtensilsCrossed, Sparkles, MapPin, Trophy, Users, TrendingUp, Heart, Crown, MessageCircle, FileText, ArrowRight, UserSearch, Plus } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import VenueSlider from '../components/VenueSlider';
import VenueDetailPage from './VenueDetailPage';
import VenueCard from '../components/VenueCard';
import RequestCard from '../components/RequestCard';
import PremiumDetailsModal from '../components/PremiumDetailsModal';
import { mockVenues } from '../data/mockVenues';
import { Venue, TrainingRequest, UserRole } from '../types';

interface DashboardPageProps {}

const DashboardPage: React.FC<DashboardPageProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [searchQuery, setSearchQuery] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  
  // Trainer-specific state
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Mock events data for testing
  const mockEvents = [
    {
      id: '1',
      title: 'Morning Yoga Session',
      description: 'Start your day with energizing yoga flow',
      date: '2025-11-15',
      location: 'Le Van Tam Park, District 1',
      image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    },
    {
      id: '2',
      title: 'CrossFit Community WOD',
      description: 'Join us for an intense group workout',
      date: '2025-11-18',
      location: 'District 2 Fitness Center',
      image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    },
    {
      id: '3',
      title: 'Sunset Running Club',
      description: '5K run along the riverside',
      date: '2025-11-20',
      location: 'Thu Thiem Park, District 2',
      image_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
    },
    {
      id: '4',
      title: 'Boxing Technique Workshop',
      description: 'Learn proper boxing fundamentals',
      date: '2025-11-22',
      location: 'Fight Club Gym, District 3',
      image_url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800',
    },
  ];

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!error && data) {
        setUserRole(data.role as UserRole);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  // Load requests for trainers
  useEffect(() => {
    if (userRole === 'trainer' && user) {
      loadRequests();
    }
  }, [userRole, user]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            organizer:profiles!events_organizer_id_fkey (username),
            interests:event_interests (count)
          `)
          .eq('status', 'approved')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(4);

        if (error) {
          // Fallback to mock data if fetch fails
          setUpcomingEvents(mockEvents);
        } else {
          setUpcomingEvents(data && data.length > 0 ? data : mockEvents);
        }
      } catch (error) {
        // Fallback to mock data on error
        setUpcomingEvents(mockEvents);
      } finally {
        setLoading(false);
      }
    };
    
    if (userRole === 'student') {
      fetchEvents();
    }
  }, [userRole]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      setRequestsLoading(true);

      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          student:profiles!requests_student_id_fkey(username, avatar_url)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);

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

      // Load responses count
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
      setRequestsLoading(false);
    }
  };

  // Helper to get Supabase storage URL for category icons
  const getCategoryIconUrl = (iconName: string) => {
    const supabaseUrl = supabase.storage.from('category-icons').getPublicUrl(iconName);
    return supabaseUrl.data.publicUrl;
  };

  const categories = [
    { 
      id: 'gym', 
      name: 'Gym', 
      icon: Dumbbell, 
      imageUrl: getCategoryIconUrl('gym.png'),
      color: 'from-orange-100 to-orange-50' 
    },
    { 
      id: 'yoga', 
      name: 'Yoga', 
      icon: Heart, 
      imageUrl: getCategoryIconUrl('yoga.png'),
      color: 'from-purple-100 to-purple-50' 
    },
    { 
      id: 'tennis', 
      name: 'Tennis', 
      icon: Trophy, 
      imageUrl: getCategoryIconUrl('tennis.png'),
      color: 'from-green-100 to-green-50' 
    },
    { 
      id: 'boxing', 
      name: 'Boxing', 
      icon: Trophy, 
      imageUrl: getCategoryIconUrl('boxing.png'),
      color: 'from-red-100 to-red-50' 
    },
    { 
      id: 'running', 
      name: 'Running', 
      icon: TrendingUp, 
      imageUrl: getCategoryIconUrl('running.png'),
      color: 'from-blue-100 to-blue-50' 
    },
    { 
      id: 'swimming', 
      name: 'Swimming', 
      icon: Users, 
      imageUrl: getCategoryIconUrl('swimming.png'),
      color: 'from-cyan-100 to-cyan-50' 
    },
    { 
      id: 'dance', 
      name: 'Dance', 
      icon: Sparkles, 
      imageUrl: getCategoryIconUrl('dance.png'),
      color: 'from-pink-100 to-pink-50' 
    },
    { 
      id: 'pickleball', 
      name: 'Pickleball', 
      icon: Trophy, 
      imageUrl: getCategoryIconUrl('pickleball.png'),
      color: 'from-yellow-100 to-yellow-50' 
    },
  ];

  const aiFeatures = [
    {
      id: 'meal-planner',
      title: 'AI Meal Planner',
      description: 'Get personalized meal plans tailored to your fitness goals',
      icon: UtensilsCrossed,
      gradient: 'from-emerald-500 to-teal-500',
      path: '/meal-planner',
      badge: 'Premium'
    },
    {
      id: 'ai-coach',
      title: 'AI Fitness Coach',
      description: '24/7 personal AI coach for workout advice and motivation',
      icon: Sparkles,
      gradient: 'from-orange-500 to-pink-500',
      path: '/ai-coach',
      badge: 'Premium'
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'all') {
      navigate('/explore');
    } else {
      navigate(`/explore?category=${categoryId}`);
    }
  };

  if (selectedVenue) {
    return (
      <div className="bg-white h-screen flex flex-col overflow-hidden">
        <VenueDetailPage 
          venue={selectedVenue}
          onBack={() => setSelectedVenue(null)}
        />
      </div>
    );
  }

  // Trainer Dashboard
  if (userRole === 'trainer') {
    return (
      <div className="bg-gray-50 h-full overflow-y-auto pb-safe-nav">
        {/* Simple Header for Trainers */}
        <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 px-4 py-3">
          <h1 className="text-base font-bold text-gray-900">Dashboard</h1>
        </div>
        
        <div className="px-4 py-3">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-4 mt-4">
            <button
              onClick={() => navigate('/bookings')}
              className="bg-white rounded-lg p-4 shadow-sm hover:bg-gray-100 transition-colors text-left"
            >
              <Calendar className="w-6 h-6 text-[#FF6B35] mb-2" />
              <div className="text-xs font-bold text-gray-900">My Bookings</div>
              <div className="text-xs text-gray-600 mt-1">View all bookings</div>
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="bg-white rounded-lg p-4 shadow-sm hover:bg-gray-100 transition-colors text-left"
            >
              <MessageCircle className="w-6 h-6 text-[#FF6B35] mb-2" />
              <div className="text-xs font-bold text-gray-900">Messages</div>
              <div className="text-xs text-gray-600 mt-1">Chat with clients</div>
            </button>
          </div>

          {/* Recent Training Requests Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Recent Requests</h2>
              <button
                onClick={() => navigate('/requests/explore')}
                className="text-xs font-semibold text-[#FF6B35] flex items-center gap-1"
              >
                Explore All
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {requestsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-3 shadow-sm animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-2">No open requests</p>
                <button
                  onClick={() => navigate('/requests/explore')}
                  className="text-xs font-semibold text-[#FF6B35] hover:text-orange-600"
                >
                  Explore Requests
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
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
            )}
          </div>

          {/* Venues Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Venues for Rent</h2>
              <button
                onClick={() => navigate('/venues')}
                className="text-xs font-semibold text-[#FF6B35] flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {mockVenues.slice(0, 3).map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onSelect={() => navigate('/venues')}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard (existing code)
  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-orange-500 to-pink-500 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Welcome to RhinoFit!</h1>
            <p className="text-white/90 text-sm mt-1">Find your perfect trainer today</p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trainers, classes, or locations..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
            />
          </form>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="px-4 -mt-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 p-4">
          <h2 className="font-bold text-slate-900 text-base mb-4">Categories</h2>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  {category.imageUrl ? (
                    <div className="relative w-[70px] h-[70px] flex items-center justify-center p-1.5 bg-white rounded-xl overflow-hidden">
                      <img 
                        src={category.imageUrl} 
                        alt={category.name}
                        className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 transition-colors duration-200 rounded-xl"></div>
                      {category.id === 'gym' && (
                        <div className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[8px] font-semibold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap">
                          Popular
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-[70px] h-[70px] flex items-center justify-center rounded-xl bg-slate-100 overflow-hidden">
                      <IconComponent className="w-8 h-8 text-slate-700" />
                      <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 transition-colors duration-200"></div>
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-700 text-center">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Request CTA */}
      <div className="px-4 mb-6">
        <div 
          className="rounded-2xl p-5 shadow-lg bg-gradient-to-br from-orange-500 via-orange-600 to-pink-500 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
                <UserSearch className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base mb-1 drop-shadow-lg">Looking for a Trainer?</h3>
                <p className="text-white/90 text-xs mb-4 drop-shadow-md leading-relaxed">
                  Create a request and let trainers find you! Specify your needs, budget, and location.
                </p>
                <button
                  onClick={() => navigate('/requests/create')}
                  className="bg-white text-orange-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Premium Features */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-slate-900 text-base">RhinoFit Premium</h2>
          <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">New</span>
        </div>
        <div className="space-y-3">
          {aiFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => navigate(feature.path)}
                className="w-full bg-white rounded-2xl shadow-md shadow-slate-200/60 p-4 flex items-center gap-4 hover:shadow-lg transition-all duration-200"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <IconComponent className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-sm">{feature.title}</h3>
                    <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                      {feature.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{feature.description}</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-600 text-sm">›</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events - Compact Carousel */}
      {!loading && upcomingEvents.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3 px-4">
            <h2 className="font-bold text-slate-900 text-base">Upcoming Events</h2>
            <button
              onClick={() => navigate('/events')}
              className="text-xs font-semibold text-[#FF6B35] hover:text-orange-600 transition-colors"
            >
              See All
            </button>
          </div>
          <div className="overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="flex gap-2 hide-scrollbar" style={{ width: 'max-content' }}>
              {upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => navigate('/events', { state: { selectedEvent: event } })}
                  className="bg-white rounded-xl shadow-md shadow-slate-200/60 overflow-hidden hover:shadow-lg transition-all duration-200"
                  style={{ width: '140px', flexShrink: 0 }}
                >
                  <div className="relative h-20">
                    <img
                      src={event.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 bg-white shadow-sm px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5 text-[#FF6B35]" />
                      <span className="text-[10px] font-semibold text-slate-700">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-slate-900 text-xs mb-1 line-clamp-2">{event.title}</h3>
                    <div className="flex items-center gap-0.5 text-[10px] text-slate-500">
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sports Venues Slider */}
      {mockVenues.length > 0 && (
        <div className="mb-6">
          <VenueSlider 
            venues={mockVenues}
            onSelectVenue={(venue) => setSelectedVenue(venue)}
            onViewAll={() => navigate('/venues')}
          />
        </div>
      )}

      {/* Premium Banner */}
      <div className="px-4 mb-6">
        <div 
          className="rounded-2xl p-6 shadow-lg bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-6 h-6 text-white" />
              <h3 className="font-bold text-white text-lg drop-shadow-lg">Get Your Premium</h3>
            </div>
            <p className="text-white text-sm mb-4 drop-shadow-md">Unlock exclusive features, discounts, and unlimited bookings!</p>
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className="bg-white text-orange-600 font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              View Premium Benefits
            </button>
          </div>
        </div>
      </div>

      <PremiumDetailsModal 
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
