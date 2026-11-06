import React from 'react';
import { Trainer } from '../types';
import { Star, ShieldCheck, MapPin, Heart, Crown, Circle, Clock } from 'lucide-react';
import { getTimeAgo, isOnline } from '../src/utils/onlineStatus';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { AddToCartButton } from '@/src/components/kokonutui/cart-button';
import { useOptionalCartQuantities } from '@/src/hooks/useCartQuantities';

interface TrainerListItemProps {
  trainer: Trainer;
  onSelect: () => void;
  isFavorite: boolean;
  onToggleFavorite: (trainerId: string) => void;
}

const TrainerListItem: React.FC<TrainerListItemProps> = React.memo(({ trainer, onSelect, isFavorite, onToggleFavorite }) => {
  const cart = useOptionalCartQuantities();
  const cartId = `trainer:${trainer.id}`;

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex cursor-pointer gap-3 rounded-2xl border border-border/80 bg-card p-3 transition-colors hover:border-primary/40',
        trainer.isPremium && 'ring-1 ring-primary/40'
      )}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl md:size-24">
        <img src={trainer.imageUrl} alt={trainer.name} loading="lazy" className="size-full object-cover" />
        {trainer.isPremium && (
          <span className="absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
            <Crown className="size-3" aria-label="Premium" />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">{trainer.name}</h3>
            {trainer.verificationStatus === 'verified' && (
              <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified" />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(trainer.id);
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            className="-mr-1 -mt-1 size-8 shrink-0"
          >
            <Heart className={cn(isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground')} />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {trainer.lastSeen != null &&
            (isOnline(trainer.lastSeen) ? (
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                <Circle className="size-2 fill-primary" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock className="size-2.5" />
                {getTimeAgo(trainer.lastSeen) || 'offline'}
              </span>
            ))}
          {trainer.experienceYears ? (
            <span className="text-muted-foreground">
              {trainer.experienceYears} {trainer.experienceYears === 1 ? 'year' : 'years'} exp
            </span>
          ) : null}
          <span className="ml-auto shrink-0 text-right">
            <span className="text-sm font-semibold tabular-nums text-foreground">{formatVND(trainer.price)}</span>
            <span className="text-muted-foreground"> /class</span>
          </span>
        </div>

        {trainer.specialty && trainer.specialty.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trainer.specialty.slice(0, 4).map((category) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
        )}

        <div
          className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center" aria-label={`Rated ${trainer.rating.toFixed(1)} out of 5`}>
              <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
              <span className="ml-1 font-semibold text-foreground">{trainer.rating.toFixed(1)}</span>
              <span className="ml-1">({trainer.reviews})</span>
            </span>
            <span className="inline-flex min-w-0 items-center">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              <span className="ml-1 truncate">{trainer.location}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onSelect}>
              Details
            </Button>
            <AddToCartButton
              name={trainer.name}
              label="Add"
              max={5}
              quantity={cart?.getQuantity(cartId)}
              onQuantityChange={(qty) => cart?.setQuantity(cartId, qty)}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

TrainerListItem.displayName = 'TrainerListItem';

export default TrainerListItem;
