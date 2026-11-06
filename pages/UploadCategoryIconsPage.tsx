import React, { useState, useEffect } from 'react';
import { ImageOff, Info, Trash2 } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { AppScreen, ScreenHeader, ScreenBody, ScreenSection, ScreenSplit } from '@/src/components/layout/screen';
import { PageLoader } from '@/src/components/layout/states';
import FileUpload, { type FileError } from '@/src/components/kokonutui/file-upload';

const categories = [
  { id: 'gym', name: 'Gym' },
  { id: 'yoga', name: 'Yoga' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'boxing', name: 'Boxing' },
  { id: 'running', name: 'Running' },
  { id: 'swimming', name: 'Swimming' },
  { id: 'dance', name: 'Dance' },
  { id: 'pickleball', name: 'Pickleball' },
];

const MAX_ICON_SIZE = 2 * 1024 * 1024;

const UploadCategoryIconsPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('category-icons')
        .list();

      if (error) throw error;

      // Filter to only show files that match valid categories
      const validCategoryIds = categories.map(c => c.id);
      const filteredFiles = data?.filter(file => {
        const fileNameWithoutExt = file.name.split('.')[0];
        return validCategoryIds.includes(fileNameWithoutExt);
      }).map(file => file.name) || [];

      setUploadedFiles(filteredFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from('category-icons')
        .remove([fileName]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${fileName} deleted successfully`,
      });

      await fetchUploadedFiles();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  // Rejects (after toasting) so the upload row shows its failed state with Retry.
  const handleFileUpload = async (file: File) => {
    // Extract category id from filename (e.g., "gym.png" -> "gym")
    const fileName = file.name.toLowerCase();
    const categoryId = fileName.split('.')[0];

    // Check if this is a valid category
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      toast({
        title: 'Invalid filename',
        description: `File "${file.name}" doesn't match any category. Use: ${categories.map(c => c.id).join(', ')}`,
        variant: 'destructive',
      });
      throw new Error(`"${file.name}" doesn't match a category`);
    }

    try {
      // Validate file type
      if (!file.type.match(/^image\/(png|jpeg|jpg|webp|svg\+xml)$/)) {
        throw new Error('Invalid file type. Please upload PNG, JPG, WEBP, or SVG.');
      }

      // Validate file size (2MB)
      if (file.size > MAX_ICON_SIZE) {
        throw new Error('File too large. Maximum size is 2MB.');
      }

      // Delete existing file with any extension
      const extensions = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
      for (const ext of extensions) {
        await supabase.storage
          .from('category-icons')
          .remove([`${categoryId}.${ext}`]);
      }

      // Upload new file with original extension
      const fileExt = file.name.split('.').pop();
      const uploadFileName = `${categoryId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('category-icons')
        .upload(uploadFileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Refresh the uploaded files list
      await fetchUploadedFiles();

      toast({
        title: 'Success',
        description: `${category.name} icon uploaded successfully`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload icon',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Filenames must be a category id, e.g. gym.png: catch it before the row is queued.
  const validateIconName = (file: File): FileError | null => {
    const categoryId = file.name.toLowerCase().split('.')[0];
    if (!categories.some((c) => c.id === categoryId)) {
      return {
        code: 'INVALID_NAME',
        message: `Name it after a category, e.g. ${categories[0].id}.png`,
      };
    }
    return null;
  };

  const fileFor = (categoryId: string) => uploadedFiles.find((f) => f.split('.')[0] === categoryId);

  return (
    <AppScreen>
      <ScreenHeader
        title="Category icons"
        description="Upload PNG, JPG, WEBP or SVG icons, max 2MB each."
        onBack={() => navigate('/profile')}
        width="detail"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Category icons' }]}
      />

      <ScreenBody width="detail">
        <ScreenSplit
          main={
            <>
              <ScreenSection title="Upload" description="Drop several files at once, named after their category">
                <FileUpload
                  acceptedFileTypes={['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']}
                  maxFileSize={MAX_ICON_SIZE}
                  maxFiles={categories.length}
                  multiple
                  validateFile={validateIconName}
                  onUpload={async (file) => {
                    await handleFileUpload(file);
                  }}
                />
              </ScreenSection>

              <ScreenSection
                title="Category coverage"
                description={loading ? undefined : `${uploadedFiles.length} of ${categories.length} categories have an icon`}
              >
                {loading ? (
                  <PageLoader title="Loading files…" className="min-h-[12rem]" />
                ) : (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {categories.map((category) => {
                      const fileName = fileFor(category.id);
                      if (!fileName) {
                        return (
                          <li
                            key={category.id}
                            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-center"
                          >
                            <span className="grid size-20 place-items-center rounded-xl bg-muted text-muted-foreground">
                              <ImageOff className="size-6" aria-hidden="true" />
                            </span>
                            <span className="text-sm font-medium text-foreground">{category.name}</span>
                            <span className="text-xs text-muted-foreground">Missing</span>
                          </li>
                        );
                      }
                      const fileUrl = supabase.storage
                        .from('category-icons')
                        .getPublicUrl(fileName).data.publicUrl;

                      return (
                        <li
                          key={category.id}
                          className="group relative flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center"
                        >
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteFile(fileName)}
                            aria-label={`Delete ${fileName}`}
                            title="Delete file"
                            className="absolute right-2 top-2 size-8 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                          >
                            <Trash2 />
                          </Button>
                          <span className="flex size-20 items-center justify-center overflow-hidden rounded-xl bg-muted">
                            <img
                              src={fileUrl}
                              alt={fileName}
                              className="size-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '';
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </span>
                          <span className="text-sm font-medium text-foreground">{category.name}</span>
                          <span className="break-all text-xs text-muted-foreground">{fileName}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ScreenSection>
            </>
          }
          aside={
            <ScreenSection
              title={
                <span className="flex items-center gap-2">
                  <Info className="size-4 text-primary" aria-hidden="true" />
                  How it works
                </span>
              }
              variant="panel"
            >
              <div className="flex flex-col gap-4">
                <ol className="flex list-decimal flex-col gap-2 pl-4 text-sm text-muted-foreground marker:font-medium marker:text-primary">
                  <li>Name each file after its category ID: gym.png, yoga.png, boxing.png…</li>
                  <li>Drag and drop several files, or browse.</li>
                  <li>Files are matched to categories by name.</li>
                  <li>Icons appear on the dashboard right after upload.</li>
                </ol>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-foreground">Valid names</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <li key={c.id}>
                        <Badge variant="secondary" className="rounded-full font-mono text-xs font-normal">
                          {c.id}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScreenSection>
          }
        />
      </ScreenBody>
    </AppScreen>
  );
};

export default UploadCategoryIconsPage;
