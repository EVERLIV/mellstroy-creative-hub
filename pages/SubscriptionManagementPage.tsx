import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, CreditCard, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { AppScreen, ScreenSection, ScreenSplit } from '../src/components/layout/screen';
import { StitchCanvas, StitchPageHeader, StitchPanel } from '../src/components/layout/stitch-page';
import { PageLoader, EmptyState } from '../src/components/layout/states';
import { Button } from '../src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../src/components/ui/card';
import { StatusBadge } from '../src/components/ui/status-badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../src/components/ui/dialog';
import { AddToCartButton } from '../src/components/kokonutui/cart-button';
import SlideToConfirm from '../src/components/kokonutui/slide-to-confirm';
import { useOptionalCartQuantities } from '../src/hooks/useCartQuantities';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import { formatVND } from '../src/lib/format';
import { cn } from '../src/lib/utils';

const PREMIUM_FEATURES = [
    'Upload up to 5 photos per class',
    'Priority listing in search results',
    'Verified trainer badge',
    'Advanced analytics and insights',
    'Access to AI fitness coach',
    'Exclusive meal planning tools',
] as const;

interface SubscriptionManagementPageProps {
    onBack?: () => void;
}

const SubscriptionManagementPage: React.FC<SubscriptionManagementPageProps> = ({ onBack }) => {
    const navigate = useNavigate();
    const cart = useOptionalCartQuantities();
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

    const backButton = (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="-ml-2 w-fit gap-1.5 text-muted-foreground hover:text-foreground"
        >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Go back
        </Button>
    );

    if (loading) {
        return (
            <AppScreen className="min-w-0 bg-[#f9fafb] dark:bg-background">
                <PageLoader title="Loading subscription…" />
            </AppScreen>
        );
    }

    if (!subscription) {
        return (
            <AppScreen className="min-w-0 bg-[#f9fafb] dark:bg-background">
                <StitchCanvas>
                    {backButton}
                    <StitchPageHeader title="Subscription" description="Your plan, billing history and renewal settings" />
                    <StitchPanel className="p-4 md:p-6">
                        <EmptyState
                            icon={Crown}
                            title="No Active Subscription"
                            description="Upgrade to Premium to unlock exclusive features"
                            action={
                                <Button
                                    onClick={() => navigate('/profile')}
                                    className=""
                                >
                                    <Crown />
                                    View Premium Plans
                                </Button>
                            }
                        />
                    </StitchPanel>
                </StitchCanvas>
            </AppScreen>
        );
    }

    const willCancel = Boolean(subscription.cancel_at_period_end);

    const main = (
        <>
            <StitchPanel className="border-primary/40">
                <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                            <Crown className="size-5" />
                        </div>
                        <div className="flex min-w-0 flex-col gap-0.5">
                            <CardTitle className="text-base md:text-lg">
                                {getPlanDisplayName(subscription.plan_type)}
                            </CardTitle>
                            <CardDescription>Current plan</CardDescription>
                        </div>
                    </div>
                    <StatusBadge status={subscription.status} />
                </CardHeader>
                <CardContent>
                    <dl className="grid gap-3 sm:grid-cols-3">
                        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
                            <dt className="text-xs text-muted-foreground">Price</dt>
                            <dd className="text-lg font-bold text-foreground">{formatVND(subscription.price)}</dd>
                        </div>
                        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
                            <dt className="text-xs text-muted-foreground">Next Billing Date</dt>
                            <dd className="text-sm font-semibold text-foreground">{formatDate(subscription.current_period_end)}</dd>
                        </div>
                        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
                            <dt className="text-xs text-muted-foreground">Auto-Renew</dt>
                            <dd className="text-sm font-semibold text-foreground">{!willCancel ? 'Enabled' : 'Disabled'}</dd>
                        </div>
                    </dl>
                </CardContent>
            </StitchPanel>

            <ScreenSection title="Premium Features" variant="panel">
                <ul className="grid gap-2 sm:grid-cols-2">
                    {PREMIUM_FEATURES.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                            <CheckCircle className="size-4 shrink-0 text-primary" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                    ))}
                </ul>
            </ScreenSection>

            <ScreenSection title="Billing History" variant="panel">
                {billingHistory.length > 0 ? (
                    <ul className="divide-y divide-border">
                        {billingHistory.map((payment) => (
                            <li key={payment.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="rounded-lg bg-muted p-2">
                                        <CreditCard className="size-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {payment.invoice_number || `Payment #${payment.id.slice(0, 8)}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{formatDate(payment.payment_date)}</p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <p className="text-sm font-bold text-foreground">{formatVND(payment.amount)}</p>
                                    <StatusBadge status={payment.status} />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">No payment history yet</p>
                )}
            </ScreenSection>
        </>
    );

    const aside = (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Manage Subscription</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Crown className="size-4 text-primary" />
                            Yearly Plan
                        </span>
                        <AddToCartButton
                            name="Yearly Premium"
                            label="Add"
                            max={1}
                            quantity={cart?.getQuantity('premium:yearly') ?? 0}
                            onQuantityChange={(qty) => cart?.setQuantity('premium:yearly', qty)}
                        />
                    </div>
                    <Button variant="secondary" className="w-full">
                        <CreditCard />
                        Update Payment Method
                    </Button>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="ghost"
                        onClick={handleCancelSubscription}
                        className="w-full bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive"
                    >
                        <XCircle />
                        Cancel Subscription
                    </Button>
                </CardFooter>
            </Card>

            <div
                role="note"
                className={cn(
                    'flex items-start gap-2 rounded-xl border p-4',
                    willCancel
                        ? 'border-destructive/30 bg-destructive/10 text-destructive'
                        : 'border-primary/30 bg-primary/10 text-primary'
                )}
            >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p className="text-xs">
                    {willCancel
                        ? `Your subscription will end on ${formatDate(subscription.current_period_end)}. You can reactivate it anytime before this date.`
                        : `Your subscription will automatically renew on ${formatDate(subscription.current_period_end)}. You can cancel anytime before the renewal date.`}
                </p>
            </div>
        </>
    );

    return (
        <AppScreen className="min-w-0 bg-[#f9fafb] dark:bg-background">
            <StitchCanvas>
                {backButton}
                <StitchPageHeader title="Subscription" description="Your plan, billing history and renewal settings" />
                <ScreenSplit main={main} aside={aside} />
            </StitchCanvas>

            <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <div className="mb-2 grid size-10 place-items-center rounded-full bg-destructive/15 text-destructive">
                            <XCircle className="size-6" />
                        </div>
                        <DialogTitle>Cancel Subscription?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel your Premium subscription? You'll lose access to all premium features at the end of your billing period.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                        <SlideToConfirm
                            label="Slide to cancel plan"
                            confirmingLabel="Canceling…"
                            doneLabel="Canceled"
                            resetAfter={1500}
                            onConfirm={confirmCancelSubscription}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" className="w-full" onClick={() => setShowCancelModal(false)}>
                            Keep Premium
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppScreen>
    );
};

export default SubscriptionManagementPage;
