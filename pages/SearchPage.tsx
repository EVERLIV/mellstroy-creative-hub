import React, { useState, useMemo } from 'react';
import { Trainer, Class, ClassType, UserRole } from '../types';
import { Search, SlidersHorizontal } from 'lucide-react';
import ViewToggle from '../components/ViewToggle';
import TrainerGrid from '../components/TrainerGrid';
import TrainerDetailPage from '../components/TrainerDetailPage';
import FilterModal from '../components/FilterModal';

interface SearchPageProps {
    trainers: Trainer[];
    onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
    onOpenChat: (trainer: Trainer) => void;
}

const initialFilters = {
    specialty: [] as string[],
    verified: false,
    topRated: false,
    district: 'All',
    time: 'any' as const,
    classType: [] as ClassType[],
};

const SearchPage: React.FC<SearchPageProps> = ({ trainers, onInitiateBooking, onOpenChat }) => {
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState(initialFilters);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const filteredTrainers = useMemo(() => {
        const checkTime = (classTime: string, filterTime: string): boolean => {
            if (filterTime === 'any') return true;
            const hour = parseInt(classTime.split(':')[0], 10);
            if (filterTime === 'morning') return hour >= 6 && hour < 12;
            if (filterTime === 'afternoon') return hour >= 12 && hour < 17;
            if (filterTime === 'evening') return hour >= 17 && hour < 22;
            return false;
        };

        return trainers.filter(trainer => {
            // 1. Search Query Filter
            const query = searchQuery.toLowerCase();
            if (query) {
                const nameMatch = trainer.name.toLowerCase().includes(query);
                const specialtySearchMatch = trainer.specialty.some(s => s.toLowerCase().includes(query));
                if (!nameMatch && !specialtySearchMatch) {
                    return false;
                }
            }

            // 2. Trainer-level Filters
            if (activeFilters.verified && trainer.verificationStatus !== 'verified') {
                return false;
            }
            if (activeFilters.topRated && trainer.rating < 4.8) {
                return false;
            }
            if (activeFilters.district !== 'All' && trainer.location !== activeFilters.district) {
                return false;
            }
            if (activeFilters.specialty.length > 0) {
                const specialtyMatch = trainer.specialty.some(s => activeFilters.specialty.includes(s));
                if (!specialtyMatch) return false;
            }

            // 3. Class-level Filters
            const timeFilterActive = activeFilters.time !== 'any';
            const classTypeFilterActive = activeFilters.classType.length > 0;
            if (!timeFilterActive && !classTypeFilterActive) {
                return true; // No class filters, trainer passes
            }

            const hasMatchingClass = trainer.classes.some(cls => {
                const timeMatch = timeFilterActive 
                    ? (cls.schedule ? checkTime(cls.schedule.time, activeFilters.time) : false)
                    : true;
                const classTypeMatch = classTypeFilterActive 
                    ? activeFilters.classType.includes(cls.classType) 
                    : true;
                return timeMatch && classTypeMatch;
            });

            return hasMatchingClass;
        });
    }, [trainers, searchQuery, activeFilters]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (activeFilters.specialty.length > 0) count++;
        if (activeFilters.district !== 'All') count++;
        if (activeFilters.time !== 'any') count++;
        if (activeFilters.verified) count++;
        if (activeFilters.topRated) count++;
        if (activeFilters.classType.length > 0) count++;
        return count;
    }, [activeFilters]);
    
    const handleSelectTrainer = (trainer: Trainer) => {
        setSelectedTrainer(trainer);
    };

    const handleBackToList = () => {
        setSelectedTrainer(null);
    };
    
    const handleApplyFilters = (newFilters: typeof initialFilters) => {
        setActiveFilters(newFilters);
        setIsFilterModalOpen(false);
    };
    
    const handleResetFilters = () => {
        setActiveFilters(initialFilters);
        setIsFilterModalOpen(false);
    };


    if (selectedTrainer) {
        return (
            <TrainerDetailPage 
                trainer={selectedTrainer} 
                onBack={handleBackToList}
                onInitiateBooking={onInitiateBooking}
                // Dummy props - SearchPage doesn't manage these states
                userRole="student" 
                currentUserId=""
                isFavorite={false}
                onToggleFavorite={() => {}}
                onOpenReviewsModal={() => {}}
            />
        );
    }
    
    return (
        <div className="bg-slate-100 h-screen flex flex-col overflow-hidden">
            <div className="bg-white z-10 shadow-sm p-4 flex-shrink-0">
                 <h1 className="text-xl font-bold text-slate-800 text-center mb-4">Find Your Coach</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or specialty..."
                        className="w-full h-12 pl-10 pr-4 bg-slate-100 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                <div className="mb-4 flex justify-between items-center">
                    <button onClick={() => setIsFilterModalOpen(true)} className="relative flex items-center space-x-2 bg-white border border-slate-300 hover:bg-slate-100 transition-colors px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 shadow-sm active:scale-95">
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B35] text-white text-[10px] font-bold animate-scale-in">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    <p className="text-sm font-semibold text-slate-700">{filteredTrainers.length} results</p>
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                </div>
                
                {filteredTrainers.length > 0 ? (
                    <TrainerGrid 
                        trainers={filteredTrainers} 
                        viewMode={viewMode} 
                        onSelectTrainer={handleSelectTrainer} 
                        // Dummy props
                        isLoading={false}
                        favoriteTrainerIds={[]}
                        onToggleFavorite={() => {}}
                    />
                ) : (
                     <div className="text-center mt-16">
                        <Search className="w-16 h-16 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700 mt-4">No Trainers Found</p>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters to find what you're looking for.</p>
                     </div>
                )}
                </div>
            </div>

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                activeFilters={activeFilters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
            />
        </div>
    );
};

export default SearchPage;