import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trainer, Class, UserRole } from '../types';
import { Star, Users, BookOpen, Pencil, ShieldCheck, Plus, MoreVertical, Edit3, Trash2, Clock, LogOut, Shield, FileText, Crown, MapPin, Sparkles, CalendarDays, Heart } from 'lucide-react';
import { isTrainerProfileComplete } from '../utils/profile';
import CompleteProfilePrompt from '../components/CompleteProfilePrompt';
import { supabase } from '../src/integrations/supabase/client';
import MyDocumentsPage from './MyDocumentsPage';
import { getVersionString } from '../src/config/appVersion';

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
    onManageClass: (cls: Class | null) => void;
    onDeleteClass: (classId: number) => void;
    userRole: UserRole;
    onStartVerification: () => void;
    onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ trainer, onEdit, onManageClass, onDeleteClass, userRole, onStartVerification, onLogout }) => {
    const navigate = useNavigate();
    const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showDocuments, setShowDocuments] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);
    const profileIsIncomplete = !isTrainerProfileComplete(trainer);

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
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('trainer_documents')
            .select('*')
            .eq('trainer_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);

        setDocuments(data || []);
    };

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
                    <div className="bg-card p-4 rounded-xl border border-border flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Become a Verified Trainer</h3>
                            <p className="text-xs text-muted-foreground mt-1">Build trust and attract more clients.</p>
                        </div>
                        <button
                            onClick={onStartVerification}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
                        >
                            Verify
                        </button>
                    </div>
                );
            case 'pending':
                return (
                    <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Verification Pending</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Your request is being reviewed.</p>
                        </div>
                    </div>
                );
            case 'verified':
                return (
                    <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Verified Trainer</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Your profile is verified and trusted.</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (showDocuments) {
        return <MyDocumentsPage onBack={() => { setShowDocuments(false); loadDocuments(); }} />;
    }

    return (
        <div className="bg-background h-full flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-card border-b border-border flex-shrink-0">
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-lg font-bold text-foreground">Profile</h1>
                        <button 
                            onClick={onEdit}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            aria-label="Edit profile"
                        >
                            <Pencil className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Profile Card */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                            <img 
                                src={trainer.imageUrl} 
                                alt={trainer.name} 
                                className="w-16 h-16 rounded-full object-cover ring-2 ring-border"
                            />
                            {trainer.verificationStatus === 'verified' && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 ring-2 ring-card">
                                    <ShieldCheck className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h2 className="text-base font-bold text-foreground truncate">
                                    {trainer.name}
                                </h2>
                                {trainer.isPremium ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full">
                                        <Crown className="w-3 h-3 text-white" />
                                        <span className="text-xs font-bold text-white">Premium</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full">
                                        <Sparkles className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs font-medium text-muted-foreground">Basic</span>
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap text-xs">
                                {trainer.location && (
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="w-3 h-3" />
                                        {trainer.location}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span className="font-semibold text-foreground">{trainer.rating.toFixed(1)}</span>
                                    <span className="text-muted-foreground">({trainer.reviews})</span>
                                </span>
                            </div>
                            {trainer.specialty && trainer.specialty.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    {trainer.specialty.slice(0, 3).map((spec, idx) => (
                                        <span key={idx} className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            {spec}
                                        </span>
                                    ))}
                                    {trainer.specialty.length > 3 && (
                                        <span className="text-xs text-muted-foreground">+{trainer.specialty.length - 3}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Content */}
            <main className="flex-1 overflow-y-auto min-h-0">
                <div className="px-4 py-4 space-y-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
                    
                    {/* Complete Profile Prompt */}
                    {profileIsIncomplete && (
                        <CompleteProfilePrompt role="trainer" onComplete={onEdit} />
                    )}

                    {/* Verification */}
                    <VerificationStatus />

                    {/* Premium CTA */}
                    {!trainer.isPremium ? (
                        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 p-4 rounded-xl">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <Crown className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-white mb-1">Upgrade to Premium</h3>
                                    <p className="text-xs text-white/90 mb-3">Unlock 5 photos per class, priority listing, and advanced analytics</p>
                                    <button 
                                        onClick={() => navigate('/subscription')}
                                        className="w-full bg-white text-amber-600 px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors"
                                    >
                                        Get Premium RhinoFit
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/subscription')}
                            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                    <Crown className="w-5 h-5 text-amber-500" />
                                </div>
                                <span className="text-sm font-semibold text-foreground">Manage Subscription</span>
                            </div>
                            <span className="text-xs text-muted-foreground">View →</span>
                        </button>
                    )}

                    {/* My Documents */}
                    <div className="bg-card p-4 rounded-xl border border-border">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-semibold text-foreground">My Documents</h3>
                            <button 
                                onClick={() => setShowDocuments(true)} 
                                className="flex items-center text-xs font-medium text-primary hover:text-primary/80"
                            >
                                <FileText className="w-4 h-4 mr-1" />
                                View All
                            </button>
                        </div>
                        {documents.length > 0 ? (
                            <div className="space-y-2">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            <span className="text-sm text-foreground truncate">{doc.title}</span>
                                        </div>
                                        {doc.is_verified ? (
                                            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full font-medium">Verified</span>
                                        ) : (
                                            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full font-medium">Pending</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-sm text-muted-foreground mb-2">No documents uploaded</p>
                                <button 
                                    onClick={() => setShowDocuments(true)}
                                    className="text-sm font-medium text-primary hover:text-primary/80"
                                >
                                    Upload Documents
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Classes Section */}
                    <div className="bg-card p-4 rounded-xl border border-border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-foreground">My Classes ({trainer.classes.length})</h3>
                            <button
                                onClick={() => onManageClass(null)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Class
                            </button>
                        </div>

                        {trainer.classes.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium text-foreground mb-1">No classes yet</p>
                                <p className="text-xs text-muted-foreground mb-4">Create your first class to start teaching</p>
                                <button
                                    onClick={() => onManageClass(null)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
                                >
                                    Create Class
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {trainer.classes.map((cls) => (
                                    <div key={cls.id} className="bg-muted/50 rounded-xl p-3 border border-border hover:border-primary/30 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex gap-3 flex-1 min-w-0">
                                                <img 
                                                    src={cls.imageUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48'} 
                                                    alt={cls.name} 
                                                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-foreground mb-1 truncate">{cls.name}</h4>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{cls.description}</p>
                                                    <div className="flex items-center gap-2 flex-wrap text-xs">
                                                        <span className="font-semibold text-primary">{formatVND(cls.price)}</span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-muted-foreground">{cls.duration} min</span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-muted-foreground">{cls.capacity} spots</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative flex-shrink-0" ref={menuRef}>
                                                <button
                                                    onClick={() => handleMenuToggle(cls.id as number)}
                                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                                {menuOpenFor === cls.id && (
                                                    <div className="absolute right-0 top-10 bg-popover rounded-lg shadow-lg border border-border py-1 z-20 min-w-[120px]">
                                                        <button
                                                            onClick={() => {
                                                                onManageClass(cls);
                                                                setMenuOpenFor(null);
                                                            }}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-popover-foreground hover:bg-muted flex items-center gap-2"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(cls.id as number)}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-2">
                        {/* Favorites */}
                        <button
                            onClick={() => navigate('/favorites')}
                            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-semibold text-foreground">Favorites</h3>
                                    <p className="text-xs text-muted-foreground">Your saved trainers</p>
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground">View →</span>
                        </button>

                        {/* Events */}
                        <button
                            onClick={() => navigate('/events')}
                            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <CalendarDays className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-semibold text-foreground">Events</h3>
                                    <p className="text-xs text-muted-foreground">Join community events</p>
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground">View →</span>
                        </button>
                    </div>

                    {/* Admin Panel Link */}
                    {isAdmin && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="w-full bg-violet-600 text-white p-4 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Shield className="w-5 h-5" />
                            Admin Dashboard
                        </button>
                    )}

                    {/* Logout */}
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center bg-muted text-muted-foreground text-sm font-medium py-3 rounded-xl hover:bg-muted/80 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Logout
                    </button>

                    {/* App Version */}
                    <p className="text-center text-xs text-muted-foreground pt-2">
                        {getVersionString()}
                    </p>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;