import React, { useState } from 'react';
import { Trainer, Category, Class, UserRole } from '../types';
import TrainerGrid from '../components/TrainerGrid';
import ViewToggle from '../components/ViewToggle';
import TrainerDetailPage from '../components/TrainerDetailPage';
import CategoryFilters from '../components/CategoryFilters';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES } from '../constants';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(category.id);

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

  // Filter trainers based on search
  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = searchQuery === '' || 
      trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.specialty?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    // If user selects different category, navigate back and let parent handle it
    if (categoryId !== category.id) {
      onBack();
    }
  };

  return (
    <div className="bg-background h-full relative">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 shadow-sm flex-shrink-0 border-b border-border">
          <div className="p-4">
            {/* Top Bar with Back Button and Filter */}
            <div className="flex items-center justify-between mb-3">
              <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">{category.name} Trainers</span>
              </button>
              <button className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors">
                <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search trainers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all duration-200"
              />
            </div>

            {/* Category Filters */}
            <CategoryFilters
              categories={CATEGORIES}
              selectedCategory={selectedCategoryId}
              onSelectCategory={handleCategoryChange}
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
              <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xs font-medium text-muted-foreground">
                    {filteredTrainers.length} {filteredTrainers.length === 1 ? 'trainer' : 'trainers'} found
                  </h2>
                  <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
              </div>
              <TrainerGrid
                  trainers={filteredTrainers}
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
        <div className={`absolute inset-0 z-20 bg-background transition-all duration-300 ${
          isExitingDetail 
            ? 'translate-x-full opacity-0' 
            : 'translate-x-0 opacity-100'
        }`}>
          <div className="h-full overflow-y-auto">
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
        </div>
      )}
    </div>
  );
};

export default CategoryPage;