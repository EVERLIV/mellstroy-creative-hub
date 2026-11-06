import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Check, FolderOpen, Image, UserRound, Trophy, Info, type LucideIcon } from 'lucide-react';
import { AppScreen, ScreenHeader, ScreenBody, ScreenSection, ScreenSplit } from '@/src/components/layout/screen';
import { cn } from '@/src/lib/utils';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import FileUpload, { type UploadHelpers } from '@/src/components/kokonutui/file-upload';

const BUCKET_ICONS: Record<string, LucideIcon> = {
  'category-icons': FolderOpen,
  'class-images': Image,
  avatars: UserRound,
  'challenge-covers': Trophy,
};

const MediaUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedBucket, setSelectedBucket] = useState('category-icons');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [failedFiles, setFailedFiles] = useState<string[]>([]);

  const buckets = [
    { id: 'category-icons', name: 'Category Icons', description: 'Icons for fitness categories' },
    { id: 'class-images', name: 'Class Images', description: 'Images for training classes' },
    { id: 'avatars', name: 'Avatars', description: 'User profile avatars' },
    { id: 'challenge-covers', name: 'Challenge Covers', description: 'Cover images for challenges' },
  ];

  const selectedBucketName = buckets.find((b) => b.id === selectedBucket)?.name;

  const handleUpload = async (file: File, helpers: UploadHelpers) => {
    helpers.onProgress(15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage.from(selectedBucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (helpers.signal.aborted) {
      throw new Error('Upload cancelled');
    }

    if (error) {
      setFailedFiles((prev) => (prev.includes(file.name) ? prev : [...prev, file.name]));
      throw error;
    }

    helpers.onProgress(100);
    setUploadedFiles((prev) => (prev.includes(file.name) ? prev : [...prev, file.name]));
  };

  return (
    <AppScreen>
      <ScreenHeader
        title="Media upload"
        description="Upload images to Supabase storage buckets"
        onBack={() => navigate('/admin')}
        width="detail"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Media upload' }]}
      />

      <ScreenBody width="detail">
        <ScreenSplit
          main={
            <>
              <ScreenSection title="1. Choose a bucket" description="Where the files will be stored">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Storage bucket">
                  {buckets.map((bucket) => {
                    const isSelected = selectedBucket === bucket.id;
                    const Icon = BUCKET_ICONS[bucket.id] ?? FolderOpen;
                    return (
                      <button
                        key={bucket.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedBucket(bucket.id)}
                        className={cn(
                          'flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
                        )}
                      >
                        <span
                          className={cn(
                            'grid size-10 shrink-0 place-items-center rounded-full',
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {isSelected ? <Check className="size-5" aria-hidden="true" /> : <Icon className="size-5" aria-hidden="true" />}
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="font-semibold text-foreground">{bucket.name}</span>
                          <span className="text-sm text-muted-foreground">{bucket.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScreenSection>

              <ScreenSection title="2. Upload files" description={`Uploading to ${selectedBucketName}`} variant="panel">
                <FileUpload
                  key={selectedBucket}
                  acceptedFileTypes={['image/*', '.jpg', '.jpeg', '.png', '.webp', '.gif']}
                  maxFileSize={5 * 1024 * 1024}
                  maxFiles={20}
                  multiple
                  onUpload={handleUpload}
                  onUploadSuccess={(file) => {
                    toast({
                      title: 'Uploaded',
                      description: `${file.name} saved to ${selectedBucketName}`,
                    });
                  }}
                  onUploadError={(error, file) => {
                    toast({
                      title: 'Upload failed',
                      description: `${file.name}: ${error.message}`,
                      variant: 'destructive',
                    });
                  }}
                  onComplete={(files) => {
                    if (files.length > 0) {
                      toast({
                        title: 'Upload complete',
                        description: `Successfully uploaded ${files.length} file(s)`,
                      });
                    }
                  }}
                />
              </ScreenSection>

              {(uploadedFiles.length > 0 || failedFiles.length > 0) && (
                <ScreenSection title="Session results" variant="panel">
                  <div className="flex flex-col gap-5">
                    {uploadedFiles.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <CheckCircle className="size-4 text-primary" aria-hidden="true" />
                          Uploaded ({uploadedFiles.length})
                        </h3>
                        <ul className="flex flex-col gap-1">
                          {uploadedFiles.map((file) => (
                            <li key={file} className="truncate text-sm text-muted-foreground">
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {failedFiles.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-destructive">
                          <XCircle className="size-4" aria-hidden="true" />
                          Failed ({failedFiles.length})
                        </h3>
                        <ul className="flex flex-col gap-1">
                          {failedFiles.map((file) => (
                            <li key={file} className="truncate text-sm text-muted-foreground">
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScreenSection>
              )}
            </>
          }
          aside={
            <ScreenSection
              title={
                <span className="flex items-center gap-2">
                  <Info className="size-4 text-primary" aria-hidden="true" />
                  Tips
                </span>
              }
              variant="panel"
            >
              <ul className="flex list-disc flex-col gap-2 pl-4 text-sm text-muted-foreground marker:text-primary">
                <li>Select the bucket that matches your media type</li>
                <li>You can upload multiple files at once</li>
                <li>Supported formats: JPG, PNG, WEBP, GIF</li>
                <li>Maximum file size: 5MB per file</li>
                <li>Files are automatically renamed to prevent conflicts</li>
              </ul>
            </ScreenSection>
          }
        />
      </ScreenBody>
    </AppScreen>
  );
};

export default MediaUploadPage;
