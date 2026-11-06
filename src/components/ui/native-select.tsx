import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

/**
 * Native <select> styled exactly like <Input>. Keeps the OS picker on mobile
 * (best UX on phones) and works with plain onChange={(e) => e.target.value}.
 */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-11 w-full appearance-none rounded-md border border-input bg-transparent py-1 pl-3 pr-9 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive md:h-10 md:text-sm',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
);
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
