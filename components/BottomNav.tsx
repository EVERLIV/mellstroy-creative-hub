import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from './NavLink';
import { Home, Search, MessageCircle, Calendar, User } from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.FC<any>;
}

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems: NavItem[] = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Explore', path: '/explore', icon: Search },
    { name: 'Messages', path: '/messages', icon: MessageCircle },
    { name: 'Bookings', path: '/bookings', icon: Calendar },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  // Haptic feedback function
  const triggerHapticFeedback = () => {
    // Check if Vibration API is supported
    if ('vibrate' in navigator) {
      // Short vibration for tap feedback (15ms)
      navigator.vibrate(15);
    }
  };

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    // Trigger haptic feedback
    triggerHapticFeedback();
    
    // Let the NavLink handle the navigation
    // No need to prevent default or manually navigate
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-background border-t border-border z-50 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
      <div className="flex justify-around items-center h-14 px-3 max-w-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end
              onClick={(e) => handleNavClick(item.path, e)}
              className={`relative flex items-center justify-center transition-all duration-300 ease-out rounded-full h-9 group
                active:scale-90 active:opacity-80
                ${
                  isActive
                    ? 'bg-primary/10 text-primary px-3 gap-1.5 shadow-sm'
                    : 'w-9 text-muted-foreground hover:bg-accent hover:scale-105'
                }`
              }
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon 
                className={`h-5 w-5 transition-transform duration-200 ${isActive ? '' : 'group-active:scale-90'}`} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className={`text-xs font-semibold whitespace-nowrap transition-opacity duration-200 ${isActive ? 'block animate-fade-in' : 'hidden'}`}>
                {item.name}
              </span>
              
              {/* Ripple effect on tap */}
              <span className={`absolute inset-0 rounded-full bg-foreground/10 opacity-0 group-active:opacity-20 group-active:animate-ping`} />
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
