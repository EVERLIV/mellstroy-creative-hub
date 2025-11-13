import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Venue } from '../types';
import VenueCard from '../components/VenueCard';
import VenueDetailPage from './VenueDetailPage';
import VenueFilterModal from '../components/VenueFilterModal';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';

interface VenuesPageProps {
    venues: Venue[];
    onBack: () => void;
}

type VenueFilters = {
    category: string[];
    district: string;
    minRating: number;
    trainerAvailability: boolean;
    priceRange: 'any' | 'low' | 'medium' | 'high';
    operatingHours: 'any' | 'morning' | 'afternoon' | 'evening';
};

const VenuesPage: React.FC<VenuesPageProps> = ({ venues, onBack }) => {
    const navigate = useNavigate();
    const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
    const [isExitingDetail, setIsExitingDetail] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<VenueFilters>({
        category: [],
        district: 'All Districts',
        minRating: 0,
        trainerAvailability: false,
        priceRange: 'any',
        operatingHours: 'any',
    });

    const handleSelectVenue = (venue: Venue) => {
        setIsExitingDetail(false);
        setSelectedVenue(venue);
        window.scrollTo(0, 0);
    };

    const handleBackFromDetail = () => {
        setIsExitingDetail(true);
        setTimeout(() => {
            setSelectedVenue(null);
            setIsExitingDetail(false);
        }, 300);
    };

    const handleApplyFilters = (newFilters: VenueFilters) => {
        setActiveFilters(newFilters);
        setIsFilterModalOpen(false);
    };

    const handleResetFilters = () => {
        setActiveFilters({
            category: [],
            district: 'All Districts',
            minRating: 0,
            trainerAvailability: false,
            priceRange: 'any',
            operatingHours: 'any',
        });
    };

    const filteredVenues = useMemo(() => {
        return venues.filter(venue => {
            // Search filter
            const matchesSearch = searchQuery.trim() === '' || 
                venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                venue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                venue.district.toLowerCase().includes(searchQuery.toLowerCase());

            // Category filter
            const matchesCategory = activeFilters.category.length === 0 || 
                activeFilters.category.includes(venue.category);

            // District filter
            const matchesDistrict = activeFilters.district === 'All Districts' || 
                venue.district === activeFilters.district;

            // Rating filter
            const matchesRating = venue.rating >= activeFilters.minRating;

            // Trainer availability filter
            const matchesTrainerAvailability = !activeFilters.trainerAvailability || 
                venue.trainerAvailability === true;

            // Price range filter
            let matchesPriceRange = true;
            if (activeFilters.priceRange !== 'any') {
                if (activeFilters.priceRange === 'low') {
                    matchesPriceRange = venue.pricePerHour < 200000;
                } else if (activeFilters.priceRange === 'medium') {
                    matchesPriceRange = venue.pricePerHour >= 200000 && venue.pricePerHour <= 400000;
                } else if (activeFilters.priceRange === 'high') {
                    matchesPriceRange = venue.pricePerHour > 400000;
                }
            }

            // Operating hours filter
            let matchesOperatingHours = true;
            if (activeFilters.operatingHours !== 'any') {
                const hasMatchingHours = venue.operatingHours.some(oh => {
                    const openHour = parseInt(oh.open.split(':')[0]);
                    const closeHour = parseInt(oh.close.split(':')[0]);
                    
                    if (activeFilters.operatingHours === 'morning') {
                        return openHour <= 8 && closeHour >= 12;
                    } else if (activeFilters.operatingHours === 'afternoon') {
                        return openHour <= 12 && closeHour >= 17;
                    } else if (activeFilters.operatingHours === 'evening') {
                        return openHour <= 17 && closeHour >= 20;
                    }
                    return false;
                });
                matchesOperatingHours = hasMatchingHours;
            }

            return matchesSearch && matchesCategory && matchesDistrict && matchesRating && 
                   matchesTrainerAvailability && matchesPriceRange && matchesOperatingHours;
        });
    }, [venues, searchQuery, activeFilters]);

    const availableCategories = Array.from(new Set(venues.map(v => v.category)));

    const hasActiveFilters = activeFilters.category.length > 0 || 
        activeFilters.district !== 'All Districts' || 
        activeFilters.minRating > 0 || 
        activeFilters.trainerAvailability || 
        activeFilters.priceRange !== 'any' || 
        activeFilters.operatingHours !== 'any';

    if (selectedVenue) {
        return (
            <div className={`absolute inset-0 z-20 bg-white transition-all duration-300 ${
                isExitingDetail 
                    ? 'translate-x-full opacity-0' 
                    : 'translate-x-0 opacity-100'
            }`}>
                <VenueDetailPage 
                    venue={selectedVenue} 
                    onBack={handleBackFromDetail}
                />
            </div>
        );
    }

    return (
        <div className="bg-gray-50 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white shadow-sm z-20 flex-shrink-0">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={onBack} className="p-2 -ml-2">
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </button>
                    <h1 className="text-base font-bold text-gray-900">Sports Venues</h1>
                    <button 
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`p-2 -mr-2 relative ${hasActiveFilters ? 'text-[#FF6B35]' : 'text-gray-800'}`}
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                        {hasActiveFilters && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF6B35] rounded-full"></span>
                        )}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search venues..."
                            className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
                            >
                                <span className="text-gray-400 text-xs">✕</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="px-4 pb-3 flex flex-wrap gap-2">
                        {activeFilters.category.length > 0 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                {activeFilters.category.length} categories
                            </span>
                        )}
                        {activeFilters.district !== 'All Districts' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                {activeFilters.district}
                            </span>
                        )}
                        {activeFilters.minRating > 0 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                {activeFilters.minRating.toFixed(1)}+ rating
                            </span>
                        )}
                        {activeFilters.trainerAvailability && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                Trainers
                            </span>
                        )}
                        {activeFilters.priceRange !== 'any' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                {activeFilters.priceRange === 'low' ? '< 200k' : 
                                 activeFilters.priceRange === 'medium' ? '200k-400k' : '> 400k'}
                            </span>
                        )}
                        {activeFilters.operatingHours !== 'any' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                {activeFilters.operatingHours}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                    {/* Results Count */}
                    <div className="mb-3">
                        <p className="text-xs font-medium text-gray-600">
                            {filteredVenues.length} {filteredVenues.length === 1 ? 'venue' : 'venues'} found
                        </p>
                    </div>

                    {/* Venues Grid */}
                    {filteredVenues.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredVenues.map((venue) => (
                                <VenueCard 
                                    key={venue.id} 
                                    venue={venue} 
                                    onSelect={() => handleSelectVenue(venue)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">No venues found</h3>
                            <p className="text-xs text-gray-600 text-center mb-4">
                                Try adjusting your filters or search query
                            </p>
                            {hasActiveFilters && (
                                <button
                                    onClick={() => {
                                        handleResetFilters();
                                        setSearchQuery('');
                                    }}
                                    className="px-4 py-2 bg-[#FF6B35] text-white text-xs font-semibold rounded-lg hover:bg-orange-600 active:scale-95 transition-all duration-200 shadow-sm"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Modal */}
            <VenueFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                activeFilters={activeFilters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
                availableCategories={availableCategories}
            />
        </div>
    );
};

export default VenuesPage;
