import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download } from 'lucide-react';

interface BookingVerificationDisplayProps {
  verificationCode: string;
  className?: string;
  bookingId?: string;
}

const BookingVerificationDisplay: React.FC<BookingVerificationDisplayProps> = ({ 
  verificationCode, 
  className = '',
  bookingId 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && verificationCode) {
      QRCode.toCanvas(
        canvasRef.current,
        verificationCode,
        {
          width: 200,
          margin: 2,
          color: {
            dark: '#1F2937',
            light: '#FFFFFF'
          }
        }
      );
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
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${className}`}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">Your Attendance Code</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Show this code to your trainer to verify attendance
        </p>

        {/* QR Code */}
        <div className="bg-gray-50 rounded-xl p-4 inline-block">
          <canvas ref={canvasRef} className="mx-auto" />
        </div>

        {/* Verification Code Display */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border-2 border-orange-200">
          <p className="text-xs text-gray-600 mb-2 font-medium">Verification Code</p>
          <p className="text-3xl font-bold text-orange-600 tracking-wider font-mono">
            {verificationCode}
          </p>
        </div>

        <button
          onClick={downloadQR}
          className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download QR Code
        </button>

        <p className="text-xs text-gray-500 mt-4">
          💡 Tip: Screenshot or download this QR code for easy access
        </p>
      </div>
    </div>
  );
};

export default BookingVerificationDisplay;
