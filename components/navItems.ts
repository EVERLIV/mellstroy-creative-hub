import {
  Calendar,
  CalendarDays,
  Dumbbell,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  User,
  UtensilsCrossed,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  alternativePaths?: string[];
}

/** Primary destinations — MorphicNavbar + sidebar Primary group. */
export const NAV_ITEMS: readonly NavItem[] = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Explore', path: '/explore', icon: Search, alternativePaths: ['/requests/explore'] },
  { name: 'Messages', path: '/messages', icon: MessageCircle },
  { name: 'Bookings', path: '/bookings', icon: Calendar },
  { name: 'Profile', path: '/profile', icon: User },
];

/** Secondary discover links — desktop sidebar only. */
export const DISCOVER_ITEMS: readonly NavItem[] = [
  { name: 'Events', path: '/events', icon: CalendarDays },
  { name: 'Venues & Courts', path: '/venues', icon: MapPin },
  { name: 'Search', path: '/search', icon: Dumbbell },
  { name: 'Favorites', path: '/favorites', icon: Heart },
  { name: 'Meal planner', path: '/meal-planner', icon: UtensilsCrossed },
  { name: 'AI Coach', path: '/ai-coach', icon: Sparkles },
];

/** Account links — desktop sidebar / mobile drawer. */
export const ACCOUNT_ITEMS: readonly NavItem[] = [
  { name: 'Account Settings', path: '/profile?tab=settings', icon: User },
  { name: 'Subscription', path: '/subscription', icon: CreditCard },
];

export const isNavItemActive = (item: NavItem, pathname: string): boolean =>
  pathname === item.path || (item.alternativePaths?.includes(pathname) ?? false);

const HAPTIC_TAP_MS = 15;

export const triggerHapticFeedback = (): void => {
  if ('vibrate' in navigator) {
    navigator.vibrate(HAPTIC_TAP_MS);
  }
};

/** MorphicNavbar items map (path → label). Role-aware Explore path applied by AppShell. */
export function morphicItemsForRole(role: 'student' | 'trainer' | string): Record<string, { name: string }> {
  const explorePath = role === 'trainer' ? '/requests/explore' : '/explore';
  return {
    '/': { name: 'Home' },
    [explorePath]: { name: 'Explore' },
    '/messages': { name: 'Messages' },
    '/bookings': { name: 'Bookings' },
    '/profile': { name: 'Profile' },
  };
}
