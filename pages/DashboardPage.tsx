import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Dumbbell, Calendar, UtensilsCrossed, Sparkles, MapPin, Trophy, Users, TrendingUp, Heart, Crown } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import VenueSlider from '../components/VenueSlider';
import VenueDetailPage from './VenueDetailPage';
import PremiumDetailsModal from '../components/PremiumDetailsModal';
import { mockVenues } from '../data/mockVenues';
import { Venue } from '../types';

interface DashboardPageProps {}

const DashboardPage: React.FC<DashboardPageProps> = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

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
    
    fetchEvents();
  }, []);

  // Helper to get Supabase storage URL for category icons (memoized)
  const getCategoryIconUrl = useCallback((iconName: string) => {
    const supabaseUrl = supabase.storage.from('category-icons').getPublicUrl(iconName);
    return supabaseUrl.data.publicUrl;
  }, []);

  const categories = React.useMemo(() => [
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
  ], [getCategoryIconUrl]);

  const aiFeatures = React.useMemo(() => [
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
  ], []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery, navigate]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    navigate(`/category/${categoryId}`);
  }, [navigate]);

  if (selectedVenue) {
    return (
      <div className="bg-background h-screen flex flex-col overflow-hidden">
        <VenueDetailPage 
          venue={selectedVenue}
          onBack={() => setSelectedVenue(null)}
        />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary to-accent pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-primary-foreground">Welcome to RhinoFit!</h1>
            <p className="text-primary-foreground/90 text-sm mt-1">Find your perfect trainer today</p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trainers, classes, or locations..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-lg"
            />
          </form>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="px-4 -mt-4 mb-6">
        <div className="bg-card rounded-2xl shadow-lg p-4">
          <h2 className="font-bold text-foreground text-base mb-4">Categories</h2>
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
                    <div className="relative w-[70px] h-[70px] flex items-center justify-center p-1.5 bg-card rounded-xl overflow-hidden">
                      <img 
                        src={category.imageUrl} 
                        alt={category.name}
                        className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-200 rounded-xl"></div>
                      {category.id === 'gym' && (
                        <div className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] font-semibold px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap">
                          Popular
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-[70px] h-[70px] flex items-center justify-center rounded-xl bg-muted overflow-hidden">
                      <IconComponent className="w-8 h-8 text-foreground" />
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-200"></div>
                    </div>
                  )}
                  <span className="text-xs font-medium text-foreground text-center">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Premium Features */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-foreground text-base">RhinoFit Premium</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">New</span>
        </div>
        <div className="space-y-3">
          {aiFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => navigate(feature.path)}
                className="w-full bg-card rounded-2xl shadow-md p-4 flex items-center gap-4 hover:shadow-lg transition-all duration-200"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <IconComponent className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground text-sm">{feature.title}</h3>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {feature.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-foreground text-sm">›</span>
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
            <h2 className="font-bold text-foreground text-base">Upcoming Events</h2>
            <button
              onClick={() => navigate('/events')}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
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
                  className="bg-card rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-200"
                  style={{ width: '140px', flexShrink: 0 }}
                >
                  <div className="relative h-20">
                    <img
                      src={event.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 bg-card shadow-sm px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5 text-primary" />
                      <span className="text-[10px] font-semibold text-foreground">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-foreground text-xs mb-1 line-clamp-2">{event.title}</h3>
                    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
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
          className="rounded-2xl p-6 shadow-lg bg-gradient-to-r from-primary via-primary to-accent relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-card/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-card/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-6 h-6 text-primary-foreground" />
              <h3 className="font-bold text-primary-foreground text-lg drop-shadow-lg">Get Your Premium</h3>
            </div>
            <p className="text-primary-foreground text-sm mb-4 drop-shadow-md">Unlock exclusive features, discounts, and unlimited bookings!</p>
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className="bg-card text-primary font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-muted transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
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
