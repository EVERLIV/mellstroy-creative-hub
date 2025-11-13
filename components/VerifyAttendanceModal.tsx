import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

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

  if (!isOpen) return null;

  // Add scanner styles
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

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 ${isScanning ? 'scanner-ui' : ''}`}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Verify Attendance</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!isScanning ? (
            <>
              <div className="text-center space-y-2 mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600">
                  Scan QR code or enter the 6-digit verification code
                </p>
              </div>

              {/* Scan QR Button */}
              <button
                onClick={startScanning}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Scan QR Code
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-xs text-gray-500 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-700 font-medium">Point camera at QR code</p>
              <button
                onClick={stopScanning}
                className="text-sm text-red-600 font-semibold hover:text-red-700"
              >
                Cancel Scanning
              </button>
            </div>
          )}

          {/* Code Input - Only show when not scanning */}
          {!isScanning && (
            <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              maxLength={6}
              className="w-full text-center text-3xl font-bold tracking-widest font-mono py-4 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              disabled={loading}
            />
          </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Verify Button - Only show when not scanning */}
          {!isScanning && (
            <button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="w-full bg-[#FF6B35] text-white py-3 px-4 rounded-xl font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {loading ? 'Verifying...' : 'Verify Attendance'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyAttendanceModal;
