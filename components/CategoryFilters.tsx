import React from 'react';
import {
  Disc3,
  Dumbbell,
  Flower2,
  Footprints,
  Hand,
  LayoutGrid,
  Music2,
  Trophy,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { Category } from '../types';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';

interface CategoryFiltersProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const ICONS: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  'flower-2': Flower2,
  trophy: Trophy,
  hand: Hand,
  waves: Waves,
  'music-2': Music2,
  footprints: Footprints,
  'disc-3': Disc3,
  grid: LayoutGrid,
};

const CategoryFilters: React.FC<CategoryFiltersProps> = React.memo(
  ({ categories, selectedCategory, onSelectCategory }) => (
    <div className="no-scrollbar -mx-1 overflow-x-auto px-1 md:overflow-visible">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={selectedCategory || 'all'}
        onValueChange={(value) => {
          if (value) onSelectCategory(value);
        }}
        aria-label="Categories"
        className="h-auto w-max justify-start gap-2 md:w-full md:flex-wrap"
      >
        {categories.map((category) => {
          const Icon = ICONS[category.icon];
          return (
            <ToggleGroupItem
              key={category.id}
              value={category.id}
              className="h-9 shrink-0 gap-1.5 rounded-full px-3.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
            >
              {Icon ? <Icon aria-hidden /> : null}
              {category.name}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  )
);

CategoryFilters.displayName = 'CategoryFilters';

export default CategoryFilters;
