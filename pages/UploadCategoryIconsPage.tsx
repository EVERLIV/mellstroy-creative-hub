import React, { useState, useEffect } from 'react';
import { ArrowLeft, FolderUp, Image } from 'lucide-react';
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
  const [isDragging, setIsDragging] = useState(false);
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
      
      setUploadedFiles(data?.map(file => file.name) || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const handleMultipleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Upload all files in parallel
    await Promise.all(fileArray.map(file => handleFileUpload(file)));
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

        {/* Uploaded Files */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Uploaded Files</h2>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading files...</div>
          ) : uploadedFiles.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No files uploaded yet</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {uploadedFiles.map((fileName) => {
                const fileUrl = supabase.storage
                  .from('category-icons')
                  .getPublicUrl(fileName).data.publicUrl;
                
                return (
                  <div key={fileName} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                      <img 
                        src={fileUrl} 
                        alt={fileName}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '';
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 text-center break-all">
                      {fileName}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
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
