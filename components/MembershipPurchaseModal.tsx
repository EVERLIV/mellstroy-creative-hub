import React, { useState, useEffect } from 'react';
import { Venue } from '../types';
import { X, Check, Copy, QrCode } from 'lucide-react';
import { useToast } from '../src/hooks/use-toast';
import { formatVND } from '@/src/lib/format';
import { Button } from '@/src/components/ui/button';

interface MembershipPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    venue: Venue;
    membershipPlan: {
        name: string;
        duration: string;
        price: number;
        features: string[];
    };
}


const generateUniqueCode = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RF-${timestamp}-${random}`;
};

const MembershipPurchaseModal: React.FC<MembershipPurchaseModalProps> = ({
    isOpen,
    onClose,
    venue,
    membershipPlan
}) => {
    const { toast } = useToast();
    const [uniqueCode, setUniqueCode] = useState<string>('');
    const [isCodeGenerated, setIsCodeGenerated] = useState(false);

    useEffect(() => {
        if (isOpen && !isCodeGenerated) {
            const code = generateUniqueCode();
            setUniqueCode(code);
            setIsCodeGenerated(true);
        }
    }, [isOpen, isCodeGenerated]);

    const handleClose = () => {
        setIsCodeGenerated(false);
        setUniqueCode('');
        onClose();
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(uniqueCode);
        toast({
            title: "Code copied!",
            description: "Unique code has been copied to clipboard",
        });
    };

    const discount = membershipPlan.price * 0.1;
    const finalPrice = membershipPlan.price - discount;

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 p-4 pb-20 md:pb-4"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="max-h-[90vh] w-full max-w-md transform animate-slide-up overflow-hidden overflow-y-auto rounded-xl border border-border bg-card shadow-2xl md:max-w-lg"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative flex-shrink-0 border-b border-border p-4">
                    <h2 className="text-center text-base font-semibold text-foreground md:text-lg">Membership Purchase</h2>
                    <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close" className="absolute right-2 top-2">
                        <X />
                    </Button>
                </div>

                {/* Content */}
                <div className="space-y-4 p-4 md:p-6">
                    {/* Venue Info */}
                    <div className="bg-muted/50 rounded-lg p-3">
                        <h3 className="text-sm font-bold text-foreground mb-1">{venue.name}</h3>
                        <p className="text-xs text-muted-foreground">{venue.address}, {venue.district}</p>
                    </div>

                    {/* Membership Plan Details */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-foreground">Plan Details</h3>
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Plan</span>
                                <span className="text-xs font-bold text-foreground">{membershipPlan.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Duration</span>
                                <span className="text-xs font-bold text-foreground">{membershipPlan.duration}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Original Price</span>
                                <span className="text-xs font-bold text-foreground">{formatVND(membershipPlan.price)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-border">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">RhinoFit Discount (10%)</span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">-{formatVND(discount)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-border">
                                <span className="text-sm font-bold text-foreground">Final Price</span>
                                <span className="text-lg font-bold text-primary">{formatVND(finalPrice)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    {membershipPlan.features.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-foreground">Included Features</h3>
                            <div className="space-y-1.5">
                                {membershipPlan.features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Unique Code */}
                    {isCodeGenerated && uniqueCode && (
                        <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <QrCode className="w-5 h-5 text-primary" />
                                    <h3 className="text-sm font-bold text-foreground">Your Unique Code</h3>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleCopyCode} aria-label="Copy code" className="text-primary hover:bg-primary/10">
                                    <Copy />
                                </Button>
                            </div>
                            <div className="bg-card rounded-lg p-3 border border-primary/30">
                                <p className="break-all text-center text-lg font-bold tracking-wider text-primary">
                                    {uniqueCode}
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Show this code at the venue to verify your purchase and receive your 10% discount
                            </p>
                        </div>
                    )}

                    {/* Important Note */}
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                            <strong>Note:</strong> This code is valid for verification at {venue.name}. Please present it when you visit the venue to activate your membership and receive your discount.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-border bg-muted/50 p-4">
                    <Button onClick={handleClose} className="w-full active:scale-95">
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MembershipPurchaseModal;

