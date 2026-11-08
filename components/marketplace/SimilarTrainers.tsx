import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Trainer } from '../../types';
import { Badge } from '@/src/components/ui/badge';
import { trackEvent } from '@/src/lib/analytics';

export function pickSimilarTrainers(current: Trainer, pool: Trainer[], limit = 4): Trainer[] {
  const specialty = new Set((current.specialty || []).map((s) => s.toLowerCase()));
  const district = current.location || '';
  return pool
    .filter((t) => t.id !== current.id)
    .map((t) => {
      let score = 0;
      for (const s of t.specialty || []) {
        if (specialty.has(s.toLowerCase())) score += 3;
      }
      if (district && t.location?.includes(district.split(',')[0]?.trim() || '')) score += 2;
      score += t.rating;
      return { t, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.t);
}

export function SimilarTrainers({
  trainers,
  title = 'Similar coaches',
}: {
  trainers: Trainer[];
  title?: string;
}) {
  const navigate = useNavigate();
  if (!trainers.length) return null;

  return (
    <section className="space-y-3" aria-label={title}>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {trainers.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
              onClick={() => {
                trackEvent('cross_sell_click', { kind: 'similar_trainer', trainerId: t.id });
                navigate(`/trainer/${t.id}`);
              }}
            >
              <img
                src={t.imageUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&q=60'}
                alt=""
                className="size-11 rounded-lg object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{t.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t.specialty?.[0] || 'Coach'} · {t.location || 'HCMC'}
                </span>
              </span>
              <Badge variant="secondary" className="tabular-nums">
                {t.rating.toFixed(1)}
              </Badge>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
