import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Dumbbell,
  Heart,
  Home,
  MessageCircle,
  Search,
  Sparkles,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import ActionSearchBar, { type CommandItem } from '../src/components/kokonutui/action-search-bar';
import { cn } from '../src/lib/utils';

const NAV_ITEMS: CommandItem[] = [
  {
    id: 'home',
    label: 'Home',
    group: 'Navigate',
    keywords: ['dashboard', 'start'],
    icon: <Home className="h-4 w-4" />,
    href: '/',
  },
  {
    id: 'explore',
    label: 'Explore trainers',
    group: 'Navigate',
    keywords: ['search', 'find', 'trainer'],
    icon: <Search className="h-4 w-4" />,
    href: '/explore',
  },
  {
    id: 'bookings',
    label: 'My bookings',
    group: 'Navigate',
    keywords: ['classes', 'schedule'],
    icon: <Dumbbell className="h-4 w-4" />,
    href: '/bookings',
  },
  {
    id: 'messages',
    label: 'Messages',
    group: 'Navigate',
    keywords: ['chat', 'inbox'],
    icon: <MessageCircle className="h-4 w-4" />,
    href: '/messages',
  },
  {
    id: 'favorites',
    label: 'Favorites',
    group: 'Navigate',
    keywords: ['saved', 'liked'],
    icon: <Heart className="h-4 w-4" />,
    href: '/favorites',
  },
  {
    id: 'events',
    label: 'Events',
    group: 'Navigate',
    icon: <Calendar className="h-4 w-4" />,
    href: '/events',
  },
  {
    id: 'meal-planner',
    label: 'Meal planner',
    group: 'Premium',
    keywords: ['nutrition', 'food', 'diet'],
    icon: <UtensilsCrossed className="h-4 w-4" />,
    href: '/meal-planner',
  },
  {
    id: 'ai-coach',
    label: 'AI Fitness Coach',
    group: 'Premium',
    keywords: ['ai', 'coach', 'chat'],
    icon: <Sparkles className="h-4 w-4" />,
    href: '/ai-coach',
  },
  {
    id: 'profile',
    label: 'Profile',
    group: 'Account',
    keywords: ['settings', 'me'],
    icon: <User className="h-4 w-4" />,
    href: '/profile',
  },
];

interface CommandPaletteProps {
  className?: string;
}

/** ⌘K / Ctrl+K jump palette. Lives in SideNav on desktop. */
const CommandPalette: React.FC<CommandPaletteProps> = ({ className }) => {
  const navigate = useNavigate();

  return (
    <ActionSearchBar
      shortcut
      label="Jump to"
      placeholder="Search pages…"
      items={NAV_ITEMS}
      defaultRecent={['explore', 'bookings', 'messages', 'ai-coach']}
      onSelect={(item) => {
        if (item.href) navigate(item.href);
      }}
      className={cn('max-w-none', className)}
    />
  );
};

export default CommandPalette;
