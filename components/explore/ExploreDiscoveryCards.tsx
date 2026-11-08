import type { ReactNode } from 'react';
import {
  Calendar,
  Circle,
  Clock,
  Heart,
  MapPin,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import { getTimeAgo, isOnline } from '@/src/utils/onlineStatus';
import type { Class, Trainer } from '../../types';
import { Button } from '@/src/components/ui/button';
import {
  CardBadge,
  CardChip,
  CardShell,
  PriceBlock,
} from '@/src/components/design-system/cards';

const FALLBACK =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80';

/**
 * Intent: athlete scanning coaches to book a session — compare presence, trust, price.
 * Hierarchy: portrait wins → name → price → book. Everything else demoted.
 * Signature: blue accent rail + verified shield (same language as TrainerProfileViewPage).
 */

function CardPhoto({
  src,
  onSelect,
  className,
  children,
}: {
  src: string;
  onSelect?: () => void;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('relative w-full shrink-0 overflow-hidden bg-muted', className)}>
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className="absolute inset-0 block size-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          aria-label="Open coach profile"
        >
          <img
            src={src || FALLBACK}
            alt=""
            className="absolute inset-0 size-full object-cover object-center transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        </button>
      ) : (
        <img
          src={src || FALLBACK}
          alt=""
          className="absolute inset-0 size-full object-cover object-center"
          loading="lazy"
          decoding="async"
        />
      )}
      {children}
    </div>
  );
}

function Presence({ lastSeen }: { lastSeen?: string | null }) {
  if (lastSeen == null) return null;
  if (isOnline(lastSeen)) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
        <Circle className="size-1.5 fill-current" aria-hidden />
        Online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Clock className="size-3" aria-hidden />
      {getTimeAgo(lastSeen) || 'offline'}
    </span>
  );
}

function FavoriteButton({
  name,
  isFavorite,
  onToggle,
  className,
}: {
  name: string;
  isFavorite: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      className={cn(
        'size-8 rounded-full border border-border/60 bg-background/90 shadow-sm backdrop-blur-sm hover:bg-background',
        className
      )}
      aria-label={isFavorite ? `Unsave ${name}` : `Save ${name}`}
      aria-pressed={isFavorite}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <Heart
        className={cn(
          'size-3.5 transition-colors',
          isFavorite && 'fill-destructive text-destructive'
        )}
      />
    </Button>
  );
}

