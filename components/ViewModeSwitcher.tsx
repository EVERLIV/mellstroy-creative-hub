import React from 'react';
import { Shield, GraduationCap, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useViewMode, type ViewMode } from '@/src/hooks/useViewMode';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';

const MODES: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'trainer', label: 'Trainer', icon: Dumbbell },
  { id: 'admin', label: 'Admin', icon: Shield },
];

/**
 * Admin-only preview switcher: act as student / trainer / open admin console.
 */
export function ViewModeSwitcher({ className }: { className?: string }) {
  const { isAdmin, viewMode, setViewMode } = useViewMode();
  const navigate = useNavigate();

  if (!isAdmin) return null;

  const onSelect = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'admin') {
      navigate('/admin');
    } else if (viewMode === 'admin') {
      navigate('/');
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5',
        className
      )}
      role="group"
      aria-label="Preview as"
    >
      {MODES.map(({ id, label, icon: Icon }) => {
        const active = viewMode === id;
        return (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={active ? 'default' : 'ghost'}
            className={cn(
              'h-7 gap-1 px-2 text-xs',
              !active && 'text-muted-foreground'
            )}
            onClick={() => onSelect(id)}
            aria-pressed={active}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        );
      })}
    </div>
  );
}

export default ViewModeSwitcher;
