import React from 'react';
import { Category } from '../types';
import HamburgerMenu from './HamburgerMenu';
import CategoryFilters from './CategoryFilters';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/src/hooks/useAuth';
import rhinoLogo from '@/src/assets/rhino-logo.png';

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
        <header className="fixed top-0 left-0 right-0 z-40 bg-background shadow-sm border-b border-border">
            <div className="px-3 py-2">
                {/* Top Bar: Logo, Menu, District, and Notifications */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={rhinoLogo} alt="RhinoFit" className="w-12 h-12 object-contain" />
                        <HamburgerMenu />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button onClick={onOpenDistrictModal} className="flex items-center space-x-1 bg-card border border-border px-2.5 py-1.5 rounded-full text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="max-w-[100px] truncate">{selectedDistrict}</span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <ThemeToggle />
                        {user && <NotificationBell />}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search trainers or specialties..."
                        className="w-full h-10 pl-9 pr-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow relative z-0 text-sm"
                    />
                </div>
            </div>

            {/* Category Filters */}
            <div className="mt-2 mb-2 px-3 relative z-10 overflow-visible">
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