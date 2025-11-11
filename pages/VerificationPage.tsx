import React, { useState, useRef } from 'react';
import { ArrowLeft, CheckCircle, FileText, UploadCloud, Loader, AlertTriangle } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';

interface VerificationPageProps {
    onBack: () => void;
    onComplete: () => void;
}

const VerificationPage: React.FC<VerificationPageProps> = ({ onBack, onComplete }) => {
    const { user } = useAuth();
    const [idFile, setIdFile] = useState<File | null>(null);
    const [certFile, setCertFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const idInputRef = useRef<HTMLInputElement>(null);
    const certInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'id' | 'cert') => {
        if (e.target.files && e.target.files[0]) {
            if (fileType === 'id') setIdFile(e.target.files[0]);
            else setCertFile(e.target.files[0]);
        }
    };
    
    const handleSubmit = async () => {
        if (!idFile || !user) return;
        setIsSubmitting(true);
        setError(null);
        try {
            // Upload ID file (mandatory)
            const idExt = idFile.name.split('.').pop();
            const idFileName = `${user.id}/id_${Date.now()}.${idExt}`;
            
            const { error: idError } = await supabase.storage
                .from('verification-docs')
                .upload(idFileName, idFile);

            if (idError) throw idError;

            // Upload cert file (optional)
            if (certFile) {
                const certExt = certFile.name.split('.').pop();
                const certFileName = `${user.id}/cert_${Date.now()}.${certExt}`;
                
                const { error: certError } = await supabase.storage
                    .from('verification-docs')
                    .upload(certFileName, certFile);

                if (certError) throw certError;
            }
            
            // Update profile to mark as verification pending
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ is_verified: true })
                .eq('id', user.id);

            if (updateError) throw updateError;
            
            // If uploads succeed, proceed
            onComplete();
        } catch (err) {
            console.error("File upload failed:", err);
            setError("File upload failed. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-50 h-full flex flex-col relative">
            <button onClick={onBack} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pt-20">
                <h1 className="text-2xl font-bold text-slate-800 text-center mb-4">Become a Verified Trainer</h1>
                
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-3" />
                        {error}
                    </div>
                )}

                {/* Step 1: Introduction */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                    <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-500 text-white">
                           <CheckCircle className="w-5 h-5"/>
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">Why Get Verified?</h2>
                            <p className="text-sm text-slate-500 mt-1">A verified badge builds trust, increases your visibility in search results, and helps you get more bookings.</p>
                        </div>
                    </div>
                </div>

                {/* Step 2: ID Upload */}
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                    <div className="flex items-start gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${idFile ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {idFile ? <CheckCircle className="w-5 h-5"/> : <span className="font-bold">2</span>}
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">Upload Your ID</h2>
                            <p className="text-sm text-slate-500 mt-1">Upload a clear photo of your National ID (CCCD), Passport, or Driver's License.</p>
                             <input type="file" ref={idInputRef} onChange={(e) => handleFileSelect(e, 'id')} className="hidden" accept="image/*,.pdf"/>
                            <button onClick={() => idInputRef.current?.click()} className="mt-3 w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                {idFile ? (
                                    <div className="flex items-center text-emerald-600">
                                        <FileText className="w-5 h-5 mr-2"/>
                                        <span className="text-sm font-semibold truncate">{idFile.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <UploadCloud className="w-8 h-8 text-slate-400"/>
                                        <span className="text-sm font-semibold text-slate-600 mt-1">Click to upload document</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                 {/* Step 3: Certification Upload */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-200 text-slate-500">
                             <span className="font-bold">3</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">Upload Certifications (Optional)</h2>
                            <p className="text-sm text-slate-500 mt-1">Showcase your qualifications by uploading any relevant fitness certifications.</p>
                            <input type="file" ref={certInputRef} onChange={(e) => handleFileSelect(e, 'cert')} className="hidden" accept="image/*,.pdf"/>
                            <button onClick={() => certInputRef.current?.click()} className="mt-3 w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                               {certFile ? (
                                    <div className="flex items-center text-emerald-600">
                                        <FileText className="w-5 h-5 mr-2"/>
                                        <span className="text-sm font-semibold truncate">{certFile.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <UploadCloud className="w-8 h-8 text-slate-400"/>
                                        <span className="text-sm font-semibold text-slate-600 mt-1">Click to upload document</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="px-4 pt-4 bg-white border-t border-gray-200 flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button
                    onClick={handleSubmit}
                    disabled={!idFile || isSubmitting}
                    className="w-full flex items-center justify-center bg-[#FF6B35] text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                    {isSubmitting && <Loader className="w-5 h-5 mr-2 animate-spin"/>}
                    {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                </button>
            </footer>
        </div>
    );
};

export default VerificationPage;