/** Grid tile — portrait-first coach card aligned with trainer profile craft. */
export function DiscoveryCoachCard({
  trainer,
  distanceLabel,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onBook,
  promoted,
}: {
  trainer: Trainer;
  distanceLabel?: string;
  isFavorite: boolean;
  onToggleFavorite?: (id: string) => void;
  onSelect: () => void;
  onBook?: () => void;
  promoted?: boolean;
}) {
  const specialties = trainer.specialty?.filter(Boolean) ?? [];
  const tag = specialties[0];
  const verified = trainer.verificationStatus === 'verified';
  const online = trainer.lastSeen != null && isOnline(trainer.lastSeen);

  return (
    <CardShell
      accentTop
      className="group flex h-full flex-col transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-md"
    >
      <CardPhoto src={trainer.imageUrl} onSelect={onSelect} className="aspect-[4/5]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />

        {tag ? (
          <CardBadge tone="overlay" className="absolute bottom-2.5 left-2.5 capitalize">
            {tag}
          </CardBadge>
        ) : null}

        {trainer.isPremium ? (
          <CardBadge tone="primary" className="absolute left-2.5 top-2.5">
            Premium
          </CardBadge>
        ) : promoted ? (
          <CardBadge tone="overlay" className="absolute left-2.5 top-2.5 font-normal">
            Promoted
          </CardBadge>
        ) : null}

        {onToggleFavorite ? (
          <FavoriteButton
            name={trainer.name}
            isFavorite={isFavorite}
            onToggle={() => onToggleFavorite(trainer.id)}
            className="absolute right-2.5 top-2.5 pointer-events-auto"
          />
        ) : null}
      </CardPhoto>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <button
                type="button"
                onClick={onSelect}
                className="min-w-0 truncate text-left text-[15px] font-semibold tracking-tight text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {trainer.name}
              </button>
              {verified ? (
                <span
                  className="grid size-4 shrink-0 place-items-center rounded-full bg-primary text-white"
                  title="Verified"
                >
                  <ShieldCheck className="size-2.5" aria-label="Verified" />
                </span>
              ) : null}
            </div>
            {online ? (
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" title="Online" />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Star className="size-3 fill-amber-500 text-amber-500" aria-hidden />
              <span className="tabular-nums">{trainer.rating.toFixed(1)}</span>
              <span className="font-normal text-muted-foreground">({trainer.reviews})</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-0.5 truncate">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{trainer.location || 'Ho Chi Minh City'}</span>
            </span>
            {distanceLabel && distanceLabel !== '—' ? (
              <span className="tabular-nums text-foreground/80">{distanceLabel}</span>
            ) : null}
          </div>

          <Presence lastSeen={trainer.lastSeen} />
        </div>

        {specialties.length > 1 ? (
          <div className="flex flex-wrap gap-1">
            {specialties.slice(1, 3).map((s) => (
              <CardChip key={s}>{s}</CardChip>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/70 pt-3">
          <PriceBlock amount={trainer.price} unit="/ session" size="sm" />
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 px-3"
            onClick={() => (onBook ?? onSelect)()}
          >
            <Calendar className="size-3.5" />
            Book
          </Button>
        </div>
      </div>
    </CardShell>
  );
}

/** Dense list row — same hierarchy, faster scan across many coaches. */
export function DiscoveryCoachListItem({
  trainer,
  distanceLabel,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onBook,
  promoted,
}: {
  trainer: Trainer;
  distanceLabel?: string;
  isFavorite: boolean;
  onToggleFavorite?: (id: string) => void;
  onSelect: () => void;
  onBook?: () => void;
  promoted?: boolean;
}) {
  const specialties = trainer.specialty?.filter(Boolean) ?? [];
  const verified = trainer.verificationStatus === 'verified';
  const online = trainer.lastSeen != null && isOnline(trainer.lastSeen);
  const blurb =
    trainer.shortDescription?.trim() ||
    trainer.bio?.trim()?.slice(0, 120) ||
    null;

  return (
    <CardShell
      accentTop
      className={cn(
        'group flex cursor-pointer flex-row transition-[box-shadow] duration-200 hover:shadow-md',
        trainer.isPremium && 'ring-1 ring-primary/25'
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <CardPhoto
        src={trainer.imageUrl}
        className="w-[5.5rem] self-stretch sm:w-28"
      >
        {trainer.isPremium ? (
          <CardBadge tone="primary" className="absolute left-1.5 top-1.5 px-1.5 py-0 text-[9px]">
            Pro
          </CardBadge>
        ) : promoted ? (
          <CardBadge tone="overlay" className="absolute left-1.5 top-1.5 px-1.5 py-0 text-[9px] font-normal">
            Promoted
          </CardBadge>
        ) : null}
        {verified ? (
          <div className="absolute bottom-1.5 right-1.5 rounded-full border-2 border-card bg-primary p-0.5 text-white shadow-sm">
            <ShieldCheck className="size-3" aria-label="Verified" />
          </div>
        ) : null}
      </CardPhoto>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                {trainer.name}
              </h3>
              {online ? (
                <CardBadge tone="success" className="px-2 py-0">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  Available
                </CardBadge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Star className="size-3 fill-amber-500 text-amber-500" aria-hidden />
                <span className="tabular-nums">{trainer.rating.toFixed(1)}</span>
                <span className="font-normal text-muted-foreground">({trainer.reviews})</span>
              </span>
              <span className="inline-flex min-w-0 items-center gap-0.5 truncate">
                <MapPin className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{trainer.location || 'HCMC'}</span>
              </span>
              {distanceLabel && distanceLabel !== '—' ? (
                <span className="tabular-nums text-foreground/80">{distanceLabel}</span>
              ) : null}
              {trainer.experienceYears ? (
                <span>{trainer.experienceYears}y exp</span>
              ) : null}
              <Presence lastSeen={trainer.lastSeen} />
            </div>
          </div>

          {onToggleFavorite ? (
            <FavoriteButton
              name={trainer.name}
              isFavorite={isFavorite}
              onToggle={() => onToggleFavorite(trainer.id)}
              className="shrink-0"
            />
          ) : null}
        </div>

        {blurb ? (
          <p className="line-clamp-1 text-xs leading-relaxed text-muted-foreground sm:line-clamp-2">
            {blurb}
          </p>
        ) : null}

        {specialties.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {specialties.slice(0, 3).map((s, i) => (
              <CardChip key={s} active={i === specialties.length - 1 || i === 2}>
                {s}
              </CardChip>
            ))}
            {specialties.length > 3 ? (
              <CardChip>+{specialties.length - 3}</CardChip>
            ) : null}
          </div>
        ) : null}

        <div
          className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-2.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <PriceBlock amount={trainer.price} unit="/ session" size="md" />
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onSelect}>
              Profile
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => (onBook ?? onSelect)()}
            >
              <Calendar className="size-3.5" />
              Book
            </Button>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

/** Class card for Classes discovery. */
export function DiscoveryClassCard({
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
    <CardShell
      className="group flex h-full cursor-pointer flex-col transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <CardPhoto src={cover} className="aspect-[16/10]">
        <CardBadge tone="overlay" className="absolute bottom-2 left-2">
          {cls.duration} min
        </CardBadge>
        <CardBadge tone="muted" className="absolute right-2 top-2 capitalize">
          {cls.classType}
        </CardBadge>
      </CardPhoto>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="min-w-0 space-y-0.5">
          <h3 className="truncate text-[15px] font-semibold tracking-tight">{cls.name}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {trainer.name}
            <span className="text-border"> · </span>
            {trainer.location || 'HCMC'}
          </p>
        </div>
        <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
          {cls.description ||
            `${cls.level || 'All levels'} · ${cls.language?.join(', ') || 'EN/VI'}`}
        </p>
        <div className="mt-auto flex flex-wrap gap-1">
          {cls.level ? <CardChip>{cls.level}</CardChip> : null}
          {(cls.language ?? []).slice(0, 2).map((l) => (
            <CardChip key={l}>{l}</CardChip>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-2.5">
          <PriceBlock amount={cls.price} unit="" size="sm" />
          <span
            className={cn(
              'text-[11px] font-medium',
              slots > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
            )}
          >
            {slots > 0 ? `${slots} spots` : 'Full'}
          </span>
        </div>
      </div>
    </CardShell>
  );
}

export function DiscoveryClassListItem({
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
    <CardShell
      className="flex cursor-pointer flex-row transition-[box-shadow] duration-200 hover:shadow-md"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <CardPhoto src={cover} className="w-24 self-stretch sm:w-28" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight">{cls.name}</h3>
            <p className="truncate text-[11px] text-muted-foreground">
              {trainer.name} · {cls.duration} min · {cls.classType}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold tabular-nums tracking-tight">
              {formatVND(cls.price)}
            </p>
            <p
              className={cn(
                'text-[10px] font-medium',
                slots > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
              )}
            >
              {slots > 0 ? `${slots} left` : 'Full'}
            </p>
          </div>
        </div>
        <p className="line-clamp-1 text-[11px] text-muted-foreground sm:line-clamp-2">
          {cls.description || trainer.location || 'Ho Chi Minh City'}
        </p>
        <div className="flex flex-wrap gap-1">
          {cls.level ? <CardChip>{cls.level}</CardChip> : null}
          <CardChip>
            <Star className="size-3 fill-amber-500 text-amber-500" />
            {trainer.rating.toFixed(1)}
          </CardChip>
          <CardChip>
            <MapPin className="size-3" />
            {trainer.location || 'HCMC'}
          </CardChip>
        </div>
      </div>
    </CardShell>
  );
}

/** @deprecated alias kept for older imports */
export const SpotlightCoachCard = DiscoveryCoachCard;
export const SpotlightClassCard = DiscoveryClassCard;
