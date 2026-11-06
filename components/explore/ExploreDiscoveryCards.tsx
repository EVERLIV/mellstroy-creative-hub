import React from 'react';
import { Heart, MapPin, ShoppingCart, Star, Verified } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import type { Class, Trainer } from '../../types';

const FALLBACK =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80';

/** Compact spotlight coach — Stitch Featured Coaches rail. */
export function SpotlightCoachCard({
  trainer,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: {
  trainer: Trainer;
  isFavorite: boolean;
  onToggleFavorite?: (id: string) => void;
  onSelect: () => void;
}) {
  const tag = trainer.specialty?.[0] || 'Coach';
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      <button type="button" onClick={onSelect} className="relative aspect-[4/5] overflow-hidden bg-muted text-left">
        <img
          src={trainer.imageUrl || FALLBACK}
          alt=""
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
          {tag}
        </span>
        {onToggleFavorite ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={isFavorite ? `Unsave ${trainer.name}` : `Save ${trainer.name}`}
            aria-pressed={isFavorite}
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/80 text-foreground backdrop-blur-md transition-colors hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(trainer.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(trainer.id);
              }
            }}
          >
            <Heart className={cn('size-4', isFavorite && 'fill-destructive text-destructive')} />
          </span>
        ) : null}
      </button>
      <button type="button" onClick={onSelect} className="flex flex-1 flex-col justify-between p-2.5 text-left">
        <div>
          <p className="truncate text-xs font-semibold text-foreground">{trainer.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{trainer.location || 'Ho Chi Minh City'}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
            <Star className="size-3.5 fill-amber-500 text-amber-500" />
            <span className="tabular-nums">{trainer.rating.toFixed(1)}</span>
            <span className="font-normal text-muted-foreground">({trainer.reviews})</span>
          </div>
          <span className="text-[11px] font-bold text-primary tabular-nums">{formatVND(trainer.price)}</span>
        </div>
      </button>
    </article>
  );
}

/** Compact class tile — Stitch Popular Classes rail. */
export function SpotlightClassCard({
  cls,
  trainer,
  onSelect,
}: {
  cls: Class;
  trainer: Trainer;
  onSelect: () => void;
}) {
  const cover = cls.imageUrl || cls.imageUrls?.[0] || trainer.imageUrl || FALLBACK;
  const slots = Math.max(cls.capacity - (cls.bookings?.length ?? 0), 0);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-all hover:shadow-md"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={cover}
          alt=""
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
          {cls.duration} min
        </span>
      </div>
      <div className="p-2.5">
        <p className="truncate text-xs font-semibold text-foreground">{cls.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {trainer.name} · {trainer.location || 'HCMC'}
        </p>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="tabular-nums text-muted-foreground">{formatVND(cls.price)}</span>
          <span className="font-bold text-[#fd651e]">
            {slots > 0 ? `${slots} slots` : 'Full'}
          </span>
        </div>
      </div>
    </button>
  );
}

/** Full discovery coach card — Stitch All Coaches grid. */
export function DiscoveryCoachCard({
  trainer,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onBook,
}: {
  trainer: Trainer;
  isFavorite: boolean;
  onToggleFavorite?: (id: string) => void;
  onSelect: () => void;
  onBook?: () => void;
}) {
  const tag = trainer.specialty?.[0] || 'Coach';
  const verified = trainer.verificationStatus === 'verified';

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      <button type="button" onClick={onSelect} className="relative aspect-[4/4.5] overflow-hidden bg-muted text-left">
        <img
          src={trainer.imageUrl || FALLBACK}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
          {tag}
        </span>
        {onToggleFavorite ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={isFavorite ? `Unsave ${trainer.name}` : `Save ${trainer.name}`}
            aria-pressed={isFavorite}
            className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/80 text-foreground backdrop-blur-md transition-colors hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(trainer.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(trainer.id);
              }
            }}
          >
            <Heart className={cn('size-[18px]', isFavorite && 'fill-destructive text-destructive')} />
          </span>
        ) : null}
      </button>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSelect}
              className="truncate text-left text-base font-semibold tracking-tight text-foreground hover:text-primary"
            >
              {trainer.name}
            </button>
            {verified ? (
              <Verified className="size-[18px] shrink-0 fill-primary text-primary" aria-label="Verified" />
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-0.5 font-bold text-foreground">
              <Star className="size-4 fill-amber-500 text-amber-500" />
              <span className="tabular-nums">{trainer.rating.toFixed(1)}</span>
              <span className="font-normal text-muted-foreground">({trainer.reviews})</span>
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex min-w-0 items-center gap-0.5 truncate">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{trainer.location || 'Ho Chi Minh City'}</span>
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-4">
          <div>
            <span className="block text-base font-bold tabular-nums text-foreground">
              {formatVND(trainer.price)}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Per class</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              (onBook ?? onSelect)();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#fd651e] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#a73a00] active:scale-[0.98]"
          >
            <ShoppingCart className="size-4" />
            Book
          </button>
        </div>
      </div>
    </article>
  );
}
