import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Dumbbell, Calendar, UtensilsCrossed, Sparkles, MapPin, Trophy, Users, TrendingUp, Heart } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';

interface DashboardPageProps {}

const DashboardPage: React.FC<DashboardPageProps> = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    // Use mock data for now
    setUpcomingEvents(mockEvents);
    setLoading(false);
    
    // Uncomment to fetch real data:
    // const fetchEvents = async () => {
    //   try {
    //     const { data, error } = await supabase
    //       .from('events')
    //       .select(`
    //         *,
    //         organizer:organizer_id (username),
    //         interests:event_interests (count)
    //       `)
    //       .eq('status', 'approved')
    //       .gte('date', new Date().toISOString().split('T')[0])
    //       .order('date', { ascending: true })
    //       .limit(4);
    //
    //     if (error) throw error;
    //     setUpcomingEvents(data || []);
    //   } catch (error) {
    //     console.error('Error fetching events:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchEvents();
  }, []);

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
      id: 'tennis', 
      name: 'Tennis', 
      icon: Trophy, 
      imageUrl: getCategoryIconUrl('tennis.png'),
      color: 'from-green-100 to-green-50' 
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
    navigate(`/category/${categoryId}`);
  };

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
          <div className="grid grid-cols-3 gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  {category.imageUrl ? (
                    <img 
                      src={category.imageUrl} 
                      alt={category.name}
                      className="w-[100px] h-[100px] object-contain rounded-2xl transition-all duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-[100px] h-[100px] flex items-center justify-center rounded-2xl transition-all duration-200 group-hover:scale-105">
                      <IconComponent className="w-12 h-12 text-slate-700" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-700 text-center">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Premium Features */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-slate-900 text-base">AI Premium Features</h2>
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

      {/* Upcoming Events - Blog Style Carousel */}
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
            <div className="flex gap-3 hide-scrollbar" style={{ width: 'max-content' }}>
              {upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => navigate('/events')}
                  className="bg-white rounded-2xl shadow-md shadow-slate-200/60 overflow-hidden hover:shadow-lg transition-all duration-200 text-left"
                  style={{ width: '280px', flexShrink: 0 }}
                >
                  <div className="relative h-40">
                    <img
                      src={event.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#FF6B35]" />
                      <span className="text-xs font-semibold text-slate-700">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{event.title}</h3>
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2 min-h-[2rem]">{event.description}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Banner */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-lg mb-1">Start Your Journey</h3>
              <p className="text-white/90 text-sm mb-3">Book your first training session today!</p>
              <button
                onClick={() => navigate('/explore')}
                className="bg-white text-blue-600 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors shadow-md"
              >
                Find Trainers
              </button>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
