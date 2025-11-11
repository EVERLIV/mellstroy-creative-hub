import React from 'react';
import { Trainer } from '../types';
import TrainerCard from './TrainerCard';
import TrainerListItem from './TrainerListItem';
import TrainerCardSkeleton from './TrainerCardSkeleton';
import TrainerListItemSkeleton from './TrainerListItemSkeleton';

interface TrainerGridProps {
  trainers: Trainer[];
  viewMode: 'grid' | 'list';
  onSelectTrainer: (trainer: Trainer) => void;
  isLoading: boolean;
  favoriteTrainerIds: string[];
  onToggleFavorite: (trainerId: string) => void;
}

const TrainerGrid: React.FC<TrainerGridProps> = ({ trainers, viewMode, onSelectTrainer, isLoading, favoriteTrainerIds, onToggleFavorite }) => {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'gap-6' : 'gap-4'} mt-4`}>
        {Array.from({ length: 4 }).map((_, index) =>
          viewMode === 'grid' ? (
            <TrainerCardSkeleton key={index} />
          ) : (
            <TrainerListItemSkeleton key={index} />
          )
        )}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'gap-6' : 'gap-4'} mt-4`}>
      {trainers.map((trainer) => (
        viewMode === 'grid' ? (
          <TrainerCard 
            key={trainer.id} 
            trainer={trainer} 
            onSelect={() => onSelectTrainer(trainer)}
            isFavorite={favoriteTrainerIds.includes(trainer.id)}
            onToggleFavorite={onToggleFavorite}
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
      ))}
    </div>
  );
};

export default TrainerGrid;