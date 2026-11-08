import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useAuth } from '@/src/hooks/useAuth';
import { cn } from '@/src/lib/utils';

export function NotificationsBell({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, unread, markRead, markAll } = useNotifications(user?.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell className={cn('size-4', iconClassName)} />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary ring-2 ring-background" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)]">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          {unread > 0 ? (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => void markAll()}
            >
              Mark all read
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          items.slice(0, 12).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn(
                'flex cursor-pointer flex-col items-start gap-0.5 whitespace-normal py-2.5',
                !n.is_read && 'bg-primary/5'
              )}
              onSelect={() => {
                void markRead(n.id);
                if (n.href) {
                  navigate(n.href);
                } else if (n.type?.startsWith('waitlist')) {
                  navigate('/bookings?tab=waitlist');
                }
              }}
            >
              <span className="text-sm font-medium leading-snug">
                {n.title || n.type.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-muted-foreground">{n.message}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
