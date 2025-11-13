import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Calendar, Settings, HelpCircle, Shield } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';

const HamburgerMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
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

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const MenuContent = (
        <>
            <div 
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />
            <div
                ref={menuRef}
                className={`fixed top-0 left-0 h-full w-72 bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-border ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="font-bold text-lg text-primary">Menu</h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
                        <X className="w-6 h-6 text-foreground" />
                    </button>
                </div>
                <nav className="p-4">
                    <ul className="space-y-2">
                        {isAdmin && (
                            <li>
                                <button onClick={() => handleNavigation('/admin')} className="w-full flex items-center p-3 text-left rounded-lg font-semibold hover:bg-muted transition-colors bg-primary/10 border border-primary/20">
                                    <Shield className="w-5 h-5 mr-4 text-primary" />
                                    <span className="text-primary">Admin Dashboard</span>
                                </button>
                            </li>
                        )}
                        <li>
                            <button onClick={() => handleNavigation('/bookings')} className="w-full flex items-center p-3 text-left rounded-lg text-foreground font-semibold hover:bg-muted transition-colors">
                                <Calendar className="w-5 h-5 mr-4 text-muted-foreground" />
                                My Bookings
                            </button>
                        </li>
                        <li>
                             <button onClick={() => handleNavigation('/profile')} className="w-full flex items-center p-3 text-left rounded-lg text-foreground font-semibold hover:bg-muted transition-colors">
                                <Settings className="w-5 h-5 mr-4 text-muted-foreground" />
                                Settings
                            </button>
                        </li>
                         <li>
                             <button onClick={() => alert('Help & Support coming soon!')} className="w-full flex items-center p-3 text-left rounded-lg text-foreground font-semibold hover:bg-muted transition-colors">
                                <HelpCircle className="w-5 h-5 mr-4 text-muted-foreground" />
                                Help & Support
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </>
    );

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
            >
                <Menu className="h-6 w-6 text-gray-700" />
            </button>
            {ReactDOM.createPortal(MenuContent, document.body)}
        </>
    );
};

export default HamburgerMenu;
