import React, { useState, useEffect } from 'react';
import { Class, ClassType } from '../types';
import { X, Save, Building, Sun, Home, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/src/integrations/supabase/client';
import { useAuth } from '@/src/hooks/useAuth';
import { useToast } from '@/src/hooks/use-toast';

interface AddEditClassModalProps {
    cls: Class | null | undefined;
    onSave: (classData: Class) => void;
    onCancel: () => void;
}

const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type FormData = Omit<Class, 'id' | 'bookings'>;

const AddEditClassModal: React.FC<AddEditClassModalProps> = ({ cls, onSave, onCancel }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isPremium, setIsPremium] = useState(false);
    
    const [formData, setFormData] = useState<FormData & { kids_friendly?: boolean; disability_friendly?: boolean }>({
        name: '',
        description: '',
        duration: 60,
        price: 150000,
        imageUrl: 'https://picsum.photos/id/119/800/600',
        capacity: 10,
        schedule: { days: [], time: '09:00' },
        classType: 'Indoor',
        language: [],
        level: '',
        kids_friendly: false,
        disability_friendly: false
    });
    
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('profiles')
                .select('is_premium')
                .eq('id', user.id)
                .single();
            if (data) {
                setIsPremium(data.is_premium || false);
            }
        };
        fetchUserProfile();
    }, [user]);
    
    useEffect(() => {
        if (cls) {
            setFormData({
                name: cls.name,
                description: cls.description,
                duration: cls.duration,
                price: cls.price,
                imageUrl: cls.imageUrl,
                capacity: cls.capacity,
                schedule: cls.schedule || { days: [], time: '09:00' },
                classType: cls.classType || 'Indoor',
                language: cls.language || [],
                level: cls.level || '',
                kids_friendly: (cls as any).kids_friendly || false,
                disability_friendly: (cls as any).disability_friendly || false
            });
            // Load existing images if available
            const dbCls = cls as any;
            if (dbCls.image_urls && dbCls.image_urls.length > 0) {
                setUploadedImages(dbCls.image_urls);
            } else if (cls.imageUrl) {
                setUploadedImages([cls.imageUrl]);
            }
        } else {
            // Reset to default for new class
            setFormData({
                name: '',
                description: '',
                duration: 60,
                price: 150000,
                imageUrl: 'https://picsum.photos/id/119/800/600',
                capacity: 10,
                schedule: { days: [], time: '09:00' },
                classType: 'Indoor',
                language: [],
                level: '',
                kids_friendly: false,
                disability_friendly: false
            });
            setUploadedImages([]);
        }
    }, [cls]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'duration' || name === 'price' || name === 'capacity') ? parseInt(value) || 0 : value
        }));
    };

    const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            schedule: { ...prev.schedule!, [name]: value }
        }));
    };
    
    const handleDayToggle = (day: string) => {
        setFormData(prev => {
            const currentDays = prev.schedule?.days || [];
            const newDays = currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day];
            return {
                ...prev,
                schedule: { ...prev.schedule!, days: newDays }
            };
        });
    };
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !user) return;

        const maxPhotos = isPremium ? 6 : 1;
        const remainingSlots = maxPhotos - uploadedImages.length;

        if (files.length > remainingSlots) {
            toast({
                title: "Upload limit exceeded",
                description: `You can only upload ${remainingSlots} more photo${remainingSlots !== 1 ? 's' : ''}. ${isPremium ? 'Premium' : 'Basic'} users can upload up to ${maxPhotos} photo${maxPhotos !== 1 ? 's' : ''}.`,
                variant: "destructive"
            });
            return;
        }

        const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > MAX_FILE_SIZE) {
                toast({
                    title: "File too large",
                    description: `${file.name} exceeds 3MB limit. Please choose a smaller image.`,
                    variant: "destructive"
                });
                continue;
            }

            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Invalid file type",
                    description: `${file.name} is not an image file.`,
                    variant: "destructive"
                });
                continue;
            }

            setUploading(true);
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { data, error } = await supabase.storage
                    .from('class-images')
                    .upload(fileName, file);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('class-images')
                    .getPublicUrl(fileName);

                setUploadedImages(prev => [...prev, publicUrl]);
                
                toast({
                    title: "Image uploaded",
                    description: "Your image has been uploaded successfully.",
                });
            } catch (error) {
                toast({
                    title: "Upload failed",
                    description: "Failed to upload image. Please try again.",
                    variant: "destructive"
                });
            } finally {
                setUploading(false);
            }
        }
        
        // Reset input
        e.target.value = '';
    };

    const handleRemoveImage = (index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (uploadedImages.length === 0) {
            toast({
                title: "No images",
                description: "Please upload at least one image for your class.",
                variant: "destructive"
            });
            return;
        }
        
<<<<<<< HEAD
        const finalData: Class & { _dbId?: string; image_urls?: string[] } = {
            id: cls?.id || 0,
            bookings: cls?.bookings || [],
            ...formData,
            language: formData.language || [], // Ensure language is always an array
            level: formData.level || '', // Ensure level is always a string
            imageUrl: uploadedImages[0], // Keep backward compatibility
=======
        const finalData: Class & { _dbId?: string; image_urls?: string[]; kids_friendly?: boolean; disability_friendly?: boolean } = {
            id: cls?.id || 0,
            bookings: cls?.bookings || [],
            ...formData,
            language: formData.language || [],
            level: formData.level || '',
            kids_friendly: formData.kids_friendly || false,
            disability_friendly: formData.disability_friendly || false,
            imageUrl: uploadedImages[0],
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
            image_urls: uploadedImages,
            ...(cls as any)?._dbId && { 
                _dbId: (cls as any)._dbId
            }
        };
        
<<<<<<< HEAD
        console.log('AddEditClassModal - Saving with formData:', {
            language: formData.language,
            level: formData.level,
            finalData: finalData
        });
        
=======
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
        onSave(finalData);
    };
    
    const classTypeOptions: { id: ClassType, label: string, icon: React.FC<any> }[] = [
        { id: 'Indoor', label: 'Indoor', icon: Building },
        { id: 'Outdoor', label: 'Outdoor', icon: Sun },
        { id: 'Home', label: 'Home', icon: Home },
    ];

    if (cls === undefined) return null;

    return (
        <div 
            className="fixed inset-0 bg-gray-600 flex items-center justify-center z-[60] p-4 pb-20 animate-fade-in overflow-y-auto"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-gray-100 rounded-lg w-full max-w-md max-h-[85vh] overflow-hidden transform animate-slide-up flex flex-col my-4 shadow-2xl border border-gray-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-3 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-base font-semibold text-gray-900">{cls ? 'Edit Class' : 'Add New Class'}</h2>
                    <button onClick={onCancel} className="p-1.5 rounded-md hover:bg-gray-200 transition-colors">
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
                
                <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
                    <div className="p-3 space-y-2.5 flex-1 overflow-y-auto overscroll-contain">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1.5">Class Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1.5">Description</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={2} required className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 resize-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Class Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {classTypeOptions.map(opt => (
                                    <button
                                        type="button"
                                        key={opt.id}
                                        onClick={() => setFormData(prev => ({...prev, classType: opt.id}))}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-colors ${formData.classType === opt.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                    >
                                        <opt.icon className={`w-4 h-4 mb-0.5 ${formData.classType === opt.id ? 'text-blue-600' : 'text-slate-500'}`} />
                                        <span className={`text-xs font-semibold ${formData.classType === opt.id ? 'text-blue-700' : 'text-slate-600'}`}>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                         <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label htmlFor="duration" className="block text-xs font-medium text-slate-600 mb-1">Duration</label>
                                <input placeholder="min" type="number" id="duration" name="duration" value={formData.duration} onChange={handleChange} required className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                            </div>
                            <div>
                                <label htmlFor="capacity" className="block text-xs font-medium text-slate-600 mb-1">Capacity</label>
                                <input type="number" id="capacity" name="capacity" value={formData.capacity} onChange={handleChange} required className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800" />
                            </div>
                             <div>
                                <label htmlFor="price" className="block text-xs font-medium text-slate-600 mb-1">Price</label>
                                 <div className="relative">
                                    <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required className="w-full pl-2 pr-8 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                    <span className="absolute inset-y-0 right-2 flex items-center text-slate-400 text-xs">VND</span>
                                </div>
                            </div>
                        </div>
                        {/* Language Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Languages</label>
                            <div className="flex flex-wrap gap-1.5">
                                {['English', 'Vietnamese', 'Chinese', 'Korean', 'Japanese', 'French', 'Spanish'].map(lang => {
                                    const isSelected = formData.language?.includes(lang);
                                    return (
                                        <button
                                            type="button"
                                            key={lang}
                                            onClick={() => {
                                                const currentLangs = formData.language || [];
                                                const newLangs = isSelected
                                                    ? currentLangs.filter(l => l !== lang)
                                                    : [...currentLangs, lang];
                                                setFormData(prev => ({ ...prev, language: newLangs }));
                                            }}
                                            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors border ${
                                                isSelected
                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                            }`}
                                        >
                                            {lang}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Level Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">Class Level</label>
                            <div className="flex flex-wrap gap-1.5">
                                {['Beginner', 'Intermediate', 'Advanced', 'Beginner to Intermediate', 'Intermediate to Advanced'].map(level => (
                                    <button
                                        type="button"
                                        key={level}
                                        onClick={() => setFormData(prev => ({ ...prev, level: level }))}
                                        className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors border ${
                                            formData.level === level
                                                ? 'bg-blue-500 text-white border-blue-500'
                                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Schedule Editor */}
                        <div>
                             <label className="block text-sm font-medium text-slate-600 mb-1.5">Recurring Schedule</label>
                             <div className="p-2.5 border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <label htmlFor="time" className="text-xs font-medium text-slate-600 whitespace-nowrap">Time:</label>
                                    <input type="time" name="time" value={formData.schedule?.time} onChange={handleScheduleChange} className="flex-1 w-full bg-slate-100 border-slate-300 rounded-md text-sm p-1.5 focus:ring-blue-500 focus:border-blue-500 text-slate-800"/>
                                </div>
                                <div className="mt-2">
                                    <label className="text-xs font-medium text-slate-600 block mb-1.5">Repeats on:</label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {dayOptions.map(day => {
                                            const isSelected = formData.schedule?.days.includes(day);
                                            return (
                                                <button type="button" key={day} onClick={() => handleDayToggle(day)} className={`p-1.5 text-xs font-bold rounded-lg transition-colors border ${isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}>
                                                    {day}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                             </div>
                         </div>
                        
                        {/* Additional Options */}
                        <div>
<<<<<<< HEAD
=======
                            <label className="block text-sm font-medium text-slate-600 mb-2">Additional Options</label>
                            <div className="space-y-2">
                                {/* Kids Friendly Toggle */}
                                <label htmlFor="kids-friendly-toggle" className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">👶</span>
                                        <span className="text-sm font-medium text-slate-700">Kids Friendly</span>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            id="kids-friendly-toggle" 
                                            className="sr-only peer" 
                                            checked={formData.kids_friendly || false} 
                                            onChange={(e) => setFormData(prev => ({ ...prev, kids_friendly: e.target.checked }))} 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B35]"></div>
                                    </div>
                                </label>

                                {/* Disability Friendly Toggle */}
                                <label htmlFor="disability-friendly-toggle" className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">♿</span>
                                        <span className="text-sm font-medium text-slate-700">Disability Friendly</span>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            id="disability-friendly-toggle" 
                                            className="sr-only peer" 
                                            checked={formData.disability_friendly || false} 
                                            onChange={(e) => setFormData(prev => ({ ...prev, disability_friendly: e.target.checked }))} 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B35]"></div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
>>>>>>> f5b1c0859b80a5f6a8702140f10ec53e9a8acd25
                            <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                Class Photos ({uploadedImages.length}/{isPremium ? 6 : 1})
                                <span className="ml-2 text-xs text-slate-400">Max 3MB</span>
                            </label>
                            
                            {uploadedImages.length > 0 && (
                                <div className="grid grid-cols-3 gap-1.5 mb-2">
                                    {uploadedImages.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img 
                                                src={url} 
                                                alt={`Class photo ${index + 1}`}
                                                className="w-full h-16 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {uploadedImages.length < (isPremium ? 6 : 1) && (
                                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <div className="flex flex-col items-center justify-center">
                                        <Upload className="w-5 h-5 text-slate-400 mb-0.5" />
                                        <p className="text-xs text-slate-500">
                                            {uploading ? 'Uploading...' : 'Click to upload'}
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        multiple={isPremium}
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            )}
                            
                            {!isPremium && (
                                <p className="text-xs text-amber-600 mt-1.5">
                                    💎 Upgrade to Premium for up to 6 photos
                                </p>
                            )}
                        </div>
                    </div>
                
                    <div className="p-3 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-2 flex-shrink-0">
                        <button type="button" onClick={onCancel} className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-2 px-3 rounded-md transition-all hover:bg-gray-100 text-sm">
                            Cancel
                        </button>
                        <button type="submit" className="w-full flex items-center justify-center bg-[#FF6B35] text-white font-medium py-2 px-3 rounded-md transition-all hover:bg-orange-600 text-sm shadow-sm">
                           <Save className="w-4 h-4 mr-1.5" />
                           Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditClassModal;