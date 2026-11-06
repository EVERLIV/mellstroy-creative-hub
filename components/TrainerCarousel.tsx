import React, { useMemo } from 'react';
import CarouselCards, { type RailItem } from '@/src/components/kokonutui/carousel-cards';
import { formatVND } from '@/src/lib/format';
import type { Trainer } from '../types';

interface TrainerCarouselProps {
  trainers: readonly Trainer[];
  title: string;
  eyebrow?: string;
  favoriteTrainerIds: readonly string[];
  onToggleFavorite: (trainerId: string) => void;
  onSelectTrainer: (trainer: Trainer) => void;
  className?: string;
}

export const trainerToRailItem = (trainer: Trainer): RailItem => ({
  id: trainer.id,
  title: trainer.name,
  location: trainer.location,
  image: trainer.imageUrl,
  imageAlt: trainer.name,
  badge: trainer.isPremium ? 'Premium' : trainer.specialty?.[0],
  dates: trainer.experienceYears ? `${trainer.experienceYears} yrs exp` : undefined,
  price: trainer.price,
  priceText: formatVND(trainer.price),
  priceLabel: '/class',
  rating: trainer.reviews > 0 ? trainer.rating : undefined,
  reviewCount: trainer.reviews > 0 ? trainer.reviews : undefined,
});

/** Horizontal, swipeable rail of trainers (Kokonut UI carousel-cards). */
const TrainerCarousel: React.FC<TrainerCarouselProps> = ({
  trainers,
  title,
  eyebrow,
  favoriteTrainerIds,
  onToggleFavorite,
  onSelectTrainer,
  className,
}) => {
  const items = useMemo(() => trainers.map(trainerToRailItem), [trainers]);
  const byId = useMemo(() => new Map(trainers.map((t) => [t.id, t])), [trainers]);

  if (items.length === 0) return null;

  return (
    <CarouselCards
      items={items}
      title={title}
      eyebrow={eyebrow}
      favorites={favoriteTrainerIds}
      onToggleFavorite={(id) => onToggleFavorite(id)}
      onSelect={(item) => {
        const trainer = byId.get(item.id);
        if (trainer) onSelectTrainer(trainer);
      }}
      className={className}
    />
  );
};

export default TrainerCarousel;
