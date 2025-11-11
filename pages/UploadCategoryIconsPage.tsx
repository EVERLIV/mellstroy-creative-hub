import React, { useState } from 'react';
import { ArrowLeft, Upload, Check, X } from 'lucide-react';
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

  const handleFileUpload = async (categoryId: string, file: File) => {
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

      // Create filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${categoryId}.${fileExt}`;

      // Delete existing file if any
      const { error: deleteError } = await supabase.storage
        .from('category-icons')
        .remove([fileName]);

      if (deleteError && deleteError.message !== 'Object not found') {
        console.warn('Could not delete existing file:', deleteError);
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('category-icons')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      setUploadStatus(prev => ({ ...prev, [categoryId]: 'success' }));
      toast({
        title: 'Success',
        description: `${categoryId} icon uploaded successfully`,
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

  const handleFileSelect = (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(categoryId, file);
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
          <p className="text-white/90 text-sm mt-1">Upload icons for each category (PNG, JPG, WEBP, or SVG, max 2MB)</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          {categories.map((category) => {
            const status = uploadStatus[category.id] || 'idle';
            return (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                    {status === 'success' ? (
                      <Check className="w-6 h-6 text-green-600" />
                    ) : status === 'error' ? (
                      <X className="w-6 h-6 text-red-600" />
                    ) : (
                      <Upload className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{category.name}</h3>
                    <p className="text-xs text-slate-500">
                      File name: {category.id}.png/jpg/webp/svg
                    </p>
                  </div>
                </div>
                <label
                  className={`px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer transition-colors ${
                    status === 'uploading'
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : status === 'success'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : status === 'error'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-[#FF6B35] hover:bg-orange-600 text-white'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={(e) => handleFileSelect(category.id, e)}
                    className="hidden"
                    disabled={status === 'uploading'}
                  />
                  {status === 'uploading'
                    ? 'Uploading...'
                    : status === 'success'
                    ? 'Re-upload'
                    : status === 'error'
                    ? 'Try Again'
                    : 'Upload'}
                </label>
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Upload all category icons using the buttons above</li>
            <li>After uploading, update the code in DashboardPage.tsx</li>
            <li>Change each category's <code className="bg-blue-100 px-1 rounded">imageUrl: null</code> to <code className="bg-blue-100 px-1 rounded">imageUrl: getCategoryIconUrl('categoryname.ext')</code></li>
            <li>Example: <code className="bg-blue-100 px-1 rounded">imageUrl: getCategoryIconUrl('gym.png')</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default UploadCategoryIconsPage;
