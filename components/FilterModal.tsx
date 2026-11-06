import React, { useState, useEffect } from 'react';
import { FITNESS_ACTIVITIES, HCMC_DISTRICTS, CLASS_TYPES } from '../constants';
import { ShieldCheck, Star, Check, Crown, type LucideIcon } from 'lucide-react';
import { ClassType } from '../types';
import { cn } from '@/src/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { NativeSelect } from '@/src/components/ui/native-select';
import { Switch } from '@/src/components/ui/switch';

/* ------------------------------------------------------------------ */
/* Shared filter building blocks (also used by VenueFilterModal and    */
/* DistrictFilterModal)                                                */
/* ------------------------------------------------------------------ */

/** Bottom sheet on phones, centered dialog on md+. */
const RESPONSIVE_SHEET_CLASS =
  'bottom-0 left-0 top-auto flex h-[92dvh] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-b-none rounded-t-2xl border-x-0 border-b-0 p-0 sm:rounded-b-none sm:rounded-t-2xl md:bottom-auto md:left-[50%] md:top-[50%] md:h-auto md:max-h-[85vh] md:max-w-lg md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-xl md:border';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onReset?: () => void;
  /** Rendered under the title row, outside the scroll area (e.g. a search field). */
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  bodyClassName?: string;
  children: React.ReactNode;
}

export function FilterSheet({
  isOpen,
  onClose,
  title,
  onReset,
  headerExtra,
  footer,
  bodyClassName,
  children,
}: FilterSheetProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={RESPONSIVE_SHEET_CLASS} aria-describedby={undefined}>
        <DialogHeader className="shrink-0 space-y-3 border-b border-border p-4 pr-12 text-left">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
            {onReset && (
              <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
                Reset
              </Button>
            )}
          </div>
          {headerExtra}
        </DialogHeader>
        <div className={cn('flex-1 space-y-6 overflow-y-auto p-4 md:p-6', bodyClassName)}>{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-border bg-background p-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] md:pb-4">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function FilterGroup({
  title,
  icon: Icon,
  meta,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <div className="mb-3 flex items-center justify-between gap-2">
        <legend className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          {title}
        </legend>
        {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
      </div>
      {children}
    </fieldset>
  );
}

interface ChoiceChipProps {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  shape?: 'pill' | 'tile';
  showCheck?: boolean;
  children: React.ReactNode;
}

export function ChoiceChip({ selected, onClick, disabled, shape = 'tile', showCheck, children }: ChoiceChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-1.5 border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        shape === 'pill' ? 'rounded-full' : 'rounded-lg',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:bg-muted'
      )}
    >
      {showCheck && selected && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function ToggleRow({
  id,
  icon: Icon,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
    >
      <span className="flex items-center gap-3 text-sm font-medium text-foreground">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        {label}
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Trainer filters                                                     */
/* ------------------------------------------------------------------ */

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

const MAX_SPECIALTIES = 3;
const TIMES = ['any', 'morning', 'afternoon', 'evening'] as const;
const LANGUAGES = ['English', 'Vietnamese', 'Russian', 'Chinese'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const timeLabel = (time: Filters['time']) => (time === 'any' ? 'Any time' : time.charAt(0).toUpperCase() + time.slice(1));

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, activeFilters, onApplyFilters, onResetFilters }) => {
  const [tempFilters, setTempFilters] = useState(activeFilters);

  useEffect(() => {
    setTempFilters(activeFilters);
  }, [activeFilters, isOpen]);

  const handleToggleChange = (filterName: 'verified' | 'topRated' | 'premiumOnly') => {
    setTempFilters((prev) => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setTempFilters((prev) => {
      const current = prev.specialty;
      if (current.includes(specialty)) {
        return { ...prev, specialty: current.filter((s) => s !== specialty) };
      }
      if (current.length < MAX_SPECIALTIES) {
        return { ...prev, specialty: [...current, specialty] };
      }
      return prev; // At limit, do nothing
    });
  };

  const handleClassTypeToggle = (type: ClassType) => {
    setTempFilters((prev) => ({
      ...prev,
      classType: prev.classType.includes(type) ? prev.classType.filter((t) => t !== type) : [...prev.classType, type],
    }));
  };

  const handleLanguageToggle = (lang: string) => {
    setTempFilters((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang) ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang],
    }));
  };

  return (
    <FilterSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      onReset={onResetFilters}
      footer={
        <Button onClick={() => onApplyFilters(tempFilters)} className="w-full" size="lg">
          Apply filters
        </Button>
      }
    >
      <FilterGroup title="Specialty" meta={`${tempFilters.specialty.length} / ${MAX_SPECIALTIES} selected`}>
        <div className="flex flex-wrap gap-2">
          {FITNESS_ACTIVITIES.map((activity) => {
            const isSelected = tempFilters.specialty.includes(activity);
            return (
              <ChoiceChip
                key={activity}
                shape="pill"
                selected={isSelected}
                disabled={!isSelected && tempFilters.specialty.length >= MAX_SPECIALTIES}
                onClick={() => handleSpecialtyToggle(activity)}
              >
                {activity}
              </ChoiceChip>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Location (district)">
        <NativeSelect
          aria-label="District"
          name="district"
          value={tempFilters.district}
          onChange={(e) => setTempFilters((prev) => ({ ...prev, district: e.target.value }))}
        >
          <option value="All">All Districts</option>
          {HCMC_DISTRICTS.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </NativeSelect>
      </FilterGroup>

      <FilterGroup title="Time of day">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2">
          {TIMES.map((time) => (
            <ChoiceChip
              key={time}
              selected={tempFilters.time === time}
              onClick={() => setTempFilters((prev) => ({ ...prev, time }))}
            >
              {timeLabel(time)}
            </ChoiceChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Class environment">
        <div className="grid grid-cols-3 gap-2">
          {CLASS_TYPES.map((type) => (
            <ChoiceChip
              key={type}
              showCheck
              selected={tempFilters.classType.includes(type)}
              onClick={() => handleClassTypeToggle(type)}
            >
              {type}
            </ChoiceChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Language">
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => (
            <ChoiceChip
              key={lang}
              showCheck
              selected={tempFilters.languages.includes(lang)}
              onClick={() => handleLanguageToggle(lang)}
            >
              {lang}
            </ChoiceChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Difficulty level">
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((lvl) => (
            <ChoiceChip
              key={lvl}
              showCheck
              selected={tempFilters.level === lvl}
              onClick={() => setTempFilters((prev) => ({ ...prev, level: prev.level === lvl ? '' : lvl }))}
            >
              {lvl}
            </ChoiceChip>
          ))}
        </div>
      </FilterGroup>

      <div className="space-y-1 border-t border-border pt-4">
        <ToggleRow
          id="verified-toggle"
          icon={ShieldCheck}
          label="Verified trainers"
          checked={tempFilters.verified}
          onCheckedChange={() => handleToggleChange('verified')}
        />
        <ToggleRow
          id="toprated-toggle"
          icon={Star}
          label="Top rated (4.8+)"
          checked={tempFilters.topRated}
          onCheckedChange={() => handleToggleChange('topRated')}
        />
        <ToggleRow
          id="premium-toggle"
          icon={Crown}
          label="Premium trainers"
          checked={tempFilters.premiumOnly}
          onCheckedChange={() => handleToggleChange('premiumOnly')}
        />
      </div>
    </FilterSheet>
  );
};

export default FilterModal;
