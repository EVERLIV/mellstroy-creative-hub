import React, { useState, useEffect } from 'react';
import { supabase } from '../src/integrations/supabase/client';
import { Trainer, Class, UserRole } from '../types';
import { CATEGORIES } from '../constants';
import TrainerGrid from '../components/TrainerGrid';
import ViewToggle from '../components/ViewToggle';
import TrainerDetailPage from '../components/TrainerDetailPage';
import CategoryFilters from '../components/CategoryFilters';
import DistrictFilterModal from '../components/DistrictFilterModal';
import { Search, MapPin } from 'lucide-react';

interface ExploreProps {
  onInitiateBooking?: (target: { trainer: Trainer; cls: Class }) => void;
  onOpenChat?: (trainer: Trainer, context?: { className: string; bookingDate?: string; }) => void;
  userRole?: UserRole;
  currentUserId?: string;
  favoriteTrainerIds?: string[];
  onToggleFavorite?: (trainerId: string) => void;
  onOpenReviewsModal?: (trainer: Trainer) => void;
}

const Explore: React.FC<ExploreProps> = ({
  onInitiateBooking,
  onOpenChat,
  userRole = 'student',
  currentUserId = '',
  favoriteTrainerIds = [],
  onToggleFavorite,
  onOpenReviewsModal,
}) => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isExitingDetail, setIsExitingDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);

  useEffect(() => {
    loadTrainers();
  }, []);

  useEffect(() => {
    filterTrainers();
  }, [trainers, selectedCategory, searchQuery, selectedDistrict]);

  const loadTrainers = async () => {
    try {
      setLoading(true);
      
      // Fetch trainers with trainer role
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

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', trainerIds);

      if (profilesError) throw profilesError;

      // Fetch classes
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .in('trainer_id', trainerIds);

      if (classesError) throw classesError;

      // Fetch reviews with client profiles
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          client:profiles!reviews_client_id_fkey(username)
        `)
        .in('trainer_id', trainerIds);

      if (reviewsError) throw reviewsError;

      // Transform data
      const trainersData: Trainer[] = (profiles || []).map(profile => ({
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
        reviewsData: (reviews || [])
          .filter(r => r.trainer_id === profile.id)
          .map(r => ({
            reviewerName: (r.client as any)?.username || 'Anonymous',
            rating: r.rating,
            comment: r.comment || '',
          })),
        classes: (classes || [])
          .filter(c => c.trainer_id === profile.id)
          .map(c => ({
            id: c.id as any, // UUID stored as string, cast to number type for compatibility
            name: c.name,
            description: c.description || '',
            duration: c.duration_minutes,
            price: Number(c.price),
            imageUrl: c.image_url || '',
            capacity: c.capacity,
            classType: c.class_type as 'Indoor' | 'Outdoor' | 'Home',
          })),
        chatHistory: [],
      }));

      setTrainers(trainersData);
      console.log('Loaded trainers:', trainersData.length, trainersData);
    } catch (error) {
      console.error('Error loading trainers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTrainers = () => {
    let filtered = [...trainers];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(trainer => 
        trainer.specialty.includes(selectedCategory)
      );
    }

    // Filter by district
    if (selectedDistrict && selectedDistrict !== 'All Districts') {
      filtered = filtered.filter(trainer =>
        trainer.location.includes(selectedDistrict)
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(trainer =>
        trainer.name.toLowerCase().includes(query) ||
        trainer.location.toLowerCase().includes(query) ||
        trainer.specialty.some(s => s.toLowerCase().includes(query))
      );
    }

    setFilteredTrainers(filtered);
  };

  const handleSelectTrainer = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
  };

  const handleBackFromDetail = () => {
    setIsExitingDetail(true);
    setTimeout(() => {
      setSelectedTrainer(null);
      setIsExitingDetail(false);
    }, 350);
  };

  return (
    <div className="bg-slate-50 h-full relative">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 shadow-sm flex-shrink-0">
          <div className="p-4">
            <h1 className="text-xl font-bold text-slate-800 mb-3">Explore Trainers</h1>
            
            {/* District Filter Button */}
            <button
              onClick={() => setIsDistrictModalOpen(true)}
              className="w-full mb-3 px-4 py-2.5 bg-slate-100 rounded-xl flex items-center justify-between text-sm hover:bg-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-600" />
                <span className="text-slate-700 font-medium">{selectedDistrict}</span>
              </div>
            </button>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search trainers, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
          <div className="p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-gray-700">
                {filteredTrainers.length} {filteredTrainers.length === 1 ? 'trainer' : 'trainers'} found
              </h2>
              <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            </div>
            <TrainerGrid
              trainers={filteredTrainers}
              viewMode={viewMode}
              onSelectTrainer={handleSelectTrainer}
              isLoading={loading}
              favoriteTrainerIds={favoriteTrainerIds}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        </div>
      </div>

      {/* Trainer Detail Overlay */}
      {selectedTrainer && (
        <div className={`absolute inset-0 z-20 bg-white ${isExitingDetail ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
          <div className="h-full overflow-y-auto">
            <TrainerDetailPage 
              trainer={selectedTrainer} 
              onBack={handleBackFromDetail}
              onInitiateBooking={onInitiateBooking}
              onOpenChat={onOpenChat}
              userRole={userRole}
              currentUserId={currentUserId}
              isFavorite={favoriteTrainerIds.includes(selectedTrainer.id)}
              onToggleFavorite={onToggleFavorite}
              onOpenReviewsModal={onOpenReviewsModal}
            />
          </div>
        </div>
      )}

      {/* District Filter Modal */}
      <DistrictFilterModal
        isOpen={isDistrictModalOpen}
        onClose={() => setIsDistrictModalOpen(false)}
        onSelectDistrict={(district) => {
          setSelectedDistrict(district);
          setIsDistrictModalOpen(false);
        }}
        currentDistrict={selectedDistrict}
      />
    </div>
  );
};

export default Explore;
