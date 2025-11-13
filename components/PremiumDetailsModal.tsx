import React from 'react';
import { X, Crown, Sparkles, UtensilsCrossed, MessageSquare, Percent, Shield, Camera, Star, Users, Check } from 'lucide-react';

interface PremiumDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PremiumDetailsModal: React.FC<PremiumDetailsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const benefits = [
        {
            icon: Crown,
            title: 'Access to Premium Features',
            description: 'Unlock all premium features and exclusive content',
            color: 'text-amber-500',
            bgColor: 'bg-amber-50'
        },
        {
            icon: Star,
            title: 'Card Visible Better',
            description: 'Your profile card appears at the top of search results',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50'
        },
        {
            icon: Camera,
            title: 'More Photos',
            description: 'Upload unlimited photos to showcase your profile',
            color: 'text-purple-500',
            bgColor: 'bg-purple-50'
        },
        {
            icon: Shield,
            title: 'Priority Support',
            description: 'Get faster response times and dedicated support',
            color: 'text-green-500',
            bgColor: 'bg-green-50'
        },
        {
            icon: Check,
            title: 'Verified Documents',
            description: 'Get your certificates and awards verified faster',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-50'
        },
        {
            icon: UtensilsCrossed,
            title: 'AI Meal Planner',
            description: 'Get personalized meal plans tailored to your fitness goals',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50'
        },
        {
            icon: MessageSquare,
            title: 'AI Fitness Chat',
            description: '24/7 personal AI coach for workout advice and motivation',
            color: 'text-pink-500',
            bgColor: 'bg-pink-50'
        },
        {
            icon: Percent,
            title: 'Discounts for Venues',
            description: 'Get 10% off on all sports venue memberships',
            color: 'text-orange-500',
            bgColor: 'bg-orange-50'
        },
        {
            icon: Users,
            title: 'Unlimited Bookings',
            description: 'Book unlimited trainers instead of 3 bookings at a time',
            color: 'text-red-500',
            bgColor: 'bg-red-50'
        }
    ];

    return (
        <div 
            className="fixed inset-0 bg-gray-600 flex items-center justify-center z-50 p-4 pb-20 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-gray-100 rounded-lg w-full max-w-md overflow-hidden transform animate-slide-up shadow-2xl border border-gray-300 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 relative flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Crown className="w-6 h-6 text-white" />
                            <h2 className="text-lg font-bold text-white">RhinoFit Premium</h2>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <p className="text-white/90 text-sm">Unlock exclusive features and benefits</p>
                </div>

                {/* Content */}
                <div className="p-4 bg-white space-y-4">
                    {/* Premium Badge */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4 text-center">
                        <Crown className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Upgrade to Premium</h3>
                        <p className="text-sm text-gray-600">Get access to all premium features</p>
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-3">
                        <h3 className="text-base font-bold text-gray-900 mb-3">Premium Benefits</h3>
                        {benefits.map((benefit, index) => {
                            const IconComponent = benefit.icon;
                            return (
                                <div 
                                    key={index}
                                    className={`${benefit.bgColor} rounded-lg p-3 border border-gray-200`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`${benefit.color} flex-shrink-0 mt-0.5`}>
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-gray-900 mb-1">
                                                {benefit.title}
                                            </h4>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {benefit.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Special Note */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-[#FF6B35] flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-orange-900 mb-1">Special Offer</p>
                                <p className="text-xs text-orange-800">
                                    Premium members get priority verification, unlimited bookings, and exclusive discounts on sports venues!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0 space-y-2">
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 text-sm"
                    >
                        Upgrade to Premium
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-lg transition-all duration-200 hover:bg-gray-200 active:scale-95 text-xs"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumDetailsModal;

