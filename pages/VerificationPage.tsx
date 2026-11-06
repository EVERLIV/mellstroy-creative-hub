import React, { useState } from 'react';
import { AlertTriangle, BadgeCheck, Check, Search, TrendingUp, type LucideIcon } from 'lucide-react';
import { AppScreen, ScreenHeader, ScreenBody, ScreenStickyBar } from '@/src/components/layout/screen';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import ParticleButton from '@/src/components/kokonutui/particle-button';
import FileUpload from '@/src/components/kokonutui/file-upload';
import { cn } from '@/src/lib/utils';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';

interface VerificationPageProps {
    onBack: () => void;
    onComplete: () => void;
}

const ACCEPTED_TYPES = ['image/*', '.pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const BENEFITS: ReadonlyArray<{ icon: LucideIcon; title: string; text: string }> = [
    { icon: BadgeCheck, title: 'Verified badge', text: 'Builds trust on your card and profile.' },
    { icon: Search, title: 'Better visibility', text: 'Rank higher in search results.' },
    { icon: TrendingUp, title: 'More bookings', text: 'Students book trainers they can trust.' },
];

const VerificationPage: React.FC<VerificationPageProps> = ({ onBack, onComplete }) => {
    const { user } = useAuth();
    const [idFile, setIdFile] = useState<File | null>(null);
    const [certFile, setCertFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const completedSteps = 1 + (idFile ? 1 : 0);

    return (
        <AppScreen>
            <ScreenHeader
                title="Become a verified trainer"
                description="Three quick steps to earn the verified badge"
                onBack={onBack}
                width="form"
                breadcrumbs={[{ label: 'Profile', href: '/profile' }, { label: 'Verification' }]}
            />

            <ScreenBody width="form">
                {error && (
                    <Alert variant="destructive" role="alert">
                        <AlertTriangle />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Progress */}
                <div className="flex flex-col gap-2" role="status" aria-live="polite">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{completedSteps} of 2 required steps done</span>
                        <span className="text-muted-foreground">Step 3 is optional</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary transition-[width] duration-300"
                            style={{ width: `${(completedSteps / 2) * 100}%` }}
                        />
                    </div>
                </div>

                <Step marker={<Check className="size-4" aria-hidden="true" />} isDone title="Why get verified?">
                    <ul className="grid gap-3 sm:grid-cols-3">
                        {BENEFITS.map(({ icon: Icon, title, text }) => (
                            <li key={title} className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
                                <Icon className="size-5 text-primary" aria-hidden="true" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-semibold text-foreground">{title}</span>
                                    <span className="text-xs text-muted-foreground">{text}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Step>

                <Step
                    marker={idFile ? <Check className="size-4" aria-hidden="true" /> : '2'}
                    isDone={Boolean(idFile)}
                    title="Upload your ID"
                    description="A clear photo of your National ID (CCCD), Passport or Driver's License."
                >
                    <FileUpload
                        multiple={false}
                        maxFiles={1}
                        maxFileSize={MAX_FILE_SIZE}
                        acceptedFileTypes={ACCEPTED_TYPES}
                        onUpload={async (file) => {
                            setIdFile(file);
                        }}
                        onFileRemove={() => setIdFile(null)}
                    />
                </Step>

                <Step
                    marker={certFile ? <Check className="size-4" aria-hidden="true" /> : '3'}
                    isDone={Boolean(certFile)}
                    title="Upload certifications"
                    optional
                    description="Showcase your qualifications with any relevant fitness certifications."
                >
                    <FileUpload
                        multiple={false}
                        maxFiles={1}
                        maxFileSize={MAX_FILE_SIZE}
                        acceptedFileTypes={ACCEPTED_TYPES}
                        onUpload={async (file) => {
                            setCertFile(file);
                        }}
                        onFileRemove={() => setCertFile(null)}
                    />
                </Step>

                <ScreenStickyBar width="form">
                    <ParticleButton
                        size="lg"
                        className="w-full md:w-auto"
                        onClick={handleSubmit}
                        disabled={!idFile || isSubmitting}
                        status={isSubmitting ? 'pending' : error ? 'error' : 'idle'}
                        pendingLabel="Submitting..."
                        errorLabel="Try again"
                    >
                        Submit for review
                    </ParticleButton>
                </ScreenStickyBar>
            </ScreenBody>
        </AppScreen>
    );
};

interface StepProps {
    marker: React.ReactNode;
    isDone: boolean;
    title: string;
    description?: string;
    optional?: boolean;
    children: React.ReactNode;
}

function Step({ marker, isDone, title, description, optional, children }: StepProps) {
    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 md:p-6">
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors',
                        isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                >
                    {marker}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
                        {title}
                        {optional && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Optional</span>
                        )}
                    </h2>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
            </div>
            {children}
        </section>
    );
}

export default VerificationPage;
