import React, { useState } from 'react';
import { X, Crown, Sparkles, UtensilsCrossed, MessageSquare, Percent, Shield, Camera, Star, Users, Check } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { AddToCartButton } from '@/src/components/kokonutui/cart-button';
import { useOptionalCartQuantities } from '@/src/hooks/useCartQuantities';
import { useNavigate } from 'react-router-dom';

interface PremiumDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PremiumDetailsModal: React.FC<PremiumDetailsModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const cart = useOptionalCartQuantities();
    const [localQty, setLocalQty] = useState(0);
    const cartId = 'premium:rhinofit';
    const quantity = cart?.getQuantity(cartId) ?? localQty;

    if (!isOpen) return null;

    const benefits = [
        {
            icon: Crown,
            title: 'Access to Premium Features',
            description: 'Unlock all premium features and exclusive content',
        },
        {
            icon: Star,
            title: 'Card Visible Better',
            description: 'Your profile card appears at the top of search results',
        },
        {
            icon: Camera,
            title: 'More Photos',
            description: 'Upload unlimited photos to showcase your profile',
        },
        {
            icon: Shield,
            title: 'Priority Support',
            description: 'Get faster response times and dedicated support',
        },
        {
            icon: Check,
            title: 'Verified Documents',
            description: 'Get your certificates and awards verified faster',
        },
        {
            icon: UtensilsCrossed,
            title: 'AI Meal Planner',
            description: 'Get personalized meal plans tailored to your fitness goals',
        },
        {
            icon: MessageSquare,
            title: 'AI Fitness Chat',
            description: '24/7 personal AI coach for workout advice and motivation',
        },
        {
            icon: Percent,
            title: 'Discounts for Venues',
            description: 'Get 10% off on all sports venue memberships',
        },
        {
            icon: Users,
            title: 'Unlimited Bookings',
            description: 'Book unlimited trainers instead of 3 bookings at a time',
        }
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 p-4 pb-20 md:pb-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                aria-labelledby="premium-modal-title"
                className="max-h-[90vh] w-full max-w-md transform animate-slide-up overflow-hidden overflow-y-auto rounded-xl border border-border bg-card shadow-2xl md:max-w-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative flex-shrink-0 bg-gradient-to-r from-amber-500 to-primary p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Crown className="w-6 h-6 text-white" />
                            <h2 id="premium-modal-title" className="text-lg font-bold text-white md:text-xl">RhinoFit Premium</h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="text-white hover:bg-white/20 hover:text-white">
                            <X />
                        </Button>
                    </div>
                    <p className="text-white/90 text-sm">Unlock exclusive features and benefits</p>
                </div>

                {/* Content */}
                <div className="space-y-4 p-4 md:p-6">
                    {/* Premium Badge */}
                    <div className="rounded-xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-primary/10 p-4 text-center">
                        <Crown className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                        <h3 className="text-lg font-bold text-foreground mb-1">Upgrade to Premium</h3>
                        <p className="text-sm text-muted-foreground">Get access to all premium features</p>
                    </div>

                    {/* Benefits List */}
                    <h3 className="text-base font-bold text-foreground">Premium Benefits</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {benefits.map((benefit, index) => {
                            const IconComponent = benefit.icon;
                            return (
                                <div
                                    key={index}
                                    className="rounded-lg border border-border bg-card p-3 shadow-sm"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                                            <IconComponent className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-foreground mb-1">
                                                {benefit.title}
                                            </h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {benefit.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Special Note */}
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-primary mb-1">Special Offer</p>
                                <p className="text-xs text-primary">
                                    Premium members get priority verification, unlimited bookings, and exclusive discounts on sports venues!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-shrink-0 flex-col gap-3 border-t border-border bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground sm:w-auto">
                        Maybe Later
                    </Button>
                    <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                        <span className="text-sm font-medium text-foreground">Upgrade to Premium</span>
                        <AddToCartButton
                            name="RhinoFit Premium"
                            label="Add"
                            max={1}
                            quantity={quantity}
                            onQuantityChange={(qty) => {
                                if (cart) cart.setQuantity(cartId, qty);
                                else setLocalQty(qty);
                                if (qty > 0) {
                                    onClose();
                                    navigate('/subscription');
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumDetailsModal;

