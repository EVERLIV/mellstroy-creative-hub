import React, { useState, useRef, useEffect } from 'react';
import { Trainer } from '../types';
import { HCMC_DISTRICTS, FITNESS_ACTIVITIES } from '../constants';
import { Save, Camera, Loader, X } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';

interface EditTrainerProfilePageProps {
    user: Trainer;
    onSave: (updatedUser: Trainer) => void;
    onCancel: () => void;
}

const EditTrainerProfilePage: React.FC<EditTrainerProfilePageProps> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Trainer>(user);
    const [isUploading, setIsUploading] = useState(false);
    const [phoneError, setPhoneError] = useState<string>('');
    const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load auto-saved data on mount
    useEffect(() => {
        const savedData = localStorage.getItem(`trainer-profile-draft-${user.id}`);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(parsed);
                toast({
                    title: "Draft restored",
                    description: "Your previous changes have been restored.",
                });
            } catch (error) {
                console.error('Failed to load draft:', error);
            }
        }
    }, [user.id]);

    // Auto-save to localStorage
    useEffect(() => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        setAutoSaveStatus('saving');
        autoSaveTimeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(`trainer-profile-draft-${user.id}`, JSON.stringify(formData));
                setAutoSaveStatus('saved');
                setTimeout(() => setAutoSaveStatus(null), 2000);
            } catch (error) {
                console.error('Failed to auto-save:', error);
            }
        }, 1000);

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [formData, user.id]);

    const validatePhoneNumber = (phone: string): boolean => {
        if (!phone || phone.trim() === '') {
            setPhoneError('');
            return true; // Optional field
        }

        // Remove all spaces, dashes, and parentheses for validation
        const cleanPhone = phone.replace(/[\s\-()]/g, '');
        
        // Vietnam phone format: +84 followed by 9-10 digits
        const vietnamPhoneRegex = /^\+84[0-9]{9,10}$/;
        
        if (!vietnamPhoneRegex.test(cleanPhone)) {
            setPhoneError('Invalid format. Use: +84 xxx xxx xxx (9-10 digits after +84)');
            return false;
        }
        
        setPhoneError('');
        return true;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['price'].includes(name);
        
        setFormData(prev => ({
            ...prev,
            [name]: isNumeric ? (value === '' ? 0 : parseFloat(value)) : value
        }));

        // Validate phone number on change
        if (name === 'phone') {
            validatePhoneNumber(value);
        }
    };

    const handleToggleSpecialty = (specialty: string) => {
        setFormData(prev => {
            const currentSpecialties = prev.specialty || [];
            const isSelected = currentSpecialties.includes(specialty);
            const maxSelections = 5;

            if (isSelected) {
                return { ...prev, specialty: currentSpecialties.filter(s => s !== specialty) };
            } else if (currentSpecialties.length < maxSelections) {
                return { ...prev, specialty: [...currentSpecialties, specialty] };
            }
            return prev;
        });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                variant: "destructive",
                title: "Invalid file type",
                description: "Please upload an image file.",
            });
            return;
        }

        // Validate file size (max 3MB)
        if (file.size > 3 * 1024 * 1024) {
            toast({
                variant: "destructive",
                title: "File too large",
                description: "Image must be less than 3MB.",
            });
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
            
            toast({
                title: "Image uploaded",
                description: "Profile picture updated successfully.",
            });
        } catch (error) {
            console.error("Failed to upload image:", error);
            toast({
                variant: "destructive",
                title: "Upload failed",
                description: "Failed to upload image. Please try again.",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name?.trim()) {
            toast({
                variant: "destructive",
                title: "Validation error",
                description: "Full name is required.",
            });
            return;
        }

        if (!formData.location) {
            toast({
                variant: "destructive",
                title: "Validation error",
                description: "Location is required.",
            });
            return;
        }

        if (!formData.specialty || formData.specialty.length === 0) {
            toast({
                variant: "destructive",
                title: "Validation error",
                description: "Please select at least one specialty.",
            });
            return;
        }

        if (!formData.price || formData.price <= 0) {
            toast({
                variant: "destructive",
                title: "Validation error",
                description: "Please enter a valid hourly rate.",
            });
            return;
        }

        // Validate phone number if provided
        if (formData.phone && !validatePhoneNumber(formData.phone)) {
            toast({
                variant: "destructive",
                title: "Validation error",
                description: "Please enter a valid Vietnam phone number.",
            });
            return;
        }

        // Clear auto-saved draft on successful save
        localStorage.removeItem(`trainer-profile-draft-${user.id}`);
        onSave(formData);
    };

    const handleCancel = () => {
        // Clear auto-saved draft on cancel
        localStorage.removeItem(`trainer-profile-draft-${user.id}`);
        onCancel();
    };

    return (
        <div className="bg-slate-50 min-h-screen overflow-y-auto scroll-smooth">
            {/* Fixed Header */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
                <div className="flex items-center justify-between p-4">
                    <button 
                        type="button"
                        onClick={handleCancel} 
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <X className="w-5 h-5" />
                        <span className="font-medium">Cancel</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-lg font-bold text-slate-900">Edit Profile</h1>
                        {autoSaveStatus && (
                            <span className="text-xs text-slate-500 animate-fade-in">
                                {autoSaveStatus === 'saving' ? '💾 Saving...' : '✓ Saved'}
                            </span>
                        )}
                    </div>
                    <button 
                        type="button"
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-[#FF6B35] text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-all duration-200 font-semibold shadow-md"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>
            
            <form className="p-4 space-y-4 pb-32" onSubmit={handleSave}>
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-3 py-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                    />
                    <div className="relative">
                        <img 
                            src={formData.imageUrl} 
                            alt={formData.name} 
                            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isUploading}
                            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#FF6B35] text-white flex items-center justify-center shadow-lg hover:bg-orange-600 transition-all duration-200 disabled:opacity-50"
                        >
                            {isUploading ? <Loader className="w-5 h-5 animate-spin"/> : <Camera className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-sm text-slate-600">Tap to change photo</p>
                </div>

                {/* Basic Info */}
                <div id="basic-info" className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/60 space-y-4 scroll-mt-20">
                    <h3 className="font-bold text-slate-900 text-base">Basic Information</h3>
                    
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="name" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            required
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                            placeholder="Enter your full name"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Professional Bio
                        </label>
                        <textarea 
                            id="bio" 
                            name="bio" 
                            value={formData.bio} 
                            onChange={handleChange} 
                            rows={4}
                            placeholder="Share your experience, certifications, and training philosophy..."
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Location <span className="text-red-500">*</span>
                        </label>
                        <select 
                            id="location" 
                            name="location" 
                            value={formData.location} 
                            onChange={handleChange} 
                            required
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select district</option>
                            {HCMC_DISTRICTS.map(district => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Phone Number
                        </label>
                        <input 
                            type="tel" 
                            id="phone" 
                            name="phone" 
                            value={formData.phone || ''} 
                            onChange={handleChange} 
                            placeholder="+84 xxx xxx xxx"
                            className={`w-full px-3 py-2.5 border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                                phoneError 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-slate-300 focus:ring-orange-500'
                            }`}
                        />
                        {phoneError && (
                            <p className="text-xs text-red-500 mt-1.5 flex items-start gap-1">
                                <span className="mt-0.5">⚠️</span>
                                <span>{phoneError}</span>
                            </p>
                        )}
                        {!phoneError && (
                            <p className="text-xs text-slate-500 mt-1.5">Format: +84 followed by 9-10 digits</p>
                        )}
                    </div>
                </div>

                {/* Pricing */}
                <div id="pricing" className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/60 scroll-mt-20">
                    <h3 className="font-bold text-slate-900 text-base mb-3">Pricing</h3>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Hourly Rate (VND) <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="number" 
                            id="price" 
                            name="price" 
                            value={formData.price || ''} 
                            onChange={handleChange} 
                            min="0"
                            step="10000"
                            required
                            placeholder="300000"
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">Your standard rate per hour of training</p>
                    </div>
                </div>
                
                {/* Specialties */}
                <div id="specialties" className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/60 scroll-mt-20">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-900 text-base">
                            Training Specialties <span className="text-red-500">*</span>
                        </h3>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            Max 5
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {FITNESS_ACTIVITIES.map(specialty => {
                            const isSelected = formData.specialty?.includes(specialty);
                            return (
                                <button 
                                    type="button" 
                                    key={specialty} 
                                    onClick={() => handleToggleSpecialty(specialty)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ease-in-out ${
                                        isSelected 
                                            ? 'bg-[#FF6B35] text-white shadow-md' 
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {specialty}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditTrainerProfilePage;
