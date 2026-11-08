import React, { useMemo } from 'react';
import { HCMC_DISTRICT_COORDS, resolveDistrict, type LatLng } from '@/src/lib/geo';
import { cn } from '@/src/lib/utils';

type Pin = {
  id: string;
  label: string;
  location?: string | null;
  count?: number;
};

function project(coords: LatLng, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  const x = ((coords.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = (1 - (coords.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
  return { x: Math.min(96, Math.max(4, x)), y: Math.min(96, Math.max(4, y)) };
}

export function DistrictMap({
  pins,
  selectedId,
  onSelect,
  className,
}: {
  pins: Pin[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const bounds = useMemo(() => {
    const values = Object.values(HCMC_DISTRICT_COORDS);
    return {
      minLat: Math.min(...values.map((v) => v.lat)) - 0.02,
      maxLat: Math.max(...values.map((v) => v.lat)) + 0.02,
      minLng: Math.min(...values.map((v) => v.lng)) - 0.02,
      maxLng: Math.max(...values.map((v) => v.lng)) + 0.02,
    };
  }, []);

  const plotted = useMemo(() => {
    const byDistrict = new Map<string, { pin: Pin; coords: LatLng; count: number }>();
    for (const pin of pins) {
      const district = resolveDistrict(pin.location);
      if (!district) continue;
      const coords = HCMC_DISTRICT_COORDS[district];
      if (!coords) continue;
      const existing = byDistrict.get(district);
      if (existing) {
        existing.count += pin.count ?? 1;
      } else {
        byDistrict.set(district, { pin, coords, count: pin.count ?? 1 });
      }
    }
    return [...byDistrict.entries()].map(([district, value]) => ({
      district,
      ...value,
      point: project(value.coords, bounds),
    }));
  }, [pins, bounds]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-[linear-gradient(160deg,hsl(var(--muted))_0%,hsl(var(--card))_45%,hsl(210_40%_92%)_100%)] dark:bg-[linear-gradient(160deg,hsl(var(--muted))_0%,hsl(var(--card))_60%)]',
        className
      )}
      role="img"
      aria-label="Ho Chi Minh City district map"
    >
      <svg className="absolute inset-0 size-full opacity-40" aria-hidden>
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
        {plotted.map(({ district, pin, point, count }) => {
          const active = selectedId === pin.id || selectedId === district;
          return (
            <button
              key={district}
              type="button"
              title={`${district} · ${count}`}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-[10px] font-semibold shadow-sm transition-transform touch-manipulation',
                active
                  ? 'z-10 scale-110 border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:scale-105'
              )}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => onSelect?.(pin.id)}
            >
              {count}
            </button>
          );
        })}
        {plotted.length === 0 ? (
          <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            No mapped locations yet
          </p>
        ) : null}
      </div>
      <p className="border-t border-border/60 bg-card/80 px-3 py-2 text-[11px] text-muted-foreground">
        HCMC districts · pin size by listing count
      </p>
    </div>
  );
}
