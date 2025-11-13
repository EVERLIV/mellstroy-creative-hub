import React, { useState, useEffect } from 'react';
import { Venue } from '../types';
import { X, Check, Copy, QrCode } from 'lucide-react';
import { useToast } from '../src/hooks/use-toast';

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

const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(amount).replace(/\s/g, '');
};

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
            className="fixed inset-0 bg-gray-600 flex items-center justify-center z-50 p-4 pb-20 animate-fade-in"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-gray-100 rounded-lg w-full max-w-sm overflow-hidden transform animate-slide-up shadow-2xl border border-gray-300 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 bg-white border-b border-gray-200 relative flex-shrink-0">
                    <h2 className="text-base font-semibold text-gray-900 text-center">Membership Purchase</h2>
                    <button 
                        onClick={handleClose} 
                        className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 bg-white space-y-4">
                    {/* Venue Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">{venue.name}</h3>
                        <p className="text-xs text-gray-600">{venue.address}, {venue.district}</p>
                    </div>

                    {/* Membership Plan Details */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-900">Plan Details</h3>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Plan</span>
                                <span className="text-xs font-bold text-gray-900">{membershipPlan.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Duration</span>
                                <span className="text-xs font-bold text-gray-900">{membershipPlan.duration}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Original Price</span>
                                <span className="text-xs font-bold text-gray-900">{formatVND(membershipPlan.price)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <span className="text-xs font-bold text-green-600">RhinoFit Discount (10%)</span>
                                <span className="text-xs font-bold text-green-600">-{formatVND(discount)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <span className="text-sm font-bold text-gray-900">Final Price</span>
                                <span className="text-lg font-bold text-[#FF6B35]">{formatVND(finalPrice)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    {membershipPlan.features.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-gray-900">Included Features</h3>
                            <div className="space-y-1.5">
                                {membershipPlan.features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs text-gray-700">
                                        <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Unique Code */}
                    {isCodeGenerated && uniqueCode && (
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <QrCode className="w-5 h-5 text-[#FF6B35]" />
                                    <h3 className="text-sm font-bold text-gray-900">Your Unique Code</h3>
                                </div>
                                <button
                                    onClick={handleCopyCode}
                                    className="p-1.5 rounded-md hover:bg-orange-100 transition-colors"
                                    aria-label="Copy code"
                                >
                                    <Copy className="w-4 h-4 text-[#FF6B35]" />
                                </button>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-orange-200">
                                <p className="text-lg font-bold text-center text-orange-700 tracking-wider">
                                    {uniqueCode}
                                </p>
                            </div>
                            <p className="text-xs text-gray-600 text-center">
                                Show this code at the venue to verify your purchase and receive your 10% discount
                            </p>
                        </div>
                    )}

                    {/* Important Note */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800">
                            <strong>Note:</strong> This code is valid for verification at {venue.name}. Please present it when you visit the venue to activate your membership and receive your discount.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                    <button
                        onClick={handleClose}
                        className="w-full bg-[#FF6B35] text-white font-medium py-2.5 rounded-md transition-all duration-200 shadow-sm hover:bg-orange-600 active:scale-95 text-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MembershipPurchaseModal;

