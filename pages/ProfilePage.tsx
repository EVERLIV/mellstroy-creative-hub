import React, { useState, useRef, useEffect } from 'react';
import { Trainer, Class, UserRole } from '../types';
import { Star, Users, BookOpen, Pencil, ShieldCheck, Plus, MoreVertical, Edit3, Trash2, Clock, LogOut, Shield } from 'lucide-react';
import RoleSwitcher from '../components/RoleSwitcher';
import { isTrainerProfileComplete } from '../utils/profile'; // New Import
import CompleteProfilePrompt from '../components/CompleteProfilePrompt'; // New Import
import { supabase } from '../src/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
};

interface ProfilePageProps {
    trainer: Trainer;
    onEdit: () => void;
    onManageClass: (cls: Class | null) => void; // null for adding new
    onDeleteClass: (classId: number) => void;
    userRole: UserRole;
    onRoleChange: (role: UserRole) => void;
    onStartVerification: () => void;
    onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ trainer, onEdit, onManageClass, onDeleteClass, userRole, onRoleChange, onStartVerification, onLogout }) => {
    const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const profileIsIncomplete = !isTrainerProfileComplete(trainer);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenFor(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const handleMenuToggle = (classId: number) => {
        setMenuOpenFor(prev => (prev === classId ? null : classId));
    };
    
    const handleDelete = (classId: number) => {
        if(window.confirm('Are you sure you want to delete this class?')) {
            onDeleteClass(classId);
        }
        setMenuOpenFor(null);
    }

    const VerificationStatus = () => {
        switch (trainer.verificationStatus) {
            case 'unverified':
                return (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-800">Become a Verified Trainer</h3>
                            <p className="text-sm text-slate-500 mt-1">Build trust and attract more clients.</p>
                        </div>
                        <button onClick={onStartVerification} className="flex items-center bg-blue-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                            <ShieldCheck className="w-5 h-5 mr-1.5" />
                            Get Verified
                        </button>
                    </div>
                );
            case 'pending':
                 return (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center">
                        <Clock className="w-5 h-5 mr-3 text-amber-600 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-amber-800">Verification Pending</h3>
                            <p className="text-sm text-amber-700 mt-1">Your submission is under review. This usually takes 1-2 business days.</p>
                        </div>
                    </div>
                );
            case 'verified':
                return null; // Don't show anything if already verified
        }
    };


    return (
        <div className="bg-slate-50 h-full overflow-y-auto relative">
            <button onClick={onEdit} className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-white/70 backdrop-blur-sm shadow px-3 py-2 rounded-full text-sm font-semibold text-slate-700 hover:bg-white transition-colors">
                <Pencil className="w-4 h-4" />
                <span>Edit</span>
            </button>
            
            {/* Header */}
            <div className="bg-white pb-6 pt-6">
                 <h1 className="text-2xl font-bold text-slate-800 text-center mb-4">My Profile</h1>
                <div className="flex flex-col items-center">
                    <img 
                        src={trainer.imageUrl} 
                        alt={trainer.name} 
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <h2 className="text-2xl font-bold text-slate-800 mt-3">{trainer.name}</h2>
                    <div className="mt-2 flex flex-wrap justify-center gap-2 px-4">
                        {trainer.specialty.map(spec => (
                            <span key={spec} className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{spec}</span>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex items-center space-x-6 text-sm text-slate-600">
                        <div className="flex items-center space-x-1.5">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/>
                            <span className="font-semibold">{trainer.rating.toFixed(1)}</span>
                            <span className="text-slate-400">Rating</span>
                        </div>
                         <div className="flex items-center space-x-1.5">
                            <Users className="w-4 h-4 text-sky-500"/>
                            <span className="font-semibold">{trainer.reviews}</span>
                            <span className="text-slate-400">Reviews</span>
                        </div>
                         <div className="flex items-center space-x-1.5">
                            <BookOpen className="w-4 h-4 text-emerald-500"/>
                            <span className="font-semibold">{trainer.classes.length}</span>
                            <span className="text-slate-400">Classes</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-4 space-y-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                {/* Complete Profile Prompt */}
                {profileIsIncomplete && (
                    <CompleteProfilePrompt role="trainer" onComplete={onEdit} />
                )}

                {/* Role Switcher */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                    <h3 className="font-bold text-slate-800 mb-2">Account Type</h3>
                    <RoleSwitcher currentRole={userRole} onRoleChange={onRoleChange} />
                </div>

                {/* Verification */}
                <VerificationStatus />
                

                {/* About */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                    <h3 className="font-bold text-slate-800 mb-2">About Me</h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{trainer.bio}</p>
                </div>
                
                {/* My Classes */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-800">My Classes</h3>
                        <button onClick={() => onManageClass(null)} className="flex items-center text-sm font-semibold text-white bg-[#FF6B35] hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">
                           <Plus className="w-5 h-5 mr-1" />
                           Add New
                        </button>
                    </div>
                    {trainer.classes.length > 0 ? (
                        <div className="space-y-3">
                            {trainer.classes.map(cls => (
                                <div key={cls.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center overflow-hidden">
                                        <img src={cls.imageUrl} alt={cls.name} className="w-14 h-14 rounded-md object-cover mr-3 flex-shrink-0" />
                                        <div className="overflow-hidden">
                                            <p className="font-semibold text-sm text-slate-700 truncate">{cls.name}</p>
                                            <p className="text-xs text-slate-500">{cls.duration} min &bull; {formatVND(cls.price)}</p>
                                        </div>
                                    </div>
                                    <div className="relative" ref={menuOpenFor === cls.id ? menuRef : null}>
                                        <button onClick={() => handleMenuToggle(cls.id)} className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-200">
                                            <MoreVertical className="w-5 h-5"/>
                                        </button>
                                        {menuOpenFor === cls.id && (
                                            <div className="absolute right-0 top-10 mt-1 w-36 bg-white rounded-lg shadow-xl z-10 border border-slate-200 animate-fade-in-fast">
                                                <button onClick={() => { onManageClass(cls); setMenuOpenFor(null); }} className="w-full text-left flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-t-lg">
                                                    <Edit3 className="w-4 h-4 mr-2" /> Edit
                                                </button>
                                                <button onClick={() => handleDelete(cls.id)} className="w-full text-left flex items-center px-3 py-2 text-sm text-red-600 hover:bg-slate-100 rounded-b-lg">
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-sm text-slate-500">You haven't added any classes yet.</p>
                        </div>
                    )}
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => navigate('/admin')}
                        className="w-full flex items-center justify-center bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all shadow-md mb-3"
                    >
                        <Shield className="w-5 h-5 mr-2" />
                        Admin Dashboard
                    </button>
                )}
                 <button 
                    onClick={onLogout}
                    className="w-full flex items-center justify-center bg-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-300 transition-colors"
                >
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
