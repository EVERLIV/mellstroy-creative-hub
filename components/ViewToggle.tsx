import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

const OPTIONS = [
  { mode: 'grid', label: 'Grid view', icon: LayoutGrid },
  { mode: 'list', label: 'List view', icon: List },
] as const;

const ViewToggle: React.FC<ViewToggleProps> = React.memo(({ viewMode, setViewMode }) => (
  <div
    role="group"
    aria-label="View mode"
    className="inline-flex rounded-lg border border-border bg-card p-0.5 shadow-sm"
  >
    {OPTIONS.map(({ mode, label, icon: Icon }) => {
      const isActive = viewMode === mode;
      return (
        <button
          key={mode}
          type="button"
          onClick={() => setViewMode(mode)}
          aria-label={label}
          aria-pressed={isActive}
          className={cn(
            'grid size-8 place-items-center rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isActive
              ? 'bg-[#e9edff] text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="size-4" />
        </button>
      );
    })}
  </div>
));

ViewToggle.displayName = 'ViewToggle';

export default ViewToggle;
