import { Bell } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/src/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/src/components/layout/states';
import { cn } from '@/src/lib/utils';

const MAX_BADGE_COUNT = 9;

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const badge = unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <Bell />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
            >
              {badge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] p-0 sm:w-80" align="end">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[min(400px,60vh)]">
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications yet" className="m-4 border-0 bg-transparent py-8" />
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
                      !notification.is_read && 'bg-primary/5'
                    )}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', !notification.is_read ? 'bg-primary' : 'bg-muted')}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-foreground">{notification.message}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </span>
                    {!notification.is_read && <span className="sr-only">Unread</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
