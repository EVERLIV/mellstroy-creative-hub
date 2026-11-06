import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download } from 'lucide-react';
import { cn } from '../src/lib/utils';
import { Button } from '../src/components/ui/button';

interface BookingVerificationDisplayProps {
  verificationCode: string;
  className?: string;
  bookingId?: string;
}

/** QR colors stay dark-on-white in both themes: scanners need the contrast. */
const QR_COLORS = { dark: '#1F2937', light: '#FFFFFF' };
const QR_SIZE = 200;

const BookingVerificationDisplay: React.FC<BookingVerificationDisplayProps> = ({
  verificationCode,
  className = '',
  bookingId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && verificationCode) {
      QRCode.toCanvas(canvasRef.current, verificationCode, { width: QR_SIZE, margin: 2, color: QR_COLORS });
    }
  }, [verificationCode]);

  const downloadQR = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `booking-${bookingId || verificationCode}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 shadow-sm', className)}>
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Your Attendance Code</h3>
        </div>

        <p className="text-sm text-muted-foreground">Show this code to your trainer to verify attendance</p>

        <div className="inline-block rounded-xl p-4 ring-1 ring-border" style={{ backgroundColor: QR_COLORS.light }}>
          <canvas ref={canvasRef} className="mx-auto" />
        </div>

        <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Verification Code</p>
          <p className="font-mono text-3xl font-bold tracking-wider text-primary">{verificationCode}</p>
        </div>

        <Button variant="secondary" className="w-full" onClick={downloadQR}>
          <Download />
          Download QR Code
        </Button>

        <p className="text-xs text-muted-foreground">💡 Tip: Screenshot or download this QR code for easy access</p>
      </div>
    </div>
  );
};

export default BookingVerificationDisplay;
