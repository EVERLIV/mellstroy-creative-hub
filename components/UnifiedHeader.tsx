import React from 'react';
import { Category } from '../types';
import HamburgerMenu from './HamburgerMenu';
import CategoryFilters from './CategoryFilters';
import { MapPin, ChevronDown, Search } from 'lucide-react';

interface UnifiedHeaderProps {
    onNavigate: (page: string) => void;
    selectedDistrict: string;
    onOpenDistrictModal: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    categories: Category[];
    selectedCategory: string;
    onSelectCategory: (categoryId: string) => void;
}

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
    onNavigate,
    selectedDistrict,
    onOpenDistrictModal,
    searchQuery,
    onSearchChange,
    categories,
    selectedCategory,
    onSelectCategory,
}) => {
    return (
        <header className="sticky top-0 z-20 bg-white shadow-sm pt-3 pb-2">
            <div className="px-4">
                {/* Top Bar: Menu and District */}
                <div className="flex items-center justify-between">
                    <HamburgerMenu onNavigate={onNavigate} />
                    <button onClick={onOpenDistrictModal} className="flex items-center space-x-1 bg-white border border-slate-200 px-3 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-slate-50 transition-colors">
                        <MapPin className="h-5 w-5 text-gray-500" />
                        <span className="max-w-[120px] truncate">{selectedDistrict}</span>
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mt-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search trainers or specialties..."
                        className="w-full h-12 pl-11 pr-4 bg-slate-100 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 transition-shadow"
                    />
                </div>
            </div>

            {/* Category Filters */}
            <div className="mt-3">
                <CategoryFilters
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={onSelectCategory}
                />
            </div>
        </header>
    );
};

export default UnifiedHeader;