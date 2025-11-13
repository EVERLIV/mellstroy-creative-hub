
import React from 'react';
import { Category } from '../types';
import { Dumbbell, Flower2, Trophy, Hand, Waves, Music2, Footprints, Disc3, LayoutGrid } from 'lucide-react';

interface CategoryFiltersProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const iconMap: { [key: string]: React.FC<{ className?: string }> } = {
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

const CategoryFilters: React.FC<CategoryFiltersProps> = React.memo(({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="py-2">
      <div className="overflow-x-auto overflow-y-visible no-scrollbar">
        <div className="flex space-x-2">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon];
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 active:scale-95 ${
                  selectedCategory === category.id
                    ? 'bg-[#FF6B35] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                <span>{category.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
});

CategoryFilters.displayName = 'CategoryFilters';

export default CategoryFilters;
