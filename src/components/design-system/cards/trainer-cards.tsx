import React from 'react';
import { Calendar, Clock, Crown, Heart, MapPin, Quote, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import AttractButton from '@/src/components/kokonutui/attract-button';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import { CardBadge, CardChip, CardShell, PriceBlock, RatingPill } from './primitives';

export type TrainerProfileCardProps = {
  name: string;
  imageUrl: string;
  title?: string;
  bio?: string;
  rating: number;
  reviews: number;
  specialties?: string[];
  availableToday?: boolean;
  verified?: boolean;
  nextSlotLabel?: string;
  nextSlotUrgency?: string;
  testimonial?: { quote: string; author: string };
  price: number;
  priceUnit?: string;
  guaranteeLabel?: string;
  onViewProfile?: () => void;
  onBook?: () => void;
  className?: string;
};

/** Master trainer profile card — detailed desktop layout. */
export function TrainerProfileCard({
  name,
  imageUrl,
  title,
  bio,
  rating,
  reviews,
  specialties = [],
  availableToday,
  verified,
  nextSlotLabel,
  nextSlotUrgency,
  testimonial,
  price,
  priceUnit = '/ 60-min session',
  guaranteeLabel = '100% Guaranteed',
  onViewProfile,
  onBook,
  className,
}: TrainerProfileCardProps) {
  return (
    <CardShell accentTop className={cn('p-5 sm:p-6', className)}>
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="relative mx-auto w-32 shrink-0 sm:mx-0 sm:w-40">
          <div className="aspect-[5/6] overflow-hidden rounded-xl border border-border bg-muted">
            <img src={imageUrl} alt={name} className="size-full object-cover" loading="lazy" />
          </div>
          {verified ? (
            <div
              className="absolute -bottom-2 -right-2 rounded-full border-2 border-card bg-primary p-1 text-primary-foreground shadow-md"
              title="Verified"
            >
              <ShieldCheck className="size-3.5" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-foreground">{name}</h3>
                {availableToday ? (
                  <CardBadge tone="success">
                    <span className="size-1.5 rounded-full bg-emerald-600" />
                    Available Today
                  </CardBadge>
                ) : null}
              </div>
              {title ? <p className="text-xs font-semibold text-primary">{title}</p> : null}
            </div>
            <RatingPill rating={rating} reviews={reviews} />
          </div>

          {bio ? <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{bio}</p> : null}

          {specialties.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {specialties.map((s, i) => (
                <CardChip key={s} active={i === specialties.length - 1}>
                  {s}
                </CardChip>
              ))}
            </div>
          ) : null}

          {nextSlotLabel ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-xs">
              <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <Clock className="size-4 shrink-0 text-primary" />
                <span className="truncate">
                  Next slot: <strong className="text-foreground">{nextSlotLabel}</strong>
                </span>
              </div>
              {nextSlotUrgency ? <CardBadge tone="accent">{nextSlotUrgency}</CardBadge> : null}
            </div>
          ) : null}
        </div>
      </div>

      {testimonial ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
          <Quote className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">&ldquo;{testimonial.quote}&rdquo;</span>
            <span className="ml-1">— {testimonial.author}</span>
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col items-stretch justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-baseline gap-2">
          <PriceBlock amount={price} unit={priceUnit} size="lg" />
          {guaranteeLabel ? <CardBadge tone="success">{guaranteeLabel}</CardBadge> : null}
        </div>
        <div className="flex gap-2">
          {onViewProfile ? (
            <Button type="button" variant="outline" size="sm" className="flex-1 sm:flex-initial" onClick={onViewProfile}>
              View Profile
            </Button>
          ) : null}
          {onBook ? (
            <Button type="button" size="sm" className="flex-1 gap-1.5 sm:flex-initial" onClick={onBook}>
              <Calendar className="size-3.5" />
              Book Session
            </Button>
          ) : null}
        </div>
      </div>
    </CardShell>
  );
}

export type TrainerCompactCardProps = {
  name: string;
  imageUrl: string;
  subtitle?: string;
  rating: number;
  reviews: number;
  price: number;
  verified?: boolean;
  onReserve?: () => void;
  className?: string;
};

export type TrainerMagazineCardProps = {
  name: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  location: string;
  price: number;
  tag?: string;
  isPremium?: boolean;
  verified?: boolean;
  isFavorite?: boolean;
  onSelect: () => void;
  onToggleFavorite?: () => void;
  className?: string;
};

/** Full-bleed magazine tile for explore / rails. */
export function TrainerMagazineCard({
  name,
  imageUrl,
  rating,
  reviews,
  location,
  price,
  tag,
  isPremium,
  verified,
  isFavorite,
  onSelect,
  onToggleFavorite,
  className,
}: TrainerMagazineCardProps) {
  return (
    <article
      className={cn(
        'group relative isolate aspect-[3/4] overflow-hidden rounded-3xl bg-muted ring-1 ring-inset ring-border/40',
        className
      )}
    >
      <button type="button" onClick={onSelect} className="absolute inset-0 z-0" aria-label={`Open ${name}`}>
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
      </button>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3">
        <div className="pointer-events-auto flex flex-wrap gap-1.5">
          {isPremium ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              <Crown className="size-3" />
              Premium
            </span>
          ) : null}
          {tag ? (
            <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
              {tag}
            </span>
          ) : null}
        </div>
        {onToggleFavorite ? (
          <button
            type="button"
            className="pointer-events-auto grid size-9 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={!!isFavorite}
          >
            <Heart className={cn('size-4', isFavorite && 'fill-destructive text-destructive')} />
          </button>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-3 md:p-4">
        <button type="button" onClick={onSelect} className="text-left">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold tracking-tight text-foreground md:text-lg">{name}</h3>
            {verified ? <ShieldCheck className="size-4 shrink-0 text-primary" aria-label="Verified" /> : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-foreground">
              <Star className="size-3 fill-primary text-primary" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviews})</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          </div>
        </button>
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-lg font-semibold tabular-nums tracking-tight text-foreground">{formatVND(price)}</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">per class</div>
          </div>
          <AttractButton
            type="button"
            onClick={onSelect}
            containerClassName="shrink-0"
            className="!h-10 !min-w-0 !rounded-full !px-4 !text-xs"
          >
            Book
          </AttractButton>
        </div>
      </div>
    </article>
  );
}

/** Compact trainer row card for side rails / dense grids. */
export function TrainerCompactCard({
  name,
  imageUrl,
  subtitle,
  rating,
  reviews,
  price,
  verified,
  onReserve,
  className,
}: TrainerCompactCardProps) {
  return (
    <CardShell className={cn('p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">Compact Trainer</span>
        <span className="size-2 rounded-full bg-emerald-600" aria-hidden />
      </div>
      <div className="flex items-center gap-3">
        <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          <img src={imageUrl} alt={name} className="size-full object-cover" loading="lazy" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h4 className="truncate text-sm font-semibold text-foreground">{name}</h4>
            {verified ? <ShieldCheck className="size-3.5 shrink-0 text-primary" /> : null}
          </div>
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
          <RatingPill rating={rating} reviews={reviews} compact className="mt-0.5" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3">
        <PriceBlock amount={price} unit="/hr" size="sm" />
        {onReserve ? (
          <Button type="button" size="sm" variant="secondary" onClick={onReserve}>
            Quick Reserve
          </Button>
        ) : null}
      </div>
    </CardShell>
  );
}
