import React, { useState, useEffect } from 'react';
import { FITNESS_ACTIVITIES, HCMC_DISTRICTS, CLASS_TYPES } from '../constants';
import { X, ShieldCheck, Star, Check } from 'lucide-react';
import { ClassType } from '../types';

type Filters = {
    specialty: string[];
    verified: boolean;
    topRated: boolean;
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

    const handleToggleChange = (filterName: 'verified' | 'topRated') => {
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
            className="fixed inset-0 bg-white z-50 animate-fade-in"
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="w-full h-full flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                    <h2 className="text-lg font-bold text-slate-800">Filters</h2>
                    <button onClick={handleReset} className="font-semibold text-slate-600 hover:text-slate-900 text-sm px-2 py-1">Reset</button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
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
                                            ? 'bg-blue-600 border-blue-600 text-white' 
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
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
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
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${tempFilters.time === time ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
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
                                    className={`px-4 py-3 flex items-center justify-center text-sm font-semibold rounded-lg transition-colors border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
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
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
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
                    </div>

                </div>
                
                {/* Footer */}
                <div className="px-4 pt-4 bg-white border-t border-gray-200 flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <button
                        onClick={() => onApplyFilters(tempFilters)}
                        className="w-full bg-[#FF6B35] text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;