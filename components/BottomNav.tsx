import React from 'react';
import { useLocation } from 'react-router-dom';
import { NavLink } from './NavLink';
import { Home, Search, Heart, Calendar, User } from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.FC<any>;
}

const BottomNav: React.FC = () => {
  const location = useLocation();
  
  const navItems: NavItem[] = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Favorites', path: '/favorites', icon: Heart },
    { name: 'Bookings', path: '/bookings', icon: Calendar },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-100 z-50 shadow-[0_-1px_4px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-4 sm:px-6 md:px-8 lg:px-12 max-w-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end
              className={`relative flex items-center justify-center transition-all duration-300 ease-in-out rounded-full h-10 group
                ${
                  isActive
                    ? 'bg-orange-100 text-[#FF6B35] px-4 gap-2'
                    : 'w-10 text-gray-500 hover:bg-gray-100'
                }`
              }
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon 
                className={`h-6 w-6`} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className={`text-sm font-semibold whitespace-nowrap ${isActive ? 'block' : 'hidden'}`}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
