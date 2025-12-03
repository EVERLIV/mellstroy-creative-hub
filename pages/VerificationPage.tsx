import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, CheckCircle, FileText, UploadCloud, Loader, AlertTriangle, Mail, Phone, Send } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';

interface VerificationPageProps {
    onBack: () => void;
    onComplete: () => void;
}

const VerificationPage: React.FC<VerificationPageProps> = ({ onBack, onComplete }) => {
    const { user } = useAuth();
    const [idFile, setIdFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Email verification
    const [emailVerified, setEmailVerified] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    
    // Phone verification
    const [phone, setPhone] = useState('');
    const [phoneCode, setPhoneCode] = useState('');
    const [phoneSent, setPhoneSent] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [sendingPhone, setSendingPhone] = useState(false);
    const [verifyingPhone, setVerifyingPhone] = useState(false);

    const idInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Check if email is already verified
        if (user?.email_confirmed_at) {
            setEmailVerified(true);
        }
    }, [user]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIdFile(e.target.files[0]);
        }
    };
    
    const handleSendEmailVerification = async () => {
        if (!user?.email) return;
        setSendingEmail(true);
        setError(null);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/verification`
                }
            });
            if (error) throw error;
            setEmailSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send verification email');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleSendPhoneCode = async () => {
        if (!phone || !phone.startsWith('+84')) {
            setError('Please enter a valid Vietnam phone number starting with +84');
            return;
        }
        setSendingPhone(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: phone,
            });
            if (error) throw error;
            setPhoneSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send verification code');
        } finally {
            setSendingPhone(false);
        }
    };

    const handleVerifyPhone = async () => {
        if (!phoneCode || phoneCode.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }
        setVerifyingPhone(true);
        setError(null);
        try {
            const { error } = await supabase.auth.verifyOtp({
                phone: phone,
                token: phoneCode,
                type: 'sms'
            });
            if (error) throw error;
            setPhoneVerified(true);
            
            // Update profile with phone
            if (user) {
                await supabase.from('profiles').update({ phone }).eq('id', user.id);
            }
        } catch (err: any) {
            setError(err.message || 'Invalid verification code');
        } finally {
            setVerifyingPhone(false);
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
            
            // Update profile to mark as verification pending
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ is_verified: true })
                .eq('id', user.id);

            if (updateError) throw updateError;
            
            onComplete();
        } catch (err) {
            setError("File upload failed. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-background h-full flex flex-col relative">
            <button onClick={onBack} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-card shadow-md hover:bg-muted transition-colors">
                <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pt-20 pb-32">
                <h1 className="text-2xl font-bold text-foreground text-center mb-4">Become a Verified Trainer</h1>
                
                {error && (
                    <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 rounded-lg flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Step 1: Email Verification */}
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${emailVerified ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {emailVerified ? <CheckCircle className="w-5 h-5"/> : <Mail className="w-5 h-5"/>}
                        </div>
                        <h2 className="font-bold text-foreground">Verify Your Email</h2>
                        <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                        
                        {emailVerified ? (
                            <div className="mt-3 flex items-center text-emerald-600">
                                <CheckCircle className="w-4 h-4 mr-2"/>
                                <span className="text-sm font-medium">Email verified</span>
                            </div>
                        ) : emailSent ? (
                            <div className="mt-3 text-sm text-muted-foreground">
                                <p>Verification email sent! Check your inbox.</p>
                                <button 
                                    onClick={handleSendEmailVerification}
                                    disabled={sendingEmail}
                                    className="text-primary hover:underline mt-2"
                                >
                                    Resend email
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={handleSendEmailVerification}
                                disabled={sendingEmail}
                                className="mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {sendingEmail ? <Loader className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                                Send Verification Email
                            </button>
                        )}
                    </div>
                </div>

                {/* Step 2: Phone Verification */}
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${phoneVerified ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {phoneVerified ? <CheckCircle className="w-5 h-5"/> : <Phone className="w-5 h-5"/>}
                        </div>
                        <h2 className="font-bold text-foreground">Verify Your Phone</h2>
                        <p className="text-sm text-muted-foreground mt-1">We'll send a verification code via SMS</p>
                        
                        {phoneVerified ? (
                            <div className="mt-3 flex items-center text-emerald-600">
                                <CheckCircle className="w-4 h-4 mr-2"/>
                                <span className="text-sm font-medium">Phone verified: {phone}</span>
                            </div>
                        ) : phoneSent ? (
                            <div className="mt-3 w-full space-y-3">
                                <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to {phone}</p>
                                <input
                                    type="text"
                                    value={phoneCode}
                                    onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full text-center text-2xl tracking-widest px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    maxLength={6}
                                />
                                <button 
                                    onClick={handleVerifyPhone}
                                    disabled={verifyingPhone || phoneCode.length !== 6}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {verifyingPhone ? <Loader className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                                    Verify Code
                                </button>
                                <button 
                                    onClick={() => setPhoneSent(false)}
                                    className="text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Change phone number
                                </button>
                            </div>
                        ) : (
                            <div className="mt-3 w-full space-y-3">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+84 xxx xxx xxx"
                                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-center"
                                />
                                <button 
                                    onClick={handleSendPhoneCode}
                                    disabled={sendingPhone || !phone}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {sendingPhone ? <Loader className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                                    Send Code
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 3: ID Upload */}
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${idFile ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {idFile ? <CheckCircle className="w-5 h-5"/> : <FileText className="w-5 h-5"/>}
                        </div>
                        <h2 className="font-bold text-foreground">Upload Your ID</h2>
                        <p className="text-sm text-muted-foreground mt-1">Upload a clear photo of your National ID (CCCD), Passport, or Driver's License.</p>
                        <input type="file" ref={idInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf"/>
                        <button onClick={() => idInputRef.current?.click()} className="mt-3 w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors">
                            {idFile ? (
                                <div className="flex items-center text-emerald-600">
                                    <FileText className="w-5 h-5 mr-2"/>
                                    <span className="text-sm font-semibold truncate">{idFile.name}</span>
                                </div>
                            ) : (
                                <>
                                    <UploadCloud className="w-8 h-8 text-muted-foreground"/>
                                    <span className="text-sm font-semibold text-muted-foreground mt-1">Click to upload document</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>

            <footer className="px-4 pt-4 bg-card border-t border-border flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button
                    onClick={handleSubmit}
                    disabled={!idFile || isSubmitting}
                    className="w-full flex items-center justify-center bg-primary text-primary-foreground font-bold py-3.5 rounded-xl transition-all duration-200 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                    {isSubmitting && <Loader className="w-5 h-5 mr-2 animate-spin"/>}
                    {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                </button>
            </footer>
        </div>
    );
};

export default VerificationPage;