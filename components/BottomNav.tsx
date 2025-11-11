
import React from 'react';
import { Home, LayoutGrid, Calendar, MessageCircle, User, Shield } from 'lucide-react';

type NavItemName = 'Home' | 'Catalog' | 'My Classes' | 'Messages' | 'Profile' | 'Admin';

interface BottomNavProps {
    activeTab: NavItemName;
    onNavigate: (tab: NavItemName) => void;
    favoriteCount?: number;
    bookingsCount?: number;
    messagesCount?: number;
    isAdmin?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onNavigate, favoriteCount, bookingsCount, messagesCount, isAdmin }) => {
  const navItems: { name: NavItemName; icon: React.FC<any>; adminOnly?: boolean }[] = [
    { name: 'Home', icon: Home },
    { name: 'Catalog', icon: LayoutGrid },
    { name: 'My Classes', icon: Calendar },
    { name: 'Messages', icon: MessageCircle },
    { name: 'Profile', icon: User },
    { name: 'Admin', icon: Shield, adminOnly: true },
  ];
  
  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 max-w-md mx-auto shadow-[0_-1px_4px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-2">
        {visibleNavItems.map((item) => {
          const isActive = activeTab === item.name;
          const navItemName = item.name;
          
          let count = 0;
          if (navItemName === 'Profile' && favoriteCount) count = favoriteCount;
          if (navItemName === 'My Classes' && bookingsCount) count = bookingsCount;
          if (navItemName === 'Messages' && messagesCount) count = messagesCount;

          const showCounter = count > 0;

          return (
            <button
              key={item.name}
              onClick={() => onNavigate(item.name)}
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
              <span className={`text-sm font-semibold whitespace-nowrap ${isActive ? 'block' : 'hidden'}`}>{item.name}</span>
              {showCounter && (
                 <span
                  className={`absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full
                    ${isActive ? 'transform -translate-y-1 translate-x-1' : 'transform translate-y-0.5 translate-x-0.5'}
                  `}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
