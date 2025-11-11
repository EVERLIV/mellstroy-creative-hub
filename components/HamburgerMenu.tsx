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
                className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-bold text-lg bg-gradient-to-r from-[#FF6B35] to-[#4A90E2] text-transparent bg-clip-text">Menu</h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
                        <X className="w-6 h-6 text-slate-600" />
                    </button>
                </div>
                <nav className="p-4">
                    <ul className="space-y-2">
                        {isAdmin && (
                            <li>
                                <button onClick={() => handleNavigation('/admin')} className="w-full flex items-center p-3 text-left rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors bg-orange-50 border border-orange-200">
                                    <Shield className="w-5 h-5 mr-4 text-orange-600" />
                                    <span className="text-orange-600">Admin Dashboard</span>
                                </button>
                            </li>
                        )}
                        <li>
                            <button onClick={() => handleNavigation('/bookings')} className="w-full flex items-center p-3 text-left rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors">
                                <Calendar className="w-5 h-5 mr-4 text-slate-500" />
                                My Bookings
                            </button>
                        </li>
                        <li>
                             <button onClick={() => handleNavigation('/profile')} className="w-full flex items-center p-3 text-left rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors">
                                <Settings className="w-5 h-5 mr-4 text-slate-500" />
                                Settings
                            </button>
                        </li>
                         <li>
                             <button onClick={() => alert('Help & Support coming soon!')} className="w-full flex items-center p-3 text-left rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors">
                                <HelpCircle className="w-5 h-5 mr-4 text-slate-500" />
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
