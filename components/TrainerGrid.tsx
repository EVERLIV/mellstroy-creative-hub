import React, { useMemo } from 'react';
import { Trainer } from '../types';
import TrainerCard from './TrainerCard';
import TrainerListItem from './TrainerListItem';
import TrainerCardSkeleton from './TrainerCardSkeleton';
import TrainerListItemSkeleton from './TrainerListItemSkeleton';
import { useVerifiedDocuments } from '@/src/hooks/useVerifiedDocuments';
import { cn } from '@/src/lib/utils';

const SKELETON_COUNT = 6;

/** Magazine tiles: 2-up on phones so the new portrait cards feel dense. */
const LAYOUT_CLASSES = {
  grid: 'grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4',
  list: 'grid-cols-1 gap-3 lg:grid-cols-2',
} as const;

interface TrainerGridProps {
  trainers: Trainer[];
  viewMode: 'grid' | 'list';
  onSelectTrainer: (trainer: Trainer) => void;
  isLoading: boolean;
  favoriteTrainerIds: string[];
  onToggleFavorite: (trainerId: string) => void;
}

const TrainerGrid: React.FC<TrainerGridProps> = React.memo(
  ({ trainers, viewMode, onSelectTrainer, isLoading, favoriteTrainerIds, onToggleFavorite }) => {
    const isGrid = viewMode === 'grid';
    const trainerIds = useMemo(() => (isGrid ? trainers.map((t) => t.id) : []), [isGrid, trainers]);
    const docsByTrainer = useVerifiedDocuments(trainerIds);
    const containerClass = cn('grid', LAYOUT_CLASSES[viewMode]);

    if (isLoading) {
      return (
        <div className={containerClass} aria-busy="true">
          {Array.from({ length: SKELETON_COUNT }, (_, index) =>
            isGrid ? <TrainerCardSkeleton key={index} /> : <TrainerListItemSkeleton key={index} />
          )}
        </div>
      );
    }

    if (trainers.length === 0) {
      return (
        <div className="py-12 text-center">
          <p className="mb-2 text-sm text-muted-foreground">No trainers found</p>
          <p className="text-xs text-muted-foreground/80">Try adjusting your filters</p>
        </div>
      );
    }

    return (
      <div className={containerClass}>
        {trainers.map((trainer) =>
          isGrid ? (
            <TrainerCard
              key={trainer.id}
              trainer={trainer}
              onSelect={() => onSelectTrainer(trainer)}
              isFavorite={favoriteTrainerIds.includes(trainer.id)}
              onToggleFavorite={onToggleFavorite}
              verifiedDocuments={docsByTrainer.get(trainer.id)}
            />
          ) : (
            <TrainerListItem
              key={trainer.id}
              trainer={trainer}
              onSelect={() => onSelectTrainer(trainer)}
              isFavorite={favoriteTrainerIds.includes(trainer.id)}
              onToggleFavorite={onToggleFavorite}
            />
          )
        )}
      </div>
    );
  }
);

TrainerGrid.displayName = 'TrainerGrid';

export default TrainerGrid;
