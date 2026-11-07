import React, { useEffect, useState, type ReactNode } from 'react';
import { Crown, ShieldCheck, Star, type LucideIcon } from 'lucide-react';
import { FITNESS_ACTIVITIES, HCMC_DISTRICTS, CLASS_TYPES } from '../constants';
import { ClassType } from '../types';
import { cn } from '@/src/lib/utils';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '@/src/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Switch } from '@/src/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';

/* ------------------------------------------------------------------ */
/* Shared filter shell (Venue + District modals reuse this)            */
/* ------------------------------------------------------------------ */

const RESPONSIVE_SHEET_CLASS =
  'bottom-0 left-0 top-auto flex h-[92dvh] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-b-none rounded-t-2xl border-x-0 border-b-0 p-0 sm:rounded-b-none sm:rounded-t-2xl md:bottom-auto md:left-[50%] md:top-[50%] md:h-auto md:max-h-[85vh] md:max-w-lg md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-xl md:border';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onReset?: () => void;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
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
      <DialogContent className={RESPONSIVE_SHEET_CLASS}>
        <DialogHeader className="shrink-0 gap-3 border-b p-4 pr-12 text-left">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>{title}</DialogTitle>
            {onReset ? (
              <Button type="button" variant="outline" size="sm" onClick={onReset}>
                Reset
              </Button>
            ) : null}
          </div>
          <DialogDescription className="sr-only">
            Refine coaches and classes by specialty, location, schedule, and more.
          </DialogDescription>
          {headerExtra}
        </DialogHeader>
        <div className={cn('min-h-0 flex-1 overflow-y-auto p-4 md:p-6', bodyClassName)}>
          {children}
        </div>
        {footer ? (
          <DialogFooter className="shrink-0 border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-col sm:space-x-0 md:pb-4">
            {footer}
          </DialogFooter>
        ) : null}
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
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Field>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel className="flex items-center gap-2">
          {Icon ? <Icon className="text-muted-foreground" aria-hidden /> : null}
          {title}
        </FieldLabel>
        {meta ? <FieldDescription className="!mt-0 text-xs">{meta}</FieldDescription> : null}
      </div>
      <FieldContent>{children}</FieldContent>
    </Field>
  );
}

