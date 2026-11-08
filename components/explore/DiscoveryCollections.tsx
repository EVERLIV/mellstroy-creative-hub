import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Sparkles, Star, Tag } from 'lucide-react';
import type { Trainer } from '../../types';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { trackEvent } from '@/src/lib/analytics';
import { DiscoveryCoachCard } from './ExploreDiscoveryCards';

type CollectionId = 'best_week' | 'new_masters' | 'on_discount' | 'near_you';

const META: Record<
  CollectionId,
  { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }
> = {
  best_week: {
    title: 'Best this week',
    subtitle: 'Highest rated coaches with recent activity',
    icon: Star,
  },
  new_masters: {
    title: 'New masters',
    subtitle: 'Joined the platform recently',
    icon: Sparkles,
  },
  on_discount: {
    title: 'On discount',
    subtitle: 'Packs and promo-ready sessions',
    icon: Tag,
  },
  near_you: {
    title: 'Near you',
    subtitle: 'Closest coaches to your district',
    icon: MapPin,
  },
};

export function pickCollections(
  trainers: Trainer[],
  userLocation?: string | null
): Record<CollectionId, Trainer[]> {
  const byRating = [...trainers].sort(
    (a, b) => b.rating * 10 + b.reviews - (a.rating * 10 + a.reviews)
  );
  const newest = [...trainers].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  const discounted = trainers.filter((t) => t.isPremium || (t.classes?.length ?? 0) > 0);
  const near = userLocation
    ? trainers.filter((t) => t.location?.includes(userLocation))
    : trainers.slice(0, 8);

  return {
    best_week: byRating.slice(0, 8),
    new_masters: newest.slice(0, 8),
    on_discount: discounted.slice(0, 8),
    near_you: near.slice(0, 8),
  };
}

export function DiscoveryCollections({
  trainers,
  userLocation,
  className,
}: {
  trainers: Trainer[];
  userLocation?: string | null;
  className?: string;
}) {
  const navigate = useNavigate();
  const collections = pickCollections(trainers, userLocation);

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      {(Object.keys(META) as CollectionId[]).map((id) => {
        const list = collections[id];
        if (!list.length) return null;
        const meta = META[id];
        const Icon = meta.icon;
        return (
          <section key={id} className="flex flex-col gap-3" aria-label={meta.title}>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <Icon className="size-3.5" aria-hidden />
                  Collection
                </div>
                <h2 className="text-pretty text-lg font-semibold tracking-tight">{meta.title}</h2>
                <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  trackEvent('collection_click', { collection: id });
                  navigate('/explore');
                }}
              >
                See all
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.slice(0, 4).map((trainer) => (
                <DiscoveryCoachCard
                  key={`${id}-${trainer.id}`}
                  trainer={trainer}
                  isFavorite={false}
                  onSelect={() => {
                    trackEvent('collection_click', { collection: id, trainerId: trainer.id });
                    navigate(`/trainer/${trainer.id}`);
                  }}
                  onBook={() => navigate(`/trainer/${trainer.id}`)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
