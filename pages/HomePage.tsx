import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainerGrid from '../components/TrainerGrid';
import ViewToggle from '../components/ViewToggle';
import TrainerDetailPage from '../components/TrainerDetailPage';
import VenueCard from '../components/VenueCard';
import RequestCard from '../components/RequestCard';
import { Trainer, Class, UserRole, Venue, TrainingRequest } from '../types';
import { CATEGORIES } from '../constants';
import { mockVenues } from '../data/mockVenues';
import DistrictFilterModal from '../components/DistrictFilterModal';
import UnifiedHeader from '../components/UnifiedHeader';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { Calendar, MessageCircle, Building, FileText, ArrowRight } from 'lucide-react';

interface HomePageProps {
    trainers: Trainer[];
    onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
    onOpenChat: (trainer: Trainer, context?: { className: string; bookingDate?: string; }) => void;
    selectedCategory: string;
    onSelectCategory: (categoryId: string) => void;
    userRole: UserRole;
    currentUserId: string;
    favoriteTrainerIds: string[];
    onToggleFavorite: (trainerId: string) => void;
    onOpenReviewsModal: (trainer: Trainer) => void;
}

const allCategories = [{ id: 'all', name: 'All', icon: 'grid' }, ...CATEGORIES];

const HomePage: React.FC<HomePageProps> = ({ trainers, onInitiateBooking, onOpenChat, selectedCategory, onSelectCategory, userRole, currentUserId, favoriteTrainerIds, onToggleFavorite, onOpenReviewsModal }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExitingDetail, setIsExitingDetail] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trainer-specific state
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  
  // User district for "Trainers in your district" section
  const [userDistrict, setUserDistrict] = useState<string | null>(null);

  // Load user district for students
  useEffect(() => {
    if (userRole === 'student' && user) {
      loadUserDistrict();
    }
  }, [userRole, user]);

  // Load requests for trainers
  useEffect(() => {
    if (userRole === 'trainer' && user) {
      loadRequests();
    }
  }, [userRole, user]);
  
  const loadUserDistrict = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('location, district')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!error && data) {
        // Use district if available, otherwise fall back to location
        setUserDistrict(data.district || data.location || null);
      }
    } catch (error) {
      console.error('Error loading user district:', error);
    }
  };

  // Simulate loading when component mounts or filters change
  useEffect(() => {
    if (userRole === 'student') {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000); // Simulate network delay

      return () => clearTimeout(timer);
    }
  }, [selectedCategory, selectedDistrict, searchQuery, userRole]);

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

  const filteredTrainers = useMemo(() => {
      const categorySpecialtyMap: { [key: string]: string[] } = {
          gym: ['strength training', 'hiit', 'personal training', 'gym coach'],
          yoga: ['yoga', 'pilates'],
          tennis: ['tennis'],
          boxing: ['boxing', 'kickboxing', 'mma'],
          swimming: ['swimming'],
          pickleball: ['pickleball'],
          dance: ['dance fitness'],
          running: ['running'],
      };

      const isAllCategories = selectedCategory === 'all';
      const categoryObject = CATEGORIES.find(c => c.id === selectedCategory);
      const relevantSpecialties = !isAllCategories ? (categorySpecialtyMap[selectedCategory] || (categoryObject ? [categoryObject.name.toLowerCase()] : [])) : [];
      
      const lowerCaseQuery = searchQuery.toLowerCase();

      return trainers.filter(trainer => {
          const queryMatch = lowerCaseQuery === '' ||
              trainer.name.toLowerCase().includes(lowerCaseQuery) ||
              trainer.specialty.some(s => s.toLowerCase().includes(lowerCaseQuery));

          const categoryMatch = isAllCategories || trainer.specialty.some(spec =>
              relevantSpecialties.some(rs => rs && spec.toLowerCase().includes(rs))
          );
          const districtMatch = selectedDistrict === 'All Districts' || trainer.location === selectedDistrict;

          return queryMatch && categoryMatch && districtMatch;
      });
  }, [trainers, selectedCategory, selectedDistrict, searchQuery]);

  const handleSelectTrainer = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
  };

  const handleBackToList = () => {
    setIsExitingDetail(true);
    setTimeout(() => {
      setSelectedTrainer(null);
      setIsExitingDetail(false);
    }, 350);
  };
  
  const handleSelectDistrict = (district: string) => {
    setSelectedDistrict(district);
    setIsDistrictModalOpen(false);
  };

  // Trainer Home Page
  if (userRole === 'trainer') {
    return (
      <div className="bg-gray-50 h-full overflow-y-auto">
        {/* Simple Header for Trainers */}
        <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 px-4 py-3">
          <h1 className="text-base font-bold text-gray-900">Dashboard</h1>
        </div>
        
        <div className="px-4 py-3 pb-safe-nav">
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
                    currentUserId={currentUserId}
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

  // Student Home Page (existing code)
  return (
    <div className="bg-slate-50 h-full overflow-y-auto">
      <div className="relative">
        {selectedTrainer && (
          <div key={selectedTrainer.id} className={`absolute w-full top-0 bottom-0 z-30 ${isExitingDetail ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
            <TrainerDetailPage 
              trainer={selectedTrainer} 
              onBack={handleBackToList}
              onInitiateBooking={onInitiateBooking}
              userRole={userRole}
              currentUserId={currentUserId}
              isFavorite={favoriteTrainerIds.includes(selectedTrainer.id)}
              onToggleFavorite={onToggleFavorite}
              onOpenReviewsModal={onOpenReviewsModal}
            />
          </div>
        )}
        
        <div className={`transition-opacity duration-300 ${selectedTrainer ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
           <UnifiedHeader
              selectedDistrict={selectedDistrict}
              onOpenDistrictModal={() => setIsDistrictModalOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              categories={allCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
            />

           <div className="px-4 pb-safe-nav">
              {/* Trainers in Your District Section */}
              {userRole === 'student' && userDistrict && (
                <div className="mt-6 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-900">Trainers in Your District</h2>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{userDistrict}</span>
                  </div>
                  {(() => {
                    const districtTrainers = trainers.filter(trainer => 
                      trainer.isPremium && 
                      (trainer.location === userDistrict || trainer.location?.includes(userDistrict))
                    );
                    
                    if (districtTrainers.length === 0) {
                      return (
                        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                          <p className="text-xs text-gray-600">No premium trainers in your district yet.</p>
                        </div>
                      );
                    }
                    
                    return (
                      <TrainerGrid 
                        trainers={districtTrainers.slice(0, 6)} 
                        viewMode="grid" 
                        onSelectTrainer={handleSelectTrainer} 
                        isLoading={false}
                        favoriteTrainerIds={favoriteTrainerIds}
                        onToggleFavorite={onToggleFavorite}
                      />
                    );
                  })()}
                </div>
              )}

              {/* Trainers Section */}
              <div className="mt-8 mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Nearby Trainers</h2>
                <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
              </div>
              <TrainerGrid 
                trainers={filteredTrainers} 
                viewMode={viewMode} 
                onSelectTrainer={handleSelectTrainer} 
                isLoading={isLoading}
                favoriteTrainerIds={favoriteTrainerIds}
                onToggleFavorite={onToggleFavorite}
              />
          </div>
        </div>
      </div>
      
      {isDistrictModalOpen && (
          <DistrictFilterModal
              isOpen={isDistrictModalOpen}
              onClose={() => setIsDistrictModalOpen(false)}
              onSelectDistrict={handleSelectDistrict}
              currentDistrict={selectedDistrict}
          />
      )}
    </div>
  );
};

export default HomePage;