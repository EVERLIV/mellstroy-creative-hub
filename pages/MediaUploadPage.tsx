import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Image, Loader, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';

const MediaUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedBucket, setSelectedBucket] = useState('category-icons');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [failedFiles, setFailedFiles] = useState<string[]>([]);

  const buckets = [
    { id: 'category-icons', name: 'Category Icons', description: 'Icons for fitness categories' },
    { id: 'class-images', name: 'Class Images', description: 'Images for training classes' },
    { id: 'avatars', name: 'Avatars', description: 'User profile avatars' },
    { id: 'challenge-covers', name: 'Challenge Covers', description: 'Cover images for challenges' },
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadedFiles([]);
    setFailedFiles([]);

    const uploadPromises = Array.from(files).map(async (file: File) => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from(selectedBucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        setUploadedFiles(prev => [...prev, file.name]);
        return { success: true, fileName: file.name };
      } catch (error: any) {
        console.error(`Error uploading ${file.name}:`, error);
        setFailedFiles(prev => [...prev, file.name]);
        return { success: false, fileName: file.name, error: error.message };
      }
    });

    await Promise.all(uploadPromises);

    setUploading(false);

    toast({
      title: 'Upload Complete',
      description: `Successfully uploaded ${uploadedFiles.length + 1} file(s)${failedFiles.length > 0 ? `, ${failedFiles.length} failed` : ''}`,
    });

    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-pink-500 px-4 py-4">
        <button
          onClick={() => navigate('/admin')}
          className="mb-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white text-center">Media Upload</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Bucket Selection */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Select Storage Bucket</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {buckets.map((bucket) => (
              <button
                key={bucket.id}
                onClick={() => setSelectedBucket(bucket.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedBucket === bucket.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-semibold text-foreground mb-1">{bucket.name}</p>
                <p className="text-sm text-muted-foreground">{bucket.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Upload Files</h2>
          
          <label className="block">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">Click to upload files</p>
              <p className="text-sm text-muted-foreground mb-4">
                or drag and drop images here
              </p>
              <p className="text-xs text-muted-foreground">
                Uploading to: <span className="font-semibold text-primary">{buckets.find(b => b.id === selectedBucket)?.name}</span>
              </p>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>

          {uploading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Uploading files...</span>
            </div>
          )}
        </div>

        {/* Upload Results */}
        {(uploadedFiles.length > 0 || failedFiles.length > 0) && (
          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Upload Results</h2>
            
            {uploadedFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Successfully Uploaded ({uploadedFiles.length})
                </h3>
                <ul className="space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {failedFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Failed Uploads ({failedFiles.length})
                </h3>
                <ul className="space-y-1">
                  {failedFiles.map((file, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <XCircle className="w-3 h-3 text-red-600" />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted/50 rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-3">Upload Instructions</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Select the appropriate storage bucket for your media type</li>
            <li>• You can upload multiple files at once</li>
            <li>• Supported formats: JPG, PNG, WEBP, GIF</li>
            <li>• Maximum file size: 5MB per file</li>
            <li>• Files are automatically renamed to prevent conflicts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MediaUploadPage;
