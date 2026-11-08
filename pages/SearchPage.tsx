import React, { useState, useMemo } from 'react';
import { Trainer, Class, ClassType, UserRole } from '../types';
import { Search, SlidersHorizontal } from 'lucide-react';
import ViewToggle from '../components/ViewToggle';
import TrainerGrid from '../components/TrainerGrid';
import TrainerDetailPage from '../components/TrainerDetailPage';
import FilterModal from '../components/FilterModal';
import { AppScreen } from '@/src/components/layout/screen';
import { StitchCanvas, StitchPageHeader, StitchPanel } from '@/src/components/layout/stitch-page';
import { EmptyState } from '../src/components/layout/states';
import { Button } from '../src/components/ui/button';
import { Input } from '../src/components/ui/input';

interface SearchPageProps {
  trainers: Trainer[];
  onInitiateBooking: (target: { trainer: Trainer; cls: Class }) => void;
  onOpenChat: (trainer: Trainer) => void;
  userRole?: UserRole;
  currentUserId?: string;
  favoriteTrainerIds?: string[];
  onToggleFavorite?: (trainerId: string) => void;
  onOpenReviewsModal?: (trainer: Trainer) => void;
}

const initialFilters = {
  specialty: [] as string[],
  verified: false,
  topRated: false,
  premiumOnly: false,
  district: 'All',
  time: 'any' as const,
  classType: [] as ClassType[],
  languages: [] as string[],
  level: '',
};

const SearchPage: React.FC<SearchPageProps> = ({
  trainers,
  onInitiateBooking,
  onOpenChat,
  userRole = 'student',
  currentUserId = '',
  favoriteTrainerIds = [],
  onToggleFavorite,
  onOpenReviewsModal,
}) => {
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

    return (trainers || []).filter((trainer) => {
      const specialty = trainer.specialty || [];
      const classes = trainer.classes || [];
      const query = searchQuery.toLowerCase();
      if (query) {
        const nameMatch = (trainer.name || '').toLowerCase().includes(query);
        const specialtySearchMatch = specialty.some((s) => s.toLowerCase().includes(query));
        if (!nameMatch && !specialtySearchMatch) return false;
      }

      if (activeFilters.verified && trainer.verificationStatus !== 'verified') return false;
      if (activeFilters.topRated && (trainer.rating || 0) < 4.8) return false;
      if (activeFilters.district !== 'All' && trainer.location !== activeFilters.district) return false;
      if (activeFilters.specialty.length > 0) {
        if (!specialty.some((s) => activeFilters.specialty.includes(s))) return false;
      }

      const timeFilterActive = activeFilters.time !== 'any';
      const classTypeFilterActive = activeFilters.classType.length > 0;
      if (!timeFilterActive && !classTypeFilterActive) return true;

      return classes.some((cls) => {
        const timeMatch = timeFilterActive
          ? cls.schedule
            ? checkTime(cls.schedule.time, activeFilters.time)
            : false
          : true;
        const classTypeMatch = classTypeFilterActive
          ? activeFilters.classType.includes(cls.classType)
          : true;
        return timeMatch && classTypeMatch;
      });
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

  if (selectedTrainer) {
    return (
      <TrainerDetailPage
        trainer={selectedTrainer}
        onBack={() => setSelectedTrainer(null)}
        onInitiateBooking={onInitiateBooking}
        userRole={userRole}
        currentUserId={currentUserId}
        isFavorite={favoriteTrainerIds.includes(selectedTrainer.id)}
        onToggleFavorite={onToggleFavorite || (() => {})}
        onOpenReviewsModal={onOpenReviewsModal || (() => {})}
      />
    );
  }

  return (
    <AppScreen className="min-w-0 bg-[#f9fafb] dark:bg-background">
      <StitchCanvas>
        <StitchPageHeader
          title="Search"
          description="Find your coach by name or specialty, then narrow down with filters"
          actions={<ViewToggle viewMode={viewMode} setViewMode={setViewMode} />}
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:max-w-xl">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or specialty..."
                aria-label="Search by name or specialty"
                className="h-11 rounded-xl bg-card pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsFilterModalOpen(true)}
              aria-label={
                activeFilterCount ? `Open filters (${activeFilterCount} active)` : 'Open filters'
              }
              className="h-11 shrink-0 gap-2 rounded-xl"
            >
              <SlidersHorizontal />
              <span className="hidden md:inline">Filters</span>
              {activeFilterCount > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
            {activeFilterCount > 0 ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setActiveFilters(initialFilters);
                  setIsFilterModalOpen(false);
                }}
                className="h-11 shrink-0 text-primary hover:text-primary/90"
              >
                Reset
              </Button>
            ) : null}
          </div>
        </StitchPageHeader>

        <StitchPanel className="p-4 md:p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground md:text-lg">Results</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {`${filteredTrainers.length} ${filteredTrainers.length === 1 ? 'trainer' : 'trainers'}`}
            </p>
          </div>
          {filteredTrainers.length > 0 ? (
            <TrainerGrid
              trainers={filteredTrainers}
              viewMode={viewMode}
              onSelectTrainer={setSelectedTrainer}
              isLoading={false}
              favoriteTrainerIds={favoriteTrainerIds}
              onToggleFavorite={onToggleFavorite || (() => {})}
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No trainers found"
              description="Try adjusting your search or filters to find what you're looking for."
              action={
                activeFilterCount > 0 ? (
                  <Button
                    variant="outline"
                    onClick={() => setActiveFilters(initialFilters)}
                    className="border-primary text-primary hover:text-primary/90"
                  >
                    Reset filters
                  </Button>
                ) : undefined
              }
            />
          )}
        </StitchPanel>
      </StitchCanvas>
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFilters={activeFilters}
        onApplyFilters={(next) => {
          setActiveFilters(next);
          setIsFilterModalOpen(false);
        }}
        onResetFilters={() => {
          setActiveFilters(initialFilters);
          setIsFilterModalOpen(false);
        }}
      />
    </AppScreen>
  );
};

export default SearchPage;
