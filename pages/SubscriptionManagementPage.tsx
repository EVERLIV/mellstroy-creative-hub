import React, { useState } from 'react';
import { ArrowLeft, Crown, CreditCard, Calendar, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionManagementPageProps {
    onBack?: () => void;
}

const SubscriptionManagementPage: React.FC<SubscriptionManagementPageProps> = ({ onBack }) => {
    const navigate = useNavigate();
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Mock data - will be replaced with real data from Stripe/Supabase
    const subscription = {
        status: 'active',
        plan: 'Premium Monthly',
        price: 299000, // VND
        nextBillingDate: '2025-12-12',
        startDate: '2024-11-12',
        autoRenew: true
    };

    const billingHistory = [
        { id: 1, date: '2024-11-12', amount: 299000, status: 'paid', invoice: '#INV-001' },
        { id: 2, date: '2024-10-12', amount: 299000, status: 'paid', invoice: '#INV-002' },
        { id: 3, date: '2024-09-12', amount: 299000, status: 'paid', invoice: '#INV-003' }
    ];

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const handleCancelSubscription = () => {
        setShowCancelModal(true);
    };

    const confirmCancelSubscription = () => {
        // TODO: Implement actual cancellation logic with Stripe
        console.log('Cancelling subscription...');
        setShowCancelModal(false);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleBack}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-500" />
                            <h1 className="text-lg font-bold text-gray-900">Subscription</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 py-4 pb-24">
                {/* Current Plan Card */}
                <div className="bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg p-4 mb-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Crown className="w-6 h-6 text-white" />
                            <h2 className="text-base font-bold text-white">{subscription.plan}</h2>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                            subscription.status === 'active' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-red-500 text-white'
                        }`}>
                            {subscription.status === 'active' ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-white">
                            <span className="text-sm opacity-90">Monthly Price</span>
                            <span className="text-lg font-bold">{formatVND(subscription.price)}</span>
                        </div>
                        <div className="flex items-center justify-between text-white">
                            <span className="text-sm opacity-90">Next Billing Date</span>
                            <span className="text-sm font-semibold">{formatDate(subscription.nextBillingDate)}</span>
                        </div>
                        <div className="flex items-center justify-between text-white">
                            <span className="text-sm opacity-90">Auto-Renew</span>
                            <span className="text-sm font-semibold">{subscription.autoRenew ? 'Enabled' : 'Disabled'}</span>
                        </div>
                    </div>
                </div>

                {/* Plan Features */}
                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Premium Features</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700">Upload up to 5 photos per class</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700">Priority listing in search results</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700">Verified trainer badge</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700">Advanced analytics and insights</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700">Access to AI fitness coach</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700">Exclusive meal planning tools</span>
                        </div>
                    </div>
                </div>

                {/* Billing History */}
                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Billing History</h3>
                    <div className="space-y-3">
                        {billingHistory.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg">
                                        <CreditCard className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900">{payment.invoice}</p>
                                        <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-900">{formatVND(payment.amount)}</p>
                                    <div className="flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                        <span className="text-xs text-green-600 font-medium">Paid</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Manage Subscription</h3>
                    <div className="space-y-2">
                        <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                            <Crown className="w-4 h-4" />
                            Upgrade to Yearly Plan
                        </button>
                        <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                            <CreditCard className="w-4 h-4" />
                            Update Payment Method
                        </button>
                        <button 
                            onClick={handleCancelSubscription}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                            Cancel Subscription
                        </button>
                    </div>
                </div>

                {/* Subscription Info */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800">
                            Your subscription will automatically renew on {formatDate(subscription.nextBillingDate)}. 
                            You can cancel anytime before the renewal date.
                        </p>
                    </div>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Cancel Subscription?</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to cancel your Premium subscription? You'll lose access to all premium features at the end of your billing period.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Keep Premium
                            </button>
                            <button
                                onClick={confirmCancelSubscription}
                                className="flex-1 py-2.5 px-4 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Cancel Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionManagementPage;
