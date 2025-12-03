import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, MessageSquare, Calendar, CalendarDays, Star, Dumbbell } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/src/hooks/useAuth';
import { supabase } from '@/src/integrations/supabase/client';
import { useToast } from '@/src/hooks/use-toast';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';

interface NotificationPreferences {
  messages_enabled: boolean;
  bookings_enabled: boolean;
  events_enabled: boolean;
  daily_reminder_enabled: boolean;
  reviews_enabled: boolean;
}

const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    messages_enabled: true,
    bookings_enabled: true,
    events_enabled: true,
    daily_reminder_enabled: true,
    reviews_enabled: true,
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          messages_enabled: data.messages_enabled,
          bookings_enabled: data.bookings_enabled,
          events_enabled: data.events_enabled,
          daily_reminder_enabled: data.daily_reminder_enabled,
          reviews_enabled: data.reviews_enabled,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...newPreferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive push notifications.',
      });
    }
  };

  // Define notification options based on user role
  const notificationOptions = [
    {
      key: 'messages_enabled' as const,
      icon: MessageSquare,
      title: 'Messages',
      description: 'Get notified when you receive new messages',
      roles: ['trainer', 'student'],
    },
    {
      key: 'bookings_enabled' as const,
      icon: Calendar,
      title: userRole === 'trainer' ? 'New Bookings' : 'Booking Updates',
      description: userRole === 'trainer' 
        ? 'Get notified when clients book your classes' 
        : 'Get notified about your booking status changes',
      roles: ['trainer', 'student'],
    },
    {
      key: 'events_enabled' as const,
      icon: CalendarDays,
      title: 'Events in Your Area',
      description: 'Get notified about new events in your district',
      roles: ['trainer', 'student'],
    },
    {
      key: 'daily_reminder_enabled' as const,
      icon: Dumbbell,
      title: 'Daily Training Reminder',
      description: "Get a friendly reminder at 6 PM to not skip your workout",
      roles: ['student'],
    },
    {
      key: 'reviews_enabled' as const,
      icon: Star,
      title: 'New Reviews',
      description: 'Get notified when clients leave reviews for your classes',
      roles: ['trainer'],
    },
  ];

  const filteredOptions = notificationOptions.filter(option => 
    option.roles.includes(userRole || 'student')
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Notification Settings</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Permission Banner */}
        {isSupported && permission !== 'granted' && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">
                  Enable Push Notifications
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Allow notifications to receive alerts even when the app is closed.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={handleEnableNotifications}
                >
                  Enable Notifications
                </Button>
              </div>
            </div>
          </div>
        )}

        {permission === 'denied' && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground text-sm">
                  Notifications Blocked
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Please enable notifications in your browser settings to receive alerts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notification Options */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">
            Notification Types
          </h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {filteredOptions.map((option) => (
              <div
                key={option.key}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <option.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">
                      {option.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences[option.key]}
                  onCheckedChange={() => handleToggle(option.key)}
                  disabled={saving || permission === 'denied'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center px-4">
          You can change these settings at any time. Notifications help you stay updated with your fitness journey.
        </p>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
