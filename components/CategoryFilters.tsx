import React from 'react';
import { Category } from '../types';
import { Dumbbell, Flower2, Trophy, Hand, Waves, Music2, Footprints, Disc3, LayoutGrid, type LucideIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

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

/** Category chips: one swipeable row on phones, wrapping rows on md+ (no hidden overflow on desktop). */
const CategoryFilters: React.FC<CategoryFiltersProps> = React.memo(({ categories, selectedCategory, onSelectCategory }) => (
  <div className="py-2">
    <div className="no-scrollbar -mx-1 overflow-x-auto px-1 md:overflow-visible">
      <div role="group" aria-label="Categories" className="flex gap-2 md:flex-wrap">
        {categories.map((category) => {
          const Icon = ICONS[category.icon];
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              aria-pressed={isActive}
              className={cn(
                'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 md:text-sm',
                isActive
                  ? 'border-transparent bg-[#fd651e] text-white'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />}
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
));

CategoryFilters.displayName = 'CategoryFilters';

export default CategoryFilters;
