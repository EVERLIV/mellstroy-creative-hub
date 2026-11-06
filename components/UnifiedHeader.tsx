import React from 'react';
import { Category } from '../types';
import HamburgerMenu from './HamburgerMenu';
import CategoryFilters from './CategoryFilters';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/src/hooks/useAuth';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import rhinoLogo from '@/src/assets/rhino-logo.png';
import { cn } from '@/src/lib/utils';
import { PAGE_GUTTER, PAGE_WIDTH } from '@/src/components/layout/shell';

interface UnifiedHeaderProps {
  selectedDistrict: string;
  onOpenDistrictModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

/**
 * Mobile: [logo · menu] ........ [district · theme · bell]
 *         [search ───────────────────────────────────────]
 * md+:    [menu] [search ─────────] ... [district · theme · bell]
 * One search input in the DOM; its position is changed with flex `order`.
 */
const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  selectedDistrict,
  onOpenDistrictModal,
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 pb-4 pt-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className={cn('mx-auto flex w-full flex-wrap items-center gap-x-3 gap-y-4', PAGE_WIDTH.wide, PAGE_GUTTER)}>
        <div className="order-1 flex items-center gap-3">
          {/* On md+ the logo lives in SideNav */}
          <img src={rhinoLogo} alt="RhinoFit" className="h-20 w-20 object-contain md:hidden" />
          <HamburgerMenu />
        </div>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
          <Button
            variant="outline"
            onClick={onOpenDistrictModal}
            className="h-10 gap-1 rounded-full px-3 shadow-sm"
            aria-label={`District: ${selectedDistrict}. Change district`}
          >
            <MapPin className="text-muted-foreground" />
            <span className="max-w-[120px] truncate">{selectedDistrict}</span>
            <ChevronDown className="text-muted-foreground" />
          </Button>
          <ThemeToggle />
          {user && <NotificationBell />}
        </div>

        <div className="relative order-3 w-full md:order-2 md:w-auto md:max-w-xl md:flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search trainers or specialties..."
            aria-label="Search trainers or specialties"
            className="h-12 rounded-xl bg-muted pl-11 pr-4 text-base md:text-sm"
          />
        </div>
      </div>

      <div className={cn('relative mx-auto mb-2 mt-4 w-full overflow-visible', PAGE_WIDTH.wide, PAGE_GUTTER)}>
        <CategoryFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      </div>
    </header>
  );
};

export default UnifiedHeader;
