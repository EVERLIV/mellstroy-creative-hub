import React, { useState, useEffect } from 'react';
import { Upload, FileImage, Award, FileText, CheckCircle, Clock } from 'lucide-react';
import { AppScreen, ScreenHeader, ScreenBody, ScreenSection } from '@/src/components/layout/screen';
import { PageLoader, EmptyState } from '@/src/components/layout/states';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/src/components/ui/field';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { NativeSelect } from '@/src/components/ui/native-select';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import ParticleButton from '@/src/components/kokonutui/particle-button';
import HoldButton from '@/src/components/kokonutui/hold-button';
import FileUpload from '@/src/components/kokonutui/file-upload';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import { useAuth } from '../src/hooks/useAuth';

interface Document {
    id: string;
    trainer_id: string;
    document_type: 'certificate' | 'award' | 'other';
    title: string;
    file_url: string;
    is_verified: boolean;
    verified_by?: string;
    verified_at?: string;
    rejection_reason?: string;
    created_at: string;
    priority: number;
}

const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;

const MyDocumentsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadData, setUploadData] = useState({
        document_type: 'certificate' as 'certificate' | 'award' | 'other',
        title: '',
        file: null as File | null
    });

    useEffect(() => {
        if (user) {
            loadDocuments();
        }
    }, [user]);

    const loadDocuments = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('trainer_documents')
                .select('*')
                .eq('trainer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments((data || []) as Document[]);
        } catch (error: any) {
            console.error('Error loading documents:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load documents.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!user || !uploadData.file || !uploadData.title.trim()) {
            toast({
                variant: "destructive",
                title: "Validation error",
                description: "Please fill all fields and select a file.",
            });
            return;
        }

        try {
            setUploading(true);

            // Upload file to storage
            const fileExt = uploadData.file.name.split('.').pop();
            const fileName = `${user.id}/documents/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('trainer-documents')
                .upload(fileName, uploadData.file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('trainer-documents')
                .getPublicUrl(fileName);

            // Get user's premium status for priority
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_premium')
                .eq('id', user.id)
                .single();

            const priority = profile?.is_premium ? 10 : 0;

            // Save document record
            const { error: insertError } = await supabase
                .from('trainer_documents')
                .insert({
                    trainer_id: user.id,
                    document_type: uploadData.document_type,
                    title: uploadData.title.trim(),
                    file_url: publicUrl,
                    priority: priority
                });

            if (insertError) throw insertError;

            toast({
                title: "Document uploaded",
                description: "Your document has been uploaded and is pending verification.",
            });

            setShowUploadModal(false);
            setUploadData({
                document_type: 'certificate',
                title: '',
                file: null
            });
            loadDocuments();
        } catch (error: any) {
            console.error('Error uploading document:', error);
            toast({
                variant: "destructive",
                title: "Upload failed",
                description: error.message || "Failed to upload document.",
            });
        } finally {
            setUploading(false);
        }
    };

    // Deleting is irreversible: the card's HoldButton is the confirmation.
    const handleDelete = async (documentId: string) => {
        try {
            const doc = documents.find(d => d.id === documentId);
            if (doc) {
                // Delete file from storage
                const fileName = doc.file_url.split('/').pop();
                if (fileName) {
                    await supabase.storage
                        .from('trainer-documents')
                        .remove([`${user?.id}/documents/${fileName}`]);
                }
            }

            const { error } = await supabase
                .from('trainer_documents')
                .delete()
                .eq('id', documentId);

            if (error) throw error;

            toast({
                title: "Document deleted",
                description: "Document has been removed.",
            });

            loadDocuments();
        } catch (error: any) {
            console.error('Error deleting document:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete document.",
            });
        }
    };

    const getDocumentIcon = (type: string) => {
        switch (type) {
            case 'certificate':
                return <FileText className="size-4" aria-hidden="true" />;
            case 'award':
                return <Award className="size-4" aria-hidden="true" />;
            default:
                return <FileImage className="size-4" aria-hidden="true" />;
        }
    };

    const verifiedCount = documents.filter((d) => d.is_verified).length;
    const pendingCount = documents.length - verifiedCount;

    return (
        <AppScreen>
            <ScreenHeader
                title="My documents"
                description="Certificates and awards shown on your trainer profile after verification"
                onBack={onBack}
                width="detail"
                breadcrumbs={[{ label: 'Profile' }, { label: 'Documents' }]}
                actions={
                    <Button size="sm" onClick={() => setShowUploadModal(true)}>
                        <Upload />
                        Upload
                    </Button>
                }
            />

            <ScreenBody width="detail">
                {loading ? (
                    <PageLoader title="Loading documents…" />
                ) : documents.length === 0 ? (
                    <EmptyState
                        icon={FileImage}
                        title="No documents uploaded yet"
                        description="Upload certificates and awards to build trust with students."
                        action={
                            <Button onClick={() => setShowUploadModal(true)}>
                                <Upload />
                                Upload document
                            </Button>
                        }
                    />
                ) : (
                    <>
                        <dl className="grid grid-cols-3 gap-3 md:gap-4">
                            <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
                                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <FileText className="size-3.5" aria-hidden="true" />
                                    Total
                                </dt>
                                <dd className="text-2xl font-semibold tabular-nums text-foreground">{documents.length}</dd>
                            </div>
                            <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
                                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <CheckCircle className="size-3.5" aria-hidden="true" />
                                    Verified
                                </dt>
                                <dd className="text-2xl font-semibold tabular-nums text-foreground">{verifiedCount}</dd>
                            </div>
                            <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
                                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="size-3.5" aria-hidden="true" />
                                    In review
                                </dt>
                                <dd className="text-2xl font-semibold tabular-nums text-foreground">{pendingCount}</dd>
                            </div>
                        </dl>

                        <ScreenSection title="All documents">
                            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {documents.map((doc) => (
                                    <li key={doc.id}>
                                        <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
                                            <img src={doc.file_url} alt={doc.title} loading="lazy" className="aspect-[4/3] w-full bg-muted object-cover" />
                                            <div className="flex flex-1 flex-col gap-3 p-4">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="truncate text-sm font-semibold text-foreground">{doc.title}</h3>
                                                    <p className="flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                                                        {getDocumentIcon(doc.document_type)}
                                                        {doc.document_type}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-start gap-1.5">
                                                    {doc.is_verified ? (
                                                        <StatusBadge status="verified" />
                                                    ) : (
                                                        <StatusBadge tone="warning">Not verified</StatusBadge>
                                                    )}
                                                    {doc.rejection_reason && (
                                                        <p className="text-xs text-destructive">Rejected: {doc.rejection_reason}</p>
                                                    )}
                                                </div>
                                                <HoldButton
                                                    variant="red"
                                                    onHoldComplete={() => handleDelete(doc.id)}
                                                    aria-label={`Hold to delete ${doc.title}`}
                                                    className="mt-auto w-full min-w-0"
                                                />
                                            </div>
                                        </article>
                                    </li>
                                ))}
                            </ul>
                        </ScreenSection>
                    </>
                )}
            </ScreenBody>

            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload document</DialogTitle>
                        <DialogDescription>Images up to 5MB. Documents are reviewed before they appear on your profile.</DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="document-type">Document type</FieldLabel>
                            <NativeSelect
                                id="document-type"
                                value={uploadData.document_type}
                                onChange={(e) => setUploadData(prev => ({ ...prev, document_type: e.target.value as any }))}
                            >
                                <option value="certificate">Certificate</option>
                                <option value="award">Award</option>
                                <option value="other">Other</option>
                            </NativeSelect>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="document-title">
                                Title <span className="text-destructive" aria-hidden="true">*</span>
                            </FieldLabel>
                            <Input
                                id="document-title"
                                type="text"
                                value={uploadData.title}
                                onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="e.g., Personal Trainer Certification"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>
                                File <span className="text-destructive" aria-hidden="true">*</span>
                            </FieldLabel>
                            <FileUpload
                                multiple={false}
                                maxFiles={1}
                                maxFileSize={MAX_DOCUMENT_SIZE}
                                acceptedFileTypes={['image/*']}
                                onUpload={async (file) => {
                                    setUploadData(prev => ({ ...prev, file }));
                                }}
                                onFileRemove={() => setUploadData(prev => ({ ...prev, file: null }))}
                            />
                            <FieldDescription>The file is sent when you press Upload.</FieldDescription>
                        </Field>
                    </FieldGroup>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                            Cancel
                        </Button>
                        <ParticleButton
                            onClick={handleUpload}
                            disabled={!uploadData.file || !uploadData.title.trim()}
                            status={uploading ? 'pending' : 'idle'}
                            pendingLabel="Uploading..."
                            icon={<Upload />}
                        >
                            Upload
                        </ParticleButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppScreen>
    );
};

export default MyDocumentsPage;
