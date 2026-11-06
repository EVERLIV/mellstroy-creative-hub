import React, { useState, useEffect } from 'react';
import { Star, Users, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { NativeSelect } from '@/src/components/ui/native-select';
import { FilterSheet, FilterGroup, ChoiceChip, ToggleRow } from './FilterModal';

const VENUE_DISTRICTS = [
  'All Districts',
  'District 1', 'District 2', 'District 3', 'District 4', 'District 5',
  'District 6', 'District 7', 'District 8', 'District 9', 'District 10',
  'District 11', 'District 12', 'Binh Thanh', 'Go Vap',
  'Phu Nhuan', 'Tan Binh', 'Tan Phu', 'Binh Tan', 'Thu Duc',
];

type VenueFilters = {
  category: string[];
  district: string;
  minRating: number;
  trainerAvailability: boolean;
  priceRange: 'any' | 'low' | 'medium' | 'high';
  operatingHours: 'any' | 'morning' | 'afternoon' | 'evening';
};

interface VenueFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: VenueFilters;
  onApplyFilters: (newFilters: VenueFilters) => void;
  onResetFilters: () => void;
  availableCategories: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
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

const RATINGS = [0, 3.5, 4.0, 4.5, 4.8];

const PRICE_RANGES = [
  { value: 'any', label: 'Any price' },
  { value: 'low', label: 'Low (< 200k)' },
  { value: 'medium', label: 'Medium (200k–400k)' },
  { value: 'high', label: 'High (> 400k)' },
] as const;

const OPERATING_HOURS = [
  { value: 'any', label: 'Any time' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
] as const;

const VenueFilterModal: React.FC<VenueFilterModalProps> = ({
  isOpen,
  onClose,
  activeFilters,
  onApplyFilters,
  onResetFilters,
  availableCategories,
}) => {
  const [tempFilters, setTempFilters] = useState(activeFilters);

  useEffect(() => {
    setTempFilters(activeFilters);
  }, [activeFilters, isOpen]);

  const handleCategoryToggle = (category: string) => {
    setTempFilters((prev) => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter((c) => c !== category)
        : [...prev.category, category],
    }));
  };

  return (
    <FilterSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      onReset={onResetFilters}
      footer={
        <Button onClick={() => onApplyFilters(tempFilters)} className="w-full" size="lg">
          Apply filters
        </Button>
      }
    >
      <FilterGroup
        title="Category"
        meta={tempFilters.category.length > 0 ? `${tempFilters.category.length} selected` : undefined}
      >
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((category) => (
            <ChoiceChip
              key={category}
              shape="pill"
              selected={tempFilters.category.includes(category)}
              onClick={() => handleCategoryToggle(category)}
            >
              {CATEGORY_LABELS[category] || category}
            </ChoiceChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Location (district)">
        <NativeSelect
          aria-label="District"
          name="district"
          value={tempFilters.district}
          onChange={(e) => setTempFilters((prev) => ({ ...prev, district: e.target.value }))}
        >
          {VENUE_DISTRICTS.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </NativeSelect>
      </FilterGroup>

      <FilterGroup title="Minimum rating">
        <div className="grid grid-cols-5 gap-2">
          {RATINGS.map((rating) => (
            <ChoiceChip
              key={rating}
              selected={tempFilters.minRating === rating}
              onClick={() => setTempFilters((prev) => ({ ...prev, minRating: rating }))}
            >
              {rating === 0 ? (
                'Any'
              ) : (
                <>
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  {rating.toFixed(1)}+
                </>
              )}
            </ChoiceChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price range (per hour)" icon={DollarSign}>
        <div className="grid grid-cols-2 gap-2">
          {PRICE_RANGES.map((range) => (
            <ChoiceChip
              key={range.value}
              selected={tempFilters.priceRange === range.value}
              onClick={() => setTempFilters((prev) => ({ ...prev, priceRange: range.value }))}
            >
              {range.label}
            </ChoiceChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Operating hours" icon={Clock}>
        <div className="grid grid-cols-2 gap-2">
          {OPERATING_HOURS.map((hours) => (
            <ChoiceChip
              key={hours.value}
              selected={tempFilters.operatingHours === hours.value}
              onClick={() => setTempFilters((prev) => ({ ...prev, operatingHours: hours.value }))}
            >
              {hours.label}
            </ChoiceChip>
          ))}
        </div>
      </FilterGroup>

      <div className="border-t border-border pt-4">
        <ToggleRow
          id="trainer-availability-toggle"
          icon={Users}
          label="Trainers available"
          checked={tempFilters.trainerAvailability}
          onCheckedChange={() =>
            setTempFilters((prev) => ({ ...prev, trainerAvailability: !prev.trainerAvailability }))
          }
        />
      </div>
    </FilterSheet>
  );
};

export default VenueFilterModal;
