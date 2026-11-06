import React, { useState } from 'react';
import { HCMC_DISTRICTS } from '../constants';
import { Check, Search } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Input } from '@/src/components/ui/input';
import { FilterSheet } from './FilterModal';

interface DistrictFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDistrict: (district: string) => void;
  currentDistrict: string;
}

const ALL_DISTRICTS = 'All Districts';

const DistrictFilterModal: React.FC<DistrictFilterModalProps> = ({ isOpen, onClose, onSelectDistrict, currentDistrict }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDistricts = HCMC_DISTRICTS.filter((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));
  const options = [ALL_DISTRICTS, ...filteredDistricts];

  return (
    <FilterSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Select district"
      bodyClassName="p-0 md:p-0 space-y-0"
      headerExtra={
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a district..."
            aria-label="Search for a district"
            className="rounded-xl bg-muted pl-10"
          />
        </div>
      }
    >
      <ul role="listbox" aria-label="Districts" className="divide-y divide-border">
        {options.map((district) => {
          const isSelected = currentDistrict === district;
          return (
            <li key={district}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectDistrict(district)}
                className={cn(
                  'flex w-full items-center justify-between px-5 py-3 text-left text-sm font-medium transition-colors focus-visible:bg-muted focus-visible:outline-none',
                  isSelected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/50'
                )}
              >
                {district}
                {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
    </FilterSheet>
  );
};

export default DistrictFilterModal;
