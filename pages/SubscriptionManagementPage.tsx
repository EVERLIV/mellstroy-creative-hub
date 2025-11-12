import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, CreditCard, Calendar, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';

interface SubscriptionManagementPageProps {
    onBack?: () => void;
}

const SubscriptionManagementPage: React.FC<SubscriptionManagementPageProps> = ({ onBack }) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<any>(null);
    const [billingHistory, setBillingHistory] = useState<any[]>([]);

    useEffect(() => {
        loadSubscriptionData();
    }, []);

    const loadSubscriptionData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch subscription
            const { data: subData, error: subError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (subError) throw subError;
            setSubscription(subData);

            // Fetch payment history
            const { data: paymentData, error: paymentError } = await supabase
                .from('payment_history')
                .select('*')
                .eq('user_id', user.id)
                .order('payment_date', { ascending: false })
                .limit(10);

            if (paymentError) throw paymentError;
            setBillingHistory(paymentData || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load subscription data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

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

    const confirmCancelSubscription = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !subscription) return;

            const { error } = await supabase
                .from('subscriptions')
                .update({
                    cancel_at_period_end: true,
                    canceled_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (error) throw error;

            toast({
                title: "Subscription Canceled",
                description: "Your subscription will be canceled at the end of the billing period"
            });

            setShowCancelModal(false);
            loadSubscriptionData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to cancel subscription",
                variant: "destructive"
            });
        }
    };

    const getPlanDisplayName = (planType: string) => {
        const plans: Record<string, string> = {
            'premium_monthly': 'Premium Monthly',
            'premium_yearly': 'Premium Yearly',
            'basic': 'Basic Plan'
        };
        return plans[planType] || planType;
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading subscription...</p>
                </div>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="bg-gray-50 min-h-screen">
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
                <div className="px-4 py-8 text-center">
                    <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-gray-900 mb-2">No Active Subscription</h2>
                    <p className="text-sm text-gray-600 mb-6">Upgrade to Premium to unlock exclusive features</p>
                    <button
                        onClick={() => navigate('/profile')}
                        className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                    >
                        View Premium Plans
                    </button>
                </div>
            </div>
        );
    }

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
                            <h2 className="text-base font-bold text-white">{getPlanDisplayName(subscription.plan_type)}</h2>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                            subscription.status === 'active' 
                                ? 'bg-green-500 text-white' 
                                : subscription.status === 'canceled'
                                ? 'bg-gray-700 text-white'
                                : 'bg-red-500 text-white'
                        }`}>
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-white">
                            <span className="text-sm opacity-90">Price</span>
                            <span className="text-lg font-bold">{formatVND(subscription.price)}</span>
                        </div>
                        <div className="flex items-center justify-between text-white">
                            <span className="text-sm opacity-90">Next Billing Date</span>
                            <span className="text-sm font-semibold">{formatDate(subscription.current_period_end)}</span>
                        </div>
                        <div className="flex items-center justify-between text-white">
                            <span className="text-sm opacity-90">Auto-Renew</span>
                            <span className="text-sm font-semibold">{!subscription.cancel_at_period_end ? 'Enabled' : 'Disabled'}</span>
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
                    {billingHistory.length > 0 ? (
                        <div className="space-y-3">
                            {billingHistory.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg">
                                            <CreditCard className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-900">{payment.invoice_number || `Payment #${payment.id.slice(0, 8)}`}</p>
                                            <p className="text-xs text-gray-500">{formatDate(payment.payment_date)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-900">{formatVND(payment.amount)}</p>
                                        <div className="flex items-center gap-1">
                                            {payment.status === 'paid' ? (
                                                <>
                                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                                    <span className="text-xs text-green-600 font-medium">Paid</span>
                                                </>
                                            ) : payment.status === 'failed' ? (
                                                <>
                                                    <XCircle className="w-3 h-3 text-red-500" />
                                                    <span className="text-xs text-red-600 font-medium">Failed</span>
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-600 font-medium">{payment.status}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600 text-center py-4">No payment history yet</p>
                    )}
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
                <div className={`rounded-lg p-3 border ${
                    subscription.cancel_at_period_end 
                        ? 'bg-amber-50 border-amber-200' 
                        : 'bg-blue-50 border-blue-200'
                }`}>
                    <div className="flex items-start gap-2">
                        <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            subscription.cancel_at_period_end ? 'text-amber-600' : 'text-blue-600'
                        }`} />
                        <p className={`text-xs ${
                            subscription.cancel_at_period_end ? 'text-amber-800' : 'text-blue-800'
                        }`}>
                            {subscription.cancel_at_period_end 
                                ? `Your subscription will end on ${formatDate(subscription.current_period_end)}. You can reactivate it anytime before this date.`
                                : `Your subscription will automatically renew on ${formatDate(subscription.current_period_end)}. You can cancel anytime before the renewal date.`
                            }
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
