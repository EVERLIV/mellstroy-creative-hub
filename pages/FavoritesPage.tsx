import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trainer, Class, UserRole } from '../types';
import { Heart } from 'lucide-react';
import { AppScreen } from '@/src/components/layout/screen';
import { StitchCanvas, StitchPageHeader, StitchPanel } from '@/src/components/layout/stitch-page';
import { EmptyState } from '../src/components/layout/states';
import { Button } from '../src/components/ui/button';
import { cn } from '../src/lib/utils';
import TrainerGrid from '../components/TrainerGrid';
import ViewToggle from '../components/ViewToggle';
import TrainerDetailPage from '../components/TrainerDetailPage';

interface FavoritesPageProps {
  trainers: Trainer[];
  favoriteTrainerIds: string[];
  onToggleFavorite: (trainerId: string) => void;
  onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
  onOpenChat: (trainer: Trainer) => void;
  onBack?: () => void;
  userRole: UserRole;
  currentUserId: string;
  onOpenReviewsModal: (trainer: Trainer) => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({
  trainers,
  favoriteTrainerIds,
  onToggleFavorite,
  onInitiateBooking,
  onOpenChat,
  onBack,
  userRole,
  currentUserId,
  onOpenReviewsModal,
}) => {
  const navigate = useNavigate();
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isExitingDetail, setIsExitingDetail] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const favoriteTrainers = trainers.filter((t) => favoriteTrainerIds.includes(t.id));
  const goExplore = () => (onBack ? onBack() : navigate('/explore'));

  const handleSelectTrainer = (trainer: Trainer) => {
    setIsExitingDetail(false);
    setSelectedTrainer(trainer);
    window.scrollTo(0, 0);
  };

  const handleBackFromDetail = () => {
    setIsExitingDetail(true);
    setTimeout(() => {
      setSelectedTrainer(null);
      setIsExitingDetail(false);
    }, 300);
  };

  if (selectedTrainer) {
    return (
      <div
        className={cn(
          'absolute inset-0 z-20 bg-background transition-all duration-300',
          isExitingDetail ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        )}
      >
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
    );
  }

  const count = favoriteTrainers.length;

  return (
    <AppScreen className="relative min-w-0 bg-[#f9fafb] dark:bg-background">
      <StitchCanvas>
        <StitchPageHeader
          title="My favorites"
          description={
            count > 0
              ? `${count} ${count === 1 ? 'trainer' : 'trainers'} saved for later`
              : "Trainers you've saved for later"
          }
          actions={
            count > 0 ? <ViewToggle viewMode={viewMode} setViewMode={setViewMode} /> : undefined
          }
        />

        {count > 0 ? (
          <StitchPanel className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Heart className="size-4 fill-[#fd651e] text-[#fd651e]" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">Favorite trainers</h2>
            </div>
            <TrainerGrid
              trainers={favoriteTrainers}
              viewMode={viewMode}
              onSelectTrainer={handleSelectTrainer}
              isLoading={false}
              favoriteTrainerIds={favoriteTrainerIds}
              onToggleFavorite={onToggleFavorite}
            />
          </StitchPanel>
        ) : (
          <StitchPanel className="p-6">
            <EmptyState
              icon={Heart}
              title="No favorites yet"
              description="Tap the heart icon on a trainer's profile to add them to your favorites."
              action={
                <Button className="bg-[#fd651e] text-white hover:bg-[#a73a00]" onClick={goExplore}>
                  Explore trainers
                </Button>
              }
            />
          </StitchPanel>
        )}
      </StitchCanvas>
    </AppScreen>
  );
};

export default FavoritesPage;
