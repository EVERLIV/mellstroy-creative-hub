import React, { useMemo } from 'react';
import CarouselCards, { type RailItem } from '@/src/components/kokonutui/carousel-cards';
import { formatVND } from '@/src/lib/format';
import type { Class, Trainer } from '../types';

export interface ClassWithTrainer {
  cls: Class;
  trainer: Trainer;
}

interface ClassCarouselProps {
  classes: readonly ClassWithTrainer[];
  title: string;
  eyebrow?: string;
  onSelectClass: (entry: ClassWithTrainer) => void;
  className?: string;
}

const railId = ({ cls, trainer }: ClassWithTrainer) => `${trainer.id}:${cls.id}`;

const scheduleText = (cls: Class): string => {
  const days = cls.schedule?.days?.slice(0, 3).join(', ');
  const time = cls.schedule?.time;
  const when = [days, time].filter(Boolean).join(' · ');
  return when || `${cls.duration} min`;
};

export const classToRailItem = (entry: ClassWithTrainer): RailItem => ({
  id: railId(entry),
  title: entry.cls.name,
  location: `${entry.trainer.name} · ${entry.trainer.location}`,
  image: entry.cls.imageUrl || entry.cls.imageUrls?.[0] || entry.trainer.imageUrl,
  imageAlt: entry.cls.name,
  badge: entry.cls.level ?? entry.cls.classType,
  dates: scheduleText(entry.cls),
  price: entry.cls.price,
  priceText: formatVND(entry.cls.price),
  priceLabel: '/class',
});

/** Horizontal, swipeable rail of classes (Kokonut UI carousel-cards). Classes have no favorites. */
const ClassCarousel: React.FC<ClassCarouselProps> = ({ classes, title, eyebrow, onSelectClass, className }) => {
  const items = useMemo(() => classes.map(classToRailItem), [classes]);
  const byId = useMemo(() => new Map(classes.map((e) => [railId(e), e])), [classes]);

  if (items.length === 0) return null;

  return (
    <CarouselCards
      items={items}
      title={title}
      eyebrow={eyebrow}
      showFavorites={false}
      onSelect={(item) => {
        const entry = byId.get(item.id);
        if (entry) onSelectClass(entry);
      }}
      className={className}
    />
  );
};

export default ClassCarousel;
