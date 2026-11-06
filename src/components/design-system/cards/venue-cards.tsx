import React from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { CardBadge, CardChip, CardShell, PriceBlock, RatingPill } from './primitives';

export type VenueFacilityCardProps = {
  name: string;
  imageUrl: string;
  categoryLabel: string;
  address: string;
  district: string;
  rating: number;
  reviews: number;
  pricePerHour: number;
  amenities?: string[];
  trainersAvailable?: boolean;
  memberPerk?: boolean;
  onDetails?: () => void;
  onBook?: () => void;
  className?: string;
};

/** Standard facility / venue list card used across discover surfaces. */
export function VenueFacilityCard({
  name,
  imageUrl,
  categoryLabel,
  address,
  district,
  rating,
  reviews,
  pricePerHour,
  amenities = [],
  trainersAvailable,
  memberPerk = true,
  onDetails,
  onBook,
  className,
}: VenueFacilityCardProps) {
  return (
    <CardShell className={cn('flex min-w-0 flex-col', className)}>
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img src={imageUrl} alt={name} className="size-full object-cover" loading="lazy" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <CardBadge tone="secondary">{categoryLabel}</CardBadge>
          {trainersAvailable ? <CardBadge tone="success">Coaches on site</CardBadge> : null}
        </div>
        {memberPerk ? (
          <div className="absolute bottom-3 right-3">
            <CardBadge tone="success">10% OFF RhinoFit</CardBadge>
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-base font-semibold tracking-tight text-foreground">{name}</h3>
          <RatingPill rating={rating} reviews={reviews} compact />
        </div>
        <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {address}, {district}
          </span>
        </p>
        {amenities.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {amenities.slice(0, 3).map((a) => (
              <CardChip key={a}>{a}</CardChip>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <PriceBlock amount={pricePerHour} unit="/hr" size="sm" />
          <div className="flex shrink-0 gap-2">
            {onDetails ? (
              <Button type="button" size="sm" variant="outline" onClick={onDetails}>
                Details
              </Button>
            ) : null}
            {onBook ? (
              <Button type="button" size="sm" className="gap-1" onClick={onBook}>
                <Calendar className="size-3.5" />
                Book
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

export type CourtOption = {
  id: string;
  label: string;
  title: string;
  description: string;
  pricePerHour: number;
  availabilityLabel: string;
  available?: boolean;
};

export type VenueDeepDiveCardProps = {
  name: string;
  address: string;
  rating: number;
  reviews: number;
  openLabel?: string;
  partner?: boolean;
  gallery: string[];
  amenities: { icon?: React.ReactNode; label: string }[];
  courts: CourtOption[];
  selectedCourtId?: string;
  onSelectCourt?: (id: string) => void;
  onBook?: () => void;
  onContact?: () => void;
  className?: string;
};

/** Large venue deep-dive card (gallery + courts). Keep lean for library reuse. */
export function VenueDeepDiveCard({
  name,
  address,
  rating,
  reviews,
  openLabel = 'Open Now',
  partner = true,
  gallery,
  amenities,
  courts,
  selectedCourtId,
  onSelectCourt,
  onBook,
  onContact,
  className,
}: VenueDeepDiveCardProps) {
  const selected = courts.find((c) => c.id === selectedCourtId) ?? courts[0];
  return (
    <CardShell className={cn('overflow-hidden rounded-2xl', className)}>
      <div className="grid grid-cols-1 gap-1 bg-border p-1 md:grid-cols-4">
        {gallery.slice(0, 3).map((src, i) => (
          <div
            key={src + i}
            className={cn('relative h-48 overflow-hidden bg-muted md:h-64', i === 0 && 'md:col-span-2')}
          >
            <img src={src} alt="" className="size-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>

      <div className="space-y-5 p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-center">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {partner ? <CardBadge tone="secondary">Official RhinoFit Partner</CardBadge> : null}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-600" />
                {openLabel}
              </span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">{name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-primary" />
              <span className="truncate">{address}</span>
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <RatingPill rating={rating} reviews={reviews} />
          </div>
        </div>

        {amenities.length > 0 ? (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Amenities
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              {amenities.map((a) => (
                <div
                  key={a.label}
                  className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 p-2.5 text-xs font-medium text-foreground"
                >
                  {a.icon}
                  <span className="truncate">{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {courts.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {courts.map((court) => {
              const active = court.id === selected?.id;
              return (
                <button
                  key={court.id}
                  type="button"
                  onClick={() => onSelectCourt?.(court.id)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-colors',
                    active ? 'border-2 border-primary bg-primary/5' : 'border-border hover:border-foreground/20'
                  )}
                >
                  <div className="mb-2 text-[11px] font-semibold text-muted-foreground">{court.label}</div>
                  <p className="text-sm font-semibold text-foreground">{court.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{court.description}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                    <PriceBlock amount={court.pricePerHour} unit="/hour" size="sm" />
                    <span
                      className={cn(
                        'rounded px-2 py-0.5 text-[11px] font-semibold',
                        court.available === false
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      )}
                    >
                      {court.availabilityLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Ready to play at {name}?</p>
            {selected ? (
              <p className="text-[11px] text-muted-foreground">
                Selected: {selected.title} · Instant confirmation
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            {onContact ? (
              <Button type="button" variant="outline" size="sm" onClick={onContact}>
                Contact
              </Button>
            ) : null}
            {onBook ? (
              <Button type="button" size="sm" className="gap-1.5" onClick={onBook}>
                <Calendar className="size-3.5" />
                Book{selected ? ` (${selected.pricePerHour.toLocaleString('vi-VN')}₫/hr)` : ''}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </CardShell>
  );
}
