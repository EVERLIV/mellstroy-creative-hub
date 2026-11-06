import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ChipGroupProps {
  /** Accessible name for the group. */
  label: string;
  options: readonly string[];
  selected: string[] | undefined;
  onToggle: (value: string) => void;
  /** Disable unselected chips once the limit is reached. */
  max?: number;
  className?: string;
}

/** Multi-select pill list (toggle buttons). Pure presentation: state lives in the page. */
export function ChipGroup({ label, options, selected, onToggle, max, className }: ChipGroupProps) {
  const count = selected?.length ?? 0;
  const atLimit = typeof max === 'number' && count >= max;

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group" aria-label={label}>
      {options.map((option) => {
        const isSelected = selected?.includes(option) ?? false;
        return (
          <button
            type="button"
            key={option}
            onClick={() => onToggle(option)}
            aria-pressed={isSelected}
            disabled={atLimit && !isSelected}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-50',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {isSelected && <Check className="size-3.5" aria-hidden="true" />}
            {option}
          </button>
        );
      })}
    </div>
  );
}
