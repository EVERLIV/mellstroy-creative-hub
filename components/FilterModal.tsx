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
    languages: string[];
    level: string;
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
            className="fixed inset-0 bg-background z-[100] animate-fade-in"
            role="dialog"
            aria-modal="true"
        >
            <div 
<<<<<<< HEAD
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
=======
                className="w-full h-full flex flex-col bg-card"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0 bg-muted">
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-muted/80 transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <h2 className="text-base font-semibold text-foreground">Filters</h2>
                    <button onClick={handleReset} className="font-medium text-muted-foreground hover:text-foreground text-sm px-2 py-1">Reset</button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-32 bg-card">
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
                     {/* Specialty */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-base font-bold text-foreground">Specialty</h3>
                            <p className="text-sm text-muted-foreground">{tempFilters.specialty.length} / 3 selected</p>
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
<<<<<<< HEAD
                                                ? 'bg-[#FF6B35] border-[#FF6B35] text-white' 
                                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
=======
                                                ? 'bg-primary border-primary text-primary-foreground' 
                                                : 'bg-card border-border text-foreground hover:bg-muted'
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
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
                        <h3 className="text-base font-bold text-foreground mb-3">Location (District)</h3>
                        <select
                            name="district"
                            value={tempFilters.district}
                            onChange={handleSelectChange}
<<<<<<< HEAD
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] bg-white text-slate-800"
=======
                            className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
                        >
                            <option value="All">All Districts</option>
                            {HCMC_DISTRICTS.map(district => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                    </div>

                    {/* Time of Day */}
                    <div>
                        <h3 className="text-base font-bold text-foreground mb-3">Time of Day</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {(['any', 'morning', 'afternoon', 'evening'] as const).map(time => (
                                <button
                                    key={time}
                                    onClick={() => handleTimeChange(time)}
<<<<<<< HEAD
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${tempFilters.time === time ? 'bg-[#FF6B35] border-[#FF6B35] text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
=======
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${tempFilters.time === time ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border text-foreground hover:bg-muted'}`}
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
                                >
                                    {time === 'any' ? 'Any Time' : time.charAt(0).toUpperCase() + time.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                     {/* Class Environment */}
                    <div>
                        <h3 className="text-base font-bold text-foreground mb-3">Class Environment</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {CLASS_TYPES.map(type => {
                                const isSelected = tempFilters.classType.includes(type);
                                return (
                                <button
                                    key={type}
                                    onClick={() => handleClassTypeToggle(type)}
<<<<<<< HEAD
                                    className={`px-4 py-3 flex items-center justify-center text-sm font-semibold rounded-lg transition-colors border ${isSelected ? 'bg-[#FF6B35] border-[#FF6B35] text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
=======
                                    className={`px-4 py-3 flex items-center justify-center text-sm font-semibold rounded-lg transition-colors border ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border text-foreground hover:bg-muted'}`}
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
                                >
                                    {isSelected && <Check className="w-4 h-4 mr-2" strokeWidth={3} />}
                                    {type}
                                </button>
                            )})}
                        </div>
                    </div>
                                        
                    {/* Language */}
                    <div>
                        <h3 className="text-base font-bold text-foreground mb-3">Language</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {['English', 'Vietnamese', 'Russian', 'Chinese'].map(lang => {
                                const isSelected = tempFilters.languages.includes(lang);
                                return (
                                    <button
                                        key={lang}
                                        onClick={() => {
                                            setTempFilters(prev => ({
                                                ...prev,
                                                languages: isSelected
                                                    ? prev.languages.filter(l => l !== lang)
                                                    : [...prev.languages, lang]
                                            }));
                                        }}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border text-foreground hover:bg-muted'}`}
                                    >
                                        {isSelected && <Check className="w-4 h-4 mr-1.5 inline" strokeWidth={3} />}
                                        {lang}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Difficulty Level */}
                    <div>
                        <h3 className="text-base font-bold text-foreground mb-3">Difficulty Level</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => setTempFilters(prev => ({ ...prev, level: prev.level === lvl ? '' : lvl }))}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${tempFilters.level === lvl ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border text-foreground hover:bg-muted'}`}
                                >
                                    {tempFilters.level === lvl && <Check className="w-4 h-4 mr-1.5 inline" strokeWidth={3} />}
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>
                                        
                    {/* Toggles */}
                    <div className="space-y-2 !mt-8">
                        <label htmlFor="verified-toggle" className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-muted">
                            <div className="flex items-center">
                                <ShieldCheck className="w-5 h-5 mr-3 text-primary"/>
                                <span className="font-semibold text-foreground">Verified Trainers</span>
                            </div>
                            <div className="relative">
                                <input type="checkbox" id="verified-toggle" className="sr-only peer" checked={tempFilters.verified} onChange={() => handleToggleChange('verified')} />
<<<<<<< HEAD
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B35]"></div>
=======
                                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
                            </div>
                        </label>
                         <label htmlFor="toprated-toggle" className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-muted">
                            <div className="flex items-center">
                                <Star className="w-5 h-5 mr-3 text-primary"/>
                                <span className="font-semibold text-foreground">Top Rated (4.8+)</span>
                            </div>
                            <div className="relative">
                                <input type="checkbox" id="toprated-toggle" className="sr-only peer" checked={tempFilters.topRated} onChange={() => handleToggleChange('topRated')} />
                                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                        </label>
                        <label htmlFor="premium-toggle" className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-muted">
                            <div className="flex items-center">
                                <Crown className="w-5 h-5 mr-3 text-primary"/>
                                <span className="font-semibold text-foreground">Premium Trainers</span>
                            </div>
                            <div className="relative">
                                <input type="checkbox" id="premium-toggle" className="sr-only peer" checked={tempFilters.premiumOnly} onChange={() => handleToggleChange('premiumOnly')} />
                                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                        </label>
                    </div>

                </div>
                
                {/* Footer */}
<<<<<<< HEAD
                <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-6 bg-gray-50 border-t border-gray-200 shadow-lg">
                    <button
                        onClick={() => onApplyFilters(tempFilters)}
                        className="w-full bg-[#FF6B35] text-white font-medium py-2.5 rounded-md transition-all duration-200 shadow-sm hover:bg-orange-600 text-sm"
=======
                <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-6 bg-muted border-t border-border shadow-lg">
                    <button
                        onClick={() => onApplyFilters(tempFilters)}
                        className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-md transition-all duration-200 shadow-sm hover:bg-primary/90 text-sm"
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;