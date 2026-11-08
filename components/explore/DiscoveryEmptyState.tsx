import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../constants';
import type { Trainer } from '../../types';
import { Button } from '@/src/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/src/components/ui/empty';
import { Badge } from '@/src/components/ui/badge';

export function DiscoveryEmptyState({
  similar,
  onClear,
  title = 'No coaches found',
}: {
  similar: Trainer[];
  onClear: () => void;
  title?: string;
}) {
  const navigate = useNavigate();
  const adjacent = CATEGORIES.slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <Empty className="border border-dashed bg-card">
        <EmptyHeader>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>
            Try nearby categories, similar coaches, or leave a training request.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            Clear filters
          </Button>
          <Button type="button" size="sm" onClick={() => navigate('/requests/create')}>
            Leave a request
          </Button>
        </EmptyContent>
      </Empty>

      <div className="flex flex-wrap gap-2">
        <span className="w-full text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Adjacent categories
        </span>
        {adjacent.map((c) => (
          <Button
            key={c.id}
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => navigate(`/explore?category=${c.id}`)}
          >
            {c.name}
          </Button>
        ))}
      </div>

      {similar.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Similar coaches
          </span>
          <ul className="divide-y divide-border rounded-xl border border-border/80 bg-card">
            {similar.slice(0, 5).map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
                  onClick={() => navigate(`/trainer/${t.id}`)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{t.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t.location || 'HCMC'} · {t.specialty?.[0] || 'Coach'}
                    </span>
                  </span>
                  <Badge variant="secondary" className="tabular-nums">
                    {t.rating.toFixed(1)}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
