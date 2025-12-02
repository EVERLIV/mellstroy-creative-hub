import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onSuccess: () => void;
}

const CANCELLATION_REASONS = [
  "Schedule conflict",
  "Feeling unwell",
  "Work emergency",
  "Personal reasons",
  "Weather conditions",
  "Transportation issues",
  "Other",
];

const CancelBookingModal: React.FC<CancelBookingModalProps> = ({ 
  isOpen, 
  onClose, 
  bookingId,
  onSuccess 
}) => {
  const { toast } = useToast();
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [canCancel, setCanCancel] = useState<any>(null);
  const [checkingPermission, setCheckingPermission] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkCancellationPermission();
    }
  }, [isOpen, bookingId]);

  const checkCancellationPermission = async () => {
    setCheckingPermission(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('can_cancel_booking', {
        _booking_id: bookingId,
        _user_id: user.id
      });

      if (error) throw error;
      setCanCancel(data);
    } catch (error) {
      console.error('Error checking cancellation permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to check cancellation permission',
        variant: 'destructive'
      });
    } finally {
      setCheckingPermission(false);
    }
  };

  const handleCancel = async () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    
    if (!reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a cancellation reason',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('cancel_booking', {
        _booking_id: bookingId,
        _user_id: user.id,
        _cancellation_reason: reason
      });

      if (error) throw error;

      const result = data as { success?: boolean; reason?: string };

      if (result?.success) {
        toast({
          title: 'Success',
          description: 'Booking cancelled successfully',
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: 'Error',
          description: result?.reason || 'Failed to cancel booking',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel booking',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(CANCELLATION_REASONS[0]);
    setCustomReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" 
      onClick={handleClose}
    >
      <div 
        className="bg-card rounded-2xl w-full max-w-md overflow-hidden transform animate-slide-up shadow-2xl border border-border" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 bg-card border-b border-border relative">
          <h2 className="text-base font-semibold text-foreground text-center">Cancel Booking</h2>
          <button 
            onClick={handleClose} 
            className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        <div className="p-4 bg-card">
          {checkingPermission ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !canCancel?.can_cancel ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive mb-1">Cannot Cancel</p>
                  <p className="text-xs text-destructive/80">{canCancel?.reason}</p>
                  {canCancel?.hours_until_booking !== undefined && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Time until class: {Math.floor(canCancel.hours_until_booking)} hours
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {canCancel?.hours_until_booking < 24 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    ⚠️ You have {Math.floor(canCancel.hours_until_booking)} hours until the class
                  </p>
                </div>
              )}

              <p className="text-sm font-semibold text-foreground mb-3">Please select a reason:</p>
              <div className="space-y-2 mb-4">
                {CANCELLATION_REASONS.map(reason => (
                  <label 
                    key={reason} 
                    className="flex items-center p-2.5 rounded-md border border-border has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors cursor-pointer"
                  >
                    <input 
                      type="radio" 
                      name="cancel-reason" 
                      value={reason} 
                      checked={selectedReason === reason} 
                      onChange={() => setSelectedReason(reason)} 
                      className="h-4 w-4 text-primary focus:ring-primary border-input" 
                    />
                    <span className="ml-3 text-sm font-medium text-foreground">{reason}</span>
                  </label>
                ))}
              </div>

              {selectedReason === "Other" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please specify the reason..."
                  className="w-full p-3 text-sm border border-border rounded-lg focus:ring-primary focus:border-primary bg-background text-foreground mb-4"
                  rows={3}
                />
              )}
            </>
          )}
        </div>

        <div className="p-4 bg-muted border-t border-border grid grid-cols-2 gap-2">
          <button 
            onClick={handleClose} 
            className="w-full bg-card border border-border text-foreground font-medium py-2 rounded-md transition-colors hover:bg-muted text-sm"
          >
            Close
          </button>
          {canCancel?.can_cancel && (
            <button 
              onClick={handleCancel}
              disabled={loading || (selectedReason === 'Other' && !customReason.trim())}
              className="w-full bg-destructive text-destructive-foreground font-medium py-2 rounded-md transition-colors hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
            >
              {loading ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelBookingModal;