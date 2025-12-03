import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';

export const NotificationPermissionPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { permission, isSupported, requestPermission } = usePushNotifications();

  useEffect(() => {
    // Show prompt if notifications are supported but not yet granted
    if (isSupported && permission === 'default') {
      // Check if user has dismissed the prompt recently
      const dismissedAt = localStorage.getItem('rhinofit_notification_prompt_dismissed');
      if (dismissedAt) {
        const dismissedDate = new Date(dismissedAt);
        const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) return; // Don't show for 7 days after dismissal
      }
      
      // Delay showing the prompt
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('rhinofit_notification_prompt_dismissed', new Date().toISOString());
    setShowPrompt(false);
  };

  if (!showPrompt || permission !== 'default') return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              Enable Notifications
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Get notified about new messages, bookings, and events in your area.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleEnable}
                className="text-xs"
              >
                Enable
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs"
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
