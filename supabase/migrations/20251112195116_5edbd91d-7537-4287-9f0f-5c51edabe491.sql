-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium_monthly', 'premium_yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create payment_history table
CREATE TABLE public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  status TEXT NOT NULL CHECK (status IN ('paid', 'failed', 'pending', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  invoice_number TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_subscription_id ON public.payment_history(subscription_id);
CREATE INDEX idx_payment_history_payment_date ON public.payment_history(payment_date DESC);

-- Enable RLS on both tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for payment_history table
CREATE POLICY "Users can view their own payment history"
  ON public.payment_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert payment history"
  ON public.payment_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all payment history"
  ON public.payment_history
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at timestamp on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();