
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

const CategoryFilters: React.FC<CategoryFiltersProps> = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="py-2">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex space-x-3 pb-2 px-4">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon];
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 ${
                  selectedCategory === category.id
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {IconComponent && <IconComponent className="w-5 h-5" />}
                <span>{category.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilters;
