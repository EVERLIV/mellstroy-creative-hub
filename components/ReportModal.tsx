import React, { useState } from 'react';
import { X } from 'lucide-react';

const REPORT_REASONS = [
    "Scam or Fraud",
    "Inappropriate Content",
    "Spam or Misleading",
    "Harassment or Hate Speech",
    "Sharing personal contact info",
    "Other",
];

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
        }, 300);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={handleClose}>
            <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden transform animate-slide-up shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-card border-b border-border relative">
                    <h2 className="text-base font-semibold text-foreground text-center">{isSubmitted ? 'Report Submitted' : `Report ${trainerName}`}</h2>
                    <button onClick={handleClose} className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
                
                {isSubmitted ? (
                    <div className="p-5 bg-card text-center">
                        <p className="text-muted-foreground text-sm">Thank you for helping keep our community safe. Our team will review your report shortly.</p>
                        <button onClick={handleClose} className="mt-4 w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-md transition-colors hover:bg-primary/90 text-sm shadow-sm">
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-card max-h-[60vh] overflow-y-auto">
                            <p className="text-sm font-semibold text-foreground mb-3">Please select a reason:</p>
                            <div className="space-y-2">
                                {REPORT_REASONS.map(reason => (
                                    <label key={reason} className="flex items-center p-2.5 rounded-md border border-border has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors">
                                        <input type="radio" name="report-reason" value={reason} checked={selectedReason === reason} onChange={() => setSelectedReason(reason)} className="h-4 w-4 text-primary focus:ring-primary border-input" />
                                        <span className="ml-3 text-sm font-medium text-foreground">{reason}</span>
                                    </label>
                                ))}
                            </div>
                            {selectedReason === "Other" && (
                                <textarea
                                    value={otherDetails}
                                    onChange={(e) => setOtherDetails(e.target.value)}
                                    placeholder="Please provide more details..."
                                    className="mt-3 w-full p-2 text-sm border border-border rounded-md focus:ring-primary focus:border-primary bg-background text-foreground"
                                    rows={3}
                                />
                            )}
                        </div>
                        <div className="p-4 bg-muted border-t border-border grid grid-cols-2 gap-2">
                             <button onClick={handleClose} className="w-full bg-card border border-border text-foreground font-medium py-2 rounded-md transition-colors hover:bg-muted text-sm">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={selectedReason === 'Other' && !otherDetails.trim()} className="w-full bg-destructive text-destructive-foreground font-medium py-2 rounded-md transition-colors hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm">
                                Submit Report
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportModal;