import React, { useState } from 'react';
import { ArrowLeft, Upload, Check, X, FolderUp } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const categories = [
  { id: 'gym', name: 'Gym' },
  { id: 'yoga', name: 'Yoga' },
  { id: 'boxing', name: 'Boxing' },
  { id: 'running', name: 'Running' },
  { id: 'swimming', name: 'Swimming' },
  { id: 'dance', name: 'Dance' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'more', name: 'More' },
];

const UploadCategoryIconsPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({});
  const [isDragging, setIsDragging] = useState(false);

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
      return;
    }

    setUploadStatus(prev => ({ ...prev, [categoryId]: 'uploading' }));

    try {
      // Validate file type
      if (!file.type.match(/^image\/(png|jpeg|jpg|webp|svg\+xml)$/)) {
        throw new Error('Invalid file type. Please upload PNG, JPG, WEBP, or SVG.');
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
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

      setUploadStatus(prev => ({ ...prev, [categoryId]: 'success' }));
      toast({
        title: 'Success',
        description: `${category.name} icon uploaded successfully`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus(prev => ({ ...prev, [categoryId]: 'error' }));
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload icon',
        variant: 'destructive',
      });
    }
  };

  const handleMultipleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Upload all files in parallel
    await Promise.all(fileArray.map(file => handleFileUpload(file)));
    
    const successCount = fileArray.filter(f => {
      const categoryId = f.name.toLowerCase().split('.')[0];
      return uploadStatus[categoryId] === 'success';
    }).length;
    
    if (successCount === fileArray.length) {
      toast({
        title: 'All uploads complete',
        description: `Successfully uploaded ${successCount} icon${successCount > 1 ? 's' : ''}`,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleMultipleFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleMassUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleMultipleFiles(files);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-orange-500 to-pink-500 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/profile')}
            className="mb-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">Upload Category Icons</h1>
          <p className="text-white/90 text-sm mt-1">Upload multiple icons at once (PNG, JPG, WEBP, or SVG, max 2MB)</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Mass Upload Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mb-6 border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            isDragging
              ? 'border-orange-500 bg-orange-50'
              : 'border-slate-300 bg-white hover:border-orange-400'
          }`}
        >
          <FolderUp className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-orange-500' : 'text-slate-400'}`} />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Drop multiple icons here or click to browse
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Name your files: gym.png, yoga.png, boxing.png, etc.
          </p>
          <label className="inline-block px-6 py-3 bg-[#FF6B35] hover:bg-orange-600 text-white font-semibold rounded-lg cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={handleMassUpload}
              className="hidden"
              multiple
            />
            Select Multiple Files
          </label>
        </div>

        {/* Individual Category Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Status</h2>
          {categories.map((category) => {
            const status = uploadStatus[category.id] || 'idle';
            return (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                    {status === 'success' ? (
                      <Check className="w-6 h-6 text-green-600" />
                    ) : status === 'error' ? (
                      <X className="w-6 h-6 text-red-600" />
                    ) : status === 'uploading' ? (
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{category.name}</h3>
                    <p className="text-xs text-slate-500">
                      Expected filename: {category.id}.png/jpg/webp/svg
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  status === 'success' ? 'bg-green-100 text-green-700' :
                  status === 'error' ? 'bg-red-100 text-red-700' :
                  status === 'uploading' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-200 text-slate-600'
                }`}>
                  {status === 'uploading' ? 'Uploading...' :
                   status === 'success' ? 'Uploaded' :
                   status === 'error' ? 'Failed' :
                   'Pending'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Name your icon files exactly as category IDs: gym.png, yoga.png, boxing.png, etc.</li>
            <li>Drag & drop multiple files or use "Select Multiple Files" button</li>
            <li>Files will be automatically uploaded based on their names</li>
            <li>Icons will appear on the dashboard automatically after upload</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default UploadCategoryIconsPage;
