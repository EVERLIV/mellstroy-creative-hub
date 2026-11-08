import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchPartnerOffers,
  fetchRelatedServices,
  type PartnerOffer,
  type RelatedService,
} from '@/src/lib/marketplace';
import { trackEvent } from '@/src/lib/analytics';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

export function CrossSellCarousel({
  specialty,
  className,
  title = 'Often booked with this',
}: {
  specialty?: string | null;
  className?: string;
  title?: string;
}) {
  const navigate = useNavigate();
  const [related, setRelated] = useState<RelatedService[]>([]);
  const [partners, setPartners] = useState<PartnerOffer[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [rel, part] = await Promise.all([
        specialty ? fetchRelatedServices(specialty) : Promise.resolve({ data: [] as RelatedService[] }),
        fetchPartnerOffers(4),
      ]);
      if (cancelled) return;
      setRelated(rel.data);
      setPartners(part.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [specialty]);

  if (!related.length && !partners.length) return null;

  return (
    <section className={cn('space-y-3', className)} aria-label={title}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">Complementary sessions and partner offers</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {related.map((item) => (
          <button
            key={item.id}
            type="button"
            className="min-w-[12rem] shrink-0 rounded-xl border border-border bg-card p-3 text-left hover:border-foreground/20"
            onClick={() => {
              trackEvent('cross_sell_click', { kind: 'related', id: item.id });
              if (item.related_trainer_id) navigate(`/trainer/${item.related_trainer_id}`);
              else if (item.related_class_id) navigate(`/class/${item.related_class_id}`);
              else if (item.related_category) navigate(`/explore?category=${encodeURIComponent(item.related_category)}`);
            }}
          >
            <p className="text-sm font-semibold">{item.related_label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.related_category || 'Recommended'}
            </p>
          </button>
        ))}
        {partners.map((offer) => (
          <div
            key={offer.id}
            className="min-w-[14rem] shrink-0 rounded-xl border border-border bg-card p-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {offer.partner_name || 'Partner'}
            </p>
            <p className="mt-1 text-sm font-semibold">{offer.title}</p>
            {offer.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{offer.description}</p>
            ) : null}
            {offer.cta_url ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  trackEvent('cross_sell_click', { kind: 'partner', id: offer.id });
                  window.open(offer.cta_url!, '_blank', 'noopener,noreferrer');
                }}
              >
                View offer
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
