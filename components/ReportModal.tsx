import React, { useState } from 'react';
import { cn } from '../src/lib/utils';
import { Button } from '../src/components/ui/button';
import { Textarea } from '../src/components/ui/textarea';
import { FormField } from '../src/components/form/form-field';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../src/components/ui/dialog';

const REPORT_REASONS = [
    "Scam or Fraud",
    "Inappropriate Content",
    "Spam or Misleading",
    "Harassment or Hate Speech",
    "Sharing personal contact info",
    "Other",
];

const RESET_DELAY_MS = 300;

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, details: string) => void;
    trainerName: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit, trainerName }) => {
    const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
    const [otherDetails, setOtherDetails] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = () => {
        onSubmit(selectedReason, otherDetails);
        setIsSubmitted(true);
    };

    const handleClose = () => {
        onClose();
        // Reset state after a delay to allow for exit animation
        setTimeout(() => {
            setIsSubmitted(false);
            setSelectedReason(REPORT_REASONS[0]);
            setOtherDetails('');
        }, RESET_DELAY_MS);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{isSubmitted ? 'Report Submitted' : `Report ${trainerName}`}</DialogTitle>
                    {isSubmitted ? (
                        <DialogDescription>
                            Thank you for helping keep our community safe. Our team will review your report shortly.
                        </DialogDescription>
                    ) : (
                        <DialogDescription>Please select a reason:</DialogDescription>
                    )}
                </DialogHeader>

                {isSubmitted ? (
                    <Button onClick={handleClose} className="w-full">
                        Close
                    </Button>
                ) : (
                    <>
                        <div className="max-h-[60vh] space-y-2 overflow-y-auto" role="radiogroup" aria-label="Report reason">
                            {REPORT_REASONS.map(reason => (
                                <label
                                    key={reason}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50',
                                        'has-[:checked]:border-primary has-[:checked]:bg-primary/10',
                                        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring'
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="report-reason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={() => setSelectedReason(reason)}
                                        className="h-4 w-4 accent-primary"
                                    />
                                    <span className="text-sm font-medium text-foreground">{reason}</span>
                                </label>
                            ))}
                            {selectedReason === "Other" && (
                                <FormField label="Details" htmlFor="report-details" required className="pt-2">
                                    <Textarea
                                        value={otherDetails}
                                        onChange={(e) => setOtherDetails(e.target.value)}
                                        placeholder="Please provide more details..."
                                        rows={3}
                                    />
                                </FormField>
                            )}
                        </div>
                        <DialogFooter className="grid grid-cols-2 gap-2 sm:space-x-0">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleSubmit}
                                disabled={selectedReason === 'Other' && !otherDetails.trim()}
                            >
                                Submit Report
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ReportModal;
