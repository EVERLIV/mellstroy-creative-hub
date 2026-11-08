import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin } from 'lucide-react';
import { fetchClassVenue } from '@/src/lib/marketplace';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

type VenueRow = {
  id: string;
  name: string;
  district: string | null;
  address: string | null;
  image_url?: string | null;
  amenities?: string[] | null;
};

export function ClassFacilityCard({
  classId,
  className,
}: {
  classId: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const [venue, setVenue] = useState<VenueRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await fetchClassVenue(classId);
      const v = (data as { venues?: VenueRow | null } | null)?.venues ?? null;
      if (!cancelled) setVenue(v);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  if (!venue) return null;

  return (
    <section
      className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-sm', className)}
      aria-label="Facility"
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        {venue.image_url ? (
          <img
            src={venue.image_url}
            alt=""
            className="h-24 w-full rounded-lg object-cover sm:h-20 sm:w-28"
          />
        ) : (
          <div className="grid h-20 w-28 place-items-center rounded-lg bg-muted">
            <Building2 className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Facility
          </p>
          <h3 className="text-sm font-semibold tracking-tight">{venue.name}</h3>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {[venue.address, venue.district].filter(Boolean).join(' · ') || 'Ho Chi Minh City'}
          </p>
          {venue.amenities?.length ? (
            <p className="truncate text-xs text-muted-foreground">
              {venue.amenities.slice(0, 4).join(' · ')}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => navigate('/venues')}>
          Browse facilities
        </Button>
      </div>
    </section>
  );
}