export function ChoiceChip({
  selected,
  onClick,
  disabled,
  shape = 'tile',
  showCheck: _showCheck,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  shape?: 'pill' | 'tile';
  showCheck?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={selected ? 'default' : 'outline'}
      size="sm"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(shape === 'pill' && 'rounded-full', 'h-9')}
    >
      {children}
    </Button>
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
    <Field orientation="horizontal" className="rounded-lg px-2 py-1.5 hover:bg-muted">
      <FieldLabel htmlFor={id} className="flex flex-1 cursor-pointer items-center gap-3">
        <Icon className="text-primary" aria-hidden />
        <FieldTitle>{label}</FieldTitle>
      </FieldLabel>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </Field>
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

const timeLabel = (time: Filters['time']) =>
  time === 'any' ? 'Any time' : time.charAt(0).toUpperCase() + time.slice(1);

const EMPTY_FILTERS: Filters = {
  specialty: [],
  verified: false,
  topRated: false,
  premiumOnly: false,
  district: 'All',
  time: 'any',
  classType: [],
  languages: [],
  level: '',
};

const chipGroupClass =
  'flex h-auto w-full flex-wrap justify-start gap-2 data-[variant=outline]:bg-transparent';

const chipItemClass =
  'h-9 flex-none rounded-full px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90';

const tileItemClass =
  'h-10 flex-1 basis-[calc(50%-0.25rem)] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 sm:basis-auto';

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  activeFilters,
  onApplyFilters,
  onResetFilters,
}) => {
  const [tempFilters, setTempFilters] = useState(activeFilters);

  useEffect(() => {
    if (isOpen) setTempFilters(activeFilters);
  }, [activeFilters, isOpen]);

  const handleReset = () => {
    setTempFilters(EMPTY_FILTERS);
    onResetFilters();
  };

  const handleSpecialtyChange = (values: string[]) => {
    if (values.length > MAX_SPECIALTIES) return;
    setTempFilters((prev) => ({ ...prev, specialty: values }));
  };

  return (
    <FilterSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      onReset={handleReset}
      footer={
        <Button type="button" size="lg" className="w-full" onClick={() => onApplyFilters(tempFilters)}>
          Apply filters
        </Button>
      }
    >
      <FieldGroup className="gap-6">
        <FieldSet>
          <div className="mb-3 flex items-center justify-between gap-2">
            <FieldLegend variant="label">Specialty</FieldLegend>
            <Badge variant="secondary" className="font-normal tabular-nums">
              {tempFilters.specialty.length} / {MAX_SPECIALTIES} selected
            </Badge>
          </div>
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={tempFilters.specialty}
            onValueChange={handleSpecialtyChange}
            className={chipGroupClass}
            aria-label="Specialty"
          >
            {FITNESS_ACTIVITIES.map((activity) => {
              const selected = tempFilters.specialty.includes(activity);
              const atLimit = !selected && tempFilters.specialty.length >= MAX_SPECIALTIES;
              return (
                <ToggleGroupItem
                  key={activity}
                  value={activity}
                  disabled={atLimit}
                  className={chipItemClass}
                >
                  {activity}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </FieldSet>

        <Field>
          <FieldLabel>Location (district)</FieldLabel>
          <Select
            value={tempFilters.district}
            onValueChange={(district) => setTempFilters((prev) => ({ ...prev, district }))}
          >
            <SelectTrigger aria-label="District">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="All">All Districts</SelectItem>
                {HCMC_DISTRICTS.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Time of day</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={tempFilters.time}
            onValueChange={(value) => {
              if (!value) return;
              setTempFilters((prev) => ({
                ...prev,
                time: value as Filters['time'],
              }));
            }}
            className="grid w-full grid-cols-2 gap-2"
            aria-label="Time of day"
          >
            {TIMES.map((time) => (
              <ToggleGroupItem key={time} value={time} className={tileItemClass}>
                {timeLabel(time)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field>
          <FieldLabel>Class environment</FieldLabel>
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={tempFilters.classType}
            onValueChange={(values) =>
              setTempFilters((prev) => ({ ...prev, classType: values as ClassType[] }))
            }
            className="grid w-full grid-cols-3 gap-2"
            aria-label="Class environment"
          >
            {CLASS_TYPES.map((type) => (
              <ToggleGroupItem key={type} value={type} className={tileItemClass}>
                {type}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field>
          <FieldLabel>Language</FieldLabel>
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={tempFilters.languages}
            onValueChange={(languages) => setTempFilters((prev) => ({ ...prev, languages }))}
            className="grid w-full grid-cols-2 gap-2"
            aria-label="Language"
          >
            {LANGUAGES.map((lang) => (
              <ToggleGroupItem key={lang} value={lang} className={tileItemClass}>
                {lang}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field>
          <FieldLabel>Difficulty level</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={tempFilters.level || undefined}
            onValueChange={(level) =>
              setTempFilters((prev) => ({ ...prev, level: level || '' }))
            }
            className="grid w-full grid-cols-3 gap-2"
            aria-label="Difficulty level"
          >
            {LEVELS.map((lvl) => (
              <ToggleGroupItem key={lvl} value={lvl} className={tileItemClass}>
                {lvl}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <FieldSeparator />

        <FieldSet className="gap-1">
          <FieldLegend variant="label" className="sr-only">
            Trust & quality
          </FieldLegend>
          <ToggleRow
            id="verified-toggle"
            icon={ShieldCheck}
            label="Verified trainers"
            checked={tempFilters.verified}
            onCheckedChange={() =>
              setTempFilters((prev) => ({ ...prev, verified: !prev.verified }))
            }
          />
          <ToggleRow
            id="toprated-toggle"
            icon={Star}
            label="Top rated (4.8+)"
            checked={tempFilters.topRated}
            onCheckedChange={() =>
              setTempFilters((prev) => ({ ...prev, topRated: !prev.topRated }))
            }
          />
          <ToggleRow
            id="premium-toggle"
            icon={Crown}
            label="Premium trainers"
            checked={tempFilters.premiumOnly}
            onCheckedChange={() =>
              setTempFilters((prev) => ({ ...prev, premiumOnly: !prev.premiumOnly }))
            }
          />
        </FieldSet>
      </FieldGroup>
    </FilterSheet>
  );
};

export default FilterModal;
