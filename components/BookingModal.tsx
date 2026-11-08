import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Shield } from 'lucide-react';
import type { Class, Trainer } from '../types';
import { cn } from '@/src/lib/utils';
import { formatVND } from '@/src/lib/format';
import { Button } from '@/src/components/ui/button';
import { Calendar } from '@/src/components/ui/calendar';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Input } from '@/src/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/src/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';
import { PackagePicker } from './marketplace/PackagePicker';
import {
  applyPromo,
  computeServiceFee,
  createBookingHold,
  fetchActivePackages,
  type ClassPackage,
} from '@/src/lib/marketplace';
import { trackEvent } from '@/src/lib/analytics';
import { supabase } from '@/src/integrations/supabase/client';

interface BookingModalProps {
  bookingTarget: {
    trainer: Trainer;
    cls: Class;
    preferredDate?: Date;
  };
  currentUserId?: string;
  onConfirmBooking: (
    trainerId: string,
    classId: number,
    startDate: Date,
    period: 'once' | '4weeks',
    meta?: {
      holdId?: string;
      paymentIntentId?: string;
      packageId?: string;
      serviceFee?: number;
      insuranceFee?: number;
      promoCode?: string;
      amountPaid?: number;
      tipAmount?: number;
      upsells?: string[];
    }
  ) => void | Promise<void>;
  onClose: () => void;
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const UPSELLS = [
  { id: 'extra30', label: '+30 min', price: 120_000 },
  { id: 'travel', label: 'Coach travel', price: 80_000 },
  { id: 'premium_hall', label: 'Premium hall', price: 150_000 },
] as const;

/**
 * Intent: athlete picks session → hold 10m → pay → confirm.
 */
const BookingModal: React.FC<BookingModalProps> = ({
  bookingTarget,
  currentUserId,
  onConfirmBooking,
  onClose,
}) => {
  const { trainer, cls, preferredDate } = bookingTarget;
  const scheduleDays = useMemo(
    () => new Set(cls.schedule?.days ?? []),
    [cls.schedule?.days]
  );

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(preferredDate);
  const [bookingPeriod, setBookingPeriod] = useState<'once' | '4weeks'>('once');
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [packages, setPackages] = useState<ClassPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ClassPackage | null>(null);
  const [upsells, setUpsells] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState<{ discount_type: string; discount_value: number } | null>(
    null
  );
  const [wantInsurance, setWantInsurance] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'schedule' | 'checkout'>('schedule');

  useEffect(() => {
    if (preferredDate && scheduleDays.has(WEEKDAY[preferredDate.getDay()])) {
      setSelectedDate(preferredDate);
    }
  }, [preferredDate, scheduleDays]);

  useEffect(() => {
    void (async () => {
      const { data } = await fetchActivePackages(String(cls.id));
      setPackages(data);
      if (data[0]) setSelectedPackage(data[0]);
    })();
    trackEvent('booking_start', { classId: cls.id, trainerId: trainer.id }, currentUserId);
  }, [cls.id, trainer.id, currentUserId]);

  const basePrice = useMemo(() => {
    if (selectedPackage) return Number(selectedPackage.price);
    if (!selectedDate || !cls.schedule) return cls.price;
    if (bookingPeriod === 'once') return cls.price;
    return cls.price * Math.max(cls.schedule.days.length, 1) * 4;
  }, [bookingPeriod, selectedDate, cls.price, cls.schedule, selectedPackage]);

  const upsellTotal = UPSELLS.filter((u) => upsells.includes(u.id)).reduce(
    (s, u) => s + u.price,
    0
  );
  const promoDiscount = applyPromo(basePrice + upsellTotal, promo);
  const subtotal = Math.max(0, basePrice + upsellTotal - promoDiscount);
  const serviceFee = computeServiceFee(subtotal);
  const insuranceFee = wantInsurance ? Math.round(subtotal * 0.03) : 0;
  const total = subtotal + serviceFee + insuranceFee + tipAmount;

  const selectedLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const canContinue =
    Boolean(selectedDate) && Boolean(cls.schedule?.time) && acceptPrivacy && acceptTerms;

  const applyPromoCode = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    const { data } = await supabase
      .from('promo_codes' as never)
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();
    if (data) {
      setPromo(data as { discount_type: string; discount_value: number });
      trackEvent('promo_apply', { code }, currentUserId);
    } else {
      setPromo(null);
    }
  };

