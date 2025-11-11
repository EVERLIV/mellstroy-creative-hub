import React, { useState } from 'react';
import { Trainer, Category, Class, UserRole } from '../types';
import TrainerGrid from '../components/TrainerGrid';
import ViewToggle from '../components/ViewToggle';
import TrainerDetailPage from '../components/TrainerDetailPage';
import { ArrowLeft } from 'lucide-react';

interface CategoryPageProps {
  category: Category;
  trainers: Trainer[];
  onBack: () => void;
  onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
  onOpenChat: (trainer: Trainer, context?: { className: string; bookingDate?: string; }) => void;
  userRole: UserRole;
  currentUserId: string;
  favoriteTrainerIds: string[];
  onToggleFavorite: (trainerId: string) => void;
  onOpenReviewsModal: (trainer: Trainer) => void;
}

const CategoryPage: React.FC<CategoryPageProps> = ({
  category,
  trainers,
  onBack,
  onInitiateBooking,
  onOpenChat,
  userRole,
  currentUserId,
  favoriteTrainerIds,
  onToggleFavorite,
  onOpenReviewsModal,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isExitingDetail, setIsExitingDetail] = useState(false);

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
        <div className="sticky top-0 bg-white z-10 shadow-sm p-4 flex items-center flex-shrink-0">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 mr-2">
                <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">{category.name} Trainers</h1>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-semibold text-gray-700">{trainers.length} trainers found</h2>
                  <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
              </div>
              <TrainerGrid
                  trainers={trainers}
                  viewMode={viewMode}
                  onSelectTrainer={handleSelectTrainer}
                  isLoading={false}
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
    </div>
  );
};

export default CategoryPage;