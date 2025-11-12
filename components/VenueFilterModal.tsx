import React, { useState, useEffect } from 'react';
import { Venue } from '../types';
import { X, Star, Users, DollarSign, Clock } from 'lucide-react';

const VENUE_DISTRICTS = [
    'All Districts',
    'District 1', 'District 2', 'District 3', 'District 4', 'District 5',
    'District 6', 'District 7', 'District 8', 'District 9', 'District 10',
    'District 11', 'District 12', 'Binh Thanh', 'Go Vap',
    'Phu Nhuan', 'Tan Binh', 'Tan Phu', 'Binh Tan', 'Thu Duc'
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

const categoryLabels: Record<string, string> = {
    tennis: 'Tennis',
    pickleball: 'Pickleball',
    golf: 'Golf',
    boxing: 'Boxing',
    gym: 'Gym',
    billiards: 'Billiards',
    basketball: 'Basketball',
    swimming: 'Swimming',
    yoga: 'Yoga',
    other: 'Other'
};

const VenueFilterModal: React.FC<VenueFilterModalProps> = ({ 
    isOpen, 
    onClose, 
    activeFilters, 
    onApplyFilters, 
    onResetFilters,
    availableCategories 
}) => {
    const [tempFilters, setTempFilters] = useState(activeFilters);

    useEffect(() => {
        setTempFilters(activeFilters);
    }, [activeFilters, isOpen]);

    const handleToggleChange = (filterName: 'trainerAvailability') => {
        setTempFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
    };

    const handleCategoryToggle = (category: string) => {
        setTempFilters(prev => {
            const currentCategories = prev.category;
            const isSelected = currentCategories.includes(category);
            
            if (isSelected) {
                return { ...prev, category: currentCategories.filter(c => c !== category) };
            } else {
                return { ...prev, category: [...currentCategories, category] };
            }
        });
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTempFilters(prev => ({...prev, [name]: value }));
    };

    const handlePriceRangeChange = (range: VenueFilters['priceRange']) => {
        setTempFilters(prev => ({...prev, priceRange: range}));
    };

    const handleOperatingHoursChange = (hours: VenueFilters['operatingHours']) => {
        setTempFilters(prev => ({...prev, operatingHours: hours}));
    };

    const handleRatingChange = (rating: number) => {
        setTempFilters(prev => ({...prev, minRating: rating}));
    };

    const handleReset = () => {
        onResetFilters();
    };
    
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-gray-50 z-[100] animate-fade-in"
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="w-full h-full flex flex-col bg-white"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50">
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                    <h2 className="text-base font-semibold text-gray-900">Filters</h2>
                    <button onClick={handleReset} className="font-medium text-gray-600 hover:text-gray-900 text-sm px-2 py-1">Reset</button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-32 bg-white">
                    {/* Category */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-base font-bold text-gray-900">Category</h3>
                            {tempFilters.category.length > 0 && (
                                <p className="text-sm text-gray-500">{tempFilters.category.length} selected</p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {availableCategories.map(category => {
                                const isSelected = tempFilters.category.includes(category);
                                return (
                                    <button
                                        type="button"
                                        key={category}
                                        onClick={() => handleCategoryToggle(category)}
                                        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors border ${
                                            isSelected 
                                                ? 'bg-[#FF6B35] border-[#FF6B35] text-white' 
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {categoryLabels[category] || category}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Location (District) */}
                    <div>
                        <h3 className="text-base font-bold text-gray-900 mb-3">Location (District)</h3>
                        <select
                            name="district"
                            value={tempFilters.district}
                            onChange={handleSelectChange}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] bg-white text-gray-800"
                        >
                            {VENUE_DISTRICTS.map(district => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                    </div>

                    {/* Minimum Rating */}
                    <div>
                        <h3 className="text-base font-bold text-gray-900 mb-3">Minimum Rating</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {[0, 3.5, 4.0, 4.5, 4.8].map(rating => (
                                <button
                                    key={rating}
                                    onClick={() => handleRatingChange(rating)}
                                    className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors border flex items-center justify-center gap-1 ${
                                        tempFilters.minRating === rating 
                                            ? 'bg-[#FF6B35] border-[#FF6B35] text-white' 
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {rating === 0 ? 'Any' : (
                                        <>
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                            {rating.toFixed(1)}+
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-600" />
                            Price Range (per hour)
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {([
                                { value: 'any', label: 'Any Price' },
                                { value: 'low', label: 'Low (< 200k)' },
                                { value: 'medium', label: 'Medium (200k-400k)' },
                                { value: 'high', label: 'High (> 400k)' }
                            ] as const).map(range => (
                                <button
                                    key={range.value}
                                    onClick={() => handlePriceRangeChange(range.value)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${
                                        tempFilters.priceRange === range.value 
                                            ? 'bg-[#FF6B35] border-[#FF6B35] text-white' 
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Operating Hours */}
                    <div>
                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            Operating Hours
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {([
                                { value: 'any', label: 'Any Time' },
                                { value: 'morning', label: 'Morning' },
                                { value: 'afternoon', label: 'Afternoon' },
                                { value: 'evening', label: 'Evening' }
                            ] as const).map(hours => (
                                <button
                                    key={hours.value}
                                    onClick={() => handleOperatingHoursChange(hours.value)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${
                                        tempFilters.operatingHours === hours.value 
                                            ? 'bg-[#FF6B35] border-[#FF6B35] text-white' 
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {hours.label}
                                </button>
                            ))}
                        </div>
                    </div>
                                        
                    {/* Toggles */}
                    <div className="space-y-2 !mt-8">
                        <label htmlFor="trainer-availability-toggle" className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center">
                                <Users className="w-5 h-5 mr-3 text-blue-500"/>
                                <span className="font-semibold text-gray-700">Trainers Available</span>
                            </div>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    id="trainer-availability-toggle" 
                                    className="sr-only peer" 
                                    checked={tempFilters.trainerAvailability} 
                                    onChange={() => handleToggleChange('trainerAvailability')} 
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B35]"></div>
                            </div>
                        </label>
                    </div>

                </div>
                
                {/* Footer */}
                <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-6 bg-gray-50 border-t border-gray-200 shadow-lg">
                    <button
                        onClick={() => onApplyFilters(tempFilters)}
                        className="w-full bg-[#FF6B35] text-white font-medium py-2.5 rounded-md transition-all duration-200 shadow-sm hover:bg-orange-600 text-sm"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VenueFilterModal;

