import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { cn } from '../src/lib/utils';
import { Button } from '../src/components/ui/button';
import { Input } from '../src/components/ui/input';
import { Separator } from '../src/components/ui/separator';
import { FormField } from '../src/components/form/form-field';

interface VerifyAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  trainerId: string;
}

const VerifyAttendanceModal: React.FC<VerifyAttendanceModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  trainerId
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError('');

      // Check camera permission
      const status = await BarcodeScanner.checkPermission({ force: true });

      if (!status.granted) {
        setError('Camera permission denied. Please enable camera access in settings.');
        setIsScanning(false);
        return;
      }

      // Hide background to show camera
      document.body.classList.add('scanner-active');
      
      // Start scanning
      await BarcodeScanner.hideBackground();
      const result = await BarcodeScanner.startScan();

      // Stop scanning and show background again
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();

      if (result.hasContent) {
        const scannedCode = result.content;
        
        // Validate it's a 6-digit code
        if (/^\d{6}$/.test(scannedCode)) {
          setCode(scannedCode);
          // Automatically verify after successful scan
          handleVerifyWithCode(scannedCode);
        } else {
          setError('Invalid QR code. Please scan a valid verification code.');
        }
      }
    } catch (err) {
      setError('Failed to scan QR code. Please enter the code manually.');
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();
    } finally {
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    await BarcodeScanner.stopScan();
    await BarcodeScanner.showBackground();
    document.body.classList.remove('scanner-active');
    setIsScanning(false);
  };

  const handleVerifyWithCode = async (verificationCode: string) => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find booking with this verification code
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*, class:classes(trainer_id, name)')
        .eq('verification_code', verificationCode)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!booking) {
        setError('Invalid verification code');
        setLoading(false);
        return;
      }

      // Check if trainer owns this class
      if ((booking.class as any)?.trainer_id !== trainerId) {
        setError('This booking is not for your class');
        setLoading(false);
        return;
      }

      // Check if already verified
      if (booking.verified_at) {
        setError('This booking has already been verified');
        setLoading(false);
        return;
      }

      // Verify the booking
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'attended',
          verified_at: new Date().toISOString(),
          verified_by: trainerId
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      toast({
        title: 'Attendance Verified',
        description: 'Student attendance has been confirmed successfully.',
      });

      setCode('');
      onVerified();
      onClose();
    } catch (err) {
      setError('Failed to verify attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => handleVerifyWithCode(code);

  // Scanner styles. Must run before any early return (rules of hooks).
  React.useEffect(() => {
    if (isScanning) {
      const style = document.createElement('style');
      style.id = 'scanner-styles';
      style.innerHTML = `
        body.scanner-active {
          background: transparent !important;
        }
        body.scanner-active > *:not(.scanner-ui) {
          visibility: hidden !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      const style = document.getElementById('scanner-styles');
      if (style) style.remove();
    }
  }, [isScanning]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-attendance-title"
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4',
        isScanning && 'scanner-ui'
      )}
    >
      <div className="w-full max-w-md rounded-t-2xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300 sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="verify-attendance-title" className="text-lg font-bold text-foreground">
            Verify Attendance
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="space-y-4 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6">
          {!isScanning ? (
            <>
              <div className="space-y-2 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Scan QR code or enter the 6-digit verification code</p>
              </div>

              <Button size="lg" className="w-full" onClick={startScanning} disabled={loading}>
                <Camera />
                Scan QR Code
              </Button>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs font-medium text-muted-foreground">OR</span>
                <Separator className="flex-1" />
              </div>

              <FormField label="Verification Code" htmlFor="verification-code" error={error || undefined}>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  maxLength={6}
                  disabled={loading}
                  className="h-16 text-center font-mono text-3xl font-bold tracking-widest md:h-16 md:text-3xl"
                />
              </FormField>

              <Button size="lg" className="w-full" onClick={handleVerify} disabled={loading || code.length !== 6}>
                {loading ? 'Verifying...' : 'Verify Attendance'}
              </Button>
            </>
          ) : (
            <div className="space-y-4 py-8 text-center">
              <div className="mx-auto grid h-16 w-16 animate-pulse place-items-center rounded-full bg-primary/10">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Point camera at QR code</p>
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={stopScanning}>
                Cancel Scanning
              </Button>
              {error && (
                <p role="alert" className="flex items-center justify-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyAttendanceModal;
