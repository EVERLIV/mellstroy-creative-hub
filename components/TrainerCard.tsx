import React from 'react';
import { Trainer } from '../types';
import { TrainerMagazineCard } from '@/src/components/design-system/cards';
import type { TrainerDocument } from '@/src/hooks/useVerifiedDocuments';

interface TrainerCardProps {
  trainer: Trainer;
  onSelect: () => void;
  isFavorite: boolean;
  onToggleFavorite: (trainerId: string) => void;
  verifiedDocuments?: readonly TrainerDocument[];
}

/** App trainer card — adapter over DS TrainerMagazineCard. */
const TrainerCard: React.FC<TrainerCardProps> = React.memo(
  ({ trainer, onSelect, isFavorite, onToggleFavorite }) => {
    return (
      <TrainerMagazineCard
        name={trainer.name}
        imageUrl={trainer.imageUrl}
        rating={trainer.rating}
        reviews={trainer.reviews}
        location={trainer.location}
        price={trainer.price}
        tag={trainer.specialty?.[0]}
        isPremium={trainer.isPremium}
        verified={trainer.verificationStatus === 'verified'}
        isFavorite={isFavorite}
        onSelect={onSelect}
        onToggleFavorite={() => onToggleFavorite(trainer.id)}
      />
    );
  }
);

TrainerCard.displayName = 'TrainerCard';

export default TrainerCard;
