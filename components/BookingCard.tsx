import React from 'react';
import { Calendar, MapPin, Clock, MessageCircle, X, QrCode, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../src/components/ui/card';
import { Button } from '../src/components/ui/button';
import { StatusBadge } from '../src/components/ui/status-badge';

interface BookingCardProps {
  booking: any;
  onCancel: (bookingId: string) => void;
  onShowQR?: (booking: any) => void;
  onChat?: (booking: any) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onCancel, onShowQR, onChat }) => {
  const trainer = booking.trainer || {};
  const cls = booking.cls || {};
  const bookingData = booking.booking || {};
  const isBooked = bookingData.status === 'booked';

  return (
    <Card className="overflow-hidden rounded-2xl border-border/80 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-4 pb-2">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{cls.name || 'Class'}</CardTitle>
          <CardDescription className="mt-0.5">with {trainer.name || 'Trainer'}</CardDescription>
        </div>
        {bookingData.status === 'attended' && (
          <StatusBadge status="attended" className="shrink-0 gap-1">
            <CheckCircle className="size-3.5" />
            Verified
          </StatusBadge>
        )}
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-3 text-sm text-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5 text-muted-foreground" />
          {bookingData.date}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 text-muted-foreground" />
          {bookingData.time}
        </span>
        {trainer.location && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{trainer.location}</span>
          </span>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 border-t border-border/70 p-4">
        <Button size="sm" className="flex-1" onClick={() => onChat?.(booking)}>
          <MessageCircle />
          Chat
        </Button>

        {isBooked && (
          <>
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => onCancel(bookingData.id)}>
              <X />
              Cancel
            </Button>
            {bookingData.verificationCode && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onShowQR?.(booking)}
                aria-label="Show attendance QR code"
              >
                <QrCode />
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default BookingCard;
