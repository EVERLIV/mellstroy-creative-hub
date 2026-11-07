import type { ReactNode } from 'react';
import {
  Circle,
  Clock,
  Heart,
  MapPin,
  ShoppingCart,
  Star,
  Users,
  Verified,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import { getTimeAgo, isOnline } from '@/src/utils/onlineStatus';
import type { Class, Trainer } from '../../types';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Separator } from '@/src/components/ui/separator';

const FALLBACK =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80';

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
        <button type="button" onClick={onSelect} className="absolute inset-0 block size-full text-left">
          <img
            src={src || FALLBACK}
            alt=""
            className="absolute inset-0 size-full object-cover object-center"
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
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
        <Circle className="size-1.5 fill-primary" />
        Online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Clock className="size-3" />
      {getTimeAgo(lastSeen) || 'offline'}
    </span>
  );
}

/** Dense grid card — max info, fixed photo, equal height. */
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
  const specialties = trainer.specialty?.filter(Boolean) ?? [];
  const tag = specialties[0] || 'Coach';
  const verified = trainer.verificationStatus === 'verified';
  const classCount = trainer.classes?.length ?? 0;
  const languages = Array.from(
    new Set(trainer.classes?.flatMap((c) => c.language ?? []) ?? [])
  ).slice(0, 2);

  return (
    <Card className="flex h-full flex-col overflow-hidden pt-0">
      <CardPhoto src={trainer.imageUrl} onSelect={onSelect} className="h-36">
        <Badge variant="secondary" className="absolute left-2 top-2 capitalize">
          {tag}
        </Badge>
        {trainer.isPremium ? (
          <Badge className="absolute bottom-2 left-2">Premium</Badge>
        ) : null}
        {onToggleFavorite ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 size-7"
            aria-label={isFavorite ? `Unsave ${trainer.name}` : `Save ${trainer.name}`}
            aria-pressed={isFavorite}
            onClick={() => onToggleFavorite(trainer.id)}
          >
            <Heart className={cn(isFavorite && 'fill-destructive text-destructive')} />
          </Button>
        ) : null}
      </CardPhoto>

      <CardHeader className="gap-1 p-3 pb-1.5">
        <div className="flex min-w-0 items-center gap-1">
          <CardTitle className="min-w-0 truncate text-sm">
            <button type="button" onClick={onSelect} className="truncate text-left hover:text-primary">
              {trainer.name}
            </button>
          </CardTitle>
          {verified ? (
            <Verified className="size-3.5 shrink-0 fill-primary text-primary" aria-label="Verified" />
          ) : null}
        </div>
        <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
          <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
            <Star className="size-3 fill-amber-500 text-amber-500" />
            <span className="tabular-nums">{trainer.rating.toFixed(1)}</span>
            <span className="font-normal text-muted-foreground">({trainer.reviews})</span>
          </span>
          <Presence lastSeen={trainer.lastSeen} />
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-1.5 px-3 pb-2 pt-0">
        <p className="truncate text-[11px] text-muted-foreground">
          <MapPin className="mr-0.5 inline size-3" />
          {trainer.location || 'Ho Chi Minh City'}
          {trainer.experienceYears ? ` · ${trainer.experienceYears}y exp` : ''}
        </p>
        <div className="flex flex-wrap gap-1">
          {specialties.slice(0, 3).map((s) => (
            <Badge key={s} variant="outline" className="px-1.5 py-0 text-[10px] capitalize">
              {s}
            </Badge>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap gap-x-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Users className="size-3" />
            {classCount} cls
          </span>
          {languages.length > 0 ? <span>{languages.join(' · ')}</span> : null}
        </div>
      </CardContent>

      <Separator />
      <CardFooter className="justify-between gap-2 p-2.5">
        <div>
          <p className="text-sm font-bold tabular-nums leading-none">{formatVND(trainer.price)}</p>
          <p className="text-[10px] text-muted-foreground">/ class</p>
        </div>
        <Button type="button" size="sm" onClick={() => (onBook ?? onSelect)()}>
          <ShoppingCart />
          Book
        </Button>
      </CardFooter>
    </Card>
  );
}

/** Dense list row — compare many coaches quickly. */
export function DiscoveryCoachListItem({
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
  const specialties = trainer.specialty?.filter(Boolean) ?? [];
  const verified = trainer.verificationStatus === 'verified';
  const classCount = trainer.classes?.length ?? 0;
  const languages = Array.from(
    new Set(trainer.classes?.flatMap((c) => c.language ?? []) ?? [])
  ).slice(0, 3);
  const blurb =
    trainer.shortDescription?.trim() ||
    trainer.bio?.trim()?.slice(0, 110) ||
    null;

  return (
    <Card
      className={cn(
        'flex cursor-pointer flex-row overflow-hidden p-0',
        trainer.isPremium && 'ring-1 ring-primary/30'
      )}
      onClick={onSelect}
    >
      <CardPhoto src={trainer.imageUrl} className="h-auto w-24 shrink-0 self-stretch sm:w-28">
        {trainer.isPremium ? (
          <Badge className="absolute left-1.5 top-1.5 px-1.5 py-0 text-[9px]">Pro</Badge>
        ) : null}
      </CardPhoto>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold tracking-tight">{trainer.name}</h3>
              {verified ? (
                <Verified className="size-3.5 shrink-0 fill-primary text-primary" aria-label="Verified" />
              ) : null}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
              <Presence lastSeen={trainer.lastSeen} />
              {trainer.experienceYears ? <span>{trainer.experienceYears}y exp</span> : null}
              <span className="inline-flex items-center gap-0.5">
                <Users className="size-3" />
                {classCount} classes
              </span>
              {languages.length > 0 ? <span>{languages.join(' · ')}</span> : null}
            </div>
          </div>
          {onToggleFavorite ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              aria-label={isFavorite ? 'Unsave' : 'Save'}
              aria-pressed={isFavorite}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(trainer.id);
              }}
            >
              <Heart className={cn(isFavorite && 'fill-destructive text-destructive')} />
            </Button>
          ) : null}
        </div>

        {blurb ? (
          <p className="line-clamp-1 text-[11px] text-muted-foreground sm:line-clamp-2">{blurb}</p>
        ) : null}

        {specialties.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {specialties.slice(0, 4).map((s) => (
              <Badge key={s} variant="secondary" className="px-1.5 py-0 text-[10px] capitalize">
                {s}
              </Badge>
            ))}
            {specialties.length > 4 ? (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                +{specialties.length - 4}
              </Badge>
            ) : null}
          </div>
        ) : null}

        <div
          className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
              <Star className="size-3 fill-amber-500 text-amber-500" />
              <span className="tabular-nums">{trainer.rating.toFixed(1)}</span>
              <span className="font-normal text-muted-foreground">({trainer.reviews})</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-0.5 truncate">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{trainer.location || 'HCMC'}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-bold tabular-nums leading-none">{formatVND(trainer.price)}</p>
              <p className="text-[10px] text-muted-foreground">/ class</p>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={onSelect}>
              Details
            </Button>
            <Button type="button" size="sm" onClick={() => (onBook ?? onSelect)()}>
              Book
            </Button>
          </div>
        </div>
      </div>
    </Card>
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
    <Card className="flex h-full cursor-pointer flex-col overflow-hidden pt-0" onClick={onSelect}>
      <CardPhoto src={cover} className="h-36">
        <Badge variant="secondary" className="absolute bottom-2 left-2">
          {cls.duration} min
        </Badge>
        <Badge variant="outline" className="absolute right-2 top-2 bg-background/90">
          {cls.classType}
        </Badge>
      </CardPhoto>
      <CardHeader className="gap-1 p-3 pb-1.5">
        <CardTitle className="truncate text-sm">{cls.name}</CardTitle>
        <CardDescription className="truncate text-xs">
          {trainer.name} · {trainer.location || 'HCMC'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-1.5 px-3 pb-2 pt-0">
        <p className="line-clamp-2 text-[11px] text-muted-foreground">
          {cls.description || `${cls.level || 'All levels'} · ${cls.language?.join(', ') || 'EN/VI'}`}
        </p>
        <div className="mt-auto flex flex-wrap gap-1">
          {cls.level ? (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {cls.level}
            </Badge>
          ) : null}
          {(cls.language ?? []).slice(0, 2).map((l) => (
            <Badge key={l} variant="secondary" className="px-1.5 py-0 text-[10px]">
              {l}
            </Badge>
          ))}
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="justify-between gap-2 p-2.5 text-xs">
        <span className="font-bold tabular-nums text-primary">{formatVND(cls.price)}</span>
        <span className="text-muted-foreground">{slots > 0 ? `${slots} spots` : 'Full'}</span>
      </CardFooter>
    </Card>
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
    <Card className="flex cursor-pointer flex-row overflow-hidden p-0" onClick={onSelect}>
      <CardPhoto src={cover} className="h-auto w-24 shrink-0 self-stretch sm:w-28" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{cls.name}</h3>
            <p className="truncate text-[11px] text-muted-foreground">
              {trainer.name} · {cls.duration} min · {cls.classType}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold tabular-nums">{formatVND(cls.price)}</p>
            <p className="text-[10px] text-muted-foreground">{slots > 0 ? `${slots} left` : 'Full'}</p>
          </div>
        </div>
        <p className="line-clamp-1 text-[11px] text-muted-foreground sm:line-clamp-2">
          {cls.description || trainer.location || 'Ho Chi Minh City'}
        </p>
        <div className="flex flex-wrap gap-1">
          {cls.level ? <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{cls.level}</Badge> : null}
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            <Star className="mr-0.5 size-3 fill-amber-500 text-amber-500" />
            {trainer.rating.toFixed(1)}
          </Badge>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            <MapPin className="mr-0.5 size-3" />
            {trainer.location || 'HCMC'}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

/** @deprecated alias kept for older imports */
export const SpotlightCoachCard = DiscoveryCoachCard;
export const SpotlightClassCard = DiscoveryClassCard;