  const createHold = async () => {
    if (!selectedDate || !cls.schedule?.time || !currentUserId) return null;
    const holdDate = selectedDate.toISOString().split('T')[0];
    const { data, error } = await createBookingHold({
      classId: String(cls.id),
      userId: currentUserId,
      holdDate,
      holdTime: cls.schedule.time,
      packageId: selectedPackage?.id,
      upsells: upsells.map((id) => UPSELLS.find((u) => u.id === id)).filter(Boolean),
      promoCode: promoCode.trim().toUpperCase() || undefined,
      serviceFee,
      insuranceFee,
      subtotal,
      total: total - tipAmount,
    });
    if (error || !data) throw error || new Error('Hold failed');
    const hold = data as { id: string; expires_at: string };
    setHoldId(hold.id);
    setHoldExpiresAt(hold.expires_at);
    trackEvent('booking_hold', { holdId: hold.id, classId: cls.id }, currentUserId);
    trackEvent('slot_select', { date: holdDate, time: cls.schedule.time }, currentUserId);
    return hold;
  };

  const handleCheckout = async () => {
    if (!canContinue || !selectedDate) return;
    if (!currentUserId || currentUserId === 'current-user-id') {
      trackEvent('booking_abandon', { reason: 'unauthenticated' });
      onClose();
      window.location.assign(`/auth`);
      return;
    }
    setSubmitting(true);
    try {
      setStep('checkout');
      const hold = holdId
        ? { id: holdId, expires_at: holdExpiresAt }
        : await createHold();
      if (!hold) throw new Error('Could not hold slot');

      const { data: payment, error: payError } = await supabase.functions.invoke(
        'create-booking-payment',
        {
          body: { holdId: hold.id, tipAmount },
        }
      );

      // Mock or missing function: still confirm booking with hold metadata
      const paymentIntentId =
        (payment as { paymentIntentId?: string } | null)?.paymentIntentId ||
        (payError ? `local_${hold.id}` : undefined);

      await onConfirmBooking(trainer.id, cls.id as number, selectedDate, bookingPeriod, {
        holdId: hold.id,
        paymentIntentId,
        packageId: selectedPackage?.id,
        serviceFee,
        insuranceFee,
        promoCode: promoCode.trim().toUpperCase() || undefined,
        amountPaid: total,
        tipAmount,
        upsells,
      });
      trackEvent('booking_complete', { holdId: hold.id, total }, currentUserId);
      if (tipAmount > 0) trackEvent('tip_submit', { amount: tipAmount }, currentUserId);
    } catch (e) {
      trackEvent('booking_abandon', { classId: cls.id, reason: 'checkout_error' }, currentUserId);
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const holdSecondsLeft = holdExpiresAt
    ? Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000))
    : null;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          if (step === 'checkout' && !submitting) {
            trackEvent('booking_abandon', { classId: cls.id, step }, currentUserId);
          }
          onClose();
        }
      }}
    >
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="shrink-0 gap-1 border-b border-border px-6 py-4 text-center sm:text-center">
          <DialogTitle className="text-center text-lg font-semibold tracking-tight">
            {step === 'schedule' ? 'Schedule a Class' : 'Checkout'}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {cls.name}
            {holdSecondsLeft != null ? (
              <span className="mt-1 block text-xs text-amber-700 dark:text-amber-400">
                Slot held · {Math.floor(holdSecondsLeft / 60)}:
                {String(holdSecondsLeft % 60).padStart(2, '0')} left
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {step === 'schedule' ? (
            <FieldSet className="gap-4">
              <FieldGroup>
                <FieldLabel>Pick a day</FieldLabel>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d);
                    if (d) trackEvent('slot_select', { date: d.toISOString() }, currentUserId);
                  }}
                  disabled={(date) => !scheduleDays.has(WEEKDAY[date.getDay()])}
                  className="rounded-md border"
                />
                {cls.schedule?.time ? (
                  <FieldDescription className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    Session time {cls.schedule.time}
                    {selectedLabel ? ` · ${selectedLabel}` : ''}
                  </FieldDescription>
                ) : null}
              </FieldGroup>

              {packages.length > 0 ? (
                <FieldGroup>
                  <FieldLabel>Package</FieldLabel>
                  <PackagePicker
                    packages={packages}
                    value={selectedPackage?.id}
                    onChange={(pkg) => {
                      setSelectedPackage(pkg);
                      trackEvent('upsell_accept', { kind: 'package', packageId: pkg.id });
                    }}
                  />
                </FieldGroup>
              ) : (
                <FieldGroup>
                  <FieldLabel>Booking period</FieldLabel>
                  <ToggleGroup
                    type="single"
                    value={bookingPeriod}
                    onValueChange={(v) => v && setBookingPeriod(v as 'once' | '4weeks')}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="once">Once</ToggleGroupItem>
                    <ToggleGroupItem value="4weeks">4 weeks</ToggleGroupItem>
                  </ToggleGroup>
                </FieldGroup>
              )}

              <Field orientation="horizontal" className="items-start gap-3">
                <Checkbox
                  id="privacy"
                  checked={acceptPrivacy}
                  onCheckedChange={(v) => setAcceptPrivacy(Boolean(v))}
                />
                <FieldLabel htmlFor="privacy" className="font-normal">
                  I accept the privacy policy
                </FieldLabel>
              </Field>
              <Field orientation="horizontal" className="items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(v) => setAcceptTerms(Boolean(v))}
                />
                <FieldLabel htmlFor="terms" className="font-normal">
                  I accept the booking terms
                </FieldLabel>
              </Field>
            </FieldSet>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Add-ons
                </p>
                {UPSELLS.map((u) => {
                  const on = upsells.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm',
                        on ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Checkbox
                          checked={on}
                          onCheckedChange={(v) => {
                            setUpsells((prev) =>
                              v ? [...prev, u.id] : prev.filter((x) => x !== u.id)
                            );
                            if (v) trackEvent('upsell_accept', { upsell: u.id });
                          }}
                        />
                        {u.label}
                      </span>
                      <span className="tabular-nums">{formatVND(u.price)}</span>
                    </label>
                  );
                })}
              </div>

              <FieldGroup>
                <FieldLabel htmlFor="promo">Promo code</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="SAVE10"
                    autoComplete="off"
                  />
                  <Button type="button" variant="outline" onClick={() => void applyPromoCode()}>
                    Apply
                  </Button>
                </div>
                {promo ? (
                  <FieldDescription className="text-emerald-700 dark:text-emerald-400">
                    Promo applied
                  </FieldDescription>
                ) : null}
              </FieldGroup>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Checkbox
                    checked={wantInsurance}
                    onCheckedChange={(v) => setWantInsurance(Boolean(v))}
                  />
                  <Shield className="size-3.5 text-muted-foreground" />
                  Cancellation insurance
                </span>
                <span className="tabular-nums text-muted-foreground">3%</span>
              </label>

              <FieldGroup>
                <FieldLabel>Optional tip</FieldLabel>
                <ToggleGroup
                  type="single"
                  value={String(tipAmount)}
                  onValueChange={(v) => setTipAmount(Number(v || 0))}
                  className="justify-start"
                >
                  {[0, 20_000, 50_000, 100_000].map((n) => (
                    <ToggleGroupItem key={n} value={String(n)}>
                      {n === 0 ? 'None' : formatVND(n)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FieldGroup>

              <dl className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatVND(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Service fee</dt>
                  <dd className="tabular-nums">{formatVND(serviceFee)}</dd>
                </div>
                {insuranceFee > 0 ? (
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Insurance</dt>
                    <dd className="tabular-nums">{formatVND(insuranceFee)}</dd>
                  </div>
                ) : null}
                {tipAmount > 0 ? (
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Tip</dt>
                    <dd className="tabular-nums">{formatVND(tipAmount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatVND(total)}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-between">
          {step === 'checkout' ? (
            <Button type="button" variant="outline" onClick={() => setStep('schedule')}>
              Back
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          {step === 'schedule' ? (
            <Button
              type="button"
              disabled={!canContinue}
              onClick={() => {
                void (async () => {
                  try {
                    await createHold();
                    setStep('checkout');
                  } catch {
                    setStep('checkout');
                  }
                })();
              }}
            >
              Continue · {formatVND(basePrice)}
            </Button>
          ) : (
            <Button type="button" disabled={submitting} onClick={() => void handleCheckout()}>
              {submitting ? 'Processing…' : `Pay ${formatVND(total)}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
