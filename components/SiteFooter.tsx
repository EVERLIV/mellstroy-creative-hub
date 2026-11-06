import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '@/src/components/design-system/nav';
import { APP_CONTENT } from '@/src/components/layout/shell';
import { cn } from '@/src/lib/utils';

/**
 * Intent: desktop athlete finishing a scroll — secondary paths + trust, never compete with Book.
 * Hierarchy: brand lockup leads; link columns demoted; legal muted.
 * Depth: borders only. Spacing: 8px grid. Hidden on mobile (PWA uses bottom tabs).
 * Rejecting: mega-footer / social emoji rows / purple SaaS chrome.
 */

const COLUMNS = [
  {
    title: 'Train',
    links: [
      { label: 'Find coaches', to: '/explore' },
      { label: 'Venues & courts', to: '/venues' },
      { label: 'Events', to: '/events' },
      { label: 'Bookings', to: '/bookings' },
    ],
  },
  {
    title: 'Discover',
    links: [
      { label: 'Favorites', to: '/favorites' },
      { label: 'AI Coach', to: '/ai-coach' },
      { label: 'Meal planner', to: '/meal-planner' },
      { label: 'Search', to: '/search' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Profile', to: '/profile' },
      { label: 'Subscription', to: '/subscription' },
      { label: 'Messages', to: '/messages' },
      { label: 'Settings', to: '/profile?tab=settings' },
    ],
  },
] as const;

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        'hidden border-t border-border bg-card md:block',
        className
      )}
      aria-label="Site"
    >
      <div className={cn(APP_CONTENT, 'py-12 lg:py-14')}>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <BrandMark size="md" />
              <span className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-foreground">RhinoFit</span>
                <span className="text-[11px] font-medium text-muted-foreground">Train smarter.</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
              Book coaches, courts and classes across Saigon — one tap from discovery to the mat.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 sm:gap-8 lg:col-span-8">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {col.title}
                </p>
                <ul className="mt-3 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={`${col.title}-${link.label}`}>
                      <Link
                        to={link.to}
                        className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} RhinoFit. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>District 1 · Ho Chi Minh City</span>
            <span className="hidden h-3 w-px bg-border sm:block" aria-hidden />
            <Link to="/profile" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/profile" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
