import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Calendar, Settings, HelpCircle, Shield, type LucideIcon } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { cn } from '../src/lib/utils';
import { Button } from '../src/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../src/components/ui/sheet';

interface MenuItemProps {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    highlighted?: boolean;
}

function MenuItem({ icon: Icon, label, onClick, highlighted = false }: MenuItemProps) {
    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    'flex w-full items-center gap-4 rounded-lg p-3 text-left font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    highlighted ? 'border border-primary/20 bg-primary/10 text-primary' : 'text-foreground'
                )}
            >
                <Icon className={cn('h-5 w-5', highlighted ? 'text-primary' : 'text-muted-foreground')} />
                {label}
            </button>
        </li>
    );
}

const HamburgerMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        checkAdminStatus();
    }, []);

    const checkAdminStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();

        setIsAdmin(!!roles);
    };

    const handleNavigation = (page: string) => {
        navigate(page);
        setIsOpen(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu" className="-ml-2 rounded-full [&_svg]:size-6">
                    <Menu className="text-muted-foreground" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 sm:max-w-xs">
                <SheetHeader className="border-b border-border p-4 text-left">
                    <SheetTitle className="text-lg font-bold text-primary">Menu</SheetTitle>
                </SheetHeader>
                <nav className="p-4" aria-label="Account">
                    <ul className="space-y-2">
                        {isAdmin && (
                            <MenuItem icon={Shield} label="Admin Dashboard" onClick={() => handleNavigation('/admin')} highlighted />
                        )}
                        <MenuItem icon={Calendar} label="My Bookings" onClick={() => handleNavigation('/bookings')} />
                        <MenuItem icon={Settings} label="Settings" onClick={() => handleNavigation('/profile')} />
                        <MenuItem icon={HelpCircle} label="Help & Support" onClick={() => alert('Help & Support coming soon!')} />
                    </ul>
                </nav>
            </SheetContent>
        </Sheet>
    );
};

export default HamburgerMenu;
