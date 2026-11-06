import React from 'react';
import { Venue } from '../types';
import { VenueFacilityCard } from '@/src/components/design-system/cards';
import { cn } from '@/src/lib/utils';

export const VENUE_CATEGORY_LABELS: Record<Venue['category'], string> = {
  tennis: 'Tennis',
  pickleball: 'Pickleball',
  golf: 'Golf',
  boxing: 'Boxing',
  gym: 'Gym',
  billiards: 'Billiards',
  basketball: 'Basketball',
  swimming: 'Swimming',
  yoga: 'Yoga',
  other: 'Other',
};

interface VenueCardProps {
  venue: Venue;
  onSelect: () => void;
  onBook?: () => void;
  className?: string;
}

/** App venue card — thin adapter over the DS VenueFacilityCard. */
const VenueCard: React.FC<VenueCardProps> = React.memo(({ venue, onSelect, onBook, className }) => {
  return (
    <VenueFacilityCard
      className={cn(className)}
      name={venue.name}
      imageUrl={venue.imageUrl}
      categoryLabel={VENUE_CATEGORY_LABELS[venue.category]}
      address={venue.address}
      district={venue.district}
      rating={venue.rating}
      reviews={venue.reviews}
      pricePerHour={venue.pricePerHour}
      amenities={venue.amenities}
      trainersAvailable={venue.trainerAvailability}
      onDetails={onSelect}
      onBook={onBook ?? onSelect}
    />
  );
});

VenueCard.displayName = 'VenueCard';

export default VenueCard;
