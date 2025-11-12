import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, FileImage, Award, FileText, Loader, CheckCircle, XCircle } from 'lucide-react';
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
            // TODO: Re-enable when trainer_documents table is created
            /* const { data, error } = await supabase
                .from('trainer_documents')
                .select('*')
                .eq('trainer_id', user.id)
                .order('created_at', { ascending: false }); */
            const data: any[] = [];
            const error = null;

            if (error) throw error;
            setDocuments(data || []);
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                variant: "destructive",
                title: "Invalid file",
                description: "Please upload an image file.",
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                variant: "destructive",
                title: "File too large",
                description: "Image must be less than 5MB.",
            });
            return;
        }

        setUploadData(prev => ({ ...prev, file }));
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
            // TODO: Re-enable when trainer_documents table is created
            /* const { error: insertError } = await supabase
                .from('trainer_documents')
                .insert({
                    trainer_id: user.id,
                    document_type: uploadData.document_type,
                    title: uploadData.title.trim(),
                    file_url: publicUrl,
                    priority: priority
                }); */
            const insertError = null;

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

    const handleDelete = async (documentId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

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

            // TODO: Re-enable when trainer_documents table is created
            /* const { error } = await supabase
                .from('trainer_documents')
                .delete()
                .eq('id', documentId); */
            const error = null;

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
                return <FileText className="w-5 h-5" />;
            case 'award':
                return <Award className="w-5 h-5" />;
            default:
                return <FileImage className="w-5 h-5" />;
        }
    };

    return (
        <div className="bg-white h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm z-20">
                <button onClick={onBack} className="p-2 -ml-2">
                    <ArrowLeft className="w-5 h-5 text-gray-800" />
                </button>
                <h1 className="text-base font-bold text-gray-900">My Documents</h1>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="text-sm font-semibold text-blue-600 px-2 py-1 hover:text-blue-700"
                >
                    Upload
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 bg-gray-50">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                            <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 mb-4">No documents uploaded yet</p>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Upload Document
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div key={doc.id} className="bg-white rounded-lg p-3 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                            {getDocumentIcon(doc.document_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="text-sm font-bold text-gray-900 truncate">{doc.title}</h3>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 capitalize mb-2">{doc.document_type}</p>
                                            <div className="flex items-center gap-2">
                                                {doc.is_verified ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                        <XCircle className="w-3 h-3" />
                                                        Not Verified
                                                    </span>
                                                )}
                                            </div>
                                            {doc.rejection_reason && (
                                                <p className="text-xs text-red-600 mt-1">Rejected: {doc.rejection_reason}</p>
                                            )}
                                        </div>
                                    </div>
                                    <img
                                        src={doc.file_url}
                                        alt={doc.title}
                                        className="w-full h-32 object-cover rounded-lg mt-2"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-gray-600 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-100 rounded-lg w-full max-w-md shadow-2xl border border-gray-300">
                        <div className="p-3 bg-white border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900">Upload Document</h2>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <div className="p-4 bg-white space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Document Type</label>
                                <select
                                    value={uploadData.document_type}
                                    onChange={(e) => setUploadData(prev => ({ ...prev, document_type: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="certificate">Certificate</option>
                                    <option value="award">Award</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={uploadData.title}
                                    onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g., Personal Trainer Certification"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">File (Image)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {uploadData.file && (
                                    <p className="text-xs text-gray-600 mt-1">{uploadData.file.name}</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex gap-2">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="flex-1 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading || !uploadData.file || !uploadData.title.trim()}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <Loader className="w-3.5 h-3.5 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-3.5 h-3.5" />
                                        Upload
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyDocumentsPage;

