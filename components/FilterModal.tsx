import React, { useState, useEffect } from 'react';
import { FITNESS_ACTIVITIES, HCMC_DISTRICTS, CLASS_TYPES } from '../constants';
import { X, ShieldCheck, Star, Check, Crown } from 'lucide-react';
import { ClassType } from '../types';

type Filters = {
    specialty: string[];
    verified: boolean;
    topRated: boolean;
    premiumOnly: boolean;
    district: string;
    time: 'any' | 'morning' | 'afternoon' | 'evening';
    classType: ClassType[];
};

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeFilters: Filters;
    onApplyFilters: (newFilters: Filters) => void;
    onResetFilters: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, activeFilters, onApplyFilters, onResetFilters }) => {
    const [tempFilters, setTempFilters] = useState(activeFilters);

    useEffect(() => {
        setTempFilters(activeFilters);
    }, [activeFilters, isOpen]);

    const handleToggleChange = (filterName: 'verified' | 'topRated' | 'premiumOnly') => {
        setTempFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
    };

    const handleSpecialtyToggle = (specialty: string) => {
        setTempFilters(prev => {
            const currentSpecialties = prev.specialty;
            const isSelected = currentSpecialties.includes(specialty);
            
            if (isSelected) {
                return { ...prev, specialty: currentSpecialties.filter(s => s !== specialty) };
            } else if (currentSpecialties.length < 3) {
                return { ...prev, specialty: [...currentSpecialties, specialty] };
            }
            return prev; // At limit, do nothing
        });
    };

     const handleClassTypeToggle = (type: ClassType) => {
        setTempFilters(prev => {
            const currentTypes = prev.classType;
            if (currentTypes.includes(type)) {
                return { ...prev, classType: currentTypes.filter(t => t !== type) };
            } else {
                return { ...prev, classType: [...currentTypes, type] };
            }
        });
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTempFilters(prev => ({...prev, [name]: value }));
    };

    const handleTimeChange = (time: Filters['time']) => {
        setTempFilters(prev => ({...prev, time}));
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
                     {/* Specialty */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-base font-bold text-slate-800">Specialty</h3>
                            <p className="text-sm text-slate-500">{tempFilters.specialty.length} / 3 selected</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {FITNESS_ACTIVITIES.map(activity => {
                                const isSelected = tempFilters.specialty.includes(activity);
                                const isDisabled = !isSelected && tempFilters.specialty.length >= 3;
                                return (
                                    <button
                                        type="button"
                                        key={activity}
                                        onClick={() => handleSpecialtyToggle(activity)}
                                        disabled={isDisabled}
                                        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors border ${
                                            isSelected 
                                                ? 'bg-[#FF6B35] border-[#FF6B35] text-white' 
                                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {activity}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <h3 className="text-base font-bold text-slate-800 mb-3">Location (District)</h3>
                        <select
                            name="district"
                            value={tempFilters.district}
                            onChange={handleSelectChange}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] bg-white text-slate-800"
                        >
                            <option value="All">All Districts</option>
                            {HCMC_DISTRICTS.map(district => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                    </div>

                    {/* Time of Day */}
                    <div>
                        <h3 className="text-base font-bold text-slate-800 mb-3">Time of Day</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {(['any', 'morning', 'afternoon', 'evening'] as const).map(time => (
                                <button
                                    key={time}
                                    onClick={() => handleTimeChange(time)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${tempFilters.time === time ? 'bg-[#FF6B35] border-[#FF6B35] text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                                >
                                    {time === 'any' ? 'Any Time' : time.charAt(0).toUpperCase() + time.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                     {/* Class Environment */}
                    <div>
                        <h3 className="text-base font-bold text-slate-800 mb-3">Class Environment</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {CLASS_TYPES.map(type => {
                                const isSelected = tempFilters.classType.includes(type);
                                return (
                                <button
                                    key={type}
                                    onClick={() => handleClassTypeToggle(type)}
                                    className={`px-4 py-3 flex items-center justify-center text-sm font-semibold rounded-lg transition-colors border ${isSelected ? 'bg-[#FF6B35] border-[#FF6B35] text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                                >
                                    {isSelected && <Check className="w-4 h-4 mr-2" strokeWidth={3} />}
                                    {type}
                                </button>
                            )})}
                        </div>
                    </div>
                                        
                    {/* Toggles */}
                    <div className="space-y-2 !mt-8">
                        <label htmlFor="verified-toggle" className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                            <div className="flex items-center">
                                <ShieldCheck className="w-5 h-5 mr-3 text-blue-500"/>
                                <span className="font-semibold text-slate-700">Verified Trainers</span>
                            </div>
                            <div className="relative">
                                <input type="checkbox" id="verified-toggle" className="sr-only peer" checked={tempFilters.verified} onChange={() => handleToggleChange('verified')} />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B35]"></div>
                            </div>
                        </label>
                         <label htmlFor="toprated-toggle" className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                            <div className="flex items-center">
                                <Star className="w-5 h-5 mr-3 text-amber-400"/>
                                <span className="font-semibold text-slate-700">Top Rated (4.8+)</span>
                            </div>
                            <div className="relative">
                                <input type="checkbox" id="toprated-toggle" className="sr-only peer" checked={tempFilters.topRated} onChange={() => handleToggleChange('topRated')} />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                            </div>
                        </label>
                        <label htmlFor="premium-toggle" className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                            <div className="flex items-center">
                                <Crown className="w-5 h-5 mr-3 text-amber-500"/>
                                <span className="font-semibold text-slate-700">Premium Trainers</span>
                            </div>
                            <div className="relative">
                                <input type="checkbox" id="premium-toggle" className="sr-only peer" checked={tempFilters.premiumOnly} onChange={() => handleToggleChange('premiumOnly')} />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
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

export default FilterModal;