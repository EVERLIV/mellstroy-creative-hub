import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trainer, Class, UserRole } from '../types';
import { Star, Users, BookOpen, Pencil, ShieldCheck, Plus, MoreVertical, Edit3, Trash2, Clock, LogOut, Shield, FileText, Crown, MapPin, Sparkles, CalendarDays } from 'lucide-react';
import { isTrainerProfileComplete } from '../utils/profile';
import CompleteProfilePrompt from '../components/CompleteProfilePrompt';
import { supabase } from '../src/integrations/supabase/client';
import MyDocumentsPage from './MyDocumentsPage';

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
                    <div className="bg-white p-3 rounded-lg shadow-sm mb-3 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Become a Verified Trainer</h3>
                            <p className="text-xs text-gray-600 mt-1">Build trust and attract more clients.</p>
                        </div>
                        <button
                            onClick={onStartVerification}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 active:scale-95 shadow-sm transition-all duration-200"
                        >
                            Verify
                        </button>
                    </div>
                );
            case 'pending':
                return (
                    <div className="bg-white p-3 rounded-lg shadow-sm mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-amber-500" />
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Verification Pending</h3>
                                <p className="text-xs text-gray-600 mt-1">Your verification request is being reviewed.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'verified':
                return (
                    <div className="bg-white p-3 rounded-lg shadow-sm mb-3 flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-green-500" />
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Verified Trainer</h3>
                            <p className="text-xs text-gray-600 mt-1">Your profile is verified and trusted.</p>
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
        <div className="bg-gray-50 h-full overflow-y-auto relative">
            {/* Modern Compact Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
                <div className="px-4 py-3">
                    {/* Top Row: Title and Edit Button */}
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-base font-bold text-gray-900">Profile</h1>
                        <button 
                            onClick={onEdit}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Edit profile"
                        >
                            <Pencil className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>

                    {/* Profile Info Row: Avatar, Name, Badges, Stats */}
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <img 
                                src={trainer.imageUrl} 
                                alt={trainer.name} 
                                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            {trainer.verificationStatus === 'verified' && (
                                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white">
                                    <ShieldCheck className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Name and Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h2 className="text-base font-bold text-gray-900 truncate">
                                    {trainer.name}
                                </h2>
                                {trainer.isPremium && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-sm">
                                        <Crown className="w-3 h-3 text-white" />
                                        <span className="text-xs font-bold text-white">Premium</span>
                                    </div>
                                )}
                                {!trainer.isPremium && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                                        <Sparkles className="w-3 h-3 text-gray-600" />
                                        <span className="text-xs font-medium text-gray-700">Basic</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                {trainer.location && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate">{trainer.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span className="font-medium text-gray-900">{trainer.rating.toFixed(1)}</span>
                                    <span className="text-gray-400">({trainer.reviews})</span>
                                </div>
                                {trainer.specialty && trainer.specialty.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        {trainer.specialty.slice(0, 2).map((spec, idx) => (
                                            <span key={idx} className="text-xs font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                                {spec}
                                            </span>
                                        ))}
                                        {trainer.specialty.length > 2 && (
                                            <span className="text-xs text-gray-400">+{trainer.specialty.length - 2}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="px-4 py-3 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                {/* Complete Profile Prompt */}
                {profileIsIncomplete && (
                    <CompleteProfilePrompt role="trainer" onComplete={onEdit} />
                )}

                {/* Verification */}
                <VerificationStatus />

                {/* Premium CTA */}
                {!trainer.isPremium ? (
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-500 p-4 rounded-lg mb-3 shadow-sm">
                        <div className="flex items-start gap-3">
                            <Crown className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-white mb-1">Upgrade to Premium</h3>
                                <p className="text-xs text-white/90 mb-3">Unlock 5 photos per class, priority listing, verified badge, and advanced analytics</p>
                                <button 
                                    onClick={() => navigate('/subscription')}
                                    className="w-full bg-white text-amber-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors"
                                >
                                    Get Premium RhinoFit
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => navigate('/subscription')}
                        className="w-full bg-white p-3 rounded-lg shadow-sm mb-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-500" />
                            <span className="text-sm font-bold text-gray-900">Manage Subscription</span>
                        </div>
                        <span className="text-xs text-gray-500">View details →</span>
                    </button>
                )}

                {/* My Documents */}
                    <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-gray-900">My Documents</h3>
                        <button 
                            onClick={() => setShowDocuments(true)} 
                            className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                            <FileText className="w-4 h-4 mr-1" />
                            View All
                        </button>
                    </div>
                    {documents.length > 0 ? (
                        <div className="space-y-2">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                        <span className="text-xs text-gray-900 truncate">{doc.title}</span>
                                    </div>
                                    {doc.is_verified ? (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Verified</span>
                                    ) : (
                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Not Verified</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-xs text-gray-600 mb-2">No documents uploaded</p>
                            <button 
                                onClick={() => setShowDocuments(true)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                                Upload Documents
                            </button>
                        </div>
                    )}
                </div>

                {/* Classes Section */}
                    <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-900">My Classes ({trainer.classes.length})</h3>
                        <button
                            onClick={() => onManageClass(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 active:scale-95 shadow-sm transition-all duration-200"
                        >
                            <Plus className="w-4 h-4" />
                            Add Class
                        </button>
                    </div>

                    {trainer.classes.length === 0 ? (
                        <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-xs text-gray-900 font-medium mb-1">No classes yet</p>
                            <p className="text-xs text-gray-600 mb-4">Create your first class to start teaching</p>
                            <button
                                onClick={() => onManageClass(null)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 active:scale-95 shadow-sm transition-all duration-200"
                            >
                                Create Class
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {trainer.classes.map((cls) => (
                                <div key={cls.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-2 mb-2">
                                                <img 
                                                    src={cls.imageUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48'} 
                                                    alt={cls.name} 
                                                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-bold text-gray-900 mb-1 truncate">{cls.name}</h4>
                                                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{cls.description}</p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-medium text-blue-600">{formatVND(cls.price)}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-xs text-gray-500">{cls.duration} min</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-xs text-gray-500">{cls.capacity} spots</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative flex-shrink-0" ref={menuRef}>
                                            <button
                                                onClick={() => handleMenuToggle(cls.id as number)}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-600" />
                                            </button>
                                            {menuOpenFor === cls.id && (
                                                <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
                                                    <button
                                                        onClick={() => {
                                                            onManageClass(cls);
                                                            setMenuOpenFor(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-xs text-gray-900 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cls.id as number)}
                                                        className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
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

                {/* Events Button */}
                <button
                    onClick={() => navigate('/events')}
                    className="w-full bg-white p-4 rounded-lg shadow-sm mb-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <CalendarDays className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-gray-900">Events</h3>
                            <p className="text-xs text-gray-500">Join community events</p>
                        </div>
                    </div>
                    <span className="text-xs text-gray-400">View →</span>
                </button>

                {/* Admin Panel Link */}
                {isAdmin && (
                    <button
                        onClick={() => navigate('/admin')}
                        className="w-full bg-purple-600 text-white p-4 rounded-lg shadow-sm text-xs font-medium hover:bg-purple-700 active:scale-95 transition-all duration-200"
                    >
                        Admin Dashboard
                    </button>
                )}

                {/* Logout */}
                <button 
                    onClick={onLogout}
                    className="w-full flex items-center justify-center bg-gray-200 text-gray-700 text-xs font-medium py-3 rounded-lg hover:bg-gray-300 active:scale-95 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
