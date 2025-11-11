import React, { useState, useEffect, useMemo } from 'react';
import TrainerGrid from '../components/TrainerGrid';
import ViewToggle from '../components/ViewToggle';
import TrainerDetailPage from '../components/TrainerDetailPage';
import { Trainer, Class, UserRole } from '../types';
import { CATEGORIES } from '../constants';
import DistrictFilterModal from '../components/DistrictFilterModal';
import UnifiedHeader from '../components/UnifiedHeader';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExitingDetail, setIsExitingDetail] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulate loading when component mounts or filters change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulate network delay

    return () => clearTimeout(timer);
  }, [selectedCategory, selectedDistrict, searchQuery]);

  const filteredTrainers = useMemo(() => {
      const categorySpecialtyMap: { [key: string]: string[] } = {
          gym: ['strength training', 'hiit', 'personal training', 'gym coach'],
          yoga: ['yoga', 'pilates'],
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

  return (
    <div className="bg-slate-50 h-full overflow-y-auto">
      <div className="relative">
        {selectedTrainer && (
          <div key={selectedTrainer.id} className={`absolute w-full top-0 z-30 ${isExitingDetail ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`}>
            <TrainerDetailPage 
              trainer={selectedTrainer} 
              onBack={handleBackToList}
              onInitiateBooking={onInitiateBooking}
              onOpenChat={onOpenChat}
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

           <div className="px-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
              <div className="mt-6 flex justify-between items-center">
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