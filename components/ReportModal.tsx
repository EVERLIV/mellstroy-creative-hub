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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={handleClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden transform animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-200 relative">
                    <h2 className="text-lg font-bold text-gray-800 text-center">{isSubmitted ? 'Report Submitted' : `Report ${trainerName}`}</h2>
                    <button onClick={handleClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                
                {isSubmitted ? (
                    <div className="p-6 text-center">
                        <p className="text-slate-600">Thank you for helping keep our community safe. Our team will review your report shortly.</p>
                        <button onClick={handleClose} className="mt-4 w-full bg-[#FF6B35] text-white font-bold py-2.5 rounded-xl transition-colors hover:bg-orange-600">
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="p-5 max-h-[60vh] overflow-y-auto">
                            <p className="text-md font-semibold text-gray-700 mb-3">Please select a reason:</p>
                            <div className="space-y-3">
                                {REPORT_REASONS.map(reason => (
                                    <label key={reason} className="flex items-center p-3 rounded-lg border border-gray-200 has-[:checked]:bg-orange-50 has-[:checked]:border-orange-400 transition-colors">
                                        <input type="radio" name="report-reason" value={reason} checked={selectedReason === reason} onChange={() => setSelectedReason(reason)} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300" />
                                        <span className="ml-3 text-sm font-medium text-gray-700">{reason}</span>
                                    </label>
                                ))}
                            </div>
                            {selectedReason === "Other" && (
                                <textarea
                                    value={otherDetails}
                                    onChange={(e) => setOtherDetails(e.target.value)}
                                    placeholder="Please provide more details..."
                                    className="mt-3 w-full p-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                                    rows={3}
                                />
                            )}
                        </div>
                        <div className="p-5 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-3">
                             <button onClick={handleClose} className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-xl transition-colors hover:bg-gray-100">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={selectedReason === 'Other' && !otherDetails.trim()} className="w-full bg-red-500 text-white font-bold py-2.5 rounded-xl transition-colors hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
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