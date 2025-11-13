import React from 'react';
import { Category } from '../types';
import HamburgerMenu from './HamburgerMenu';
import CategoryFilters from './CategoryFilters';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/src/hooks/useAuth';

interface UnifiedHeaderProps {
    selectedDistrict: string;
    onOpenDistrictModal: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    categories: Category[];
    selectedCategory: string;
    onSelectCategory: (categoryId: string) => void;
}

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
    selectedDistrict,
    onOpenDistrictModal,
    searchQuery,
    onSearchChange,
    categories,
    selectedCategory,
    onSelectCategory,
}) => {
    const { user } = useAuth();
    
    return (
        <header className="sticky top-0 z-40 bg-background shadow-sm pt-3 pb-4 border-b border-border">
            <div className="px-4">
                {/* Top Bar: Menu, District, and Notifications */}
                <div className="flex items-center justify-between">
                    <HamburgerMenu />
                    <div className="flex items-center gap-2">
                        <button onClick={onOpenDistrictModal} className="flex items-center space-x-1 bg-card border border-border px-3 py-2 rounded-full text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <span className="max-w-[120px] truncate">{selectedDistrict}</span>
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <ThemeToggle />
                        {user && <NotificationBell />}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mt-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search trainers or specialties..."
                        className="w-full h-12 pl-11 pr-4 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-shadow relative z-0"
                    />
                </div>
            </div>

            {/* Category Filters */}
            <div className="mt-4 mb-2 px-4 relative z-10 overflow-visible">
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