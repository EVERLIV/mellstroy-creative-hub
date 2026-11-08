import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Crown, MapPin, Navigation, ShieldCheck, Star, Users } from 'lucide-react';
import { CLASS_TYPES, FITNESS_ACTIVITIES, HCMC_DISTRICTS } from '../../constants';
import type { ClassType } from '../../types';
import {
  countDiscoveryFilters,
  type DiscoveryFilters,
  EMPTY_DISCOVERY_FILTERS,
} from '@/src/lib/discovery-filters';
import {
  distancePresets,
  formatDistance,
  maxDistanceSlider,
  type DistanceUnit,
  unitToKm,
} from '@/src/lib/geo';
import { cn } from '@/src/lib/utils';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Field,
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
import { Slider } from '@/src/components/ui/slider';
import { Switch } from '@/src/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';

export type DiscoveryTarget = 'trainer' | 'class';

const MAX_SPECIALTIES = 3;
const TIMES = ['any', 'morning', 'afternoon', 'evening'] as const;
const LANGUAGES = ['English', 'Vietnamese', 'Russian', 'Chinese'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

/** Uniform chip: fixed height, equal padding, no ring stack on selected. */
const CHIP =
  'h-8 min-h-8 shrink-0 justify-center rounded-md border border-border/80 bg-card px-3 text-xs font-medium leading-none text-foreground shadow-none ' +
  'hover:bg-muted hover:text-foreground ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ' +
  'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground ' +
  'data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground ' +
  'data-[state=on]:shadow-none';

const CHIP_GRID = 'grid w-full gap-2 data-[variant=outline]:bg-transparent';
const CHIP_WRAP = 'flex w-full flex-wrap gap-2 data-[variant=outline]:bg-transparent';

const timeLabel = (time: DiscoveryFilters['time']) =>
  time === 'any' ? 'Any time' : time.charAt(0).toUpperCase() + time.slice(1);

function TrustToggle({
  id,
  icon: Icon,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <Field orientation="horizontal" className="items-center gap-3 rounded-md px-1 py-1.5">
      <FieldLabel htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <FieldTitle className="text-sm font-medium">{label}</FieldTitle>
      </FieldLabel>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </Field>
  );
}

export interface DiscoveryFilterPanelProps {
  filters: DiscoveryFilters;
  onChange: (next: DiscoveryFilters) => void;
  target: DiscoveryTarget;
  onTargetChange?: (target: DiscoveryTarget) => void;
  distanceUnit: DistanceUnit;
  onDistanceUnitChange?: (unit: DistanceUnit) => void;
  userLocation?: string | null;
  className?: string;
}

/**
 * Intent: athlete picks Trainer or Class, then narrows by distance + area + type-specific fields.
 * Hierarchy: Target → Distance → Area → type filters → Trust.
 * Sidebar grows with page scroll — no nested filter scrollport.
 */
export function DiscoveryFilterPanel({
  filters,
  onChange,
  target,
  onTargetChange,
  distanceUnit,
  onDistanceUnitChange,
  userLocation,
  className,
}: DiscoveryFilterPanelProps) {
  const navigate = useNavigate();
  const sliderMax = maxDistanceSlider(distanceUnit);
  const sliderValue = filters.maxDistance ?? sliderMax;
  const presets = distancePresets(distanceUnit);
  const activeCount = countDiscoveryFilters(filters);
  const isTrainer = target === 'trainer';

  const patch = (partial: Partial<DiscoveryFilters>) => onChange({ ...filters, ...partial });

  const handleTarget = (next: DiscoveryTarget) => {
    if (next === target) return;
    // Drop fields that don't apply to the other type
    if (next === 'trainer') {
      onChange({
        ...filters,
        time: 'any',
        classType: [],
        languages: [],
        level: '',
      });
    }
    onTargetChange?.(next);
    navigate(next === 'trainer' ? '/explore' : '/classes');
  };

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-pretty text-sm font-semibold tracking-tight text-foreground">
            Filters
          </h2>
          <p className="text-xs text-muted-foreground">
            {userLocation ? `From ${userLocation}` : 'Set your district in profile for distance'}
          </p>
        </div>
        {activeCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs"
            onClick={() => onChange(EMPTY_DISCOVERY_FILTERS)}
          >
            Reset
          </Button>
        ) : null}
      </div>

      {/* Target: Trainer | Class */}
      <FieldSet className="gap-2">
        <FieldLegend variant="label">Looking for</FieldLegend>
        <ToggleGroup
          type="single"
          value={target}
          onValueChange={(v) => {
            if (v === 'trainer' || v === 'class') handleTarget(v);
          }}
          className="grid w-full grid-cols-2 gap-2"
          aria-label="Filter target"
        >
          <ToggleGroupItem value="trainer" className={cn(CHIP, 'w-full gap-1.5')}>
            <Users className="size-3.5 shrink-0" aria-hidden />
            Trainer
          </ToggleGroupItem>
          <ToggleGroupItem value="class" className={cn(CHIP, 'w-full gap-1.5')}>
            <BookOpen className="size-3.5 shrink-0" aria-hidden />
            Class
          </ToggleGroupItem>
        </ToggleGroup>
      </FieldSet>

      <FieldGroup className="gap-5">
        {/* Shared: Distance */}
        <FieldSet className="gap-3">
          <div className="flex items-center justify-between gap-2">
            <FieldLegend variant="label" className="flex items-center gap-1.5">
              <Navigation className="size-3.5 text-muted-foreground" aria-hidden />
              Distance
            </FieldLegend>
            {onDistanceUnitChange ? (
              <ToggleGroup
                type="single"
                value={distanceUnit}
                onValueChange={(v) => {
                  if (v === 'km' || v === 'mi') onDistanceUnitChange(v);
                }}
                className="grid grid-cols-2 gap-1"
                aria-label="Distance unit"
              >
                <ToggleGroupItem value="km" className={cn(CHIP, 'min-w-[2.75rem] px-2')}>
                  km
                </ToggleGroupItem>
                <ToggleGroupItem value="mi" className={cn(CHIP, 'min-w-[2.75rem] px-2')}>
                  mi
                </ToggleGroupItem>
              </ToggleGroup>
            ) : (
              <Badge variant="secondary" className="font-normal tabular-nums">
                {distanceUnit}
              </Badge>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Within
              </span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {filters.maxDistance == null
                  ? 'Any'
                  : formatDistance(unitToKm(filters.maxDistance, distanceUnit), distanceUnit)}
              </span>
            </div>
            <Slider
              min={1}
              max={sliderMax}
              step={1}
              value={[sliderValue]}
              onValueChange={([v]) => patch({ maxDistance: v ?? null })}
              aria-label={`Maximum distance in ${distanceUnit}`}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  CHIP,
                  'touch-manipulation',
                  filters.maxDistance == null &&
                    'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                )}
                onClick={() => patch({ maxDistance: null })}
              >
                Any
              </button>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={cn(
                    CHIP,
                    'tabular-nums touch-manipulation',
                    filters.maxDistance === p &&
                      'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                  )}
                  onClick={() => patch({ maxDistance: p })}
                >
                  {p}
                  {distanceUnit}
                </button>
              ))}
            </div>
            {!userLocation ? (
              <FieldDescription className="text-[11px]">
                Add your district in profile so distance can target coaches near you.
              </FieldDescription>
            ) : null}
          </div>
        </FieldSet>

        {/* Shared: Area */}
        <Field>
          <FieldLabel htmlFor="discovery-area" className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
            Area / city
          </FieldLabel>
          <Select value={filters.district} onValueChange={(district) => patch({ district })}>
            <SelectTrigger id="discovery-area" name="district" aria-label="Area or city">
              <SelectValue placeholder="All areas…" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="All">All Ho Chi Minh City</SelectItem>
                {HCMC_DISTRICTS.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        {/* Price */}
        <FieldSet className="gap-2">
          <FieldLegend variant="label">Price (VND / hour)</FieldLegend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="priceMin"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Min…"
              aria-label="Minimum price"
              className="h-8 w-full rounded-md border border-border/80 bg-card px-2 text-xs tabular-nums"
              value={filters.priceMin ?? ''}
              onChange={(e) =>
                patch({
                  priceMin: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
            <span className="text-xs text-muted-foreground">–</span>
            <input
              type="number"
              name="priceMax"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Max…"
              aria-label="Maximum price"
              className="h-8 w-full rounded-md border border-border/80 bg-card px-2 text-xs tabular-nums"
              value={filters.priceMax ?? ''}
              onChange={(e) =>
                patch({
                  priceMax: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </div>
        </FieldSet>

        {/* Rating floor */}
        <Field>
          <FieldLabel>Minimum rating</FieldLabel>
          <ToggleGroup
            type="single"
            value={String(filters.ratingMin || 0)}
            onValueChange={(v) => {
              if (!v) return;
              const ratingMin = Number(v);
              patch({ ratingMin, topRated: ratingMin >= 4.8 });
            }}
            className={cn(CHIP_GRID, 'grid-cols-4')}
            aria-label="Minimum rating"
          >
            {[
              ['0', 'Any'],
              ['4', '4.0+'],
              ['4.5', '4.5+'],
              ['4.8', '4.8+'],
            ].map(([v, label]) => (
              <ToggleGroupItem key={v} value={v} className={cn(CHIP, 'w-full px-1')}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        {/* Availability / gender / online */}
        <FieldSet className="gap-1">
          <FieldLegend variant="label">Availability</FieldLegend>
          <TrustToggle
            id="disc-free-today"
            icon={Star}
            label="Free today"
            checked={filters.freeToday}
            onCheckedChange={() => patch({ freeToday: !filters.freeToday })}
          />
          <TrustToggle
            id="disc-online"
            icon={Navigation}
            label="Online now"
            checked={filters.onlineNow}
            onCheckedChange={() => patch({ onlineNow: !filters.onlineNow })}
          />
        </FieldSet>

        {isTrainer ? (
          <Field>
            <FieldLabel>Gender</FieldLabel>
            <ToggleGroup
              type="single"
              value={filters.gender}
              onValueChange={(v) => {
                if (!v) return;
                patch({ gender: v as DiscoveryFilters['gender'] });
              }}
              className={cn(CHIP_GRID, 'grid-cols-2')}
              aria-label="Coach gender"
            >
              {(
                [
                  ['any', 'Any'],
                  ['female', 'Female'],
                  ['male', 'Male'],
                  ['other', 'Other'],
                ] as const
              ).map(([v, label]) => (
                <ToggleGroupItem key={v} value={v} className={cn(CHIP, 'w-full')}>
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        ) : null}

        <FieldSeparator />

        {/* Specialty — both, but label differs */}
        <FieldSet>
          <div className="mb-2 flex items-center justify-between gap-2">
            <FieldLegend variant="label">
              {isTrainer ? 'Coach specialty' : 'Class discipline'}
            </FieldLegend>
            <Badge variant="secondary" className="font-normal tabular-nums">
              {filters.specialty.length}/{MAX_SPECIALTIES}
            </Badge>
          </div>
          <ToggleGroup
            type="multiple"
            value={filters.specialty}
            onValueChange={(values) => {
              if (values.length > MAX_SPECIALTIES) return;
              patch({ specialty: values });
            }}
            className={CHIP_WRAP}
            aria-label={isTrainer ? 'Coach specialty' : 'Class discipline'}
          >
            {FITNESS_ACTIVITIES.map((activity) => {
              const selected = filters.specialty.includes(activity);
              const atLimit = !selected && filters.specialty.length >= MAX_SPECIALTIES;
              return (
                <ToggleGroupItem
                  key={activity}
                  value={activity}
                  disabled={atLimit}
                  className={CHIP}
                >
                  {activity}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </FieldSet>

        {/* Class-only targeting */}
        {!isTrainer ? (
          <>
            <Field>
              <FieldLabel>Time of day</FieldLabel>
              <ToggleGroup
                type="single"
                value={filters.time}
                onValueChange={(value) => {
                  if (!value) return;
                  patch({ time: value as DiscoveryFilters['time'] });
                }}
                className={cn(CHIP_GRID, 'grid-cols-2')}
                aria-label="Time of day"
              >
                {TIMES.map((time) => (
                  <ToggleGroupItem key={time} value={time} className={cn(CHIP, 'w-full')}>
                    {timeLabel(time)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel>Class environment</FieldLabel>
              <ToggleGroup
                type="multiple"
                value={filters.classType}
                onValueChange={(values) => patch({ classType: values as ClassType[] })}
                className={cn(CHIP_GRID, 'grid-cols-3')}
                aria-label="Class environment"
              >
                {CLASS_TYPES.map((type) => (
                  <ToggleGroupItem key={type} value={type} className={cn(CHIP, 'w-full')}>
                    {type}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel>Language</FieldLabel>
              <ToggleGroup
                type="multiple"
                value={filters.languages}
                onValueChange={(languages) => patch({ languages })}
                className={cn(CHIP_GRID, 'grid-cols-2')}
                aria-label="Language"
              >
                {LANGUAGES.map((lang) => (
                  <ToggleGroupItem key={lang} value={lang} className={cn(CHIP, 'w-full')}>
                    {lang}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel>Difficulty</FieldLabel>
              <ToggleGroup
                type="single"
                value={filters.level || undefined}
                onValueChange={(level) => patch({ level: level || '' })}
                className={cn(CHIP_GRID, 'grid-cols-3')}
                aria-label="Difficulty level"
              >
                {LEVELS.map((lvl) => (
                  <ToggleGroupItem key={lvl} value={lvl} className={cn(CHIP, 'w-full')}>
                    {lvl}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </>
        ) : null}

        <FieldSeparator />

        <FieldSet className="gap-0.5">
          <FieldLegend variant="label" className="mb-1">
            {isTrainer ? 'Coach quality' : 'Session quality'}
          </FieldLegend>
          <TrustToggle
            id="disc-verified"
            icon={ShieldCheck}
            label={isTrainer ? 'Verified coaches' : 'Verified coach'}
            checked={filters.verified}
            onCheckedChange={() => patch({ verified: !filters.verified })}
          />
          <TrustToggle
            id="disc-toprated"
            icon={Star}
            label="Top rated (4.8+)"
            checked={filters.topRated}
            onCheckedChange={() => patch({ topRated: !filters.topRated })}
          />
          {isTrainer ? (
            <TrustToggle
              id="disc-premium"
              icon={Crown}
              label="Coach Pro only"
              checked={filters.premiumOnly}
              onCheckedChange={() => patch({ premiumOnly: !filters.premiumOnly })}
            />
          ) : null}
        </FieldSet>
      </FieldGroup>
    </div>
  );
}

export function DiscoveryFilterSidebar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn('hidden w-[280px] shrink-0 self-start lg:block', className)}
      aria-label="Discovery filters"
    >
      {/* No max-height / overflow — page scrolls; sticky keeps filters in view while short */}
      <div className="sticky top-20 rounded-xl border border-border/80 bg-card p-4">
        {children}
      </div>
    </aside>
  );
}

export function DiscoveryFilterMobileTrigger({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="relative h-11 gap-2 bg-card px-4 touch-manipulation lg:hidden"
      onClick={onClick}
      aria-label={count ? `Open filters (${count} active)` : 'Open filters'}
    >
      <MapPin className="size-4 text-muted-foreground" aria-hidden />
      <span>Filters</span>
      {count > 0 ? (
        <Badge className="absolute -right-2 -top-2 size-5 justify-center rounded-full p-0 text-[10px] tabular-nums">
          {count}
        </Badge>
      ) : null}
    </Button>
  );
}
