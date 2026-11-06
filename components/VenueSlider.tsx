import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Venue } from '../types';
import CarouselCards, { type RailItem } from '@/src/components/kokonutui/carousel-cards';
import { Button } from '@/src/components/ui/button';
import { formatVND } from '@/src/lib/format';
import { VENUE_CATEGORY_LABELS } from './VenueCard';

interface VenueSliderProps {
  venues: Venue[];
  onSelectVenue: (venue: Venue) => void;
  onViewAll: () => void;
}

const venueToRailItem = (venue: Venue): RailItem => ({
  id: venue.id,
  title: venue.name,
  location: venue.district,
  image: venue.imageUrl,
  imageAlt: venue.name,
  badge: VENUE_CATEGORY_LABELS[venue.category],
  dates: venue.trainerAvailability ? 'Trainers available' : undefined,
  price: venue.pricePerHour,
  priceText: formatVND(venue.pricePerHour),
  priceLabel: '/hour',
  rating: venue.rating,
  reviewCount: venue.reviews,
});

/** Swipeable rail of venues (Kokonut UI carousel-cards). Same props as the old hand-rolled slider. */
const VenueSlider: React.FC<VenueSliderProps> = ({ venues, onSelectVenue, onViewAll }) => {
  const items = useMemo(() => venues.map(venueToRailItem), [venues]);
  const byId = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);

  if (items.length === 0) return null;

  return (
    <div>
      <CarouselCards
        items={items}
        title="Sports venues"
        eyebrow="Rent a court, gym or studio"
        showFavorites={false}
        onSelect={(item) => {
          const venue = byId.get(item.id);
          if (venue) onSelectVenue(venue);
        }}
      />
      <div className="flex justify-end px-4">
        <Button variant="ghost" size="sm" onClick={onViewAll} className="text-primary">
          View all venues
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
};

export default VenueSlider;
